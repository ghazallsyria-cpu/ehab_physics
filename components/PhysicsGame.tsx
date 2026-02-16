import React, { useState, useEffect, useRef } from 'react';
import { RefreshCw, Play, Target, ArrowRight, Settings2, Info } from 'lucide-react';

const PhysicsGame: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  
  // Physics State
  const [angle, setAngle] = useState(45);
  const [velocity, setVelocity] = useState(60);
  const [gravity, setGravity] = useState(9.8);
  const [isAnimating, setIsAnimating] = useState(false);
  const [targetPos, setTargetPos] = useState({ x: 600, y: 300, w: 60, h: 10 });
  const [score, setScore] = useState(0);
  const [attempts, setAttempts] = useState(0);
  const [message, setMessage] = useState('');
  
  // Visual State
  const [trajectory, setTrajectory] = useState<{x: number, y: number}[]>([]);

  // Constants
  const SCALE = 5; // Pixels per meter
  const GROUND_Y = 550;
  const START_X = 60;
  const START_Y = GROUND_Y - 20;

  useEffect(() => {
    resetTarget();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const handleResize = () => {
      // Logic to resize canvas if needed
  };

  useEffect(() => {
    draw();
  }, [angle, velocity, targetPos, isAnimating, trajectory]);

  const resetTarget = () => {
      setTargetPos({
          x: 400 + Math.random() * 400,
          y: 100 + Math.random() * 300, 
          w: 80,
          h: 15
      });
      setMessage('');
      setTrajectory([]);
  };

  const launch = () => {
      if (isAnimating) return;
      setIsAnimating(true);
      setMessage('');
      setAttempts(a => a + 1);
      setTrajectory([]);
      
      let t = 0;
      const v0x = velocity * Math.cos(angle * Math.PI / 180);
      const v0y = velocity * Math.sin(angle * Math.PI / 180);
      
      const animate = () => {
          t += 0.1;
          const x = START_X + v0x * t * SCALE;
          const y = START_Y - (v0y * t - 0.5 * gravity * t * t) * SCALE;

          setTrajectory(prev => [...prev, {x, y}]);

          // Collision Detection (Target)
          // Simple AABB check
          if (x >= targetPos.x && x <= targetPos.x + targetPos.w && 
              y >= (GROUND_Y - targetPos.y) && y <= (GROUND_Y - targetPos.y) + targetPos.h + 20) {
              setScore(s => s + 100);
              setMessage('🎯 إصابة مباشرة! أحسنت!');
              setIsAnimating(false);
              setTimeout(resetTarget, 2000);
              return;
          }

          // Ground Hit or Out of Bounds
          if (y > GROUND_Y || x > 1000 || y < -500) {
              setIsAnimating(false);
              setMessage('❌ محاولة خاطئة. جرب تعديل الزاوية.');
              return;
          }

          requestAnimationFrame(animate);
      };
      requestAnimationFrame(animate);
  };

  const draw = () => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      // Clear Canvas
      ctx.fillStyle = '#0a1118';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // Draw Grid (Optional)
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.05)';
      ctx.lineWidth = 1;
      for (let i = 0; i < canvas.width; i += 50) { ctx.beginPath(); ctx.moveTo(i, 0); ctx.lineTo(i, canvas.height); ctx.stroke(); }
      for (let i = 0; i < canvas.height; i += 50) { ctx.beginPath(); ctx.moveTo(0, i); ctx.lineTo(canvas.width, i); ctx.stroke(); }

      // Draw Ground
      ctx.fillStyle = '#1e293b';
      ctx.fillRect(0, GROUND_Y, canvas.width, 50);
      ctx.strokeStyle = '#00d2ff';
      ctx.lineWidth = 2;
      ctx.beginPath(); ctx.moveTo(0, GROUND_Y); ctx.lineTo(canvas.width, GROUND_Y); ctx.stroke();

      // Draw Target
      const targetScreenY = GROUND_Y - targetPos.y;
      ctx.fillStyle = '#ef4444';
      ctx.shadowBlur = 15; ctx.shadowColor = '#ef4444';
      ctx.fillRect(targetPos.x, targetScreenY, targetPos.w, targetPos.h);
      ctx.shadowBlur = 0;

      // Draw Trajectory
      if (trajectory.length > 0) {
          ctx.strokeStyle = 'rgba(255, 255, 255, 0.3)';
          ctx.lineWidth = 2;
          ctx.setLineDash([5, 5]);
          ctx.beginPath();
          ctx.moveTo(START_X, START_Y);
          trajectory.forEach(p => ctx.lineTo(p.x, p.y));
          ctx.stroke();
          ctx.setLineDash([]);

          // Draw Projectile
          const currentPos = trajectory[trajectory.length - 1];
          ctx.beginPath();
          ctx.arc(currentPos.x, currentPos.y, 8, 0, Math.PI * 2);
          ctx.fillStyle = '#fbbf24';
          ctx.shadowBlur = 10; ctx.shadowColor = '#fbbf24';
          ctx.fill();
          ctx.shadowBlur = 0;
      }

      // Draw Cannon
      ctx.save();
      ctx.translate(START_X, START_Y);
      ctx.rotate(-angle * Math.PI / 180);
      ctx.fillStyle = '#475569';
      ctx.fillRect(-10, -10, 60, 20); // Barrel
      ctx.fillStyle = '#94a3b8'; 
      ctx.beginPath(); ctx.arc(0, 0, 20, 0, Math.PI*2); ctx.fill(); // Base
      ctx.restore();
  };

  return (
    <div className="max-w-6xl mx-auto py-12 px-6 animate-fadeIn font-['Tajawal'] text-right" dir="rtl">
        <header className="mb-10 flex flex-col md:flex-row justify-between items-end gap-6">
            <div>
                <h2 className="text-4xl font-black text-white italic">محاكي <span className="text-[#fbbf24]">المقذوفات</span></h2>
                <p className="text-gray-500 mt-2 text-lg">طبق معادلات الحركة في بيئة فيزيائية تفاعلية.</p>
            </div>
            <div className="flex gap-4">
                <div className="bg-black/40 border border-white/10 px-6 py-3 rounded-2xl text-center min-w-[100px]">
                    <span className="text-[10px] text-gray-500 font-bold uppercase block">النقاط</span>
                    <span className="text-2xl font-black text-[#fbbf24]">{score}</span>
                </div>
                <div className="bg-black/40 border border-white/10 px-6 py-3 rounded-2xl text-center min-w-[100px]">
                    <span className="text-[10px] text-gray-500 font-bold uppercase block">المحاولات</span>
                    <span className="text-2xl font-black text-white">{attempts}</span>
                </div>
            </div>
        </header>

        <div className="glass-panel p-2 rounded-[40px] border-white/5 bg-black/40 relative overflow-hidden shadow-2xl mb-8">
            <canvas ref={canvasRef} width={1000} height={600} className="w-full h-auto bg-[#0a1118] rounded-[35px]" />
            
            {message && (
                <div className={`absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-20 px-10 py-6 rounded-[30px] border backdrop-blur-xl animate-bounce shadow-2xl ${message.includes('إصابة') ? 'bg-green-500/20 border-green-500/40 text-green-400' : 'bg-red-500/20 border-red-500/40 text-red-400'}`}>
                    <p className="font-black text-2xl">{message}</p>
                </div>
            )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-end">
            <div className="md:col-span-3 bg-white/5 p-6 rounded-[30px] border border-white/5">
                <label className="text-[10px] font-bold text-gray-400 block mb-3 uppercase tracking-widest flex items-center justify-between">
                    زاوية القذف (Angle) <span className="text-[#fbbf24]">{angle}°</span>
                </label>
                <input type="range" min="0" max="90" value={angle} onChange={(e) => setAngle(Number(e.target.value))} className="w-full accent-[#fbbf24] h-2 bg-white/10 rounded-full appearance-none cursor-pointer" />
            </div>
            
            <div className="md:col-span-3 bg-white/5 p-6 rounded-[30px] border border-white/5">
                <label className="text-[10px] font-bold text-gray-400 block mb-3 uppercase tracking-widest flex items-center justify-between">
                    السرعة الابتدائية (Velocity) <span className="text-[#00d2ff]">{velocity} m/s</span>
                </label>
                <input type="range" min="10" max="150" value={velocity} onChange={(e) => setVelocity(Number(e.target.value))} className="w-full accent-[#00d2ff] h-2 bg-white/10 rounded-full appearance-none cursor-pointer" />
            </div>

            <div className="md:col-span-3 bg-white/5 p-6 rounded-[30px] border border-white/5">
                <label className="text-[10px] font-bold text-gray-400 block mb-3 uppercase tracking-widest flex items-center justify-between">
                    الجاذبية (Gravity) <span className="text-purple-400">{gravity} m/s²</span>
                </label>
                <input type="range" min="1" max="20" step="0.1" value={gravity} onChange={(e) => setGravity(Number(e.target.value))} className="w-full accent-purple-400 h-2 bg-white/10 rounded-full appearance-none cursor-pointer" />
            </div>

            <div className="md:col-span-3 flex gap-3">
                <button onClick={launch} disabled={isAnimating} className="flex-1 py-6 bg-green-500 text-black rounded-[25px] font-black text-sm uppercase tracking-widest shadow-xl hover:scale-105 active:scale-95 transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed">
                    {isAnimating ? <RefreshCw className="animate-spin" /> : <Play fill="currentColor" />} إطلاق
                </button>
                <button onClick={resetTarget} className="px-6 bg-white/10 rounded-[25px] text-white hover:bg-white/20 transition-all border border-white/5" title="هدف جديد">
                    <Target />
                </button>
            </div>
        </div>
        
        <div className="mt-8 flex gap-4 overflow-x-auto no-scrollbar pb-2">
            <div className="flex items-center gap-2 bg-white/5 px-4 py-2 rounded-xl border border-white/5 text-[10px] text-gray-400 font-mono">
                <Info size={12}/> المسافة الأفقية: R = (v₀² sin 2θ) / g
            </div>
            <div className="flex items-center gap-2 bg-white/5 px-4 py-2 rounded-xl border border-white/5 text-[10px] text-gray-400 font-mono">
                <Info size={12}/> أقصى ارتفاع: H = (v₀ sin θ)² / 2g
            </div>
        </div>
    </div>
  );
};

export default PhysicsGame;
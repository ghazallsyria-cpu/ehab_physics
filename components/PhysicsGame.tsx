import React, { useState, useEffect, useRef } from 'react';
import { RefreshCw, Play, RotateCcw, Target } from 'lucide-react';

const PhysicsGame: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [angle, setAngle] = useState(45);
  const [velocity, setVelocity] = useState(50);
  const [isAnimating, setIsAnimating] = useState(false);
  const [targetPos, setTargetPos] = useState({ x: 600, y: 300, w: 50, h: 50 });
  const [score, setScore] = useState(0);
  const [message, setMessage] = useState('');

  // Game Constants
  const g = 9.8;
  const scale = 5; // Pixels per meter

  useEffect(() => {
    resetTarget();
  }, []);

  useEffect(() => {
    draw();
  }, [angle, velocity, targetPos, isAnimating]);

  const resetTarget = () => {
      setTargetPos({
          x: 400 + Math.random() * 400,
          y: 200 + Math.random() * 200, // Ground is lower y
          w: 60,
          h: 10
      });
      setMessage('');
  };

  const launch = () => {
      if (isAnimating) return;
      setIsAnimating(true);
      setMessage('');
      
      let t = 0;
      const v0x = velocity * Math.cos(angle * Math.PI / 180);
      const v0y = velocity * Math.sin(angle * Math.PI / 180);
      const startX = 50;
      const startY = 550; // Canvas height - 50

      const animate = () => {
          t += 0.1;
          const x = startX + v0x * t * scale;
          const y = startY - (v0y * t - 0.5 * g * t * t) * scale;

          draw(x, y);

          // Collision Detection (Simple AABB)
          if (x >= targetPos.x && x <= targetPos.x + targetPos.w && y >= (550 - targetPos.y) && y <= (550 - targetPos.y) + 20) {
              setScore(s => s + 100);
              setMessage('إصابة مباشرة! 🎉');
              setIsAnimating(false);
              setTimeout(resetTarget, 2000);
              return;
          }

          // Ground Hit
          if (y > 550) {
              setIsAnimating(false);
              setMessage('محاولة خاطئة. جرب زاوية أخرى.');
              return;
          }
          
          // Out of bounds
          if (x > 900 || y < 0) {
              setIsAnimating(false);
              setMessage('خرجت عن النطاق.');
              return;
          }

          requestAnimationFrame(animate);
      };
      requestAnimationFrame(animate);
  };

  const draw = (ballX = 50, ballY = 550) => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      // Clear
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      // Draw Ground
      ctx.fillStyle = '#222';
      ctx.fillRect(0, 560, canvas.width, 40);

      // Draw Cannon
      ctx.save();
      ctx.translate(50, 550);
      ctx.rotate(-angle * Math.PI / 180);
      ctx.fillStyle = '#fbbf24';
      ctx.fillRect(0, -10, 60, 20);
      ctx.restore();

      // Draw Ball
      ctx.beginPath();
      ctx.arc(ballX, ballY, 8, 0, Math.PI * 2);
      ctx.fillStyle = '#fff';
      ctx.fill();

      // Draw Target (Platform)
      ctx.fillStyle = '#ef4444';
      ctx.fillRect(targetPos.x, 560 - targetPos.y, targetPos.w, 10);
      ctx.fillStyle = 'rgba(239, 68, 68, 0.3)';
      ctx.beginPath();
      ctx.arc(targetPos.x + targetPos.w/2, 560 - targetPos.y, 30, 0, Math.PI*2);
      ctx.fill();
  };

  return (
    <div className="max-w-5xl mx-auto py-12 px-6 animate-fadeIn font-['Tajawal'] text-right" dir="rtl">
        <header className="mb-10 text-center">
            <h2 className="text-4xl font-black text-white italic">محاكي <span className="text-[#fbbf24]">المقذوفات</span></h2>
            <p className="text-gray-500 mt-2">اضبط الزاوية والسرعة لإصابة الهدف. تطبيق عملي لمعادلات الحركة.</p>
        </header>

        <div className="glass-panel p-4 rounded-[40px] border-white/5 bg-black/40 relative overflow-hidden">
            <div className="absolute top-6 right-6 z-10 bg-black/60 px-6 py-3 rounded-2xl border border-white/10 text-white font-black text-xl">
                النقاط: <span className="text-[#fbbf24]">{score}</span>
            </div>
            {message && (
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-20 bg-black/80 backdrop-blur-md px-8 py-6 rounded-3xl border border-[#fbbf24]/50 text-white font-black text-2xl animate-bounce">
                    {message}
                </div>
            )}
            <canvas ref={canvasRef} width={900} height={600} className="w-full h-auto bg-gradient-to-b from-[#0a1118] to-[#1a202c] rounded-[30px]" />
        </div>

        <div className="mt-8 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 items-end">
            <div className="bg-white/5 p-6 rounded-[30px] border border-white/5">
                <label className="text-xs font-bold text-gray-400 block mb-2">زاوية القذف (Angle)</label>
                <div className="flex items-center gap-4">
                    <input type="range" min="0" max="90" value={angle} onChange={(e) => setAngle(Number(e.target.value))} className="flex-1 accent-[#fbbf24]" />
                    <span className="text-xl font-black text-[#fbbf24] w-12 text-center">{angle}°</span>
                </div>
            </div>
            <div className="bg-white/5 p-6 rounded-[30px] border border-white/5">
                <label className="text-xs font-bold text-gray-400 block mb-2">السرعة الابتدائية (Velocity)</label>
                <div className="flex items-center gap-4">
                    <input type="range" min="10" max="100" value={velocity} onChange={(e) => setVelocity(Number(e.target.value))} className="flex-1 accent-[#00d2ff]" />
                    <span className="text-xl font-black text-[#00d2ff] w-12 text-center">{velocity}</span>
                </div>
            </div>
            <div className="flex gap-4">
                <button onClick={launch} disabled={isAnimating} className="flex-1 py-5 bg-green-500 text-black rounded-[25px] font-black text-sm uppercase tracking-widest shadow-xl hover:scale-105 active:scale-95 transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed">
                    {isAnimating ? <RefreshCw className="animate-spin" /> : <Play fill="currentColor" />} إطلاق
                </button>
                <button onClick={resetTarget} className="px-6 bg-white/10 rounded-[25px] text-white hover:bg-white/20 transition-all">
                    <Target />
                </button>
            </div>
        </div>
    </div>
  );
};

export default PhysicsGame;
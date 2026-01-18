
import React, { useState, useEffect, useRef } from 'react';

const PhysicsGame: React.FC = () => {
  const [gameState, setGameState] = useState<'start' | 'playing' | 'gameover'>('start');
  const [score, setScore] = useState(0);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const requestRef = useRef<number | null>(null);

  // Simple "Newton's Apple" game logic
  const applesRef = useRef<{x: number, y: number, speed: number, size: number}[]>([]);
  const basketRef = useRef({x: 500, width: 100});

  useEffect(() => {
    if (gameState !== 'playing') {
      if (requestRef.current) {
        cancelAnimationFrame(requestRef.current);
        requestRef.current = null;
      }
      return;
    }

    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const animate = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      // Draw Basket
      ctx.fillStyle = '#00d2ff';
      ctx.shadowBlur = 20;
      ctx.shadowColor = '#00d2ff';
      ctx.fillRect(basketRef.current.x - basketRef.current.width/2, canvas.height - 40, basketRef.current.width, 20);
      ctx.shadowBlur = 0;

      // Update & Draw Apples
      if (Math.random() < 0.02) {
        applesRef.current.push({
          x: Math.random() * canvas.width,
          y: -50,
          speed: 3 + Math.random() * 3 + (score / 100), // Speed increases with score
          size: 15 + Math.random() * 10
        });
      }

      for (let i = applesRef.current.length - 1; i >= 0; i--) {
        const apple = applesRef.current[i];
        apple.y += apple.speed;
        
        // Draw Apple
        ctx.fillStyle = '#ff3b3b';
        ctx.beginPath();
        ctx.arc(apple.x, apple.y, apple.size, 0, Math.PI * 2);
        ctx.fill();

        // Check Collision with basket
        if (apple.y > canvas.height - 50 && 
            Math.abs(apple.x - basketRef.current.x) < basketRef.current.width/2) {
          setScore(prev => prev + 10);
          applesRef.current.splice(i, 1);
        } else if (apple.y > canvas.height) {
          // Game over condition
          setGameState('gameover');
        }
      }

      requestRef.current = requestAnimationFrame(animate);
    };

    requestRef.current = requestAnimationFrame(animate);
    
    return () => {
      if (requestRef.current) {
        cancelAnimationFrame(requestRef.current);
      }
    };
  }, [gameState, score]);
  
  const handleRestart = () => {
    setScore(0);
    applesRef.current = [];
    setGameState('playing');
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (gameState !== 'playing') return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    basketRef.current.x = x;
  };

  return (
    <div className="max-w-5xl mx-auto py-12 px-6 animate-fadeIn">
      <div className="glass-panel p-12 rounded-[60px] border-[#00d2ff]/20 text-center relative overflow-hidden">
        <div className="mb-12">
          <h2 className="text-4xl font-black mb-4 uppercase tracking-tighter">تحدي <span className="text-[#00d2ff]">الجاذبية</span></h2>
          <p className="text-gray-500">اجمع التفاح المتساقط بفعل الجاذبية لتفهم تسارع السقوط الحر.</p>
        </div>

        <div className="relative aspect-video bg-black/40 rounded-[40px] border border-white/5 overflow-hidden cursor-none" onMouseMove={handleMouseMove}>
          {gameState === 'start' && (
            <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/60 backdrop-blur-md z-10">
               <span className="text-8xl mb-8">🍎</span>
               <button onClick={() => setGameState('playing')} className="bg-[#00d2ff] text-black px-12 py-5 rounded-3xl font-black uppercase tracking-widest shadow-2xl hover:scale-105 transition-all">ابدأ التحدي</button>
            </div>
          )}

          {gameState === 'gameover' && (
            <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/80 backdrop-blur-lg z-10 animate-fadeIn">
               <span className="text-8xl mb-4">💥</span>
               <h3 className="text-5xl font-black text-white mb-2">Game Over</h3>
               <p className="text-xl text-[#fbbf24] font-bold mb-8">Final Score: {score}</p>
               <button onClick={handleRestart} className="bg-[#fbbf24] text-black px-12 py-5 rounded-3xl font-black uppercase tracking-widest shadow-2xl hover:scale-105 transition-all">إعادة المحاولة</button>
            </div>
          )}
          
          <canvas ref={canvasRef} width={1000} height={600} className="w-full h-full" />
          
          <div className="absolute top-8 left-8 bg-black/60 px-6 py-2 rounded-2xl border border-white/10 backdrop-blur-md">
             <span className="text-[10px] font-black text-[#00d2ff] uppercase tracking-widest">Score: {score}</span>
          </div>
        </div>

        <div className="mt-12 flex justify-center gap-12">
           <div className="text-right">
              <p className="text-[8px] font-black text-gray-500 uppercase tracking-widest mb-1">Concept</p>
              <p className="text-sm font-bold text-white">Gravity & Acceleration</p>
           </div>
           <div className="text-right">
              <p className="text-[8px] font-black text-gray-500 uppercase tracking-widest mb-1">Level</p>
              <p className="text-sm font-bold text-white">Physics Basics</p>
           </div>
        </div>
      </div>
    </div>
  );
};

export default PhysicsGame;

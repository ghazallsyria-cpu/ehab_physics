
import React, { useRef, useEffect, useState } from 'react';

const SimulationCenter: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [voltage, setVoltage] = useState(5);
  const [resistance, setResistance] = useState(10);
  
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let frame = 0;
    const render = () => {
      frame++;
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      
      const current = voltage / resistance;
      const electronCount = Math.floor(current * 20);
      
      // Draw Circuit
      ctx.strokeStyle = '#334155';
      ctx.lineWidth = 10;
      ctx.strokeRect(100, 100, 600, 300);
      
      // Draw Battery
      ctx.fillStyle = '#fbbf24';
      ctx.fillRect(80, 200, 40, 100);
      ctx.fillStyle = '#fff';
      ctx.font = 'bold 20px Tajawal';
      ctx.fillText(`${voltage}V`, 75, 180);

      // Draw Resistance (Zigzag)
      ctx.strokeStyle = '#ef4444';
      ctx.lineWidth = 4;
      ctx.beginPath();
      ctx.moveTo(350, 400);
      for(let i=0; i<10; i++) {
        ctx.lineTo(360 + i*10, 380 + (i%2)*40);
      }
      ctx.stroke();
      ctx.fillStyle = '#fff';
      ctx.fillText(`${resistance}Ω`, 380, 460);

      // Draw Electrons
      ctx.fillStyle = '#00d2ff';
      for(let i=0; i<electronCount; i++) {
        const offset = (frame * current + i * 20) % 1800;
        let x = 0, y = 0;
        
        if (offset < 600) { x = 100 + offset; y = 100; }
        else if (offset < 900) { x = 700; y = 100 + (offset - 600); }
        else if (offset < 1500) { x = 700 - (offset - 900); y = 400; }
        else { x = 100; y = 400 - (offset - 1500); }
        
        ctx.beginPath();
        ctx.arc(x, y, 4, 0, Math.PI * 2);
        ctx.fill();
      }

      ctx.fillStyle = '#fbbf24';
      ctx.font = '30px Tajawal';
      ctx.fillText(`التيار (I) = ${current.toFixed(2)}A`, 300, 250);

      requestAnimationFrame(render);
    };

    const animId = requestAnimationFrame(render);
    return () => cancelAnimationFrame(animId);
  }, [voltage, resistance]);

  return (
    <div className="space-y-8 animate-fadeIn">
      <div className="glass-panel p-8 rounded-[40px]">
        <h2 className="text-3xl font-black mb-6 text-glow-cyan italic">مختبر قانون أوم التفاعلي ⚡</h2>
        <div className="flex flex-col lg:flex-row gap-12">
          <div className="flex-1 bg-black/40 rounded-[30px] p-4 border border-white/5">
            <canvas ref={canvasRef} width={800} height={500} className="w-full h-auto" />
          </div>
          <div className="w-full lg:w-80 space-y-10">
            <div className="space-y-4">
              <label className="text-xs font-black text-gray-500 uppercase tracking-widest">الجهد الكهربائي (Voltage)</label>
              <input 
                type="range" min="1" max="20" value={voltage} 
                onChange={(e) => setVoltage(Number(e.target.value))}
                className="w-full h-2 bg-white/10 rounded-full appearance-none accent-[#fbbf24]"
              />
              <div className="text-2xl font-black text-[#fbbf24]">{voltage} V</div>
            </div>
            <div className="space-y-4">
              <label className="text-xs font-black text-gray-500 uppercase tracking-widest">المقاومة (Resistance)</label>
              <input 
                type="range" min="1" max="100" value={resistance} 
                onChange={(e) => setResistance(Number(e.target.value))}
                className="w-full h-2 bg-white/10 rounded-full appearance-none accent-[#ef4444]"
              />
              <div className="text-2xl font-black text-[#ef4444]">{resistance} Ω</div>
            </div>
            <div className="p-6 bg-[#fbbf24]/10 rounded-3xl border border-[#fbbf24]/20">
               <p className="text-sm text-gray-400 leading-relaxed italic">
                 "لاحظ كيف يقل تدفق الإلكترونات عند زيادة المقاومة. هذا هو جوهر العلاقة العكسية في قانون أوم."
               </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SimulationCenter;

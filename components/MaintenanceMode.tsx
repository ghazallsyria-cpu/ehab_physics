
import React, { useEffect, useState, useRef } from 'react';
import anime from 'animejs';
import { MaintenanceSettings } from '../types';
import { Clock, Hammer, ShieldAlert, Sparkles, RefreshCw } from 'lucide-react';

interface MaintenanceModeProps {
  settings: MaintenanceSettings;
}

const MaintenanceMode: React.FC<MaintenanceModeProps> = ({ settings }) => {
  const [timeLeft, setTimeLeft] = useState<{ d: number, h: number, m: number, s: number }>({ d: 0, h: 0, m: 0, s: 0 });
  const orbitRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // أنيميشن المدارات الفيزيائية
    const orbitTl = anime.timeline({
      loop: true,
      easing: 'linear'
    });

    orbitTl.add({
      targets: '.electron',
      rotate: '360deg',
      duration: 10000,
    });

    // العداد التنازلي
    const timer = setInterval(() => {
      const target = new Date(settings.expectedReturnTime).getTime();
      const now = new Date().getTime();
      const diff = target - now;

      if (diff > 0) {
        setTimeLeft({
          d: Math.floor(diff / (1000 * 60 * 60 * 24)),
          h: Math.floor((diff / (1000 * 60 * 60)) % 24),
          m: Math.floor((diff / 1000 / 60) % 60),
          s: Math.floor((diff / 1000) % 60)
        });
      } else {
        clearInterval(timer);
      }
    }, 1000);

    // تأثير الجزيئات المتساقطة
    const particles = document.querySelector('.maintenance-particles');
    if (particles) {
        for (let i = 0; i < 30; i++) {
            const p = document.createElement('div');
            p.className = 'absolute w-1 h-1 bg-blue-400 rounded-full opacity-20';
            p.style.left = Math.random() * 100 + 'vw';
            p.style.top = Math.random() * 100 + 'vh';
            particles.appendChild(p);
            anime({
                targets: p,
                translateY: [0, 200],
                opacity: [0.2, 0],
                duration: 2000 + Math.random() * 3000,
                loop: true,
                easing: 'easeInOutQuad',
                delay: Math.random() * 2000
            });
        }
    }

    return () => {
        clearInterval(timer);
    };
  }, [settings.expectedReturnTime]);

  const TimeBlock = ({ value, label }: { value: number, label: string }) => (
    <div className="flex flex-col items-center">
        <div className="w-20 h-24 md:w-28 md:h-32 bg-black/40 border-2 border-blue-500/20 rounded-[30px] flex items-center justify-center relative overflow-hidden group">
            <div className="absolute inset-0 bg-blue-500/5 group-hover:bg-blue-500/10 transition-colors"></div>
            <span className="text-4xl md:text-6xl font-black text-white tabular-nums relative z-10">{String(value).padStart(2, '0')}</span>
        </div>
        <span className="text-[10px] font-black text-gray-500 uppercase tracking-[0.3em] mt-4">{label}</span>
    </div>
  );

  return (
    <div className="fixed inset-0 z-[9999] bg-[#010304] flex flex-col items-center justify-center font-['Tajawal'] text-white overflow-hidden text-right" dir="rtl">
      <div className="maintenance-particles absolute inset-0 pointer-events-none opacity-30"></div>

      {/* المدار الذري المتحرك */}
      <div className="absolute w-[800px] h-[800px] opacity-10 pointer-events-none">
          <div className="absolute inset-0 border-2 border-blue-400 rounded-full border-dashed opacity-40"></div>
          <div className="absolute inset-20 border border-blue-400 rounded-full border-dashed opacity-20"></div>
          <div className="electron absolute top-0 left-1/2 -translate-x-1/2 w-4 h-4 bg-blue-400 rounded-full blur-sm"></div>
      </div>

      <div className="relative z-10 max-w-4xl w-full px-6 text-center flex flex-col items-center">
        <div className="w-24 h-24 bg-amber-500/10 border-2 border-amber-500/20 rounded-[40px] flex items-center justify-center text-amber-500 mb-10 animate-float shadow-[0_0_50px_rgba(245,158,11,0.2)]">
            <Hammer size={48} />
        </div>

        <h1 className="text-5xl md:text-8xl font-black text-white tracking-tighter leading-none mb-6 italic">
            قيد <span className="text-blue-400">التطوير</span>
        </h1>
        
        <p className="text-xl md:text-2xl text-gray-400 max-w-2xl mx-auto leading-relaxed mb-16 font-medium">
            {settings.maintenanceMessage}
        </p>

        {settings.showCountdown && (
            <div className="flex gap-4 md:gap-8 mb-20 animate-slideUp">
                <TimeBlock value={timeLeft.d} label="أيام" />
                <TimeBlock value={timeLeft.h} label="ساعات" />
                <TimeBlock value={timeLeft.m} label="دقائق" />
                <TimeBlock value={timeLeft.s} label="ثواني" />
            </div>
        )}

        <div className="flex flex-col items-center gap-6">
            <div className="flex items-center gap-3 bg-white/5 px-8 py-4 rounded-2xl border border-white/5">
                <Sparkles className="text-blue-400 animate-pulse" size={20}/>
                <span className="text-sm font-bold text-gray-300">العودة المتوقعة: {new Date(settings.expectedReturnTime).toLocaleDateString('ar-KW')}</span>
            </div>
            <button onClick={() => window.location.reload()} className="flex items-center gap-3 text-gray-600 hover:text-white transition-all text-xs font-black uppercase tracking-widest">
                <RefreshCw size={14}/> تحديث الصفحة يدوياً
            </button>
        </div>
      </div>

      <footer className="absolute bottom-10 text-[9px] font-black text-gray-800 uppercase tracking-[0.6em]">
        Syrian Science Center • Kuwait Node
      </footer>
    </div>
  );
};

export default MaintenanceMode;

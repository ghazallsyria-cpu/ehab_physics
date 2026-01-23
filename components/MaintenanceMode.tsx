
import React, { useEffect, useState, useRef } from 'react';
import anime from 'animejs';
import { MaintenanceSettings, AppBranding } from '../types';
import { Clock, Hammer, ShieldAlert, Sparkles, RefreshCw, Zap, Atom, Lock } from 'lucide-react';
import { dbService } from '../services/db';

const MaintenanceMode: React.FC = () => {
  const [settings, setSettings] = useState<MaintenanceSettings | null>(null);
  const [branding, setBranding] = useState<AppBranding | null>(null);
  const [timeLeft, setTimeLeft] = useState<{ d: number, h: number, m: number, s: number }>({ d: 0, h: 0, m: 0, s: 0 });
  const [clickCount, setClickCount] = useState(0);
  const [showSecretButton, setShowSecretButton] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const unsubscribeMaintenance = dbService.subscribeToMaintenance((data) => setSettings(data));
    dbService.getAppBranding().then(setBranding);

    const createParticles = () => {
        if (!containerRef.current) return;
        const container = containerRef.current;
        for (let i = 0; i < 40; i++) {
            const dot = document.createElement('div');
            dot.className = 'maintenance-dot absolute bg-blue-400/20 rounded-full pointer-events-none';
            const size = Math.random() * 4 + 1;
            dot.style.width = `${size}px`;
            dot.style.height = `${size}px`;
            dot.style.left = `${Math.random() * 100}%`;
            dot.style.top = `${Math.random() * 100}%`;
            container.appendChild(dot);
            
            anime({
                targets: dot,
                translateY: [0, anime.random(-200, 200)],
                translateX: [0, anime.random(-200, 200)],
                opacity: [0.2, 0.8, 0.2],
                scale: [1, 2, 1],
                duration: anime.random(4000, 10000),
                loop: true,
                easing: 'easeInOutQuad',
                delay: anime.random(0, 2000)
            });
        }
    };
    createParticles();

    anime({
        targets: '.orbit-electron',
        rotate: '360deg',
        duration: 12000,
        loop: true,
        easing: 'linear'
    });

    return () => unsubscribeMaintenance();
  }, []);

  useEffect(() => {
    if (!settings?.expectedReturnTime) return;

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

    return () => clearInterval(timer);
  }, [settings?.expectedReturnTime]);

  const handleLogoClick = () => {
      const newCount = clickCount + 1;
      setClickCount(newCount);
      if (newCount >= 5) {
          setShowSecretButton(true);
          // اهتزاز بسيط للتأكيد للمدير
          anime({
              targets: '.maintenance-logo',
              translateX: [-2, 2, -2, 2, 0],
              duration: 200,
              easing: 'linear'
          });
      }
  };

  const goToLogin = () => {
      // إرسال حدث لتغيير الواجهة إلى صفحة تسجيل الدخول
      window.dispatchEvent(new CustomEvent('change-view', { detail: { view: 'auth' } }));
  };

  const TimeBlock = ({ value, label }: { value: number, label: string }) => (
    <div className="flex flex-col items-center group">
        <div className="w-20 h-24 md:w-28 md:h-32 bg-white/[0.03] border-2 border-blue-500/20 rounded-[35px] flex items-center justify-center relative overflow-hidden backdrop-blur-3xl shadow-2xl transition-all group-hover:border-blue-400/50">
            <div className="absolute inset-0 bg-gradient-to-t from-blue-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
            <span className="text-4xl md:text-6xl font-black text-white tabular-nums relative z-10 drop-shadow-lg">{String(value).padStart(2, '0')}</span>
        </div>
        <span className="text-[10px] font-black text-gray-500 uppercase tracking-[0.4em] mt-5 italic">{label}</span>
    </div>
  );

  if (!settings) return null;

  return (
    <div ref={containerRef} className="fixed inset-0 z-[9999] bg-[#010304] flex flex-col items-center justify-center font-['Tajawal'] text-white overflow-hidden text-right" dir="rtl">
      
      {/* المدارات الذرية الخلفية */}
      <div className="absolute w-[900px] h-[900px] opacity-10 pointer-events-none animate-pulse">
          <div className="absolute inset-0 border-2 border-blue-400/40 rounded-full border-dashed"></div>
          <div className="absolute inset-24 border border-blue-400/20 rounded-full border-dashed"></div>
          <div className="absolute inset-48 border-2 border-blue-400/10 rounded-full border-dashed"></div>
          <div className="orbit-electron absolute top-[-10px] left-1/2 -translate-x-1/2 w-5 h-5 bg-blue-400 rounded-full blur-[2px] shadow-[0_0_20px_#60a5fa]"></div>
          <div className="orbit-electron absolute bottom-[-10px] left-1/2 -translate-x-1/2 w-3 h-3 bg-cyan-400 rounded-full blur-[1px] shadow-[0_0_15px_#22d3ee]" style={{animationDelay: '-2s'}}></div>
      </div>

      <div className="relative z-10 max-w-4xl w-full px-8 text-center flex flex-col items-center">
        <div 
            onClick={handleLogoClick}
            className="maintenance-logo w-32 h-32 md:w-40 md:h-40 bg-white/[0.02] border-2 border-white/5 rounded-[50px] flex items-center justify-center mb-12 shadow-[0_0_60px_rgba(255,255,255,0.02)] relative group overflow-hidden cursor-default active:scale-95 transition-transform"
        >
            <div className="absolute inset-0 bg-blue-500/10 opacity-0 group-hover:opacity-100 transition-opacity"></div>
            {branding?.logoUrl ? (
                <img src={branding.logoUrl} className="w-3/4 h-3/4 object-contain animate-float" alt="Logo" />
            ) : (
                <Atom size={64} className="text-blue-400 animate-spin-slow" />
            )}
        </div>

        <h1 className="text-5xl md:text-8xl font-black text-white tracking-tighter leading-none mb-6 italic animate-fadeIn">
            نعمل على <span className="text-blue-400 drop-shadow-[0_0_20px_rgba(59,130,246,0.3)]">التطوير</span>
        </h1>
        
        <p className="text-xl md:text-2xl text-gray-400 max-w-2xl mx-auto leading-relaxed mb-16 font-medium italic opacity-80">
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

        <div className="flex flex-col items-center gap-8">
            <div className="flex items-center gap-4 bg-white/5 px-10 py-5 rounded-[25px] border border-white/5 shadow-inner">
                <Sparkles className="text-blue-400 animate-pulse" size={24}/>
                <span className="text-sm font-black text-gray-200 tracking-widest uppercase">
                    موعد الافتتاح: {new Date(settings.expectedReturnTime).toLocaleDateString('ar-KW', { day: 'numeric', month: 'long', hour: '2-digit', minute: '2-digit' })}
                </span>
            </div>
            
            <div className="flex gap-4">
                <button onClick={() => window.location.reload()} className="flex items-center gap-3 text-gray-500 hover:text-white transition-all text-[10px] font-black uppercase tracking-[0.3em] bg-white/5 px-6 py-3 rounded-xl border border-white/5">
                    <RefreshCw size={14}/> تحديث الصفحة
                </button>
                
                {/* زر الدخول المخفي للمدير */}
                {showSecretButton && (
                    <button 
                        onClick={goToLogin}
                        className="flex items-center gap-3 text-amber-400 hover:text-white transition-all text-[10px] font-black uppercase tracking-[0.3em] bg-amber-400/10 px-6 py-3 rounded-xl border border-amber-400/20 animate-slideUp"
                    >
                        <Lock size={14}/> دخول الإدارة
                    </button>
                )}
            </div>
        </div>
      </div>

      <footer className="absolute bottom-10 flex flex-col items-center gap-4 opacity-30">
        <div className="flex gap-6">
            <Zap size={14}/> <Atom size={14}/> <Hammer size={14}/>
        </div>
        <p className="text-[9px] font-black uppercase tracking-[0.6em]">Syrian Science Center • Quantum Node 5C</p>
      </footer>
    </div>
  );
};

export default MaintenanceMode;

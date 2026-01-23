
import React, { useEffect, useState, useRef } from 'react';
import anime from 'animejs';
import { MaintenanceSettings, AppBranding } from '../types';
import { RefreshCw, Atom, Lock, ShieldCheck, Sparkles, Zap, Timer } from 'lucide-react';
import { dbService } from '../services/db';

const MaintenanceMode: React.FC = () => {
  const [settings, setSettings] = useState<MaintenanceSettings | null>(null);
  const [branding, setBranding] = useState<AppBranding | null>(null);
  const [timeLeft, setTimeLeft] = useState({ d: 0, h: 0, m: 0, s: 0 });
  const [clickCount, setClickCount] = useState(0);
  const [showSecretButton, setShowSecretButton] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const [isOpening, setIsOpening] = useState(false);

  useEffect(() => {
    const unsubscribeMaintenance = dbService.subscribeToMaintenance((data) => {
        setSettings(data);
        // إذا قام المدير بإغلاق وضع الصيانة من لوحة التحكم، نفتح المنصة فوراً
        if (data && !data.isMaintenanceActive) {
            handleAutoOpen();
        }
    });
    dbService.getAppBranding().then(setBranding);

    if (sessionStorage.getItem('ssc_admin_bypass') === 'true') {
        setShowSecretButton(true);
    }

    // أنيميشن الخلفية (جزيئات تطفو)
    const createParticles = () => {
        if (!containerRef.current) return;
        for (let i = 0; i < 30; i++) {
            const dot = document.createElement('div');
            dot.className = 'absolute bg-blue-500/10 rounded-full pointer-events-none';
            const size = Math.random() * 5 + 2;
            dot.style.width = `${size}px`;
            dot.style.height = `${size}px`;
            dot.style.left = `${Math.random() * 100}%`;
            dot.style.top = `${Math.random() * 100}%`;
            containerRef.current.appendChild(dot);
            
            anime({
                targets: dot,
                translateY: [0, anime.random(-300, 300)],
                translateX: [0, anime.random(-300, 300)],
                opacity: [0, 0.5, 0],
                duration: anime.random(5000, 15000),
                loop: true,
                easing: 'easeInOutQuad'
            });
        }
    };
    createParticles();

    return () => unsubscribeMaintenance();
  }, []);

  useEffect(() => {
    if (!settings?.expectedReturnTime || !settings.isMaintenanceActive) return;

    const timer = setInterval(() => {
      const target = new Date(settings.expectedReturnTime).getTime();
      const now = new Date().getTime();
      const diff = target - now;

      if (diff <= 0) {
        clearInterval(timer);
        handleAutoOpen(); // الفتح التلقائي عند انتهاء الوقت
      } else {
        setTimeLeft({
          d: Math.floor(diff / (1000 * 60 * 60 * 24)),
          h: Math.floor((diff / (1000 * 60 * 60)) % 24),
          m: Math.floor((diff / 1000 / 60) % 60),
          s: Math.floor((diff / 1000) % 60)
        });
      }
    }, 1000);

    return () => clearInterval(timer);
  }, [settings?.expectedReturnTime, settings?.isMaintenanceActive]);

  const handleAutoOpen = () => {
      if (isOpening) return;
      setIsOpening(true);
      
      // تأثير بصري "الانفجار الضوئي" عند الافتتاح
      anime({
          targets: '.opening-flash',
          opacity: [0, 1, 0],
          duration: 1500,
          easing: 'easeOutExpo',
          complete: () => {
              window.location.reload(); // إعادة تحميل لتحديث حالة التطبيق بالكامل
          }
      });
  };

  // Add missing goToLogin function to handle the secret admin bypass
  const goToLogin = () => {
      handleAutoOpen();
  };

  const handleLogoClick = (e: React.MouseEvent) => {
      const newCount = clickCount + 1;
      setClickCount(newCount);
      
      // تأثير "موجة رادارية" عند النقر
      const ripple = document.createElement('div');
      ripple.className = 'absolute rounded-full border-2 border-blue-400/50 pointer-events-none';
      ripple.style.left = `${e.nativeEvent.offsetX}px`;
      ripple.style.top = `${e.nativeEvent.offsetY}px`;
      ripple.style.width = '10px';
      ripple.style.height = '10px';
      (e.currentTarget as HTMLElement).appendChild(ripple);

      anime({
          targets: ripple,
          width: 200,
          height: 200,
          left: e.nativeEvent.offsetX - 100,
          top: e.nativeEvent.offsetY - 100,
          opacity: 0,
          duration: 800,
          easing: 'easeOutQuart',
          complete: () => ripple.remove()
      });

      if (newCount >= 5) {
          sessionStorage.setItem('ssc_admin_bypass', 'true');
          setShowSecretButton(true);
          anime({
              targets: '.maintenance-logo',
              scale: [1, 1.2, 1],
              rotate: '360deg',
              duration: 1000
          });
      }
  };

  const TimeBlock = ({ value, label, color }: { value: number, label: string, color: string }) => (
    <div className="flex flex-col items-center">
        <div className={`w-20 h-24 md:w-28 md:h-32 bg-white/[0.02] border-2 border-${color}-500/20 rounded-[30px] flex items-center justify-center relative overflow-hidden backdrop-blur-xl shadow-2xl transition-all hover:border-${color}-400/50 group`}>
            <div className={`absolute inset-0 bg-gradient-to-t from-${color}-500/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity`}></div>
            <span className={`text-4xl md:text-6xl font-black text-white tabular-nums z-10 drop-shadow-[0_0_15px_rgba(255,255,255,0.3)]`}>
                {String(value).padStart(2, '0')}
            </span>
        </div>
        <span className="text-[9px] font-black text-gray-500 uppercase tracking-[0.3em] mt-4 italic">{label}</span>
    </div>
  );

  if (!settings) return null;

  return (
    <div ref={containerRef} className="fixed inset-0 z-[9999] bg-[#010304] flex flex-col items-center justify-center font-['Tajawal'] text-white overflow-hidden text-right" dir="rtl">
      
      {/* طبقة الوميض عند الافتتاح */}
      <div className="opening-flash fixed inset-0 bg-white z-[10000] opacity-0 pointer-events-none"></div>

      {/* المدارات الفيزيائية الخلفية */}
      <div className="absolute w-[800px] h-[800px] opacity-20 pointer-events-none">
          <div className="absolute inset-0 border border-blue-500/20 rounded-full animate-spin-slow"></div>
          <div className="absolute inset-20 border border-cyan-500/10 rounded-full animate-spin-slow-reverse"></div>
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-4 h-4 bg-blue-400 rounded-full blur-sm"></div>
      </div>

      <div className="relative z-10 max-w-4xl w-full px-8 text-center flex flex-col items-center">
        <div 
            onClick={handleLogoClick}
            className="maintenance-logo w-32 h-32 md:w-40 md:h-40 bg-white/[0.03] border-2 border-white/10 rounded-[50px] flex items-center justify-center mb-10 shadow-[0_0_60px_rgba(255,255,255,0.03)] relative group overflow-hidden cursor-pointer transition-all active:scale-90"
        >
            <div className="absolute inset-0 bg-blue-500/5 opacity-0 group-hover:opacity-100 transition-opacity"></div>
            {branding?.logoUrl ? (
                <img src={branding.logoUrl} className="w-3/4 h-3/4 object-contain pointer-events-none" alt="Logo" />
            ) : (
                <Atom size={64} className="text-blue-400 animate-spin-slow pointer-events-none" />
            )}
        </div>

        <div className="space-y-4 mb-16">
            <h1 className="text-5xl md:text-8xl font-black text-white tracking-tighter leading-none italic">
                نحن في حالة <span className="text-blue-400 text-glow-cyan">تحديث</span>
            </h1>
            <p className="text-lg md:text-xl text-gray-500 max-w-xl mx-auto leading-relaxed font-medium italic">
                {settings.maintenanceMessage}
            </p>
        </div>

        {settings.showCountdown && (
            <div className="flex gap-4 md:gap-8 mb-20 animate-slideUp">
                <TimeBlock value={timeLeft.d} label="أيام" color="blue" />
                <TimeBlock value={timeLeft.h} label="ساعات" color="cyan" />
                <TimeBlock value={timeLeft.m} label="دقائق" color="blue" />
                <TimeBlock value={timeLeft.s} label="ثواني" color="amber" />
            </div>
        )}

        <div className="flex flex-col items-center gap-8">
            <div className="flex items-center gap-4 bg-blue-500/5 px-10 py-5 rounded-[25px] border border-blue-500/10 shadow-inner group">
                <Timer className="text-blue-400 group-hover:rotate-12 transition-transform" size={20}/>
                <span className="text-xs font-black text-gray-300 tracking-widest uppercase">
                    موعد الفتح: {new Date(settings.expectedReturnTime).toLocaleTimeString('ar-KW', { hour: '2-digit', minute: '2-digit' })}
                </span>
            </div>
            
            <div className="flex gap-4">
                {showSecretButton && (
                    <button 
                        onClick={goToLogin}
                        className="flex items-center gap-4 text-amber-400 hover:text-white transition-all text-xs font-black uppercase tracking-[0.2em] bg-amber-400/10 px-10 py-4 rounded-2xl border border-amber-400/20 animate-bounce shadow-[0_0_30px_rgba(251,191,36,0.2)]"
                    >
                        <ShieldCheck size={18}/> دخول الإدارة المركزية
                    </button>
                )}
            </div>
        </div>
      </div>

      <footer className="absolute bottom-10 opacity-20 flex flex-col items-center gap-2">
         <div className="flex gap-6 mb-2">
            <Zap size={14}/> <Atom size={14}/> <Sparkles size={14}/>
         </div>
         <p className="text-[8px] font-black uppercase tracking-[0.8em]">Syrian Science Center • Quantum Core v2</p>
      </footer>
    </div>
  );
};

export default MaintenanceMode;

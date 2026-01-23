
import React, { useEffect, useState, useRef } from 'react';
import anime from 'animejs';
import { MaintenanceSettings, AppBranding } from '../types';
import { RefreshCw, Atom, ShieldCheck, Timer, Zap, Sparkles, Orbit } from 'lucide-react';
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
        // إذا قام المدير بإغلاق وضع الصيانة يدوياً من لوحة التحكم، نفتح المنصة فوراً للطلاب
        if (data && !data.isMaintenanceActive) {
            handleAutoOpen();
        }
    });
    dbService.getAppBranding().then(setBranding);

    if (sessionStorage.getItem('ssc_admin_bypass') === 'true') {
        setShowSecretButton(true);
    }

    // إنشاء جزيئات خلفية متحركة (Physics Particles)
    const createParticles = () => {
        if (!containerRef.current) return;
        for (let i = 0; i < 40; i++) {
            const dot = document.createElement('div');
            dot.className = 'absolute bg-blue-400/20 rounded-full pointer-events-none blur-[1px]';
            const size = Math.random() * 4 + 1;
            dot.style.width = `${size}px`;
            dot.style.height = `${size}px`;
            dot.style.left = `${Math.random() * 100}%`;
            dot.style.top = `${Math.random() * 100}%`;
            containerRef.current.appendChild(dot);
            
            anime({
                targets: dot,
                translateY: [0, anime.random(-500, 500)],
                translateX: [0, anime.random(-500, 500)],
                opacity: [0, 0.6, 0],
                scale: [1, 2],
                duration: anime.random(6000, 15000),
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
        handleAutoOpen();
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
      
      // تأثير الانفجار العظيم (Big Bang Effect)
      const tl = anime.timeline({
          easing: 'easeOutExpo'
      });

      tl.add({
          targets: '.quantum-core',
          scale: 0.1,
          rotate: '1080deg',
          duration: 1200
      }).add({
          targets: '.opening-flash',
          opacity: [0, 1],
          duration: 1000,
          complete: () => {
              // إعادة توجيه نظيفة للجذر لإزالة أي بارامترات مثل ?admin=true
              window.location.href = window.location.origin; 
          }
      });
  };

  const handleLogoClick = (e: React.MouseEvent) => {
      const newCount = clickCount + 1;
      setClickCount(newCount);
      
      // تأثير بصري للنبض الكوانتومي
      anime({
          targets: '.maintenance-logo',
          scale: [1, 1.1, 1],
          filter: ['brightness(1)', 'brightness(2)', 'brightness(1)'],
          duration: 400
      });

      if (newCount >= 5) {
          sessionStorage.setItem('ssc_admin_bypass', 'true');
          setShowSecretButton(true);
          if ("vibrate" in navigator) navigator.vibrate(200);
          
          anime({
              targets: '.secret-btn-reveal',
              opacity: [0, 1],
              translateY: [20, 0],
              duration: 800,
              easing: 'easeOutElastic(1, .8)'
          });
      }
  };

  const goToLogin = () => {
      window.dispatchEvent(new CustomEvent('change-view', { detail: { view: 'auth' } }));
  };

  const TimeBlock = ({ value, label, sublabel }: { value: number, label: string, sublabel: string }) => (
    <div className="flex flex-col items-center">
        <div className="relative group">
            <div className="absolute inset-[-10px] bg-blue-500/10 rounded-full blur-xl opacity-0 group-hover:opacity-100 transition-opacity"></div>
            <div className="w-24 h-28 md:w-32 md:h-36 bg-gradient-to-b from-white/[0.05] to-transparent border border-white/10 rounded-[35px] flex items-center justify-center backdrop-blur-2xl shadow-2xl relative overflow-hidden group-hover:border-blue-400/50 transition-all">
                <div className="absolute top-0 left-0 w-full h-1/2 bg-white/5 pointer-events-none"></div>
                <span className="text-5xl md:text-7xl font-black text-white tabular-nums tracking-tighter drop-shadow-[0_0_20px_rgba(255,255,255,0.2)]">
                    {String(value).padStart(2, '0')}
                </span>
            </div>
        </div>
        <div className="mt-4 text-center">
            <p className="text-[10px] font-black text-blue-400 uppercase tracking-[0.3em] italic leading-none">{label}</p>
            <p className="text-[7px] text-gray-600 font-bold uppercase tracking-[0.2em] mt-1">{sublabel}</p>
        </div>
    </div>
  );

  if (!settings) return null;

  return (
    <div ref={containerRef} className="fixed inset-0 z-[9999] bg-[#000407] flex flex-col items-center justify-center font-['Tajawal'] text-white overflow-hidden text-right" dir="rtl">
      
      {/* طبقة الوميض النهائي */}
      <div className="opening-flash fixed inset-0 bg-white z-[10000] opacity-0 pointer-events-none"></div>

      {/* خلفية فيزيائية متحركة */}
      <div className="absolute inset-0 opacity-20 pointer-events-none">
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[1000px] h-[1000px] border border-blue-500/10 rounded-full animate-ping-slow"></div>
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] border border-cyan-500/10 rounded-full animate-ping-slow" style={{animationDelay: '2s'}}></div>
      </div>

      <div className="relative z-10 max-w-5xl w-full px-8 flex flex-col items-center">
        
        {/* الشعار الكوانتومي */}
        <div className="quantum-core relative mb-16">
            <div className="absolute inset-[-40px] border border-blue-500/10 rounded-full animate-spin-slow"></div>
            <div className="absolute inset-[-20px] border border-blue-400/20 rounded-full animate-spin-slow-reverse"></div>
            <div 
                onClick={handleLogoClick}
                className="maintenance-logo w-36 h-36 md:w-48 md:h-48 bg-[#0a1118] border-2 border-white/10 rounded-[60px] flex items-center justify-center shadow-[0_0_80px_rgba(59,130,246,0.1)] relative group overflow-hidden cursor-pointer transition-all active:scale-90"
            >
                <div className="absolute inset-0 bg-gradient-to-tr from-blue-500/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
                {branding?.logoUrl ? (
                    <img src={branding.logoUrl} className="w-2/3 h-2/3 object-contain pointer-events-none relative z-10" alt="Logo" />
                ) : (
                    <Atom size={80} className="text-blue-400 animate-spin-slow pointer-events-none relative z-10" />
                )}
                
                {clickCount > 0 && (
                    <div className="absolute bottom-4 text-[8px] font-black text-blue-500/40 uppercase tracking-widest animate-pulse">
                        Shield: {clickCount}/5
                    </div>
                )}
            </div>
        </div>

        <div className="text-center mb-16 space-y-6">
            <div className="inline-flex items-center gap-3 bg-blue-500/10 px-6 py-2 rounded-full border border-blue-500/20 mb-4 animate-slideUp">
                <Zap size={14} className="text-blue-400 animate-pulse" />
                <span className="text-[10px] font-black text-blue-300 uppercase tracking-widest italic">Core Synchronization Active</span>
            </div>
            <h1 className="text-6xl md:text-9xl font-black text-white tracking-tighter leading-none italic uppercase">
                تحديث <span className="text-blue-400 drop-shadow-[0_0_30px_rgba(59,130,246,0.4)]">المصادم</span>
            </h1>
            <p className="text-xl md:text-2xl text-gray-500 max-w-2xl mx-auto leading-relaxed font-medium italic opacity-80">
                {settings.maintenanceMessage}
            </p>
        </div>

        {settings.showCountdown && (
            <div className="flex gap-4 md:gap-10 mb-20 animate-slideUp">
                <TimeBlock value={timeLeft.d} label="الأيام" sublabel="Days" />
                <TimeBlock value={timeLeft.h} label="الساعات" sublabel="Hours" />
                <TimeBlock value={timeLeft.m} label="الدقائق" sublabel="Minutes" />
                <TimeBlock value={timeLeft.s} label="الثواني" sublabel="Seconds" />
            </div>
        )}

        <div className="flex flex-col items-center gap-10">
            <div className="flex items-center gap-4 bg-white/[0.02] border border-white/5 px-10 py-6 rounded-[30px] shadow-inner backdrop-blur-md">
                <div className="w-10 h-10 bg-blue-500/10 rounded-2xl flex items-center justify-center text-blue-400">
                    <Timer size={20} />
                </div>
                <div className="text-right">
                    <p className="text-[9px] font-black text-gray-600 uppercase tracking-widest mb-1">الافتتاح الرسمي للمنصة</p>
                    <p className="text-sm font-black text-white tabular-nums">
                        {new Date(settings.expectedReturnTime).toLocaleDateString('ar-KW', { day: 'numeric', month: 'long' })} | {new Date(settings.expectedReturnTime).toLocaleTimeString('ar-KW', { hour: '2-digit', minute: '2-digit' })}
                    </p>
                </div>
            </div>
            
            {showSecretButton && (
                <div className="secret-btn-reveal">
                    <button 
                        onClick={goToLogin}
                        className="flex items-center gap-4 text-amber-400 hover:text-white transition-all text-xs font-black uppercase tracking-[0.2em] bg-amber-400/10 px-12 py-5 rounded-2xl border-2 border-amber-400/20 animate-bounce shadow-[0_0_50px_rgba(251,191,36,0.2)]"
                    >
                        <ShieldCheck size={20}/> دخول الإدارة المركزية
                    </button>
                </div>
            )}
        </div>
      </div>

      <footer className="absolute bottom-10 w-full px-12 flex justify-between items-center opacity-20">
         <div className="flex items-center gap-4">
             <div className="h-px w-20 bg-gray-500"></div>
             <p className="text-[8px] font-black uppercase tracking-[0.5em]">Quantum System Core v3.5</p>
         </div>
         <div className="flex gap-4">
            <Sparkles size={14}/>
            <Orbit size={14}/>
         </div>
      </footer>
    </div>
  );
};

export default MaintenanceMode;

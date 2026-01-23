
import React, { useEffect, useState, useRef } from 'react';
import anime from 'animejs';
import { MaintenanceSettings, AppBranding } from '../types';
import { RefreshCw, Atom, ShieldCheck, Timer, Zap, Sparkles, Orbit, Lock, ShieldAlert } from 'lucide-react';
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
    // 🛡️ رصد لحظي لحالة الصيانة - إذا قام المدير بإطفائها، يتم تفعيل الأنيميشن فوراً
    const unsubscribeMaintenance = dbService.subscribeToMaintenance((data) => {
        if (settings && settings.isMaintenanceActive && data && !data.isMaintenanceActive) {
            handleAutoOpen(); // المنصة فتحت!
        }
        setSettings(data);
    });
    
    dbService.getAppBranding().then(setBranding);

    // التحقق من حالة العبور السابقة
    if (sessionStorage.getItem('ssc_admin_bypass') === 'true') {
        setShowSecretButton(true);
    }

    // إنشاء سديم الجزيئات الخلفي
    const createParticles = () => {
        if (!containerRef.current) return;
        for (let i = 0; i < 40; i++) {
            const dot = document.createElement('div');
            dot.className = 'absolute bg-blue-500/20 rounded-full pointer-events-none blur-[2px] z-0';
            const size = Math.random() * 5 + 2;
            dot.style.width = `${size}px`;
            dot.style.height = `${size}px`;
            dot.style.left = `${Math.random() * 100}%`;
            dot.style.top = `${Math.random() * 100}%`;
            containerRef.current.appendChild(dot);
            
            anime({
                targets: dot,
                translateY: [0, anime.random(-1000, 1000)],
                translateX: [0, anime.random(-1000, 1000)],
                opacity: [0, 0.4, 0],
                scale: [1, 3],
                duration: anime.random(8000, 20000),
                loop: true,
                easing: 'linear'
            });
        }
    };
    createParticles();

    return () => unsubscribeMaintenance();
  }, [settings]);

  useEffect(() => {
    if (!settings?.expectedReturnTime || !settings.isMaintenanceActive) return;

    const timer = setInterval(() => {
      const target = new Date(settings.expectedReturnTime).getTime();
      const now = new Date().getTime();
      const diff = target - now;

      if (diff <= 0) {
        clearInterval(timer);
        // لا تفتح تلقائياً إلا إذا كان المدير قد أغلق وضع الصيانة فعلياً
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
      
      // تأثير Warp Speed الفيزيائي عند الافتتاح
      const tl = anime.timeline({
          easing: 'easeInQuart'
      });

      tl.add({
          targets: '.content-lock',
          opacity: 0,
          scale: 0.8,
          filter: 'blur(20px)',
          duration: 800
      }).add({
          targets: '.warp-line',
          opacity: [0, 1],
          translateX: (el: any) => [0, el.getAttribute('data-dist')],
          duration: 1000,
          delay: anime.stagger(15)
      }).add({
          targets: '.opening-flash',
          opacity: [0, 1],
          duration: 1200,
          complete: () => {
              window.location.reload(); // تحديث الموقع للدخول النظيف للمنصة
          }
      });
  };

  const handleLogoClick = () => {
      const newCount = clickCount + 1;
      setClickCount(newCount);
      
      anime({
          targets: '.maintenance-logo',
          scale: [1, 0.95, 1.05, 1],
          duration: 300
      });

      if (newCount >= 5) {
          sessionStorage.setItem('ssc_admin_bypass', 'true');
          setShowSecretButton(true);
          if ("vibrate" in navigator) navigator.vibrate(200);
      }
  };

  const TimeBlock = ({ value, label }: { value: number, label: string }) => (
    <div className="flex flex-col items-center">
        <div className="w-20 h-24 md:w-28 md:h-32 bg-white/[0.03] border border-white/10 rounded-[30px] flex items-center justify-center backdrop-blur-3xl shadow-2xl relative overflow-hidden group hover:border-blue-400/40 transition-all">
            <div className="absolute top-0 left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-white/20 to-transparent"></div>
            <span className="text-4xl md:text-6xl font-black text-white tabular-nums tracking-tighter drop-shadow-[0_0_15px_rgba(255,255,255,0.3)]">
                {String(value).padStart(2, '0')}
            </span>
        </div>
        <div className="mt-4">
            <p className="text-[10px] font-black text-gray-500 uppercase tracking-[0.3em] italic">{label}</p>
        </div>
    </div>
  );

  if (!settings) return null;

  return (
    <div ref={containerRef} className="fixed inset-0 z-[9999] bg-[#000407] flex flex-col items-center justify-center font-['Tajawal'] text-white overflow-hidden text-right" dir="rtl">
      
      <div className="opening-flash fixed inset-0 bg-white z-[10000] opacity-0 pointer-events-none"></div>
      <div className="absolute inset-0 z-0 opacity-10 pointer-events-none flex items-center justify-center">
        {Array.from({length: 50}).map((_, i) => (
            <div key={i} className="warp-line absolute h-[2px] bg-blue-400 opacity-0" data-dist={Math.random() * 2000 - 1000} style={{ width: Math.random() * 200 + 50 + 'px', transform: `rotate(${Math.random() * 360}deg) translateX(0px)` }}></div>
        ))}
      </div>

      <div className="content-lock relative z-10 max-w-5xl w-full px-8 flex flex-col items-center transition-all duration-1000">
        
        <div className="relative mb-12">
            <div className="absolute inset-[-50px] border-2 border-blue-500/10 rounded-full animate-spin-slow"></div>
            <div 
                onClick={handleLogoClick}
                className="maintenance-logo w-36 h-36 md:w-44 md:h-44 bg-[#0a1118] border-2 border-white/10 rounded-[55px] flex items-center justify-center shadow-[0_0_100px_rgba(59,130,246,0.15)] relative group cursor-pointer transition-all active:scale-90"
            >
                {branding?.logoUrl ? (
                    <img src={branding.logoUrl} className="w-2/3 h-2/3 object-contain pointer-events-none" alt="Logo" />
                ) : (
                    <Atom size={80} className="text-blue-400 animate-spin-slow" />
                )}
            </div>
        </div>

        <div className="text-center mb-16 space-y-4">
            <div className="inline-flex items-center gap-2 bg-red-500/10 px-6 py-2 rounded-full border border-red-500/20 mb-4 animate-slideUp">
                <Lock size={14} className="text-red-500 animate-pulse" />
                <span className="text-[10px] font-black text-red-400 uppercase tracking-widest italic">Physical System Lockdown</span>
            </div>
            <h1 className="text-5xl md:text-8xl font-black text-white tracking-tighter leading-tight italic uppercase">
                قيد <span className="text-blue-400 drop-shadow-[0_0_30px_rgba(59,130,246,0.4)]">التحديث</span>
            </h1>
            <p className="text-lg md:text-xl text-gray-500 max-w-xl mx-auto leading-relaxed font-medium italic opacity-80">
                {settings.maintenanceMessage}
            </p>
        </div>

        {settings.showCountdown && (
            <div className="flex gap-4 md:gap-8 mb-20 animate-slideUp">
                <TimeBlock value={timeLeft.d} label="Days" />
                <TimeBlock value={timeLeft.h} label="Hours" />
                <TimeBlock value={timeLeft.m} label="Minutes" />
                <TimeBlock value={timeLeft.s} label="Seconds" />
            </div>
        )}

        <div className="flex flex-col items-center gap-10">
            <div className="flex items-center gap-6 bg-white/[0.02] border border-white/5 px-10 py-6 rounded-[35px] shadow-inner backdrop-blur-md">
                <div className="w-12 h-12 bg-blue-500/10 rounded-2xl flex items-center justify-center text-blue-400">
                    <Timer size={24} />
                </div>
                <div className="text-right">
                    <p className="text-[9px] font-black text-gray-600 uppercase tracking-widest mb-1">العودة المقررة للخدمة</p>
                    <p className="text-sm font-black text-white tabular-nums">
                        {new Date(settings.expectedReturnTime).toLocaleDateString('ar-KW', { day: 'numeric', month: 'long' })} | {new Date(settings.expectedReturnTime).toLocaleTimeString('ar-KW', { hour: '2-digit', minute: '2-digit' })}
                    </p>
                </div>
            </div>
            
            {showSecretButton && (
                <button 
                    onClick={() => window.dispatchEvent(new CustomEvent('change-view', { detail: { view: 'auth' } }))}
                    className="flex items-center gap-4 text-amber-400 hover:text-white transition-all text-[10px] font-black uppercase tracking-[0.3em] bg-amber-400/10 px-10 py-5 rounded-2xl border-2 border-amber-400/20 animate-bounce shadow-[0_0_50px_rgba(251,191,36,0.2)]"
                >
                    <ShieldCheck size={20}/> ولوج الإدارة المركزية
                </button>
            )}
        </div>
      </div>

      <footer className="absolute bottom-10 w-full px-12 flex justify-between items-center opacity-30">
         <div className="flex items-center gap-4">
             <div className="h-px w-20 bg-gray-700"></div>
             <p className="text-[8px] font-black uppercase tracking-[0.5em]">Quantum Core v5.0</p>
         </div>
         <div className="flex gap-6">
            <Sparkles size={16} className="text-blue-500/50" />
            <Orbit size={16} className="text-cyan-500/50" />
         </div>
      </footer>
    </div>
  );
};

export default MaintenanceMode;

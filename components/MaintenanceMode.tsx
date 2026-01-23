
import React, { useEffect, useState } from 'react';
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

  useEffect(() => {
    // جلب الإعدادات (الاشتراك الفعلي يتم في App.tsx)
    dbService.getMaintenanceSettings().then(setSettings);
    dbService.getAppBranding().then(setBranding);

    if (sessionStorage.getItem('ssc_admin_bypass') === 'true') {
        setShowSecretButton(true);
    }

    // أنيميشن الخلفية
    anime({
      targets: '.bg-particle',
      translateX: () => anime.random(-50, 50),
      translateY: () => anime.random(-50, 50),
      opacity: [0.1, 0.4, 0.1],
      duration: () => anime.random(3000, 6000),
      loop: true,
      easing: 'easeInOutQuad',
      delay: anime.stagger(100)
    });
  }, []);

  useEffect(() => {
    if (!settings?.expectedReturnTime) return;

    const timer = setInterval(() => {
      const target = new Date(settings.expectedReturnTime).getTime();
      const now = new Date().getTime();
      const diff = target - now;

      if (diff <= 0) {
        clearInterval(timer);
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
  }, [settings?.expectedReturnTime]);

  const handleLogoClick = () => {
      setClickCount(prev => prev + 1);
      anime({ targets: '.maintenance-logo', scale: [1, 0.9, 1.1, 1], duration: 400 });
      if (clickCount >= 5) {
          sessionStorage.setItem('ssc_admin_bypass', 'true');
          setShowSecretButton(true);
          if ("vibrate" in navigator) navigator.vibrate(200);
      }
  };

  const TimeBlock = ({ value, label }: { value: number, label: string }) => (
    <div className="flex flex-col items-center">
        <div className="w-20 h-24 md:w-28 md:h-32 bg-white/[0.03] border border-white/10 rounded-[30px] flex items-center justify-center backdrop-blur-3xl shadow-2xl relative overflow-hidden group">
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
    <div className="fixed inset-0 z-[9999] bg-[#000407] flex flex-col items-center justify-center font-['Tajawal'] text-white overflow-hidden text-right" dir="rtl">
      {/* Background Particles */}
      <div className="absolute inset-0 z-0 opacity-20 pointer-events-none">
        {Array.from({length: 20}).map((_, i) => (
            <div key={i} className="bg-particle absolute w-1 h-1 bg-blue-400 rounded-full" style={{ left: `${Math.random()*100}%`, top: `${Math.random()*100}%` }}></div>
        ))}
      </div>

      <div className="relative z-10 max-w-4xl w-full px-8 flex flex-col items-center">
        <div className="relative mb-12">
            <div className="absolute inset-[-40px] border-2 border-blue-500/10 rounded-full animate-spin-slow"></div>
            <div 
                onClick={handleLogoClick}
                className="maintenance-logo w-36 h-36 md:w-44 md:h-44 bg-[#0a1118] border-2 border-white/10 rounded-[55px] flex items-center justify-center shadow-[0_0_100px_rgba(59,130,246,0.1)] relative group cursor-pointer transition-all active:scale-95"
            >
                {branding?.logoUrl ? <img src={branding.logoUrl} className="w-2/3 h-2/3 object-contain pointer-events-none" alt="Logo" /> : <Atom size={80} className="text-blue-400 animate-spin-slow" />}
            </div>
        </div>

        <div className="text-center mb-16 space-y-4">
            <div className="inline-flex items-center gap-2 bg-red-500/10 px-6 py-2 rounded-full border border-red-500/20 mb-4">
                <Lock size={14} className="text-red-500 animate-pulse" />
                <span className="text-[10px] font-black text-red-400 uppercase tracking-widest italic">System Lockdown in Progress</span>
            </div>
            <h1 className="text-5xl md:text-8xl font-black text-white tracking-tighter leading-tight italic uppercase">
                قيد <span className="text-blue-400 drop-shadow-[0_0_30px_rgba(59,130,246,0.4)]">التطوير</span>
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
                <div className="w-12 h-12 bg-blue-500/10 rounded-2xl flex items-center justify-center text-blue-400"><Timer size={24} /></div>
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
         <p className="text-[8px] font-black uppercase tracking-[0.5em]">Syrian Science Center • Quantum Core</p>
         <div className="flex gap-6"><Sparkles size={16} className="text-blue-500/50" /><Orbit size={16} className="text-cyan-500/50" /></div>
      </footer>
    </div>
  );
};

export default MaintenanceMode;

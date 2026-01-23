
import React, { useEffect, useState, useRef } from 'react';
import anime from 'animejs';
import { MaintenanceSettings, AppBranding } from '../types';
import { RefreshCw, Atom, ShieldCheck, Timer, Zap, Sparkles, Orbit, Globe, Rocket, CheckCircle2 } from 'lucide-react';
import { dbService } from '../services/db';

const MaintenanceMode: React.FC = () => {
  const [settings, setSettings] = useState<MaintenanceSettings | null>(null);
  const [branding, setBranding] = useState<AppBranding | null>(null);
  const [timeLeft, setTimeLeft] = useState({ d: 0, h: 0, m: 0, s: 0, totalMs: 999999 });
  const [serverTimeOffset, setServerTimeOffset] = useState(0);
  const [isIgnition, setIsIgnition] = useState(false);
  const [isLaunched, setIsLaunched] = useState(false);
  
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const syncTime = async () => {
        try {
            const response = await fetch('https://worldtimeapi.org/api/timezone/Etc/UTC');
            const data = await response.json();
            const realNow = new Date(data.utc_datetime).getTime();
            setServerTimeOffset(realNow - Date.now());
        } catch (e) { console.warn("Time Sync Failed."); }
    };
    syncTime();

    const unsubscribe = dbService.subscribeToMaintenance((updated) => {
        setSettings(updated);
    });
    dbService.getAppBranding().then(setBranding);

    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (!settings?.expectedReturnTime) return;

    const timer = setInterval(() => {
      const target = new Date(settings.expectedReturnTime).getTime();
      const now = Date.now() + serverTimeOffset;
      const diff = target - now;

      if (diff <= 0) {
        clearInterval(timer);
        handleLaunchSequence();
      } else {
        // تفعيل وضع الدقيقة الأخيرة (Ignition)
        if (diff < 60000 && !isIgnition) {
            setIsIgnition(true);
            triggerIgnitionAnimation();
        }

        setTimeLeft({
          d: Math.floor(diff / (1000 * 60 * 60 * 24)),
          h: Math.floor((diff / (1000 * 60 * 60)) % 24),
          m: Math.floor((diff / 1000 / 60) % 60),
          s: Math.floor((diff / 1000) % 60),
          totalMs: diff
        });
      }
    }, 1000);

    return () => clearInterval(timer);
  }, [settings, serverTimeOffset, isIgnition]);

  const triggerIgnitionAnimation = () => {
    // أنيميشن تسارع النبض في آخر دقيقة
    anime({
        targets: '.ignition-glow',
        scale: [1, 1.5, 1],
        opacity: [0.1, 0.4, 0.1],
        easing: 'easeInOutQuad',
        duration: 800,
        loop: true
    });
    
    anime({
        targets: '.timer-block',
        translateY: [-2, 2],
        rotate: [-1, 1],
        duration: 100,
        loop: true,
        direction: 'alternate',
        easing: 'linear'
    });
  };

  const handleLaunchSequence = () => {
    setIsLaunched(true);
    // حركة احتفالية فور الانتهاء
    const tl = anime.timeline({ easing: 'easeOutExpo' });

    tl.add({
        targets: '.launch-overlay',
        opacity: [0, 1],
        duration: 500
    }).add({
        targets: '.launch-content',
        scale: [0.5, 1],
        opacity: [0, 1],
        duration: 1000
    }).add({
        targets: '.sparkle',
        scale: [0, 2, 0],
        opacity: [0, 1, 0],
        translateX: () => anime.random(-300, 300),
        translateY: () => anime.random(-300, 300),
        delay: anime.stagger(20),
        duration: 1500,
        complete: () => {
            // إعادة تحميل الصفحة تلقائياً لفتح المنصة
            setTimeout(() => window.location.reload(), 2000);
        }
    });
  };

  const handleAdminEnter = () => {
    localStorage.setItem('ssc_maintenance_bypass_token', 'ssc_core_secure_v4_8822');
    window.location.reload();
  };

  const TimeBlock = ({ value, label, color = "text-white" }: { value: number, label: string, color?: string }) => (
    <div className="timer-block flex flex-col items-center">
        <div className="w-16 h-20 md:w-28 md:h-36 bg-white/[0.03] border border-white/10 rounded-[25px] md:rounded-[40px] flex items-center justify-center backdrop-blur-3xl shadow-2xl relative overflow-hidden group">
            <div className="absolute top-0 left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-white/20 to-transparent"></div>
            <span className={`text-3xl md:text-7xl font-black tabular-nums tracking-tighter ${color}`}>
                {String(value).padStart(2, '0')}
            </span>
        </div>
        <div className="mt-3">
            <p className="text-[8px] md:text-[10px] font-black text-gray-600 uppercase tracking-[0.3em] italic">{label}</p>
        </div>
    </div>
  );

  if (!settings) return null;

  return (
    <div ref={containerRef} className={`fixed inset-0 z-[9999] flex flex-col items-center justify-center font-['Tajawal'] text-white overflow-hidden transition-colors duration-1000 ${isIgnition ? 'bg-[#050000]' : 'bg-[#000407]'}`} dir="rtl">
      
      {/* Ignition Glow Background */}
      {isIgnition && (
          <div className="ignition-glow absolute inset-0 bg-red-500/10 rounded-full blur-[150px] pointer-events-none"></div>
      )}

      <div className="relative z-10 max-w-4xl w-full px-8 flex flex-col items-center">
        <div className="relative mb-12">
            <div className={`absolute inset-[-40px] border-2 rounded-full animate-spin-slow transition-colors duration-1000 ${isIgnition ? 'border-red-500/20' : 'border-blue-500/5'}`}></div>
            <div className="w-32 h-32 md:w-44 md:h-44 bg-[#0a1118] border-2 border-white/5 rounded-[50px] flex items-center justify-center shadow-3xl relative group">
                {branding?.logoUrl ? <img src={branding.logoUrl} className="w-2/3 h-2/3 object-contain" alt="Logo" /> : <Atom size={60} className="text-blue-400 animate-spin-slow" />}
            </div>
        </div>

        <div className="text-center mb-16 space-y-4">
            <div className={`inline-flex items-center gap-2 px-4 py-1.5 rounded-full border mb-2 transition-all ${isIgnition ? 'bg-red-500/10 border-red-500/20 text-red-400' : 'bg-blue-500/5 border-blue-500/10 text-blue-400'}`}>
                {isIgnition ? <Rocket size={12} className="animate-bounce" /> : <Globe size={12} className="animate-pulse" />}
                <span className="text-[8px] font-black uppercase tracking-widest italic">{isIgnition ? 'FINAL COUNTDOWN INITIATED' : 'Global Server Time Synced'}</span>
            </div>
            
            {isIgnition ? (
                <h1 className="text-4xl md:text-8xl font-black text-white tracking-tighter leading-tight italic uppercase">
                    استعد <span className="text-red-500 drop-shadow-[0_0_30px_rgba(239,68,68,0.4)]">للانطلاق</span>
                </h1>
            ) : (
                <h1 className="text-4xl md:text-7xl font-black text-white tracking-tighter leading-tight italic uppercase">
                    قيد <span className="text-blue-400 drop-shadow-[0_0_30px_rgba(59,130,246,0.4)]">التطوير</span>
                </h1>
            )}
            
            <p className="text-base md:text-lg text-gray-500 max-w-lg mx-auto leading-relaxed font-medium italic opacity-70">
                {isIgnition ? "جاري تحضير المحركات العلمية وتنشيط قواعد البيانات... اربطوا الأحزمة." : settings.maintenanceMessage}
            </p>
        </div>

        {settings.showCountdown && (
            <div className={`flex gap-4 md:gap-8 mb-16 transition-transform duration-500 ${isIgnition ? 'scale-110' : ''}`}>
                {!isIgnition && <TimeBlock value={timeLeft.d} label="أيام" />}
                {!isIgnition && <TimeBlock value={timeLeft.h} label="ساعات" />}
                <TimeBlock value={timeLeft.m} label="دقائق" color={isIgnition ? 'text-red-500' : 'text-white'} />
                <TimeBlock value={timeLeft.s} label="ثواني" color={isIgnition ? 'text-red-500' : 'text-white'} />
            </div>
        )}

        <div className="flex flex-col items-center gap-6">
            <div className="flex items-center gap-4 bg-white/[0.02] border border-white/5 px-8 py-4 rounded-[30px] shadow-inner backdrop-blur-md">
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center transition-colors ${isIgnition ? 'bg-red-500/10 text-red-400' : 'bg-blue-500/10 text-blue-400'}`}><Timer size={20} /></div>
                <div className="text-right">
                    <p className="text-[8px] font-black text-gray-600 uppercase tracking-widest">توقيت الافتتاح الرسمي</p>
                    <p className="text-xs font-black text-white tabular-nums">
                        {new Date(settings.expectedReturnTime).toLocaleTimeString('ar-KW', { hour: '2-digit', minute: '2-digit' })}
                    </p>
                </div>
            </div>
        </div>
      </div>

      {/* 🚀 واجهة الإطلاق النهائية الاحتفالية */}
      {isLaunched && (
          <div className="launch-overlay fixed inset-0 z-[10000] bg-black flex items-center justify-center text-center p-8 opacity-0">
              {Array.from({length: 30}).map((_, i) => (
                  <div key={i} className="sparkle absolute w-2 h-2 bg-amber-400 rounded-full blur-[2px]"></div>
              ))}
              <div className="launch-content space-y-10 relative z-10">
                  <div className="w-32 h-32 bg-green-500 text-black rounded-full mx-auto flex items-center justify-center shadow-[0_0_100px_rgba(34,197,94,0.4)] animate-bounce">
                      <CheckCircle2 size={64} />
                  </div>
                  <div>
                      <h2 className="text-5xl md:text-8xl font-black text-white italic tracking-tighter uppercase drop-shadow-[0_0_50px_rgba(255,255,255,0.2)]">اكتمل التجهيز!</h2>
                      <p className="text-gray-500 text-2xl mt-4 font-bold uppercase tracking-widest animate-pulse italic">جاري تحويلك للمنصة الآن...</p>
                  </div>
              </div>
          </div>
      )}

      <button onClick={handleAdminEnter} className="fixed bottom-4 right-4 text-[8px] font-black text-gray-800 hover:text-blue-500/20 transition-colors uppercase tracking-[0.3em] opacity-5 hover:opacity-100 z-[10000]">
        ADMIN PORTAL LOGIN
      </button>

      <footer className="absolute bottom-6 w-full px-12 flex justify-between items-center opacity-20 pointer-events-none">
         <p className="text-[7px] font-black uppercase tracking-[0.4em]">Syrian Science Center • Auto-Launch v12.0</p>
         <div className="flex gap-4"><Sparkles size={12} className="text-blue-500/50" /><Orbit size={12} className="text-cyan-500/50" /></div>
      </footer>
    </div>
  );
};

export default MaintenanceMode;

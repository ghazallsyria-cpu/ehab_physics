
import React, { useEffect, useState, useRef } from 'react';
import anime from 'animejs';
import { MaintenanceSettings, AppBranding } from '../types';
import { Atom, Globe, Rocket, Timer, AlertTriangle, ShieldCheck } from 'lucide-react';
import { dbService } from '../services/db';

const MaintenanceMode: React.FC = () => {
  const [settings, setSettings] = useState<MaintenanceSettings | null>(null);
  const [branding, setBranding] = useState<AppBranding | null>(null);
  const [timeLeft, setTimeLeft] = useState({ d: 0, h: 0, m: 0, s: 0, totalMs: 999999 });
  const [isFinalMinute, setIsFinalMinute] = useState(false);
  const [isExploding, setIsExploding] = useState(false);
  
  const lastSecondRef = useRef<number>(-1);

  useEffect(() => {
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
      const now = Date.now();
      const diff = target - now;

      if (diff <= 0) {
        clearInterval(timer);
        triggerBigBang();
      } else {
        const seconds = Math.floor((diff / 1000) % 60);
        
        // تفعيل وضع الدقيقة الأخيرة
        if (diff < 60000 && !isFinalMinute) {
            setIsFinalMinute(true);
        }

        // أنيميشن النبض لكل ثانية في الدقيقة الأخيرة
        if (diff < 60000 && seconds !== lastSecondRef.current) {
            lastSecondRef.current = seconds;
            animateSecondPulse();
        }

        setTimeLeft({
          d: Math.floor(diff / (1000 * 60 * 60 * 24)),
          h: Math.floor((diff / (1000 * 60 * 60)) % 24),
          m: Math.floor((diff / 1000 / 60) % 60),
          s: seconds,
          totalMs: diff
        });
      }
    }, 100); // تحديث أسرع للدقة

    return () => clearInterval(timer);
  }, [settings, isFinalMinute]);

  const animateSecondPulse = () => {
    anime({
        targets: '.final-second-display',
        opacity: [0, 1, 0],
        scale: [0.8, 1.2],
        filter: ['blur(10px)', 'blur(0px)', 'blur(10px)'],
        easing: 'easeInOutExpo',
        duration: 950
    });
    
    // اهتزاز الكاميرا الخفيف
    anime({
        targets: '.maintenance-container',
        translateX: () => anime.random(-2, 2),
        translateY: () => anime.random(-2, 2),
        duration: 50,
        direction: 'alternate'
    });
  };

  const triggerBigBang = () => {
    setIsExploding(true);
    
    const tl = anime.timeline({
        easing: 'easeOutExpo'
    });

    tl.add({
        targets: '.big-bang-core',
        scale: [0, 50],
        opacity: [0, 1],
        duration: 1500,
    }).add({
        targets: '.explosion-particle',
        translateX: () => anime.random(-1000, 1000),
        translateY: () => anime.random(-1000, 1000),
        scale: [1, 0],
        opacity: [1, 0],
        duration: 2000,
        delay: anime.stagger(10),
        offset: '-=1000'
    }).add({
        targets: '.flash-overlay',
        opacity: [0, 1],
        duration: 800,
        complete: () => {
            // إقلاع المنصة
            window.location.reload();
        }
    });
  };

  const handleAdminEnter = () => {
    localStorage.setItem('ssc_maintenance_bypass_token', 'ssc_core_secure_v4_8822');
    window.location.reload();
  };

  if (!settings) return null;

  return (
    <div className={`fixed inset-0 z-[9999] flex flex-col items-center justify-center font-['Tajawal'] text-white overflow-hidden transition-colors duration-1000 maintenance-container ${isFinalMinute ? 'bg-black' : 'bg-[#000407]'}`} dir="rtl">
      
      {/* هالات خلفية في الوضع العادي */}
      {!isFinalMinute && (
          <div className="absolute inset-0 overflow-hidden pointer-events-none">
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-blue-500/5 rounded-full blur-[120px] animate-pulse"></div>
          </div>
      )}

      {/* ومضات حمراء في الدقيقة الأخيرة */}
      {isFinalMinute && !isExploding && (
          <div className="absolute inset-0 bg-red-900/5 animate-pulse pointer-events-none"></div>
      )}

      <div className="relative z-10 w-full flex flex-col items-center text-center px-6">
        
        {!isFinalMinute ? (
            // --- الواجهة العادية للصيانة ---
            <div className="animate-fadeIn space-y-10">
                <div className="relative inline-block">
                    <div className="absolute inset-[-30px] border border-blue-500/10 rounded-full animate-spin-slow"></div>
                    <div className="w-32 h-32 md:w-40 md:h-40 bg-white/5 border border-white/10 rounded-[40px] flex items-center justify-center shadow-2xl relative overflow-hidden group">
                        {branding?.logoUrl ? <img src={branding.logoUrl} className="w-2/3 h-2/3 object-contain" alt="Logo" /> : <Atom size={60} className="text-blue-400 animate-spin-slow" />}
                    </div>
                </div>

                <div className="space-y-4">
                    <h1 className="text-4xl md:text-7xl font-black italic tracking-tighter uppercase">
                        تحديث <span className="text-blue-400">المنظومة</span>
                    </h1>
                    <p className="text-gray-500 max-w-lg mx-auto text-lg leading-relaxed">
                        {settings.maintenanceMessage}
                    </p>
                </div>

                {settings.showCountdown && (
                    <div className="flex gap-4 md:gap-8 justify-center">
                        {[
                            { v: timeLeft.d, l: 'أيام' },
                            { v: timeLeft.h, l: 'ساعات' },
                            { v: timeLeft.m, l: 'دقائق' },
                            { v: timeLeft.s, l: 'ثواني' }
                        ].map((t, i) => (
                            <div key={i} className="flex flex-col items-center">
                                <div className="w-16 h-20 md:w-24 md:h-32 bg-white/5 border border-white/10 rounded-[25px] flex items-center justify-center backdrop-blur-xl">
                                    <span className="text-3xl md:text-5xl font-black tabular-nums">{String(t.v).padStart(2, '0')}</span>
                                </div>
                                <span className="text-[8px] font-black text-gray-600 uppercase mt-3 tracking-widest">{t.l}</span>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        ) : (
            // --- واجهة الدقيقة الأخيرة الملحمية ---
            <div className="flex flex-col items-center justify-center min-h-screen">
                <div className="mb-12">
                    <span className="inline-flex items-center gap-2 px-6 py-2 bg-red-600 text-white rounded-full text-xs font-black uppercase tracking-[0.3em] animate-bounce shadow-[0_0_30px_rgba(220,38,38,0.5)]">
                        <Rocket size={16}/> تقارب كوني وشيك
                    </span>
                </div>
                
                <div className="relative h-80 flex items-center justify-center">
                    {/* الرقم الضخم الذي ينبض */}
                    <div className="final-second-display text-[18rem] md:text-[28rem] font-black leading-none tabular-nums text-red-600 drop-shadow-[0_0_60px_rgba(220,38,38,0.8)] opacity-0">
                        {timeLeft.s}
                    </div>
                    {/* حلقات الطاقة حول الرقم */}
                    <div className="absolute inset-0 w-[500px] h-[500px] border-2 border-red-600/20 rounded-full animate-ping opacity-20"></div>
                </div>

                <div className="mt-20">
                    <p className="text-gray-500 text-2xl font-bold italic uppercase tracking-[0.4em] animate-pulse">
                        الاستعداد للانفجار المعلوماتي العظيم
                    </p>
                    <div className="flex gap-4 mt-8 justify-center opacity-30">
                        <div className="w-2 h-2 bg-red-600 rounded-full animate-ping"></div>
                        <div className="w-2 h-2 bg-red-600 rounded-full animate-ping [animation-delay:0.2s]"></div>
                        <div className="w-2 h-2 bg-red-600 rounded-full animate-ping [animation-delay:0.4s]"></div>
                    </div>
                </div>
            </div>
        )}
      </div>

      {/* 💥 طبقات الانفجار العظيم (Big Bang) */}
      {isExploding && (
          <>
            <div className="big-bang-core fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-10 h-10 bg-white rounded-full z-[10000] blur-md"></div>
            <div className="fixed inset-0 z-[10001] pointer-events-none">
                {Array.from({length: 100}).map((_, i) => (
                    <div key={i} className="explosion-particle absolute top-1/2 left-1/2 w-4 h-4 bg-blue-400 rounded-full blur-[2px]" style={{ boxShadow: '0 0 20px #00d2ff' }}></div>
                ))}
            </div>
            <div className="flash-overlay fixed inset-0 bg-white z-[10002] opacity-0"></div>
          </>
      )}

      {/* تذيل الصفحة */}
      <div className="absolute bottom-10 w-full px-12 flex justify-between items-center opacity-20 pointer-events-none">
         <p className="text-[7px] font-black uppercase tracking-[0.4em]">Quantum System Initialization v12.5</p>
         <div className="flex gap-4">
             <ShieldCheck size={14} />
             <Globe size={14} />
         </div>
      </div>

      {/* مدخل سري للمدراء */}
      <button onClick={handleAdminEnter} className="fixed bottom-4 right-4 text-[8px] font-black text-gray-800 hover:text-red-500/20 transition-colors uppercase z-[10003] opacity-5 hover:opacity-100">
        FORCE OVERRIDE
      </button>

    </div>
  );
};

export default MaintenanceMode;

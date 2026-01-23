
import React, { useEffect, useState, useRef } from 'react';
import anime from 'animejs';
import { MaintenanceSettings, AppBranding } from '../types';
import { Atom, Globe, Rocket, Zap, ShieldAlert, Sparkles } from 'lucide-react';
import { dbService } from '../services/db';

const MaintenanceMode: React.FC = () => {
  const [settings, setSettings] = useState<MaintenanceSettings | null>(null);
  const [branding, setBranding] = useState<AppBranding | null>(null);
  const [timeLeft, setTimeLeft] = useState({ d: 0, h: 0, m: 0, s: 0, totalMs: 999999 });
  const [isFinalMinute, setIsFinalMinute] = useState(false);
  const [isExploding, setIsExploding] = useState(false);
  
  const lastSecondRef = useRef<number>(-1);
  const containerRef = useRef<HTMLDivElement>(null);

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
        if (!isExploding) triggerBigBang();
      } else {
        const seconds = Math.floor((diff / 1000) % 60);
        
        // تفعيل وضع الدقيقة الأخيرة
        if (diff < 60000 && !isFinalMinute) {
            setIsFinalMinute(true);
        }

        // تأثير النبض المتزامن مع كل ثانية
        if (diff < 60000 && seconds !== lastSecondRef.current) {
            lastSecondRef.current = seconds;
            animateSecondPulse(diff);
        }

        setTimeLeft({
          d: Math.floor(diff / (1000 * 60 * 60 * 24)),
          h: Math.floor((diff / (1000 * 60 * 60)) % 24),
          m: Math.floor((diff / 1000 / 60) % 60),
          s: seconds,
          totalMs: diff
        });
      }
    }, 100);

    return () => clearInterval(timer);
  }, [settings, isFinalMinute, isExploding]);

  const animateSecondPulse = (remainingMs: number) => {
    // شدة الاهتزاز تزداد كلما اقتربنا من الصفر
    const shakeIntensity = Math.max(1, (60000 - remainingMs) / 5000);

    anime({
        targets: '.final-second-display',
        opacity: [0, 1, 0],
        scale: [0.5, 1.5],
        filter: ['blur(20px)', 'blur(0px)', 'blur(40px)'],
        easing: 'easeOutExpo',
        duration: 900
    });
    
    anime({
        targets: '.maintenance-main-wrapper',
        translateX: () => anime.random(-shakeIntensity, shakeIntensity),
        translateY: () => anime.random(-shakeIntensity, shakeIntensity),
        rotate: () => anime.random(-shakeIntensity/10, shakeIntensity/10),
        duration: 50,
        direction: 'alternate'
    });
  };

  const triggerBigBang = () => {
    setIsExploding(true);
    
    // إخفاء المحتوى فوراً للبدء بالانفجار
    const tl = anime.timeline({
        easing: 'easeOutQuart'
    });

    tl.add({
        targets: '.final-second-display',
        scale: 0,
        duration: 200,
        easing: 'easeInBack'
    }).add({
        targets: '.big-bang-core',
        opacity: [0, 1],
        scale: [0, 1],
        duration: 400,
    }).add({
        targets: '.shockwave',
        scale: [0, 10],
        opacity: [1, 0],
        duration: 1200,
        delay: anime.stagger(150),
        easing: 'easeOutExpo',
        offset: '-=200'
    }).add({
        targets: '.explosion-particle',
        translateX: () => anime.random(-window.innerWidth, window.innerWidth),
        translateY: () => anime.random(-window.innerHeight, window.innerHeight),
        scale: [2, 0],
        opacity: [1, 0],
        rotate: () => anime.random(-360, 360),
        duration: 2500,
        delay: anime.stagger(5),
        offset: '-=1000'
    }).add({
        targets: '.flash-overlay',
        opacity: [0, 1],
        scale: [0.9, 1.1],
        duration: 1000,
        easing: 'linear',
        complete: () => {
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
    <div ref={containerRef} className={`fixed inset-0 z-[9999] flex flex-col items-center justify-center font-['Tajawal'] text-white overflow-hidden transition-colors duration-1000 maintenance-main-wrapper ${isFinalMinute ? 'bg-black' : 'bg-[#000407]'}`} dir="rtl">
      
      {/* طبقات الخلفية الديناميكية */}
      <div className="absolute inset-0 pointer-events-none">
          <div className={`absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[1000px] h-[1000px] rounded-full blur-[150px] transition-colors duration-1000 ${isFinalMinute ? 'bg-red-600/10' : 'bg-blue-600/5'} animate-pulse`}></div>
          {isFinalMinute && !isExploding && (
              <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(255,0,0,0.05)_0%,transparent_70%)] animate-pulse"></div>
          )}
      </div>

      <div className="relative z-10 w-full flex flex-col items-center text-center px-6">
        
        {!isFinalMinute ? (
            // --- الواجهة العادية للصيانة ---
            <div className="animate-fadeIn space-y-12">
                <div className="relative inline-block">
                    <div className="absolute inset-[-40px] border-2 border-blue-500/10 rounded-full animate-spin-slow"></div>
                    <div className="absolute inset-[-20px] border border-blue-400/20 rounded-full animate-reverse-spin"></div>
                    <div className="w-40 h-40 bg-white/5 border border-white/10 rounded-[50px] flex items-center justify-center shadow-3xl relative overflow-hidden backdrop-blur-xl group">
                        {branding?.logoUrl ? <img src={branding.logoUrl} className="w-2/3 h-2/3 object-contain" alt="Logo" /> : <Atom size={80} className="text-blue-400 animate-spin-slow" />}
                    </div>
                </div>

                <div className="space-y-6">
                    <h1 className="text-5xl md:text-8xl font-black italic tracking-tighter uppercase leading-none">
                        قيد <span className="text-blue-400">التطوير</span>
                    </h1>
                    <p className="text-gray-500 max-w-2xl mx-auto text-xl leading-relaxed font-medium">
                        {settings.maintenanceMessage}
                    </p>
                </div>

                {settings.showCountdown && (
                    <div className="flex gap-4 md:gap-10 justify-center">
                        {[
                            { v: timeLeft.d, l: 'أيام' },
                            { v: timeLeft.h, l: 'ساعات' },
                            { v: timeLeft.m, l: 'دقائق' },
                            { v: timeLeft.s, l: 'ثواني' }
                        ].map((t, i) => (
                            <div key={i} className="flex flex-col items-center">
                                <div className="w-20 h-24 md:w-32 md:h-40 bg-white/5 border border-white/10 rounded-[35px] flex items-center justify-center backdrop-blur-3xl shadow-2xl relative group">
                                    <div className="absolute inset-0 bg-blue-500/5 opacity-0 group-hover:opacity-100 transition-opacity rounded-[35px]"></div>
                                    <span className="text-4xl md:text-7xl font-black tabular-nums">{String(t.v).padStart(2, '0')}</span>
                                </div>
                                <span className="text-[10px] font-black text-gray-600 uppercase mt-4 tracking-[0.3em]">{t.l}</span>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        ) : (
            // --- واجهة الدقيقة الأخيرة الملحمية (The Reactor Phase) ---
            <div className="flex flex-col items-center justify-center min-h-screen w-full relative">
                <div className="mb-20 animate-pulse">
                    <span className="inline-flex items-center gap-3 px-10 py-3 bg-red-600 text-white rounded-full text-sm font-black uppercase tracking-[0.4em] shadow-[0_0_50px_rgba(220,38,38,0.6)] border-2 border-white/20">
                        <Zap size={20} className="animate-bounce" /> التحميل الكوانتومي نشط
                    </span>
                </div>
                
                <div className="relative h-[500px] w-full flex items-center justify-center">
                    {/* الرقم العملاق */}
                    <div className="final-second-display text-[25rem] md:text-[40rem] font-black leading-none tabular-nums text-red-600 drop-shadow-[0_0_100px_rgba(220,38,38,0.9)] opacity-0 select-none">
                        {timeLeft.s}
                    </div>

                    {/* هالات الطاقة المتوسعة */}
                    <div className="absolute w-[600px] h-[600px] border-4 border-red-600/30 rounded-full animate-ping-slow"></div>
                    <div className="absolute w-[400px] h-[400px] border-2 border-red-600/20 rounded-full animate-ping"></div>
                </div>

                <div className="mt-24 space-y-6">
                    <h3 className="text-gray-400 text-3xl font-black italic uppercase tracking-[0.5em] animate-pulse">
                        تزامن <span className="text-white">المنظومة</span> وشيك
                    </h3>
                    <div className="flex gap-6 justify-center">
                        <div className="w-3 h-3 bg-red-600 rounded-full animate-bounce [animation-delay:0s]"></div>
                        <div className="w-3 h-3 bg-red-600 rounded-full animate-bounce [animation-delay:0.2s]"></div>
                        <div className="w-3 h-3 bg-red-600 rounded-full animate-bounce [animation-delay:0.4s]"></div>
                    </div>
                </div>
            </div>
        )}
      </div>

      {/* 💥 عناصر الانفجار العظيم (Big Bang Layers) */}
      {isExploding && (
          <div className="fixed inset-0 z-[10000] flex items-center justify-center pointer-events-none">
            {/* نواة الانفجار */}
            <div className="big-bang-core absolute w-20 h-20 bg-white rounded-full blur-xl opacity-0"></div>
            
            {/* موجات الصدمة */}
            <div className="shockwave absolute w-64 h-64 border-8 border-blue-400 rounded-full opacity-0"></div>
            <div className="shockwave absolute w-64 h-64 border-[20px] border-white rounded-full opacity-0 [animation-delay:0.2s]"></div>
            <div className="shockwave absolute w-64 h-64 border-4 border-purple-500 rounded-full opacity-0 [animation-delay:0.4s]"></div>
            
            {/* الجزيئات المتطايرة */}
            {Array.from({length: 150}).map((_, i) => (
                <div 
                    key={i} 
                    className="explosion-particle absolute w-2 h-2 rounded-full"
                    style={{ 
                        background: i % 3 === 0 ? '#fff' : i % 3 === 1 ? '#3b82f6' : '#fbbf24',
                        boxShadow: `0 0 15px ${i % 3 === 0 ? '#fff' : i % 3 === 1 ? '#3b82f6' : '#fbbf24'}`
                    }}
                ></div>
            ))}
            
            {/* الوميض النهائي */}
            <div className="flash-overlay absolute inset-0 bg-white opacity-0"></div>
          </div>
      )}

      {/* تذيل الصفحة الإحترافي */}
      <div className="absolute bottom-12 w-full px-16 flex justify-between items-center opacity-30 pointer-events-none">
         <div className="flex items-center gap-4">
             <ShieldAlert size={18} className="text-red-500" />
             <p className="text-[10px] font-black uppercase tracking-[0.5em]">Quantum Core Version 12.6</p>
         </div>
         <div className="flex gap-6">
             <Sparkles size={16} />
             <Globe size={16} />
         </div>
      </div>

      {/* Force Bypass للادارة */}
      <button onClick={handleAdminEnter} className="fixed bottom-4 left-4 text-[8px] font-black text-gray-900 opacity-5 hover:opacity-100 hover:text-red-500 transition-all z-[10005]">
        SYSTEM OVERRIDE
      </button>

      <style>{`
        @keyframes ping-slow {
            0% { transform: scale(1); opacity: 0.8; }
            100% { transform: scale(1.5); opacity: 0; }
        }
        .animate-ping-slow {
            animation: ping-slow 2s cubic-bezier(0, 0, 0.2, 1) infinite;
        }
        .animate-reverse-spin {
            animation: spin 8s linear reverse infinite;
        }
      `}</style>

    </div>
  );
};

export default MaintenanceMode;

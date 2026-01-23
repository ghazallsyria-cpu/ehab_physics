
import React, { useEffect, useState, useRef } from 'react';
import anime from 'animejs';
import { MaintenanceSettings, AppBranding } from '../types';
import { Atom, Globe, Rocket, Zap, ShieldAlert, Sparkles, Activity } from 'lucide-react';
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
        if (!isExploding) triggerSupernova();
      } else {
        const seconds = Math.floor((diff / 1000) % 60);
        
        if (diff < 60000 && !isFinalMinute) {
            setIsFinalMinute(true);
        }

        if (diff < 60000 && seconds !== lastSecondRef.current) {
            lastSecondRef.current = seconds;
            animateQuantumPulse(diff);
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

  const animateQuantumPulse = (remainingMs: number) => {
    const intensity = Math.max(1, (60000 - remainingMs) / 4000);

    // نبض الرقم الضخم
    anime({
        targets: '.final-digit',
        opacity: [0, 1, 0.5, 0],
        scale: [0.2, 1.8],
        filter: ['blur(30px)', 'blur(0px)', 'blur(10px)', 'blur(50px)'],
        easing: 'easeOutExpo',
        duration: 950
    });
    
    // اهتزاز المنظومة بالكامل
    anime({
        targets: '.maintenance-quantum-core',
        translateX: () => anime.random(-intensity * 2, intensity * 2),
        translateY: () => anime.random(-intensity * 2, intensity * 2),
        rotate: () => anime.random(-intensity/5, intensity/5),
        duration: 40,
        direction: 'alternate'
    });
  };

  const triggerSupernova = () => {
    setIsExploding(true);
    
    const tl = anime.timeline({
        easing: 'easeOutQuart'
    });

    // 1. مرحلة الانهيار الداخلي (Implosion)
    tl.add({
        targets: '.final-digit, .status-badge, .footer-hud',
        scale: 0,
        opacity: 0,
        filter: 'blur(20px)',
        duration: 300,
        easing: 'easeInBack'
    }).add({
        targets: '.big-bang-center',
        scale: [0, 1],
        opacity: [0, 1],
        duration: 200,
        backgroundColor: '#fff'
    })
    // 2. الانفجار العظيم (Expansion)
    .add({
        targets: '.shockwave-ring',
        scale: [1, 25],
        opacity: [1, 0],
        borderWidth: ['20px', '0px'],
        duration: 1500,
        delay: anime.stagger(100),
        easing: 'easeOutExpo',
        offset: '-=100'
    }).add({
        targets: '.quantum-particle',
        translateX: () => anime.random(-window.innerWidth, window.innerWidth),
        translateY: () => anime.random(-window.innerHeight, window.innerHeight),
        scale: () => [anime.random(2, 5), 0],
        opacity: [1, 0],
        duration: 2000,
        delay: anime.stagger(2),
        offset: '-=1200'
    })
    // 3. الوميض النهائي القاتل (The White-out)
    .add({
        targets: '.final-flash-layer',
        opacity: [0, 1],
        duration: 600,
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
    <div ref={containerRef} className={`fixed inset-0 z-[9999] flex flex-col items-center justify-center font-['Tajawal'] text-white overflow-hidden transition-colors duration-1000 maintenance-quantum-core ${isFinalMinute ? 'bg-black' : 'bg-[#000407]'}`} dir="rtl">
      
      {/* شبكة ليزر خلفية في وضع الدقيقة الأخيرة */}
      {isFinalMinute && !isExploding && (
        <div className="absolute inset-0 opacity-10 pointer-events-none" style={{ backgroundImage: 'radial-gradient(circle at 2px 2px, #f00 1px, transparent 0)', backgroundSize: '40px 40px' }}></div>
      )}

      <div className="relative z-10 w-full flex flex-col items-center text-center px-6">
        
        {!isFinalMinute ? (
            <div className="animate-fadeIn space-y-12">
                <div className="relative inline-block">
                    <div className="absolute inset-[-50px] border-2 border-blue-500/5 rounded-full animate-ping"></div>
                    <div className="w-44 h-44 bg-white/5 border border-white/10 rounded-[60px] flex items-center justify-center shadow-3xl relative overflow-hidden backdrop-blur-2xl group">
                        {branding?.logoUrl ? <img src={branding.logoUrl} className="w-2/3 h-2/3 object-contain" alt="Logo" /> : <Atom size={90} className="text-blue-400 animate-spin-slow" />}
                    </div>
                </div>

                <div className="space-y-6">
                    <h1 className="text-6xl md:text-8xl font-black italic tracking-tighter uppercase leading-none">
                        تحديث <span className="text-blue-500">كوانتومي</span>
                    </h1>
                    <p className="text-gray-500 max-w-2xl mx-auto text-xl leading-relaxed font-bold opacity-80 italic">
                        "{settings.maintenanceMessage}"
                    </p>
                </div>

                {settings.showCountdown && (
                    <div className="flex gap-4 md:gap-12 justify-center">
                        {[
                            { v: timeLeft.d, l: 'D' },
                            { v: timeLeft.h, l: 'H' },
                            { v: timeLeft.m, l: 'M' },
                            { v: timeLeft.s, l: 'S' }
                        ].map((t, i) => (
                            <div key={i} className="flex flex-col items-center">
                                <div className="w-24 h-28 md:w-36 md:h-44 bg-white/[0.03] border border-white/10 rounded-[40px] flex items-center justify-center backdrop-blur-3xl shadow-2xl">
                                    <span className="text-5xl md:text-8xl font-black tabular-nums">{String(t.v).padStart(2, '0')}</span>
                                </div>
                                <span className="text-[12px] font-black text-blue-500 uppercase mt-4 tracking-[0.5em] opacity-40">{t.l}</span>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        ) : (
            <div className="flex flex-col items-center justify-center min-h-screen w-full relative">
                <div className="status-badge mb-24 transition-transform">
                    <div className="flex items-center gap-4 px-12 py-4 bg-red-600/10 border-2 border-red-600 text-red-500 rounded-full shadow-[0_0_60px_rgba(220,38,38,0.3)]">
                        <Activity size={24} className="animate-pulse" />
                        <span className="text-lg font-black uppercase tracking-[0.5em]">System Meltdown Imminent</span>
                    </div>
                </div>
                
                <div className="relative h-[600px] w-full flex items-center justify-center">
                    {/* الرقم العملاق الذي يملأ الشاشة */}
                    <div className="final-digit text-[35rem] md:text-[55rem] font-black leading-none tabular-nums text-red-600 drop-shadow-[0_0_150px_rgba(220,38,38,1)] opacity-0 select-none italic">
                        {timeLeft.s}
                    </div>

                    {/* دوائر طاقة مركزية */}
                    <div className="absolute w-[800px] h-[800px] border-[1px] border-red-600/10 rounded-full animate-spin-slow"></div>
                    <div className="absolute w-[600px] h-[600px] border-[2px] border-red-600/20 rounded-full animate-reverse-spin"></div>
                </div>

                <div className="mt-32 space-y-4">
                    <p className="text-gray-600 text-2xl font-black uppercase tracking-[1em] animate-pulse">
                        Ignition <span className="text-white">Sequence</span>
                    </p>
                </div>
            </div>
        )}
      </div>

      {/* 💥 محرك الانفجار العظيم V12.7 (Big Bang Engine) */}
      {isExploding && (
          <div className="fixed inset-0 z-[10000] flex items-center justify-center pointer-events-none">
            {/* نواة الانفجار */}
            <div className="big-bang-center absolute w-10 h-10 bg-white rounded-full shadow-[0_0_100px_#fff] z-[10001]"></div>
            
            {/* موجات الصدمة المتعددة */}
            {Array.from({length: 10}).map((_, i) => (
                <div 
                    key={i} 
                    className="shockwave-ring absolute w-20 h-20 border-[20px] rounded-full opacity-0"
                    style={{ borderColor: i % 2 === 0 ? '#3b82f6' : '#fff' }}
                ></div>
            ))}
            
            {/* إعصار الجسيمات الكوانتومية */}
            {Array.from({length: 300}).map((_, i) => (
                <div 
                    key={i} 
                    className="quantum-particle absolute w-1 h-1 rounded-full"
                    style={{ 
                        background: i % 4 === 0 ? '#fff' : i % 4 === 1 ? '#3b82f6' : i % 4 === 2 ? '#f00' : '#fbbf24',
                        boxShadow: `0 0 15px ${i % 4 === 0 ? '#fff' : i % 4 === 1 ? '#3b82f6' : '#fbbf24'}`
                    }}
                ></div>
            ))}
            
            {/* طبقة الوميض النهائي التي تمحو كل شيء */}
            <div className="final-flash-layer absolute inset-0 bg-white opacity-0 z-[10005]"></div>
          </div>
      )}

      {/* HUD المعلوماتي في الأسفل */}
      <div className="footer-hud absolute bottom-12 w-full px-20 flex justify-between items-center opacity-30 pointer-events-none">
         <div className="flex items-center gap-6">
             <Zap size={20} className="text-amber-400" />
             <p className="text-[12px] font-black uppercase tracking-[0.6em]">Core Release Protocol v12.7</p>
         </div>
         <div className="flex gap-8">
             <Activity size={18} />
             <Rocket size={18} />
             <Globe size={18} />
         </div>
      </div>

      <button onClick={handleAdminEnter} className="fixed bottom-4 left-4 text-[8px] font-black text-gray-900 opacity-5 hover:opacity-100 hover:text-red-500 transition-all z-[10006]">
        MANUAL BYPASS
      </button>

      <style>{`
        .animate-reverse-spin {
            animation: spin 15s linear reverse infinite;
        }
        @keyframes spin {
            from { transform: rotate(0deg); }
            to { transform: rotate(360deg); }
        }
        .text-glow {
            text-shadow: 0 0 20px rgba(59, 130, 246, 0.5);
        }
      `}</style>

    </div>
  );
};

export default MaintenanceMode;

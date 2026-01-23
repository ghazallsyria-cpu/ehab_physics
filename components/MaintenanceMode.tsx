
import React, { useEffect, useState } from 'react';
import anime from 'animejs';
import { MaintenanceSettings, AppBranding } from '../types';
import { RefreshCw, Atom, ShieldCheck, Timer, Zap, Sparkles, Orbit, Lock, ShieldAlert, Globe } from 'lucide-react';
import { dbService } from '../services/db';

const MaintenanceMode: React.FC = () => {
  const [settings, setSettings] = useState<MaintenanceSettings | null>(null);
  const [branding, setBranding] = useState<AppBranding | null>(null);
  const [timeLeft, setTimeLeft] = useState({ d: 0, h: 0, m: 0, s: 0 });
  const [showSecretLink, setShowSecretLink] = useState(false);
  const [serverTimeOffset, setServerTimeOffset] = useState(0); // الفرق بين وقت الجهاز والوقت العالمي

  useEffect(() => {
    // 1. جلب الوقت العالمي الحقيقي لمزامنة العداد ومنع الغش
    const syncTime = async () => {
        try {
            const start = Date.now();
            const response = await fetch('https://worldtimeapi.org/api/timezone/Etc/UTC');
            const data = await response.json();
            const realNow = new Date(data.utc_datetime).getTime();
            const latency = Date.now() - start;
            // حساب الفرق بين ساعة الجهاز والوقت الحقيقي
            setServerTimeOffset(realNow - (Date.now() - latency/2));
        } catch (e) {
            console.warn("Time Sync Failed, using local clock as fallback.");
        }
    };
    syncTime();

    // 📡 مراقبة لحظية للإعدادات
    const unsubscribe = dbService.subscribeToMaintenance((updated) => {
        setSettings(updated);
    });

    dbService.getAppBranding().then(setBranding);

    // تفعيل الرابط السري إذا كان المفتاح موجوداً في المتصفح
    if (localStorage.getItem('ssc_bypass_key') === 'true') {
        setShowSecretLink(true);
    }

    // أنيميشن الخلفية
    anime({
      targets: '.bg-particle',
      translateX: () => anime.random(-50, 50),
      translateY: () => anime.random(-50, 50),
      opacity: [0.1, 0.4, 0.1],
      duration: () => anime.random(3000, 6000),
      loop: true,
      easing: 'easeInOutQuad'
    });

    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (!settings?.expectedReturnTime || !settings.showCountdown) return;

    const timer = setInterval(() => {
      const target = new Date(settings.expectedReturnTime).getTime();
      // استخدام الوقت الحقيقي (وقت الجهاز + الفرق المحسوب)
      const now = Date.now() + serverTimeOffset;
      const diff = target - now;

      if (diff <= 0) {
        setTimeLeft({ d: 0, h: 0, m: 0, s: 0 });
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
  }, [settings, serverTimeOffset]);

  const TimeBlock = ({ value, label }: { value: number, label: string }) => (
    <div className="flex flex-col items-center">
        <div className="w-16 h-20 md:w-24 md:h-28 bg-white/[0.03] border border-white/10 rounded-[25px] flex items-center justify-center backdrop-blur-3xl shadow-2xl relative overflow-hidden group">
            <div className="absolute top-0 left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-white/20 to-transparent"></div>
            <span className="text-3xl md:text-5xl font-black text-white tabular-nums tracking-tighter drop-shadow-[0_0_15px_rgba(255,255,255,0.2)]">
                {String(value).padStart(2, '0')}
            </span>
        </div>
        <div className="mt-3">
            <p className="text-[8px] font-black text-gray-600 uppercase tracking-[0.2em] italic">{label}</p>
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
        <div className="relative mb-10">
            <div className="absolute inset-[-30px] border-2 border-blue-500/5 rounded-full animate-spin-slow"></div>
            <div className="w-28 h-28 md:w-36 md:h-36 bg-[#0a1118] border-2 border-white/5 rounded-[45px] flex items-center justify-center shadow-[0_0_100px_rgba(59,130,246,0.05)] relative group">
                {branding?.logoUrl ? <img src={branding.logoUrl} className="w-2/3 h-2/3 object-contain pointer-events-none" alt="Logo" /> : <Atom size={60} className="text-blue-400 animate-spin-slow" />}
            </div>
        </div>

        <div className="text-center mb-12 space-y-4">
            <div className="inline-flex items-center gap-2 bg-blue-500/5 px-4 py-1.5 rounded-full border border-blue-500/10 mb-2">
                <Globe size={12} className="text-blue-400 animate-pulse" />
                <span className="text-[8px] font-black text-blue-400 uppercase tracking-widest italic">Global Server Time Synced</span>
            </div>
            <h1 className="text-4xl md:text-7xl font-black text-white tracking-tighter leading-tight italic uppercase">
                قيد <span className="text-blue-400 drop-shadow-[0_0_30px_rgba(59,130,246,0.4)]">التطوير</span>
            </h1>
            <p className="text-base md:text-lg text-gray-500 max-w-lg mx-auto leading-relaxed font-medium italic opacity-70">
                {settings.maintenanceMessage}
            </p>
        </div>

        {settings.showCountdown && (
            <div className="flex gap-4 md:gap-6 mb-16 animate-slideUp">
                <TimeBlock value={timeLeft.d} label="أيام" />
                <TimeBlock value={timeLeft.h} label="ساعات" />
                <TimeBlock value={timeLeft.m} label="دقائق" />
                <TimeBlock value={timeLeft.s} label="ثواني" />
            </div>
        )}

        <div className="flex flex-col items-center gap-6">
            <div className="flex items-center gap-4 bg-white/[0.02] border border-white/5 px-8 py-4 rounded-[25px] shadow-inner backdrop-blur-md">
                <div className="w-10 h-10 bg-blue-500/10 rounded-xl flex items-center justify-center text-blue-400"><Timer size={20} /></div>
                <div className="text-right">
                    <p className="text-[8px] font-black text-gray-600 uppercase tracking-widest">موعد الافتتاح</p>
                    <p className="text-xs font-black text-white tabular-nums">
                        {new Date(settings.expectedReturnTime).toLocaleDateString('ar-KW', { day: 'numeric', month: 'long' })} | {new Date(settings.expectedReturnTime).toLocaleTimeString('ar-KW', { hour: '2-digit', minute: '2-digit' })}
                    </p>
                </div>
            </div>
        </div>
      </div>

      {/* 🗝️ رابط الدخول المكتوم للمدير - زاوية يمنى سفلية */}
      <div className="fixed bottom-4 right-6 z-[10000]">
          {showSecretLink ? (
              <button 
                  onClick={() => window.dispatchEvent(new CustomEvent('change-view', { detail: { view: 'auth' } }))}
                  className="group flex items-center gap-2 opacity-10 hover:opacity-100 transition-all duration-500"
              >
                  <span className="text-[9px] font-black text-white uppercase tracking-widest hidden group-hover:block animate-fadeIn">Admin Direct Access</span>
                  <ShieldCheck size={14} className="text-blue-500" />
              </button>
          ) : (
              <div 
                  onClick={() => {
                      // تفعيل الرابط بعد 5 نقرات على "الهواء" في الزاوية
                      const clicks = Number(sessionStorage.getItem('secret_clicks') || 0) + 1;
                      sessionStorage.setItem('secret_clicks', clicks.toString());
                      if (clicks >= 5) {
                          localStorage.setItem('ssc_bypass_key', 'true');
                          setShowSecretLink(true);
                          if ("vibrate" in navigator) navigator.vibrate(100);
                      }
                  }}
                  className="w-8 h-8 cursor-default"
              ></div>
          )}
      </div>

      <footer className="absolute bottom-6 w-full px-12 flex justify-between items-center opacity-20 pointer-events-none">
         <p className="text-[7px] font-black uppercase tracking-[0.4em]">Syrian Science Center • Quantum Core v3.0</p>
         <div className="flex gap-4"><Sparkles size={12} className="text-blue-500/50" /><Orbit size={12} className="text-cyan-500/50" /></div>
      </footer>
    </div>
  );
};

export default MaintenanceMode;

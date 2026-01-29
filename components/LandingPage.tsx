
import React, { useEffect, useRef, useState } from 'react';
import anime from 'animejs';
import { dbService } from '../services/db';
import { ChevronLeft, GraduationCap, Users, RefreshCw, UserCheck, Briefcase, User, Target, Zap, Activity } from 'lucide-react';
import HeroSection from './HeroSection';

interface LandingPageProps {
  onStart: () => void;
}

const LandingPage: React.FC<LandingPageProps> = ({ onStart }) => {
  const [stats, setStats] = useState({ totalStudents: 0, maleStudents: 0, femaleStudents: 0, totalTeachers: 0, total: 0 });
  
  // نستخدم حالة للتأكد من تحميل الصفحة بالكامل قبل تشغيل الانيميشن الثقيل
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
    
    // 📡 الاشتراك في الإحصائيات (آمن ولا يسبب تعليق)
    const unsubscribe = dbService.subscribeToGlobalStats((updatedStats) => {
        setStats(updatedStats);
    });

    // ✨ أنيميشن الخلفية - يتم تشغيله فقط بعد التأكد من وجود العناصر
    const timer = setTimeout(() => {
        try {
            const particlesContainer = document.querySelector('.particles');
            if (particlesContainer) {
              particlesContainer.innerHTML = '';
              for (let i = 0; i < 40; i++) { // تقليل العدد لتحسين الأداء
                const dot = document.createElement('div');
                const size = Math.random() * 3;
                dot.style.cssText = `width: ${size}px; height: ${size}px; left: ${Math.random() * 100}vw; top: ${Math.random() * 100}vh; position: absolute; background: #38bdf8; border-radius: 50%; opacity: 0; pointer-events: none;`;
                particlesContainer.appendChild(dot);
                
                (anime as any)({ 
                    targets: dot, 
                    opacity: [0, 0.4, 0], 
                    translateY: [0, (anime as any).random(-100, 100)],
                    scale: [0, 1.5, 0], 
                    duration: (anime as any).random(3000, 8000), 
                    loop: true, 
                    delay: (anime as any).random(0, 2000),
                    easing: 'easeInOutQuad'
                });
              }
            }
        } catch (e) {
            console.warn("Animation warning:", e);
        }
    }, 500);

    return () => {
        unsubscribe();
        clearTimeout(timer);
    };
  }, []);

  const StatCard = ({ value, label, icon: Icon, color, glowColor }: any) => {
    return (
        <div className={`group relative p-1 bg-gradient-to-br from-white/10 to-transparent rounded-[45px] transition-all duration-500 hover:scale-[1.02] hover:-translate-y-1 shadow-2xl overflow-hidden animate-fadeIn`}>
            <div className={`absolute inset-0 opacity-0 group-hover:opacity-20 transition-opacity duration-700 blur-[60px] ${glowColor}`}></div>
            
            <div className="relative bg-[#050a10]/80 backdrop-blur-3xl rounded-[44px] p-8 md:p-10 h-full border border-white/5 flex flex-col items-center text-center">
                <div className={`relative w-16 h-16 mb-6 flex items-center justify-center rounded-[25px] ${color} shadow-2xl group-hover:rotate-[10deg] transition-all duration-500`}>
                    <Icon size={28} className="text-white relative z-10" />
                </div>

                <div className="space-y-1">
                    <div className="flex items-center justify-center gap-1">
                        <span className="text-4xl md:text-5xl font-black text-white tabular-nums tracking-tighter">
                            {value > 0 ? value.toLocaleString() : '...'}
                        </span>
                        <span className="text-xl font-black text-blue-400 mb-2">+</span>
                    </div>
                    <h4 className="text-[10px] font-black text-gray-500 uppercase tracking-[0.3em] mt-2 group-hover:text-blue-400 transition-colors">{label}</h4>
                </div>
            </div>
        </div>
    );
  };

  return (
    <div className="relative min-h-screen w-full bg-[#000] overflow-x-hidden font-['Tajawal'] text-right" dir="rtl">
      
      <HeroSection />

      <div className="relative z-10 w-full flex flex-col">
        
        <div className="min-h-screen flex flex-col items-center justify-center p-6 text-center animate-fadeIn">
            
            <div className="mb-10 animate-float">
               <div className="w-24 h-24 bg-white/10 backdrop-blur-md rounded-[35px] border border-white/20 flex items-center justify-center shadow-[0_0_60px_rgba(56,189,248,0.3)]">
                  <span className="text-5xl">⚛️</span>
               </div>
            </div>

            <h1 className="text-5xl md:text-8xl font-black text-white tracking-tighter mb-6 drop-shadow-2xl leading-none">
                الفيزياء <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-cyan-300">الحديثة</span>
            </h1>
            <p className="text-lg md:text-2xl text-gray-300 font-medium max-w-2xl leading-relaxed drop-shadow-md mb-12">
                منصة تعليمية متطورة تدمج الذكاء الاصطناعي مع المنهج الكويتي لتجربة تعليمية لا مثيل لها.
            </p>

            <button onClick={onStart} className="group relative px-12 py-5 bg-white/10 backdrop-blur-xl border border-white/20 text-white rounded-full font-black text-lg uppercase transition-all duration-300 hover:bg-[#38bdf8] hover:text-black hover:border-[#38bdf8] shadow-[0_0_40px_rgba(56,189,248,0.2)] hover:shadow-[0_0_80px_rgba(56,189,248,0.6)] active:scale-95">
                <span className="relative z-10 flex items-center gap-4">
                    دخول المنصة <ChevronLeft className="group-hover:-translate-x-2 transition-transform duration-300" size={24} />
                </span>
            </button>

            <div className="absolute bottom-10 animate-bounce text-white/50 hidden md:block">
               <span className="text-xs font-black uppercase tracking-[0.3em]">اكتشف الإحصائيات</span>
               <div className="w-[1px] h-12 bg-gradient-to-b from-white/50 to-transparent mx-auto mt-4"></div>
            </div>
        </div>

        <div className="w-full bg-gradient-to-b from-transparent via-[#000000]/90 to-[#000000] pb-32 pt-10">
            <div className="absolute inset-0 pointer-events-none">
                <div className="particles absolute inset-0 z-0"></div>
            </div>

            <div className="max-w-7xl mx-auto px-6 relative z-10">
                <div className="flex flex-col md:flex-row justify-between items-end mb-16 gap-6 px-4">
                    <div className="text-right">
                        <div className="inline-flex items-center gap-3 px-6 py-2 bg-blue-500/10 border border-blue-500/20 rounded-full text-[10px] font-black text-blue-400 uppercase tracking-[0.5em] mb-6">
                        <Activity size={14} className="animate-pulse" /> Live Cloud Node Active
                        </div>
                        <h2 className="text-4xl md:text-6xl font-black text-white italic leading-none tracking-tighter">النمو <span className="text-blue-500">الرقمي</span></h2>
                    </div>
                </div>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 px-4">
                    <StatCard value={stats.maleStudents} label="الطلاب (بنين)" icon={User} color="bg-blue-600" glowColor="bg-blue-600" />
                    <StatCard value={stats.femaleStudents} label="الطالبات (بنات)" icon={User} color="bg-pink-600" glowColor="bg-pink-600" />
                    <StatCard value={stats.totalTeachers} label="الطاقم الأكاديمي" icon={Briefcase} color="bg-amber-600" glowColor="bg-amber-600" />
                    <StatCard value={stats.totalStudents} label="إجمالي المسجلين" icon={UserCheck} color="bg-emerald-600" glowColor="bg-emerald-600" />
                </div>
            </div>
        </div>
      </div>
    </div>
  );
};

export default LandingPage;

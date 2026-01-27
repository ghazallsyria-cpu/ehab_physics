
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
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // 📡 الاشتراك في الإحصائيات اللحظية (V14)
    const unsubscribe = dbService.subscribeToGlobalStats((updatedStats) => {
        setStats(updatedStats);
        setIsLoading(false);
    });

    // ✨ أنيميشن الخلفية (للأقسام السفلية)
    const particlesContainer = document.querySelector('.particles');
    if (particlesContainer) {
      particlesContainer.innerHTML = '';
      for (let i = 0; i < 50; i++) {
        const dot = document.createElement('div');
        const size = Math.random() * 2 + 1;
        dot.style.cssText = `width: ${size}px; height: ${size}px; left: ${Math.random() * 100}vw; top: ${Math.random() * 100}vh; position: absolute; background: #38bdf8; border-radius: 50%; opacity: 0; pointer-events: none;`;
        particlesContainer.appendChild(dot);
        (anime as any)({ 
            targets: dot, 
            opacity: [0, 0.6, 0], 
            translateY: [0, (anime as any).random(-100, 100)],
            scale: [0, 2, 0], 
            duration: (anime as any).random(4000, 9000), 
            loop: true, 
            delay: (anime as any).random(0, 3000),
            easing: 'easeInOutQuad'
        });
      }
    }

    // تعديل الأنيميشن ليتناسب مع التصميم الجديد
    const tl = (anime as any).timeline({ easing: 'easeOutExpo' });
    tl.add({ 
        targets: '.stats-card-main', 
        opacity: [0, 1], 
        scale: [0.8, 1],
        translateY: [40, 0], 
        delay: (anime as any).stagger(150), 
        duration: 1000 
      })
      .add({
        targets: '.enter-button-container',
        opacity: [0, 1],
        translateY: [20, 0],
        duration: 800
      }, '-=500');

    return () => unsubscribe();
  }, []);

  const StatCard = ({ value, label, icon: Icon, color, glowColor }: any) => {
    const counterRef = useRef<HTMLSpanElement>(null);
    const prevValue = useRef(0);
    
    useEffect(() => {
        if (counterRef.current) {
            const obj = { val: prevValue.current };
            (anime as any)({
                targets: obj,
                val: value,
                round: 1,
                easing: 'easeOutExpo',
                duration: 2000,
                update: () => {
                    if (counterRef.current) counterRef.current.innerText = obj.val.toLocaleString();
                }
            });
            if (value > prevValue.current) {
                (anime as any)({
                    targets: counterRef.current,
                    scale: [1, 1.2, 1],
                    color: ['#fff', '#38bdf8', '#fff'],
                    duration: 800,
                    easing: 'easeOutElastic(1, .5)'
                });
            }
            prevValue.current = value;
        }
    }, [value]);

    return (
        <div className={`stats-card-main group relative p-1 bg-gradient-to-br from-white/10 to-transparent rounded-[45px] transition-all duration-500 hover:scale-[1.05] hover:-translate-y-2 opacity-0 shadow-2xl overflow-hidden`}>
            <div className={`absolute inset-0 opacity-0 group-hover:opacity-20 transition-opacity duration-700 blur-[60px] ${glowColor}`}></div>
            
            <div className="relative bg-[#050a10]/80 backdrop-blur-3xl rounded-[44px] p-8 md:p-10 h-full border border-white/5 flex flex-col items-center text-center">
                <div className={`relative w-20 h-20 mb-8 flex items-center justify-center rounded-[30px] ${color} shadow-2xl group-hover:rotate-[10deg] transition-all duration-500`}>
                    <div className="absolute inset-0 opacity-40 blur-xl bg-inherit rounded-full animate-pulse"></div>
                    <Icon size={32} className="text-white relative z-10" />
                    <div className="absolute -top-1 -right-1 w-4 h-4 bg-white rounded-full border-4 border-[#050a10] group-hover:scale-125 transition-transform"></div>
                </div>

                <div className="space-y-1">
                    <div className="flex items-center justify-center gap-1">
                        <span ref={counterRef} className="text-5xl md:text-6xl font-black text-white tabular-nums tracking-tighter">0</span>
                        <span className="text-2xl font-black text-blue-400 mb-4 animate-bounce">+</span>
                    </div>
                    <h4 className="text-[11px] font-black text-gray-500 uppercase tracking-[0.4em] mt-2 group-hover:text-blue-400 transition-colors">{label}</h4>
                </div>

                <div className="mt-8 w-12 h-1 bg-white/5 rounded-full overflow-hidden">
                    <div className={`h-full w-0 group-hover:w-full transition-all duration-1000 ${color.split(' ')[0]}`}></div>
                </div>
            </div>
        </div>
    );
  };

  return (
    <div className="relative min-h-screen w-full bg-[#000] overflow-x-hidden font-['Tajawal'] text-right" dir="rtl">
      
      {/* 1. Hero Section (Fixed Background Video) */}
      <HeroSection />

      {/* 2. Content Overlay */}
      <div className="relative z-10 w-full flex flex-col">
        
        {/* Full Screen Welcome Area */}
        <div className="min-h-screen flex flex-col items-center justify-center p-6 text-center">
            
            {/* Logo or Title Placeholder */}
            <div className="mb-12 animate-float">
               <div className="w-24 h-24 bg-white/10 backdrop-blur-md rounded-[35px] border border-white/20 flex items-center justify-center shadow-[0_0_60px_rgba(56,189,248,0.3)]">
                  <span className="text-5xl">⚛️</span>
               </div>
            </div>

            <h1 className="text-6xl md:text-8xl font-black text-white tracking-tighter mb-6 drop-shadow-2xl leading-none">
                الفيزياء <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-cyan-300">الحديثة</span>
            </h1>
            <p className="text-xl md:text-2xl text-gray-300 font-medium max-w-2xl leading-relaxed drop-shadow-md mb-12">
                منصة تعليمية متطورة تدمج الذكاء الاصطناعي مع المنهج الكويتي لتجربة تعليمية لا مثيل لها.
            </p>

            {/* زر الدخول للمنصة */}
            <div className="enter-button-container opacity-0">
                <button onClick={onStart} className="group relative px-16 py-6 bg-white/10 backdrop-blur-xl border border-white/20 text-white rounded-full font-black text-xl uppercase transition-all duration-500 hover:bg-[#38bdf8] hover:text-black hover:border-[#38bdf8] shadow-[0_0_40px_rgba(56,189,248,0.2)] hover:shadow-[0_0_80px_rgba(56,189,248,0.6)] active:scale-95">
                <span className="relative z-10 flex items-center gap-4">
                    دخول المنصة <ChevronLeft className="group-hover:-translate-x-2 transition-transform duration-300" size={24} />
                </span>
                </button>
            </div>

            {/* Scroll Indicator */}
            <div className="absolute bottom-10 animate-bounce text-white/50">
               <span className="text-xs font-black uppercase tracking-[0.3em]">اكتشف الإحصائيات</span>
               <div className="w-[1px] h-12 bg-gradient-to-b from-white/50 to-transparent mx-auto mt-4"></div>
            </div>
        </div>

        {/* Stats Section (Scrolls over the video) */}
        <div className="w-full bg-gradient-to-b from-transparent via-[#000000]/90 to-[#000000] pb-40 pt-20">
            <div className="absolute inset-0 pointer-events-none">
                <div className="particles absolute inset-0 z-0"></div>
            </div>

            <div className="max-w-7xl mx-auto px-6 relative z-10">
                <div className="flex flex-col md:flex-row justify-between items-end mb-16 gap-6 px-4">
                    <div className="text-right">
                        <div className="inline-flex items-center gap-3 px-6 py-2 bg-blue-500/10 border border-blue-500/20 rounded-full text-[10px] font-black text-blue-400 uppercase tracking-[0.5em] mb-6">
                        <Activity size={14} className="animate-pulse" /> Live Cloud Node Active
                        </div>
                        <h2 className="text-5xl md:text-7xl font-black text-white italic leading-none tracking-tighter">النمو <span className="text-blue-500">الرقمي</span></h2>
                        <p className="text-gray-500 mt-4 font-bold text-xl">مراقبة حية لأعداد المجتمع التعليمي</p>
                    </div>
                </div>
                
                {/* Grid for Stats Cards */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8 px-4">
                    <StatCard 
                        value={stats.maleStudents} 
                        label="الطلاب (بنين)" 
                        icon={User} 
                        color="bg-gradient-to-br from-blue-600 to-blue-400" 
                        glowColor="bg-blue-500"
                    />
                    <StatCard 
                        value={stats.femaleStudents} 
                        label="الطالبات (بنات)" 
                        icon={User} 
                        color="bg-gradient-to-br from-pink-600 to-pink-400" 
                        glowColor="bg-pink-500"
                    />
                    <StatCard 
                        value={stats.totalTeachers} 
                        label="الطاقم الأكاديمي" 
                        icon={Briefcase} 
                        color="bg-gradient-to-br from-amber-600 to-amber-400" 
                        glowColor="bg-amber-500"
                    />
                    <StatCard 
                        value={stats.totalStudents} 
                        label="إجمالي المسجلين" 
                        icon={UserCheck} 
                        color="bg-gradient-to-br from-emerald-600 to-emerald-400" 
                        glowColor="bg-emerald-500"
                    />
                </div>
                
                {/* "Live Community" Large Card */}
                <div className="stats-card-main mt-16 p-1 bg-gradient-to-r from-blue-500/20 via-transparent to-amber-500/20 rounded-[50px] opacity-0">
                    <div className="bg-[#050a10]/60 backdrop-blur-2xl rounded-[49px] p-10 flex flex-col md:flex-row items-center justify-center gap-12 border border-white/5">
                        <div className="flex items-center gap-6">
                            <div className="w-16 h-16 bg-white/5 rounded-3xl flex items-center justify-center text-blue-400 border border-white/10 shadow-inner">
                                <Zap size={32} fill="currentColor" className="animate-pulse" />
                            </div>
                            <p className="text-gray-400 font-black text-2xl uppercase tracking-widest">المجتمع النشط:</p>
                        </div>
                        
                        <div className="flex items-baseline gap-4">
                            {isLoading ? (
                            <RefreshCw className="animate-spin text-blue-400" size={40} />
                            ) : (
                            <div className="flex flex-col items-center">
                                <span className="text-7xl md:text-9xl font-black text-transparent bg-clip-text bg-gradient-to-b from-white to-gray-600 tabular-nums leading-none tracking-tighter">
                                    {stats.total}
                                </span>
                                <div className="w-full h-1 bg-gradient-to-r from-transparent via-blue-500 to-transparent mt-2"></div>
                            </div>
                            )}
                            <span className="text-2xl font-black text-blue-400 uppercase tracking-[0.5em]">Member</span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
      </div>
    </div>
  );
};

export default LandingPage;

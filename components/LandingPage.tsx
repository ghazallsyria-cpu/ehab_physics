
import React, { useEffect, useRef, useState } from 'react';
import anime from 'animejs';
import { dbService } from '../services/db';
import { ChevronLeft, GraduationCap, Users, RefreshCw, UserCheck, Briefcase, User, Target, Zap, Activity } from 'lucide-react';

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

    // ✨ أنيميشن الخلفية
    const particlesContainer = document.querySelector('.particles');
    if (particlesContainer) {
      particlesContainer.innerHTML = '';
      for (let i = 0; i < 50; i++) {
        const dot = document.createElement('div');
        const size = Math.random() * 2 + 1;
        dot.style.cssText = `width: ${size}px; height: ${size}px; left: ${Math.random() * 100}vw; top: ${Math.random() * 100}vh; position: absolute; background: #38bdf8; border-radius: 50%; opacity: 0; pointer-events: none;`;
        particlesContainer.appendChild(dot);
        anime({ 
            targets: dot, 
            opacity: [0, 0.6, 0], 
            translateY: [0, anime.random(-100, 100)],
            scale: [0, 2, 0], 
            duration: anime.random(4000, 9000), 
            loop: true, 
            delay: anime.random(0, 3000),
            easing: 'easeInOutQuad'
        });
      }
    }

    const tl = anime.timeline({ easing: 'easeOutExpo' });
    tl.add({ targets: '.logo-main', scale: [0, 1], opacity: [0, 1], duration: 1500 })
      .add({ targets: '.title-reveal', opacity: [0, 1], translateY: [30, 0], delay: anime.stagger(200), duration: 1200, offset: '-=1000' })
      .add({ 
        targets: '.stats-card-main', 
        opacity: [0, 1], 
        scale: [0.8, 1],
        translateY: [40, 0], 
        delay: anime.stagger(150), 
        duration: 1000, 
        offset: '-=600' 
      });

    return () => unsubscribe();
  }, []);

  const StatCard = ({ value, label, icon: Icon, color, glowColor }: any) => {
    const counterRef = useRef<HTMLSpanElement>(null);
    const prevValue = useRef(0);
    
    useEffect(() => {
        if (counterRef.current) {
            // تنفيذ الأنيميشن من القيمة السابقة إلى الجديدة
            const obj = { val: prevValue.current };
            anime({
                targets: obj,
                val: value,
                round: 1,
                easing: 'easeOutExpo',
                duration: 2000,
                update: () => {
                    if (counterRef.current) counterRef.current.innerText = obj.val.toLocaleString();
                }
            });
            // إذا زادت القيمة (نشاط جديد)، أضف تأثير نبضة لوني
            if (value > prevValue.current) {
                anime({
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
    <div className="relative min-h-screen w-full bg-[#000205] overflow-x-hidden flex flex-col items-center font-['Tajawal'] pb-40 text-right" dir="rtl">
      <div className="absolute inset-0 pointer-events-none">
          <div className="particles absolute inset-0 z-0"></div>
          <div className="absolute top-[-10%] right-[-10%] w-[600px] h-[600px] bg-blue-600/10 rounded-full blur-[150px] animate-pulse"></div>
          <div className="absolute bottom-[-5%] left-[-5%] w-[500px] h-[500px] bg-amber-600/5 rounded-full blur-[120px]"></div>
      </div>

      <div className="hero-container relative z-10 text-center flex flex-col items-center px-6 pt-20">
        
        <div className="logo-system relative w-[280px] h-[280px] flex justify-center items-center mb-12">
            <div className="absolute inset-0 border-2 border-blue-500/10 rounded-full animate-spin-slow"></div>
            <div className="absolute inset-4 border border-blue-400/5 rounded-full animate-reverse-spin"></div>
            <img 
              src="https://spxlxypbosipfwbijbjk.supabase.co/storage/v1/object/public/assets/1769130153314_IMG_2848.png" 
              className="logo-main w-[180px] h-[180px] rounded-full z-10 opacity-0 shadow-[0_0_100px_rgba(56,189,248,0.2)] border-4 border-white/5" 
              alt="SSC Logo"
            />
        </div>

        <div className="space-y-6 mb-20">
            <h1 className="title-reveal text-6xl md:text-9xl font-black text-white leading-none tracking-tighter opacity-0">
                فيزياء <span className="text-transparent bg-clip-text bg-gradient-to-l from-blue-400 to-cyan-300">الكويت</span>
            </h1>
            <p className="title-reveal text-xl md:text-3xl text-slate-500 font-bold tracking-widest italic opacity-0">
                المركز السوري للعلوم • الريادة في التعليم الرقمي
            </p>
        </div>
        
        <div className="title-reveal opacity-0 mb-32">
            <button onClick={onStart} className="group relative px-20 py-8 bg-transparent overflow-hidden border-2 border-[#38bdf8] text-[#38bdf8] rounded-full font-black text-2xl uppercase transition-all duration-700 hover:text-black shadow-[0_0_50px_rgba(56,189,248,0.3)] active:scale-95">
              <span className="absolute inset-0 w-full h-full bg-[#38bdf8] -translate-x-full group-hover:translate-x-0 transition-transform duration-500 ease-out"></span>
              <span className="relative z-10 flex items-center gap-6">دخول المنصة <ChevronLeft className="group-hover:-translate-x-3 transition-transform duration-500" size={32} /></span>
            </button>
        </div>

        <div className="w-full max-w-7xl mx-auto">
            <div className="flex flex-col md:flex-row justify-between items-end mb-16 gap-6 px-4">
                <div className="text-right">
                    <div className="inline-flex items-center gap-3 px-6 py-2 bg-blue-500/10 border border-blue-500/20 rounded-full text-[10px] font-black text-blue-400 uppercase tracking-[0.5em] mb-6">
                       <Activity size={14} className="animate-pulse" /> Live Cloud Node Active
                    </div>
                    <h2 className="text-5xl md:text-7xl font-black text-white italic leading-none tracking-tighter">النمو <span className="text-blue-500">الرقمي</span></h2>
                    <p className="text-gray-600 mt-4 font-bold text-xl">مراقبة حية لأعداد المجتمع التعليمي</p>
                </div>
            </div>
            
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

      <style>{`
        @keyframes spin-slow {
            from { transform: rotate(0deg); }
            to { transform: rotate(360deg); }
        }
        @keyframes reverse-spin {
            from { transform: rotate(360deg); }
            to { transform: rotate(0deg); }
        }
        .animate-spin-slow {
            animation: spin-slow 20s linear infinite;
        }
        .animate-reverse-spin {
            animation: reverse-spin 15s linear infinite;
        }
      `}</style>
    </div>
  );
};

export default LandingPage;

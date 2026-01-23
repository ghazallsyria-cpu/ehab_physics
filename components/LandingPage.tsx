
import React, { useEffect, useRef, useState } from 'react';
import anime from 'animejs';
import { dbService } from '../services/db';
import { PaymentSettings } from '../types';
import { ChevronLeft, School, GraduationCap, Users, Globe, RefreshCw } from 'lucide-react';

interface LandingPageProps {
  onStart: () => void;
}

const LandingPage: React.FC<LandingPageProps> = ({ onStart }) => {
  const [gradeStats, setGradeStats] = useState({ grade10: 0, grade11: 0, grade12: 0, uni: 0, total: 0 });
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadData = async () => {
        try {
            const stats = await dbService.getStudentGradeStats();
            setGradeStats(stats);
        } catch (e) {
            console.error("Failed to load stats", e);
        } finally {
            setIsLoading(false);
        }
    };
    loadData();

    // أنيميشن الجزيئات الخلفية
    const particlesContainer = document.querySelector('.particles');
    if (particlesContainer) {
      particlesContainer.innerHTML = '';
      for (let i = 0; i < 60; i++) {
        const dot = document.createElement('div');
        dot.classList.add('particle');
        const size = Math.random() * 4 + 1;
        dot.style.cssText = `width: ${size}px; height: ${size}px; left: ${Math.random() * 100}vw; top: ${Math.random() * 100}vh; position: absolute; background: ${i % 3 === 0 ? '#38bdf8' : '#ffffff'}; border-radius: 50%; opacity: 0; pointer-events: none;`;
        particlesContainer.appendChild(dot);
        anime({ targets: dot, translateX: () => anime.random(-200, 200), translateY: () => anime.random(-200, 200), opacity: [0, 0.4, 0], scale: [0, 1.5, 0], duration: () => anime.random(3000, 8000), easing: 'easeInOutQuad', direction: 'alternate', loop: true, delay: anime.random(0, 2000) });
      }
    }

    // أنيميشن دخول الصفحة
    const tl = anime.timeline({ easing: 'easeOutExpo' });
    tl.add({ targets: '.logo-main', scale: [0, 1.2, 1], rotate: [-360, 0], opacity: [0, 1], duration: 2000, easing: 'easeOutElastic(1, .6)' })
      .add({ targets: '.title-reveal', opacity: [0, 1], translateY: [30, 0], filter: ['blur(10px)', 'blur(0px)'], duration: 1000, offset: '-=1000' })
      .add({ targets: '.stats-block', opacity: [0, 1], scale: [0.9, 1], delay: anime.stagger(150), duration: 1200, offset: '-=500' });

  }, []);

  const StudentCounter = ({ value, label, icon: Icon, color }: any) => {
    const counterRef = useRef<HTMLSpanElement>(null);
    const hasAnimated = useRef(false);
    
    useEffect(() => {
        if (!isLoading && counterRef.current && !hasAnimated.current) {
            const obj = { val: 0 };
            anime({
                targets: obj,
                val: value,
                round: 1,
                easing: 'easeOutExpo',
                duration: 3000,
                delay: 500,
                update: () => {
                    if (counterRef.current) counterRef.current.innerText = obj.val.toString();
                }
            });
            hasAnimated.current = true;
        }
    }, [isLoading, value]);

    return (
        <div className="stats-block glass-card p-10 rounded-[50px] border-white/5 bg-black/40 flex flex-col items-center group opacity-0 transition-all hover:border-blue-400/30">
            <div className={`w-16 h-16 rounded-[25px] flex items-center justify-center mb-6 transition-all duration-500 group-hover:scale-110 ${color} shadow-lg shadow-black/40`}>
                <Icon size={32} className="text-white" />
            </div>
            <div className="flex items-center gap-1">
                <span ref={counterRef} className="text-5xl font-black text-white tabular-nums">0</span>
                <span className="text-blue-400 font-black">+</span>
            </div>
            <p className="text-xs font-black text-gray-500 uppercase tracking-widest mt-2">{label}</p>
        </div>
    );
  };

  return (
    <div className="relative min-h-screen w-full bg-[#000000] overflow-x-hidden flex flex-col items-center font-['Tajawal'] pb-32" dir="rtl">
      <div className="particles absolute inset-0 pointer-events-none z-0"></div>

      {/* Hero Section */}
      <div className="hero-container relative z-10 text-center flex flex-col items-center px-4 pt-20 mb-20">
        <div className="logo-system relative w-[300px] h-[300px] md:w-[400px] md:h-[400px] flex justify-center items-center mb-8">
            <div className="absolute w-full h-full border-2 border-[#38bdf8]/20 rounded-full animate-spin-slow"></div>
            <img 
              src="https://spxlxypbosipfwbijbjk.supabase.co/storage/v1/object/public/assets/1769130153314_IMG_2848.png" 
              className="logo-main w-[200px] h-[200px] md:w-[240px] md:h-[240px] rounded-full z-10 opacity-0 shadow-[0_0_100px_rgba(56,189,248,0.2)]" 
              alt="SSC Logo"
            />
        </div>
        <h1 className="title-reveal text-5xl md:text-8xl font-black text-white leading-tight mb-4 opacity-0">المركز السوري للعلوم</h1>
        <p className="title-reveal text-lg md:text-3xl text-slate-400 font-medium tracking-widest mb-12 italic opacity-0">نحو مستقبل علمي مشرق</p>
        
        <div className="title-reveal opacity-0 mb-24">
            <button onClick={onStart} className="group relative px-20 py-8 bg-transparent overflow-hidden border-2 border-[#38bdf8] text-[#38bdf8] rounded-full font-black text-2xl uppercase transition-all duration-500 hover:text-black shadow-[0_0_40px_rgba(56,189,248,0.2)]">
              <span className="absolute inset-0 w-full h-full bg-[#38bdf8] -translate-x-full group-hover:translate-x-0 transition-transform duration-500"></span>
              <span className="relative z-10 flex items-center gap-4">دخول المنصة <ChevronLeft className="group-hover:-translate-x-2 transition-transform" /></span>
            </button>
        </div>

        {/* Real-time Student Distribution Stats */}
        <div className="w-full max-w-6xl px-6">
            <div className="flex items-center gap-6 mb-12 border-r-4 border-[#38bdf8] pr-6 text-right">
                <h2 className="text-4xl font-black text-white italic">إحصائيات <span className="text-[#38bdf8]">الطلاب</span></h2>
                <span className="bg-emerald-500/10 text-emerald-400 text-[10px] font-black px-4 py-1.5 rounded-full uppercase tracking-widest border border-emerald-500/20">قاعدة بيانات نشطة</span>
            </div>
            
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-8">
                <StudentCounter value={gradeStats.grade10} label="طلاب العاشر" icon={School} color="bg-blue-600" />
                <StudentCounter value={gradeStats.grade11} label="طلاب الحادي عشر" icon={GraduationCap} color="bg-purple-600" />
                <StudentCounter value={gradeStats.grade12} label="طلاب الثاني عشر" icon={Users} color="bg-amber-600" />
                <StudentCounter value={gradeStats.uni} label="طلاب الجامعة" icon={Globe} color="bg-emerald-600" />
            </div>
            
            <div className="stats-block mt-12 p-10 bg-white/[0.02] border border-white/5 rounded-[50px] flex flex-col md:flex-row items-center justify-center gap-8 opacity-0">
                <p className="text-gray-500 font-bold text-xl">إجمالي عائلة المركز السوري للعلوم:</p>
                <div className="flex items-baseline gap-3">
                    {isLoading ? <RefreshCw className="animate-spin text-blue-400" /> : <span className="text-6xl font-black text-[#38bdf8] tabular-nums">{gradeStats.total}</span>}
                    <span className="text-xl font-bold text-gray-500">طالب وطالبة</span>
                </div>
            </div>
        </div>
      </div>

      <footer className="mt-20 text-gray-800 text-[10px] font-black uppercase tracking-[0.6em] text-center">
          © {new Date().getFullYear()} المركز السوري للعلوم • الكويت
      </footer>
    </div>
  );
};

export default LandingPage;

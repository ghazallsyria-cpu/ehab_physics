
import React, { useEffect, useState } from 'react';
import { User } from '../types';
import { dbService } from '../services/db';
import { ArrowRight, Map, Trophy, BookOpen, Star, Zap } from 'lucide-react';
import anime from 'animejs';

interface StudentDashboardProps {
  user: User;
}

const StudentDashboard: React.FC<StudentDashboardProps> = ({ user }) => {
  const [progressData, setProgressData] = useState({ percent: 0, lessons: 0, points: 0 });

  useEffect(() => {
    // 1. أنيميشن لدخول البطاقات بتتابع
    anime({
      targets: '.dashboard-card',
      translateY: [50, 0],
      opacity: [0, 1],
      delay: anime.stagger(150, {start: 300}),
      easing: 'easeOutExpo',
      duration: 1000
    });

    // 2. أنيميشن عداد النقاط
    const pointsObj = { val: 0 };
    anime({
        targets: pointsObj,
        val: user.progress.points || 0,
        round: 1,
        easing: 'easeOutQuad',
        duration: 2000,
        update: () => setProgressData(prev => ({ ...prev, points: pointsObj.val }))
    });

    // حساب نسبة الإنجاز التقريبية للعرض
    const completed = (user.progress.completedLessonIds || []).length;
    setProgressData(prev => ({ ...prev, lessons: completed, percent: Math.min(completed * 5, 100) }));
  }, [user]);

  const navigate = (view: any) => {
    window.dispatchEvent(new CustomEvent('change-view', { detail: { view } }));
  };

  return (
    <div className="space-y-10 font-['Tajawal'] pb-24 text-right" dir="rtl">
      
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start gap-6 overflow-hidden">
         <div className="welcome-text">
            <h2 className="text-4xl md:text-5xl font-black text-white tracking-tight">
               مرحباً بك، <span className="text-amber-400">{user.name.split(' ')[0]}</span> 👋
            </h2>
            <p className="text-slate-400 text-lg font-medium mt-3">
              جاهز لاكتشاف أسرار الكون اليوم؟
            </p>
         </div>
         <div className="flex gap-4">
             <div className="bg-amber-400/10 border border-amber-400/20 px-6 py-3 rounded-2xl flex items-center gap-3">
                <Star className="text-amber-400 fill-amber-400" size={20} />
                <span className="text-xl font-black text-white tabular-nums">{progressData.points} <span className="text-xs text-amber-400/60 mr-1">نقطة</span></span>
             </div>
         </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
         {/* Main Action Cards */}
         <div 
           onClick={() => navigate('curriculum')}
           className="dashboard-card lg:col-span-8 bg-gradient-to-br from-blue-600/20 to-blue-900/20 border border-blue-500/20 p-10 rounded-[50px] cursor-pointer hover:border-blue-400/40 transition-all group relative overflow-hidden opacity-0"
         >
           <div className="absolute top-[-20%] left-[-10%] w-64 h-64 bg-blue-500/10 rounded-full blur-[100px] group-hover:bg-blue-500/20 transition-all"></div>
           <div className="relative z-10">
              <div className="w-16 h-16 bg-blue-500/20 rounded-2xl flex items-center justify-center text-blue-400 mb-8 border border-blue-500/30">
                <BookOpen size={32} />
              </div>
              <h3 className="text-4xl font-black text-white mb-4">المناهج الدراسية</h3>
              <p className="text-lg text-slate-400 font-medium max-w-xl">استكمل رحلتك التعليمية من حيث توقفت. جميع الدروس والوحدات منظمة وفق منهج الوزارة.</p>
              
              <div className="mt-12 flex items-center gap-4 text-blue-400 font-black text-sm uppercase tracking-widest group-hover:gap-6 transition-all">
                 <span>بدء الدراسة الآن</span>
                 <ArrowRight />
              </div>
           </div>
         </div>
         
         <div className="dashboard-card lg:col-span-4 space-y-8 opacity-0">
           <div 
             onClick={() => navigate('journey-map')}
             className="bg-gradient-to-br from-amber-500/10 to-yellow-600/10 border border-amber-500/20 p-8 rounded-[40px] cursor-pointer hover:border-amber-400/40 transition-all group relative overflow-hidden h-full flex flex-col justify-between"
           >
              <div>
                <Map className="text-amber-400 mb-6" size={40} />
                <h3 className="text-2xl font-black text-white mb-2">خريطة الطريق</h3>
                <p className="text-sm text-slate-400 font-medium">تتبع مسارك الأكاديمي بصرياً.</p>
              </div>
              <div className="mt-8 flex items-center gap-2 text-amber-400 font-bold text-xs uppercase group-hover:gap-4 transition-all">
                 <span>عرض الخريطة</span>
                 <ArrowRight size={16} />
              </div>
           </div>
         </div>

         {/* Stats Row */}
         <div className="dashboard-card lg:col-span-4 glass-panel p-8 rounded-[40px] border-white/5 opacity-0">
            <h4 className="text-sm font-black text-gray-500 uppercase tracking-widest mb-8 flex items-center gap-2">
                <Zap size={14} className="text-amber-400" /> مستوى الإنجاز
            </h4>
            <div className="space-y-6">
                <div className="flex justify-between items-end">
                    <div>
                        <p className="text-4xl font-black text-white tabular-nums">{progressData.percent}%</p>
                        <p className="text-xs text-gray-500 font-bold mt-1">من المنهج المقرر</p>
                    </div>
                    <div className="text-right">
                        <p className="text-xl font-black text-blue-400 tabular-nums">{progressData.lessons}</p>
                        <p className="text-[10px] text-gray-600 font-black uppercase">درس مكتمل</p>
                    </div>
                </div>
                <div className="w-full h-3 bg-white/5 rounded-full overflow-hidden p-0.5 border border-white/5">
                    <div className="h-full bg-gradient-to-r from-blue-500 to-blue-300 rounded-full" style={{width: `${progressData.percent}%`}}></div>
                </div>
            </div>
         </div>

         <div className="dashboard-card lg:col-span-4 glass-panel p-8 rounded-[40px] border-white/5 opacity-0">
            <h4 className="text-sm font-black text-gray-500 uppercase tracking-widest mb-8 flex items-center gap-2">
                <Trophy size={14} className="text-amber-400" /> آخر الإنجازات
            </h4>
            <div className="flex items-center gap-6 p-4 bg-white/5 rounded-3xl border border-white/5">
                <div className="w-14 h-14 bg-amber-400/10 rounded-2xl flex items-center justify-center text-2xl border border-amber-400/20">🏆</div>
                <div>
                    <p className="font-bold text-white">مستكشف الجاذبية</p>
                    <p className="text-[10px] text-gray-500">أنهيت الوحدة الأولى بنجاح</p>
                </div>
            </div>
         </div>

         <div className="dashboard-card lg:col-span-4 glass-panel p-8 rounded-[40px] border-white/5 opacity-0">
            <h4 className="text-sm font-black text-gray-500 uppercase tracking-widest mb-8 flex items-center gap-2">
                <Star size={14} className="text-blue-400" /> مركز الاختبارات
            </h4>
            <button 
              onClick={() => navigate('quiz_center')}
              className="w-full py-5 bg-white text-black rounded-3xl font-black text-xs uppercase tracking-widest hover:scale-105 active:scale-95 transition-all shadow-xl"
            >
                خوض اختبار جديد
            </button>
         </div>
      </div>
      
    </div>
  );
};

export default StudentDashboard;

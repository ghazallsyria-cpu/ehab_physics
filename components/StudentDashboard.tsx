
import React, { useState, useEffect } from 'react';
import { User } from '../types';
import { dbService } from '../services/db';
import { ArrowRight, Map } from 'lucide-react';
import { CURRICULUM_DATA } from '../constants';
import ActivityStats from './ActivityStats';

interface StudentDashboardProps {
  user: User;
}

const StudentDashboard: React.FC<StudentDashboardProps> = ({ user }) => {
  
  const navigate = (view: any) => {
    window.dispatchEvent(new CustomEvent('change-view', { detail: { view } }));
  };

  const userCurriculum = CURRICULUM_DATA.find(c => c.grade === user.grade && c.subject === 'Physics'); // Default to Physics for main progress
  const totalLessons = userCurriculum?.units.reduce((acc, unit) => acc + unit.lessons.length, 0) || 1;
  const completedLessonsCount = (user.progress.completedLessonIds || []).length;
  const progressPercent = totalLessons > 0 ? Math.min(Math.round((completedLessonsCount / totalLessons) * 100), 100) : 0;

  return (
    <div className="space-y-10 animate-fadeIn font-['Tajawal'] pb-24 text-right" dir="rtl">
      
      {/* Header / Welcome Section */}
      <div className="flex flex-col md:flex-row justify-between items-start gap-6">
         <div>
            <h2 className="text-3xl md:text-4xl font-bold text-white tracking-tight">
               مرحباً، <span className="text-amber-400">{user.name.split(' ')[0]}</span>
            </h2>
            <p className="text-slate-400 text-sm font-medium mt-2 opacity-80">
              الصف {user.grade} • {user.grade === '10' ? 'عام' : 'الشعبة العلمية'}
            </p>
         </div>
         <div className="flex gap-4">
             <button onClick={() => navigate('recommendations')} className="bg-white/5 border border-white/10 px-6 py-3 rounded-2xl text-xs font-bold text-white hover:bg-white hover:text-black transition-all flex items-center gap-2">🧠 توصياتي</button>
         </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
         {/* Main Action Cards */}
         <div 
           onClick={() => navigate('curriculum')}
           className="lg:col-span-4 bg-gradient-to-br from-blue-500/10 to-blue-600/10 border border-blue-500/20 p-8 rounded-[40px] cursor-pointer hover:border-blue-500/40 transition-all group relative overflow-hidden animate-slideUp"
         >
           <div className="relative z-10">
              <span className="px-3 py-1 bg-blue-500/20 text-blue-400 text-[10px] font-bold rounded-full uppercase tracking-widest mb-4 inline-block border border-blue-500/20">المنهج الدراسي</span>
              <h3 className="text-2xl font-bold text-white mb-2">تصفح المناهج</h3>
              <p className="text-sm text-slate-400 font-medium">الوحدات والفصول الدراسية للمواد المتاحة.</p>
              <div className="mt-6 flex items-center gap-2 text-blue-400 font-bold text-xs uppercase tracking-widest group-hover:gap-4 transition-all">
                 <span>اذهب إلى المناهج</span>
                 <ArrowRight className="w-4 h-4" />
              </div>
           </div>
         </div>
         
         <div 
           onClick={() => navigate('journey-map')}
           className="lg:col-span-4 bg-gradient-to-br from-amber-500/10 to-yellow-600/10 border border-amber-500/20 p-8 rounded-[40px] cursor-pointer hover:border-amber-500/40 transition-all group relative overflow-hidden animate-slideUp"
            style={{animationDelay: '0.1s'}}
         >
           <div className="relative z-10">
              <span className="px-3 py-1 bg-amber-500/20 text-amber-400 text-[10px] font-bold rounded-full uppercase tracking-widest mb-4 inline-block border border-amber-500/20">مسار التعلم</span>
              <h3 className="text-2xl font-bold text-white mb-2">خريطة رحلتك</h3>
              <p className="text-sm text-slate-400 font-medium">تابع تقدمك بصرياً في مسار التعلم الخاص بك.</p>
              <div className="mt-6 flex items-center gap-2 text-amber-400 font-bold text-xs uppercase tracking-widest group-hover:gap-4 transition-all">
                 <span>اعرض خريطة رحلتي</span>
                 <Map className="w-4 h-4" />
              </div>
           </div>
         </div>


         {/* Progress Sidebar */}
         <div className="lg:col-span-4 space-y-6">
           <div className="bg-slate-800/40 border border-white/5 p-8 rounded-[40px] animate-slideUp" style={{animationDelay: '0.2s'}}>
              <h4 className="text-sm font-bold text-white mb-6 border-r-4 border-amber-500 pr-3">مؤشرات الأداء</h4>
              <div className="space-y-5">
                 <div className="space-y-2">
                    <div className="flex justify-between items-center text-xs">
                       <span className="text-slate-500 font-bold">إنجاز المنهج</span>
                       <span className="text-white font-bold">{progressPercent}%</span>
                    </div>
                    <div className="w-full h-1.5 bg-slate-700/50 rounded-full overflow-hidden">
                      <div className="h-full bg-amber-500 rounded-full shadow-[0_0_10px_#fbbf24]" style={{width: `${progressPercent}%`}}></div>
                    </div>
                 </div>
                 
                 <div className="flex justify-between items-center text-sm pt-4 border-t border-white/10">
                    <span className="text-slate-400 font-bold">النقاط المكتسبة:</span>
                    <span className="text-xl font-black text-amber-400 tabular-nums">{user.progress.points || 0}</span>
                 </div>
                 <div className="flex justify-between items-center text-sm">
                    <span className="text-slate-400 font-bold">الدروس المنجزة:</span>
                    <span className="text-xl font-black text-white tabular-nums">{completedLessonsCount}</span>
                 </div>
              </div>
           </div>
           <div className="glass-panel p-8 rounded-[40px] border-white/5 animate-slideUp" style={{animationDelay: '0.3s'}}>
              <h4 className="text-sm font-bold text-white mb-6 border-r-4 border-blue-500 pr-3">سجل النشاط</h4>
              <ActivityStats activityLog={user.activityLog} />
            </div>
         </div>
      </div>
      
    </div>
  );
};

export default StudentDashboard;
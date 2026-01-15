import React, { useState } from 'react';

interface LandingPageProps {
  onStart: () => void;
}

const LandingPage: React.FC<LandingPageProps> = ({ onStart }) => {
  
  return (
    <div className="min-h-screen bg-[#0f172a] text-white font-['Tajawal'] relative overflow-x-hidden" dir="rtl">
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
         <div className="absolute top-[-10%] right-[-10%] w-[800px] h-[800px] bg-sky-600/10 rounded-full blur-[120px]"></div>
         <div className="absolute bottom-[-10%] left-[-10%] w-[600px] h-[600px] bg-indigo-600/10 rounded-full blur-[120px]"></div>
      </div>
      <nav className="relative z-50 px-6 py-6 md:px-12 flex justify-between items-center max-w-7xl mx-auto">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-gradient-to-tr from-sky-500 to-blue-600 rounded-xl flex items-center justify-center shadow-lg">
             <span className="text-xl font-bold text-white">⚛️</span>
          </div>
          <h1 className="text-xl font-bold text-white tracking-tight">المركز السوري للعلوم</h1>
        </div>
        <button onClick={onStart} className="bg-white text-slate-900 px-6 py-2.5 rounded-full font-bold text-xs uppercase tracking-widest hover:bg-sky-50 transition-all shadow-lg">
          ابدأ الآن
        </button>
      </nav>

      <section className="relative z-40 px-6 pt-16 pb-24 md:pt-24 md:pb-32 max-w-7xl mx-auto flex flex-col md:flex-row items-center gap-16">
        <div className="flex-1 text-center md:text-right">
           <h2 className="text-5xl md:text-7xl font-bold leading-tight mb-6 tracking-tight text-white">
             اكتشف العلوم <br/>
             <span className="text-transparent bg-clip-text bg-gradient-to-r from-sky-400 to-indigo-400">بأسلوب المستقبل</span>
           </h2>
           <p className="text-slate-400 text-lg md:text-xl leading-relaxed max-w-2xl mb-10 md:ml-auto">
             منصة تعليمية متكاملة تدمج المنهج السوري مع أحدث تقنيات الذكاء الاصطناعي والمحاكاة التفاعلية.
           </p>
           <div className="flex flex-col sm:flex-row gap-4 justify-center md:justify-start">
              <button onClick={onStart} className="bg-sky-500 text-white px-10 py-4 rounded-2xl font-bold text-sm hover:bg-sky-400 transition-all shadow-[0_10px_30px_rgba(56,189,248,0.2)]">
                 ابدأ رحلة التعلم 🚀
              </button>
           </div>
        </div>
        <div className="flex-1 relative w-full max-w-lg">
           <div className="absolute inset-0 bg-gradient-to-tr from-sky-500/20 to-indigo-500/20 rounded-full blur-[80px]"></div>
           <div className="relative aspect-square bg-slate-800/50 backdrop-blur-xl rounded-[40px] border border-white/10 p-2 flex items-center justify-center shadow-2xl">
              <div className="relative w-64 h-64">
                 <div className="absolute inset-0 border border-sky-500/30 rounded-full animate-spin-slow"></div>
                 <div className="absolute inset-4 border border-indigo-500/30 rounded-full animate-spin-slow" style={{ animationDirection: 'reverse' }}></div>
                 <div className="absolute inset-0 flex items-center justify-center">
                    <span className="text-8xl filter drop-shadow-[0_0_20px_rgba(56,189,248,0.5)]">⚛️</span>
                 </div>
              </div>
           </div>
        </div>
      </section>
      
      <footer className="py-12 px-6 border-t border-white/5 bg-[#0b1120] relative z-30">
         <div className="max-w-7xl mx-auto pt-8 flex flex-col md:flex-row justify-between items-center gap-6">
            <div className="flex flex-col md:flex-row items-center gap-4 md:gap-8">
                <p className="text-xs text-slate-500 font-bold uppercase">© 2026 المركز السوري للعلوم. جميع الحقوق محفوظة.</p>
                <div className="hidden md:block w-px h-4 bg-white/10"></div>
                <div className="flex items-center gap-2">
                    <span className="w-1.5 h-1.5 bg-sky-400 rounded-full animate-pulse"></span>
                    <p className="text-xs font-bold text-slate-300">المدير العام: <span className="text-sky-400">أ. ايهاب غزال</span></p>
                </div>
            </div>
            <div className="flex gap-6 text-xs text-slate-500 font-bold">
               <a href="#" className="hover:text-white transition-colors">سياسة الخصوصية</a>
               <a href="#" className="hover:text-white transition-colors">الشروط والأحكام</a>
            </div>
         </div>
      </footer>
    </div>
  );
};

export default LandingPage;
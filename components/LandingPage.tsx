import React from 'react';

interface LandingPageProps {
  onStart: () => void;
}

const LandingPage: React.FC<LandingPageProps> = ({ onStart }) => {
  return (
    <div className="min-h-screen w-full flex flex-col items-center justify-center bg-geometric-pattern text-white font-['Tajawal'] text-center p-8 relative overflow-hidden animate-fadeIn" dir="rtl">

      <div className="relative z-10 flex flex-col items-center">
        {/* Animated Logo Orb */}
        <div className="relative w-64 h-64 md:w-80 md:h-80 mb-12 animate-float">
          <div className="absolute inset-0 rounded-full bg-gradient-to-tr from-blue-900 via-blue-800 to-black border-4 border-amber-400/20 shadow-2xl shadow-black"></div>
          <div className="absolute inset-0 rounded-full bg-gradient-to-br from-amber-500/10 via-transparent to-amber-500/10 blur-xl animate-pulse"></div>
          <div className="absolute inset-8 rounded-full border-2 border-amber-400/10 animate-spin-slow" style={{ animationDirection: 'reverse' }}></div>
          <div className="absolute inset-12 rounded-full border border-dashed border-amber-400/20 animate-spin-slow"></div>
          <div className="absolute inset-0 flex items-center justify-center">
            <span className="text-9xl md:text-[140px] text-glow-gold filter drop-shadow-[0_0_25px_rgba(212,175,55,0.8)]">⚛️</span>
          </div>
        </div>
        
        <h1 className="text-4xl md:text-6xl font-black tracking-tight text-white leading-tight">
            منصة تعليم الفيزياء
        </h1>
        <h2 className="text-3xl md:text-5xl font-bold text-amber-400 text-glow-gold mb-8">
            للمرحلة الثانوية - دولة الكويت
        </h2>
        
        <p className="max-w-2xl text-base md:text-lg text-slate-300 mb-12 font-medium">
            دروس تفاعلية، بنوك أسئلة، معلمين خبراء، مناهج مطورة
        </p>
        
        <button 
          onClick={onStart} 
          className="bg-amber-400 text-blue-950 px-12 py-5 rounded-2xl font-black text-sm uppercase tracking-widest hover:bg-amber-300 transition-all shadow-[0_10px_40px_rgba(251,191,36,0.3)] hover:scale-105 active:scale-95 glow-gold"
        >
          ابدأ رحلة التعلم
        </button>
      </div>

    </div>
  );
};

export default LandingPage;
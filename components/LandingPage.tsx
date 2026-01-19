import React from 'react';

interface LandingPageProps {
  onStart: () => void;
}

const LandingPage: React.FC<LandingPageProps> = ({ onStart }) => {
  return (
    <div className="min-h-screen w-full flex flex-col items-center justify-end bg-black text-white font-['Tajawal'] text-center p-8 relative overflow-hidden" dir="rtl">
      
      {/* Background Image with Ken Burns Effect */}
      <div 
        className="absolute inset-0 bg-cover bg-center animate-kenburns"
        style={{ backgroundImage: "url('https://images.unsplash.com/photo-1509228627152-72ae9ae6848d?q=80&w=2070&auto=format&fit=crop')" }}
      ></div>

      {/* Gradient Overlay for Text Readability */}
      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/50 to-transparent"></div>

      <div className="relative z-10 flex flex-col items-center pb-16">
        <div className="animate-fadeInUp" style={{ animationDelay: '0.2s' }}>
          <h1 className="text-5xl md:text-7xl font-black tracking-tight text-white leading-tight">
              منصة الفيزياء <span className="text-amber-400 text-glow-gold">التفاعلية</span>
          </h1>
          <h2 className="text-xl md:text-2xl font-bold text-slate-300 mt-4 mb-10">
              للمرحلة الثانوية في دولة الكويت
          </h2>
        </div>
        
        <div className="animate-fadeInUp flex flex-wrap justify-center gap-3 mb-12" style={{ animationDelay: '0.4s' }}>
            {['دروس تفاعلية', 'بنوك أسئلة', 'معلمون خبراء', 'مناهج مطورة'].map(feature => (
                <div key={feature} className="bg-white/10 backdrop-blur-md border border-white/20 text-xs font-bold px-4 py-2 rounded-full">
                    {feature}
                </div>
            ))}
        </div>
        
        <div className="animate-fadeInUp" style={{ animationDelay: '0.6s' }}>
          <button 
            onClick={onStart} 
            className="bg-amber-400 text-blue-950 px-16 py-5 rounded-2xl font-black text-sm uppercase tracking-widest hover:bg-amber-300 transition-all shadow-[0_10px_40px_rgba(251,191,36,0.3)] hover:scale-105 active:scale-95 glow-gold"
          >
            ابدأ رحلة التعلم
          </button>
        </div>
      </div>
    </div>
  );
};

export default LandingPage;

import React, { useState, useEffect } from 'react';
import { HomePageContent, ViewState } from '../types';
import { dbService } from '../services/db';
import { Megaphone, AlertTriangle, Newspaper, Image as ImageIcon } from 'lucide-react';

interface LandingPageProps {
  onStart: () => void;
}

const LandingPage: React.FC<LandingPageProps> = ({ onStart }) => {
  const [content, setContent] = useState<HomePageContent[]>([]);
  const [alerts, setAlerts] = useState<HomePageContent[]>([]);
  const [slides, setSlides] = useState<HomePageContent[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchContent = async () => {
      setIsLoading(true);
      try {
        const allContent = await dbService.getHomePageContent();
        const carouselSlides = allContent.filter(item => item.type === 'carousel');
        setSlides(carouselSlides);
        setAlerts(allContent.filter(item => item.type === 'alert' && item.priority === 'high'));
        setContent(allContent.filter(item => item.type !== 'carousel' && !(item.type === 'alert' && item.priority === 'high')));
      } catch (error) {
        console.error("Failed to load homepage content:", error);
      } finally {
        setIsLoading(false);
      }
    };
    fetchContent();
  }, []);
  
  useEffect(() => {
    if (slides.length <= 1) return;
    const timer = setInterval(() => {
        setCurrentIndex(prev => (prev + 1) % slides.length);
    }, 7000); // Change slide every 7 seconds
    return () => clearInterval(timer);
  }, [slides]);

  const navigate = (view: ViewState) => {
    window.dispatchEvent(new CustomEvent('change-view', { detail: { view } }));
  };

  const getIconForType = (type: HomePageContent['type']) => {
    switch (type) {
      case 'alert': return <AlertTriangle className="text-red-400" />;
      case 'announcement': return <Megaphone className="text-blue-400" />;
      case 'image': return <ImageIcon className="text-purple-400" />;
      case 'news':
      default:
        return <Newspaper className="text-amber-400" />;
    }
  };
  
  const renderHero = () => {
    const currentSlide = slides[currentIndex];
    
    if (slides.length === 0) {
        return (
            <div className="min-h-[80vh] flex flex-col items-center justify-center text-center p-8 relative overflow-hidden">
                <div className="absolute inset-0 bg-cover bg-center animate-kenburns" style={{ backgroundImage: "url('https://images.unsplash.com/photo-1509228627152-72ae9ae6848d?q=80&w=2070&auto=format&fit=crop')" }}></div>
                <div className="absolute inset-0 bg-gradient-to-t from-[#0A2540] via-[#0A2540]/80 to-transparent"></div>
                <div className="relative z-10 flex flex-col items-center">
                    <div className="animate-fadeInUp" style={{ animationDelay: '0.2s' }}>
                        <h1 className="text-5xl md:text-7xl font-black tracking-tight text-white leading-tight">
                            منصة الفيزياء <span className="text-amber-400 text-glow-gold">التفاعلية</span>
                        </h1>
                        <h2 className="text-xl md:text-2xl font-bold text-slate-300 mt-4 mb-10">
                            للمرحلة الثانوية في دولة الكويت
                        </h2>
                    </div>
                    <div className="animate-fadeInUp" style={{ animationDelay: '0.4s' }}>
                        <button onClick={onStart} className="bg-amber-400 text-blue-950 px-16 py-5 rounded-2xl font-black text-sm uppercase tracking-widest hover:bg-amber-300 transition-all shadow-[0_10px_40px_rgba(251,191,36,0.3)] hover:scale-105 active:scale-95 glow-gold">
                            ابدأ رحلة التعلم
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-[80vh] relative overflow-hidden flex items-center justify-center text-center">
            {slides.map((slide, index) => (
                <div key={slide.id} className={`absolute inset-0 transition-opacity duration-1000 ease-in-out ${index === currentIndex ? 'opacity-100' : 'opacity-0'}`}>
                    <div className="w-full h-full bg-cover bg-center animate-kenburns" style={{ backgroundImage: `url(${slide.imageUrl})` }} />
                    <div className="absolute inset-0 bg-gradient-to-t from-[#0A2540] via-[#0A2540]/60 to-transparent" />
                </div>
            ))}
            <div className="relative z-10 flex flex-col items-center p-8">
                <div className="animate-fadeInUp">
                    <h1 className="text-5xl md:text-7xl font-black tracking-tight text-white leading-tight text-shadow-lg">
                        {currentSlide?.title || "المركز السوري للعلوم"}
                    </h1>
                    <p className="text-xl md:text-2xl font-bold text-slate-300 mt-4 mb-10 max-w-3xl text-shadow">
                        {currentSlide?.content || "منصة الفيزياء التفاعلية للمرحلة الثانوية في دولة الكويت"}
                    </p>
                </div>
                {currentSlide?.ctaText && currentSlide.ctaLink && (
                  <div className="animate-fadeInUp" style={{ animationDelay: '0.2s' }}>
                      <button onClick={() => navigate(currentSlide.ctaLink!)} className="bg-amber-400 text-blue-950 px-16 py-5 rounded-2xl font-black text-sm uppercase tracking-widest hover:bg-amber-300 transition-all shadow-[0_10px_40px_rgba(251,191,36,0.3)] hover:scale-105 active:scale-95 glow-gold">
                          {currentSlide.ctaText}
                      </button>
                  </div>
                )}
            </div>
            {slides.length > 1 && (
                <div className="absolute bottom-8 left-1/2 -translate-x-1/2 z-20 flex gap-3">
                    {slides.map((_, index) => (
                        <button key={index} onClick={() => setCurrentIndex(index)} className={`w-3 h-3 rounded-full transition-all duration-300 ${index === currentIndex ? 'bg-amber-400 scale-125' : 'bg-white/50 hover:bg-white'}`} />
                    ))}
                </div>
            )}
        </div>
    );
  };


  return (
    <div className="min-h-screen w-full bg-black text-white font-['Tajawal'] relative overflow-x-hidden" dir="rtl">
      
      {renderHero()}

      {/* Dynamic Content Section */}
      <div className="bg-[#0A2540] py-20 px-6">
        <div className="max-w-7xl mx-auto">
          {isLoading ? (
            <div className="text-center text-gray-500 animate-pulse">جاري تحميل آخر الأخبار...</div>
          ) : (
            <>
              {/* High-Priority Alerts */}
              {alerts.length > 0 && (
                <div className="mb-16 space-y-6">
                  {alerts.map(item => (
                    <div key={item.id} className="glass-panel p-8 rounded-[40px] border-2 border-red-500/30 bg-red-500/10 flex flex-col md:flex-row items-center gap-6 animate-fadeInUp">
                      <div className="w-16 h-16 rounded-3xl bg-red-500/20 border border-red-500/30 text-red-400 flex items-center justify-center shrink-0 text-3xl animate-pulse">
                        <AlertTriangle />
                      </div>
                      <div className="flex-1 text-center md:text-right">
                        <h3 className="text-2xl font-black text-red-400">{item.title}</h3>
                        <p className="text-gray-300 mt-2">{item.content}</p>
                      </div>
                      {item.ctaText && item.ctaLink && (
                        <button onClick={() => navigate(item.ctaLink!)} className="bg-red-500 text-white px-8 py-3 rounded-xl font-bold text-sm mt-4 md:mt-0 shrink-0 hover:bg-red-600 transition-colors">
                          {item.ctaText}
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              )}

              {/* Grid for News, Announcements, Images */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                {content.map((item, index) => (
                  <div 
                    key={item.id} 
                    className="glass-panel p-8 rounded-[40px] border border-white/5 bg-white/[0.02] hover:border-amber-400/30 transition-all group flex flex-col animate-fadeInUp"
                    style={{ animationDelay: `${index * 0.1}s` }}
                  >
                    <div className="flex items-center gap-4 mb-6">
                      <div className="w-12 h-12 rounded-2xl bg-black/40 border border-white/10 flex items-center justify-center text-2xl">
                        {getIconForType(item.type)}
                      </div>
                      <div>
                        <h3 className="text-xl font-black text-white group-hover:text-amber-400 transition-colors">{item.title}</h3>
                        <p className="text-[10px] text-gray-500 font-bold uppercase">{new Date(item.createdAt).toLocaleDateString('ar-KW')}</p>
                      </div>
                    </div>
                    {item.imageUrl && <img src={item.imageUrl} alt={item.title} className="w-full h-48 object-cover rounded-2xl mb-6 border border-white/5" />}
                    <p className="text-gray-400 text-sm leading-relaxed flex-1">{item.content}</p>
                    {item.ctaText && item.ctaLink && (
                      <button onClick={() => navigate(item.ctaLink!)} className="w-full mt-8 bg-white/5 border border-white/10 text-white px-6 py-3 rounded-xl font-bold text-xs uppercase hover:bg-white hover:text-black transition-colors">
                        {item.ctaText}
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </>
          )}

          {!isLoading && content.length === 0 && alerts.length === 0 && (
            <div className="text-center py-20 opacity-40 border-2 border-dashed border-white/10 rounded-[50px]">
              <span className="text-6xl mb-4 block">📰</span>
              <p className="font-bold text-lg">لا توجد أخبار أو إعلانات حالياً</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default LandingPage;
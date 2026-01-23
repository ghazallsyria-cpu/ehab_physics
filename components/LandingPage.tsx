
import React, { useState, useEffect, useRef } from 'react';
import { HomePageContent, ViewState } from '../types';
import { dbService } from '../services/db';
import { Megaphone, AlertTriangle, Newspaper, Image as ImageIcon } from 'lucide-react';
import anime from 'animejs';

interface LandingPageProps {
  onStart: () => void;
}

const LandingPage: React.FC<LandingPageProps> = ({ onStart }) => {
  const [content, setContent] = useState<HomePageContent[]>([]);
  const [alerts, setAlerts] = useState<HomePageContent[]>([]);
  const [slides, setSlides] = useState<HomePageContent[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const shapesRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const fetchContent = async () => {
      setIsLoading(true);
      try {
        const allContent = await dbService.getHomePageContent();
        setSlides(allContent.filter(item => item.type === 'carousel'));
        setAlerts(allContent.filter(item => item.type === 'alert' && item.priority === 'high'));
        setContent(allContent.filter(item => item.type !== 'carousel' && !(item.type === 'alert' && item.priority === 'high')));
      } catch (error) {
        console.error("Content load failed", error);
      } finally {
        setIsLoading(false);
      }
    };
    fetchContent();
  }, []);

  useEffect(() => {
    if (isLoading) return;

    const timeline = anime.timeline({ easing: 'easeOutExpo' });
    timeline
      .add({
        targets: '.logo-anim',
        scale: [0, 1],
        rotate: [-180, 0],
        opacity: [0, 1],
        duration: 1500,
        easing: 'easeOutElastic(1, .5)'
      })
      .add({
        targets: '.title .letter',
        translateY: ["1.2em", 0],
        translateZ: 0,
        opacity: [0, 1],
        rotateY: [45, 0],
        duration: 1000,
        delay: (el, i) => 40 * i,
        offset: '-=1000'
      })
      .add({
        targets: '.subtitle-anim',
        opacity: [0, 1],
        translateY: [20, 0],
        duration: 800,
        offset: '-=600'
      })
      .add({
        targets: '.btn-anim',
        opacity: [0, 1],
        scale: [0.8, 1],
        duration: 800,
        offset: '-=500'
      });

    if (shapesRef.current) {
      shapesRef.current.innerHTML = '';
      for (let i = 0; i < 20; i++) {
        const shape = document.createElement('div');
        shape.classList.add('shape');
        const size = Math.random() * 60 + 10;
        shape.style.width = `${size}px`;
        shape.style.height = `${size}px`;
        shape.style.left = `${Math.random() * 100}vw`;
        shape.style.top = `${Math.random() * 100}vh`;
        if (i % 3 === 0) {
          shape.style.background = 'radial-gradient(circle, rgba(255, 215, 0, 0.4) 0%, rgba(255, 215, 0, 0) 70%)';
        }
        shapesRef.current.appendChild(shape);
        anime({
          targets: shape,
          translateX: () => anime.random(-300, 300),
          translateY: () => anime.random(-300, 300),
          scale: [0.5, 1.5],
          opacity: [0.1, 0.5],
          easing: 'easeInOutSine',
          duration: () => anime.random(4000, 10000),
          direction: 'alternate',
          loop: true
        });
      }
    }
  }, [isLoading]);

  const renderHero = () => {
    const mainTitle = slides[currentIndex]?.title || "المركز السوري للعلوم";
    const mainContent = slides[currentIndex]?.content || "المنصة التعليمية الرائدة في تدريس الفيزياء والعلوم المتقدمة.";
    const defaultImg = "https://spxlxypbosipfwbijbjk.supabase.co/storage/v1/object/public/assets/1769130153314_IMG_2848.png";
    
    return (
      <div className="min-h-[90vh] relative overflow-hidden flex items-center justify-center text-center">
        <div ref={shapesRef} className="background-shapes"></div>
        <div className="absolute inset-0 z-0">
          <div className="w-full h-full bg-cover bg-center transition-all duration-1000" style={{ backgroundImage: `url(${slides[currentIndex]?.imageUrl || defaultImg})` }} />
          <div className="absolute inset-0 bg-gradient-to-t from-[#0A2540] via-[#0A2540]/80 to-transparent" />
        </div>

        <div className="relative z-10 p-8 flex flex-col items-center">
          <div className="logo-anim w-24 h-24 bg-white/5 backdrop-blur-xl border border-white/10 rounded-[35px] flex items-center justify-center mb-8 shadow-2xl opacity-0">
            <img src={defaultImg} className="w-16 h-16 object-contain" alt="SSC Logo" />
          </div>

          <div className="title">
            <h1 className="text-5xl md:text-8xl font-black text-white leading-tight mb-4">
              {mainTitle.split('').map((char, i) => (
                <span key={i} className="letter">{char === ' ' ? '\u00A0' : char}</span>
              ))}
            </h1>
          </div>

          <p className="subtitle-anim text-xl md:text-2xl font-bold text-slate-300 mb-12 max-w-2xl opacity-0">
            {mainContent}
          </p>

          <div className="btn-anim opacity-0">
            <button onClick={onStart} className="bg-amber-400 text-blue-950 px-16 py-6 rounded-2xl font-black text-sm uppercase tracking-widest hover:bg-amber-300 transition-all shadow-2xl hover:scale-105 active:scale-95">
              دخول البوابة التعليمية
            </button>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen w-full bg-[#0A2540] text-white font-['Tajawal']" dir="rtl">
      {renderHero()}
      <div className="max-w-7xl mx-auto py-20 px-6">
        {isLoading ? (
          <div className="text-center py-20 animate-pulse text-gray-500 font-bold uppercase tracking-widest text-xs">جاري تحميل المحتوى المحدث...</div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {content.map((item, idx) => (
              <div key={item.id} className="glass-panel p-8 rounded-[40px] border border-white/5 bg-white/[0.02] hover:border-amber-400/30 transition-all group animate-fadeIn" style={{ animationDelay: `${idx * 0.1}s` }}>
                <div className="flex items-center gap-4 mb-6">
                   <div className="w-12 h-12 rounded-2xl bg-black/40 flex items-center justify-center text-amber-400">
                     {item.type === 'news' ? <Newspaper /> : <Megaphone />}
                   </div>
                   <h3 className="text-xl font-black text-white">{item.title}</h3>
                </div>
                {item.imageUrl && <img src={item.imageUrl} className="w-full h-48 object-cover rounded-3xl mb-6" alt={item.title} />}
                <p className="text-gray-400 text-sm leading-relaxed">{item.content}</p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default LandingPage;

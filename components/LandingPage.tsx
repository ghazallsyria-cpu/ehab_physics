
import React, { useEffect, useRef } from 'react';
import anime from 'animejs';

interface LandingPageProps {
  onStart: () => void;
}

const LandingPage: React.FC<LandingPageProps> = ({ onStart }) => {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // 1. توليد خلفية الجزيئات الفيزيائية المتفاعلة
    const particlesContainer = document.querySelector('.particles');
    if (particlesContainer) {
      particlesContainer.innerHTML = '';
      for (let i = 0; i < 60; i++) {
        const dot = document.createElement('div');
        dot.classList.add('particle');
        const size = Math.random() * 4 + 1;
        dot.style.cssText = `
          width: ${size}px;
          height: ${size}px;
          left: ${Math.random() * 100}vw;
          top: ${Math.random() * 100}vh;
          position: absolute;
          background: ${i % 3 === 0 ? '#38bdf8' : '#ffffff'};
          border-radius: 50%;
          opacity: 0;
          pointer-events: none;
        `;
        particlesContainer.appendChild(dot);

        // حركة جسيمات عشوائية (مثل الحركة البراونية)
        anime({
          targets: dot,
          translateX: () => anime.random(-200, 200),
          translateY: () => anime.random(-200, 200),
          opacity: [0, 0.4, 0],
          scale: [0, 1.5, 0],
          duration: () => anime.random(3000, 8000),
          easing: 'easeInOutQuad',
          direction: 'alternate',
          loop: true,
          delay: anime.random(0, 2000)
        });
      }
    }

    // 2. تقسيم النص للتأثير العلمي
    const textWrapper = document.querySelector('.title .text-wrapper');
    if (textWrapper && textWrapper.textContent) {
      textWrapper.innerHTML = textWrapper.textContent.split(' ').map(word => 
        `<span class='word' style='display: inline-block; opacity: 0; filter: blur(20px); transform: translateY(30px);'>${word}</span>`
      ).join(' ');
    }

    const tl = anime.timeline({ easing: 'easeOutExpo' });

    tl
    .add({
      targets: '.logo-main',
      scale: [0, 1.2, 1],
      rotate: [-360, 0],
      opacity: [0, 1],
      duration: 2000,
      easing: 'easeOutElastic(1, .6)'
    })
    .add({
      targets: '.orbit',
      scale: [0, 1],
      opacity: [0, 1],
      rotate: (el: any, i: number) => i % 2 === 0 ? 360 : -360,
      duration: 1500,
      delay: anime.stagger(200),
      offset: '-=1500'
    })
    .add({
      targets: '.title .word',
      opacity: [0, 1],
      translateY: [30, 0],
      filter: ['blur(20px)', 'blur(0px)'],
      duration: 1200,
      delay: anime.stagger(150),
      offset: '-=1000'
    })
    .add({
      targets: '.subtitle-text',
      opacity: [0, 1],
      translateY: [20, 0],
      duration: 1000,
      offset: '-=800'
    })
    .add({
      targets: '.btn-container-lp',
      scale: [0.8, 1],
      opacity: [0, 1],
      duration: 800,
      offset: '-=600'
    });

    // تفاعل الماوس مع الشعار (تأثير مغناطيسي بسيط)
    const handleMouseMove = (e: MouseEvent) => {
        const logo = document.querySelector('.logo-system');
        if (logo) {
            const rect = logo.getBoundingClientRect();
            const x = (e.clientX - rect.left - rect.width / 2) * 0.1;
            const y = (e.clientY - rect.top - rect.height / 2) * 0.1;
            anime({
                targets: '.logo-system',
                translateX: x,
                translateY: y,
                duration: 400,
                easing: 'easeOutQuad'
            });
        }
    };
    window.addEventListener('mousemove', handleMouseMove);

    // دورانات مستمرة
    anime({ targets: '.orbit-1', rotate: 360, duration: 20000, easing: 'linear', loop: true });
    anime({ targets: '.orbit-2', rotate: -360, duration: 25000, easing: 'linear', loop: true });
    
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, []);

  return (
    <div className="relative min-h-screen w-full bg-[#000000] overflow-hidden flex items-center justify-center font-['Cairo']" dir="rtl">
      <style>{`
        .orbit { position: absolute; border-radius: 50%; border: 1px solid rgba(56, 189, 248, 0.2); }
        .orbit-1 { width: 320px; height: 320px; border-top: 3px solid #38bdf8; }
        .orbit-2 { width: 380px; height: 380px; border-right: 3px solid #ffd700; }
        .orbit-3 { width: 440px; height: 440px; border: 1px dashed rgba(255, 255, 255, 0.1); }
        .text-glow { text-shadow: 0 0 30px rgba(56, 189, 248, 0.4); }
      `}</style>

      <div className="particles absolute inset-0 pointer-events-none z-0"></div>

      <div className="hero-container relative z-10 text-center flex flex-col items-center px-4">
        <div className="logo-system relative w-[450px] h-[450px] flex justify-center items-center mb-8">
            <div className="orbit orbit-1"></div>
            <div className="orbit orbit-2"></div>
            <div className="orbit orbit-3"></div>
            <img 
              src="https://spxlxypbosipfwbijbjk.supabase.co/storage/v1/object/public/assets/1769130153314_IMG_2848.png" 
              className="logo-main w-[240px] h-[240px] rounded-full relative z-10 opacity-0 shadow-[0_0_100px_rgba(56,189,248,0.2)]" 
              alt="المركز السوري للعلوم"
            />
        </div>

        <h1 className="title text-5xl md:text-8xl font-black text-white leading-tight mb-4 text-glow">
            <span className="text-wrapper">المركز السوري للعلوم</span>
        </h1>
        
        <p className="subtitle-text text-xl md:text-3xl text-slate-400 font-medium opacity-0 tracking-[3px] mb-12 italic">
            نحو مستـقبل علـمي مشـرق
        </p>
        
        <div className="btn-container-lp opacity-0">
            <button 
              onClick={onStart}
              className="group relative px-16 py-6 bg-transparent overflow-hidden border-2 border-[#38bdf8] text-[#38bdf8] rounded-full font-black text-2xl uppercase tracking-wider transition-all duration-500 hover:text-[#000]"
            >
              <span className="absolute inset-0 w-full h-full bg-[#38bdf8] -translate-x-full group-hover:translate-x-0 transition-transform duration-500"></span>
              <span className="relative z-10 flex items-center gap-3">دخول المنصة <ChevronLeft className="group-hover:-translate-x-2 transition-transform" /></span>
            </button>
        </div>
      </div>
    </div>
  );
};

// أيقونة بسيطة للزر
const ChevronLeft = ({ className }: { className?: string }) => (
    <svg className={className} width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="m15 18-6-6 6-6"/></svg>
);

export default LandingPage;

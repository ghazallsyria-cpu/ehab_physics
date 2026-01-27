
import React, { useEffect, useRef } from 'react';

const HeroSection: React.FC = () => {
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    const video = videoRef.current;
    if (video) {
      // محاولة التشغيل التلقائي
      video.play().catch(err => console.log("Autoplay prevented, waiting for interaction", err));
      
      const handleInteraction = () => {
        if (video.paused) {
            video.play();
        }
        ['click', 'touchstart'].forEach(e => document.removeEventListener(e, handleInteraction));
      };
      
      ['click', 'touchstart'].forEach(e => document.addEventListener(e, handleInteraction));
    }
  }, []);

  return (
    <div className="w-full flex justify-center py-8 md:py-12 px-4 relative z-0">
      {/* خلفية جمالية خفيفة خلف الفيديو */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-3/4 h-3/4 bg-blue-500/10 blur-[100px] rounded-full pointer-events-none"></div>

      <div className="relative w-full max-w-5xl aspect-video rounded-[30px] md:rounded-[50px] overflow-hidden border border-white/10 shadow-[0_20px_60px_rgba(0,0,0,0.5)] bg-black">
          <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent z-10 pointer-events-none"></div>
          <video 
              ref={videoRef} 
              className="w-full h-full object-cover" 
              autoPlay 
              loop 
              muted 
              playsInline 
              webkit-playsinline="true"
          >
          <source src="https://spxlxypbosipfwbijbjk.supabase.co/storage/v1/object/public/assets/1769360535528_Ehab.mp4" type="video/mp4" />
          </video>
      </div>
    </div>
  );
};

export default HeroSection;

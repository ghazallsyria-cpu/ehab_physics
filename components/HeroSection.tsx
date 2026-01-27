
import React, { useEffect, useRef } from 'react';

const HeroSection: React.FC = () => {
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    const video = videoRef.current;
    if (video) {
      // محاولة التشغيل التلقائي الصامت
      video.play().catch(err => console.log("Autoplay prevented", err));
    }
  }, []);

  return (
    <div className="w-full flex justify-center py-6 md:py-10 px-4 relative z-0">
      {/* تأثير إضاءة خلفي لجعل الفيديو يبرز */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[90%] h-[90%] bg-blue-500/20 blur-[120px] rounded-full pointer-events-none"></div>

      <div className="relative w-full max-w-6xl aspect-video rounded-[40px] md:rounded-[60px] overflow-hidden border border-white/10 shadow-[0_30px_80px_rgba(0,0,0,0.6)] bg-black group">
          
          {/* طبقة تجميلية لدمج الفيديو مع التصميم (Vignette & Overlay) */}
          <div className="absolute inset-0 bg-gradient-to-t from-[#000000]/80 via-transparent to-[#000000]/20 z-10 pointer-events-none"></div>
          
          {/* الفيديو بدون أي تفاعل أو أزرار */}
          <video 
              ref={videoRef} 
              className="w-full h-full object-cover pointer-events-none select-none" 
              autoPlay 
              loop 
              muted 
              playsInline 
              webkit-playsinline="true"
              disablePictureInPicture
              controlsList="nodownload nofullscreen noremoteplayback"
          >
            <source src="https://spxlxypbosipfwbijbjk.supabase.co/storage/v1/object/public/assets/1769360535528_Ehab.mp4" type="video/mp4" />
          </video>

          {/* نص ترحيبي اختياري فوق الفيديو (يمكن إزالته إذا لم يكن مطلوباً) */}
          <div className="absolute bottom-8 right-8 z-20 hidden md:block">
             <div className="bg-white/10 backdrop-blur-md border border-white/10 px-6 py-3 rounded-2xl flex items-center gap-3 animate-fadeIn">
                <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></div>
                <span className="text-white text-xs font-bold uppercase tracking-widest">عرض تقديمي</span>
             </div>
          </div>
      </div>
    </div>
  );
};

export default HeroSection;

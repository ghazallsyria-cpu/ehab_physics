
import React, { useEffect, useRef } from 'react';

const HeroSection: React.FC = () => {
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    const video = videoRef.current;
    if (video) {
      // محاولة التشغيل التلقائي
      video.play().catch(err => console.log("Autoplay prevented, waiting for interaction", err));
      
      // التعامل مع سياسات المتصفح التي تتطلب تفاعل المستخدم
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
    <>
      <div className="header-container">
        <video 
            ref={videoRef} 
            className="bg-video" 
            autoPlay 
            loop 
            muted 
            playsInline 
            webkit-playsinline="true"
        >
          <source src="https://spxlxypbosipfwbijbjk.supabase.co/storage/v1/object/public/assets/1769360535528_Ehab.mp4" type="video/mp4" />
        </video>
        <div className="overlay"></div>
        <div className="content font-['Tajawal']">
          <h1 className="text-white drop-shadow-lg">منصتك هنا</h1>
          <p className="text-gray-200 drop-shadow-md">مرحباً بك في المستقبل</p>
        </div>
      </div>

      <style>{`
        .header-container {
          position: relative;
          width: 100%;
          height: 75vh;
          min-height: 400px;
          overflow: hidden;
          background-color: #000;
          display: flex;
          justify-content: center;
          align-items: center;
          border-bottom: 1px solid rgba(255,255,255,0.1);
        }
        .bg-video {
          position: absolute;
          top: 50%;
          left: 50%;
          min-width: 100%;
          min-height: 100%;
          width: auto;
          height: auto;
          transform: translate(-50%, -50%);
          object-fit: cover;
          z-index: 0;
        }
        .overlay {
          position: absolute;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          background: rgba(0, 0, 0, 0.4);
          z-index: 1;
        }
        .content {
          position: relative;
          z-index: 2;
          color: white;
          text-align: center;
          width: 90%;
        }
        .content h1 {
          font-size: 4rem;
          margin-bottom: 1rem;
          font-weight: 900;
          line-height: 1.1;
        }
        .content p {
            font-size: 1.5rem;
            font-weight: 500;
        }
        @media (max-width: 768px) {
          .header-container { height: 60vh; }
          .content h1 { font-size: 2.5rem; }
          .content p { font-size: 1.2rem; }
        }
      `}</style>
    </>
  );
};

export default HeroSection;

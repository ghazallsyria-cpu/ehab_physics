
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
      <div className="header-wrapper">
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
      </div>

      <style>{`
        .header-wrapper {
            width: 100%;
            display: flex;
            justify-content: center;
            background-color: #000205;
            padding-bottom: 20px;
        }
        .header-container {
          position: relative;
          width: 100%;
          max-width: 1200px;
          margin: 0 auto;
          border-radius: 0 0 50px 50px;
          overflow: hidden;
          box-shadow: 0 20px 50px rgba(0,0,0,0.5);
          background: #000;
          /* السماح للحاوية بأخذ ارتفاع الفيديو تلقائياً */
          height: auto;
          display: flex;
          justify-content: center;
          align-items: center;
        }
        .bg-video {
          width: 100%;
          height: auto; /* الحفاظ على نسبة العرض للارتفاع الأصلية */
          display: block;
          z-index: 0;
        }
        .overlay {
          position: absolute;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          background: linear-gradient(to bottom, rgba(0,0,0,0.2), rgba(0,0,0,0.6));
          z-index: 1;
        }
        .content {
          position: absolute;
          top: 50%;
          left: 50%;
          transform: translate(-50%, -50%);
          z-index: 2;
          color: white;
          text-align: center;
          width: 90%;
        }
        .content h1 {
          font-size: 3rem;
          margin-bottom: 0.5rem;
          font-weight: 900;
          line-height: 1.1;
        }
        .content p {
            font-size: 1.2rem;
            font-weight: 500;
            opacity: 0.9;
        }
        @media (max-width: 768px) {
          .header-container {
             border-radius: 0 0 30px 30px;
          }
          .content h1 { font-size: 1.8rem; }
          .content p { font-size: 0.9rem; }
        }
      `}</style>
    </>
  );
};

export default HeroSection;

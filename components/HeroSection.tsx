
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
            background-color: #000205; /* نفس لون خلفية الموقع لدمج الحواف */
            padding-bottom: 20px;
        }
        .header-container {
          position: relative;
          width: 100%;
          max-width: 1400px; /* تحديد عرض أقصى لعدم تمدد الفيديو بشكل مبالغ فيه */
          height: 55vh;      /* تقليل الارتفاع ليكون متناسقاً */
          max-height: 600px; /* حد أقصى للارتفاع */
          min-height: 300px;
          overflow: hidden;
          background-color: #000;
          display: flex;
          justify-content: center;
          align-items: center;
          border-radius: 0 0 50px 50px; /* حواف دائرية سفلية لجمالية التصميم */
          box-shadow: 0 20px 50px rgba(0,0,0,0.5);
          margin: 0 auto;
        }
        .bg-video {
          position: absolute;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          object-fit: cover; /* يضمن تغطية المساحة بدون فراغات سوداء */
          z-index: 0;
          opacity: 0.8;
        }
        .overlay {
          position: absolute;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          background: linear-gradient(to bottom, rgba(0,0,0,0.3), rgba(0,0,0,0.6));
          z-index: 1;
        }
        .content {
          position: relative;
          z-index: 2;
          color: white;
          text-align: center;
          width: 90%;
          transform: translateY(10px);
        }
        .content h1 {
          font-size: 3.5rem;
          margin-bottom: 0.5rem;
          font-weight: 900;
          line-height: 1.1;
        }
        .content p {
            font-size: 1.25rem;
            font-weight: 500;
            opacity: 0.9;
        }
        @media (max-width: 768px) {
          .header-container { 
              height: 45vh; /* ارتفاع أصغر للموبايل */
              border-radius: 0 0 30px 30px;
              width: 100%;
          }
          .content h1 { font-size: 2rem; }
          .content p { font-size: 1rem; }
        }
      `}</style>
    </>
  );
};

export default HeroSection;

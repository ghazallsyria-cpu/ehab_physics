
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
        </div>
      </div>

      <style>{`
        .header-wrapper {
            width: 100%;
            display: flex;
            justify-content: center;
            background-color: #000205;
            padding-bottom: 30px;
            padding-top: 10px;
        }
        .header-container {
          position: relative;
          width: 90%; /* عرض مرن */
          max-width: 900px; /* تحديد عرض أقصى مريح للعين على الكمبيوتر */
          margin: 0 auto;
          border-radius: 30px; /* حواف دائرية أنيقة للفيديو */
          overflow: hidden;
          box-shadow: 0 20px 60px rgba(0,0,0,0.6); /* ظل لإبراز الفيديو */
          background: #000;
          display: flex;
          justify-content: center;
          align-items: center;
          line-height: 0; /* إزالة الفراغات السفلية */
        }
        .bg-video {
          width: 100%;
          height: auto; /* الحفاظ على الأبعاد الطبيعية للفيديو */
          max-height: 80vh; /* ضمان عدم تجاوز ارتفاع الشاشة */
          object-fit: contain; /* يضمن ظهور الفيديو بالكامل دون قص */
          display: block;
        }
        
        @media (max-width: 768px) {
          .header-container {
             width: 95%; /* استغلال مساحة أكبر على الموبايل */
             border-radius: 20px;
          }
        }
      `}</style>
    </>
  );
};

export default HeroSection;


import React, { useEffect, useRef, useState } from 'react';
import anime from 'animejs';
import { dbService } from '../services/db';
import { PaymentSettings, SubscriptionPlan } from '../types';
import { CheckCircle, Zap, ShieldCheck, ChevronLeft, Smartphone, MessageCircle } from 'lucide-react';

interface LandingPageProps {
  onStart: () => void;
}

const LandingPage: React.FC<LandingPageProps> = ({ onStart }) => {
  const [paymentSettings, setPaymentSettings] = useState<PaymentSettings | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadPricing = async () => {
        const settings = await dbService.getPaymentSettings();
        setPaymentSettings(settings);
        setIsLoading(false);
    };
    loadPricing();

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

    // 2. أنيميشن الدخول الرئيسي
    const tl = anime.timeline({ easing: 'easeOutExpo' });
    tl.add({
      targets: '.logo-main',
      scale: [0, 1.2, 1],
      rotate: [-360, 0],
      opacity: [0, 1],
      duration: 2000,
      easing: 'easeOutElastic(1, .6)'
    })
    .add({
      targets: '.title-reveal',
      opacity: [0, 1],
      translateY: [30, 0],
      filter: ['blur(10px)', 'blur(0px)'],
      duration: 1000,
      offset: '-=1000'
    })
    .add({
      targets: '.pricing-section',
      opacity: [0, 1],
      translateY: [50, 0],
      duration: 1500,
      offset: '-=500'
    });

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

    anime({ targets: '.orbit-1', rotate: 360, duration: 20000, easing: 'linear', loop: true });
    
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, []);

  const openWhatsAppHelp = () => {
    const num = paymentSettings?.womdaPhoneNumber || "55315661";
    window.open(`https://wa.me/965${num}?text=مرحباً، أود الاستفسار عن باقات التفوق.`, '_blank');
  };

  return (
    <div className="relative min-h-screen w-full bg-[#000000] overflow-x-hidden flex flex-col items-center font-['Cairo'] pb-32" dir="rtl">
      <style>{`
        .orbit { position: absolute; border-radius: 50%; border: 1px solid rgba(56, 189, 248, 0.2); }
        .orbit-1 { width: 320px; height: 320px; border-top: 3px solid #38bdf8; }
        .text-glow { text-shadow: 0 0 30px rgba(56, 189, 248, 0.4); }
        .pricing-card { backdrop-filter: blur(20px); border: 1px solid rgba(255,255,255,0.05); }
      `}</style>

      <div className="particles absolute inset-0 pointer-events-none z-0"></div>

      {/* Hero Section */}
      <div className="hero-container relative z-10 text-center flex flex-col items-center px-4 pt-20 mb-32">
        <div className="logo-system relative w-[400px] h-[400px] flex justify-center items-center mb-8 scale-75 md:scale-100">
            <div className="orbit orbit-1"></div>
            <img 
              src="https://spxlxypbosipfwbijbjk.supabase.co/storage/v1/object/public/assets/1769130153314_IMG_2848.png" 
              className="logo-main w-[240px] h-[240px] rounded-full relative z-10 opacity-0 shadow-[0_0_100px_rgba(56,189,248,0.2)]" 
              alt="المركز السوري للعلوم"
            />
        </div>

        <h1 className="title-reveal text-5xl md:text-8xl font-black text-white leading-tight mb-4 text-glow opacity-0">
            المركز السوري للعلوم
        </h1>
        
        <p className="title-reveal text-xl md:text-3xl text-slate-400 font-medium tracking-[3px] mb-12 italic opacity-0">
            نحو مستـقبل علـمي مشـرق
        </p>
        
        <div className="title-reveal opacity-0">
            <button 
              onClick={onStart}
              className="group relative px-16 py-6 bg-transparent overflow-hidden border-2 border-[#38bdf8] text-[#38bdf8] rounded-full font-black text-2xl uppercase tracking-wider transition-all duration-500 hover:text-[#000]"
            >
              <span className="absolute inset-0 w-full h-full bg-[#38bdf8] -translate-x-full group-hover:translate-x-0 transition-transform duration-500"></span>
              <span className="relative z-10 flex items-center gap-3">ابدأ رحلتك الآن <ChevronLeft className="group-hover:-translate-x-2 transition-transform" /></span>
            </button>
        </div>
      </div>

      {/* Pricing & Features Section */}
      <section className="pricing-section w-full max-w-6xl px-6 z-10 opacity-0">
          <div className="text-center mb-20">
              <h2 className="text-4xl md:text-6xl font-black text-white italic mb-4">باقات <span className="text-[#fbbf24]">التفوق</span></h2>
              <p className="text-gray-500 text-lg">اختر الباقة المناسبة لمستقبلك الدراسي</p>
              
              {!paymentSettings?.isOnlinePaymentEnabled && (
                 <div className="mt-8 bg-green-500/10 border border-green-500/20 px-6 py-2 rounded-full inline-flex items-center gap-3">
                    <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
                    <span className="text-green-400 text-xs font-bold font-['Tajawal']">التفعيل متاح حالياً عبر واتساب / ومض</span>
                 </div>
              )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
              {/* Premium Plan Card */}
              <div className="pricing-card bg-white/[0.03] p-12 rounded-[60px] border-2 border-[#fbbf24]/20 hover:border-[#fbbf24]/50 transition-all group flex flex-col relative overflow-hidden">
                  <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-[#fbbf24] to-amber-600"></div>
                  <div className="flex justify-between items-start mb-10">
                      <div className="w-16 h-16 bg-amber-400/10 rounded-3xl flex items-center justify-center text-[#fbbf24] border border-[#fbbf24]/20">
                          <Zap size={32} fill="currentColor" />
                      </div>
                      <span className="bg-[#fbbf24] text-black px-5 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest shadow-xl">الأكثر طلباً</span>
                  </div>
                  
                  <h3 className="text-3xl font-black text-white mb-2">باقة التفوق (Premium)</h3>
                  <div className="text-6xl font-black text-[#fbbf24] tabular-nums mb-10">
                      {paymentSettings?.planPrices.premium || 35} <span className="text-sm text-gray-500 font-bold">د.ك / للفصل</span>
                  </div>

                  <ul className="space-y-6 flex-1 mb-12">
                      {[
                          'دخول غير محدود لجميع الدروس',
                          'فتح كافة فيديوهات الشرح المتقدمة',
                          'حلول بنك الأسئلة والوزارة المرقمنة',
                          'تواصل مباشر مع المعلمين الخبراء',
                          'نماذج اختبارات توقعات ليلة الامتحان'
                      ].map((feature, i) => (
                          <li key={i} className="flex items-center gap-4 text-gray-300">
                              <CheckCircle size={18} className="text-[#fbbf24] shrink-0" />
                              <span className="text-sm font-bold">{feature}</span>
                          </li>
                      ))}
                  </ul>

                  <button onClick={onStart} className="w-full py-6 bg-[#fbbf24] text-black rounded-[30px] font-black text-sm uppercase tracking-widest hover:scale-105 active:scale-95 transition-all shadow-2xl flex items-center justify-center gap-3">
                      {!paymentSettings?.isOnlinePaymentEnabled && <MessageCircle size={18} />}
                      {!paymentSettings?.isOnlinePaymentEnabled ? 'سجل واشترك عبر واتساب' : 'سجل الآن للتفعيل'}
                  </button>
              </div>

              {/* Free Plan Card */}
              <div className="pricing-card bg-black/40 p-12 rounded-[60px] border border-white/5 hover:border-white/10 transition-all flex flex-col">
                  <div className="w-16 h-16 bg-white/5 rounded-3xl flex items-center justify-center text-gray-500 mb-10 border border-white/5">
                      <ShieldCheck size={32} />
                  </div>
                  
                  <h3 className="text-3xl font-black text-white mb-2">الباقة الأساسية</h3>
                  <div className="text-6xl font-black text-white tabular-nums mb-10">
                      0 <span className="text-sm text-gray-500 font-bold">د.ك</span>
                  </div>

                  <ul className="space-y-6 flex-1 mb-12">
                      {[
                          'معاينة دروس الوحدة الأولى مجاناً',
                          'أدوات المساعد الذكي المحدودة',
                          'المختبر الافتراضي (نسخة تجريبية)',
                          'تصفح المقالات العلمية العامة'
                      ].map((feature, i) => (
                          <li key={i} className="flex items-center gap-4 text-gray-500">
                              <CheckCircle size={18} className="text-gray-700 shrink-0" />
                              <span className="text-sm font-medium">{feature}</span>
                          </li>
                      ))}
                  </ul>

                  <button onClick={onStart} className="w-full py-6 bg-white/5 text-white rounded-[30px] border border-white/10 font-black text-sm uppercase tracking-widest hover:bg-white hover:text-black transition-all">
                      تجربة المنصة
                  </button>
              </div>
          </div>

          {/* Womda Quick Info */}
          <div className="mt-24 p-10 bg-gradient-to-br from-blue-600/10 to-transparent border border-blue-500/20 rounded-[50px] flex flex-col md:flex-row items-center justify-between gap-10">
              <div className="flex items-center gap-8">
                  <div className="w-20 h-20 bg-blue-500/20 rounded-full flex items-center justify-center text-blue-400 border border-blue-500/20 animate-float">
                      <Smartphone size={40} />
                  </div>
                  <div>
                      <h4 className="text-2xl font-black text-white mb-1 uppercase tracking-tight">التفعيل اليدوي عبر <span className="text-blue-400 italic">ومض / Womda</span></h4>
                      <p className="text-gray-500 text-sm font-bold">حول الإيصال وفعل حسابك خلال دقائق</p>
                  </div>
              </div>
              <div className="bg-black/60 px-10 py-6 rounded-3xl border border-white/5 shadow-inner">
                  <p className="text-[10px] font-black text-blue-400 uppercase tracking-widest mb-1">رقم الاستقبال (965+)</p>
                  <p className="text-4xl font-black text-white font-mono tracking-tighter tabular-nums">{paymentSettings?.womdaPhoneNumber || '55315661'}</p>
              </div>
          </div>
      </section>

      {/* WhatsApp Floating Action Button */}
      <button 
        onClick={openWhatsAppHelp}
        className="fixed bottom-10 right-10 z-[100] w-16 h-16 bg-[#25D366] text-white rounded-full flex items-center justify-center shadow-2xl hover:scale-110 active:scale-95 transition-all shadow-green-500/40 group"
        title="تحدث معنا عبر واتساب"
      >
        <MessageCircle size={32} fill="white" className="text-[#25D366]" />
        <div className="absolute right-20 bg-white text-black px-4 py-2 rounded-xl text-xs font-black whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none border border-gray-200">
           تحدث مع فريق التفعيل الآن
        </div>
      </button>
      
      <footer className="mt-32 text-gray-700 text-[10px] font-black uppercase tracking-[0.6em] text-center">
          © {new Date().getFullYear()} المركز السوري للعلوم • الكويت
      </footer>
    </div>
  );
};

export default LandingPage;


import React, { useState, useEffect } from 'react';
import { GoogleGenAI } from "@google/genai";
import { PHYSICS_TOPICS, PRICING_PLANS, TESTIMONIALS } from '../constants';
import { dbService } from '../services/db';

interface LandingPageProps {
  onStart: () => void;
}

const LandingPage: React.FC<LandingPageProps> = ({ onStart }) => {
  const [showVideoModal, setShowVideoModal] = useState(false);
  const [videoUrl, setVideoUrl] = useState<string | null>(null);
  const [manualVideo, setManualVideo] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [genStatus, setGenStatus] = useState('');

  // Load manual video on mount
  useEffect(() => {
    const loadConfig = async () => {
      const vid = await dbService.getIntroVideo();
      if (vid) setManualVideo(vid);
    };
    loadConfig();
  }, []);

  const handleWatchVideo = async () => {
    setShowVideoModal(true);
    
    if (videoUrl) return; 
    if (manualVideo) {
      setVideoUrl(manualVideo);
      return;
    }

    try {
        if ((window as any).aistudio?.hasSelectedApiKey) {
            const hasKey = await (window as any).aistudio.hasSelectedApiKey();
            if (!hasKey) {
                await (window as any).aistudio.openSelectKey();
            }
        }
    } catch (e) {
        console.warn("API Key check skipped or failed", e);
    }

    try {
        setIsGenerating(true);
        setGenStatus('جاري الاتصال باستوديو Veo...');
        
        const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
        
        let operation = await ai.models.generateVideos({
            model: 'veo-3.1-fast-generate-preview',
            prompt: 'Cinematic intro for Syrian Science Center. Golden atoms spinning, mathematical equations floating in a dark blue futuristic laboratory, particles of light. Text "SYRIA" appears in gold. High quality, 4k resolution, slow motion.',
            config: {
                numberOfVideos: 1,
                aspectRatio: '16:9'
            }
        });

        setGenStatus('جاري رندرة المشاهد العلمية (قد يستغرق دقيقة)...');
        
        while (!operation.done) {
            await new Promise(r => setTimeout(r, 5000));
            operation = await ai.operations.getVideosOperation({operation: operation});
        }

        if (operation.response?.generatedVideos?.[0]?.video?.uri) {
            const uri = operation.response.generatedVideos[0].video.uri;
            setVideoUrl(`${uri}&key=${process.env.API_KEY}`);
        } else {
            setGenStatus('تعذر إنشاء الفيديو. يرجى المحاولة لاحقاً.');
        }
    } catch (e) {
        console.error("Video Gen Error:", e);
        setGenStatus('حدث خطأ في النظام. تأكد من صلاحية المفتاح.');
    } finally {
        setIsGenerating(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0f172a] text-white font-['Tajawal'] relative overflow-x-hidden selection:bg-sky-500/30" dir="rtl">
      
      {/* Background Ambience */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
         <div className="absolute top-[-10%] right-[-10%] w-[800px] h-[800px] bg-sky-600/10 rounded-full blur-[120px] animate-pulse-slow"></div>
         <div className="absolute bottom-[-10%] left-[-10%] w-[600px] h-[600px] bg-indigo-600/10 rounded-full blur-[120px] animate-pulse-slow" style={{ animationDelay: '2s' }}></div>
         <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')] opacity-5"></div>
      </div>

      {/* Video Modal */}
      {showVideoModal && (
        <div className="fixed inset-0 z-[100] bg-slate-900/90 backdrop-blur-xl flex items-center justify-center p-4 md:p-10 animate-fadeIn">
            <div className="relative w-full max-w-5xl bg-slate-900 border border-white/10 rounded-[30px] overflow-hidden shadow-2xl flex flex-col">
                <button 
                    onClick={() => setShowVideoModal(false)} 
                    className="absolute top-6 left-6 z-20 w-10 h-10 bg-white/10 rounded-full flex items-center justify-center hover:bg-white hover:text-slate-900 transition-all"
                >
                    ✕
                </button>

                <div className="aspect-video bg-black relative flex items-center justify-center">
                    {isGenerating ? (
                        <div className="text-center space-y-6">
                            <div className="relative w-20 h-20 mx-auto">
                                <div className="absolute inset-0 border-4 border-sky-500/30 rounded-full animate-spin"></div>
                                <div className="absolute inset-0 border-4 border-t-sky-500 rounded-full animate-spin"></div>
                            </div>
                            <div>
                                <h3 className="text-xl font-bold text-white mb-2">جاري إنتاج الفيديو التعريفي</h3>
                                <p className="text-sky-400 text-sm animate-pulse">{genStatus}</p>
                            </div>
                        </div>
                    ) : videoUrl ? (
                        <video src={videoUrl} controls autoPlay className="w-full h-full object-cover" />
                    ) : (
                        <div className="text-center">
                            <p className="text-red-400 font-bold mb-4">{genStatus || 'لا يوجد فيديو متاح حالياً'}</p>
                            <button onClick={handleWatchVideo} className="bg-sky-500 text-white px-8 py-3 rounded-full font-bold text-sm">إعادة المحاولة</button>
                        </div>
                    )}
                </div>
                
                <div className="p-8 bg-white/[0.02] border-t border-white/5 flex justify-between items-center">
                    <div>
                        <h3 className="text-xl font-bold text-white">عن المركز السوري للعلوم</h3>
                        <p className="text-slate-400 text-sm">{manualVideo ? 'فيديو تعريفي رسمي' : 'فيديو تم إنتاجه بواسطة الذكاء الاصطناعي (Veo Model)'}</p>
                    </div>
                    {videoUrl && (
                        <a href={videoUrl} download className="bg-white/10 px-6 py-3 rounded-xl text-xs font-bold hover:bg-white hover:text-slate-900 transition-all">
                            تحميل الفيديو 📥
                        </a>
                    )}
                </div>
            </div>
        </div>
      )}

      {/* Navigation */}
      <nav className="relative z-50 px-6 py-6 md:px-12 flex justify-between items-center max-w-7xl mx-auto">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-gradient-to-tr from-sky-500 to-blue-600 rounded-xl flex items-center justify-center shadow-lg shadow-sky-500/20">
             <span className="text-xl font-bold text-white">⚛️</span>
          </div>
          <div className="leading-tight">
            <h1 className="text-xl font-bold text-white tracking-tight">المركز السوري للعلوم</h1>
          </div>
        </div>
        <div className="hidden md:flex gap-8 text-sm font-medium text-slate-300">
           <a href="#tracks" className="hover:text-white transition-colors">الدروس</a>
           <a href="#pricing" className="hover:text-white transition-colors">الكويزات</a>
           <a href="#features" className="hover:text-white transition-colors">AI مدرس</a>
        </div>
        <button 
          onClick={onStart}
          className="bg-white text-slate-900 px-6 py-2.5 rounded-full font-bold text-xs uppercase tracking-widest hover:bg-sky-50 transition-all shadow-lg"
        >
          ابدأ الآن
        </button>
      </nav>

      {/* Hero Section */}
      <section className="relative z-40 px-6 pt-16 pb-24 md:pt-24 md:pb-32 max-w-7xl mx-auto flex flex-col md:flex-row items-center gap-16">
        <div className="flex-1 text-center md:text-right">
           <div className="inline-block px-4 py-1.5 rounded-full bg-sky-500/10 border border-sky-500/20 text-sky-400 text-xs font-bold mb-6">
              منهج 2026 المطور
           </div>
           <h2 className="text-5xl md:text-7xl font-bold leading-tight mb-6 tracking-tight text-white">
             اكتشف العلوم
             <br/>
             <span className="text-transparent bg-clip-text bg-gradient-to-r from-sky-400 to-indigo-400">بأسلوب المستقبل</span>
           </h2>
           <p className="text-slate-400 text-lg md:text-xl leading-relaxed max-w-2xl mb-10 md:ml-auto">
             منصة تعليمية متكاملة تدمج المنهج السوري مع أحدث تقنيات الذكاء الاصطناعي والمحاكاة التفاعلية.
           </p>
           
           <div className="flex flex-col sm:flex-row gap-4 justify-center md:justify-start">
              <button onClick={onStart} className="bg-sky-500 text-white px-10 py-4 rounded-2xl font-bold text-sm hover:bg-sky-400 transition-all shadow-[0_10px_30px_rgba(56,189,248,0.2)]">
                 ابدأ رحلة التعلم 🚀
              </button>
              <button 
                onClick={handleWatchVideo}
                className="bg-white/5 border border-white/10 text-white px-10 py-4 rounded-2xl font-bold text-sm hover:bg-white/10 transition-all flex items-center justify-center gap-2 group"
              >
                 <span className="w-6 h-6 rounded-full bg-white text-slate-900 flex items-center justify-center text-[10px] group-hover:scale-110 transition-transform">▶</span>
                 فيديو تعريفي
              </button>
           </div>
        </div>

        {/* Hero Image / Abstract */}
        <div className="flex-1 relative w-full max-w-lg">
           <div className="absolute inset-0 bg-gradient-to-tr from-sky-500/20 to-indigo-500/20 rounded-full blur-[80px]"></div>
           <div className="relative aspect-square bg-slate-800/50 backdrop-blur-xl rounded-[40px] border border-white/10 p-2 flex items-center justify-center shadow-2xl overflow-hidden">
              <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/stardust.png')] opacity-20"></div>
              <div className="relative w-64 h-64 animate-float-slow">
                 <div className="absolute inset-0 border border-sky-500/30 rounded-full animate-spin-slow" style={{ animationDuration: '20s' }}></div>
                 <div className="absolute inset-4 border border-indigo-500/30 rounded-full animate-spin-slow" style={{ animationDirection: 'reverse', animationDuration: '15s' }}></div>
                 <div className="absolute inset-0 flex items-center justify-center">
                    <span className="text-8xl filter drop-shadow-[0_0_20px_rgba(56,189,248,0.5)]">⚛️</span>
                 </div>
              </div>
           </div>
        </div>
      </section>

      {/* Teachers Section */}
      <section className="py-24 px-6 relative z-30 bg-slate-900/50 border-t border-white/5">
         <div className="max-w-7xl mx-auto">
            <div className="text-center mb-16">
               <span className="text-sky-400 font-bold text-xs uppercase tracking-[0.2em]">الكوادر الأكاديمية</span>
               <h2 className="text-3xl md:text-4xl font-bold mt-3 text-white">نخبة معلمي <span className="text-sky-400">الفيزياء</span></h2>
               <p className="text-slate-400 mt-4 max-w-lg mx-auto">خبرة تمتد لأكثر من 15 عاماً في المناهج السورية، نقدمها لكم بأحدث الوسائل.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
               {[
                 { name: 'أ. جاسم الكندري', role: 'رئيس القسم', spec: 'فيزياء الثانوية والجامعة', img: '👨‍🏫' },
                 { name: 'د. سارة العتيبي', role: 'مشرفة أكاديمية', spec: 'الفيزياء النووية', img: '👩‍🔬' },
                 { name: 'م. أحمد الفيلكاوي', role: 'مدرب أول', spec: 'الميكانيكا والمقذوفات', img: '👨‍🔧' }
               ].map((teacher, i) => (
                 <div key={i} className="bg-slate-800/40 border border-white/5 rounded-[30px] p-8 text-center group hover:border-sky-500/30 transition-all hover:-translate-y-2">
                    <div className="w-24 h-24 mx-auto bg-slate-700/50 rounded-full flex items-center justify-center text-5xl mb-6 shadow-inner group-hover:scale-110 transition-transform">
                       {teacher.img}
                    </div>
                    <h3 className="text-xl font-bold text-white mb-1">{teacher.name}</h3>
                    <p className="text-sky-400 text-xs font-bold uppercase tracking-widest mb-4">{teacher.role}</p>
                    <p className="text-slate-400 text-sm">{teacher.spec}</p>
                 </div>
               ))}
            </div>
         </div>
      </section>
      
      {/* Footer */}
      <footer className="py-12 px-6 border-t border-white/5 bg-[#0b1120] relative z-30">
         <div className="max-w-7xl mx-auto pt-8 flex flex-col md:flex-row justify-between items-center gap-4">
            <p className="text-xs text-slate-500 font-bold uppercase">© 2026 المركز السوري للعلوم. جميع الحقوق محفوظة.</p>
            <div className="flex gap-6 text-xs text-slate-500 font-bold">
               <a href="#" className="hover:text-white transition-colors">سياسة الخصوصية</a>
               <a href="#" className="hover:text-white transition-colors">الشروط والأحكام</a>
            </div>
         </div>
      </footer>
    </div>
  );
};

export default LandingPage;

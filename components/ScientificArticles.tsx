
import React, { useState, useEffect, useRef } from 'react';
import { MOCK_ARTICLES } from '../constants';
import { Article } from '../types';

const MathRenderer: React.FC<{ content: string }> = ({ content }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!containerRef.current) return;
    const parts = content.split(/(\$\$[\s\S]*?\$\$|\$.*?\$)/g);
    containerRef.current.innerHTML = '';
    parts.forEach(part => {
      if (!part) return;
      const span = document.createElement('span');
      if (part.startsWith('$$')) {
        span.className = 'block bg-black/20 p-4 my-4 rounded-xl font-mono text-center text-cyan-300';
        span.textContent = part.slice(2, -2).trim();
      } else if (part.startsWith('$')) {
        span.className = 'inline-block text-[#00d2ff] font-bold font-mono bg-white/5 px-2 rounded mx-1';
        span.textContent = part.slice(1, -1).trim();
      } else {
        let text = part.split('\n').map(line => {
          if (line.startsWith('### ')) {
            return `<h3 class="text-3xl font-black text-white mt-12 mb-6 tracking-tighter">${line.slice(4)}</h3>`;
          }
          return line;
        }).join('\n');

        text = text.replace(/\n\n/g, '<br/><br/>')
                   .replace(/\*\*(.*?)\*\*/g, '<b class="text-[#00d2ff]">$1</b>');
                   
        span.innerHTML = text;
      }
      containerRef.current?.appendChild(span);
    });
  }, [content]);

  return <div ref={containerRef} className="article-body-text leading-[1.8] text-xl text-gray-300" />;
};

const ScientificArticles: React.FC = () => {
  const [selectedArticle, setSelectedArticle] = useState<Article | null>(null);
  const [readingProgress, setReadingProgress] = useState(0);

  useEffect(() => {
    const handleScroll = () => {
      if (!selectedArticle) return;
      const totalHeight = document.documentElement.scrollHeight - window.innerHeight;
      const progress = (window.scrollY / totalHeight) * 100;
      setReadingProgress(progress);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, [selectedArticle]);

  if (selectedArticle) {
    return (
      <div className="min-h-screen bg-[#010304] animate-fadeIn font-['Tajawal'] text-white relative">
        <div className="fixed top-0 left-0 h-1.5 bg-[#00d2ff] z-[100] transition-all duration-300 shadow-[0_0_15px_#00d2ff]" style={{ width: `${readingProgress}%` }} />

        <div className="relative h-[70vh] overflow-hidden">
           <img src={selectedArticle.imageUrl} className="w-full h-full object-cover scale-105" alt={selectedArticle.title} />
           <div className="absolute inset-0 bg-gradient-to-t from-[#010304] via-[#010304]/60 to-transparent"></div>
           
           <div className="absolute bottom-20 left-1/2 -translate-x-1/2 w-full max-w-5xl px-8">
              <button 
                onClick={() => setSelectedArticle(null)}
                className="mb-10 flex items-center gap-4 text-white/50 hover:text-[#00d2ff] transition-all uppercase tracking-[0.4em] text-[10px] font-black group"
              >
                <span className="text-xl group-hover:-translate-x-2 transition-transform">←</span> العودة للمكتبة
              </button>
              
              <div className="flex gap-4 mb-8">
                 <span className="bg-[#00d2ff] text-black px-6 py-2 rounded-full text-[10px] font-black uppercase tracking-widest shadow-2xl">{selectedArticle.category}</span>
                 <span className="bg-white/10 backdrop-blur-md text-white/80 px-6 py-2 rounded-full text-[10px] font-black uppercase tracking-widest border border-white/5">⏱ {selectedArticle.readTime}</span>
              </div>
              
              <h1 className="text-6xl md:text-8xl font-black tracking-tighter leading-none mb-6 animate-slideUp">{selectedArticle.title}</h1>
              <p className="text-xl text-gray-400 max-w-2xl leading-relaxed italic border-r-4 border-[#00d2ff] pr-6">{selectedArticle.summary}</p>
           </div>
        </div>

        <div className="max-w-4xl mx-auto py-24 px-8">
           <div className="glass-panel p-16 md:p-24 rounded-[80px] border-white/5 bg-white/[0.01] relative">
              <div className="absolute top-20 left-[-60px] text-[120px] font-black text-white/[0.02] -rotate-90 pointer-events-none select-none">فيزياء</div>

              <MathRenderer content={selectedArticle.content} />
              
              <div className="mt-32 pt-16 border-t border-white/5">
                 <div className="bg-[#00d2ff]/5 p-12 rounded-[50px] border border-[#00d2ff]/20 mb-20">
                    <h4 className="text-2xl font-black mb-6 flex items-center gap-4">
                       <span className="text-3xl">👤</span> تعليق تربوي
                    </h4>
                    <p className="text-lg text-gray-400 leading-relaxed italic">
                      "هذا الموضوع يرتبط بما تدرسه في الفصل. الفيزياء ليست مجرد معادلات، بل هي تفسير للكون من حولك."
                    </p>
                 </div>

                 <div className="flex flex-col md:flex-row items-center justify-between gap-12">
                    <div className="text-right">
                       <p className="text-[10px] font-black text-gray-500 uppercase tracking-widest mb-2">ارتباط بالمنهج</p>
                       <p className="text-xl font-bold text-[#00d2ff]">المنهج السوري - الفيزياء</p>
                    </div>
                    <div className="flex gap-6">
                       <button className="bg-white/5 hover:bg-white/10 p-6 rounded-[30px] transition-all border border-white/5 group">
                          <span className="text-2xl group-hover:scale-125 transition-transform block">🔖</span>
                       </button>
                       <button className="bg-white/5 hover:bg-white/10 p-6 rounded-[30px] transition-all border border-white/5 group">
                          <span className="text-2xl group-hover:scale-125 transition-transform block">📤</span>
                       </button>
                       <button 
                        onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
                        className="bg-[#00d2ff] text-black px-10 py-5 rounded-[30px] font-black text-[10px] uppercase tracking-widest hover:scale-105 transition-all"
                       >
                         للأعلى ↑
                       </button>
                    </div>
                 </div>
              </div>
           </div>

           <div className="mt-24 text-center pb-20">
              <button 
                onClick={() => setSelectedArticle(null)}
                className="bg-white text-black px-16 py-6 rounded-[40px] font-black text-xs uppercase tracking-widest uppercase tracking-[0.4em] hover:scale-110 transition-all shadow-[0_30px_100px_rgba(255,255,255,0.2)]"
              >
                إغلاق المقال
              </button>
           </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto py-16 px-8 animate-fadeIn font-['Tajawal']">
      <header className="mb-24">
        <div className="inline-block px-6 py-2 bg-[#00d2ff]/10 border border-[#00d2ff]/20 rounded-full text-[10px] font-black uppercase tracking-widest text-[#00d2ff] mb-8">مقالات إثرائية</div>
        <h2 className="text-7xl font-black mb-6 tracking-tighter">المكتبة <span className="text-[#00d2ff] text-glow">العلمية</span></h2>
        <p className="text-gray-500 max-w-3xl text-2xl leading-relaxed">تطبيقات عملية ونظريات حديثة توسع مداركك في علم الفيزياء.</p>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-16">
        {MOCK_ARTICLES.map((art) => (
          <div 
            key={art.id} 
            onClick={() => { setSelectedArticle(art); window.scrollTo(0, 0); }}
            className="glass-card group rounded-[80px] overflow-hidden border-white/5 hover:border-[#00d2ff]/30 transition-all duration-700 flex flex-col cursor-pointer hover:translate-y-[-15px]"
          >
             <div className="h-80 relative overflow-hidden">
                <img src={art.imageUrl} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-1000 grayscale opacity-40 group-hover:grayscale-0 group-hover:opacity-100" alt={art.title} />
                <div className="absolute inset-0 bg-gradient-to-t from-[#010304] to-transparent opacity-90"></div>
                <div className="absolute bottom-10 right-10">
                   <span className="bg-[#00d2ff] text-black px-6 py-2.5 rounded-full text-[10px] font-black uppercase tracking-widest shadow-2xl">{art.category}</span>
                </div>
             </div>
             <div className="p-16 flex-1 flex flex-col bg-gradient-to-b from-[#0a1118] to-[#010304]">
                <h3 className="text-4xl font-black text-white group-hover:text-[#00d2ff] transition-colors duration-500 mb-6 leading-tight">{art.title}</h3>
                <p className="text-gray-400 text-lg leading-relaxed mb-12 flex-1 opacity-70 group-hover:opacity-100 transition-opacity">{art.summary}</p>
                <div className="flex justify-between items-center pt-10 border-t border-white/5">
                   <span className="text-[10px] font-black text-gray-500 uppercase tracking-widest">{art.readTime} قراءة</span>
                   <span className="text-[#00d2ff] font-black text-[12px] uppercase tracking-widest group-hover:translate-x-[-10px] transition-transform">اقرأ المزيد ←</span>
                </div>
             </div>
          </div>
        ))}
        
        <div className="glass-panel p-16 rounded-[80px] border-dashed border-white/10 flex flex-col items-center justify-center text-center group hover:border-[#00d2ff]/40 transition-all relative overflow-hidden">
           <div className="absolute inset-0 bg-[#00d2ff]/5 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />
           <div className="w-24 h-24 bg-white/5 rounded-[40px] flex items-center justify-center text-5xl mb-8 group-hover:scale-110 transition-transform">✍️</div>
           <h3 className="text-3xl font-black mb-4 uppercase tracking-tighter">شاركنا إبداعك</h3>
           <p className="text-sm text-gray-500 uppercase tracking-widest max-w-[200px] leading-relaxed">هل لديك مقال علمي تود نشره؟ تواصل معنا.</p>
           <button className="mt-10 text-[10px] font-black text-[#00d2ff] uppercase tracking-widest hover:underline">إرسال مقال</button>
        </div>
      </div>
    </div>
  );
};

export default ScientificArticles;

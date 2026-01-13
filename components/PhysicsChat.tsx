
import React, { useState, useRef, useEffect } from 'react';
import { getAdvancedPhysicsInsight } from '../services/gemini';
import { Message } from '../types';

const PhysicsChat: React.FC<{ grade: string }> = ({ grade }) => {
  const [messages, setMessages] = useState<Message[]>([
    { 
      role: 'assistant', 
      content: `مرحباً بك! أنا مساعدك الذكي لمادة الفيزياء. اسألني عن أي قانون، تعريف، أو مسألة تواجه صعوبة فيها، وسأقوم بتبسيطها لك.`, 
      timestamp: new Date() 
    }
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showThinking, setShowThinking] = useState(true);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => { scrollRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [messages, isLoading]);

  const handleSend = async () => {
    if (!input.trim() || isLoading) return;
    const userMsg = input;
    setInput('');
    setMessages(prev => [...prev, { role: 'user', content: userMsg, timestamp: new Date() }]);
    setIsLoading(true);

    try {
      const { text, thinking } = await getAdvancedPhysicsInsight(userMsg, grade);
      setMessages(prev => [...prev, { role: 'assistant', content: text, thinking, timestamp: new Date() }]);
    } catch (e) {
      setMessages(prev => [...prev, { role: 'assistant', content: "عذراً، حدث خطأ في الاتصال. يرجى المحاولة مرة أخرى.", timestamp: new Date() }]);
    } finally {
      setIsLoading(false);
    }
  };
  
  const processText = (content: string) => {
    // The global auto-renderer now handles KaTeX. We just need to handle line breaks.
    return <div dangerouslySetInnerHTML={{ __html: content.replace(/\n/g, '<br />') }} />;
  };

  return (
    <div className="h-[850px] flex flex-col glass-panel rounded-[60px] border-white/5 overflow-hidden shadow-2xl relative font-['Tajawal']">
      <div className="p-8 bg-white/[0.03] border-b border-white/5 flex justify-between items-center backdrop-blur-3xl">
        <div className="flex items-center gap-6">
          <div className="w-16 h-16 rounded-[25px] bg-[#fbbf24] text-black flex items-center justify-center text-4xl shadow-lg animate-float">🤖</div>
          <div>
            <h3 className="text-2xl font-black">المساعد <span className="text-[#fbbf24]">الذكي</span></h3>
            <p className="text-[10px] text-[#00d2ff] font-black uppercase tracking-widest">مساعدك في الفيزياء</p>
          </div>
        </div>
        <button onClick={() => setShowThinking(!showThinking)} className={`px-6 py-2.5 rounded-2xl text-[9px] font-black uppercase tracking-widest border transition-all ${showThinking ? 'bg-[#00d2ff]/20 border-[#00d2ff] text-[#00d2ff]' : 'bg-white/5 border-white/10 text-gray-500'}`}>
          {showThinking ? 'إخفاء خطوات التفكير' : 'عرض خطوات التفكير'}
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-10 space-y-12 no-scrollbar bg-gradient-to-b from-black/20 to-transparent">
        {messages.map((m, i) => (
          <div key={i} className={`flex flex-col ${m.role === 'user' ? 'items-start' : 'items-end'}`}>
            {m.thinking && showThinking && (
              <div className="max-w-[85%] mb-6 p-8 bg-blue-500/5 border border-blue-500/10 rounded-[40px] text-[11px] text-blue-300 font-mono italic animate-slideUp text-right">
                <div className="flex items-center gap-3 mb-4">
                    <span className="w-1.5 h-1.5 bg-blue-400 rounded-full animate-ping"></span>
                    <p className="font-black uppercase tracking-widest">طريقة التفكير:</p>
                </div>
                {m.thinking}
              </div>
            )}
            <div className={`max-w-[85%] p-10 rounded-[45px] shadow-2xl relative transition-all ${
              m.role === 'user' 
                ? 'bg-gradient-to-tr from-blue-700 to-blue-600 text-white font-bold rounded-tl-none border-l-4 border-white/20' 
                : 'bg-white/5 text-gray-200 border border-white/10 rounded-tr-none text-right leading-relaxed text-xl'
            }`}>
              <div>{processText(m.content)}</div>
            </div>
            <span className="text-[9px] text-gray-600 font-black mt-4 uppercase tracking-widest">
              {m.role === 'user' ? 'الطالب' : 'المساعد الذكي'} • {m.timestamp.toLocaleTimeString()}
            </span>
          </div>
        ))}
        {isLoading && (
          <div className="flex flex-col items-end gap-4 animate-pulse">
            <div className="w-48 h-2 bg-white/5 rounded-full"></div>
            <div className="w-80 h-32 bg-white/5 rounded-[45px]"></div>
          </div>
        )}
        <div ref={scrollRef} />
      </div>

      <div className="p-10 bg-black/60 border-t border-white/10 flex gap-6 backdrop-blur-2xl">
        <input 
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyPress={(e) => e.key === 'Enter' && handleSend()}
          placeholder="اكتب سؤالك هنا..."
          className="flex-1 bg-white/5 border border-white/10 rounded-full px-10 py-6 text-white outline-none focus:border-[#fbbf24] transition-all font-bold text-lg"
        />
        <button 
          onClick={handleSend}
          disabled={isLoading || !input.trim()}
          className="bg-[#fbbf24] text-black px-16 rounded-full font-black text-xs uppercase tracking-widest shadow-2xl hover:scale-105 active:scale-95 transition-all disabled:opacity-30"
        >
          {isLoading ? 'جاري الكتابة...' : 'إرسال'}
        </button>
      </div>
    </div>
  );
};

export default PhysicsChat;
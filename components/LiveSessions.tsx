
import React, { useState, useEffect, useRef } from 'react';
import { LiveSession } from '../types';

const LiveSessions: React.FC = () => {
  const [activeSession, setActiveSession] = useState<LiveSession | null>(null);
  const [viewMode, setViewMode] = useState<'WHITEBOARD' | 'MEDIA' | 'CAM'>('WHITEBOARD');
  const [chatInput, setChatInput] = useState('');
  const [chatMessages, setChatMessages] = useState<{user: string, msg: string, role: string}[]>([
    { user: 'أ. جاسم', msg: 'أهلاً بكم يا شباب في درس اليوم عن القوى النووية.', role: 'teacher' },
    { user: 'أحمد', msg: 'جاهزين يا أستاذ 🚀', role: 'student' }
  ]);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const sessions: LiveSession[] = [
    { id: 'l1', title: 'الفيزياء النووية - الفصل الافتراضي', teacherName: 'أ. جاسم الكندري', startTime: 'الآن', status: 'live', topic: 'نشاط إشعاعي' },
    { id: 'l2', title: 'مراجعة الميكانيكا', teacherName: 'أ. ريم الشمري', startTime: 'غداً 17:00', status: 'upcoming', topic: 'الحركة' },
  ];

  // محاكاة الكتابة على السبورة
  useEffect(() => {
    if (activeSession && viewMode === 'WHITEBOARD') {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        // إعداد السبورة
        canvas.width = canvas.offsetWidth;
        canvas.height = canvas.offsetHeight;
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';
        ctx.lineWidth = 4;
        ctx.strokeStyle = '#fff';

        let frame = 0;
        const draw = () => {
            if (frame < 100) {
                // محاكاة رسم معادلة E = mc^2
                ctx.beginPath();
                // E
                if(frame < 20) { ctx.moveTo(100, 100); ctx.lineTo(100, 200); }
                if(frame > 20 && frame < 30) { ctx.moveTo(100, 100); ctx.lineTo(180, 100); }
                if(frame > 30 && frame < 40) { ctx.moveTo(100, 150); ctx.lineTo(160, 150); }
                if(frame > 40 && frame < 50) { ctx.moveTo(100, 200); ctx.lineTo(180, 200); }
                
                // =
                if(frame > 50 && frame < 60) { ctx.moveTo(220, 140); ctx.lineTo(280, 140); }
                if(frame > 60 && frame < 70) { ctx.moveTo(220, 160); ctx.lineTo(280, 160); }

                // m
                if(frame > 70 && frame < 90) { ctx.font = 'bold 120px Hand'; ctx.fillStyle='#fbbf24'; ctx.fillText('m', 320, 200); }
                
                // c^2
                if(frame > 90) { ctx.fillStyle='#00d2ff'; ctx.fillText('c²', 450, 200); }

                ctx.stroke();
                frame++;
                requestAnimationFrame(draw);
            }
        };
        draw();
    }
  }, [activeSession, viewMode]);

  const handleSendMessage = () => {
    if (!chatInput) return;
    setChatMessages([...chatMessages, { user: 'أنت', msg: chatInput, role: 'student' }]);
    setChatInput('');
  };

  if (activeSession) {
    return (
      <div className="fixed inset-0 z-[100] bg-[#0a1118] flex flex-col font-['Tajawal'] text-white overflow-hidden">
        {/* Header */}
        <header className="px-6 py-4 bg-[#010304] border-b border-white/10 flex flex-col sm:flex-row justify-between items-center gap-4">
           <div className="flex items-center gap-4">
              <button onClick={() => setActiveSession(null)} className="text-gray-500 hover:text-white transition-all text-xl bg-white/5 p-2 rounded-full">✕</button>
              <div>
                 <h1 className="text-base md:text-lg font-black text-white flex items-center gap-2">
                    <span className="w-2.5 h-2.5 bg-red-500 rounded-full animate-pulse"></span>
                    {activeSession.title}
                 </h1>
                 <p className="text-[10px] text-gray-400">الفصل الافتراضي • {activeSession.teacherName}</p>
              </div>
           </div>
           
           <div className="flex flex-wrap justify-center gap-1 bg-white/5 rounded-xl p-1 border border-white/10">
              <button onClick={() => setViewMode('WHITEBOARD')} className={`px-4 md:px-6 py-2 rounded-lg text-[10px] font-black uppercase transition-all ${viewMode === 'WHITEBOARD' ? 'bg-[#00d2ff] text-black' : 'text-gray-400 hover:text-white'}`}>السبورة</button>
              <button onClick={() => setViewMode('MEDIA')} className={`px-4 md:px-6 py-2 rounded-lg text-[10px] font-black uppercase transition-all ${viewMode === 'MEDIA' ? 'bg-[#fbbf24] text-black' : 'text-gray-400 hover:text-white'}`}>الوسائط</button>
              <button onClick={() => setViewMode('CAM')} className={`px-4 md:px-6 py-2 rounded-lg text-[10px] font-black uppercase transition-all ${viewMode === 'CAM' ? 'bg-white text-black' : 'text-gray-400 hover:text-white'}`}>الكاميرا</button>
           </div>
        </header>

        <div className="flex-1 flex flex-col lg:flex-row overflow-hidden">
           {/* Main Stage */}
           <div className="flex-1 bg-[#050505] relative flex flex-col">
              
              {/* Content Area */}
              <div className="flex-1 relative m-2 md:m-4 rounded-[30px] border border-white/10 overflow-hidden bg-[#1a1a1a] shadow-2xl">
                 {viewMode === 'WHITEBOARD' && (
                    <div className="w-full h-full relative cursor-crosshair">
                        <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/black-scales.png')] opacity-20"></div>
                        <canvas ref={canvasRef} className="w-full h-full relative z-10" />
                        <div className="absolute bottom-6 left-6 bg-black/60 backdrop-blur-md px-4 py-2 rounded-full border border-white/10 flex items-center gap-3">
                            <span className="w-2 h-2 bg-[#00d2ff] rounded-full"></span>
                            <span className="text-[10px] font-bold text-gray-300">أ. جاسم يكتب الآن...</span>
                        </div>
                    </div>
                 )}

                 {viewMode === 'MEDIA' && (
                    <div className="w-full h-full flex items-center justify-center bg-black p-4">
                        <div className="text-center">
                            <div className="w-20 h-20 bg-white/5 rounded-full flex items-center justify-center mx-auto mb-4 animate-pulse">
                                <span className="text-4xl">🎬</span>
                            </div>
                            <h3 className="text-xl font-bold mb-2">مقطع توضيحي: الانشطار النووي</h3>
                            <p className="text-gray-500 text-sm">يتم مشاركة الوسائط عالية الجودة من جهاز المعلم مباشرة</p>
                        </div>
                    </div>
                 )}

                 {viewMode === 'CAM' && (
                    <img src="https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?auto=format&fit=crop&q=80&w=1000" className="w-full h-full object-cover" />
                 )}
              </div>

              {/* System Info Bar */}
              <div className="px-4 md:px-8 py-4 bg-[#0a1118] border-t border-white/5 text-center">
                 <p className="text-[10px] md:text-xs text-gray-400 leading-relaxed font-medium max-w-4xl mx-auto">
                   "من خلال هذا النظام يمكن للطالب مشاهدة كل ما أقوم به من كتابة على <span className="text-[#00d2ff] font-bold">السبورة الإفتراضية</span> الخاصة بي من خلال جهازه الخاص، وأيضاً المحادثة الفورية معي. وبذلك أصبح الطالب <span className="text-[#fbbf24] font-bold">مشاركاً في الدرس</span> وليس متلقياً فقط للمعلومة."
                 </p>
              </div>
           </div>

           {/* Interactive Sidebar */}
           <div className="w-full lg:w-96 bg-[#010304] border-t lg:border-t-0 lg:border-r border-white/5 flex flex-col h-96 lg:h-auto">
              <div className="p-6 border-b border-white/5 bg-white/[0.02]">
                 <h4 className="text-[10px] font-black text-[#00d2ff] uppercase tracking-widest mb-4">أدوات المشاركة</h4>
                 <div className="flex gap-2">
                    <button className="flex-1 bg-white/5 hover:bg-white/10 py-3 rounded-xl border border-white/5 flex flex-col items-center gap-1 transition-all">
                        <span className="text-lg">✋</span>
                        <span className="text-[8px] font-bold text-gray-400">رفع اليد</span>
                    </button>
                    <button className="flex-1 bg-white/5 hover:bg-white/10 py-3 rounded-xl border border-white/5 flex flex-col items-center gap-1 transition-all">
                        <span className="text-lg">🎙️</span>
                        <span className="text-[8px] font-bold text-gray-400">مداخلة صوتية</span>
                    </button>
                    <button className="flex-1 bg-white/5 hover:bg-white/10 py-3 rounded-xl border border-white/5 flex flex-col items-center gap-1 transition-all">
                        <span className="text-lg">📸</span>
                        <span className="text-[8px] font-bold text-gray-400">لقطة شاشة</span>
                    </button>
                 </div>
              </div>

              <div className="flex-1 overflow-y-auto p-4 space-y-4 no-scrollbar">
                 {chatMessages.map((m, i) => (
                   <div key={i} className={`flex gap-3 ${m.role === 'student' ? 'flex-row-reverse' : ''} animate-slideUp`}>
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center text-[10px] font-black ${m.role === 'teacher' ? 'bg-[#fbbf24] text-black' : 'bg-[#00d2ff] text-black'}`}>
                         {m.user.charAt(0)}
                      </div>
                      <div className={`max-w-[80%] p-3 rounded-2xl text-xs font-medium leading-relaxed ${m.role === 'teacher' ? 'bg-[#fbbf24]/10 text-[#fbbf24] border border-[#fbbf24]/20 rounded-tr-none' : 'bg-white/5 text-gray-300 border border-white/5 rounded-tl-none'}`}>
                         <p className="text-[8px] font-black opacity-50 mb-1">{m.user}</p>
                         {m.msg}
                      </div>
                   </div>
                 ))}
              </div>

              <div className="p-4 bg-white/[0.02] border-t border-white/5">
                 <div className="relative">
                    <input 
                      type="text" 
                      value={chatInput}
                      onChange={(e) => setChatInput(e.target.value)}
                      onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                      placeholder="اكتب سؤالك للمعلم..."
                      className="w-full bg-black/60 border border-white/10 rounded-2xl px-4 py-4 pl-12 text-xs outline-none focus:border-[#00d2ff] transition-all"
                    />
                    <button onClick={handleSendMessage} className="absolute left-2 top-1/2 -translate-y-1/2 bg-[#00d2ff] text-black p-2 rounded-xl">
                       <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><line x1="22" y1="2" x2="11" y2="13"></line><polygon points="22 2 15 22 11 13 2 9 22 2"></polygon></svg>
                    </button>
                 </div>
              </div>
           </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto py-12 px-6 animate-fadeIn font-['Tajawal'] text-white">
      <div className="mb-16 text-center">
        <h2 className="text-5xl font-black mb-4 tracking-tighter">الفصل <span className="text-[#00d2ff] text-glow">الافتراضي</span></h2>
        <p className="text-gray-500 text-xl max-w-3xl mx-auto leading-relaxed">
           نظام تعليمي تفاعلي صُمم خصيصاً لطلابي وفق دراسات علمية وأبحاث استمرت لأعوام.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-10 mb-16">
         <div className="glass-panel p-10 rounded-[50px] border-[#00d2ff]/20 bg-gradient-to-br from-[#00d2ff]/5 to-transparent relative overflow-hidden group">
            <div className="absolute top-0 right-0 p-8 opacity-10 text-9xl group-hover:scale-110 transition-transform duration-700">🎨</div>
            <h3 className="text-2xl font-black mb-4">السبورة الإفتراضية</h3>
            <p className="text-gray-400 text-sm leading-relaxed mb-8">
               شاهد كل ما أقوم بكتابته لحظة بلحظة. الرسوم البيانية، المعادلات، والشروحات التوضيحية تظهر على جهازك كما لو كنت في الصف تماماً.
            </p>
            <div className="flex gap-2">
               <span className="px-3 py-1 bg-[#00d2ff]/10 text-[#00d2ff] text-[9px] font-black rounded-lg">Real-time</span>
               <span className="px-3 py-1 bg-[#00d2ff]/10 text-[#00d2ff] text-[9px] font-black rounded-lg">High Precision</span>
            </div>
         </div>

         <div className="glass-panel p-10 rounded-[50px] border-[#fbbf24]/20 bg-gradient-to-br from-[#fbbf24]/5 to-transparent relative overflow-hidden group">
            <div className="absolute top-0 right-0 p-8 opacity-10 text-9xl group-hover:scale-110 transition-transform duration-700">💬</div>
            <h3 className="text-2xl font-black mb-4">المشاركة الفعالة</h3>
            <p className="text-gray-400 text-sm leading-relaxed mb-8">
               أنت شريك في الدرس. استخدم المحادثة الفورية، اطلب الميكروفون، وشارك في حل المسائل. ودّع التلقي السلبي للمعلومة.
            </p>
            <div className="flex gap-2">
               <span className="px-3 py-1 bg-[#fbbf24]/10 text-[#fbbf24] text-[9px] font-black rounded-lg">Live Chat</span>
               <span className="px-3 py-1 bg-[#fbbf24]/10 text-[#fbbf24] text-[9px] font-black rounded-lg">Interactive</span>
            </div>
         </div>
      </div>

      <div className="border-t border-white/5 pt-12">
         <h3 className="text-2xl font-black mb-8 border-r-4 border-[#00d2ff] pr-4">الجلسات المتاحة</h3>
         <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {sessions.map(session => (
            <div 
                key={session.id} 
                className="bg-[#0a1118] border border-white/5 p-8 rounded-[40px] group hover:border-[#00d2ff]/30 transition-all cursor-pointer"
                onClick={() => setActiveSession(session)}
            >
                <div className="flex justify-between items-start mb-6">
                    <span className={`px-4 py-1.5 rounded-full text-[9px] font-black uppercase tracking-widest ${session.status === 'live' ? 'bg-red-500 text-white animate-pulse' : 'bg-white/10 text-gray-400'}`}>
                        {session.status === 'live' ? 'بث مباشر 🔴' : 'مجدولة 📅'}
                    </span>
                    <span className="text-2xl">👨‍🏫</span>
                </div>
                <h4 className="text-xl font-bold text-white mb-2 group-hover:text-[#00d2ff] transition-colors">{session.title}</h4>
                <p className="text-xs text-gray-500 font-bold mb-6">{session.teacherName}</p>
                <button className="w-full py-4 bg-white/5 rounded-2xl text-[10px] font-black uppercase hover:bg-white hover:text-black transition-all">
                    {session.status === 'live' ? 'دخول الفصل الآن' : 'تذكير بموعد الدرس'}
                </button>
            </div>
            ))}
         </div>
      </div>
    </div>
  );
};

export default LiveSessions;

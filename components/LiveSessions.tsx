
import React, { useState, useEffect } from 'react';
import { LiveSession } from '../types';
import { dbService } from '../services/db';
import { Video, X, Calendar, User, BookOpen } from 'lucide-react';

const ZoomModal: React.FC<{ session: LiveSession; onClose: () => void }> = ({ session, onClose }) => {
  return (
    <div className="fixed inset-0 z-[200] bg-black/80 backdrop-blur-lg flex items-center justify-center p-6 animate-fadeIn">
      <div className="bg-[#0a1118] border border-white/10 rounded-[40px] w-full max-w-lg text-center p-12 relative shadow-2xl">
        <button onClick={onClose} className="absolute top-6 right-6 text-gray-500 hover:text-white transition-colors"><X size={24} /></button>
        <div className="w-20 h-20 bg-blue-500 rounded-3xl flex items-center justify-center mx-auto mb-6 border-4 border-blue-400 shadow-[0_0_20px_rgba(59,130,246,0.5)]">
          <Video size={40} className="text-white"/>
        </div>
        <h2 className="text-2xl font-black text-white mb-2">جاري التحضير للانضمام...</h2>
        <p className="text-gray-400 mb-8">سيتم فتح جلسة "{session.title}" في تطبيق Zoom.</p>
        
        <a 
          href={session.zoomLink}
          target="_blank"
          rel="noopener noreferrer"
          onClick={onClose}
          className="w-full block bg-blue-500 text-white px-10 py-5 rounded-2xl font-black text-sm uppercase tracking-widest hover:bg-blue-600 transition-all shadow-lg shadow-blue-500/20"
        >
          افتح Zoom Meetings
        </a>
        <p className="text-xs text-gray-600 mt-4 italic">إذا لم يبدأ التطبيق تلقائياً، تأكد من تثبيته على جهازك.</p>
      </div>
    </div>
  );
};


const LiveSessions: React.FC = () => {
  const [sessions, setSessions] = useState<LiveSession[]>([]);
  const [joiningSession, setJoiningSession] = useState<LiveSession | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchSessions = async () => {
      setIsLoading(true);
      const data = await dbService.getLiveSessions();
      setSessions(data);
      setIsLoading(false);
    };
    fetchSessions();
  }, []);

  const handleJoinClick = (session: LiveSession) => {
    if (session.status === 'live') {
      setJoiningSession(session);
    } else {
      alert('لم تبدأ هذه الجلسة بعد. سيتم إرسال إشعار لك عند بدئها.');
    }
  };

  return (
    <>
      {joiningSession && <ZoomModal session={joiningSession} onClose={() => setJoiningSession(null)} />}
      <div className="max-w-6xl mx-auto py-12 px-6 animate-fadeIn font-['Tajawal'] text-white">
        <div className="mb-16 text-center">
          <h2 className="text-5xl font-black mb-4 tracking-tighter italic uppercase">الجلسات <span className="text-blue-500 text-glow">المباشرة</span></h2>
          <p className="text-gray-500 text-xl max-w-3xl mx-auto leading-relaxed">
            انضم إلى فصولنا التفاعلية المباشرة مع نخبة من المعلمين عبر منصة Zoom المعتمدة.
          </p>
        </div>

        <div className="border-t border-white/5 pt-12">
          <h3 className="text-2xl font-black mb-8 border-r-4 border-blue-500 pr-4">الجلسات المتاحة</h3>
          
          {isLoading ? (
            <div className="py-20 text-center animate-pulse text-gray-500">جاري البحث عن البثوث النشطة...</div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                {sessions.map(session => (
                <div 
                    key={session.id} 
                    className="bg-[#0a1118] border border-white/5 p-8 rounded-[40px] group hover:border-blue-500/30 transition-all flex flex-col relative overflow-hidden"
                >
                    <div className="flex justify-between items-start mb-6 relative z-10">
                        <span className={`px-4 py-1.5 rounded-full text-[9px] font-black uppercase tracking-widest ${session.status === 'live' ? 'bg-red-500 text-white animate-pulse' : 'bg-white/10 text-gray-400'}`}>
                            {session.status === 'live' ? 'بث مباشر 🔴' : 'مجدولة 📅'}
                        </span>
                        <div className="w-10 h-10 rounded-xl bg-blue-500/10 border border-blue-500/20 text-blue-400 flex items-center justify-center shadow-inner">
                            <Video size={20}/>
                        </div>
                    </div>
                    <div className="flex-1 relative z-10">
                        <h4 className="text-xl font-bold text-white mb-2 group-hover:text-blue-400 transition-colors">{session.title}</h4>
                        <p className="text-xs text-gray-500 font-bold mb-6 flex items-center gap-2"><User size={14}/> {session.teacherName}</p>
                        
                        <div className="space-y-2 mb-6">
                            <div className="flex items-center gap-2 text-[10px] text-gray-500">
                                <BookOpen size={12}/>
                                <span className="font-black uppercase tracking-widest">{session.topic}</span>
                            </div>
                            <div className="flex items-center gap-2 text-[10px] text-gray-500">
                                <Calendar size={12}/>
                                <span className="font-black uppercase tracking-widest">{session.startTime}</span>
                            </div>
                        </div>
                    </div>
                    <button 
                        onClick={() => handleJoinClick(session)}
                        className={`w-full mt-4 py-4 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all ${session.status === 'live' ? 'bg-blue-500 text-white shadow-lg shadow-blue-500/20 hover:scale-105' : 'bg-white/5 text-gray-500 hover:bg-white/10'}`}
                    >
                        {session.status === 'live' ? 'الانضمام عبر Zoom' : 'تذكيري بالموعد'}
                    </button>
                    
                    {/* Decorative Blur */}
                    <div className="absolute -bottom-10 -left-10 w-32 h-32 bg-blue-500/5 rounded-full blur-[60px] pointer-events-none"></div>
                </div>
                ))}
            </div>
          )}

          {!isLoading && sessions.length === 0 && (
            <div className="py-20 text-center glass-panel rounded-[50px] border-dashed border-white/10 opacity-30">
                <Video size={48} className="mx-auto mb-4" />
                <p className="font-bold">لا يوجد بث مباشر في الوقت الحالي.</p>
            </div>
          )}
        </div>
      </div>
    </>
  );
};

export default LiveSessions;

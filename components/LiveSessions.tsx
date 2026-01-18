
import React, { useState, useEffect } from 'react';
import { LiveSession, User } from '../types';
import { dbService } from '../services/db';
import { Video, X, Calendar, User as UserIcon, BookOpen, RefreshCw, AlertCircle } from 'lucide-react';
import ZoomMeeting from './ZoomMeeting';

interface LiveSessionsProps {
  user: User;
}

const LiveSessions: React.FC<LiveSessionsProps> = ({ user }) => {
  const [sessions, setSessions] = useState<LiveSession[]>([]);
  const [activeZoomSession, setActiveZoomSession] = useState<LiveSession | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchSessions = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await dbService.getLiveSessions();
      // Ensure data is an array
      setSessions(Array.isArray(data) ? data : []);
    } catch (err: any) {
      console.error("Fetch Live Sessions Error:", err);
      setError("عذراً، فشل الاتصال بخادم الجلسات. يرجى التحقق من اتصال الإنترنت.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchSessions();
  }, []);

  const handleJoinClick = (session: LiveSession) => {
    if (session.status === 'live') {
      if (session.meetingId && session.passcode) {
        setActiveZoomSession(session);
      } else if (session.zoomLink) {
        window.open(session.zoomLink, '_blank');
      } else {
        alert('بيانات الرابط غير مكتملة لهذه الجلسة.');
      }
    } else {
      alert('لم تبدأ هذه الجلسة بعد. سيتم إرسال إشعار لك عند بدئها.');
    }
  };

  if (activeZoomSession) {
    return (
      <ZoomMeeting 
        meetingNumber={activeZoomSession.meetingId || ""} 
        passCode={activeZoomSession.passcode || ""} 
        userName={user.name} 
        userRole={user.role}
        onLeave={() => setActiveZoomSession(null)}
      />
    );
  }

  return (
    <div className="max-w-6xl mx-auto py-12 px-6 animate-fadeIn font-['Tajawal'] text-white">
      <div className="mb-16 text-center">
        <h2 className="text-5xl font-black mb-4 tracking-tighter italic uppercase">الجلسات <span className="text-blue-500 text-glow">المباشرة</span></h2>
        <p className="text-gray-500 text-xl max-w-3xl mx-auto leading-relaxed">
          انضم إلى فصولنا التفاعلية المباشرة المدمجة مع نخبة من المعلمين.
        </p>
      </div>

      <div className="border-t border-white/5 pt-12">
        <div className="flex justify-between items-center mb-8">
            <h3 className="text-2xl font-black border-r-4 border-blue-500 pr-4">الجلسات المتاحة</h3>
            <button 
                onClick={fetchSessions} 
                disabled={isLoading}
                className="flex items-center gap-2 text-xs font-bold text-gray-400 hover:text-white transition-colors bg-white/5 px-4 py-2 rounded-xl"
            >
                <RefreshCw size={14} className={isLoading ? 'animate-spin' : ''} />
                تحديث القائمة
            </button>
        </div>
        
        {isLoading ? (
          <div className="py-32 text-center animate-pulse">
             <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
             <p className="text-gray-500 font-bold uppercase tracking-widest text-xs">جاري البحث عن البثوث النشطة...</p>
          </div>
        ) : error ? (
            <div className="py-20 text-center glass-panel rounded-[40px] border-red-500/20 bg-red-500/5">
                <AlertCircle size={48} className="mx-auto mb-4 text-red-500" />
                <p className="text-lg font-bold text-red-400 mb-6">{error}</p>
                <button onClick={fetchSessions} className="bg-white text-black px-8 py-3 rounded-2xl font-black text-xs uppercase tracking-widest hover:scale-105 transition-all">إعادة المحاولة</button>
            </div>
        ) : sessions.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {sessions.map(session => (
              <div 
                  key={session.id || Math.random().toString()} 
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
                      <p className="text-xs text-gray-500 font-bold mb-6 flex items-center gap-2"><UserIcon size={14}/> {session.teacherName}</p>
                      
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
                      {session.status === 'live' ? 'الانضمام للبث المدمج' : 'تذكيري بالموعد'}
                  </button>
                  
                  <div className="absolute -bottom-10 -left-10 w-32 h-32 bg-blue-500/5 rounded-full blur-[60px] pointer-events-none"></div>
              </div>
              ))}
          </div>
        ) : (
          <div className="py-32 text-center glass-panel rounded-[50px] border-2 border-dashed border-white/10 opacity-40 animate-fadeIn">
              <div className="w-20 h-20 bg-white/5 rounded-full flex items-center justify-center mx-auto mb-6">
                <Video size={40} className="text-gray-500" />
              </div>
              <p className="font-black text-lg uppercase tracking-widest mb-2">لا توجد بثوث نشطة الآن</p>
              <p className="text-sm text-gray-600 max-w-xs mx-auto">سيتم عرض الحصص المباشرة المجدولة هنا بمجرد إضافتها من قبل الإدارة.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default LiveSessions;

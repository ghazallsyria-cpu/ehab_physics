
import React, { useState, useEffect, Suspense, lazy } from 'react';
import { LiveSession, User } from '../types';
import { dbService } from '../services/db';
import { Video, Calendar, User as UserIcon, BookOpen, RefreshCw, AlertCircle, PlayCircle } from 'lucide-react';

// Lazy load Zoom meeting to prevent main UI crash if SDK fails
const ZoomMeeting = lazy(() => import('./ZoomMeeting'));

interface LiveSessionsProps {
  user: User;
}

const LiveSessions: React.FC<LiveSessionsProps> = ({ user }) => {
  const [sessions, setSessions] = useState<LiveSession[]>([]);
  const [activeZoomSession, setActiveZoomSession] = useState<LiveSession | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setIsLoading(true);
    // Use Real-time Sync instead of one-time fetch
    const unsubscribe = dbService.subscribeToLiveSessions((updatedSessions) => {
        console.log("Live sessions synced:", updatedSessions);
        setSessions(updatedSessions);
        setIsLoading(false);
        setError(null);
    });

    // Cleanup on unmount
    return () => unsubscribe();
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
      alert('لم تبدأ هذه الجلسة بعد. سيتم تفعيل زر الانضمام عند بدء البث.');
    }
  };

  if (activeZoomSession) {
    return (
      <Suspense fallback={
        <div className="fixed inset-0 bg-black flex flex-col items-center justify-center text-white z-[500]">
           <RefreshCw className="animate-spin mb-4" size={40} />
           <p className="font-bold">جاري تحميل نظام الاجتماعات...</p>
        </div>
      }>
        <ZoomMeeting 
            meetingNumber={activeZoomSession.meetingId || ""} 
            passCode={activeZoomSession.passcode || ""} 
            userName={user.name} 
            userRole={user.role}
            onLeave={() => setActiveZoomSession(null)}
        />
      </Suspense>
    );
  }

  return (
    <div className="max-w-6xl mx-auto py-12 px-6 animate-fadeIn font-['Tajawal'] text-white">
      <div className="mb-16 text-center">
        <h2 className="text-5xl font-black mb-4 tracking-tighter italic uppercase">الجلسات <span className="text-blue-400 text-glow">المباشرة</span></h2>
        <p className="text-gray-500 text-xl max-w-3xl mx-auto leading-relaxed">
          انضم إلى فصولنا التفاعلية المباشرة المدمجة مع نخبة من المعلمين في الكويت.
        </p>
      </div>

      <div className="border-t border-white/5 pt-12">
        <div className="flex justify-between items-center mb-8">
            <h3 className="text-2xl font-black border-r-4 border-blue-400 pr-4">حصص اليوم</h3>
            <div className="flex items-center gap-2 text-[10px] font-black text-gray-500 uppercase tracking-widest bg-white/5 px-4 py-2 rounded-xl">
                <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
                مزامنة حية نشطة
            </div>
        </div>
        
        {isLoading ? (
          <div className="py-32 text-center">
             <RefreshCw className="w-12 h-12 text-blue-500 animate-spin mx-auto mb-4" />
             <p className="text-gray-500 font-bold uppercase tracking-widest text-xs">جاري البحث عن البثوث المجدولة...</p>
          </div>
        ) : error ? (
            <div className="py-20 text-center glass-panel rounded-[40px] border-red-500/20 bg-red-500/5">
                <AlertCircle size={48} className="mx-auto mb-4 text-red-500" />
                <p className="text-lg font-bold text-red-400">{error}</p>
            </div>
        ) : sessions.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {sessions.map(session => (
              <div 
                  key={session.id} 
                  className={`bg-[#0a1118]/80 border p-8 rounded-[40px] group transition-all flex flex-col relative overflow-hidden ${session.status === 'live' ? 'border-blue-500/40 shadow-[0_0_30px_rgba(59,130,246,0.1)]' : 'border-white/5 hover:border-white/10'}`}
              >
                  <div className="flex justify-between items-start mb-6">
                      <span className={`px-4 py-1.5 rounded-full text-[9px] font-black uppercase tracking-widest ${session.status === 'live' ? 'bg-red-500 text-white animate-pulse' : 'bg-white/10 text-gray-400'}`}>
                          {session.status === 'live' ? 'بث مباشر 🔴' : 'مجدولة 📅'}
                      </span>
                      <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${session.status === 'live' ? 'bg-blue-500 text-black' : 'bg-white/5 text-gray-500'}`}>
                          <Video size={20}/>
                      </div>
                  </div>
                  <div className="flex-1">
                      <h4 className="text-xl font-bold text-white mb-2 group-hover:text-blue-400 transition-colors">{session.title}</h4>
                      <p className="text-xs text-gray-500 font-bold mb-6 flex items-center gap-2"><UserIcon size={14}/> {session.teacherName}</p>
                      
                      <div className="space-y-2 mb-6">
                          <div className="flex items-center gap-2 text-[10px] text-gray-400">
                              <BookOpen size={12}/>
                              <span className="font-black uppercase tracking-widest">{session.topic}</span>
                          </div>
                          <div className="flex items-center gap-2 text-[10px] text-gray-400">
                              <Calendar size={12}/>
                              <span className="font-black uppercase tracking-widest">{session.startTime}</span>
                          </div>
                      </div>
                  </div>
                  <button 
                      onClick={() => handleJoinClick(session)}
                      className={`w-full mt-4 py-4 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all flex items-center justify-center gap-3 ${session.status === 'live' ? 'bg-blue-500 text-white shadow-lg hover:scale-105' : 'bg-white/5 text-gray-600 cursor-default'}`}
                  >
                      {session.status === 'live' ? <><PlayCircle size={16}/> دخول الحصة الآن</> : 'بانتظار بدء المعلم'}
                  </button>
                  
                  {session.status === 'live' && (
                    <div className="absolute -bottom-10 -left-10 w-32 h-32 bg-blue-500/10 rounded-full blur-[60px] pointer-events-none"></div>
                  )}
              </div>
              ))}
          </div>
        ) : (
          <div className="py-32 text-center glass-panel rounded-[50px] border-2 border-dashed border-white/10 opacity-60">
              <div className="w-20 h-20 bg-white/5 rounded-full flex items-center justify-center mx-auto mb-6">
                <Video size={40} className="text-gray-600" />
              </div>
              <p className="font-black text-lg uppercase tracking-widest mb-2">لا توجد حصص مباشرة حالياً</p>
              <p className="text-sm text-gray-600 max-w-xs mx-auto">عندما يقوم المعلم ببدء بث جديد، سيظهر لك هنا بشكل تلقائي دون الحاجة لتحديث الصفحة.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default LiveSessions;

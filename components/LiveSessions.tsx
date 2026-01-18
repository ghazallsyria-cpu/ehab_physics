import React, { useState } from 'react';
import { LiveSession } from '../types';
import { Video, X } from 'lucide-react';

const ZoomModal: React.FC<{ session: LiveSession; onClose: () => void }> = ({ session, onClose }) => {
  const zoomLink = `https://zoom.us/j/${session.id.replace(/\D/g, '')}5551234`; // Example link

  return (
    <div className="fixed inset-0 z-[200] bg-black/80 backdrop-blur-lg flex items-center justify-center p-6 animate-fadeIn">
      <div className="bg-white/5 border border-white/10 rounded-[40px] w-full max-w-lg text-center p-12 relative shadow-2xl">
        <button onClick={onClose} className="absolute top-6 right-6 text-gray-500 hover:text-white transition-colors"><X size={24} /></button>
        <div className="w-20 h-20 bg-blue-500 rounded-3xl flex items-center justify-center mx-auto mb-6 border-4 border-blue-400 shadow-[0_0_20px_rgba(59,130,246,0.5)]">
          <Video size={40} className="text-white"/>
        </div>
        <h2 className="text-2xl font-black text-white mb-2">جاري التحضير للانضمام...</h2>
        <p className="text-gray-400 mb-8">سيتم فتح جلسة "{session.title}" في تطبيق Zoom.</p>
        
        <a 
          href={zoomLink}
          target="_blank"
          rel="noopener noreferrer"
          onClick={onClose}
          className="w-full block bg-blue-500 text-white px-10 py-5 rounded-2xl font-black text-sm uppercase tracking-widest hover:bg-blue-600 transition-all shadow-lg shadow-blue-500/20"
        >
          افتح Zoom Meetings
        </a>
        <p className="text-xs text-gray-600 mt-4">إذا لم يبدأ التطبيق، تأكد من تثبيته على جهازك.</p>
      </div>
    </div>
  );
};


const LiveSessions: React.FC = () => {
  const [joiningSession, setJoiningSession] = useState<LiveSession | null>(null);

  const sessions: LiveSession[] = [
    { id: 'l1', title: 'الفيزياء النووية - الفصل الافتراضي', teacherName: 'أ. جاسم الكندري', startTime: 'الآن', status: 'live', topic: 'نشاط إشعاعي' },
    { id: 'l2', title: 'مراجعة الميكانيكا', teacherName: 'أ. ريم الشمري', startTime: 'غداً 17:00', status: 'upcoming', topic: 'الحركة' },
  ];

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
          <h2 className="text-5xl font-black mb-4 tracking-tighter">جلسات <span className="text-blue-500 text-glow">Zoom</span> المباشرة</h2>
          <p className="text-gray-500 text-xl max-w-3xl mx-auto leading-relaxed">
            انضم إلى فصولنا التفاعلية المباشرة مع نخبة من المعلمين عبر منصة Zoom العالمية.
          </p>
        </div>

        <div className="border-t border-white/5 pt-12">
          <h3 className="text-2xl font-black mb-8 border-r-4 border-[#00d2ff] pr-4">الجلسات المتاحة</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {sessions.map(session => (
              <div 
                  key={session.id} 
                  className="bg-[#0a1118] border border-white/5 p-8 rounded-[40px] group hover:border-blue-500/30 transition-all flex flex-col"
              >
                  <div className="flex justify-between items-start mb-6">
                      <span className={`px-4 py-1.5 rounded-full text-[9px] font-black uppercase tracking-widest ${session.status === 'live' ? 'bg-red-500 text-white animate-pulse' : 'bg-white/10 text-gray-400'}`}>
                          {session.status === 'live' ? 'بث مباشر 🔴' : 'مجدولة 📅'}
                      </span>
                      <div className="w-10 h-10 rounded-xl bg-blue-500/10 border border-blue-500/20 text-blue-400 flex items-center justify-center">
                        <Video size={20}/>
                      </div>
                  </div>
                  <div className="flex-1">
                    <h4 className="text-xl font-bold text-white mb-2 group-hover:text-blue-400 transition-colors">{session.title}</h4>
                    <p className="text-xs text-gray-500 font-bold mb-6">{session.teacherName}</p>
                  </div>
                  <button 
                    onClick={() => handleJoinClick(session)}
                    className="w-full mt-4 py-4 bg-white/5 rounded-2xl text-[10px] font-black uppercase hover:bg-blue-500 hover:text-white transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                      {session.status === 'live' ? 'الانضمام عبر Zoom' : 'إرسال تذكير'}
                  </button>
              </div>
              ))}
          </div>
        </div>
      </div>
    </>
  );
};

export default LiveSessions;
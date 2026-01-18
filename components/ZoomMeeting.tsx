
import React, { useState } from 'react';
import { UserRole } from '../types';
import { LogOut, Loader2, ExternalLink, ShieldCheck } from 'lucide-react';

interface ZoomMeetingProps {
  meetingNumber: string;
  passCode: string;
  userName: string;
  userRole: UserRole;
  directLink?: string;
  onLeave: () => void;
}

const ZoomMeeting: React.FC<ZoomMeetingProps> = ({ meetingNumber, passCode, userName, userRole, directLink, onLeave }) => {
  const [isLoading, setIsLoading] = useState(true);

  // بناء رابط الويب المباشر لزوم
  // هذا الرابط يتخطى طلب التحميل ويفتح البث في المتصفح مباشرة
  const encodedName = encodeURIComponent(userName);
  const zoomWebUrl = `https://zoom.us/wc/join/${meetingNumber}?pwd=${passCode}&un=${encodedName}`;

  return (
    <div className="fixed inset-0 z-[2000] bg-black flex flex-col font-['Tajawal'] animate-fadeIn">
      {/* شريط التحكم العلوي - يشبه مشغلات الفيديو الاحترافية */}
      <header className="bg-black/80 backdrop-blur-md border-b border-white/10 px-6 py-4 flex justify-between items-center z-50">
        <div className="flex items-center gap-4">
            <div className="w-10 h-10 bg-blue-500 rounded-xl flex items-center justify-center text-white shadow-[0_0_20px_rgba(59,130,246,0.3)]">
                <ShieldCheck size={20} />
            </div>
            <div className="text-right">
                <h3 className="text-white font-black text-sm uppercase tracking-tighter">بث الحصة المباشرة</h3>
                <p className="text-gray-500 text-[10px] font-bold uppercase tracking-widest">اتصال آمن • المركز السوري للعلوم</p>
            </div>
        </div>

        <div className="flex items-center gap-3">
            {directLink && (
                 <a 
                    href={directLink} 
                    target="_blank" 
                    rel="noreferrer"
                    className="hidden md:flex items-center gap-2 bg-white/5 border border-white/10 text-gray-400 px-5 py-2.5 rounded-xl text-[10px] font-black uppercase hover:bg-white hover:text-black transition-all"
                 >
                    <ExternalLink size={14} /> فتح في نافذة مستقلة
                 </a>
            )}
            <button 
                onClick={onLeave}
                className="bg-red-600 hover:bg-red-500 text-white px-8 py-2.5 rounded-xl flex items-center gap-3 transition-all shadow-xl font-black text-xs uppercase"
            >
                <LogOut size={16} /> إنهاء المشاهدة
            </button>
        </div>
      </header>

      {/* منطقة البث - Iframe */}
      <div className="flex-1 relative bg-[#010304]">
        {isLoading && (
            <div className="absolute inset-0 flex flex-col items-center justify-center text-white z-10 bg-[#010304]">
                <div className="relative w-24 h-24 mb-6">
                    <div className="absolute inset-0 border-4 border-blue-500/20 rounded-full"></div>
                    <div className="absolute inset-0 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
                    <Loader2 className="absolute inset-0 m-auto text-blue-500 animate-pulse" size={32} />
                </div>
                <p className="font-black text-xs uppercase tracking-[0.3em] text-blue-500 animate-pulse">جاري ربط إشارة البث...</p>
                <p className="text-gray-600 text-[10px] mt-4 font-bold">يرجى السماح بصلاحيات الصوت إذا طلب المتصفح ذلك</p>
            </div>
        )}

        <iframe
          src={zoomWebUrl}
          allow="microphone; camera; borderless; autoplay; encrypted-media; fullscreen; display-capture"
          className="w-full h-full border-none"
          onLoad={() => setIsLoading(false)}
          title="Zoom Live Stream"
        />
      </div>

      {/* شريط معلومات سفلي بسيط */}
      <footer className="bg-black py-2 px-6 border-t border-white/5 flex justify-center">
         <p className="text-[9px] font-bold text-gray-700 uppercase tracking-[0.5em]">SYRIAN SCIENCE CENTER • KUWAIT • VIRTUAL CLASSROOM</p>
      </footer>
    </div>
  );
};

export default ZoomMeeting;


import React, { useEffect, useState } from 'react';
import { ZoomMtg } from "@zoomus/websdk";
import { UserRole } from '../types';
import { ExternalLink, ShieldAlert, Loader2 } from 'lucide-react';

interface ZoomMeetingProps {
  meetingNumber: string;
  passCode: string;
  userName: string;
  userRole: UserRole;
  directLink?: string;
  onLeave: () => void;
}

const ZoomMeeting: React.FC<ZoomMeetingProps> = ({ meetingNumber, passCode, userName, userRole, directLink, onLeave }) => {
  const [status, setStatus] = useState<'loading' | 'joining' | 'failed'>('loading');
  const [errorMessage, setErrorMessage] = useState('');

  useEffect(() => {
    // Zoom SDK Setup
    try {
        // Hide standard root to prevent layout shifts
        const root = document.getElementById('zmmtg-root');
        if (root) root.style.display = 'none';

        ZoomMtg.setZoomJSLib("https://source.zoom.us/2.11.0/lib", "/av");
        ZoomMtg.preLoadWasm();
        ZoomMtg.prepareJssdk();

        const role = (userRole === 'admin' || userRole === 'teacher') ? 1 : 0;
        
        // Placeholder signature for demo - in production this must come from a backend
        const signature = ""; 
        const sdkKey = "YOUR_ZOOM_SDK_KEY"; 

        const initAndJoin = () => {
            setStatus('joining');
            ZoomMtg.init({
                leaveUrl: window.location.origin,
                success: () => {
                    if (root) root.style.display = 'block';
                    ZoomMtg.join({
                        signature: signature,
                        sdkKey: sdkKey,
                        meetingNumber: meetingNumber,
                        passWord: passCode,
                        userName: userName,
                        userEmail: "",
                        tk: "",
                        zak: "",
                        success: () => {
                            setStatus('joining');
                        },
                        error: (err: any) => {
                            console.error("Zoom Join Error:", err);
                            setStatus('failed');
                            setErrorMessage("فشل الانضمام المدمج. يرجى استخدام الرابط المباشر.");
                        }
                    });
                },
                error: (err: any) => {
                    console.error("Zoom Init Error:", err);
                    setStatus('failed');
                    setErrorMessage("نظام Zoom المدمج غير مدعوم في هذا المتصفح حالياً.");
                }
            });
        };

        // Delay start slightly to ensure DOM is ready
        const timer = setTimeout(initAndJoin, 1000);
        return () => clearTimeout(timer);

    } catch (e) {
        setStatus('failed');
    }

    return () => {
      const root = document.getElementById('zmmtg-root');
      if (root) {
          root.style.display = 'none';
          root.innerHTML = '';
      }
    };
  }, [meetingNumber, passCode, userName, userRole]);

  const handleOpenDirectly = () => {
      const url = directLink || `https://zoom.us/j/${meetingNumber}`;
      window.open(url, '_blank');
      onLeave();
  };

  return (
    <div className="fixed inset-0 z-[500] bg-[#010304] flex flex-col items-center justify-center font-['Tajawal'] p-6">
        <div className="max-w-md w-full text-center space-y-8 animate-fadeIn">
            {status === 'loading' || status === 'joining' ? (
                <>
                    <div className="relative w-24 h-24 mx-auto">
                        <div className="absolute inset-0 border-4 border-blue-500/20 rounded-full"></div>
                        <div className="absolute inset-0 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
                        <div className="absolute inset-0 flex items-center justify-center text-3xl">🎥</div>
                    </div>
                    <div className="space-y-2">
                        <h3 className="text-white font-black text-2xl tracking-tighter uppercase italic">جاري تهيئة <span className="text-blue-500">البث</span></h3>
                        <p className="text-gray-500 text-sm font-bold">يرجى الانتظار، جاري الربط بنظام Zoom المدمج...</p>
                    </div>
                </>
            ) : (
                <div className="glass-panel p-10 rounded-[40px] border-red-500/20 bg-red-500/5 animate-shake">
                    <ShieldAlert size={64} className="text-red-500 mx-auto mb-6" />
                    <h3 className="text-xl font-black text-white mb-2">تنبيه النظام</h3>
                    <p className="text-gray-400 text-sm mb-8 leading-relaxed">{errorMessage}</p>
                    <div className="flex flex-col gap-3">
                        <button 
                            onClick={handleOpenDirectly}
                            className="w-full bg-blue-500 text-white py-4 rounded-2xl font-black text-xs uppercase tracking-widest flex items-center justify-center gap-3 shadow-lg hover:scale-105 transition-all"
                        >
                            <ExternalLink size={16} /> فتح في تطبيق Zoom الخارجي
                        </button>
                        <button 
                            onClick={onLeave}
                            className="w-full py-4 text-gray-500 font-bold text-xs uppercase tracking-widest hover:text-white"
                        >
                            إغلاق والعودة للمنصة
                        </button>
                    </div>
                </div>
            )}
            
            {(status === 'loading' || status === 'joining') && (
                <div className="pt-10 border-t border-white/5">
                    <p className="text-[10px] text-gray-600 font-black uppercase tracking-widest mb-4">هل تواجه مشكلة في التحميل؟</p>
                    <button 
                        onClick={handleOpenDirectly}
                        className="text-blue-400 font-bold text-xs hover:underline flex items-center gap-2 mx-auto"
                    >
                        إلغاء واستخدام الرابط المباشر <ExternalLink size={12}/>
                    </button>
                </div>
            )}
        </div>
    </div>
  );
};

export default ZoomMeeting;

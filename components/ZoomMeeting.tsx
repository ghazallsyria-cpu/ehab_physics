
import React, { useEffect, useState } from 'react';
import { ZoomMtg } from "@zoomus/websdk";
import { UserRole } from '../types';

interface ZoomMeetingProps {
  meetingNumber: string;
  passCode: string;
  userName: string;
  userRole: UserRole;
  onLeave: () => void;
}

const ZoomMeeting: React.FC<ZoomMeetingProps> = ({ meetingNumber, passCode, userName, userRole, onLeave }) => {
  const [isInitializing, setIsInitializing] = useState(true);

  useEffect(() => {
    // Zoom setup
    ZoomMtg.setZoomJSLib("https://source.zoom.us/2.11.0/lib", "/av");
    ZoomMtg.preLoadWasm();
    ZoomMtg.prepareJssdk();

    // Role: 1 for Host (Admin/Teacher), 0 for Attendee (Student)
    const role = (userRole === 'admin' || userRole === 'teacher') ? 1 : 0;
    
    // NOTE: In production, these should be handled securely
    const sdkKey = "YOUR_ZOOM_SDK_KEY"; 
    
    // This is a placeholder logic for signature. 
    // In a real app, call your backend: const signature = await fetchSignature(meetingNumber, role);
    const signature = ""; 

    const startMeeting = () => {
      const root = document.getElementById('zmmtg-root');
      if (root) root.style.display = 'block';
      
      ZoomMtg.init({
        leaveUrl: window.location.origin,
        success: () => {
          ZoomMtg.join({
            signature: signature,
            sdkKey: sdkKey,
            meetingNumber: meetingNumber,
            passWord: passCode,
            userName: userName,
            userEmail: "", 
            tk: "", 
            zak: "", 
            success: (res: any) => {
              console.log("Zoom session started");
              setIsInitializing(false);
            },
            error: (err: any) => {
              console.error("Zoom Join Error:", err);
              alert("فشل الانضمام: تأكد من صحة معرف الاجتماع");
              onLeave();
            }
          });
        },
        error: (err: any) => {
          console.error("Zoom Init Error:", err);
        }
      });
    };

    startMeeting();

    return () => {
      const root = document.getElementById('zmmtg-root');
      if (root) {
          root.style.display = 'none';
          // Force cleanup of Zoom internal DOM
          root.innerHTML = '';
      }
    };
  }, [meetingNumber, passCode, userName, userRole]);

  return (
    <div className="fixed inset-0 z-[300] bg-black flex flex-col items-center justify-center font-['Tajawal']">
        {isInitializing && (
            <div className="text-center animate-fadeIn space-y-6">
                <div className="relative w-24 h-24 mx-auto">
                    <div className="absolute inset-0 border-4 border-blue-500/20 rounded-full"></div>
                    <div className="absolute inset-0 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
                    <div className="absolute inset-0 flex items-center justify-center text-2xl">🎥</div>
                </div>
                <div>
                    <p className="text-white font-black text-lg">جاري تأمين الاتصال بـ <span className="text-blue-400">Zoom</span></p>
                    <p className="text-gray-500 text-xs mt-2 uppercase tracking-widest">
                        {userRole === 'teacher' ? 'دخول بصفة: مضيف (Host)' : 'دخول بصفة: طالب (Attendee)'}
                    </p>
                </div>
            </div>
        )}
        <button 
            onClick={onLeave}
            className="absolute top-10 left-10 z-[301] bg-white/10 hover:bg-red-500 text-white px-6 py-3 rounded-2xl font-black text-[10px] uppercase tracking-widest backdrop-blur-md border border-white/10 transition-all shadow-2xl"
        >
            مغادرة الجلسة ✕
        </button>
    </div>
  );
};

export default ZoomMeeting;

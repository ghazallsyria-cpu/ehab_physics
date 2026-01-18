
import React, { useEffect } from 'react';
import { ZoomMtg } from "@zoomus/websdk";

interface ZoomMeetingProps {
  meetingNumber: string;
  passCode: string;
  userName: string;
  onLeave: () => void;
}

const ZoomMeeting: React.FC<ZoomMeetingProps> = ({ meetingNumber, passCode, userName, onLeave }) => {
  
  useEffect(() => {
    // Zoom setup
    ZoomMtg.setZoomJSLib("https://source.zoom.us/2.11.0/lib", "/av");
    ZoomMtg.preLoadWasm();
    ZoomMtg.prepareJssdk();

    const role = 0; // 0 for attendee, 1 for host
    const sdkKey = "YOUR_ZOOM_SDK_KEY"; // In real app, get from backend
    const sdkSecret = "YOUR_ZOOM_SDK_SECRET"; // In real app, signature is generated on server

    // NOTE: In production, the signature MUST be generated on the server.
    // This is a simplified frontend-only placeholder for logic demo.
    const signature = ""; // Mock signature

    const showMeeting = () => {
      const root = document.getElementById('zmmtg-root');
      if (root) root.style.display = 'block';
      
      ZoomMtg.init({
        leaveUrl: window.location.href,
        success: (success: any) => {
          ZoomMtg.join({
            signature: signature,
            meetingNumber: meetingNumber,
            userName: userName,
            sdkKey: sdkKey,
            passWord: passCode,
            success: (res: any) => {
              console.log("Joined successfully", res);
            },
            error: (err: any) => {
              console.error("Join Error:", err);
            }
          });
        },
        error: (err: any) => {
          console.error("Init Error:", err);
        }
      });
    };

    showMeeting();

    return () => {
      const root = document.getElementById('zmmtg-root');
      if (root) root.style.display = 'none';
    };
  }, [meetingNumber, passCode, userName]);

  return (
    <div className="fixed inset-0 z-[300] bg-black flex flex-col items-center justify-center font-['Tajawal']">
        <div className="text-center animate-pulse space-y-4">
            <div className="w-16 h-16 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto"></div>
            <p className="text-blue-400 font-black uppercase tracking-widest text-xs">جاري تهيئة منصة Zoom...</p>
        </div>
        <button 
            onClick={onLeave}
            className="absolute top-10 left-10 z-[301] bg-red-500 text-white px-8 py-3 rounded-full font-black text-xs uppercase shadow-2xl hover:bg-red-600 transition-all"
        >
            مغادرة البث
        </button>
    </div>
  );
};

export default ZoomMeeting;

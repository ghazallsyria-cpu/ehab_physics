
import React, { useEffect, useState, useCallback, useRef } from 'react';
import { UserRole } from '../types';
import { ShieldAlert, RefreshCw, LogOut, Loader2, Video, ExternalLink } from 'lucide-react';

interface ZoomMeetingProps {
  meetingNumber: string;
  passCode: string;
  userName: string;
  userRole: UserRole;
  directLink?: string;
  onLeave: () => void;
}

const ZoomMeeting: React.FC<ZoomMeetingProps> = ({ meetingNumber, passCode, userName, userRole, directLink, onLeave }) => {
  const [loadingStatus, setLoadingStatus] = useState<string>('جاري تحضير غرفة البث...');
  const [status, setStatus] = useState<'loading' | 'ready' | 'failed'>('loading');
  const [error, setError] = useState('');
  const [retryCount, setRetryCount] = useState(0);
  const zoomStartedRef = useRef(false);

  const loadScript = (src: string): Promise<void> => {
    return new Promise((resolve, reject) => {
      const existing = document.querySelector(`script[src="${src}"]`);
      if (existing) {
        resolve();
        return;
      }
      const script = document.createElement('script');
      script.src = src;
      script.async = false;
      script.onload = () => resolve();
      script.onerror = () => reject(new Error(`Failed: ${src}`));
      document.body.appendChild(script);
    });
  };

  const startZoom = useCallback(async () => {
    if (zoomStartedRef.current) return;
    zoomStartedRef.current = true;

    try {
      setLoadingStatus('جاري تحميل المكتبات الأساسية...');
      
      // Load dependencies in strict sequence
      await loadScript("https://source.zoom.us/2.11.0/lib/vendor/react.min.js");
      await loadScript("https://source.zoom.us/2.11.0/lib/vendor/react-dom.min.js");
      await loadScript("https://source.zoom.us/2.11.0/lib/vendor/redux.min.js");
      await loadScript("https://source.zoom.us/2.11.0/lib/vendor/redux-thunk.min.js");
      await loadScript("https://source.zoom.us/2.11.0/lib/vendor/lodash.min.js");
      await loadScript("https://source.zoom.us/zoom-meeting-2.11.0.min.js");

      const ZoomMtg = (window as any).ZoomMtg;
      if (!ZoomMtg) throw new Error("Zoom library not found");

      setLoadingStatus('جاري تهيئة الاتصال المشفر...');
      
      ZoomMtg.setZoomJSLib("https://source.zoom.us/2.11.0/lib", "/av");
      ZoomMtg.preLoadWasm();
      ZoomMtg.prepareJssdk();

      // Show the dedicated container
      const zoomRoot = document.getElementById('zmmtg-root');
      if (zoomRoot) zoomRoot.style.display = 'block';

      // Demo SDK Key - In production, use your actual key
      const sdkKey = "pWJ9N27rX3n7R6uN7E9R"; 

      ZoomMtg.init({
        leaveUrl: window.location.origin,
        isSupportAV: true,
        success: () => {
          setLoadingStatus('جاري الدخول للحصة...');
          ZoomMtg.join({
            signature: "", // Will use default if empty for demo or handled by SDK
            meetingNumber: meetingNumber,
            userName: userName,
            sdkKey: sdkKey,
            userEmail: "",
            passWord: passCode,
            success: () => {
              setStatus('ready');
            },
            error: (err: any) => {
              console.error("Join Error", err);
              setStatus('failed');
              setError('تعذر الانضمام للحصة. تأكد من أن المعلم قد بدأ البث.');
            }
          });
        },
        error: (err: any) => {
          console.error("Init Error", err);
          setStatus('failed');
          setError('حدث خطأ في واجهة البث المدمجة.');
        }
      });

    } catch (e: any) {
      console.error("SDK Crash", e);
      setStatus('failed');
      setError('فشل تحميل محرك الفيديو. قد يكون متصفحك يحجب السكربتات الخارجية.');
    }
  }, [meetingNumber, passCode, userName, userRole]);

  useEffect(() => {
    startZoom();
    return () => {
      const zoomRoot = document.getElementById('zmmtg-root');
      if (zoomRoot) {
        zoomRoot.style.display = 'none';
        zoomRoot.innerHTML = '';
      }
      zoomStartedRef.current = false;
    };
  }, [startZoom]);

  if (status === 'failed') {
    return (
      <div className="fixed inset-0 z-[2000] bg-[#010304] flex flex-col items-center justify-center p-8 font-['Tajawal'] text-white">
        <div className="glass-panel p-10 md:p-14 rounded-[50px] border-red-500/20 bg-red-500/5 text-center max-w-lg w-full">
           <div className="w-20 h-20 bg-red-500/10 rounded-3xl flex items-center justify-center mx-auto mb-8">
              <ShieldAlert size={48} className="text-red-500" />
           </div>
           <h3 className="text-2xl font-black mb-4 uppercase">فشل الانضمام المدمج</h3>
           <p className="text-gray-400 text-sm mb-10 leading-relaxed italic">"{error}"</p>
           
           <div className="space-y-4">
              {directLink && (
                  <a 
                    href={directLink} 
                    target="_blank" 
                    rel="noreferrer"
                    className="w-full bg-blue-500 text-white py-5 rounded-[25px] font-black text-xs uppercase tracking-widest hover:scale-105 transition-all shadow-xl flex items-center justify-center gap-3"
                  >
                    <ExternalLink size={18} /> فتح عبر تطبيق Zoom (خيار مضمون)
                  </a>
              )}
              <button 
                onClick={() => window.location.reload()}
                className="w-full bg-white/5 border border-white/10 text-white py-4 rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-white/10"
              >
                <RefreshCw size={14} className="inline ml-2" /> إعادة محاولة التحميل
              </button>
              <button 
                onClick={onLeave}
                className="w-full py-4 text-gray-500 font-bold text-xs uppercase hover:text-white"
              >
                العودة للمنصة
              </button>
           </div>
        </div>
      </div>
    );
  }

  if (status === 'loading') {
      return (
        <div className="fixed inset-0 z-[2000] bg-[#010304] flex flex-col items-center justify-center font-['Tajawal'] text-white">
            <div className="relative w-40 h-40 mb-12">
                <div className="absolute inset-0 border-4 border-blue-500/10 rounded-full"></div>
                <div className="absolute inset-0 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
                <div className="absolute inset-0 flex items-center justify-center text-5xl">📡</div>
            </div>
            <div className="text-center">
                <h3 className="text-3xl font-black mb-4 tracking-tighter">جاري الربط مع <span className="text-blue-500">القمر الصناعي</span></h3>
                <div className="flex items-center justify-center gap-3 text-gray-500">
                    <Loader2 size={16} className="animate-spin" />
                    <p className="font-bold text-xs uppercase tracking-widest">{loadingStatus}</p>
                </div>
            </div>
        </div>
      );
  }

  return (
    <div className="fixed top-6 left-6 z-[3000]">
        <button 
            onClick={onLeave}
            className="bg-red-600 text-white px-8 py-4 rounded-2xl hover:bg-red-500 transition-all flex items-center gap-3 shadow-2xl font-black text-xs uppercase tracking-widest"
        >
            <LogOut size={18} /> إنهاء المشاهدة
        </button>
    </div>
  );
};

export default ZoomMeeting;


import React, { useEffect, useState, useCallback } from 'react';
import { UserRole } from '../types';
import { ShieldAlert, RefreshCw, LogOut, Loader2, Globe } from 'lucide-react';

interface ZoomMeetingProps {
  meetingNumber: string;
  passCode: string;
  userName: string;
  userRole: UserRole;
  directLink?: string;
  onLeave: () => void;
}

const ZOOM_SCRIPTS = [
  "https://source.zoom.us/2.11.0/lib/vendor/lodash.min.js",
  "https://source.zoom.us/2.11.0/lib/vendor/redux.min.js",
  "https://source.zoom.us/2.11.0/lib/vendor/redux-thunk.min.js",
  "https://source.zoom.us/zoom-meeting-2.11.0.min.js"
];

const ZoomMeeting: React.FC<ZoomMeetingProps> = ({ meetingNumber, passCode, userName, userRole, onLeave }) => {
  const [loadingStatus, setLoadingStatus] = useState<string>('جاري فحص اتصال النظام...');
  const [status, setStatus] = useState<'loading' | 'ready' | 'failed'>('loading');
  const [error, setError] = useState('');

  // دالة لتحميل السكربتات برمجياً لضمان الترتيب
  const loadScript = (src: string): Promise<void> => {
    return new Promise((resolve, reject) => {
      if (document.querySelector(`script[src="${src}"]`)) {
        resolve();
        return;
      }
      const script = document.createElement('script');
      script.src = src;
      script.async = false; // مهم جداً لضمان الترتيب
      script.onload = () => resolve();
      script.onerror = () => reject(new Error(`Failed to load ${src}`));
      document.body.appendChild(script);
    });
  };

  const initializeZoom = useCallback(async () => {
    try {
      setLoadingStatus('جاري جلب بروتوكولات البث...');
      
      // تحميل كافة التبعيات بالتوالي
      for (const src of ZOOM_SCRIPTS) {
        await loadScript(src);
      }

      const ZoomMtg = (window as any).ZoomMtg;
      if (!ZoomMtg) throw new Error("Zoom SDK not found after loading scripts");

      setLoadingStatus('جاري تهيئة بيئة الفيديو...');
      
      ZoomMtg.setZoomJSLib("https://source.zoom.us/2.11.0/lib", "/av");
      ZoomMtg.preLoadWasm();
      ZoomMtg.prepareJssdk();

      const zoomRoot = document.getElementById('zmmtg-root');
      if (zoomRoot) zoomRoot.style.display = 'block';

      // مفتاح افتراضي - يجب استبداله بمفتاحك الحقيقي في الإنتاج
      const sdkKey = "pWJ9N27rX3n7R6uN7E9R"; 
      const signature = ""; // التوقيع يفضل توليده من السيرفر

      ZoomMtg.init({
        leaveUrl: window.location.origin,
        patchJsMedia: true,
        success: () => {
          setLoadingStatus('جاري الانضمام للحصة الآن...');
          ZoomMtg.join({
            signature: signature,
            meetingNumber: meetingNumber,
            userName: userName,
            sdkKey: sdkKey,
            userEmail: "",
            passWord: passCode,
            success: () => {
              setStatus('ready');
            },
            error: (err: any) => {
              console.error("Zoom Join Error:", err);
              setStatus('failed');
              setError('فشل الدخول لغرفة البث. تأكد من أن الحصة بدأت فعلاً.');
            }
          });
        },
        error: (err: any) => {
          console.error("Zoom Init Error:", err);
          setStatus('failed');
          setError('حدث خطأ في واجهة النظام. يرجى إعادة المحاولة.');
        }
      });
    } catch (e: any) {
      console.error("Boot Error:", e);
      setStatus('failed');
      setError('تعذر الوصول إلى خوادم البث المباشر. يرجى التحقق من اتصال الإنترنت.');
    }
  }, [meetingNumber, passCode, userName, userRole]);

  useEffect(() => {
    initializeZoom();
    
    return () => {
      const zoomRoot = document.getElementById('zmmtg-root');
      if (zoomRoot) {
        zoomRoot.style.display = 'none';
        zoomRoot.innerHTML = '';
      }
    };
  }, [initializeZoom]);

  if (status === 'failed') {
    return (
      <div className="fixed inset-0 z-[2000] bg-[#010304] flex flex-col items-center justify-center p-8 font-['Tajawal']">
        <div className="glass-panel p-12 rounded-[50px] border-red-500/20 bg-red-500/5 text-center max-w-md w-full animate-fadeIn">
           <div className="w-20 h-20 bg-red-500/10 rounded-3xl flex items-center justify-center mx-auto mb-8 shadow-2xl">
              <ShieldAlert size={48} className="text-red-500" />
           </div>
           <h3 className="text-2xl font-black text-white mb-4 italic uppercase">تنبيه النظام</h3>
           <p className="text-gray-400 text-sm mb-10 leading-relaxed font-bold italic">"{error}"</p>
           <div className="space-y-4">
              <button 
                onClick={() => window.location.reload()}
                className="w-full bg-blue-500 text-white py-5 rounded-[25px] font-black text-xs uppercase tracking-widest hover:scale-105 transition-all shadow-[0_10px_30px_rgba(59,130,246,0.3)] flex items-center justify-center gap-3"
              >
                <RefreshCw size={16} /> تحديث الصفحة والاتصال
              </button>
              <button 
                onClick={onLeave}
                className="w-full py-4 text-gray-500 font-bold text-xs uppercase tracking-widest hover:text-white"
              >
                إلغاء والعودة للمنصة
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
                <div className="absolute inset-4 border-2 border-white/5 rounded-full border-dashed animate-spin-slow"></div>
                <div className="absolute inset-0 flex items-center justify-center text-5xl">📡</div>
            </div>
            <div className="text-center space-y-4">
                <h3 className="text-3xl font-black tracking-tighter italic uppercase">جاري مزامنة <span className="text-blue-500">البث المباشر</span></h3>
                <div className="flex items-center justify-center gap-3 text-gray-500">
                    <Loader2 size={14} className="animate-spin" />
                    <p className="font-bold text-xs uppercase tracking-[0.2em]">{loadingStatus}</p>
                </div>
            </div>
            
            <div className="mt-20 flex items-center gap-4 text-[10px] font-black text-gray-600 uppercase tracking-widest border border-white/5 px-6 py-2 rounded-full">
               <Globe size={12} /> SSC KUWAIT SECURE CONNECTION
            </div>
        </div>
      );
  }

  return (
    <div className="fixed top-6 left-6 z-[3000] pointer-events-none">
        <button 
            onClick={onLeave}
            className="pointer-events-auto bg-red-600/90 backdrop-blur-xl border border-red-500/40 text-white px-8 py-4 rounded-2xl hover:bg-red-500 transition-all flex items-center gap-4 shadow-2xl animate-fadeIn group"
            title="مغادرة الحصة والعودة للمنصة"
        >
            <LogOut size={20} className="group-hover:-translate-x-1 transition-transform" />
            <span className="font-black text-xs uppercase tracking-widest">إنهاء المشاهدة</span>
        </button>
    </div>
  );
};

export default ZoomMeeting;


import React, { useState, useEffect, useRef } from 'react';
import { LoggingSettings, NotificationSettings, AppBranding, MaintenanceSettings } from '../types';
import { dbService } from '../services/db';
import { 
    Database, Save, AlertCircle, RefreshCw, Bell, MessageSquare, 
    ShieldCheck, Zap, Image as ImageIcon, Upload, Hammer, 
    Clock, Power, PowerOff, Layout, Calendar
} from 'lucide-react';

const AdminSettings: React.FC = () => {
  const [settings, setSettings] = useState<LoggingSettings | null>(null);
  const [notificationSettings, setNotificationSettings] = useState<NotificationSettings | null>(null);
  const [branding, setBranding] = useState<AppBranding | null>(null);
  const [maintenance, setMaintenance] = useState<MaintenanceSettings | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [message, setMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(null);
  
  const logoInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    setIsLoading(true);
    const [loggingData, notificationData, brandingData, maintenanceData] = await Promise.all([
        dbService.getLoggingSettings(),
        dbService.getNotificationSettings(),
        dbService.getAppBranding(),
        dbService.getMaintenanceSettings()
    ]);
    setSettings(loggingData);
    setNotificationSettings(notificationData);
    setBranding(brandingData);
    setMaintenance(maintenanceData);
    setIsLoading(false);
  };

  const handleToggle = (key: keyof LoggingSettings) => {
    if (settings) {
      setSettings(prev => ({ ...prev!, [key]: !prev![key] }));
    }
  };
  
  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !branding) return;
    
    setIsUploading(true);
    try {
        const asset = await dbService.uploadAsset(file);
        setBranding({ ...branding, logoUrl: asset.url });
        setMessage({ text: 'تم رفع الشعار بنجاح. اضغط "حفظ" للاعتماد.', type: 'success' });
    } catch (error) {
        setMessage({ text: 'فشل رفع الشعار.', type: 'error' });
    } finally {
        setIsUploading(false);
    }
  };

  const handleSave = async () => {
    if (!settings || !notificationSettings || !branding || !maintenance) return;
    setIsSaving(true);
    setMessage(null);
    try {
      await Promise.all([
          dbService.saveLoggingSettings(settings),
          dbService.saveNotificationSettings(notificationSettings),
          dbService.saveAppBranding(branding),
          dbService.saveMaintenanceSettings(maintenance)
      ]);
      setMessage({ text: 'تم حفظ كافة التغييرات وإعدادات الصيانة بنجاح! ✅', type: 'success' });
      window.dispatchEvent(new CustomEvent('branding-updated', { detail: branding }));
    } catch (e) {
      setMessage({ text: 'فشل حفظ الإعدادات.', type: 'error' });
    }
    setIsSaving(false);
    setTimeout(() => setMessage(null), 3000);
  };
  
  const settingOptions: { key: keyof LoggingSettings; title: string; description: string }[] = [
    { key: 'logStudentProgress', title: 'تسجيل تقدم الطلاب', description: 'حفظ سجلات إكمال الدروس والأنشطة الأخرى.' },
    { key: 'saveAllQuizAttempts', title: 'حفظ جميع محاولات الاختبار', description: 'حفظ كل محاولة يقوم بها الطالب.' },
    { key: 'archiveTeacherMessages', title: 'أرشفة رسائل المعلمين', description: 'حفظ سجلات التواصل لأغراض الإشراف.' },
  ];

  if (isLoading) return <div className="py-40 text-center animate-pulse"><RefreshCw className="animate-spin mx-auto text-amber-500 mb-4" /> <p className="text-gray-500 uppercase font-black text-xs">جاري سحب الإعدادات المركزية...</p></div>;

  return (
    <div className="max-w-4xl mx-auto py-12 px-6 animate-fadeIn font-['Tajawal'] text-white text-right pb-32" dir="rtl">
      <header className="mb-12 border-r-4 border-[#fbbf24] pr-8 flex justify-between items-center">
        <div>
            <h2 className="text-5xl font-black mb-4 tracking-tighter italic">إعدادات <span className="text-[#fbbf24]">المنظومة</span></h2>
            <p className="text-gray-500 text-xl font-medium">التحكم في خصوصية البيانات، الهوية، ووضع الصيانة.</p>
        </div>
        <button
          onClick={handleSave}
          disabled={isSaving}
          className="bg-[#fbbf24] text-black px-12 py-5 rounded-[30px] font-black text-sm uppercase tracking-widest shadow-2xl hover:scale-105 active:scale-95 transition-all flex items-center gap-3 disabled:opacity-50"
        >
          {isSaving ? <RefreshCw className="animate-spin" /> : <Save />} حفظ الكل
        </button>
      </header>

      {message && (
          <div className={`mb-10 p-6 rounded-[35px] text-sm font-bold flex items-center gap-4 border animate-slideUp ${message.type === 'success' ? 'bg-green-500/10 text-green-400 border-green-500/20' : 'bg-red-500/10 text-red-400 border-red-500/20'}`}>
              <ShieldCheck size={24} /> {message.text}
          </div>
      )}

      <div className="space-y-12">
        {/* وضع الصيانة والتطوير - القسم الجديد */}
        <div className="glass-panel p-10 md:p-12 rounded-[60px] border-red-500/20 bg-gradient-to-br from-red-500/5 to-transparent relative overflow-hidden shadow-2xl">
            <div className="absolute top-0 left-0 p-8 opacity-5 text-9xl pointer-events-none -rotate-12"><Hammer size={120} /></div>
            
            <div className="flex flex-col md:flex-row items-center justify-between border-b border-white/5 pb-10 mb-10 gap-6">
                <div className="flex items-center gap-6">
                    <div className={`w-16 h-16 rounded-3xl flex items-center justify-center transition-all ${maintenance?.isMaintenanceActive ? 'bg-red-500 text-white shadow-[0_0_30px_rgba(239,68,68,0.4)]' : 'bg-white/5 text-gray-500 border border-white/10'}`}>
                        {maintenance?.isMaintenanceActive ? <Power size={32} /> : <PowerOff size={32} />}
                    </div>
                    <div>
                        <h3 className="text-3xl font-black text-white italic">وضع الصيانة الذكي</h3>
                        <p className="text-gray-500 text-sm mt-1 font-medium">قفل المنصة عن الطلاب فوراً وعرض شاشة العداد الزمني.</p>
                    </div>
                </div>
                <button 
                    onClick={() => maintenance && setMaintenance({...maintenance, isMaintenanceActive: !maintenance.isMaintenanceActive})}
                    className={`px-10 py-4 rounded-2xl text-[10px] font-black uppercase tracking-[0.2em] transition-all flex items-center gap-3 ${maintenance?.isMaintenanceActive ? 'bg-red-500 text-white hover:bg-red-600' : 'bg-white/5 border border-white/10 text-gray-400 hover:text-white'}`}
                >
                    {maintenance?.isMaintenanceActive ? 'إيقاف وضع الصيانة' : 'تفعيل وضع الصيانة'}
                </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                <div className="space-y-4">
                    <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest mr-4 flex items-center gap-2">
                        <Calendar size={14} className="text-red-400"/> موعد الافتتاح المتوقع (العداد)
                    </label>
                    <div className="relative">
                        <Clock className="absolute top-1/2 right-6 -translate-y-1/2 text-gray-500" size={20}/>
                        <input 
                            type="datetime-local" 
                            value={maintenance?.expectedReturnTime ? new Date(maintenance.expectedReturnTime).toISOString().slice(0, 16) : ''}
                            onChange={e => maintenance && setMaintenance({...maintenance, expectedReturnTime: new Date(e.target.value).toISOString()})}
                            className="w-full bg-black/60 border-2 border-white/5 rounded-3xl px-16 py-5 text-white outline-none focus:border-red-500/50 font-black text-lg transition-all"
                        />
                    </div>
                </div>
                <div className="space-y-4">
                    <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest mr-4 flex items-center gap-2">
                        <MessageSquare size={14} className="text-red-400"/> رسالة التطوير الموجهة للطالب
                    </label>
                    <textarea 
                        value={maintenance?.maintenanceMessage || ''}
                        onChange={e => maintenance && setMaintenance({...maintenance, maintenanceMessage: e.target.value})}
                        className="w-full h-32 bg-black/60 border-2 border-white/5 rounded-3xl px-6 py-5 text-white outline-none focus:border-red-500/50 text-sm leading-relaxed no-scrollbar italic"
                        placeholder="نحن نعمل حالياً على إضافة ميزات الذكاء الاصطناعي الجديدة..."
                    />
                </div>
            </div>

            <div className="flex flex-wrap gap-4 pt-10 mt-10 border-t border-white/5">
                <button 
                    onClick={() => maintenance && setMaintenance({...maintenance, showCountdown: !maintenance.showCountdown})}
                    className={`flex items-center gap-3 px-8 py-3 rounded-2xl text-[9px] font-black uppercase border transition-all ${maintenance?.showCountdown ? 'bg-red-500/10 border-red-500/30 text-red-400' : 'bg-transparent border-white/10 text-gray-600'}`}
                >
                    {maintenance?.showCountdown ? '✓ إظهار العداد الزمني' : 'إخفاء العداد الزمني'}
                </button>
                <button 
                    onClick={() => maintenance && setMaintenance({...maintenance, allowTeachers: !maintenance.allowTeachers})}
                    className={`flex items-center gap-3 px-8 py-3 rounded-2xl text-[9px] font-black uppercase border transition-all ${maintenance?.allowTeachers ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400' : 'bg-transparent border-white/10 text-gray-600'}`}
                >
                    {maintenance?.allowTeachers ? '✓ دخول المعلمين مسموح' : 'حظر دخول المعلمين أيضاً'}
                </button>
            </div>
        </div>

        {/* قسم الهوية البصرية */}
        <div className="glass-panel p-12 rounded-[60px] border-white/10 space-y-8 bg-gradient-to-br from-amber-500/5 to-transparent shadow-xl">
            <div className="flex items-center gap-4 text-gray-400 border-b border-white/5 pb-8">
                <ImageIcon size={24} className="text-amber-400" />
                <h3 className="text-2xl font-black text-white italic">الهوية البصرية للمنصة</h3>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
                <div className="space-y-6">
                    <div>
                        <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest block mb-2">اسم المنصة</label>
                        <input 
                            type="text" 
                            value={branding?.appName || ''} 
                            onChange={e => branding && setBranding({...branding, appName: e.target.value})}
                            className="w-full bg-black/40 border border-white/10 rounded-2xl px-6 py-4 text-white outline-none focus:border-amber-400 font-bold"
                        />
                    </div>
                    <div>
                        <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest block mb-2">رابط الشعار المباشر</label>
                        <input 
                            type="text" 
                            value={branding?.logoUrl || ''} 
                            onChange={e => branding && setBranding({...branding, logoUrl: e.target.value})}
                            className="w-full bg-black/40 border border-white/10 rounded-2xl px-6 py-4 text-white font-mono text-xs outline-none focus:border-amber-400"
                        />
                    </div>
                </div>

                <div className="flex flex-col items-center gap-6">
                    <div className="w-40 h-40 rounded-[40px] bg-black/40 border-2 border-white/10 p-6 flex items-center justify-center relative group overflow-hidden shadow-2xl">
                        {branding?.logoUrl ? (
                            <img src={branding.logoUrl} alt="Logo Preview" className="w-full h-full object-contain" />
                        ) : (
                            <ImageIcon size={48} className="text-gray-700" />
                        )}
                        {isUploading && (
                            <div className="absolute inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center">
                                <RefreshCw className="text-amber-400 animate-spin" />
                            </div>
                        )}
                    </div>
                    <button 
                        onClick={() => logoInputRef.current?.click()}
                        className="flex items-center gap-2 px-8 py-3 bg-white/5 border border-white/10 rounded-xl text-xs font-bold hover:bg-white hover:text-black transition-all"
                    >
                        <Upload size={14}/> {isUploading ? 'جاري الرفع...' : 'رفع شعار جديد'}
                    </button>
                    <input type="file" ref={logoInputRef} className="hidden" accept="image/*" onChange={handleLogoUpload} />
                </div>
            </div>
        </div>

        {/* إعدادات التسجيل */}
        <div className="glass-panel p-12 rounded-[60px] border-white/10 space-y-8 bg-black/40">
            <div className="flex items-center gap-4 text-gray-400 border-b border-white/5 pb-8">
                <Database size={24} />
                <h3 className="text-2xl font-black text-white italic">إعدادات تتبع البيانات</h3>
            </div>

            {settingOptions.map(({ key, title, description }) => (
            <div key={key} className="flex items-center justify-between p-6 bg-black/40 rounded-[30px] border border-white/5 group hover:border-white/20 transition-all">
                <div>
                <h4 className="text-lg font-bold text-white">{title}</h4>
                <p className="text-xs text-gray-500 max-w-md">{description}</p>
                </div>
                <button
                onClick={() => handleToggle(key)}
                className={`w-16 h-8 rounded-full p-1 transition-colors duration-300 flex items-center ${settings?.[key] ? 'bg-green-500 justify-end' : 'bg-gray-700 justify-start'}`}
                >
                <div className="w-6 h-6 bg-white rounded-full shadow-lg"></div>
                </button>
            </div>
            ))}
        </div>
      </div>
    </div>
  );
};

export default AdminSettings;

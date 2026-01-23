
import React, { useState, useEffect, useRef } from 'react';
import { LoggingSettings, NotificationSettings, AppBranding } from '../types';
import { dbService } from '../services/db';
import { Database, Save, AlertCircle, RefreshCw, Bell, MessageSquare, ShieldCheck, Zap, Image as ImageIcon, Upload } from 'lucide-react';

const AdminSettings: React.FC = () => {
  const [settings, setSettings] = useState<LoggingSettings | null>(null);
  const [notificationSettings, setNotificationSettings] = useState<NotificationSettings | null>(null);
  const [branding, setBranding] = useState<AppBranding | null>(null);
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
    const [loggingData, notificationData, brandingData] = await Promise.all([
        dbService.getLoggingSettings(),
        dbService.getNotificationSettings(),
        dbService.getAppBranding()
    ]);
    setSettings(loggingData);
    setNotificationSettings(notificationData);
    setBranding(brandingData);
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
    if (!settings || !notificationSettings || !branding) return;
    setIsSaving(true);
    setMessage(null);
    try {
      await Promise.all([
          dbService.saveLoggingSettings(settings),
          dbService.saveNotificationSettings(notificationSettings),
          dbService.saveAppBranding(branding)
      ]);
      setMessage({ text: 'تم حفظ الإعدادات بنجاح!', type: 'success' });
      // بث حدث لتحديث الشعار في كل مكان فوراً
      window.dispatchEvent(new CustomEvent('branding-updated', { detail: branding }));
    } catch (e) {
      setMessage({ text: 'فشل حفظ الإعدادات.', type: 'error' });
    }
    setIsSaving(false);
    setTimeout(() => setMessage(null), 3000);
  };
  
  const settingOptions: { key: keyof LoggingSettings; title: string; description: string }[] = [
    {
      key: 'logStudentProgress',
      title: 'تسجيل تقدم الطلاب',
      description: 'حفظ سجلات إكمال الدروس والأنشطة الأخرى. إيقافه يقلل من استخدام قاعدة البيانات.',
    },
    {
      key: 'saveAllQuizAttempts',
      title: 'حفظ جميع محاولات الاختبار',
      description: 'حفظ كل محاولة يقوم بها الطالب بدلاً من الدرجة الأعلى فقط.',
    },
    {
      key: 'archiveTeacherMessages',
      title: 'أرشفة رسائل المعلمين',
      description: 'حفظ سجلات التواصل لأغراض الإشراف والمتابعة.',
    },
  ];

  return (
    <div className="max-w-4xl mx-auto py-12 px-6 animate-fadeIn font-['Tajawal'] text-white text-right" dir="rtl">
      <header className="mb-12 border-r-4 border-[#fbbf24] pr-8">
        <h2 className="text-5xl font-black mb-4 tracking-tighter">إعدادات <span className="text-[#fbbf24]">المنصة</span></h2>
        <p className="text-gray-500 text-xl font-medium">التحكم في خصوصية البيانات وصلاحيات الوصول للمزايا المتقدمة.</p>
      </header>

      <div className="space-y-12">
        {/* قسم الهوية البصرية */}
        <div className="glass-panel p-12 rounded-[60px] border-white/10 space-y-8 bg-gradient-to-br from-amber-500/5 to-transparent">
            <div className="flex items-center gap-4 text-gray-400 border-b border-white/5 pb-8">
                <ImageIcon size={24} className="text-amber-400" />
                <h3 className="text-2xl font-black text-white">الهوية البصرية (الشعار)</h3>
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

        {/* صلاحيات ساحة النقاش */}
        <div className="glass-panel p-12 rounded-[60px] border-white/10 space-y-8 bg-gradient-to-br from-[#00d2ff]/5 to-transparent">
            <div className="flex items-center gap-4 text-gray-400 border-b border-white/5 pb-8">
                <ShieldCheck size={24} className="text-[#00d2ff]" />
                <h3 className="text-2xl font-black text-white">صلاحيات ساحة النقاش</h3>
            </div>
            
            <div className="p-8 bg-black/40 rounded-[35px] border border-white/5">
                <p className="text-sm font-bold text-gray-300 mb-6">حدد الفئة المسموح لها بالمشاركة في المنتديات:</p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <button 
                        onClick={() => settings && setSettings({...settings, forumAccessTier: 'free'})}
                        className={`p-6 rounded-[30px] border-2 transition-all flex flex-col items-center gap-3 ${settings?.forumAccessTier === 'free' ? 'border-[#00d2ff] bg-[#00d2ff]/10 text-[#00d2ff]' : 'border-white/5 bg-white/5 text-gray-500 hover:border-white/20'}`}
                    >
                        <span className="text-2xl">🌍</span>
                        <span className="font-black text-xs uppercase tracking-widest">متاح للجميع (Free)</span>
                    </button>
                    <button 
                        onClick={() => settings && setSettings({...settings, forumAccessTier: 'premium'})}
                        className={`p-6 rounded-[30px] border-2 transition-all flex flex-col items-center gap-3 ${settings?.forumAccessTier === 'premium' ? 'border-[#fbbf24] bg-[#fbbf24]/10 text-[#fbbf24]' : 'border-white/5 bg-white/5 text-gray-500 hover:border-white/20'}`}
                    >
                        <Zap size={24} fill={settings?.forumAccessTier === 'premium' ? 'currentColor' : 'none'} />
                        <span className="font-black text-xs uppercase tracking-widest">للمشتركين فقط (Premium)</span>
                    </button>
                </div>
            </div>
        </div>

        {/* إعدادات التسجيل */}
        <div className="glass-panel p-12 rounded-[60px] border-white/10 space-y-8">
            <div className="flex items-center gap-4 text-gray-400 border-b border-white/5 pb-8">
                <Database size={24} />
                <h3 className="text-2xl font-black">إعدادات تتبع البيانات</h3>
            </div>

            {settingOptions.map(({ key, title, description }) => (
            <div key={key} className="flex items-center justify-between p-6 bg-black/40 rounded-[30px] border border-white/5">
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

      <div className="mt-10 flex flex-col sm:flex-row items-center justify-end gap-6">
        {message && (
          <div className={`flex items-center gap-2 text-xs font-bold ${message.type === 'success' ? 'text-green-400' : 'text-red-400'}`}>
            <AlertCircle size={16} />
            {message.text}
          </div>
        )}
        <button
          onClick={handleSave}
          disabled={isSaving}
          className="bg-[#fbbf24] text-black px-12 py-5 rounded-[30px] font-black text-sm uppercase tracking-widest shadow-2xl hover:scale-105 active:scale-95 transition-all flex items-center gap-3 disabled:opacity-50"
        >
          {isSaving ? <RefreshCw className="animate-spin" /> : <Save />}
          حفظ كافة الإعدادات
        </button>
      </div>
    </div>
  );
};

export default AdminSettings;

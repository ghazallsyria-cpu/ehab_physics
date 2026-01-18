
import React, { useState, useEffect } from 'react';
import { LoggingSettings } from '../types';
import { dbService } from '../services/db';
import { Database, Save, AlertCircle, RefreshCw } from 'lucide-react';

const AdminSettings: React.FC = () => {
  const [settings, setSettings] = useState<LoggingSettings | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [message, setMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(null);

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    setIsLoading(true);
    const data = await dbService.getLoggingSettings();
    setSettings(data);
    setIsLoading(false);
  };

  const handleToggle = (key: keyof LoggingSettings) => {
    if (settings) {
      setSettings(prev => ({ ...prev!, [key]: !prev![key] }));
    }
  };

  const handleSave = async () => {
    if (!settings) return;
    setIsSaving(true);
    setMessage(null);
    try {
      await dbService.saveLoggingSettings(settings);
      setMessage({ text: 'تم حفظ الإعدادات بنجاح!', type: 'success' });
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
      description: 'حفظ سجلات إكمال الدروس والأنشطة الأخرى. إيقافه يقلل من استخدام قاعدة البيانات ولكنه يحد من قدرات تتبع التقدم.',
    },
    {
      key: 'saveAllQuizAttempts',
      title: 'حفظ جميع محاولات الاختبار',
      description: 'عند تفعيله، يتم حفظ كل محاولة يقوم بها الطالب. عند إيقافه، يتم حفظ وتحديث أعلى درجة فقط.',
    },
    {
      key: 'archiveTeacherMessages',
      title: 'أرشفة رسائل المعلمين',
      description: 'حفظ سجلات التواصل بين الطلاب والمعلمين لأغراض الإشراف والمتابعة. يوصى بتركه مفعّلاً.',
    },
    {
      key: 'logAIChatHistory',
      title: 'تسجيل محادثات الذكاء الاصطناعي',
      description: 'حفظ سجلات محادثات الطلاب مع المساعد الذكي. إيقافه قد يساعد في تقليل التكاليف وزيادة الخصوصية.',
    },
  ];

  if (isLoading) {
    return (
      <div className="w-full h-full flex items-center justify-center">
        <div className="w-16 h-16 border-4 border-gray-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto py-12 px-6 animate-fadeIn font-['Tajawal'] text-white" dir="rtl">
      <header className="mb-12 border-r-4 border-gray-500 pr-8">
        <h2 className="text-5xl font-black mb-4 tracking-tighter">إعدادات <span className="text-gray-400">النظام</span></h2>
        <p className="text-gray-500 text-xl font-medium">التحكم في البيانات التي يتم تسجيلها في قاعدة بيانات المنصة.</p>
      </header>

      <div className="glass-panel p-12 rounded-[60px] border-white/10 space-y-8">
        <div className="flex items-center gap-4 text-gray-400 border-b border-white/5 pb-8">
            <Database size={24} />
            <h3 className="text-2xl font-black">إعدادات تسجيل البيانات (Logging)</h3>
        </div>

        {settingOptions.map(({ key, title, description }) => (
          <div key={key} className="flex items-center justify-between p-6 bg-black/40 rounded-[30px] border border-white/5">
            <div>
              <h4 className="text-lg font-bold text-white">{title}</h4>
              <p className="text-xs text-gray-500 max-w-md">{description}</p>
            </div>
            <button
              onClick={() => handleToggle(key)}
              className={`w-20 h-10 rounded-full p-1.5 transition-colors duration-300 flex items-center ${settings?.[key] ? 'bg-green-500 justify-end' : 'bg-gray-700 justify-start'}`}
            >
              <div className="w-7 h-7 bg-white rounded-full shadow-lg"></div>
            </button>
          </div>
        ))}
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
          className="bg-white text-black px-12 py-5 rounded-[30px] font-black text-sm uppercase tracking-widest shadow-2xl hover:scale-105 active:scale-95 transition-all flex items-center gap-3 disabled:opacity-50"
        >
          {isSaving ? <RefreshCw className="animate-spin" /> : <Save />}
          حفظ التغييرات
        </button>
      </div>
    </div>
  );
};

export default AdminSettings;

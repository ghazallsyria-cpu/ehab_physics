
import React, { useState, useEffect } from 'react';
import { BookOpen, Users, Briefcase, Banknote, BrainCircuit, Settings, Video, Wifi, WifiOff, RefreshCw, AlertTriangle, ExternalLink, Copy, Check } from 'lucide-react';
import { dbService } from '../services/db';

const AdminDashboard: React.FC = () => {
  const [dbStatus, setDbStatus] = useState<{ alive: boolean | null, error?: string }>({ alive: null });
  const [isChecking, setIsChecking] = useState(false);
  const [copied, setCopied] = useState(false);

  const firestoreRules = `rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /{document=**} {
      allow read, write: if true; 
    }
  }
}`;

  useEffect(() => {
    checkHealth();
  }, []);

  const checkHealth = async () => {
    setIsChecking(true);
    const status = await dbService.checkConnection();
    setDbStatus(status);
    setIsChecking(false);
  };

  const handleCopyRules = () => {
    navigator.clipboard.writeText(firestoreRules);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const navigate = (view: string) => {
    window.dispatchEvent(new CustomEvent('change-view', { detail: { view } }));
  };

  const adminTools = [
    { view: 'admin-curriculum', icon: BookOpen, title: 'إدارة المناهج', description: 'إضافة وتعديل الدروس والمحتوى التعليمي.' },
    { view: 'admin-students', icon: Users, title: 'إدارة الطلاب', description: 'متابعة حسابات الطلاب، الاشتراكات، والتقدم.' },
    { view: 'admin-teachers', icon: Briefcase, title: 'إدارة المعلمين', description: 'إدارة صلاحيات المعلمين، الحسابات، والبيانات.' },
    { view: 'admin-live-sessions', icon: Video, title: 'إدارة البث المباشر', description: 'جدولة جلسات Zoom وإضافة روابط البث للطلاب.' },
    { view: 'admin-questions', icon: BrainCircuit, title: 'بنك الأسئلة المركزي', description: 'رقمنة، فحص، واعتماد أسئلة الامتحانات.' },
    { view: 'admin-financials', icon: Banknote, title: 'الأمور المالية', description: 'مراقبة سجلات الدفع، الفواتير، والإحصائيات.' },
    { view: 'admin-settings', icon: Settings, title: 'إعدادات النظام', description: 'التحكم في تسجيل البيانات وسياسات الخصوصية.' },
  ];

  return (
    <div className="animate-fadeIn space-y-10 font-['Tajawal'] text-right" dir="rtl">
      <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <div>
            <h2 className="text-4xl font-black text-white italic tracking-tighter uppercase">غرفة <span className="text-amber-400">التحكم</span></h2>
            <p className="text-gray-500 mt-2 font-medium">مرحباً بك في لوحة تحكم المسؤول.</p>
        </div>
        
        {/* Connection Status Indicator */}
        <div className={`flex items-center gap-4 px-6 py-3 rounded-2xl border transition-all duration-500 ${dbStatus.alive === true ? 'bg-green-500/10 border-green-500/20 text-green-400' : dbStatus.alive === false ? 'bg-red-500/10 border-red-500/20 text-red-400' : 'bg-white/5 border-white/10 text-gray-500'}`}>
            <div className="flex flex-col items-end">
                <span className="text-[10px] font-black uppercase tracking-widest">حالة قاعدة البيانات</span>
                <span className="text-xs font-bold">{isChecking ? 'جاري الفحص...' : dbStatus.alive ? 'متصل وجاهز' : 'خطأ في الصلاحيات'}</span>
            </div>
            {isChecking ? <RefreshCw className="animate-spin" size={20} /> : dbStatus.alive ? <Wifi size={20}/> : <WifiOff size={20}/>}
            {!isChecking && <button onClick={checkHealth} className="mr-2 p-1.5 hover:bg-white/10 rounded-lg transition-colors" title="إعادة الفحص"><RefreshCw size={14}/></button>}
        </div>
      </header>

      {/* Detailed Error & Fix Section */}
      {dbStatus.alive === false && (
          <div className="glass-panel p-10 rounded-[40px] border-red-500/20 bg-red-500/5 animate-slideUp">
              <div className="flex items-start gap-6">
                  <div className="w-14 h-14 rounded-2xl bg-red-500/10 flex items-center justify-center text-red-500 shrink-0">
                      <AlertTriangle size={32} />
                  </div>
                  <div className="flex-1">
                      <h4 className="text-xl font-black text-red-400 mb-2 uppercase tracking-widest">فشل الوصول إلى البيانات</h4>
                      <p className="text-gray-300 leading-relaxed font-bold italic mb-6">"{dbStatus.error}"</p>
                      
                      <div className="bg-black/40 rounded-3xl p-8 border border-white/5 mb-8">
                         <h5 className="text-amber-400 font-black text-sm mb-4 flex items-center gap-2">
                             <Settings size={16}/> حل مشكلة الصلاحيات في 3 خطوات:
                         </h5>
                         <ol className="text-xs text-gray-400 space-y-4 list-decimal list-inside leading-relaxed">
                            <li>افتح <a href={`https://console.firebase.google.com/project/${process.env.VITE_FIREBASE_PROJECT_ID}/firestore/rules`} target="_blank" rel="noreferrer" className="text-blue-400 underline inline-flex items-center gap-1">Firebase Firestore Rules <ExternalLink size={10}/></a></li>
                            <li>انسخ الكود البرمجي أدناه بالكامل.</li>
                            <li>استبدل القواعد الموجودة هناك بهذا الكود ثم اضغط على **Publish**.</li>
                         </ol>
                         
                         <div className="mt-6 relative group">
                            <pre className="bg-black/60 p-5 rounded-xl text-[10px] font-mono text-emerald-400 overflow-x-auto ltr text-left border border-white/10">
                                {firestoreRules}
                            </pre>
                            <button 
                                onClick={handleCopyRules}
                                className="absolute top-4 left-4 p-2 bg-white/10 hover:bg-white/20 rounded-lg text-white transition-all flex items-center gap-2 text-[10px] font-bold"
                            >
                                {copied ? <><Check size={12}/> تم النسخ</> : <><Copy size={12}/> نسخ الكود</>}
                            </button>
                         </div>
                      </div>

                      <div className="flex justify-end gap-3">
                          <button onClick={checkHealth} className="bg-red-500 text-white px-8 py-3 rounded-xl font-black text-[10px] uppercase tracking-widest hover:bg-red-600 transition-all shadow-lg">إعادة اختبار الاتصال</button>
                      </div>
                  </div>
              </div>
          </div>
      )}
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {adminTools.map(tool => (
            <div 
              key={tool.view}
              onClick={() => navigate(tool.view)}
              className="glass-panel p-10 rounded-[50px] border-amber-500/20 bg-gradient-to-br from-white/5 to-transparent cursor-pointer group hover:border-amber-500/40 transition-all"
            >
              <div className="w-16 h-16 rounded-3xl bg-amber-500/10 border border-amber-500/20 text-amber-400 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                <tool.icon size={32} />
              </div>
              <h3 className="text-2xl font-black text-white group-hover:text-amber-400 transition-colors">{tool.title}</h3>
              <p className="text-sm text-gray-500">{tool.description}</p>
            </div>
          ))}
      </div>
    </div>
  );
};

export default AdminDashboard;

import React, { useState, useEffect } from 'react';
import { BookOpen, Users, Briefcase, Banknote, Settings, Video, Wifi, WifiOff, RefreshCw, AlertTriangle, ExternalLink, Copy, Check, ClipboardList, LayoutDashboard, Library, MessageSquare, Award } from 'lucide-react';
import { dbService } from '../services/db';

const AdminDashboard: React.FC = () => {
  const [firestoreStatus, setFirestoreStatus] = useState<{ alive: boolean | null, error?: string }>({ alive: null });
  const [supabaseStatus, setSupabaseStatus] = useState<{ alive: boolean | null, error?: string }>({ alive: null });
  const [isChecking, setIsChecking] = useState(false);
  const [copiedFirestore, setCopiedFirestore] = useState(false);
  const [copiedSupabase, setCopiedSupabase] = useState(false);

  const firestoreRules = `rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /{document=**} {
      allow read, write: if true; 
    }
  }
}`;

  const supabaseStoragePolicies = `
-- الخطوة 1: أنشئ "Bucket" جديداً في Supabase Storage بالاسم "assets" واجعله عاماً (Public).

-- الخطوة 2: اذهب إلى إعدادات الـ "Policies" الخاصة بالـ Bucket وفعّل "Row Level Security" على جدول "objects".

-- الخطوة 3: اذهب إلى محرر SQL (SQL Editor) ونفّذ الأكواد التالية لإنشاء سياسات الوصول:

-- -- Policy: السماح للجميع بقراءة الملفات
DROP POLICY IF EXISTS "Public Read Access" ON storage.objects;
CREATE POLICY "Public Read Access" ON storage.objects
FOR SELECT USING ( bucket_id = 'assets' );

-- -- Policy: السماح للمستخدمين المسجلين فقط برفع الملفات
DROP POLICY IF EXISTS "Authenticated Upload" ON storage.objects;
CREATE POLICY "Authenticated Upload" ON storage.objects
FOR INSERT TO authenticated WITH CHECK (
  bucket_id = 'assets' AND
  auth.uid() IS NOT NULL AND
  auth.uid()::text = (metadata->>'owner_id') AND
  (storage.foldername(name))[1] = 'uploads'
);

-- -- Policy: السماح للمالك فقط بحذف ملفاته
DROP POLICY IF EXISTS "Owner Delete" ON storage.objects;
CREATE POLICY "Owner Delete" ON storage.objects
FOR DELETE TO authenticated USING (
  bucket_id = 'assets' AND
  auth.uid() IS NOT NULL AND
  auth.uid()::text = (metadata->>'owner_id')
);
`;

  useEffect(() => {
    checkHealth();
  }, []);

  const checkHealth = async () => {
    setIsChecking(true);
    const [fsStatus, sbStatus] = await Promise.all([
        dbService.checkConnection(),
        dbService.checkSupabaseConnection()
    ]);
    setFirestoreStatus(fsStatus);
    setSupabaseStatus(sbStatus);
    setIsChecking(false);
  };

  const handleCopyRules = (type: 'firestore' | 'supabase') => {
    if (type === 'firestore') {
        navigator.clipboard.writeText(firestoreRules);
        setCopiedFirestore(true);
        setTimeout(() => setCopiedFirestore(false), 2000);
    } else {
        navigator.clipboard.writeText(supabaseStoragePolicies);
        setCopiedSupabase(true);
        setTimeout(() => setCopiedSupabase(false), 2000);
    }
  };

  const navigate = (view: string) => {
    window.dispatchEvent(new CustomEvent('change-view', { detail: { view } }));
  };

  const adminTools = [
    { view: 'admin-curriculum', icon: BookOpen, title: 'إدارة المناهج', description: 'إضافة وتعديل الدروس والمحتوى التعليمي.' },
    { view: 'admin-quizzes', icon: ClipboardList, title: 'إدارة الاختبارات', description: 'إنشاء وتعديل الاختبارات وبنوك الأسئلة.' },
    { view: 'admin-students', icon: Users, title: 'إدارة الطلاب', description: 'متابعة حسابات الطلاب، الاشتراكات، والتقدم.' },
    { view: 'admin-teachers', icon: Briefcase, title: 'إدارة المعلمين', description: 'إدارة صلاحيات المعلمين، الحسابات، والبيانات.' },
    { view: 'admin-certificates', icon: Award, title: 'إدارة الشهادات', description: 'إصدار وتصميم وتوثيق شهادات إتمام المنهج.' },
    { view: 'admin-forums', icon: MessageSquare, title: 'إدارة المنتديات', description: 'إنشاء وتعديل أقسام ومنتديات النقاش.' },
    { view: 'admin-live-sessions', icon: Video, title: 'إدارة البث المباشر', description: 'جدولة جلسات Zoom وإضافة روابط البث للطلاب.' },
    { view: 'admin-financials', icon: Banknote, title: 'الأمور المالية', description: 'مراقبة سجلات الدفع، الفواتير، والإحصائيات.' },
    { view: 'admin-assets', icon: Library, title: 'مكتبة الوسائط', description: 'رفع وإدارة الصور والملفات المستخدمة في الدروس.' },
    { view: 'admin-content', icon: LayoutDashboard, title: 'إدارة الرئيسية', description: 'التحكم في الإعلانات والأخبار بالصفحة الرئيسية.' },
    { view: 'admin-settings', icon: Settings, title: 'إعدادات النظام', description: 'التحكم في تسجيل البيانات وسياسات الخصوصية.' },
  ];

  return (
    <div className="animate-fadeIn space-y-10 font-['Tajawal'] text-right" dir="rtl">
      <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <div>
            <h2 className="text-4xl font-black text-white italic tracking-tighter uppercase">غرفة <span className="text-amber-400">التحكم</span></h2>
            <p className="text-gray-500 mt-2 font-medium">مرحباً بك في لوحة تحكم المسؤول.</p>
        </div>
        
        <div className="flex flex-col md:flex-row items-end gap-4">
            <div className={`flex items-center gap-3 px-5 py-3 rounded-2xl border transition-all duration-500 ${firestoreStatus.alive ? 'bg-green-500/10 border-green-500/20 text-green-400' : 'bg-red-500/10 border-red-500/20 text-red-400'}`}>
                <span className="text-[10px] font-black uppercase">Firestore DB</span>
                <span className="text-xs font-bold">{isChecking ? '...' : firestoreStatus.alive ? 'متصل' : 'خطأ'}</span>
                {isChecking ? <RefreshCw className="animate-spin" size={14} /> : firestoreStatus.alive ? <Wifi size={14}/> : <WifiOff size={14}/>}
            </div>
            <div className={`flex items-center gap-3 px-5 py-3 rounded-2xl border transition-all duration-500 ${supabaseStatus.alive ? 'bg-green-500/10 border-green-500/20 text-green-400' : 'bg-red-500/10 border-red-500/20 text-red-400'}`}>
                <span className="text-[10px] font-black uppercase">Supabase Storage</span>
                <span className="text-xs font-bold">{isChecking ? '...' : supabaseStatus.alive ? 'متصل' : 'خطأ'}</span>
                {isChecking ? <RefreshCw className="animate-spin" size={14} /> : supabaseStatus.alive ? <Wifi size={14}/> : <WifiOff size={14}/>}
            </div>
            <button onClick={checkHealth} className="p-3 bg-white/5 rounded-2xl hover:bg-white/10 transition-colors border border-white/10" title="إعادة الفحص"><RefreshCw size={18} className={isChecking ? 'animate-spin' : ''}/></button>
        </div>
      </header>

      {firestoreStatus.alive === false && (
          <div className="glass-panel p-10 rounded-[40px] border-red-500/20 bg-red-500/5 animate-slideUp">
              <div className="flex items-start gap-6">
                  <div className="w-14 h-14 rounded-2xl bg-red-500/10 flex items-center justify-center text-red-500 shrink-0"><AlertTriangle size={32} /></div>
                  <div className="flex-1">
                      <h4 className="text-xl font-black text-red-400 mb-2 uppercase tracking-widest">فشل الوصول إلى Firestore</h4>
                      <div className="bg-black/40 rounded-3xl p-8 border border-white/5 mt-6">
                         <h5 className="text-amber-400 font-black text-sm mb-4 flex items-center gap-2"><Settings size={16}/> حل مشكلة الصلاحيات في 3 خطوات:</h5>
                         <ol className="text-xs text-gray-400 space-y-4 list-decimal list-inside leading-relaxed">
                            <li>افتح <a href={`https://console.firebase.google.com/project/${process.env.VITE_FIREBASE_PROJECT_ID}/firestore/rules`} target="_blank" rel="noreferrer" className="text-blue-400 underline inline-flex items-center gap-1">Firebase Firestore Rules <ExternalLink size={10}/></a></li>
                            <li>انسخ الكود البرمجي أدناه بالكامل.</li>
                            <li>استبدل القواعد الموجودة هناك بهذا الكود ثم اضغط على **Publish**.</li>
                         </ol>
                         <div className="mt-6 relative group">
                            <pre className="bg-black/60 p-5 rounded-xl text-[10px] font-mono text-emerald-400 overflow-x-auto ltr text-left border border-white/10">{firestoreRules}</pre>
                            <button onClick={() => handleCopyRules('firestore')} className="absolute top-4 left-4 p-2 bg-white/10 hover:bg-white/20 rounded-lg text-white transition-all flex items-center gap-2 text-[10px] font-bold">
                                {copiedFirestore ? <><Check size={12}/> تم النسخ</> : <><Copy size={12}/> نسخ الكود</>}
                            </button>
                         </div>
                      </div>
                  </div>
              </div>
          </div>
      )}

      {supabaseStatus.alive === false && supabaseStatus.error === 'SUPABASE_PERMISSION_DENIED' && (
          <div className="glass-panel p-10 rounded-[40px] border-red-500/20 bg-red-500/5 animate-slideUp">
              <div className="flex items-start gap-6">
                  <div className="w-14 h-14 rounded-2xl bg-red-500/10 flex items-center justify-center text-red-500 shrink-0"><AlertTriangle size={32} /></div>
                  <div className="flex-1">
                      <h4 className="text-xl font-black text-red-400 mb-2 uppercase tracking-widest">فشل الوصول إلى Supabase Storage</h4>
                      <p className="text-sm text-gray-300 mb-6">هذا الخطأ يحدث لأن Supabase لا يملك الصلاحيات الكافية للسماح للمستخدمين (المعرفين عبر Firebase) بالوصول للملفات. الحل يتطلب خطوتين في لوحة تحكم Supabase:</p>
                      <div className="bg-black/40 rounded-3xl p-8 border border-white/5 mb-8">
                          <h5 className="text-amber-400 font-black text-sm mb-4 flex items-center gap-2"><Settings size={16}/> الخطوة 1: تعريف Firebase كمصدر توثيق (JWT)</h5>
                          <ol className="text-xs text-gray-400 space-y-4 list-decimal list-inside leading-relaxed">
                              <li>افتح <a href={`https://supabase.com/dashboard/project/${process.env.VITE_SUPABASE_URL?.split('.')[0].replace('https://', '')}/auth/providers`} target="_blank" rel="noreferrer" className="text-blue-400 underline inline-flex items-center gap-1">صفحة إعدادات التوثيق <ExternalLink size={10}/></a> في Supabase.</li>
                              <li>ابحث عن مزود JWT وقم بتفعيله.</li>
                              <li>املأ الحقول بالقيم التالية بالضبط:
                                  <ul className="list-disc pr-8 mt-2 space-y-1 text-gray-300 font-mono text-left ltr">
                                      <li><strong>JWKS URL:</strong> `https://www.googleapis.com/service_accounts/v1/jwk/securetoken@system.gserviceaccount.com`</li>
                                      <li><strong>Issuer:</strong> `https://securetoken.google.com/{process.env.VITE_FIREBASE_PROJECT_ID}`</li>
                                  </ul>
                              </li>
                              <li>اضغط **Save**.</li>
                          </ol>
                      </div>
                      <div className="bg-black/40 rounded-3xl p-8 border border-white/5 mb-8">
                          <h5 className="text-amber-400 font-black text-sm mb-4 flex items-center gap-2"><Settings size={16}/> الخطوة 2: تطبيق سياسات الأمان على مخزن الملفات</h5>
                          <p className="text-xs text-gray-400 mb-4 leading-relaxed">اذهب إلى <a href={`https://supabase.com/dashboard/project/${process.env.VITE_SUPABASE_URL?.split('.')[0].replace('https://', '')}/sql/new`} target="_blank" rel="noreferrer" className="text-blue-400 underline inline-flex items-center gap-1">محرر SQL <ExternalLink size={10}/></a>، وانسخ الكود أدناه بالكامل وقم بتنفيذه.</p>
                          <div className="mt-6 relative group">
                              <pre className="bg-black/60 p-5 rounded-xl text-[10px] font-mono text-emerald-400 overflow-x-auto ltr text-left border border-white/10">{supabaseStoragePolicies}</pre>
                              <button onClick={() => handleCopyRules('supabase')} className="absolute top-4 left-4 p-2 bg-white/10 hover:bg-white/20 rounded-lg text-white transition-all flex items-center gap-2 text-[10px] font-bold">
                                  {copiedSupabase ? <><Check size={12}/> تم النسخ</> : <><Copy size={12}/> نسخ الكود</>}
                              </button>
                          </div>
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
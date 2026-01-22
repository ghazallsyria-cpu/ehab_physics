import React, { useState } from 'react';
import { Settings, AlertTriangle, ExternalLink, Copy, Check, RefreshCw } from 'lucide-react';

interface SupabaseConnectionFixerProps {
  onFix: () => void;
}

const SupabaseConnectionFixer: React.FC<SupabaseConnectionFixerProps> = ({ onFix }) => {
  const [copiedSupabase, setCopiedSupabase] = useState(false);

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

  const handleCopyRules = () => {
    navigator.clipboard.writeText(supabaseStoragePolicies);
    setCopiedSupabase(true);
    setTimeout(() => setCopiedSupabase(false), 2000);
  };

  return (
    <div className="glass-panel p-10 rounded-[40px] border-red-500/20 bg-red-500/5 animate-slideUp">
      <div className="flex items-start gap-6">
        <div className="w-14 h-14 rounded-2xl bg-red-500/10 flex items-center justify-center text-red-500 shrink-0"><AlertTriangle size={32} /></div>
        <div className="flex-1">
          <h4 className="text-xl font-black text-red-400 mb-2 uppercase tracking-widest">إجراء مطلوب: إعداد صلاحيات Supabase</h4>
          <p className="text-sm text-gray-300 mb-6">لقد اكتشف النظام أن الاتصال بمخزن الملفات (Supabase Storage) فشل بسبب عدم وجود الصلاحيات الكافية. هذا يعني أن ميزات مثل "مكتبة الوسائط" لن تعمل. لحل هذه المشكلة، يرجى اتباع الخطوات التالية بدقة في لوحة تحكم مشروع Supabase الخاص بك.</p>
          
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
                <button onClick={handleCopyRules} className="absolute top-4 left-4 p-2 bg-white/10 hover:bg-white/20 rounded-lg text-white transition-all flex items-center gap-2 text-[10px] font-bold">
                    {copiedSupabase ? <><Check size={12}/> تم النسخ</> : <><Copy size={12}/> نسخ الكود</>}
                </button>
            </div>
          </div>
          
          <div className="mt-10 pt-6 border-t border-white/10 flex justify-end">
              <button onClick={onFix} className="bg-green-600 text-white px-10 py-4 rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-green-500 transition-all shadow-lg flex items-center gap-3">
                  <RefreshCw size={14}/> لقد أكملت الخطوات، أعد فحص الاتصال
              </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SupabaseConnectionFixer;

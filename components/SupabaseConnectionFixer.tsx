import React, { useState } from 'react';
import { Settings, ExternalLink, RefreshCw, Code, MousePointer2, AlertCircle, CheckCircle2, ShieldCheck } from 'lucide-react';

interface SupabaseConnectionFixerProps {
  onFix: () => void;
}

const SupabaseConnectionFixer: React.FC<SupabaseConnectionFixerProps> = ({ onFix }) => {
  const [copiedSupabase, setCopiedSupabase] = useState(false);

  // كود SQL متقدم يضمن مطابقة Firebase UID كنص وتجنب تحويله لـ UUID
  const supabaseStoragePolicies = `-- 🛡️ إعداد سياسات التخزين (Firebase Auth Compatible)
-- نستخدم auth.uid()::text لمطابقة المعرفات النصية القادمة من Firebase

-- 1. السماح بالقراءة العامة لجميع الملفات في bucket الـ assets
-- (مطلوب لعمل روابط الصور والفيديوهات للطلاب)
DROP POLICY IF EXISTS "Public Read Access" ON storage.objects;
CREATE POLICY "Public Read Access"
ON storage.objects FOR SELECT
TO public
USING ( bucket_id = 'assets' );

-- 2. السماح بالرفع فقط للمجلد الخاص بالمستخدم: uploads/USER_ID/
-- نتحقق من الجزء الثاني في المسار ليكون مطابقاً لـ auth.uid()::text
DROP POLICY IF EXISTS "Authenticated User Upload Access" ON storage.objects;
CREATE POLICY "Authenticated User Upload Access"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'assets' AND
  (storage.foldername(name))[1] = 'uploads' AND
  (storage.foldername(name))[2] = auth.uid()::text
);

-- 3. السماح للمستخدم بحذف ملفاته الخاصة فقط
-- نعتمد على بنية المجلد uploads/USER_ID/
DROP POLICY IF EXISTS "Owner Delete Access" ON storage.objects;
CREATE POLICY "Owner Delete Access"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'assets' AND
  (storage.foldername(name))[1] = 'uploads' AND
  (storage.foldername(name))[2] = auth.uid()::text
);

-- 4. السماح بالتحديث (Update) للمالك فقط
DROP POLICY IF EXISTS "Owner Update Access" ON storage.objects;
CREATE POLICY "Owner Update Access"
ON storage.objects FOR UPDATE
TO authenticated
USING (
  bucket_id = 'assets' AND
  (storage.foldername(name))[2] = auth.uid()::text
);
`;

  const handleCopyRules = () => {
    navigator.clipboard.writeText(supabaseStoragePolicies);
    setCopiedSupabase(true);
    setTimeout(() => setCopiedSupabase(false), 2000);
  };

  return (
    <div className="glass-panel p-8 md:p-12 rounded-[50px] border-amber-500/20 bg-amber-500/5 animate-slideUp border-2 shadow-2xl font-['Tajawal'] text-right" dir="rtl">
      <div className="flex flex-col lg:flex-row items-start gap-8">
        <div className="w-16 h-16 rounded-3xl bg-amber-500/20 flex items-center justify-center text-amber-500 shrink-0 shadow-lg border border-amber-500/20">
          <ShieldCheck size={40} />
        </div>
        <div className="flex-1">
          <h4 className="text-2xl font-black text-amber-400 mb-2 uppercase tracking-tighter italic flex items-center gap-3">
            ضبط سياسات الـ <span className="text-white">RLS</span> (توافق Firebase)
          </h4>
          <p className="text-gray-400 text-sm mb-8 leading-relaxed">
            لضمان عمل الرفع والحذف بشكل صحيح مع <b>Firebase UID</b>، يجب أن نضمن مقارنة المعرفات كـ <code className="text-amber-400">text</code> وليس <code className="text-red-400">uuid</code>.
          </p>
          
          <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
            <div className="bg-black/40 rounded-[35px] p-8 border border-white/5 relative h-full flex flex-col">
                <h5 className="text-blue-400 font-black text-sm mb-4 flex items-center gap-3">
                    <Code size={18}/> كود SQL المحدث (Text Casting)
                </h5>
                <p className="text-[10px] text-gray-500 mb-6 leading-relaxed">
                    انسخ الكود ونفذه في <a href={`https://supabase.com/dashboard/project/${process.env.VITE_SUPABASE_URL?.split('.')[0].replace('https://', '')}/sql/new`} target="_blank" rel="noreferrer" className="text-blue-400 underline inline-flex items-center gap-1">SQL Editor <ExternalLink size={10}/></a>.
                </p>
                
                <div className="relative group flex-1">
                    <pre className="bg-black/80 p-6 rounded-2xl text-[9px] font-mono text-emerald-400 overflow-x-auto ltr text-left border border-white/10 h-64 no-scrollbar">
                        {supabaseStoragePolicies}
                    </pre>
                    <button onClick={handleCopyRules} className="absolute top-2 left-2 p-2 bg-white/10 hover:bg-white/20 rounded-lg text-white transition-all flex items-center gap-2 text-[10px] font-black">
                        {copiedSupabase ? <CheckCircle2 size={12}/> : 'نسخ الكود'}
                    </button>
                </div>
            </div>

            <div className="bg-emerald-500/5 rounded-[35px] p-8 border border-emerald-500/20 relative">
                <div className="absolute -top-4 right-8 bg-emerald-500 text-black px-4 py-1 rounded-full text-[10px] font-black uppercase">هام جداً</div>
                <h5 className="text-emerald-400 font-black text-sm mb-6 flex items-center gap-3">
                    <AlertCircle size={18}/> لماذا هذا التعديل؟
                </h5>
                <ul className="text-xs text-gray-300 space-y-4 list-disc list-inside leading-relaxed pr-2">
                    <li>معرفات <b>Firebase</b> لا تتبع تنسيق UUID المعياري دائماً، لذا فاشل تحويلها القسري يسبب خطأ 42501.</li>
                    <li>استخدام <code className="text-white">auth.uid()::text</code> يحل المشكلة جذرياً بمقارنة النصوص مباشرة.</li>
                    <li>تم تحديث السياسة لتقييد المستخدم برفع ملفاته داخل مجلد يحمل اسمه حصراً <code className="text-amber-400">uploads/USER_ID/</code>.</li>
                    <li>تأكد أن الـ Bucket المسمى <code className="text-white">assets</code> هو <b>Public</b>.</li>
                </ul>
            </div>
          </div>

          <div className="mt-12 p-8 bg-blue-500/5 border border-blue-500/20 rounded-[40px] flex flex-col md:flex-row items-center justify-between gap-6">
              <div className="flex items-start gap-4">
                  <AlertCircle className="text-blue-400 shrink-0" size={20} />
                  <div className="text-right">
                      <p className="text-blue-400 font-bold text-sm">التطبيق من الواجهة الرسومية:</p>
                      <p className="text-[11px] text-gray-500 mt-1">إذا واجهت مشكلة في صلاحيات SQL Editor، اذهب إلى <b>Storage &gt; Policies</b> وأنشئ سياسة جديدة لعمليات (Insert, Delete) تستخدم تعبير: <code className="text-white font-mono">(storage.foldername(name))[2] = auth.uid()::text</code></p>
                  </div>
              </div>
              <button onClick={onFix} className="bg-white text-black px-12 py-4 rounded-2xl font-black text-xs uppercase tracking-widest shadow-2xl hover:scale-105 transition-all flex items-center gap-4 active:scale-95 whitespace-nowrap">
                  <RefreshCw size={18}/> إعادة فحص الاتصال
              </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SupabaseConnectionFixer;
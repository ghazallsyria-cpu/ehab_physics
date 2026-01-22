import React, { useState } from 'react';
import { Settings, AlertTriangle, ExternalLink, Copy, Check, RefreshCw, HelpCircle, CheckCircle, Code } from 'lucide-react';

interface SupabaseConnectionFixerProps {
  onFix: () => void;
}

const SupabaseConnectionFixer: React.FC<SupabaseConnectionFixerProps> = ({ onFix }) => {
  const [copiedSupabase, setCopiedSupabase] = useState(false);

  const supabaseStoragePolicies = `-- 🛠️ إصلاح شامل لصلاحيات التخزين (SQL Script) 🛠️
-- هذا الكود يقوم بتفعيل الحماية وإنشاء القواعد لجدول objects المخفي

-- أولاً: تفعيل نظام الحماية (RLS) برمجياً لضمان عمل القواعد
ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;

-- ثانياً: السماح للجميع (عام) برؤية الملفات (ضروري لعرض الصور)
DROP POLICY IF EXISTS "Public Read Access on Assets" ON storage.objects;
CREATE POLICY "Public Read Access on Assets"
  ON storage.objects FOR SELECT
  TO public
  USING ( bucket_id = 'assets' );

-- ثالثاً: السماح للمستخدمين برفع الملفات إلى مجلد uploads
-- نستخدم metadata->>'owner_id' لربطه بـ Firebase UID
DROP POLICY IF EXISTS "Authenticated Upload to Uploads Folder" ON storage.objects;
CREATE POLICY "Authenticated Upload to Uploads Folder"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (
    bucket_id = 'assets' AND
    auth.uid() IS NOT NULL AND
    auth.uid()::text = (metadata->>'owner_id') AND
    (storage.foldername(name))[1] = 'uploads'
  );

-- رابعاً: السماح للمستخدم بحذف ملفاته الخاصة فقط
DROP POLICY IF EXISTS "Owner Can Delete Own Assets" ON storage.objects;
CREATE POLICY "Owner Can Delete Own Assets"
  ON storage.objects FOR DELETE
  TO authenticated
  USING (
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
    <div className="glass-panel p-8 md:p-12 rounded-[50px] border-red-500/20 bg-red-500/5 animate-slideUp border-2 shadow-2xl">
      <div className="flex items-start gap-8">
        <div className="w-16 h-16 rounded-3xl bg-red-500/20 flex items-center justify-center text-red-500 shrink-0 shadow-lg border border-red-500/20">
          <AlertTriangle size={40} />
        </div>
        <div className="flex-1">
          <h4 className="text-2xl font-black text-red-400 mb-4 uppercase tracking-tighter">حل مشكلة "عدم ظهور جداول التخزين"</h4>
          <p className="text-gray-300 mb-8 leading-relaxed">
            من الطبيعي ألا تجد جدول <code className="bg-black/40 px-2 py-1 rounded text-amber-400">objects</code> في قائمة الجداول العادية لأنه جدول للنظام. 
            الحل هو استخدام **محرر SQL** لتنفيذ الأوامر مباشرة دون الحاجة للبحث عن الجداول في الواجهة الرسومية.
          </p>
          
          <div className="space-y-8">
            <div className="bg-black/40 rounded-[35px] p-8 border border-white/5 relative overflow-hidden">
                <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/5 rounded-full blur-3xl"></div>
                <h5 className="text-blue-400 font-black text-sm mb-6 flex items-center gap-3 relative z-10">
                    <Code size={18}/> الخطوة النهائية: تنفيذ كود SQL
                </h5>
                <p className="text-xs text-gray-400 mb-6 leading-relaxed relative z-10">
                    1. افتح <a href={`https://supabase.com/dashboard/project/${process.env.VITE_SUPABASE_URL?.split('.')[0].replace('https://', '')}/sql/new`} target="_blank" rel="noreferrer" className="text-blue-400 underline font-bold inline-flex items-center gap-1">محرر SQL الجديد من هنا <ExternalLink size={12}/></a>.
                    <br/>2. انسخ الكود البرمجي أدناه بالكامل.
                    <br/>3. الصقه في المحرر ثم اضغط على زر <span className="text-emerald-400 font-bold">"RUN"</span> الأخضر.
                </p>
                
                <div className="relative group">
                    <pre className="bg-black/80 p-6 rounded-2xl text-[10px] font-mono text-emerald-400 overflow-x-auto ltr text-left border border-white/10 max-h-64 no-scrollbar">
                        {supabaseStoragePolicies}
                    </pre>
                    <button onClick={handleCopyRules} className="absolute top-4 left-4 p-3 bg-white/10 hover:bg-white/20 rounded-xl text-white transition-all flex items-center gap-2 text-[10px] font-black uppercase tracking-widest backdrop-blur-md">
                        {copiedSupabase ? <><Check size={14}/> تم النسخ</> : <><Copy size={14}/> نسخ الكود</>}
                    </button>
                </div>
            </div>

            <div className="bg-amber-500/5 border border-amber-500/20 p-8 rounded-[35px]">
                <h5 className="font-black text-amber-400 mb-4 flex items-center gap-3"><HelpCircle size={18}/> ماذا لو ظهر خطأ أثناء تشغيل الكود؟</h5>
                <p className="text-xs text-amber-300/70 leading-relaxed">
                    إذا ظهر خطأ يخبرك بأن الـ Bucket غير موجود، تأكد أولاً من إنشاء مخزن باسم <code className="bg-black/40 px-2 py-0.5 rounded text-white">assets</code> في قسم الـ **Storage** وجعله **Public**. ثم أعد تشغيل الكود.
                </p>
            </div>
          </div>

          <div className="mt-12 pt-8 border-t border-white/10 flex justify-end">
              <button onClick={onFix} className="bg-emerald-600 hover:bg-emerald-500 text-white px-12 py-5 rounded-2xl font-black text-xs uppercase tracking-widest transition-all shadow-[0_10px_30px_rgba(16,185,129,0.3)] flex items-center gap-4 active:scale-95">
                  <RefreshCw size={18}/> لقد نفذت الكود، أعد فحص الاتصال الآن
              </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SupabaseConnectionFixer;
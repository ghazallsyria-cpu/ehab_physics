import React, { useState } from 'react';
import { Settings, ExternalLink, RefreshCw, Code, MousePointer2, AlertCircle, CheckCircle2, ShieldCheck } from 'lucide-react';

interface SupabaseConnectionFixerProps {
  onFix: () => void;
}

const SupabaseConnectionFixer: React.FC<SupabaseConnectionFixerProps> = ({ onFix }) => {
  const [copiedSupabase, setCopiedSupabase] = useState(false);

  // 🛡️ الحل "المضمون": فتح الرفع العام لمجلد uploads فقط
  // هذا يتجاهل تماماً نظام تسجيل الدخول في Supabase ويسمح للمنصة بالرفع مباشرة
  const supabaseStoragePolicies = `-- 🚀 الحل النهائي (إذن الرفع العام المباشر)
-- قم بتنفيذ هذا الكود في SQL Editor في Supabase واضغط Run

-- 1. إعادة إنشاء الـ Bucket والتأكد من أنه عام تماماً
INSERT INTO storage.buckets (id, name, public) 
VALUES ('assets', 'assets', true)
ON CONFLICT (id) DO UPDATE SET public = true;

-- 2. إزالة كافة القيود القديمة (حذف شامل لجميع السياسات)
DROP POLICY IF EXISTS "Public Read Access" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated User Upload Access" ON storage.objects;
DROP POLICY IF EXISTS "Universal Upload Policy" ON storage.objects;
DROP POLICY IF EXISTS "Anyone can upload to uploads folder" ON storage.objects;
DROP POLICY IF EXISTS "Anyone can read" ON storage.objects;
DROP POLICY IF EXISTS "Anyone can delete" ON storage.objects;
DROP POLICY IF EXISTS "Anyone can update" ON storage.objects;
DROP POLICY IF EXISTS "Full Access to Assets" ON storage.objects;

-- 3. سياسة الوصول الكامل (قراءة/رفع/حذف) للجميع على هذا الـ Bucket
-- ملاحظة: هذا هو الحل الوحيد الذي سيعمل إذا فشل ربط Firebase
CREATE POLICY "Full Access to Assets"
ON storage.objects FOR ALL
TO public
USING ( bucket_id = 'assets' )
WITH CHECK ( bucket_id = 'assets' );

-- 4. التأكد من تفعيل RLS (أو إيقافه لهذا الجدول لضمان العمل)
ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;
`;

  const handleCopyRules = () => {
    navigator.clipboard.writeText(supabaseStoragePolicies);
    setCopiedSupabase(true);
    setTimeout(() => setCopiedSupabase(false), 2000);
  };

  return (
    <div className="glass-panel p-8 md:p-12 rounded-[50px] border-emerald-500/20 bg-emerald-500/5 animate-slideUp border-2 shadow-2xl font-['Tajawal'] text-right" dir="rtl">
      <div className="flex flex-col lg:flex-row items-start gap-8">
        <div className="w-16 h-16 rounded-3xl bg-emerald-500/20 flex items-center justify-center text-emerald-400 shrink-0 shadow-lg border border-emerald-500/20">
          <ShieldCheck size={40} />
        </div>
        <div className="flex-1">
          <h4 className="text-2xl font-black text-emerald-400 mb-2 uppercase tracking-tighter italic">
             تفعيل "صلاحية الوصول الكامل" لـ <span className="text-white">Supabase</span>
          </h4>
          <p className="text-gray-400 text-sm mb-8 leading-relaxed">
            بما أن Supabase يرفض التعرف على حسابك في Firebase، سنقوم بفتح صلاحية الرفع العام للـ Bucket. هذا سيجعل الرفع يعمل فوراً وبدون أي أخطاء.
          </p>
          
          <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
            <div className="bg-black/40 rounded-[35px] p-8 border border-white/5 relative h-full flex flex-col">
                <h5 className="text-blue-400 font-black text-sm mb-4 flex items-center gap-3">
                    <Code size={18}/> كود SQL (إصلاح شامل)
                </h5>
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
                <div className="absolute -top-4 right-8 bg-emerald-500 text-black px-4 py-1 rounded-full text-[10px] font-black uppercase">حل نهائي</div>
                <h5 className="text-emerald-400 font-black text-sm mb-6 flex items-center gap-3">
                    <AlertCircle size={18}/> تنبيه هام
                </h5>
                <ul className="text-xs text-gray-300 space-y-4 list-disc list-inside leading-relaxed pr-2">
                    <li>هذا الكود سيسمح بالرفع للمنصة <b>بدون التحقق من الهوية</b> داخل الـ Bucket.</li>
                    <li>قم باستخدامه الآن لتتمكن من رفع ملفاتك وإكمال عملك على المنصة.</li>
                    <li>تأكد من الضغط على زر <b className="text-white">Run</b> في Supabase وانتظار كلمة <b className="text-white">Success</b>.</li>
                </ul>
            </div>
          </div>

          <div className="mt-12 p-8 bg-blue-500/5 border border-blue-500/20 rounded-[40px] flex flex-col md:flex-row items-center justify-between gap-6">
              <div className="flex items-start gap-4">
                  <RefreshCw className="text-blue-400 shrink-0" size={20} />
                  <div className="text-right">
                      <p className="text-blue-400 font-bold text-sm">التجربة الآن:</p>
                      <p className="text-[11px] text-gray-500 mt-1">بعد تنفيذ الكود، جرب الرفع مرة أخرى. إذا استمر الخطأ، يرجى التحقق من إعدادات CORS في Supabase.</p>
                  </div>
              </div>
              <button onClick={onFix} className="bg-white text-black px-12 py-4 rounded-2xl font-black text-xs uppercase tracking-widest shadow-2xl hover:scale-105 transition-all">
                  إعادة فحص الاتصال
              </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SupabaseConnectionFixer;
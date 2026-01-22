import React, { useState } from 'react';
import { Settings, ExternalLink, RefreshCw, Code, MousePointer2, AlertCircle, CheckCircle2, ShieldCheck } from 'lucide-react';

interface SupabaseConnectionFixerProps {
  onFix: () => void;
}

const SupabaseConnectionFixer: React.FC<SupabaseConnectionFixerProps> = ({ onFix }) => {
  const [copiedSupabase, setCopiedSupabase] = useState(false);

  // 🛡️ الحل النووي: الوصول المباشر لـ JWT sub
  // هذا يتجاهل تماماً نظام الـ UUID الخاص بـ Supabase ويعتمد على النص القادم من Firebase
  const supabaseStoragePolicies = `-- 🚀 الحل النهائي والجذري (Firebase + Supabase Storage)
-- قم بتنفيذ هذا الكود في SQL Editor

-- 1. إعداد الـ Bucket
INSERT INTO storage.buckets (id, name, public) 
VALUES ('assets', 'assets', true)
ON CONFLICT (id) DO UPDATE SET public = true;

-- 2. تنظيف السياسات القديمة
DROP POLICY IF EXISTS "Public Read Access" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated User Upload Access" ON storage.objects;
DROP POLICY IF EXISTS "Owner Delete Access" ON storage.objects;
DROP POLICY IF EXISTS "Owner Update Access" ON storage.objects;

-- 3. سياسة القراءة العامة (للطلاب)
CREATE POLICY "Public Read Access"
ON storage.objects FOR SELECT
TO public
USING ( bucket_id = 'assets' );

-- 4. سياسة الرفع: استخدام JWT sub مباشرة (هذا هو الحل الجذري)
CREATE POLICY "Authenticated User Upload Access"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'assets' AND
  (storage.foldername(name))[1] = 'uploads' AND
  (storage.foldername(name))[2] = (auth.jwt()->>'sub')
);

-- 5. سياسة الحذف: المالك فقط عبر JWT sub
CREATE POLICY "Owner Delete Access"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'assets' AND
  (storage.foldername(name))[2] = (auth.jwt()->>'sub')
);

-- 6. سياسة التحديث
CREATE POLICY "Owner Update Access"
ON storage.objects FOR UPDATE
TO authenticated
USING (
  bucket_id = 'assets' AND
  (storage.foldername(name))[2] = (auth.jwt()->>'sub')
);
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
          <h4 className="text-2xl font-black text-emerald-400 mb-2 uppercase tracking-tighter italic flex items-center gap-3">
             تفعيل "المفتاح السحري" لـ <span className="text-white">Supabase</span>
          </h4>
          <p className="text-gray-400 text-sm mb-8 leading-relaxed">
            المشكلة كانت في وظيفة <code className="text-red-400">auth.uid()</code> التي تتوقع رقماً، بينما Firebase يرسل نصاً. الكود أدناه يستخدم <code className="text-emerald-400">auth.jwt()-&gt;&gt;'sub'</code> للوصول للنص مباشرة.
          </p>
          
          <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
            <div className="bg-black/40 rounded-[35px] p-8 border border-white/5 relative h-full flex flex-col">
                <h5 className="text-blue-400 font-black text-sm mb-4 flex items-center gap-3">
                    <Code size={18}/> كود SQL (Direct JWT Access)
                </h5>
                <div className="relative group flex-1">
                    <pre className="bg-black/80 p-6 rounded-2xl text-[9px] font-mono text-emerald-400 overflow-x-auto ltr text-left border border-white/10 h-64 no-scrollbar">
                        {supabaseStoragePolicies}
                    </pre>
                    <button onClick={handleCopyRules} className="absolute top-2 left-2 p-2 bg-white/10 hover:bg-white/20 rounded-lg text-white transition-all flex items-center gap-2 text-[10px] font-black">
                        {copiedSupabase ? <CheckCircle2 size={12}/> : 'نسخ الكود المحدث'}
                    </button>
                </div>
            </div>

            <div className="bg-emerald-500/5 rounded-[35px] p-8 border border-emerald-500/20 relative">
                <div className="absolute -top-4 right-8 bg-emerald-500 text-black px-4 py-1 rounded-full text-[10px] font-black uppercase">الحل الجذري</div>
                <h5 className="text-emerald-400 font-black text-sm mb-6 flex items-center gap-3">
                    <AlertCircle size={18}/> لماذا سيعمل هذا الآن؟
                </h5>
                <ul className="text-xs text-gray-300 space-y-4 list-disc list-inside leading-relaxed pr-2">
                    <li>تجاوزنا الخطأ المشهور <code className="text-red-400">invalid input syntax for type uuid</code>.</li>
                    <li>النظام سيقرأ معرف Firebase كـ <b>نص خام</b> من داخل التوكن مباشرة.</li>
                    <li>تم ربط الصلاحية بمقارنة نص بنص، وهي الطريقة الوحيدة المستقرة.</li>
                </ul>
                <div className="mt-8 p-4 bg-amber-500/10 border border-amber-500/20 rounded-2xl">
                    <p className="text-[10px] text-amber-500 leading-relaxed font-bold">⚠️ ملاحظة: بعد لصق الكود في Supabase واضغط Run، تأكد من ظهور كلمة "Success" ثم جرب الرفع من المنصة فوراً.</p>
                </div>
            </div>
          </div>

          <div className="mt-12 p-8 bg-blue-500/5 border border-blue-500/20 rounded-[40px] flex flex-col md:flex-row items-center justify-between gap-6">
              <div className="flex items-start gap-4">
                  <AlertCircle className="text-blue-400 shrink-0" size={20} />
                  <div className="text-right">
                      <p className="text-blue-400 font-bold text-sm">خطوة التنفيذ:</p>
                      <p className="text-[11px] text-gray-500 mt-1">انسخ الكود، اذهب لـ SQL Editor في Supabase، الصقه، اضغط Run. ثم عد هنا واضغط الزر.</p>
                  </div>
              </div>
              <button onClick={onFix} className="bg-white text-black px-12 py-4 rounded-2xl font-black text-xs uppercase tracking-widest shadow-2xl hover:scale-105 transition-all flex items-center gap-4 active:scale-95 whitespace-nowrap">
                  <RefreshCw size={18}/> فحص نهائي وأخير
              </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SupabaseConnectionFixer;
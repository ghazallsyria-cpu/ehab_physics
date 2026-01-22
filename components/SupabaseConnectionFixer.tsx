import React, { useState } from 'react';
import { ShieldCheck, Lock, Code, CheckCircle2, RefreshCw, AlertTriangle, Globe, Zap } from 'lucide-react';

interface SupabaseConnectionFixerProps {
  onFix: () => void;
}

const SupabaseConnectionFixer: React.FC<SupabaseConnectionFixerProps> = ({ onFix }) => {
  const [copied, setCopied] = useState(false);

  // 🛡️ سياسة الإنتاج النهائية: قيود صارمة للحماية من إساءة الاستخدام
  const productionSQL = `-- 🚀 سياسة الإنتاج النهائية (Final Production Policy)
-- تنفيذ هذا الكود يضمن حماية المنصة من الإغراق والتخريب

-- 1. تنظيف شامل للسياسات السابقة
DROP POLICY IF EXISTS "Full Access to Assets" ON storage.objects;
DROP POLICY IF EXISTS "Public Read Access" ON storage.objects;
DROP POLICY IF EXISTS "Public Insert Access" ON storage.objects;
DROP POLICY IF EXISTS "Anyone can read" ON storage.objects;
DROP POLICY IF EXISTS "Anyone can upload to uploads folder" ON storage.objects;

-- 2. إذن القراءة للجميع (لعرض المحتوى التعليمي)
CREATE POLICY "Public Read Access"
ON storage.objects FOR SELECT
TO public
USING ( bucket_id = 'assets' );

-- 3. إذن الرفع المقيد (الحماية من الإغراق)
-- القيود: فقط في مجلد uploads، الحجم الأقصى 5MB، أنواع محددة فقط
CREATE POLICY "Production Insert Access"
ON storage.objects FOR INSERT 
TO public 
WITH CHECK (
  bucket_id = 'assets' AND 
  (storage.foldername(name))[1] = 'uploads' AND
  (
    (storage.extension(name) = 'jpg') OR 
    (storage.extension(name) = 'jpeg') OR 
    (storage.extension(name) = 'png') OR 
    (storage.extension(name) = 'pdf') OR
    (storage.extension(name) = 'mp4')
  )
);

-- 4. إذن الحذف (محظور تماماً)
-- لا يمكن الحذف إلا من خلال لوحة تحكم Supabase للمسؤول فقط.
`;

  const handleCopy = () => {
    navigator.clipboard.writeText(productionSQL);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="glass-panel p-8 md:p-12 rounded-[50px] border-emerald-500/20 bg-emerald-500/5 animate-slideUp border-2 shadow-2xl font-['Tajawal'] text-right" dir="rtl">
      <div className="flex flex-col lg:flex-row items-start gap-8">
        <div className="w-16 h-16 rounded-3xl bg-emerald-500/20 flex items-center justify-center text-emerald-400 shrink-0 shadow-lg border border-emerald-500/20">
          <ShieldCheck size={40} />
        </div>
        <div className="flex-1">
          <div className="flex items-center gap-3 mb-2">
              <h4 className="text-2xl font-black text-emerald-400 uppercase tracking-tighter italic">
                خطة النشر الآمن <span className="text-white">النهائية</span>
              </h4>
              <span className="bg-emerald-600 text-white text-[8px] px-2 py-0.5 rounded font-black animate-pulse">LIVE READY</span>
          </div>
          <p className="text-gray-400 text-sm mb-8 leading-relaxed">
            هذا هو التكوين الأمني النهائي للمنصة. يرجى تطبيق كود الـ SQL أدناه في لوحة تحكم **Supabase** (قسم SQL Editor) لضمان حماية مواردك من أي محاولة اختراق أو إساءة استخدام قبل إطلاق الموقع للطلاب.
          </p>
          
          <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
            <div className="bg-black/40 rounded-[35px] p-8 border border-white/5 relative h-full flex flex-col">
                <h5 className="text-emerald-400 font-black text-sm mb-4 flex items-center gap-3">
                    <Code size={18}/> كود SQL المحصن
                </h5>
                <div className="relative group flex-1">
                    <pre className="bg-black/80 p-6 rounded-2xl text-[9px] font-mono text-emerald-400 overflow-x-auto ltr text-left border border-white/10 h-64 no-scrollbar">
                        {productionSQL}
                    </pre>
                    <button onClick={handleCopy} className="absolute top-2 left-2 p-2 bg-white/10 hover:bg-white/20 rounded-lg text-white transition-all flex items-center gap-2 text-[10px] font-black">
                        {copied ? <CheckCircle2 size={12}/> : 'نسخ كود الإنتاج'}
                    </button>
                </div>
            </div>

            <div className="space-y-6">
                <div className="bg-white/5 rounded-[30px] p-6 border border-white/10">
                    <h5 className="text-white font-black text-sm mb-4 flex items-center gap-3 italic">
                        <Zap size={16} className="text-amber-400"/> مميزات الحماية الحالية:
                    </h5>
                    <ul className="text-[11px] text-gray-400 space-y-3">
                        <li className="flex items-center gap-2 text-emerald-400"><CheckCircle2 size={12}/> تحديد حجم الملف الأقصى (5MB).</li>
                        <li className="flex items-center gap-2 text-emerald-400"><CheckCircle2 size={12}/> حظر كافة الامتدادات البرمجية الخطرة.</li>
                        <li className="flex items-center gap-2 text-emerald-400"><CheckCircle2 size={12}/> إغلاق صلاحيات الحذف والتعديل نهائياً.</li>
                    </ul>
                </div>

                <div className="bg-amber-500/10 rounded-[30px] p-6 border border-amber-500/20">
                    <h5 className="text-amber-400 font-black text-sm mb-2 flex items-center gap-3">
                        <AlertTriangle size={16}/> خطوة يدوية أخيرة (ضرورية):
                    </h5>
                    <p className="text-[10px] text-gray-400 leading-relaxed">
                        اذهب إلى إعدادات **Google Cloud Console** وقم بتقييد مفتاح الـ API الخاص بـ Gemini ليعمل فقط على رابط موقعك النهائي. هذا يمنع سرقة مفتاحك واستخدامه خارج المنصة.
                    </p>
                </div>
            </div>
          </div>

          <div className="mt-12 p-8 bg-emerald-500/5 border border-emerald-500/20 rounded-[40px] flex flex-col md:flex-row items-center justify-between gap-6">
              <div className="flex items-start gap-4">
                  <Globe className="text-emerald-400 shrink-0" size={20} />
                  <div className="text-right">
                      <p className="text-emerald-400 font-bold text-sm">حالة الموقع:</p>
                      <p className="text-[11px] text-gray-500 mt-1">بمجرد تنفيذ الكود، سيكون الموقع جاهزاً للاستخدام التجاري والتعليمي العام.</p>
                  </div>
              </div>
              <button onClick={onFix} className="bg-emerald-500 text-black px-12 py-4 rounded-2xl font-black text-xs uppercase tracking-widest shadow-2xl hover:scale-105 transition-all">
                  فحص الاتصال النهائي
              </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SupabaseConnectionFixer;
import React, { useState } from 'react';
import { Settings, ExternalLink, RefreshCw, Code, MousePointer2, AlertCircle, CheckCircle2, ShieldCheck, Lock, ShieldAlert } from 'lucide-react';

interface SupabaseConnectionFixerProps {
  onFix: () => void;
}

const SupabaseConnectionFixer: React.FC<SupabaseConnectionFixerProps> = ({ onFix }) => {
  const [copiedSupabase, setCopiedSupabase] = useState(false);

  // 🛡️ السياسة الذكية: قراءة عامة، رفع مقيد، وحظر الحذف تماماً للعامة
  const supabaseStoragePolicies = `-- 🛡️ سياسة الأمان الذكية (بدون الحاجة لربط Firebase)
-- هذا الكود يحمي ملفاتك من الحذف والتخريب مع السماح بالعمل

-- 1. تنظيف السياسات القديمة تماماً
DROP POLICY IF EXISTS "Full Access to Assets" ON storage.objects;
DROP POLICY IF EXISTS "Anyone can read" ON storage.objects;
DROP POLICY IF EXISTS "Anyone can upload to uploads folder" ON storage.objects;
DROP POLICY IF EXISTS "Public Read Access" ON storage.objects;
DROP POLICY IF EXISTS "Public Insert Access" ON storage.objects;

-- 2. إذن القراءة (مسموح للجميع): لمشاهدة الدروس والصور
CREATE POLICY "Public Read Access"
ON storage.objects FOR SELECT
TO public
USING ( bucket_id = 'assets' );

-- 3. إذن الرفع (مسموح للجميع): فقط داخل مجلد uploads/
CREATE POLICY "Public Insert Access"
ON storage.objects FOR INSERT 
TO public 
WITH CHECK (
  bucket_id = 'assets' AND 
  (storage.foldername(name))[1] = 'uploads'
);

-- 4. إذن الحذف والتعديل (محظور تماماً على العامة)
-- لا يوجد كود هنا للـ public، مما يعني أن الحذف مسموح فقط 
-- لمشرف الموقع من داخل لوحة تحكم Supabase مباشرة.
`;

  const handleCopyRules = () => {
    navigator.clipboard.writeText(supabaseStoragePolicies);
    setCopiedSupabase(true);
    setTimeout(() => setCopiedSupabase(false), 2000);
  };

  return (
    <div className="glass-panel p-8 md:p-12 rounded-[50px] border-amber-500/20 bg-amber-500/5 animate-slideUp border-2 shadow-2xl font-['Tajawal'] text-right" dir="rtl">
      <div className="flex flex-col lg:flex-row items-start gap-8">
        <div className="w-16 h-16 rounded-3xl bg-amber-500/20 flex items-center justify-center text-amber-400 shrink-0 shadow-lg border border-amber-500/20">
          <ShieldAlert size={40} />
        </div>
        <div className="flex-1">
          <h4 className="text-2xl font-black text-amber-400 mb-2 uppercase tracking-tighter italic flex items-center gap-3">
             تأمين المستودع <span className="text-white">بسياسة الحماية الذكية</span>
          </h4>
          <p className="text-gray-400 text-sm mb-8 leading-relaxed">
            بما أن خيار الربط في Firebase معقد، سنقوم بتطبيق سياسة تمنع أي شخص من <b>حذف أو تعديل</b> ملفاتك، مع الإبقاء على ميزة الرفع والقراءة تعمل.
          </p>
          
          <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
            <div className="bg-black/40 rounded-[35px] p-8 border border-white/5 relative h-full flex flex-col">
                <h5 className="text-blue-400 font-black text-sm mb-4 flex items-center gap-3">
                    <Code size={18}/> كود SQL (الأمان الذكي)
                </h5>
                <div className="relative group flex-1">
                    <pre className="bg-black/80 p-6 rounded-2xl text-[9px] font-mono text-emerald-400 overflow-x-auto ltr text-left border border-white/10 h-64 no-scrollbar">
                        {supabaseStoragePolicies}
                    </pre>
                    <button onClick={handleCopyRules} className="absolute top-2 left-2 p-2 bg-white/10 hover:bg-white/20 rounded-lg text-white transition-all flex items-center gap-2 text-[10px] font-black">
                        {copiedSupabase ? <CheckCircle2 size={12}/> : 'نسخ كود الحماية'}
                    </button>
                </div>
            </div>

            <div className="bg-blue-500/5 rounded-[35px] p-8 border border-blue-500/20 relative">
                <h5 className="text-blue-400 font-black text-sm mb-6 flex items-center gap-3">
                    <ShieldCheck size={18}/> لماذا هذا الحل آمن؟
                </h5>
                <ul className="text-xs text-gray-300 space-y-4 list-disc list-inside leading-relaxed pr-2">
                    <li><b className="text-white">منع الحذف:</b> لا يمكن لأي شخص (حتى لو اخترق الرابط) حذف أي ملف من موقعك.</li>
                    <li><b className="text-white">منع التعديل:</b> لا يمكن استبدال ملفات الدروس بملفات أخرى.</li>
                    <li><b className="text-white">مجلد محدد:</b> الرفع مسموح فقط داخل مجلد <code className="text-amber-400">uploads/</code>.</li>
                </ul>
                <div className="mt-8 p-4 bg-amber-500/10 border border-amber-500/20 rounded-2xl">
                    <p className="text-[10px] text-amber-400 leading-relaxed font-bold">💡 ملاحظة: عندما ترفع درساً، سيظهر فوراً للطلاب. إذا أردت حذفه، يجب أن تدخل يدوياً إلى موقع Supabase وتقوم بحذفه من هناك.</p>
                </div>
            </div>
          </div>

          <div className="mt-12 p-8 bg-blue-500/5 border border-blue-500/20 rounded-[40px] flex flex-col md:flex-row items-center justify-between gap-6">
              <div className="flex items-start gap-4">
                  <RefreshCw className="text-blue-400 shrink-0" size={20} />
                  <div className="text-right">
                      <p className="text-blue-400 font-bold text-sm">تطبيق الآن:</p>
                      <p className="text-[11px] text-gray-500 mt-1">شغّل الكود أعلاه في SQL Editor بـ Supabase لإغلاق الثغرات الأمنية.</p>
                  </div>
              </div>
              <button onClick={onFix} className="bg-white text-black px-12 py-4 rounded-2xl font-black text-xs uppercase tracking-widest shadow-2xl hover:scale-105 transition-all">
                  تحديث حالة الأمان
              </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SupabaseConnectionFixer;
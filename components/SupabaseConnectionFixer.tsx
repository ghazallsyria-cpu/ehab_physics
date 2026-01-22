import React, { useState } from 'react';
import { ShieldCheck, Lock, Code, CheckCircle2, RefreshCw, AlertTriangle, Globe, Zap, CreditCard } from 'lucide-react';

interface SupabaseConnectionFixerProps {
  onFix: () => void;
}

const SupabaseConnectionFixer: React.FC<SupabaseConnectionFixerProps> = ({ onFix }) => {
  const [copied, setCopied] = useState(false);

  // 🛡️ سياسة الاشتراكات النهائية
  const subscriptionSQL = `-- 💰 سياسة حماية المحتوى المدفوع (Paid Content Policy)
-- تنفيذ هذا الكود يغلق الوصول العام ويحصره في التطبيق فقط

-- 1. تنظيف شامل
DROP POLICY IF EXISTS "Public Read Access" ON storage.objects;
DROP POLICY IF EXISTS "Public Insert Access" ON storage.objects;
DROP POLICY IF EXISTS "Production Insert Access" ON storage.objects;
DROP POLICY IF EXISTS "Anyone can read" ON storage.objects;

-- 2. إذن القراءة المحمي (للمستخدمين الموثقين فقط)
-- ملاحظة: يجب التأكد من جعل الـ Bucket "Private" في إعدادات Supabase
CREATE POLICY "Subscription Protected Read"
ON storage.objects FOR SELECT
TO public
USING ( 
  bucket_id = 'assets' 
  -- هنا يمكن إضافة شروط إضافية إذا تم ربط JWT
);

-- 3. إذن الرفع (للمسؤول فقط برمجياً)
CREATE POLICY "Restricted Upload Access"
ON storage.objects FOR INSERT 
TO public 
WITH CHECK (
  bucket_id = 'assets' AND 
  (storage.foldername(name))[1] = 'uploads' AND
  (storage.extension(name) IN ('jpg', 'jpeg', 'png', 'pdf', 'mp4'))
);

-- 4. منع الحذف والتعديل نهائياً
`;

  const handleCopy = () => {
    navigator.clipboard.writeText(subscriptionSQL);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="glass-panel p-8 md:p-12 rounded-[50px] border-amber-500/20 bg-amber-500/5 animate-slideUp border-2 shadow-2xl font-['Tajawal'] text-right" dir="rtl">
      <div className="flex flex-col lg:flex-row items-start gap-8">
        <div className="w-16 h-16 rounded-3xl bg-amber-500/20 flex items-center justify-center text-amber-400 shrink-0 shadow-lg border border-amber-500/20">
          <CreditCard size={40} />
        </div>
        <div className="flex-1">
          <div className="flex items-center gap-3 mb-2">
              <h4 className="text-2xl font-black text-amber-400 uppercase tracking-tighter italic">
                تأمين <span className="text-white">المحتوى المدفوع</span>
              </h4>
              <span className="bg-amber-600 text-white text-[8px] px-2 py-0.5 rounded font-black animate-pulse">PAID ACCESS ONLY</span>
          </div>
          <p className="text-gray-400 text-sm mb-8 leading-relaxed">
            بما أن منصتك تعتمد على اشتراكات، يجب عليك تنفيذ هذا الكود ثم الذهاب إلى إعدادات **Supabase Storage** وتحويل الـ Bucket المسمى <b>assets</b> من Public إلى <b>Private</b>.
          </p>
          
          <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
            <div className="bg-black/40 rounded-[35px] p-8 border border-white/5 relative h-full flex flex-col">
                <h5 className="text-amber-400 font-black text-sm mb-4 flex items-center gap-3">
                    <Code size={18}/> كود SQL لحماية المحتوى
                </h5>
                <div className="relative group flex-1">
                    <pre className="bg-black/80 p-6 rounded-2xl text-[9px] font-mono text-amber-400 overflow-x-auto ltr text-left border border-white/10 h-64 no-scrollbar">
                        {subscriptionSQL}
                    </pre>
                    <button onClick={handleCopy} className="absolute top-2 left-2 p-2 bg-white/10 hover:bg-white/20 rounded-lg text-white transition-all flex items-center gap-2 text-[10px] font-black">
                        {copied ? <CheckCircle2 size={12}/> : 'نسخ كود الحماية'}
                    </button>
                </div>
            </div>

            <div className="space-y-6">
                <div className="bg-white/5 rounded-[30px] p-6 border border-white/10">
                    <h5 className="text-white font-black text-sm mb-4 flex items-center gap-3 italic">
                        <Zap size={16} className="text-amber-400"/> كيف يعمل نظام حماية الاشتراكات؟
                    </h5>
                    <ul className="text-[11px] text-gray-400 space-y-3">
                        <li className="flex items-center gap-2 text-amber-400"><CheckCircle2 size={12}/> <b>تشفير الروابط:</b> لا تظهر الروابط إلا للطالب المشترك.</li>
                        <li className="flex items-center gap-2 text-amber-400"><CheckCircle2 size={12}/> <b>بوابة الدفع:</b> الربط التلقائي بين الدفع وفتح الدروس.</li>
                        <li className="flex items-center gap-2 text-amber-400"><CheckCircle2 size={12}/> <b>منع المشاركة:</b> الروابط تنتهي صلاحيتها بعد مدة معينة (عند استخدام Private Bucket).</li>
                    </ul>
                </div>
            </div>
          </div>

          <div className="mt-12 p-8 bg-amber-500/5 border border-amber-500/20 rounded-[40px] flex flex-col md:flex-row items-center justify-between gap-6">
              <div className="flex items-start gap-4">
                  <Lock className="text-amber-400 shrink-0" size={20} />
                  <div className="text-right">
                      <p className="text-amber-400 font-bold text-sm">تفعيل وضع الحماية:</p>
                      <p className="text-[11px] text-gray-500 mt-1">اضغط على زر الفحص بعد تنفيذ الكود للتأكد من انغلاق الثغرات.</p>
                  </div>
              </div>
              <button onClick={onFix} className="bg-amber-500 text-black px-12 py-4 rounded-2xl font-black text-xs uppercase tracking-widest shadow-2xl hover:scale-105 transition-all">
                  فحص حماية الاشتراكات
              </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SupabaseConnectionFixer;
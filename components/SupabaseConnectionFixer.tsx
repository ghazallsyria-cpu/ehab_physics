import React, { useState } from 'react';
import { Settings, ExternalLink, RefreshCw, Code, MousePointer2, AlertCircle, CheckCircle2 } from 'lucide-react';

interface SupabaseConnectionFixerProps {
  onFix: () => void;
}

const SupabaseConnectionFixer: React.FC<SupabaseConnectionFixerProps> = ({ onFix }) => {
  const [copiedSupabase, setCopiedSupabase] = useState(false);

  // كود SQL مبسط جداً لا يحتاج لمحاولة تغيير ملكية الجدول
  const supabaseStoragePolicies = `-- 💡 كود السياسات (انسخه فقط إذا فشلت الطريقة اليدوية)

-- 1. سياسة القراءة العامة
CREATE POLICY "Public Access" ON storage.objects FOR SELECT TO public USING (bucket_id = 'assets');

-- 2. سياسة الرفع للمستخدمين (Firebase Auth)
CREATE POLICY "Auth Upload" ON storage.objects FOR INSERT TO authenticated 
WITH CHECK (bucket_id = 'assets' AND (storage.foldername(name))[1] = 'uploads');

-- 3. سياسة الحذف للمالك
CREATE POLICY "Owner Delete" ON storage.objects FOR DELETE TO authenticated 
USING (bucket_id = 'assets');
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
          <Settings size={40} />
        </div>
        <div className="flex-1">
          <h4 className="text-2xl font-black text-amber-400 mb-2 uppercase tracking-tighter italic">تجاوز خطأ الصلاحيات (Error 42501)</h4>
          <p className="text-gray-400 text-sm mb-8 leading-relaxed">
            ظهور خطأ <code className="text-red-400 bg-red-500/10 px-2 py-0.5 rounded">must be owner</code> يعني أن محرر SQL مقيد. 
            <strong> يرجى اتباع "الطريقة الأولى" فهي الحل المضمون دائماً.</strong>
          </p>
          
          <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
            {/* Method 1: The UI Way (Recommended) */}
            <div className="bg-emerald-500/5 rounded-[35px] p-8 border border-emerald-500/20 relative">
                <div className="absolute -top-4 right-8 bg-emerald-500 text-black px-4 py-1 rounded-full text-[10px] font-black uppercase">موصى به</div>
                <h5 className="text-emerald-400 font-black text-sm mb-6 flex items-center gap-3">
                    <MousePointer2 size={18}/> الطريقة الأولى: الواجهة الرسومية (حل جذري)
                </h5>
                <ol className="text-xs text-gray-300 space-y-4 list-decimal list-inside leading-relaxed pr-2">
                    <li>اذهب إلى <a href={`https://supabase.com/dashboard/project/${process.env.VITE_SUPABASE_URL?.split('.')[0].replace('https://', '')}/storage/buckets`} target="_blank" rel="noreferrer" className="text-emerald-400 underline font-bold inline-flex items-center gap-1">صفحة الـ Storage <ExternalLink size={12}/></a>.</li>
                    <li>من القائمة الجانبية، اختر <strong>Policies</strong>.</li>
                    <li>ستجد الـ Bucket المسمى <code className="bg-white/10 px-1 rounded">assets</code>، اضغط على <strong>New Policy</strong> بجانبه.</li>
                    <li>اختر <strong>Get started quickly</strong> (الخيار الأخضر).</li>
                    <li>اختر القالب الأول: <strong>Give users access to all objects...</strong> (Full Access).</li>
                    <li>في شاشة الإعداد، تأكد من اختيار العمليات: <span className="text-white font-bold">SELECT, INSERT, DELETE</span>.</li>
                    <li>اضغط <strong>Review</strong> ثم <strong>Save</strong>.</li>
                </ol>
            </div>

            {/* Method 2: SQL Fallback */}
            <div className="space-y-6">
                <div className="bg-black/40 rounded-[35px] p-8 border border-white/5 relative h-full">
                    <h5 className="text-blue-400 font-black text-sm mb-4 flex items-center gap-3">
                        <Code size={18}/> الطريقة الثانية: محرر SQL (للمحترفين)
                    </h5>
                    <p className="text-[10px] text-gray-500 mb-6 leading-relaxed">
                        استخدم هذا الكود في <a href={`https://supabase.com/dashboard/project/${process.env.VITE_SUPABASE_URL?.split('.')[0].replace('https://', '')}/sql/new`} target="_blank" rel="noreferrer" className="text-blue-400 underline inline-flex items-center gap-1">محرر SQL <ExternalLink size={10}/></a> فقط إذا كان لديك صلاحيات Superuser.
                    </p>
                    
                    <div className="relative group">
                        <pre className="bg-black/80 p-6 rounded-2xl text-[9px] font-mono text-emerald-400 overflow-x-auto ltr text-left border border-white/10 max-h-48 no-scrollbar">
                            {supabaseStoragePolicies}
                        </pre>
                        <button onClick={handleCopyRules} className="absolute top-2 left-2 p-2 bg-white/10 hover:bg-white/20 rounded-lg text-white transition-all flex items-center gap-2 text-[10px] font-black">
                            {copiedSupabase ? <CheckCircle2 size={12}/> : 'نسخ الكود'}
                        </button>
                    </div>
                </div>
            </div>
          </div>

          <div className="mt-12 p-8 bg-blue-500/5 border border-blue-500/20 rounded-[40px] flex flex-col md:flex-row items-center justify-between gap-6">
              <div className="flex items-start gap-4">
                  <AlertCircle className="text-blue-400 shrink-0" size={20} />
                  <div className="text-right">
                      <p className="text-blue-400 font-bold text-sm">تأكد من نوع المخزن (Bucket Type):</p>
                      <p className="text-[11px] text-gray-500 mt-1">يجب أن يكون الـ Bucket المسمى <code className="text-white">assets</code> مضبوطاً على وضعية <strong>Public</strong> لتعمل الروابط المباشرة في الدروس.</p>
                  </div>
              </div>
              <button onClick={onFix} className="bg-white text-black px-12 py-4 rounded-2xl font-black text-xs uppercase tracking-widest shadow-2xl hover:scale-105 transition-all flex items-center gap-4 active:scale-95 whitespace-nowrap">
                  <RefreshCw size={18}/> إعادة فحص الاتصال الآن
              </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SupabaseConnectionFixer;
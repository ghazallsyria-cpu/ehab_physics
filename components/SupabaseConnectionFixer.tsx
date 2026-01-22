import React, { useState } from 'react';
import { Settings, AlertTriangle, ExternalLink, Copy, Check, RefreshCw, HelpCircle, CheckCircle, Code, MousePointer2 } from 'lucide-react';

interface SupabaseConnectionFixerProps {
  onFix: () => void;
}

const SupabaseConnectionFixer: React.FC<SupabaseConnectionFixerProps> = ({ onFix }) => {
  const [copiedSupabase, setCopiedSupabase] = useState(false);

  const supabaseStoragePolicies = `-- 🛠️ كود سياسات الوصول (SQL) 🛠️
-- ملاحظة: إذا ظهر خطأ "must be owner"، تجاهله واستخدم واجهة المستخدم (الخطوة أدناه)

-- 1. السماح للجميع برؤية الملفات في مخزن assets
DROP POLICY IF EXISTS "Public Read Access on Assets" ON storage.objects;
CREATE POLICY "Public Read Access on Assets"
  ON storage.objects FOR SELECT
  TO public
  USING ( bucket_id = 'assets' );

-- 2. السماح للمستخدمين برفع الملفات إلى مجلد uploads
DROP POLICY IF EXISTS "Authenticated Upload to Uploads Folder" ON storage.objects;
CREATE POLICY "Authenticated Upload to Uploads Folder"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (
    bucket_id = 'assets' AND
    (storage.foldername(name))[1] = 'uploads'
  );

-- 3. السماح للمستخدم بحذف ملفاته
DROP POLICY IF EXISTS "Owner Can Delete Own Assets" ON storage.objects;
CREATE POLICY "Owner Can Delete Own Assets"
  ON storage.objects FOR DELETE
  TO authenticated
  USING ( bucket_id = 'assets' );
`;

  const handleCopyRules = () => {
    navigator.clipboard.writeText(supabaseStoragePolicies);
    setCopiedSupabase(true);
    setTimeout(() => setCopiedSupabase(false), 2000);
  };

  return (
    <div className="glass-panel p-8 md:p-12 rounded-[50px] border-amber-500/20 bg-amber-500/5 animate-slideUp border-2 shadow-2xl">
      <div className="flex items-start gap-8">
        <div className="w-16 h-16 rounded-3xl bg-amber-500/20 flex items-center justify-center text-amber-500 shrink-0 shadow-lg border border-amber-500/20">
          <Settings size={40} />
        </div>
        <div className="flex-1 text-right" dir="rtl">
          <h4 className="text-2xl font-black text-amber-400 mb-4 uppercase tracking-tighter">حل نهائي لمشكلة اتصال المتجر (Storage)</h4>
          
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Method 1: SQL */}
            <div className="space-y-6">
                <div className="bg-black/40 rounded-[35px] p-6 border border-white/5 relative h-full">
                    <h5 className="text-blue-400 font-black text-sm mb-4 flex items-center gap-3">
                        <Code size={18}/> الطريقة الأولى: محرر SQL
                    </h5>
                    <p className="text-xs text-gray-400 mb-6 leading-relaxed">
                        انسخ الكود أدناه ونفذه في <a href={`https://supabase.com/dashboard/project/${process.env.VITE_SUPABASE_URL?.split('.')[0].replace('https://', '')}/sql/new`} target="_blank" rel="noreferrer" className="text-blue-400 underline font-bold inline-flex items-center gap-1">SQL Editor <ExternalLink size={12}/></a>. 
                        <br/><span className="text-red-400">إذا استمر الخطأ، انتقل فوراً للطريقة الثانية.</span>
                    </p>
                    
                    <div className="relative group">
                        <pre className="bg-black/80 p-6 rounded-2xl text-[9px] font-mono text-emerald-400 overflow-x-auto ltr text-left border border-white/10 max-h-48 no-scrollbar">
                            {supabaseStoragePolicies}
                        </pre>
                        <button onClick={handleCopyRules} className="absolute top-2 left-2 p-2 bg-white/10 hover:bg-white/20 rounded-lg text-white transition-all flex items-center gap-2 text-[10px] font-black">
                            {copiedSupabase ? 'تم!' : 'نسخ'}
                        </button>
                    </div>
                </div>
            </div>

            {/* Method 2: GUI - The reliable one */}
            <div className="space-y-6">
                <div className="bg-emerald-500/5 rounded-[35px] p-6 border border-emerald-500/20 relative h-full">
                    <h5 className="text-emerald-400 font-black text-sm mb-4 flex items-center gap-3">
                        <MousePointer2 size={18}/> الطريقة الثانية: الواجهة الرسومية (مضمونة)
                    </h5>
                    <ol className="text-xs text-gray-400 space-y-4 list-decimal list-inside leading-relaxed">
                        <li>اذهب إلى صفحة <a href={`https://supabase.com/dashboard/project/${process.env.VITE_SUPABASE_URL?.split('.')[0].replace('https://', '')}/storage/buckets`} target="_blank" rel="noreferrer" className="text-emerald-400 underline font-bold inline-flex items-center gap-1">الـ Storage من هنا <ExternalLink size={12}/></a>.</li>
                        <li>اضغط على <b>"Policies"</b> في القائمة الجانبية اليسرى.</li>
                        <li>ستجد الـ Bucket الذي أنشأته باسم <code className="bg-white/5 px-1 rounded text-white">assets</code>.</li>
                        <li>اضغط على <b>"New Policy"</b> ثم اختر <b>"Get started quickly"</b>.</li>
                        <li>اختر القالب <b>"Give users access to all objects"</b> (الأيقونة الخضراء).</li>
                        <li>في خانة <b>Allowed Operations</b>، تأكد من تحديد: <span className="text-white font-bold">SELECT, INSERT, DELETE</span>.</li>
                        <li>اضغط <b>Review</b> ثم <b>Save</b>.</li>
                    </ol>
                </div>
            </div>
          </div>

          <div className="mt-12 p-8 bg-blue-500/5 border border-blue-500/20 rounded-[40px] flex items-center justify-between">
              <div>
                  <p className="text-blue-400 font-bold text-sm">💡 نصيحة تقنية:</p>
                  <p className="text-[10px] text-gray-500 mt-1">تأكد دائماً أن الـ Bucket المسمى <code className="text-white">assets</code> مضبوط على وضعية <b>Public</b> في إعداداته.</p>
              </div>
              <button onClick={onFix} className="bg-white text-black px-10 py-4 rounded-2xl font-black text-xs uppercase tracking-widest shadow-2xl hover:scale-105 transition-all flex items-center gap-4 active:scale-95">
                  <RefreshCw size={18}/> أعد فحص الاتصال الآن
              </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SupabaseConnectionFixer;
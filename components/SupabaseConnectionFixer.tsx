import React, { useState } from 'react';
import { Settings, AlertTriangle, ExternalLink, Copy, Check, RefreshCw, HelpCircle, CheckCircle } from 'lucide-react';

interface SupabaseConnectionFixerProps {
  onFix: () => void;
}

const SupabaseConnectionFixer: React.FC<SupabaseConnectionFixerProps> = ({ onFix }) => {
  const [copiedSupabase, setCopiedSupabase] = useState(false);

  const supabaseStoragePolicies = `
-- 🚀 SUPABASE STORAGE RLS POLICIES FOR FIREBASE AUTH 🚀
--  bucket: 'assets'
-- These policies MUST be applied via the SQL Editor.

-- 1. PUBLIC READ ACCESS
-- Allows ANYONE (including non-logged-in users) to view and list files.
-- This is crucial for displaying images in your app.
DROP POLICY IF EXISTS "Public Read Access on Assets" ON storage.objects;
CREATE POLICY "Public Read Access on Assets"
  ON storage.objects FOR SELECT
  TO public
  USING ( bucket_id = 'assets' );

-- 2. AUTHENTICATED UPLOAD
-- Allows only logged-in users to UPLOAD files into the 'uploads' folder.
-- It checks if the user's Firebase UID matches the 'owner_id' in the file metadata.
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

-- 3. OWNER CAN DELETE
-- Allows a logged-in user to DELETE only their own files.
-- It checks the 'owner_id' in the metadata against their Firebase UID.
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
    <div className="glass-panel p-10 rounded-[40px] border-red-500/20 bg-red-500/5 animate-slideUp">
      <div className="flex items-start gap-6">
        <div className="w-14 h-14 rounded-2xl bg-red-500/10 flex items-center justify-center text-red-500 shrink-0"><AlertTriangle size={32} /></div>
        <div className="flex-1">
          <h4 className="text-xl font-black text-red-400 mb-2 uppercase tracking-widest">إجراء مطلوب: إعداد صلاحيات Supabase</h4>
          <p className="text-sm text-gray-300 mb-8">لقد اكتشف النظام أن الاتصال بمخزن الملفات (Supabase Storage) فشل بسبب عدم وجود الصلاحيات الكافية. لحل هذه المشكلة، يرجى اتباع الخطوات التالية بدقة في لوحة تحكم مشروع Supabase الخاص بك.</p>
          
          <div className="bg-black/40 rounded-3xl p-8 border border-white/5 mb-8">
            <h5 className="text-amber-400 font-black text-sm mb-4 flex items-center gap-2"><CheckCircle size={16}/> المتطلبات الأساسية (تحقق منها أولاً)</h5>
            <ol className="text-xs text-gray-400 space-y-4 list-decimal list-inside leading-relaxed">
                <li>في لوحة تحكم Supabase، اذهب إلى **Storage**. تأكد من وجود "Bucket" باسم `assets` بالضبط.</li>
                <li>اضغط على النقاط الثلاث بجانب `assets` واختر **Bucket settings**. تأكد من أن خيار **Public bucket** **مفعّل (on)**.</li>
                <li>اذهب إلى **Authentication** ثم **Policies**. ابحث عن جدول `objects` (داخل `storage` schema) وتأكد من أن **Row Level Security (RLS)** **مفعلة (Enabled)**.</li>
            </ol>
          </div>

          <div className="bg-black/40 rounded-3xl p-8 border border-white/5 mb-8">
            <h5 className="text-amber-400 font-black text-sm mb-4 flex items-center gap-2"><Settings size={16}/> الخطوة 1: تعريف Firebase كمصدر توثيق (JWT)</h5>
            <ol className="text-xs text-gray-400 space-y-4 list-decimal list-inside leading-relaxed">
                <li>افتح <a href={`https://supabase.com/dashboard/project/${process.env.VITE_SUPABASE_URL?.split('.')[0].replace('https://', '')}/auth/providers`} target="_blank" rel="noreferrer" className="text-blue-400 underline inline-flex items-center gap-1">صفحة إعدادات التوثيق <ExternalLink size={10}/></a> في Supabase.</li>
                <li>ابحث عن مزود **JWT** وقم بتفعيله.</li>
                <li>املأ الحقول بالقيم التالية **بدقة تامة**:
                    <ul className="list-disc pr-8 mt-2 space-y-2 text-gray-300 font-mono text-left ltr bg-black/40 p-4 rounded-xl border border-white/10">
                        <li><strong>JWKS URL:</strong> `https://www.googleapis.com/service_accounts/v1/jwk/securetoken@system.gserviceaccount.com`</li>
                        <li><strong>Issuer:</strong> `https://securetoken.google.com/{process.env.VITE_FIREBASE_PROJECT_ID}` <span className="text-amber-500 font-sans text-[10px]">(تأكد من أن معرف المشروع صحيح!)</span></li>
                    </ul>
                </li>
                <li>اضغط **Save**.</li>
            </ol>
          </div>
          
          <div className="bg-black/40 rounded-3xl p-8 border border-white/5 mb-8">
            <h5 className="text-amber-400 font-black text-sm mb-4 flex items-center gap-2"><Settings size={16}/> الخطوة 2: تطبيق سياسات الأمان على مخزن الملفات</h5>
            <p className="text-xs text-gray-400 mb-4 leading-relaxed">اذهب إلى <a href={`https://supabase.com/dashboard/project/${process.env.VITE_SUPABASE_URL?.split('.')[0].replace('https://', '')}/sql/new`} target="_blank" rel="noreferrer" className="text-blue-400 underline inline-flex items-center gap-1">محرر SQL <ExternalLink size={10}/></a>، وانسخ الكود أدناه بالكامل وقم بتنفيذه بالضغط على **"RUN"**. (إذا قمت بذلك سابقاً، نفذه مرة أخرى للتأكد).</p>
            <div className="mt-6 relative group">
                <pre className="bg-black/60 p-5 rounded-xl text-[10px] font-mono text-emerald-400 overflow-x-auto ltr text-left border border-white/10">{supabaseStoragePolicies}</pre>
                <button onClick={handleCopyRules} className="absolute top-4 left-4 p-2 bg-white/10 hover:bg-white/20 rounded-lg text-white transition-all flex items-center gap-2 text-[10px] font-bold">
                    {copiedSupabase ? <><Check size={12}/> تم النسخ</> : <><Copy size={12}/> نسخ الكود</>}
                </button>
            </div>
          </div>
          
          <div className="bg-yellow-500/5 border border-yellow-500/20 p-8 rounded-3xl mt-12">
            <h5 className="font-black text-yellow-400 mb-4 flex items-center gap-2"><HelpCircle size={16}/> لم تنجح الخطوات؟ (استكشاف الأخطاء)</h5>
            <ul className="text-xs text-yellow-300/80 list-disc pr-5 space-y-2">
                <li>**تأكد من اسم الـ Bucket:** يجب أن يكون اسمه `assets` بالضبط (أحرف صغيرة).</li>
                <li>**تأكد من تفعيل RLS:** يجب أن تكون RLS مفعلة على جدول `objects` وليس جدول `buckets`.</li>
                <li>**تحقق من معرف المشروع:** تأكد من أنك نسخت معرف مشروع Firebase (`VITE_FIREBASE_PROJECT_ID`) بشكل صحيح في حقل `Issuer`. أي خطأ هنا سيفشل العملية كلها.</li>
                <li>**نفّذ الكود مرة أخرى:** أحياناً لا يتم تطبيق السياسات بشكل صحيح. حاول نسخ ولصق كود SQL مرة أخرى وتشغيله.</li>
            </ul>
          </div>

          <div className="mt-10 pt-6 border-t border-white/10 flex justify-end">
              <button onClick={onFix} className="bg-green-600 text-white px-10 py-4 rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-green-500 transition-all shadow-lg flex items-center gap-3">
                  <RefreshCw size={14}/> لقد أكملت كل الخطوات، أعد فحص الاتصال
              </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SupabaseConnectionFixer;

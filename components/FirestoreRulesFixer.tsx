
import React, { useState } from 'react';
import { ShieldCheck, Code, CheckCircle2, Copy, Lock, AlertTriangle, FileCode } from 'lucide-react';

const FirestoreRulesFixer: React.FC = () => {
    const [copied, setCopied] = useState(false);

    const firestoreRules = `rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    
    // 1. صلاحيات جدول المستخدمين
    match /users/{userId} {
      allow read: if request.auth != null;
      allow write: if request.auth != null && request.auth.uid == userId;
    }
    
    // 2. صلاحيات جدول المنشورات (FIX: تمكين الطلاب من النشر)
    match /forumPosts/{postId} {
      allow read: if request.auth != null;
      allow create: if request.auth != null; // يسمح لأي طالب مسجل بالنشر
      allow update, delete: if request.auth != null && (request.auth.uid == resource.data.authorUid || get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role == 'admin');
    }
    
    // 3. صلاحيات جدول الأقسام
    match /forumSections/{sectionId} {
      allow read: if request.auth != null;
      allow write: if request.auth != null && get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role == 'admin';
    }
    
    // 4. بقية الجداول
    match /{document=**} {
      allow read: if request.auth != null;
      allow write: if request.auth != null && get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role == 'admin';
    }
  }
}`;

    const handleCopy = () => {
        navigator.clipboard.writeText(firestoreRules);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    return (
        <div className="max-w-4xl mx-auto py-12 animate-fadeIn font-['Tajawal'] text-right" dir="rtl">
            <header className="mb-12 border-r-4 border-red-500 pr-8">
                <h2 className="text-4xl font-black text-white flex items-center gap-4">
                    <Lock className="text-red-500" /> مركز <span className="text-red-500">الأمان وتفعيل الجداول</span>
                </h2>
                <p className="text-gray-500 mt-2">حل مشكلة "عدم قدرة الطالب على النشر" عبر تحديث قواعد Firebase.</p>
            </header>

            <div className="glass-panel p-10 rounded-[60px] border-white/5 bg-black/40 space-y-8">
                <div className="bg-red-500/10 border border-red-500/20 p-6 rounded-3xl flex items-start gap-4">
                    <AlertTriangle className="text-red-500 shrink-0" size={24} />
                    <div className="text-sm leading-relaxed">
                        <p className="text-white font-bold mb-2">لماذا لا يستطيع الطالب النشر؟</p>
                        <p className="text-gray-400 italic">بشكل افتراضي، Firebase تغلق كافة الجداول (Collections) للحماية. يجب عليك نسخ القواعد أدناه ولصقها في وحدة تحكم Firebase لكي يتمكن الطلاب من إضافة منشورات في جدول <code className="text-red-400">forumPosts</code>.</p>
                    </div>
                </div>

                <div className="space-y-4">
                    <div className="flex justify-between items-center">
                        <h3 className="text-lg font-black text-white flex items-center gap-2"><FileCode size={18} className="text-blue-400"/> قواعد Firestore المقترحة</h3>
                        <button onClick={handleCopy} className="flex items-center gap-2 bg-blue-600 text-white px-6 py-2 rounded-xl text-xs font-black hover:bg-blue-500 transition-all shadow-lg">
                            {copied ? <CheckCircle2 size={16}/> : <Copy size={16}/>} {copied ? 'تم النسخ!' : 'نسخ الكود'}
                        </button>
                    </div>
                    <div className="relative">
                        <pre className="bg-black/60 p-8 rounded-[40px] text-[11px] font-mono text-emerald-400 overflow-x-auto ltr text-left border border-white/10 h-96 no-scrollbar shadow-inner">
                            {firestoreRules}
                        </pre>
                    </div>
                </div>

                <div className="pt-8 border-t border-white/5">
                    <h4 className="text-white font-bold mb-4">خطوات التنفيذ:</h4>
                    <ol className="list-decimal list-inside space-y-3 text-sm text-gray-500 pr-4">
                        <li>اذهب إلى <a href="https://console.firebase.google.com/" target="_blank" className="text-blue-400 underline">Firebase Console</a>.</li>
                        <li>اختر مشروعك الحالي (Physics Kuwait).</li>
                        <li>من القائمة الجانبية، اختر <span className="text-white font-bold">Firestore Database</span>.</li>
                        <li>اضغط على تبويب <span className="text-white font-bold">Rules</span> في الأعلى.</li>
                        <li>احذف كل شيء هناك، ثم الصق الكود الذي نسخته أعلاه.</li>
                        <li>اضغط على زر <span className="bg-blue-600 text-white px-3 py-1 rounded text-xs">Publish</span>.</li>
                    </ol>
                </div>
            </div>
        </div>
    );
};

export default FirestoreRulesFixer;


import React, { useState } from 'react';
import { ShieldCheck, Code, CheckCircle2, Copy, Lock, Info, ShieldAlert } from 'lucide-react';

const FirestoreRulesFixer: React.FC = () => {
    const [copied, setCopied] = useState(false);

    const firestoreRules = `rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    
    // دالة الإدارة - تُستخدم للتحقق من الرتبة في قاعدة البيانات
    function isAdmin() {
      return request.auth != null && 
             exists(/databases/$(database)/documents/users/$(request.auth.uid)) &&
             get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role == 'admin';
    }

    // 1. المناهج (Curriculum): السماح بالقراءة للكل، والكتابة والحذف للمدير فقط
    match /curriculum/{docId} {
      allow read: if true; 
      allow write, delete: if isAdmin();
    }

    // 2. الساحة (Forum): فك قيود الإنشاء والحذف
    match /forumPosts/{postId} {
      allow read: if true;
      allow create: if request.auth != null;
      allow update, delete: if request.auth != null && (request.auth.uid == resource.data.authorUid || isAdmin());
    }
    
    match /forumSections/{sectionId} {
      allow read: if true;
      allow write, delete: if isAdmin();
    }

    // 3. سجلات المستخدمين
    match /users/{userId} {
      allow read: if request.auth != null;
      allow write: if request.auth != null && (request.auth.uid == userId || isAdmin());
      allow delete: if isAdmin();
    }
    
    // 4. الصلاحيات العامة لبقية الجداول (الاختبارات، الإشعارات، إلخ)
    match /{document=**} {
      allow read: if request.auth != null;
      allow write, delete: if isAdmin();
    }
  }
}`;

    const handleCopy = (text: string) => {
        navigator.clipboard.writeText(text);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    return (
        <div className="max-w-4xl mx-auto py-12 animate-fadeIn font-['Tajawal'] text-right" dir="rtl">
            <header className="mb-12 border-r-4 border-blue-500 pr-8">
                <h2 className="text-4xl font-black text-white flex items-center gap-4">
                    <ShieldCheck className="text-blue-400" /> مركز <span className="text-blue-400">الإصلاح الشامل V7</span>
                </h2>
                <p className="text-gray-500 mt-2 font-medium">قم بتحديث قواعد Firestore لتمكين خاصية الحذف للمدراء.</p>
            </header>

            <div className="space-y-8">
                <div className="bg-amber-500/10 border-2 border-amber-500/30 p-8 rounded-[40px] flex items-start gap-6">
                    <ShieldAlert className="text-amber-500 shrink-0" size={32} />
                    <div className="text-sm leading-relaxed text-gray-300">
                        <p className="text-white font-black mb-2 text-lg">لماذا فشل الحذف؟</p>
                        <p>بشكل افتراضي، يمنع Firebase أي عملية حذف (Delete) ما لم يتم ذكرها صراحة في القواعد. الكود أدناه يضيف صلاحية `delete: if isAdmin()` لكافة أقسام المنهج.</p>
                    </div>
                </div>

                <div className="glass-panel p-10 rounded-[60px] border-white/5 bg-black/40 relative">
                    <div className="flex justify-between items-center mb-6">
                        <h3 className="text-lg font-black text-white flex items-center gap-2"><Code size={18} className="text-blue-400"/> كود القواعد V7 (انسخه الآن)</h3>
                        <button onClick={() => handleCopy(firestoreRules)} className="flex items-center gap-2 bg-blue-600 text-white px-8 py-3 rounded-2xl text-xs font-black hover:bg-blue-500 transition-all shadow-xl">
                            {copied ? 'تم النسخ ✓' : 'نسخ الكود المحدث'}
                        </button>
                    </div>
                    <pre className="bg-black/60 p-8 rounded-[40px] text-[10px] font-mono text-emerald-400 overflow-x-auto ltr text-left border border-white/10 h-80 no-scrollbar">
                        {firestoreRules}
                    </pre>
                </div>

                <div className="p-8 bg-blue-500/10 border border-blue-500/20 rounded-[40px] flex items-start gap-4">
                    <Info className="text-blue-400" size={24} />
                    <p className="text-xs text-gray-400 leading-relaxed italic">ملاحظة: بعد لصق الكود في Firebase Console والضغط على **Publish**، قد تستغرق التغييرات ما يصل إلى دقيقة واحدة لتصبح فعالة تماماً.</p>
                </div>
            </div>
        </div>
    );
};

export default FirestoreRulesFixer;

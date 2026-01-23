
import React, { useState } from 'react';
import { ShieldCheck, Code, CheckCircle2, Copy, Lock, AlertTriangle, FileCode, Zap, Info } from 'lucide-react';

const FirestoreRulesFixer: React.FC = () => {
    const [copied, setCopied] = useState(false);

    const firestoreRules = `rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    
    // دالة التحقق من أن المستخدم هو مدير (Admin)
    function isAdmin() {
      return request.auth != null && 
             exists(/databases/$(database)/documents/users/$(request.auth.uid)) &&
             get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role == 'admin';
    }

    // 1. صلاحيات جدول المستخدمين: يسمح للشخص بتعديل بياناته، وللمدير بالتحكم بكل شيء
    match /users/{userId} {
      allow read: if request.auth != null;
      allow write: if request.auth != null && (request.auth.uid == userId || isAdmin());
    }
    
    // 2. صلاحيات جدول المنشورات (تمكين الطلاب من النشر والرد)
    match /forumPosts/{postId} {
      allow read: if request.auth != null;
      allow create: if request.auth != null; 
      allow update, delete: if request.auth != null && (request.auth.uid == resource.data.authorUid || isAdmin());
    }
    
    // 3. صلاحيات الأقسام والاختبارات والمناهج (للمدير فقط)
    match /forumSections/{sectionId} { allow read: if request.auth != null; allow write: if isAdmin(); }
    match /quizzes/{quizId} { allow read: if request.auth != null; allow write: if isAdmin(); }
    match /questions/{qId} { allow read: if request.auth != null; allow write: if isAdmin(); }
    match /curriculum/{cId} { allow read: if request.auth != null; allow write: if isAdmin(); }
    
    // 4. قاعدة عامة لبقية الجداول (الافتراضية)
    match /{document=**} {
      allow read: if request.auth != null;
      allow write: if isAdmin();
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
            <header className="mb-12 border-r-4 border-amber-500 pr-8">
                <h2 className="text-4xl font-black text-white flex items-center gap-4">
                    <ShieldCheck className="text-amber-400" /> مصلح <span className="text-amber-400">قواعد البيانات (V2)</span>
                </h2>
                <p className="text-gray-500 mt-2 font-medium">استخدم هذه القواعد المحدثة لاستعادة السيطرة وتفعيل صلاحيات الطلاب بأمان.</p>
            </header>

            <div className="space-y-8">
                <div className="bg-amber-500/10 border border-amber-500/20 p-8 rounded-[40px] flex items-start gap-6">
                    <AlertTriangle className="text-amber-500 shrink-0" size={32} />
                    <div className="text-sm leading-relaxed text-gray-300">
                        <p className="text-white font-black mb-3 text-lg">⚠️ تنبيه هام للمدير:</p>
                        <p className="mb-4">لكي تعمل هذه القواعد، يجب أن يكون حسابك مسجلاً في جدول <code className="text-amber-400 bg-black/40 px-2 py-0.5 rounded">users</code> مع حقل <code className="text-amber-400 bg-black/40 px-2 py-0.5 rounded">role: "admin"</code>.</p>
                        <p>إذا فقدت القدرة على التحكم، قم بالدخول إلى Firebase Console يدوياً وقم بتغيير الـ role الخاص بحسابك إلى admin.</p>
                    </div>
                </div>

                <div className="glass-panel p-10 rounded-[60px] border-white/5 bg-black/40 space-y-6">
                    <div className="flex justify-between items-center">
                        <h3 className="text-lg font-black text-white flex items-center gap-2"><Code size={18} className="text-blue-400"/> كود القواعد المطور</h3>
                        <button onClick={handleCopy} className="flex items-center gap-2 bg-blue-600 text-white px-8 py-3 rounded-2xl text-xs font-black hover:bg-blue-500 transition-all shadow-xl">
                            {copied ? <CheckCircle2 size={16}/> : <Copy size={16}/>} {copied ? 'تم النسخ' : 'نسخ الكود'}
                        </button>
                    </div>
                    <div className="relative">
                        <pre className="bg-black/60 p-8 rounded-[40px] text-[10px] font-mono text-emerald-400 overflow-x-auto ltr text-left border border-white/10 h-96 no-scrollbar shadow-inner">
                            {firestoreRules}
                        </pre>
                    </div>
                </div>
                
                <div className="p-8 bg-blue-500/5 border border-blue-500/10 rounded-[40px] flex items-start gap-4">
                    <Info className="text-blue-400 shrink-0" size={24} />
                    <div>
                        <h4 className="text-white font-bold mb-2">ما الجديد في هذه القواعد؟</h4>
                        <ul className="text-xs text-gray-500 space-y-2 list-disc pr-4">
                            <li>إضافة دالة <code className="text-blue-400">isAdmin()</code> مركزية لسهولة الصيانة.</li>
                            <li>منع الطلاب من حذف مواضيع غيرهم (الحماية الذاتية).</li>
                            <li>السماح للمدير فقط بالوصول لبيانات المناهج والماليات.</li>
                        </ul>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default FirestoreRulesFixer;


import React, { useState } from 'react';
import { ShieldCheck, Code, CheckCircle2, Copy, Lock, AlertTriangle, FileCode, Zap, Info, ShieldAlert, WifiOff, Check, ExternalLink, AlertCircle } from 'lucide-react';

const FirestoreRulesFixer: React.FC = () => {
    const [copied, setCopied] = useState(false);

    const firestoreRules = `rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    
    // دالة الإدارة - تُستخدم فقط في الحذف والتعديل المتقدم
    function isAdmin() {
      return request.auth != null && 
             exists(/databases/$(database)/documents/users/$(request.auth.uid)) &&
             get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role == 'admin';
    }

    // 1. الساحة (Forum): فك قيود الإنشاء نهائياً
    match /forumPosts/{postId} {
      allow read: if true; // السماح للجميع بالقراءة لرؤية المحتوى
      allow create: if request.auth != null; // أي شخص مسجل دخول حقيقي يمكنه النشر فوراً
      allow update, delete: if request.auth != null && (request.auth.uid == resource.data.authorUid || isAdmin());
    }
    
    match /forumSections/{sectionId} {
      allow read: if true;
      allow write: if isAdmin();
    }

    // 2. سجلات المستخدمين
    match /users/{userId} {
      allow read: if request.auth != null;
      allow write: if request.auth != null && (request.auth.uid == userId || isAdmin());
    }
    
    // 3. الصلاحيات العامة لبقية الجداول
    match /{document=**} {
      allow read: if request.auth != null;
      allow write: if isAdmin();
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
                    <ShieldCheck className="text-blue-400" /> مركز <span className="text-blue-400">الإصلاح الشامل V6</span>
                </h2>
                <p className="text-gray-500 mt-2 font-medium">استخدم هذا الكود إذا كنت تواجه مشكلة في النشر رغم استخدام حساب حقيقي.</p>
            </header>

            <div className="space-y-8">
                <div className="bg-emerald-500/10 border-2 border-emerald-500/30 p-8 rounded-[40px] flex items-start gap-6">
                    <CheckCircle2 className="text-emerald-500 shrink-0" size={32} />
                    <div className="text-sm leading-relaxed text-gray-300">
                        <p className="text-white font-black mb-2 text-lg">مميزات التحديث V6:</p>
                        <ul className="list-disc pr-5 space-y-1">
                            <li>يسمح بالنشر الفوري بمجرد التسجيل.</li>
                            <li>لا يعتمد على وجود مستند للمستخدم في قاعدة البيانات (يمنع خطأ null).</li>
                            <li>يسمح للزوار برؤية المواضيع (Read: if true) لزيادة التفاعل.</li>
                        </ul>
                    </div>
                </div>

                <div className="glass-panel p-10 rounded-[60px] border-white/5 bg-black/40 relative">
                    <div className="flex justify-between items-center mb-6">
                        <h3 className="text-lg font-black text-white flex items-center gap-2"><Code size={18} className="text-blue-400"/> كود القواعد V6 (انسخه الآن)</h3>
                        <button onClick={() => handleCopy(firestoreRules)} className="flex items-center gap-2 bg-blue-600 text-white px-8 py-3 rounded-2xl text-xs font-black hover:bg-blue-500 transition-all shadow-xl">
                            {copied ? <Check size={16}/> : <Copy size={16}/>} {copied ? 'تم النسخ' : 'نسخ الكود'}
                        </button>
                    </div>
                    <pre className="bg-black/60 p-8 rounded-[40px] text-[10px] font-mono text-emerald-400 overflow-x-auto ltr text-left border border-white/10 h-80 no-scrollbar">
                        {firestoreRules}
                    </pre>
                </div>
            </div>
        </div>
    );
};

export default FirestoreRulesFixer;

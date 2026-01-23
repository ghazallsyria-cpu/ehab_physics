
import React, { useState } from 'react';
import { ShieldCheck, Code, CheckCircle2, Copy, Lock, AlertTriangle, FileCode, Zap, Info, ShieldAlert, WifiOff, Check } from 'lucide-react';

const FirestoreRulesFixer: React.FC = () => {
    const [copied, setCopied] = useState(false);
    const [showEmergency, setShowEmergency] = useState(false);

    const firestoreRules = `rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    
    // دالة فحص الإدارة - لا تعطل الوصول إذا لم يوجد المستند
    function isAdmin() {
      return request.auth != null && 
             exists(/databases/$(database)/documents/users/$(request.auth.uid)) &&
             get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role == 'admin';
    }

    // 1. الساحة (Forum): الطالب يحتاج فقط تسجيل دخول للنشر
    match /forumPosts/{postId} {
      allow read: if request.auth != null;
      allow create: if request.auth != null; 
      allow update: if request.auth != null && (request.auth.uid == resource.data.authorUid || isAdmin());
      allow delete: if request.auth != null && (request.auth.uid == resource.data.authorUid || isAdmin());
    }
    
    match /forumSections/{sectionId} {
      allow read: if request.auth != null;
      allow write: if isAdmin();
    }

    // 2. المستخدمين
    match /users/{userId} {
      allow read: if request.auth != null;
      allow write: if request.auth != null && (request.auth.uid == userId || isAdmin());
    }
    
    // 3. بقية النظام
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
            <header className="mb-12 border-r-4 border-emerald-500 pr-8">
                <h2 className="text-4xl font-black text-white flex items-center gap-4">
                    <ShieldCheck className="text-emerald-400" /> مركز <span className="text-emerald-400">إدارة الصلاحيات V3</span>
                </h2>
                <p className="text-gray-500 mt-2 font-medium">استخدم الكود أدناه لفتح صلاحيات النشر للطلاب فوراً.</p>
            </header>

            <div className="space-y-8">
                <div className="bg-emerald-500/10 border-2 border-emerald-500/30 p-8 rounded-[40px] flex items-start gap-6">
                    <Check className="text-emerald-500 shrink-0" size={32} />
                    <div className="text-sm leading-relaxed text-gray-300">
                        <p className="text-white font-black mb-3 text-lg">لماذا لا يستطيع الطالب النشر؟</p>
                        <p className="mb-4">غالباً لأن القاعدة القديمة كانت تحاول التأكد من رتبة الطالب (Role) في كل مرة، وهذا الإصدار (V3) يمنح الطالب حق النشر بمجرد دخوله بالحساب.</p>
                        <p className="text-emerald-400 font-bold">الخطوة المطلوبة: انسخ الكود بالأسفل وضعه في Firebase Console.</p>
                    </div>
                </div>

                <div className="glass-panel p-10 rounded-[60px] border-white/5 bg-black/40 space-y-6">
                    <div className="flex justify-between items-center">
                        <h3 className="text-lg font-black text-white flex items-center gap-2"><Code size={18} className="text-blue-400"/> كود الإصلاح المعتمد (نسخة الساحة)</h3>
                        <button onClick={() => handleCopy(firestoreRules)} className="flex items-center gap-2 bg-emerald-600 text-white px-8 py-3 rounded-2xl text-xs font-black hover:bg-emerald-500 transition-all shadow-xl">
                            {copied ? <CheckCircle2 size={16}/> : <Copy size={16}/>} {copied ? 'تم النسخ' : 'نسخ كود V3'}
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

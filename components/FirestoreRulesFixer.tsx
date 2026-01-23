
import React, { useState } from 'react';
import { ShieldCheck, Code, CheckCircle2, Copy, Lock, AlertTriangle, FileCode, Zap, Info, ShieldAlert, WifiOff } from 'lucide-react';

const FirestoreRulesFixer: React.FC = () => {
    const [copied, setCopied] = useState(false);
    const [showEmergency, setShowEmergency] = useState(false);

    const firestoreRules = `rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    
    // دالة فحص الإدارة - تمنع الخطأ في حال عدم وجود مستند المستخدم
    function isAdmin() {
      return request.auth != null && 
             exists(/databases/$(database)/documents/users/$(request.auth.uid)) &&
             get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role == 'admin';
    }

    // 1. صلاحيات الساحة (Forum): الطالب يحتاج فقط أن يكون مسجلاً للنشر
    match /forumPosts/{postId} {
      allow read: if request.auth != null;
      allow create: if request.auth != null; 
      allow update, delete: if request.auth != null && (request.auth.uid == resource.data.authorUid || isAdmin());
    }
    
    match /forumSections/{sectionId} {
      allow read: if request.auth != null;
      allow write: if isAdmin();
    }

    // 2. صلاحيات المستخدمين: تعديل الملف الشخصي
    match /users/{userId} {
      allow read: if request.auth != null;
      allow write: if request.auth != null && (request.auth.uid == userId || isAdmin());
    }
    
    // 3. بقية الجداول (الاختبارات، المناهج، الإعدادات)
    match /{document=**} {
      allow read: if request.auth != null;
      allow write: if isAdmin();
    }
  }
}`;

    const emergencyRules = `rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /{document=**} {
      allow read, write: if request.auth != null;
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
                    <ShieldCheck className="text-emerald-400" /> مركز <span className="text-emerald-400">إدارة الصلاحيات</span>
                </h2>
                <p className="text-gray-500 mt-2 font-medium">استخدم الكود أدناه لفك القفل عن قاعدة البيانات وتفعيل نشر الطلاب.</p>
            </header>

            <div className="space-y-8">
                <div className="bg-red-500/10 border-2 border-red-500/30 p-8 rounded-[40px] flex items-start gap-6">
                    <ShieldAlert className="text-red-500 shrink-0" size={32} />
                    <div className="text-sm leading-relaxed text-gray-300">
                        <p className="text-white font-black mb-3 text-lg">لماذا يظهر "فقدان اتصال"؟</p>
                        <p className="mb-4">قاعدة البيانات ترفض طلباتك البرمجية لأن القواعد الحالية لا تسمح لك بالوصول. هذا يعطي انطباعاً كاذباً بأن الإنترنت مقطوع.</p>
                        <p className="text-red-400 font-bold">الحل: انسخ الكود أدناه وضعه في Firebase Console ثم اضغط Publish.</p>
                    </div>
                </div>

                <div className="glass-panel p-10 rounded-[60px] border-white/5 bg-black/40 space-y-6">
                    <div className="flex justify-between items-center">
                        <h3 className="text-lg font-black text-white flex items-center gap-2"><Code size={18} className="text-blue-400"/> الكود الأساسي (الموصى به)</h3>
                        <button onClick={() => handleCopy(firestoreRules)} className="flex items-center gap-2 bg-blue-600 text-white px-8 py-3 rounded-2xl text-xs font-black hover:bg-blue-500 transition-all shadow-xl">
                            {copied ? <CheckCircle2 size={16}/> : <Copy size={16}/>} {copied ? 'تم النسخ' : 'نسخ كود الإصلاح'}
                        </button>
                    </div>
                    <pre className="bg-black/60 p-8 rounded-[40px] text-[10px] font-mono text-emerald-400 overflow-x-auto ltr text-left border border-white/10 h-64 shadow-inner">
                        {firestoreRules}
                    </pre>
                </div>

                <button onClick={() => setShowEmergency(!showEmergency)} className="flex items-center gap-2 text-gray-500 hover:text-red-400 text-xs font-bold transition-colors">
                    {showEmergency ? 'إخفاء وضع الطوارئ' : '⚠️ هل لا يزال الاتصال مقطوعاً؟ جرب وضع الطوارئ'}
                </button>

                {showEmergency && (
                    <div className="bg-red-950/20 border-2 border-red-500/40 p-8 rounded-[40px] animate-slideUp">
                        <h4 className="text-red-400 font-black mb-4 flex items-center gap-2"><WifiOff size={18}/> كود الطوارئ (فتح كامل للقاعدة للمسجلين)</h4>
                        <p className="text-xs text-gray-500 mb-6 leading-relaxed">استخدم هذا الكود فقط كحل أخير لتشخيص المشكلة. هو يفتح الصلاحيات لكل مستخدم مسجل دخول.</p>
                        <pre className="bg-black/60 p-6 rounded-2xl text-[10px] font-mono text-red-400 overflow-x-auto ltr text-left border border-red-500/20 mb-6">
                            {emergencyRules}
                        </pre>
                        <button onClick={() => handleCopy(emergencyRules)} className="w-full py-4 bg-red-600 text-white rounded-2xl font-black text-xs uppercase hover:bg-red-500 transition-all">نسخ كود الطوارئ</button>
                    </div>
                )}
            </div>
        </div>
    );
};

export default FirestoreRulesFixer;

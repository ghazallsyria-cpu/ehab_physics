
import React, { useState } from 'react';
import { ShieldCheck, Code, CheckCircle2, Copy, Lock, Info } from 'lucide-react';

const FirestoreRulesFixer: React.FC = () => {
    const [copied, setCopied] = useState(false);

    const firestoreRules = `rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    
    // دالة المدير
    function isAdmin() {
      return request.auth != null && 
             get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role == 'admin';
    }

    // السماح للجميع بقراءة الإعدادات (ضروري لعدم تعطل الواجهة)
    match /settings/{docId} {
      allow read: if true; 
      allow write: if isAdmin();
    }

    // بقية القواعد
    match /invoices/{invoiceId} {
      allow read: if request.auth != null && (request.auth.uid == resource.data.userId || isAdmin());
      allow write: if isAdmin();
    }

    match /users/{userId} {
      allow read: if request.auth != null;
      allow write: if request.auth != null && (request.auth.uid == userId || isAdmin());
    }

    match /{document=**} {
      allow read, write: if isAdmin();
      allow read: if request.auth != null;
      allow create: if request.auth != null;
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
            <header className="mb-12 border-r-4 border-emerald-500 pr-8">
                <h2 className="text-4xl font-black text-white flex items-center gap-4">
                    <ShieldCheck className="text-emerald-400" /> مصلح الصلاحيات <span className="text-emerald-400">V11</span>
                </h2>
                <p className="text-gray-500 mt-2 font-medium">إصلاح شامل لمنع ظهور الصفحات البيضاء (Blank Pages).</p>
            </header>

            <div className="glass-panel p-10 rounded-[60px] border-white/5 bg-black/40 relative shadow-2xl">
                <div className="flex justify-between items-center mb-6">
                    <h3 className="text-lg font-black text-white">كود القواعد المحدث (V11)</h3>
                    <button onClick={handleCopy} className="flex items-center gap-2 bg-emerald-600 text-white px-8 py-3 rounded-2xl text-xs font-black hover:bg-emerald-500 transition-all">
                        {copied ? 'تم النسخ ✓' : 'نسخ الكود'}
                    </button>
                </div>
                <pre className="bg-black/60 p-8 rounded-[40px] text-[10px] font-mono text-emerald-400 overflow-x-auto ltr text-left border border-white/10 h-80 no-scrollbar">
                    {firestoreRules}
                </pre>
            </div>
        </div>
    );
};

export default FirestoreRulesFixer;

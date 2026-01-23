
import React, { useState } from 'react';
import { ShieldCheck, Code, CheckCircle2, Copy, Lock, Info, ShieldAlert } from 'lucide-react';

const FirestoreRulesFixer: React.FC = () => {
    const [copied, setCopied] = useState(false);

    const firestoreRules = `rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    
    // دالة التحقق من رتبة المدير
    function isAdmin() {
      return request.auth != null && 
             get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role == 'admin';
    }

    // 1. الإعدادات العامة (مهم لوضع الصيانة والشعار والدفع)
    match /settings/{docId} {
      allow read: if true; 
      allow write: if isAdmin();
    }

    // 2. الفواتير والعمليات المالية
    match /invoices/{invoiceId} {
      allow read: if request.auth != null && (request.auth.uid == resource.data.userId || isAdmin());
      allow write: if isAdmin();
    }

    // 3. المناهج والدروس
    match /curriculum/{docId} {
      allow read: if true; 
      allow write: if isAdmin();
    }

    // 4. الساحة والمنتديات
    match /forumPosts/{postId} {
      allow read: if true;
      allow create: if request.auth != null;
      allow update, delete: if request.auth != null && (request.auth.uid == resource.data.authorUid || isAdmin());
    }
    
    match /forumSections/{sectionId} {
      allow read: if true;
      allow write: if isAdmin();
    }

    // 5. سجلات المستخدمين
    match /users/{userId} {
      allow read: if request.auth != null;
      allow write: if request.auth != null && (request.auth.uid == userId || isAdmin());
    }
    
    // 6. صلاحيات عامة لبقية الجداول
    match /{document=**} {
      allow read, write: if isAdmin();
      allow read: if request.auth != null;
      allow create: if request.auth != null;
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
                    <ShieldCheck className="text-emerald-400" /> مصلح الصلاحيات <span className="text-emerald-400">V10</span>
                </h2>
                <p className="text-gray-500 mt-2 font-medium">إصلاح شامل لصلاحيات "إدارة الدفع" و "فواتير الطلاب".</p>
            </header>

            <div className="space-y-8">
                <div className="bg-emerald-500/10 border-2 border-emerald-500/30 p-8 rounded-[40px] flex items-start gap-6">
                    <Info className="text-emerald-400 shrink-0" size={32} />
                    <div className="text-sm leading-relaxed text-gray-300">
                        <p className="text-white font-black mb-2 text-lg">ما الجديد في V10؟</p>
                        <p>تم تحرير جدول `settings` بالكامل للسماح للمدير بتعديل أسعار الباقات وشكل الإيصال دون قيود أمنية داخلية، مع الحفاظ على حق القراءة للجميع لتشغيل ميزات الموقع الأساسية.</p>
                    </div>
                </div>

                <div className="glass-panel p-10 rounded-[60px] border-white/5 bg-black/40 relative shadow-2xl">
                    <div className="flex justify-between items-center mb-6">
                        <h3 className="text-lg font-black text-white flex items-center gap-2">كود القواعد المحدث (V10)</h3>
                        <button onClick={() => handleCopy(firestoreRules)} className="flex items-center gap-2 bg-emerald-600 text-white px-8 py-3 rounded-2xl text-xs font-black hover:bg-emerald-500 transition-all shadow-xl">
                            {copied ? 'تم النسخ ✓' : 'نسخ كود الإصلاح الشامل'}
                        </button>
                    </div>
                    <pre className="bg-black/60 p-8 rounded-[40px] text-[10px] font-mono text-emerald-400 overflow-x-auto ltr text-left border border-white/10 h-80 no-scrollbar">
                        {firestoreRules}
                    </pre>
                </div>

                <div className="p-8 bg-blue-500/10 border border-blue-500/20 rounded-[40px]">
                    <p className="text-xs text-gray-400 leading-relaxed italic text-center font-bold">⚠️ تذكر: الصق هذا الكود في Firebase Console {'>'} Firestore {'>'} Rules واضغط Publish ليتم الإصلاح فوراً.</p>
                </div>
            </div>
        </div>
    );
};

export default FirestoreRulesFixer;

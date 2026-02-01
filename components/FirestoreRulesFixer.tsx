import React, { useState } from 'react';
import { ShieldCheck, Code, CheckCircle2, Copy, Lock, Info, AlertTriangle } from 'lucide-react';

const FirestoreRulesFixer: React.FC = () => {
    const [copied, setCopied] = useState(false);

    // هذه القواعد شاملة وتغطي كل الجداول المستخدمة في التطبيق
    const firestoreRules = `rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    
    // --- دوال مساعدة للتحقق من الصلاحيات ---
    function isSignedIn() {
      return request.auth != null;
    }
    
    function isOwner(userId) {
      return isSignedIn() && request.auth.uid == userId;
    }

    function isAdmin() {
      return isSignedIn() && get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role == 'admin';
    }
    
    function isTeacher() {
      return isSignedIn() && get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role == 'teacher';
    }

    // =========================================================
    // 1. المحتوى التعليمي العام (قراءة للكل، كتابة للمدير والمعلم)
    // =========================================================
    
    match /curriculum/{document=**} { 
      allow read: if isSignedIn(); 
      allow write: if isAdmin() || isTeacher(); 
    }
    match /units/{document=**} { 
      allow read: if isSignedIn(); 
      allow write: if isAdmin() || isTeacher(); 
    }
    match /lessons/{document=**} { 
      allow read: if isSignedIn(); 
      allow write: if isAdmin() || isTeacher(); 
    }
    match /experiments/{document=**} { 
      allow read: if isSignedIn(); 
      allow write: if isAdmin() || isTeacher(); 
    }
    match /lesson_scenes/{document=**} { 
      allow read: if isSignedIn(); 
      allow write: if isAdmin() || isTeacher(); 
    }
    
    // =========================================================
    // 2. الاختبارات والأسئلة
    // =========================================================

    match /quizzes/{document=**} { 
      allow read: if isSignedIn(); 
      allow write: if isAdmin() || isTeacher(); 
    }
    match /questions/{document=**} { 
      allow read: if isSignedIn(); 
      allow write: if isAdmin() || isTeacher(); 
    }

    // =========================================================
    // 3. بيانات المستخدمين والتقدم
    // =========================================================

    match /users/{userId} {
      allow read: if isSignedIn(); // السماح بقراءة ملفات المعلمين والطلاب
      allow create: if isSignedIn(); // السماح بالتسجيل
      allow update: if isOwner(userId) || isAdmin(); // تحديث الملف الشخصي
      allow delete: if isAdmin();
      
      match /todos/{todoId} {
         allow read, write: if isOwner(userId);
      }
    }

    match /attempts/{attemptId} {
      // الطالب يقرأ محاولاته، المعلم والمدير يقرأون الكل
      allow read: if isSignedIn() && (resource.data.studentId == request.auth.uid || isAdmin() || isTeacher());
      allow create: if isSignedIn();
      allow update: if isAdmin() || isTeacher(); // للتصحيح اليدوي
    }

    match /student_lesson_progress/{docId} {
       allow read, write: if isSignedIn();
    }
    
    match /student_interaction_events/{docId} {
       allow create: if isSignedIn();
       allow read: if isAdmin() || isTeacher();
    }

    // =========================================================
    // 4. التواصل، المنتدى، والإشعارات
    // =========================================================

    match /forumSections/{document=**} { 
      allow read: if isSignedIn(); 
      allow write: if isAdmin(); 
    }
    
    match /forumPosts/{postId} { 
        allow read: if isSignedIn(); 
        allow create: if isSignedIn();
        // الحذف والتعديل لصاحب المنشور أو المدير
        allow update, delete: if isAdmin() || (isSignedIn() && resource.data.authorUid == request.auth.uid);
    }

    match /notifications/{noteId} {
       allow read: if isSignedIn() && resource.data.userId == request.auth.uid;
       allow write: if isSignedIn(); // السماح للنظام بإنشاء إشعارات
       allow update: if isSignedIn() && resource.data.userId == request.auth.uid; // لتحديث حالة القراءة
    }

    match /teacherMessages/{msgId} {
       allow read, write: if isSignedIn();
    }
    
    match /reviews/{reviewId} {
       allow read: if isSignedIn();
       allow create: if isSignedIn();
    }

    // =========================================================
    // 5. النظام، الإعدادات، والمالية
    // =========================================================

    match /settings/{document=**} {
      allow read: if true; // السماح بقراءة إعدادات الصيانة والهوية للجميع
      allow write: if isAdmin();
    }
    
    match /homePageContent/{document=**} {
      allow read: if true;
      allow write: if isAdmin();
    }
    
    match /stats/{document=**} {
       allow read: if true;
       allow write: if isAdmin() || isTeacher();
    }

    match /invoices/{invoiceId} {
       allow read: if isSignedIn() && (resource.data.userId == request.auth.uid || isAdmin());
       allow write: if isAdmin();
    }
    
    match /liveSessions/{sessionId} {
       allow read: if isSignedIn();
       allow write: if isAdmin() || isTeacher();
    }
    
    match /recommendations/{recId} {
       allow read: if isSignedIn();
       allow write: if isAdmin() || isTeacher();
    }
    
    // قاعدة افتراضية لمنع الوصول لأي شيء آخر غير معرف
    match /{document=**} {
      allow read, write: if false; 
    }
  }
}`;

    const handleCopy = () => {
        navigator.clipboard.writeText(firestoreRules);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    return (
        <div className="max-w-5xl mx-auto py-12 animate-fadeIn font-['Tajawal'] text-right" dir="rtl">
            <header className="mb-12 border-r-4 border-red-500 pr-8 bg-red-500/5 py-6 rounded-l-3xl">
                <h2 className="text-4xl font-black text-white flex items-center gap-4">
                    <ShieldCheck className="text-red-500" size={40} /> إصلاح صلاحيات <span className="text-red-500">قاعدة البيانات</span>
                </h2>
                <p className="text-gray-400 mt-2 font-bold text-lg">هذه الخطوة ضرورية لظهور الدروس والمختبرات والمنتدى.</p>
            </header>

            <div className="glass-panel p-10 rounded-[60px] border-white/5 bg-black/40 relative shadow-2xl">
                <div className="p-8 bg-amber-500/10 border border-amber-500/20 rounded-[40px] mb-10 flex items-start gap-6">
                    <AlertTriangle size={32} className="text-amber-500 shrink-0 mt-1" />
                    <div>
                        <h4 className="font-black text-amber-500 text-xl mb-2">لماذا لا تظهر البيانات؟</h4>
                        <p className="text-gray-300 text-sm leading-relaxed">
                            يقوم Firebase بشكل افتراضي بمنع قراءة البيانات لحماية التطبيق. 
                            الكود الموجود في التطبيق (Client-side) لا يمكنه تغيير هذه القواعد تلقائياً لأسباب أمنية.
                            <br/><br/>
                            <span className="text-white font-bold underline">الحل الوحيد:</span> هو نسخ القواعد الموجودة في الأسفل يدوياً ولصقها في لوحة تحكم Firebase.
                        </p>
                    </div>
                </div>

                <div className="flex justify-between items-center mb-6">
                    <h3 className="text-2xl font-black text-white flex items-center gap-3">
                        <Code size={24} className="text-blue-400"/> القواعد الشاملة (v3.0)
                    </h3>
                    <button 
                        onClick={handleCopy}
                        className="bg-emerald-500 text-black px-8 py-3 rounded-xl font-black text-sm uppercase tracking-widest hover:scale-105 transition-all shadow-lg flex items-center gap-2"
                    >
                        {copied ? <CheckCircle2 size={18}/> : <Copy size={18}/>}
                        {copied ? 'تم النسخ للحافظة' : 'نسخ القواعد'}
                    </button>
                </div>
                
                <div className="relative group">
                    <div className="absolute -inset-1 bg-gradient-to-r from-blue-600 to-purple-600 rounded-3xl blur opacity-20 group-hover:opacity-40 transition duration-1000"></div>
                    <pre className="relative bg-[#0a1118] p-8 rounded-3xl text-[11px] font-mono text-cyan-300 overflow-x-auto ltr text-left border border-white/10 h-[500px] leading-relaxed shadow-inner">
                        {firestoreRules}
                    </pre>
                </div>

                <div className="mt-10 text-center">
                    <p className="text-gray-500 text-xs mb-4">بعد النسخ، اذهب إلى:</p>
                    <div className="inline-flex items-center gap-2 bg-white/5 px-6 py-3 rounded-full text-sm font-bold text-white border border-white/10">
                        Firebase Console <span className="text-gray-600">→</span> Firestore Database <span className="text-gray-600">→</span> Tab: Rules
                    </div>
                </div>
            </div>
        </div>
    );
};

export default FirestoreRulesFixer;
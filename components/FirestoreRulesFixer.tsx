import React, { useState } from 'react';
import { ShieldCheck, Code, CheckCircle2, Copy, Lock, AlertTriangle } from 'lucide-react';

const FirestoreRulesFixer: React.FC = () => {
    const [copied, setCopied] = useState(false);

    // Updated Rules v4.0 - Includes Interactive Lessons & Gamification
    const firestoreRules = `rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    
    // --- Helper Functions ---
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
    function isStaff() {
      return isAdmin() || isTeacher();
    }

    // =========================================================
    // 1. Educational Content (Curriculum, Units, Lessons)
    // =========================================================
    match /curriculum/{document=**} { allow read: if isSignedIn(); allow write: if isStaff(); }
    match /units/{document=**} { allow read: if isSignedIn(); allow write: if isStaff(); }
    match /lessons/{document=**} { allow read: if isSignedIn(); allow write: if isStaff(); }
    match /experiments/{document=**} { allow read: if isSignedIn(); allow write: if isStaff(); }
    
    // =========================================================
    // 2. Interactive Lessons (New System)
    // =========================================================
    match /interactive_lessons/{document=**} { allow read: if isSignedIn(); allow write: if isStaff(); }
    match /interactive_scenes/{document=**} { allow read: if isSignedIn(); allow write: if isStaff(); }
    match /scene_interactions/{document=**} { allow read: if isSignedIn(); allow write: if isStaff(); }
    match /interactive_lesson_categories/{document=**} { allow read: if isSignedIn(); allow write: if isStaff(); }
    
    // Student Progress in Interactive Lessons
    match /interactive_lesson_progress/{docId} {
       allow read: if isSignedIn();
       allow write: if isSignedIn(); // Users save their own progress
    }

    // =========================================================
    // 3. Quizzes & Assessments
    // =========================================================
    match /quizzes/{document=**} { allow read: if isSignedIn(); allow write: if isStaff(); }
    match /questions/{document=**} { allow read: if isSignedIn(); allow write: if isStaff(); }
    
    match /attempts/{attemptId} {
      allow read: if isSignedIn() && (resource.data.studentId == request.auth.uid || isStaff());
      allow create: if isSignedIn();
      allow update: if isStaff(); // Manual grading
    }

    // =========================================================
    // 4. Users & Profiles
    // =========================================================
    match /users/{userId} {
      allow read: if isSignedIn();
      allow create: if isSignedIn();
      allow update: if isOwner(userId) || isAdmin();
      allow delete: if isAdmin();
      
      match /todos/{todoId} { allow read, write: if isOwner(userId); }
    }

    match /student_lesson_progress/{docId} { allow read, write: if isSignedIn(); }
    match /student_interaction_events/{docId} { allow create: if isSignedIn(); allow read: if isStaff(); }

    // =========================================================
    // 5. Gamification & Certificates
    // =========================================================
    match /achievements/{document=**} { allow read: if isSignedIn(); allow write: if isAdmin(); }
    match /certificates/{certId} {
        allow read: if isSignedIn();
        allow write: if isStaff();
    }

    // =========================================================
    // 6. Communication (Forums, Notifications)
    // =========================================================
    match /forumSections/{document=**} { allow read: if isSignedIn(); allow write: if isAdmin(); }
    match /forumPosts/{postId} { 
        allow read: if isSignedIn(); 
        allow create: if isSignedIn();
        allow update, delete: if isStaff() || (isSignedIn() && resource.data.authorUid == request.auth.uid);
    }
    match /notifications/{noteId} {
       allow read: if isSignedIn() && resource.data.userId == request.auth.uid;
       allow write: if isSignedIn(); // System writes
       allow update: if isSignedIn() && resource.data.userId == request.auth.uid;
    }
    match /teacherMessages/{msgId} { allow read, write: if isSignedIn(); }
    match /reviews/{reviewId} { allow read: if isSignedIn(); allow create: if isSignedIn(); }

    // =========================================================
    // 7. System Settings
    // =========================================================
    match /settings/{document=**} { allow read: if true; allow write: if isAdmin(); }
    match /homePageContent/{document=**} { allow read: if true; allow write: if isAdmin(); }
    match /stats/{document=**} { allow read: if true; allow write: if isStaff(); }
    match /invoices/{invoiceId} {
       allow read: if isSignedIn() && (resource.data.userId == request.auth.uid || isAdmin());
       allow write: if isAdmin();
    }
    match /liveSessions/{sessionId} { allow read: if isSignedIn(); allow write: if isStaff(); }
    match /recommendations/{recId} { allow read: if isSignedIn(); allow write: if isStaff(); }
    
    // Default Deny
    match /{document=**} { allow read, write: if false; }
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
                    <ShieldCheck className="text-red-500" size={40} /> قواعد الأمان <span className="text-red-500">v4.0</span>
                </h2>
                <p className="text-gray-400 mt-2 font-bold text-lg">تحديث شامل ليشمل الجداول الجديدة (الدروس التفاعلية، الأوسمة، الشهادات).</p>
            </header>

            <div className="glass-panel p-10 rounded-[60px] border-white/5 bg-black/40 relative shadow-2xl">
                <div className="flex justify-between items-center mb-6">
                    <h3 className="text-2xl font-black text-white flex items-center gap-3">
                        <Code size={24} className="text-blue-400"/> كود القواعد (Firestore Rules)
                    </h3>
                    <button onClick={handleCopy} className="bg-emerald-500 text-black px-8 py-3 rounded-xl font-black text-sm uppercase tracking-widest hover:scale-105 transition-all shadow-lg flex items-center gap-2">
                        {copied ? <CheckCircle2 size={18}/> : <Copy size={18}/>}
                        {copied ? 'تم النسخ' : 'نسخ الكل'}
                    </button>
                </div>
                
                <div className="relative group">
                    <pre className="relative bg-[#0a1118] p-8 rounded-3xl text-[11px] font-mono text-cyan-300 overflow-x-auto ltr text-left border border-white/10 h-[500px] leading-relaxed shadow-inner">
                        {firestoreRules}
                    </pre>
                </div>
            </div>
        </div>
    );
};

export default FirestoreRulesFixer;
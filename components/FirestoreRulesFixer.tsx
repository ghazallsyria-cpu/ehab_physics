import React, { useState } from 'react';
import { ShieldCheck, Code, CheckCircle2, Copy, Lock, AlertTriangle } from 'lucide-react';

const FirestoreRulesFixer: React.FC = () => {
    const [copied, setCopied] = useState(false);

    // Updated Rules v5.0 - Enterprise Level Security
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
    function hasRole(role) {
      return isSignedIn() && get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role == role;
    }
    function isAdmin() {
      return hasRole('admin');
    }
    function isTeacher() {
      return hasRole('teacher');
    }
    function isStaff() {
      return isAdmin() || isTeacher();
    }

    // =========================================================
    // 1. Core Educational Content (Read: All, Write: Staff)
    // =========================================================
    match /curriculum/{document=**} { allow read: if isSignedIn(); allow write: if isStaff(); }
    match /units/{document=**} { allow read: if isSignedIn(); allow write: if isStaff(); }
    match /lessons/{document=**} { allow read: if isSignedIn(); allow write: if isStaff(); }
    match /experiments/{document=**} { allow read: if isSignedIn(); allow write: if isStaff(); }
    match /equations/{document=**} { allow read: if isSignedIn(); allow write: if isStaff(); }
    match /articles/{document=**} { allow read: if isSignedIn(); allow write: if isStaff(); }
    
    // =========================================================
    // 2. Interactive Lessons System (New)
    // =========================================================
    match /interactive_lessons/{document=**} { allow read: if isSignedIn(); allow write: if isStaff(); }
    match /interactive_scenes/{document=**} { allow read: if isSignedIn(); allow write: if isStaff(); }
    match /scene_interactions/{document=**} { allow read: if isSignedIn(); allow write: if isStaff(); }
    match /interactive_lesson_categories/{document=**} { allow read: if isSignedIn(); allow write: if isStaff(); }
    
    // Progress is strictly per user
    match /interactive_lesson_progress/{docId} {
       allow read: if isSignedIn();
       allow write: if isSignedIn() && (docId.matches(request.auth.uid + '_.*'));
    }

    // =========================================================
    // 3. Quizzes & Assessments
    // =========================================================
    match /quizzes/{document=**} { allow read: if isSignedIn(); allow write: if isStaff(); }
    match /questions/{document=**} { allow read: if isSignedIn(); allow write: if isStaff(); }
    
    // Students can create attempts, but only update via system triggers (or limited fields)
    // Teachers can update for manual grading
    match /attempts/{attemptId} {
      allow read: if isSignedIn() && (resource.data.studentId == request.auth.uid || isStaff());
      allow create: if isSignedIn() && request.resource.data.studentId == request.auth.uid;
      allow update: if isStaff(); 
    }

    // =========================================================
    // 4. Users & Profiles
    // =========================================================
    match /users/{userId} {
      allow read: if isSignedIn();
      allow create: if isSignedIn(); // For initial signup
      allow update: if isOwner(userId) || isAdmin(); // Users edit own profile, Admin edits all
      allow delete: if isAdmin();
      
      match /todos/{todoId} { allow read, write: if isOwner(userId); }
    }

    // Analytics Events (Write only for students, Read for staff)
    match /student_interaction_events/{docId} { 
      allow create: if isSignedIn() && request.resource.data.student_id == request.auth.uid;
      allow read: if isStaff(); 
    }

    // =========================================================
    // 5. Gamification & Certificates
    // =========================================================
    match /achievements/{document=**} { allow read: if isSignedIn(); allow write: if isAdmin(); }
    
    // Certificates are issued by system/admin, read by everyone (for verification)
    match /certificates/{certId} {
        allow read: if true; 
        allow write: if isStaff();
    }

    // =========================================================
    // 6. Communication
    // =========================================================
    match /forumSections/{document=**} { allow read: if isSignedIn(); allow write: if isAdmin(); }
    match /forumPosts/{postId} { 
        allow read: if isSignedIn(); 
        allow create: if isSignedIn() && request.resource.data.authorUid == request.auth.uid;
        allow update, delete: if isStaff() || isOwner(resource.data.authorUid);
    }
    match /notifications/{noteId} {
       allow read: if isOwner(resource.data.userId);
       allow write: if isStaff() || (isSignedIn() && request.resource.data.userId == request.auth.uid); // Self-notification allowed
    }
    match /teacherMessages/{msgId} { 
        allow read: if isSignedIn() && (isOwner(resource.data.studentId) || isOwner(resource.data.teacherId));
        allow create: if isSignedIn();
    }
    match /reviews/{reviewId} { allow read: if isSignedIn(); allow create: if isSignedIn(); }

    // =========================================================
    // 7. System Settings & Finance
    // =========================================================
    match /settings/{document=**} { allow read: if true; allow write: if isAdmin(); }
    match /homePageContent/{document=**} { allow read: if true; allow write: if isAdmin(); }
    match /stats/{document=**} { allow read: if true; allow write: if isStaff(); }
    
    // Invoices are sensitive
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
            <header className="mb-12 border-r-4 border-emerald-500 pr-8 bg-emerald-500/5 py-6 rounded-l-3xl">
                <h2 className="text-4xl font-black text-white flex items-center gap-4">
                    <ShieldCheck className="text-emerald-500" size={40} /> جدار الحماية <span className="text-emerald-500">Ultimate V5</span>
                </h2>
                <p className="text-gray-400 mt-2 font-bold text-lg">تم تحديث القواعد لتشمل كافة الجداول الجديدة وتأمين بيانات الطلاب بشكل كامل.</p>
            </header>

            <div className="glass-panel p-10 rounded-[60px] border-white/5 bg-black/40 relative shadow-2xl">
                <div className="flex justify-between items-center mb-6">
                    <h3 className="text-2xl font-black text-white flex items-center gap-3">
                        <Code size={24} className="text-blue-400"/> Security Rules
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
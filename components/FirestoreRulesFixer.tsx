import React, { useState } from 'react';
import { ShieldCheck, Code, CheckCircle2, Copy, Lock, Info } from 'lucide-react';

const FirestoreRulesFixer: React.FC = () => {
    const [copied, setCopied] = useState(false);

    const firestoreRules = `rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    
    // --- Helper Functions ---
    function isAuth() {
      return request.auth != null;
    }
    
    function isUser(userId) {
      return isAuth() && request.auth.uid == userId;
    }

    function isAdmin() {
      return isAuth() && get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role == 'admin';
    }
    
    function isTeacher() {
      return isAuth() && get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role == 'teacher';
    }

    // --- Public Read Collections (Critical for App Functionality) ---
    // Allow any authenticated user to read curriculum, units, and lessons
    match /curriculum/{docId} { 
      allow read: if isAuth(); 
      allow write: if isAdmin() || isTeacher(); 
    }
    match /units/{docId} { 
      allow read: if isAuth(); 
      allow write: if isAdmin() || isTeacher(); 
    }
    match /lessons/{docId} { 
      allow read: if isAuth(); 
      allow write: if isAdmin() || isTeacher(); 
    }
    match /questions/{docId} {
      allow read: if isAuth();
      allow write: if isAdmin() || isTeacher();
    }
    match /quizzes/{docId} {
      allow read: if isAuth();
      allow write: if isAdmin() || isTeacher();
    }

    // --- Publicly Readable System Content ---
    match /settings/{docId} {
      allow read: if true;
      allow write: if isAdmin();
    }
    
    match /homePageContent/{docId} {
      allow read: if true;
      allow write: if isAdmin();
    }
    
    // --- User-Specific Data ---
    match /users/{userId} {
      // Allow users to read their own profile, admins to read all
      allow read: if isUser(userId) || isAdmin() || isTeacher(); 
      allow update: if isUser(userId) || isAdmin();
      allow create: if isAuth(); // Allow signup
    }
    
    match /attempts/{attemptId} {
        allow read: if isAuth() && (resource.data.studentId == request.auth.uid || isAdmin() || isTeacher());
        allow create: if isAuth() && request.resource.data.studentId == request.auth.uid;
        allow update: if isAdmin() || isTeacher(); 
    }
    
    // --- Other Collections ---
    match /forumSections/{sectionId} { allow read: if isAuth(); allow write: if isAdmin(); }
    match /forumPosts/{postId} { 
        allow read: if isAuth(); 
        allow create: if isAuth();
        allow update, delete: if isUser(resource.data.authorUid) || isAdmin();
    }
    
    match /{document=**} {
      allow read, write: if false; // Default deny
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
                    <ShieldCheck className="text-emerald-400" /> مصلح الصلاحيات <span className="text-emerald-400">V2.0</span>
                </h2>
                <p className="text-gray-500 mt-2 font-medium">إصلاح شامل لمشاكل "Missing Permissions" في قاعدة البيانات.</p>
            </header>

            <div className="glass-panel p-10 rounded-[60px] border-white/5 bg-black/40 relative shadow-2xl">
                <div className="p-8 bg-blue-500/10 border border-blue-500/20 rounded-[40px] mb-10">
                    <div className="flex items-start gap-4">
                        <Info size={24} className="text-blue-400 shrink-0" />
                        <div>
                            <h4 className="font-black text-blue-400">هام جداً:</h4>
                            <p className="text-gray-400 text-sm mt-2 leading-relaxed">
                                الرسالة "Missing or insufficient permissions" تعني أن قواعد Firestore الحالية تمنع تطبيقك من قراءة البيانات.
                                <br/>
                                انسخ القواعد أدناه واستبدلها في تبويب <b>Rules</b> في Firebase Console لحل المشكلة فوراً.
                            </p>
                        </div>
                    </div>
                </div>

                <h3 className="text-2xl font-black text-white mb-6 flex items-center gap-3">
                    <Code size={24}/> القواعد المصححة (Corrected Rules)
                </h3>
                
                <div className="relative group">
                    <pre className="bg-black/80 p-6 rounded-3xl text-[10px] font-mono text-cyan-300 overflow-x-auto ltr text-left border border-white/10 h-96 no-scrollbar">
                        {firestoreRules}
                    </pre>
                    <button 
                        onClick={handleCopy}
                        className="absolute top-4 left-4 p-3 bg-emerald-500 text-black rounded-xl hover:bg-emerald-400 transition-all flex items-center gap-2 text-xs font-black shadow-xl"
                    >
                        {copied ? <CheckCircle2 size={16}/> : <Copy size={16}/>}
                        {copied ? 'تم النسخ!' : 'نسخ القواعد'}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default FirestoreRulesFixer;


import React, { useState, useEffect, Suspense, lazy } from 'react';
import { User, ViewState, Lesson, QuizAttempt, Curriculum, Invoice, Quiz, StudentQuizAttempt } from './types';
import { dbService } from './services/db';
import { Bell } from 'lucide-react';
import { auth } from './services/firebase';
import { onAuthStateChanged, signOut } from 'firebase/auth';

// Core Components (eagerly loaded)
import Sidebar from './components/Sidebar';
import PWAPrompt from './components/PWAPrompt';
import NotificationPanel from './components/NotificationPanel';

// Lazy-loaded Page Components
const LandingPage = lazy(() => import('./components/LandingPage'));
const Auth = lazy(() => import('./components/Auth'));
const StudentDashboard = lazy(() => import('./components/StudentDashboard'));
const AdminDashboard = lazy(() => import('./components/AdminDashboard'));
const TeacherDashboard = lazy(() => import('./components/TeacherDashboard'));
const AiTutor = lazy(() => import('./components/PhysicsChat'));
const CurriculumBrowser = lazy(() => import('./components/CurriculumBrowser'));
const LessonViewer = lazy(() => import('./components/LessonViewer'));
const QuizCenter = lazy(() => import('./components/QuizCenter'));
const QuizPlayer = lazy(() => import('./components/QuizPlayer'));
const AttemptReview = lazy(() => import('./components/AttemptReview'));
const BillingCenter = lazy(() => import('./components/BillingCenter'));
const PaymentCertificate = lazy(() => import('./components/PaymentCertificate'));
const Forum = lazy(() => import('./components/Forum'));
const GamificationCenter = lazy(() => import('./components/GamificationCenter'));
const Recommendations = lazy(() => import('./components/Recommendations'));
const LabHub = lazy(() => import('./components/LabHub'));
const LiveSessions = lazy(() => import('./components/LiveSessions'));
const ProgressReport = lazy(() => import('./components/ProgressReport'));
const HelpCenter = lazy(() => import('./components/HelpCenter'));
const AdminCurriculumManager = lazy(() => import('./components/AdminCurriculumManager'));
const AdminStudentManager = lazy(() => import('./components/AdminStudentManager'));
const AdminTeacherManager = lazy(() => import('./components/AdminTeacherManager'));
const AdminFinancials = lazy(() => import('./components/AdminFinancials'));
const QuizPerformance = lazy(() => import('./components/QuizPerformance'));
const AdminSettings = lazy(() => import('./components/AdminSettings'));
const PhysicsJourneyMap = lazy(() => import('./components/PhysicsJourneyMap'));
const AdminLiveSessions = lazy(() => import('./components/AdminLiveSessions'));
const AdminQuizManager = lazy(() => import('./components/AdminQuizManager'));
const AdminContentManager = lazy(() => import('./components/AdminContentManager'));


const App: React.FC = () => {
  const [user, setUser] = useState<User | null>(null);
  const [isAuthLoading, setIsAuthLoading] = useState(true);
  
  const [view, setView] = useState<ViewState>(() => {
    const path = window.location.pathname.replace('/', '');
    // Default to landing page, but allow direct access to privacy policy
    if (path === 'privacy-policy') return 'privacy-policy';
    return 'landing';
  });
  
  const [activeSubject, setActiveSubject] = useState<'Physics' | 'Chemistry'>('Physics');
  const [activeLesson, setActiveLesson] = useState<Lesson | null>(null);
  const [activeQuiz, setActiveQuiz] = useState<Quiz | null>(null);
  const [activeAttempt, setActiveAttempt] = useState<StudentQuizAttempt | null>(null);
  const [activeInvoice, setActiveInvoice] = useState<Invoice | null>(null);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  
  // Session Persistence Check
  useEffect(() => {
    let unsubscribe: Function | undefined;

    const checkSession = async () => {
        if (auth) {
            unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
                if (firebaseUser) {
                    await dbService.initializeSettings(); 
                    const appUser = await dbService.getUser(firebaseUser.uid);
                    if (appUser) {
                        setUser(appUser);
                        setView('dashboard'); // Redirect to dashboard if user is found
                    } else {
                        await signOut(auth);
                        setUser(null);
                    }
                } else {
                    setUser(null);
                }
                setIsAuthLoading(false);
            });
        } else {
            await dbService.initializeSettings();
            const localUid = sessionStorage.getItem('ssc_active_uid');
            if (localUid) {
                const appUser = await dbService.getUser(localUid);
                if (appUser) {
                    setUser(appUser);
                    setView('dashboard');
                }
            }
            setIsAuthLoading(false);
        }
    };
    
    checkSession();
    
    // Cleanup subscription on unmount
    return () => { if (unsubscribe) unsubscribe(); };
  }, []);

  useEffect(() => {
    const handleViewChange = (event: Event) => {
      const customEvent = event as CustomEvent;
      const { view: newView, lesson, quiz, attempt, invoice, subject } = customEvent.detail;
      
      if (newView) setView(newView);
      if (subject) setActiveSubject(subject);
      if (lesson) setActiveLesson(lesson);
      if (quiz) setActiveQuiz(quiz);
      if (attempt) setActiveAttempt(attempt);
      if (invoice) setActiveInvoice(invoice);

      // Reset others when a primary view is selected
      if (newView) {
        if (newView !== 'lesson') setActiveLesson(null);
        if (newView !== 'quiz_player') setActiveQuiz(null);
        if (newView !== 'attempt_review') setActiveAttempt(null);
        if (newView !== 'payment-certificate') setActiveInvoice(null);
        window.scrollTo(0, 0); // Scroll to top on view change
      }
    };
    window.addEventListener('change-view', handleViewChange);
    return () => window.removeEventListener('change-view', handleViewChange);
  }, []);

  const handleLogin = (loggedInUser: User) => {
    setUser(loggedInUser);
    setView('dashboard');
    setIsSidebarOpen(false);
  };
  
  const handleLogout = async () => {
    if (auth) {
      await signOut(auth);
    }
    sessionStorage.removeItem('ssc_active_uid');
    setUser(null);
    setView('landing');
  };
  
  const renderView = () => {
    if (isAuthLoading) {
      return (
        <div className="flex items-center justify-center h-screen">
          <div className="w-16 h-16 border-4 border-amber-400 border-t-transparent rounded-full animate-spin"></div>
        </div>
      );
    }
    
    if (!user) {
        switch (view) {
            case 'landing':
                return <LandingPage onStart={() => setView('dashboard')} />;
            default:
                // If not logged in and not on landing, show Auth
                return <Auth onLogin={handleLogin} onBack={() => setView('landing')} />;
        }
    }

    // User is logged in
    const mainContent = () => {
      switch (view) {
        case 'dashboard':
            if (user.role === 'admin') return <AdminDashboard />;
            if (user.role === 'teacher') return <TeacherDashboard user={user} />;
            return <StudentDashboard user={user} />;
        case 'curriculum':
          return <CurriculumBrowser user={user} subject={activeSubject} />;
        case 'lesson':
          return activeLesson ? <LessonViewer user={user} lesson={activeLesson} /> : <CurriculumBrowser user={user} subject={activeSubject} />;
        case 'quiz_center':
          return <QuizCenter user={user} onBack={() => setView('dashboard')} />;
        case 'quiz_player':
          return activeQuiz ? <QuizPlayer user={user} quiz={activeQuiz} onFinish={() => setView('quiz_center')} /> : <QuizCenter user={user} onBack={() => setView('dashboard')} />;
        case 'attempt_review':
          return activeAttempt ? <AttemptReview user={user} attempt={activeAttempt} onBack={() => setView('quiz_center')} /> : <QuizCenter user={user} onBack={() => setView('dashboard')} />;
        case 'subscription':
          return <BillingCenter user={user} onUpdateUser={setUser} onBack={() => setView('dashboard')} onViewCertificate={(invoice) => { setActiveInvoice(invoice); setView('payment-certificate'); }} />;
        case 'payment-certificate':
          return activeInvoice ? <PaymentCertificate user={user} invoice={activeInvoice} onBack={() => setView('subscription')} /> : <BillingCenter user={user} onUpdateUser={setUser} onBack={() => setView('dashboard')} />;
        case 'discussions':
          return <Forum user={user} onAskAI={(q) => { setView('ai-chat'); }} />;
        case 'ai-chat':
          return <AiTutor grade={user.grade} subject={activeSubject} />;
        case 'gamification':
          return <GamificationCenter user={user} onUpdateUser={setUser} />;
        case 'recommendations':
          return <Recommendations user={user} />;
        case 'virtual-lab':
          return <LabHub user={user} />;
        case 'live-sessions':
          return <LiveSessions user={user} />;
        case 'reports':
          return <ProgressReport user={user} attempts={[]} onBack={() => setView('dashboard')} />;
        case 'quiz-performance':
          return <QuizPerformance user={user} />;
        case 'journey-map':
          return <PhysicsJourneyMap user={user} />;
        case 'help-center':
            return <HelpCenter />;
        // Admin Views
        case 'admin-curriculum':
          return user.role === 'admin' ? <AdminCurriculumManager /> : <StudentDashboard user={user} />;
        case 'admin-students':
          return user.role === 'admin' ? <AdminStudentManager /> : <StudentDashboard user={user} />;
        case 'admin-teachers':
            return user.role === 'admin' ? <AdminTeacherManager /> : <StudentDashboard user={user} />;
        case 'admin-financials':
            return user.role === 'admin' ? <AdminFinancials /> : <StudentDashboard user={user} />;
        case 'admin-live-sessions':
            return user.role === 'admin' ? <AdminLiveSessions /> : <StudentDashboard user={user} />;
        case 'admin-quizzes':
            return user.role === 'admin' ? <AdminQuizManager /> : <StudentDashboard user={user} />;
        case 'admin-settings':
            return user.role === 'admin' ? <AdminSettings /> : <StudentDashboard user={user} />;
        case 'admin-content':
            return user.role === 'admin' ? <AdminContentManager /> : <StudentDashboard user={user} />;
        default:
          return <StudentDashboard user={user} />;
      }
    };

    return (
      <div className="flex min-h-screen bg-gradient-to-br from-[#0A2540] to-[#010304]">
        <Sidebar 
          currentView={view} 
          setView={(v, s) => { setView(v); if (s) setActiveSubject(s); }}
          user={user} 
          onLogout={handleLogout}
          isOpen={isSidebarOpen}
          onClose={() => setIsSidebarOpen(false)}
        />
        <main className="flex-1 p-6 md:p-10 lg:pr-80">
            {/* Header for mobile */}
            <header className="lg:hidden flex justify-between items-center mb-6">
                <span className="text-lg font-black text-white">SSC</span>
                <div className="flex items-center gap-2">
                    <button onClick={() => setShowNotifications(s => !s)} className="p-3 bg-white/5 rounded-full relative">
                        <Bell size={18} />
                        <span className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full border-2 border-[#0A2540]"></span>
                    </button>
                    <button onClick={() => setIsSidebarOpen(true)} className="p-3 bg-white/5 rounded-full">
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M3 12H21" stroke="white" strokeWidth="2" strokeLinecap="round"/><path d="M3 6H21" stroke="white" strokeWidth="2" strokeLinecap="round"/><path d="M3 18H21" stroke="white" strokeWidth="2" strokeLinecap="round"/></svg>
                    </button>
                </div>
            </header>
            <Suspense fallback={
                <div className="flex items-center justify-center h-full">
                    <div className="w-12 h-12 border-4 border-amber-400 border-t-transparent rounded-full animate-spin"></div>
                </div>
            }>
                {mainContent()}
            </Suspense>
        </main>
        {showNotifications && <NotificationPanel user={user} onClose={() => setShowNotifications(false)}/>}
        <PWAPrompt user={user} />
      </div>
    );
  };
  
  return <Suspense fallback={<div>Loading...</div>}><App/></Suspense>;
};

export default App;

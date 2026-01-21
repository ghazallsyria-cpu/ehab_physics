
import React, { useState, useEffect, Suspense, lazy } from 'react';
import { User, ViewState, Lesson, QuizAttempt, Curriculum, Invoice, Quiz, StudentQuizAttempt } from './types';
import { dbService } from './services/db';
import { Bell, ArrowRight } from 'lucide-react';
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
const FloatingNav = lazy(() => import('./components/FloatingNav'));
const AdminAssetManager = lazy(() => import('./components/AdminAssetManager'));
const AdminForumManager = lazy(() => import('./components/AdminForumManager'));
const AdminCertificates = lazy(() => import('./components/AdminCertificates'));
const CertificateVerificationPage = lazy(() => import('./components/CertificateVerificationPage'));


const App: React.FC = () => {
  const [user, setUser] = useState<User | null>(null);
  const [isAuthLoading, setIsAuthLoading] = useState(true);
  
  const [viewStack, setViewStack] = useState<ViewState[]>(['landing']);
  const view = viewStack[viewStack.length - 1];
  
  const [activeSubject, setActiveSubject] = useState<'Physics' | 'Chemistry'>('Physics');
  const [activeLesson, setActiveLesson] = useState<Lesson | null>(null);
  const [activeQuiz, setActiveQuiz] = useState<Quiz | null>(null);
  const [activeAttempt, setActiveAttempt] = useState<StudentQuizAttempt | null>(null);
  const [activeInvoice, setActiveInvoice] = useState<Invoice | null>(null);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    const path = window.location.pathname.replace('/', '');
    if (path === 'privacy-policy') {
        setViewStack(['landing', 'privacy-policy']);
    } else if (path.startsWith('verify-certificate')) {
        setViewStack(['verify-certificate']);
    }
  }, []);
  
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
                        if (view !== 'verify-certificate') setViewStack(['dashboard']);
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
                    if (view !== 'verify-certificate') setViewStack(['dashboard']);
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
    if (!user) return;
    const fetchUnreadCount = async () => {
        try {
            const notes = await dbService.getNotifications(user.uid);
            const unread = notes.filter(n => !n.isRead).length;
            setUnreadCount(unread);
        } catch (e) {
            console.error("Failed to fetch notification count", e);
        }
    };
    fetchUnreadCount();
  }, [user]);


  useEffect(() => {
    const handleViewChange = (event: Event) => {
      const customEvent = event as CustomEvent;
      const { view: newView, lesson, quiz, attempt, invoice, subject } = customEvent.detail;
      
      if (newView && newView !== viewStack[viewStack.length - 1]) {
        setViewStack(prev => [...prev, newView]);
      }
      
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

    const handleGoBack = () => {
        setViewStack(prev => {
            if (prev.length <= 1) return prev;
            const newStack = [...prev];
            newStack.pop();
            return newStack;
        });
    };
    
    const handleResetToDashboard = () => setViewStack(['dashboard']);

    window.addEventListener('change-view', handleViewChange);
    window.addEventListener('go-back', handleGoBack);
    window.addEventListener('reset-to-dashboard', handleResetToDashboard);

    return () => {
      window.removeEventListener('change-view', handleViewChange);
      window.removeEventListener('go-back', handleGoBack);
      window.removeEventListener('reset-to-dashboard', handleResetToDashboard);
    };
  }, [viewStack]);

  const handleLogin = (loggedInUser: User) => {
    setUser(loggedInUser);
    setViewStack(['dashboard']);
    setIsSidebarOpen(false);
  };
  
  const handleLogout = async () => {
    if (auth) {
      await signOut(auth);
    }
    sessionStorage.removeItem('ssc_active_uid');
    setUser(null);
    setViewStack(['landing']);
  };
  
  const renderView = () => {
    const fallbackSpinner = (
        <div className="flex items-center justify-center h-screen bg-gradient-to-br from-[#0A2540] to-[#010304]">
            <div className="w-16 h-16 border-4 border-amber-400 border-t-transparent rounded-full animate-spin"></div>
        </div>
    );
    
    if (view === 'verify-certificate') {
        return <Suspense fallback={fallbackSpinner}><CertificateVerificationPage /></Suspense>
    }

    if (isAuthLoading) {
      return (
        <div className="flex items-center justify-center h-screen">
          <div className="w-16 h-16 border-4 border-amber-400 border-t-transparent rounded-full animate-spin"></div>
        </div>
      );
    }

    if (!user) {
        return (
            <Suspense fallback={fallbackSpinner}>
                {view === 'landing' ? (
                    <LandingPage onStart={() => setViewStack(['auth'])} />
                ) : (
                    <Auth onLogin={handleLogin} onBack={() => setViewStack(['landing'])} />
                )}
            </Suspense>
        );
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
          return <QuizCenter user={user} />;
        case 'quiz_player':
          return activeQuiz ? <QuizPlayer user={user} quiz={activeQuiz} onFinish={() => setViewStack(prev => [...prev, 'quiz_center'])} /> : <QuizCenter user={user} />;
        case 'attempt_review':
          return activeAttempt ? <AttemptReview user={user} attempt={activeAttempt} /> : <QuizCenter user={user} />;
        case 'subscription':
          return <BillingCenter user={user} onUpdateUser={setUser} onViewCertificate={(invoice) => { setActiveInvoice(invoice); setViewStack(prev => [...prev, 'payment-certificate']); }} />;
        case 'payment-certificate':
          return activeInvoice ? <PaymentCertificate user={user} invoice={activeInvoice} /> : <BillingCenter user={user} onUpdateUser={setUser} onViewCertificate={() => {}} />;
        case 'discussions':
          return <Forum user={user} />;
        case 'ai-chat':
          return <AiTutor grade={user.grade} subject={activeSubject} />;
        case 'recommendations':
          return <Recommendations user={user} />;
        case 'virtual-lab':
          return <LabHub user={user} />;
        case 'live-sessions':
          return <LiveSessions user={user} />;
        case 'reports':
          return <ProgressReport user={user} attempts={[]} />;
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
        case 'admin-certificates':
            return user.role === 'admin' ? <AdminCertificates /> : <StudentDashboard user={user} />;
        case 'admin-settings':
            return user.role === 'admin' ? <AdminSettings /> : <StudentDashboard user={user} />;
        case 'admin-content':
            return user.role === 'admin' ? <AdminContentManager /> : <StudentDashboard user={user} />;
        case 'admin-assets':
            return user.role === 'admin' ? <AdminAssetManager /> : <StudentDashboard user={user} />;
        case 'admin-forums':
            return user.role === 'admin' ? <AdminForumManager /> : <StudentDashboard user={user} />;
        default:
          return <StudentDashboard user={user} />;
      }
    };
    
    const viewsToHideFab: ViewState[] = ['quiz_player', 'virtual-lab', 'lesson', 'payment-certificate', 'attempt_review'];
    const showFab = user?.role === 'student' && !viewsToHideFab.includes(view);

    return (
      <div className="min-h-screen bg-gradient-to-br from-[#0A2540] to-[#010304]">
        <Sidebar 
          currentView={view} 
          setView={(v, s) => { 
            const detail: any = { view: v };
            if(s) detail.subject = s;
            window.dispatchEvent(new CustomEvent('change-view', { detail }));
          }}
          user={user} 
          onLogout={handleLogout}
          isOpen={isSidebarOpen}
          onClose={() => setIsSidebarOpen(false)}
        />
        <main className="p-6 md:p-10 lg:mr-72">
            {/* Header for mobile */}
            <header className="lg:hidden flex justify-between items-center mb-6">
                <span className="text-lg font-black text-white">SSC</span>
                <div className="flex items-center gap-2">
                    <button onClick={() => { setShowNotifications(s => !s); setUnreadCount(0); }} className="p-3 bg-white/5 rounded-full relative">
                        <Bell size={18} />
                        {unreadCount > 0 && (
                          <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 rounded-full border-2 border-[#0A2540] text-white text-[8px] flex items-center justify-center font-bold">
                            {unreadCount}
                          </span>
                        )}
                    </button>
                    <button onClick={() => setIsSidebarOpen(true)} className="p-3 bg-white/5 rounded-full">
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M3 12H21" stroke="white" strokeWidth="2" strokeLinecap="round"/><path d="M3 6H21" stroke="white" strokeWidth="2" strokeLinecap="round"/><path d="M3 18H21" stroke="white" strokeWidth="2" strokeLinecap="round"/></svg>
                    </button>
                </div>
            </header>

            {viewStack.length > 1 && view !== 'dashboard' && (
                <div className="mb-8 animate-fadeIn">
                    <button 
                        onClick={() => window.dispatchEvent(new CustomEvent('go-back'))} 
                        className="flex items-center gap-2 text-gray-400 hover:text-white font-bold text-sm group transition-all"
                    >
                        <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
                        <span>رجوع</span>
                    </button>
                </div>
            )}
            
            <Suspense fallback={
                <div className="flex items-center justify-center h-full">
                    <div className="w-12 h-12 border-4 border-amber-400 border-t-transparent rounded-full animate-spin"></div>
                </div>
            }>
                {mainContent()}
            </Suspense>
        </main>
        {showNotifications && <NotificationPanel user={user} onClose={() => setShowNotifications(false)}/>}
        {showFab && (
          <Suspense>
            <FloatingNav />
          </Suspense>
        )}
        <PWAPrompt user={user} />
      </div>
    );
  };
  
  return renderView();
};

export default App;

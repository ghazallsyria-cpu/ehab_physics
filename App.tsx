
import React, { useState, useEffect, Suspense, lazy } from 'react';
import { User, ViewState, Lesson, Curriculum, Invoice, Quiz, StudentQuizAttempt } from './types';
import { dbService } from './services/db';
import { Bell, ArrowRight, Menu } from 'lucide-react';
import { auth } from './services/firebase';
import { onAuthStateChanged, signOut } from 'firebase/auth';

// Core Components
import Sidebar from './components/Sidebar';
import PWAPrompt from './components/PWAPrompt';
import NotificationPanel from './components/NotificationPanel';

// Lazy-loaded Components
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
const ResourcesCenter = lazy(() => import('./components/ResourcesCenter'));

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
    const handleViewChange = (event: Event) => {
      const { view: newView, lesson, quiz, attempt, invoice, subject } = (event as CustomEvent).detail;
      if (newView) setViewStack(prev => [...prev, newView]);
      if (subject) setActiveSubject(subject);
      if (lesson) setActiveLesson(lesson);
      if (quiz) setActiveQuiz(quiz);
      if (attempt) setActiveAttempt(attempt);
      if (invoice) setActiveInvoice(invoice);
      window.scrollTo(0, 0);
    };

    const handleGoBack = () => setViewStack(prev => prev.length > 1 ? prev.slice(0, -1) : prev);
    const handleResetToDashboard = () => setViewStack(['dashboard']);

    window.addEventListener('change-view', handleViewChange);
    window.addEventListener('go-back', handleGoBack);
    window.addEventListener('reset-to-dashboard', handleResetToDashboard);

    return () => {
      window.removeEventListener('change-view', handleViewChange);
      window.removeEventListener('go-back', handleGoBack);
      window.removeEventListener('reset-to-dashboard', handleResetToDashboard);
    };
  }, []);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        const appUser = await dbService.getUser(firebaseUser.uid);
        if (appUser) {
          setUser(appUser);
          if (view === 'landing' || view === 'auth') setViewStack(['dashboard']);
        }
      } else {
        setUser(null);
      }
      setIsAuthLoading(false);
    });
    return () => unsubscribe();
  }, [view]);

  const renderContent = () => {
    switch (view) {
      case 'dashboard':
        if (user?.role === 'admin') return <AdminDashboard />;
        if (user?.role === 'teacher') return <TeacherDashboard user={user} />;
        return user ? <StudentDashboard user={user} /> : null;
      case 'curriculum': return user ? <CurriculumBrowser user={user} subject={activeSubject} /> : null;
      case 'lesson': return activeLesson && user ? <LessonViewer user={user} lesson={activeLesson} /> : null;
      case 'quiz_center': return user ? <QuizCenter user={user} /> : null;
      case 'quiz_player': return activeQuiz && user ? <QuizPlayer user={user} quiz={activeQuiz} onFinish={() => setViewStack(['quiz_center'])} /> : null;
      case 'discussions': return <Forum user={user} />;
      case 'ai-chat': return user ? <AiTutor grade={user.grade} subject={activeSubject} /> : null;
      case 'virtual-lab': return user ? <LabHub user={user} /> : null;
      case 'live-sessions': return user ? <LiveSessions user={user} /> : null;
      case 'subscription': return user ? <BillingCenter user={user} onUpdateUser={setUser} /> : null;
      case 'admin-curriculum': return <AdminCurriculumManager />;
      case 'admin-students': return <AdminStudentManager />;
      case 'admin-teachers': return <AdminTeacherManager />;
      case 'admin-financials': return <AdminFinancials />;
      case 'admin-quizzes': return <AdminQuizManager />;
      case 'admin-forums': return <AdminForumManager />;
      case 'admin-assets': return <AdminAssetManager />;
      case 'admin-settings': return <AdminSettings />;
      case 'resources-center': return <ResourcesCenter user={user} />;
      default: return <StudentDashboard user={user!} />;
    }
  };

  if (isAuthLoading) return <div className="h-screen bg-[#0A2540] flex items-center justify-center"><div className="w-16 h-16 border-4 border-amber-400 border-t-transparent rounded-full animate-spin"></div></div>;

  if (!user && view !== 'landing' && view !== 'auth') {
    return <Suspense fallback={<div/>}><Auth onLogin={u => { setUser(u); setViewStack(['dashboard']); }} onBack={() => setViewStack(['landing'])} /></Suspense>;
  }

  if (view === 'landing') return <Suspense fallback={<div/>}><LandingPage onStart={() => setViewStack(['auth'])} /></Suspense>;
  if (view === 'auth') return <Suspense fallback={<div/>}><Auth onLogin={u => { setUser(u); setViewStack(['dashboard']); }} onBack={() => setViewStack(['landing'])} /></Suspense>;

  return (
    <div className="min-h-screen bg-[#0A2540] text-right flex flex-col lg:flex-row relative" dir="rtl">
      <Sidebar 
        currentView={view} 
        setView={(v, s) => window.dispatchEvent(new CustomEvent('change-view', { detail: { view: v, subject: s } }))}
        user={user!} 
        onLogout={() => signOut(auth).then(() => setViewStack(['landing']))}
        isOpen={isSidebarOpen}
        onClose={() => setIsSidebarOpen(false)}
      />
      
      {/* Container with dynamic margin for sidebar */}
      <div className="flex-1 flex flex-col min-w-0 lg:mr-72 relative z-10 transition-all duration-500">
        <header className="lg:hidden p-4 bg-black/20 flex justify-between items-center sticky top-0 z-[40] backdrop-blur-md">
          <button onClick={() => setIsSidebarOpen(true)} className="p-2 text-white"><Menu /></button>
          <span className="font-black text-xl text-white">SSC</span>
          <button onClick={() => setShowNotifications(true)} className="p-2 text-white relative"><Bell />{unreadCount > 0 && <span className="absolute top-0 right-0 w-2 h-2 bg-red-500 rounded-full" />}</button>
        </header>

        <main className="flex-1 p-6 md:p-10">
          {viewStack.length > 1 && view !== 'dashboard' && (
            <button onClick={() => window.dispatchEvent(new CustomEvent('go-back'))} className="mb-8 flex items-center gap-2 text-gray-400 hover:text-white font-bold transition-all group">
              <ArrowRight size={20} className="group-hover:translate-x-1 transition-transform" /> عودة
            </button>
          )}
          <Suspense fallback={<div className="flex items-center justify-center h-[50vh]"><div className="w-12 h-12 border-4 border-amber-400 border-t-transparent rounded-full animate-spin"></div></div>}>
            {renderContent()}
          </Suspense>
        </main>
      </div>

      {showNotifications && <NotificationPanel user={user!} onClose={() => setShowNotifications(false)} />}
      <FloatingNav />
      <PWAPrompt user={user} />
    </div>
  );
};

export default App;

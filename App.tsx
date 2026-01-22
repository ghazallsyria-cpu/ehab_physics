
import React, { useState, useEffect, Suspense, lazy } from 'react';
import { User, ViewState, Lesson, Curriculum, Quiz, StudentQuizAttempt } from './types';
import { dbService } from './services/db';
import { Bell, ArrowRight, Menu, RefreshCw } from 'lucide-react';
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
const AdminForumManager = lazy(() => import('./components/AdminForumManager'));
const AdminAssetManager = lazy(() => import('./components/AdminAssetManager'));
const AdminQuizManager = lazy(() => import('./components/AdminQuizManager'));
const PhysicsJourneyMap = lazy(() => import('./components/PhysicsJourneyMap'));
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
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);

  useEffect(() => {
    const handleViewChange = (event: Event) => {
      const { view: newView, lesson, quiz, attempt, subject } = (event as CustomEvent).detail;
      if (newView) setViewStack(prev => [...prev, newView]);
      if (subject) setActiveSubject(subject);
      if (lesson) setActiveLesson(lesson);
      if (quiz) setActiveQuiz(quiz);
      if (attempt) setActiveAttempt(attempt);
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
        try {
          const appUser = await dbService.getUser(firebaseUser.uid);
          if (appUser) {
            setUser(appUser);
            if (view === 'landing' || view === 'auth') {
                setViewStack(['dashboard']);
            }
          } else {
            setUser(null);
          }
        } catch (e) {
          console.error("Auth fetch error", e);
        }
      } else {
        setUser(null);
      }
      setIsAuthLoading(false);
    });
    return () => unsubscribe();
  }, [view]);

  const renderContent = () => {
    // إذا كان هناك فحص جاري، نظهر سبينر التحميل
    if (isAuthLoading) return (
      <div className="flex flex-col items-center justify-center h-[60vh] gap-4">
        <RefreshCw className="w-12 h-12 text-amber-400 animate-spin" />
        <p className="text-gray-500 font-bold">جاري التحقق من الهوية...</p>
      </div>
    );

    switch (view) {
      case 'landing': return <LandingPage onStart={() => setViewStack(['auth'])} />;
      case 'auth': return <Auth onLogin={u => { setUser(u); setViewStack(['dashboard']); }} onBack={() => setViewStack(['landing'])} />;
      case 'dashboard':
        if (user?.role === 'admin') return <AdminDashboard />;
        if (user?.role === 'teacher') return <TeacherDashboard user={user} />;
        return user ? <StudentDashboard user={user} /> : <Auth onLogin={u => { setUser(u); setViewStack(['dashboard']); }} onBack={() => setViewStack(['landing'])} />;
      case 'curriculum': return user ? <CurriculumBrowser user={user} subject={activeSubject} /> : null;
      case 'lesson': return activeLesson && user ? <LessonViewer user={user} lesson={activeLesson} /> : null;
      case 'quiz_center': return user ? <QuizCenter user={user} /> : null;
      case 'quiz_player': return activeQuiz && user ? <QuizPlayer user={user} quiz={activeQuiz} onFinish={() => setViewStack(['quiz_center'])} /> : null;
      case 'attempt_review': return activeAttempt && user ? <AttemptReview user={user} attempt={activeAttempt} /> : null;
      case 'discussions': return <Forum user={user} />;
      case 'ai-chat': return user ? <AiTutor grade={user.grade} subject={activeSubject} /> : null;
      case 'virtual-lab': return user ? <LabHub user={user} /> : null;
      case 'live-sessions': return user ? <LiveSessions user={user} /> : null;
      case 'subscription': return user ? <BillingCenter user={user} onUpdateUser={setUser} /> : null;
      case 'recommendations': return user ? <Recommendations user={user} /> : null;
      case 'journey-map': return user ? <PhysicsJourneyMap user={user} /> : null;
      case 'resources-center': return user ? <ResourcesCenter user={user} /> : null;
      case 'reports': return user ? <ProgressReport user={user} attempts={[]} /> : null;
      case 'quiz-performance': return user ? <QuizPerformance user={user} /> : null;
      case 'help-center': return <HelpCenter />;
      case 'admin-students': return <AdminStudentManager />;
      case 'admin-teachers': return <AdminTeacherManager />;
      case 'admin-curriculum': return <AdminCurriculumManager />;
      case 'admin-quizzes': return <AdminQuizManager />;
      case 'admin-financials': return <AdminFinancials />;
      case 'admin-settings': return <AdminSettings />;
      case 'admin-forums': return <AdminForumManager />;
      case 'admin-assets': return <AdminAssetManager />;
      default: return user ? <StudentDashboard user={user} /> : <LandingPage onStart={() => setViewStack(['auth'])} />;
    }
  };

  // شاشة التحميل الأولية للموقع
  if (isAuthLoading && view === 'landing') return (
    <div className="h-screen bg-[#0A2540] flex items-center justify-center">
      <div className="w-16 h-16 border-4 border-amber-400 border-t-transparent rounded-full animate-spin"></div>
    </div>
  );

  // إذا كنا في صفحة الهبوط أو تسجيل الدخول، نعرضهم بكامل الشاشة
  if (view === 'landing' || view === 'auth' || !user) {
    return (
      <div className="min-h-screen bg-[#0A2540] text-right font-['Tajawal']" dir="rtl">
        <Suspense fallback={<div className="h-screen flex items-center justify-center"><RefreshCw className="animate-spin text-white" /></div>}>
          {renderContent()}
        </Suspense>
      </div>
    );
  }

  // الهيكل الأساسي بعد تسجيل الدخول
  return (
    <div className="min-h-screen bg-[#0A2540] text-right font-['Tajawal'] flex flex-col lg:flex-row relative" dir="rtl">
      <Sidebar 
        currentView={view} 
        setView={(v, s) => window.dispatchEvent(new CustomEvent('change-view', { detail: { view: v, subject: s } }))}
        user={user!} 
        onLogout={() => signOut(auth).then(() => setViewStack(['landing']))}
        isOpen={isSidebarOpen}
        onClose={() => setIsSidebarOpen(false)}
      />
      
      <div className="flex-1 flex flex-col min-w-0 lg:mr-72 relative z-10 transition-all">
        <header className="lg:hidden p-4 bg-black/20 flex justify-between items-center sticky top-0 z-[40] backdrop-blur-md">
          <button onClick={() => setIsSidebarOpen(true)} className="p-2 text-white"><Menu /></button>
          <span className="font-black text-xl text-white">SSC</span>
          <button onClick={() => setShowNotifications(true)} className="p-2 text-white relative"><Bell /></button>
        </header>

        <main className="flex-1 p-6 md:p-10">
          {viewStack.length > 1 && view !== 'dashboard' && (
            <button onClick={() => window.dispatchEvent(new CustomEvent('go-back'))} className="mb-8 flex items-center gap-2 text-gray-400 hover:text-white font-bold transition-all group">
              <ArrowRight size={20} className="group-hover:translate-x-1 transition-transform" /> عودة
            </button>
          )}
          <Suspense fallback={
            <div className="flex flex-col items-center justify-center h-[50vh] gap-4">
              <div className="w-12 h-12 border-4 border-amber-400 border-t-transparent rounded-full animate-spin"></div>
              <p className="text-gray-500 text-xs font-bold uppercase tracking-widest">جاري تحميل الواجهة...</p>
            </div>
          }>
            {renderContent()}
          </Suspense>
        </main>
      </div>

      {showNotifications && user && <NotificationPanel user={user} onClose={() => setShowNotifications(false)} />}
      <PWAPrompt user={user} />
    </div>
  );
};

export default App;

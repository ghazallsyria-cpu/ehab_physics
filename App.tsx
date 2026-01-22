
import React, { useState, useEffect, Suspense, lazy, useCallback } from 'react';
import { User, ViewState, Lesson, Quiz, StudentQuizAttempt } from './types';
import { dbService } from './services/db';
import { Bell, ArrowRight, Menu, RefreshCw, LayoutDashboard, User as UserIcon, LogOut } from 'lucide-react';
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
  
  const currentView = viewStack[viewStack.length - 1];
  const [activeSubject, setActiveSubject] = useState<'Physics' | 'Chemistry'>('Physics');
  const [activeLesson, setActiveLesson] = useState<Lesson | null>(null);
  const [activeQuiz, setActiveQuiz] = useState<Quiz | null>(null);
  const [activeAttempt, setActiveAttempt] = useState<StudentQuizAttempt | null>(null);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);

  // مستشعر الحالة - يعمل مرة واحدة عند التشغيل
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        try {
          const appUser = await dbService.getUser(firebaseUser.uid);
          if (appUser) {
            setUser(appUser);
            // توجيه تلقائي للداشبورد إذا كان المستخدم قد دخل المنصة مسبقاً
            setViewStack(prev => {
                if (prev.includes('landing') || prev.includes('auth')) return ['dashboard'];
                return prev;
            });
          }
        } catch (e) {
          console.error("Auth error:", e);
        }
      } else {
        setUser(null);
      }
      setIsAuthLoading(false);
    });
    return () => unsubscribe();
  }, []);

  // مستمع لأحداث التنقل
  useEffect(() => {
    const handleViewChange = (event: Event) => {
      const { view: newView, lesson, quiz, attempt, subject } = (event as CustomEvent).detail;
      if (newView) {
        if (newView === 'dashboard') {
          setViewStack(['dashboard']);
        } else {
          setViewStack(prev => [...prev, newView]);
        }
      }
      if (subject) setActiveSubject(subject);
      if (lesson) setActiveLesson(lesson);
      if (quiz) setActiveQuiz(quiz);
      if (attempt) setActiveAttempt(attempt);
      window.scrollTo(0, 0);
    };

    const handleGoBack = () => setViewStack(prev => prev.length > 1 ? prev.slice(0, -1) : prev);

    window.addEventListener('change-view', handleViewChange);
    window.addEventListener('go-back', handleGoBack);
    return () => {
      window.removeEventListener('change-view', handleViewChange);
      window.removeEventListener('go-back', handleGoBack);
    };
  }, []);

  const renderContent = () => {
    if (isAuthLoading) {
      return (
        <div className="flex flex-col items-center justify-center h-[70vh] gap-6">
          <div className="w-16 h-16 border-4 border-amber-400 border-t-transparent rounded-full animate-spin"></div>
          <p className="text-gray-400 font-bold animate-pulse">جاري التحقق من الهوية...</p>
        </div>
      );
    }

    if (!user && currentView !== 'landing' && currentView !== 'auth') {
      return <Auth onLogin={u => { setUser(u); setViewStack(['dashboard']); }} onBack={() => setViewStack(['landing'])} />;
    }

    switch (currentView) {
      case 'landing': return <LandingPage onStart={() => setViewStack(['auth'])} />;
      case 'auth': return <Auth onLogin={u => { setUser(u); setViewStack(['dashboard']); }} onBack={() => setViewStack(['landing'])} />;
      case 'dashboard':
        if (user?.role === 'admin') return <AdminDashboard />;
        if (user?.role === 'teacher') return <TeacherDashboard user={user} />;
        return user ? <StudentDashboard user={user} /> : <LandingPage onStart={() => setViewStack(['auth'])} />;
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

  if (currentView === 'landing' || currentView === 'auth') {
    return (
      <div className="min-h-screen bg-[#0A2540] text-right font-['Tajawal']" dir="rtl">
        <Suspense fallback={<div className="h-screen flex items-center justify-center"><RefreshCw className="animate-spin text-white" /></div>}>
          {renderContent()}
        </Suspense>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0A2540] text-right font-['Tajawal'] flex flex-col lg:flex-row relative overflow-hidden" dir="rtl">
      <Sidebar 
        currentView={currentView} 
        setView={(v, s) => window.dispatchEvent(new CustomEvent('change-view', { detail: { view: v, subject: s } }))}
        user={user!} 
        onLogout={() => signOut(auth).then(() => setViewStack(['landing']))}
        isOpen={isSidebarOpen}
        onClose={() => setIsSidebarOpen(false)}
      />
      
      <div className="flex-1 flex flex-col min-w-0 lg:mr-72 relative z-10 transition-all">
        <header className="sticky top-0 z-[40] bg-[#0A2540]/80 backdrop-blur-md border-b border-white/5 px-6 py-4 flex justify-between items-center shadow-lg">
          <div className="flex items-center gap-4">
            <button onClick={() => setIsSidebarOpen(true)} className="lg:hidden p-2 text-white bg-white/5 rounded-xl"><Menu size={20} /></button>
            {viewStack.length > 1 && currentView !== 'dashboard' ? (
              <button 
                onClick={() => window.dispatchEvent(new CustomEvent('go-back'))}
                className="flex items-center gap-2 bg-white/5 hover:bg-white/10 text-white px-4 py-2 rounded-2xl transition-all border border-white/10 group"
              >
                <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
                <span className="font-bold text-sm">رجوع</span>
              </button>
            ) : (
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-amber-400 text-black rounded-xl flex items-center justify-center shadow-lg shadow-amber-400/20"><LayoutDashboard size={20}/></div>
                <h1 className="font-black text-white text-lg tracking-tight">الرئيسية</h1>
              </div>
            )}
          </div>

          <div className="flex items-center gap-4">
             <button onClick={() => setShowNotifications(true)} className="p-2.5 text-gray-400 hover:text-white bg-white/5 rounded-xl relative transition-all">
               <Bell size={20} />
               <span className="absolute top-2 right-2 w-2 h-2 bg-amber-500 rounded-full border-2 border-[#0A2540]"></span>
             </button>
             <div className="hidden sm:flex items-center gap-3 bg-white/5 p-1.5 pr-4 rounded-2xl border border-white/5">
                <div className="text-right">
                    <p className="text-[10px] font-black text-white leading-none">{user?.name.split(' ')[0]}</p>
                    <p className="text-[8px] text-gray-500 font-bold uppercase mt-1">{user?.role}</p>
                </div>
                <div className="w-8 h-8 rounded-xl bg-black/40 flex items-center justify-center text-xs border border-white/10 text-amber-400 font-black">
                    {user?.name?.charAt(0)}
                </div>
             </div>
          </div>
        </header>

        <main className="flex-1 p-6 md:p-10 max-w-7xl mx-auto w-full">
          <Suspense fallback={
            <div className="flex flex-col items-center justify-center h-[50vh] gap-4">
              <div className="w-12 h-12 border-4 border-amber-400 border-t-transparent rounded-full animate-spin"></div>
              <p className="text-gray-500 text-xs font-bold uppercase tracking-widest">جاري تحميل المحتوى...</p>
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

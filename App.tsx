
import React, { useState, useEffect, Suspense, lazy } from 'react';
import { User, ViewState, Lesson, Quiz, StudentQuizAttempt, AppBranding, MaintenanceSettings } from './types';
import { dbService } from './services/db';
import { Bell, ArrowRight, Menu, RefreshCw, LayoutDashboard, User as UserIcon, LogOut, ShieldAlert } from 'lucide-react';
import { auth } from './services/firebase';
import { onAuthStateChanged, signOut } from 'firebase/auth';

// Core Components
import Sidebar from './components/Sidebar';
import PWAPrompt from './components/PWAPrompt';
import NotificationPanel from './components/NotificationPanel';
import MaintenanceMode from './components/MaintenanceMode';
import FloatingNav from './components/FloatingNav';

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
const AdminManager = lazy(() => import('./components/AdminManager'));
const AdminForumPostManager = lazy(() => import('./components/AdminForumPostManager'));
const FirestoreRulesFixer = lazy(() => import('./components/FirestoreRulesFixer'));
const AdminPaymentManager = lazy(() => import('./components/AdminPaymentManager'));
const AdminContentManager = lazy(() => import('./components/AdminContentManager'));
const AdminLabManager = lazy(() => import('./components/AdminLabManager'));
const AdminRecommendationManager = lazy(() => import('./components/AdminRecommendationManager'));

const App: React.FC = () => {
  const [user, setUser] = useState<User | null>(null);
  const [isAuthLoading, setIsAuthLoading] = useState(true);
  const [viewStack, setViewStack] = useState<ViewState[]>(['landing']);
  const [branding, setBranding] = useState<AppBranding>({ 
    logoUrl: 'https://spxlxypbosipfwbijbjk.supabase.co/storage/v1/object/public/assets/1769130153314_IMG_2848.png', 
    appName: 'المركز السوري للعلوم' 
  });
  
  const [maintenance, setMaintenance] = useState<MaintenanceSettings | null>(null);
  const [isMaintenanceLoading, setIsMaintenanceLoading] = useState(true);
  
  const currentView = viewStack[viewStack.length - 1];
  const [activeSubject, setActiveSubject] = useState<'Physics' | 'Chemistry'>('Physics');
  const [activeLesson, setActiveLesson] = useState<Lesson | null>(null);
  const [activeQuiz, setActiveQuiz] = useState<Quiz | null>(null);
  const [activeAttempt, setActiveAttempt] = useState<StudentQuizAttempt | null>(null);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);

  useEffect(() => {
    // 🔗 1. مراقبة لحظية لوضع الصيانة (Real-time Sync)
    const unsubscribeMaintenance = dbService.subscribeToMaintenance((settings) => {
        setMaintenance(settings);
        setIsMaintenanceLoading(false);
    });

    // 🔑 2. معالجة الرابط السري ?admin=true
    const searchParams = new URLSearchParams(window.location.search);
    if (searchParams.get('admin') === 'true') {
        localStorage.setItem('ssc_bypass_key', 'true');
        // إزالة البارامتر من الرابط لجمالية الموقع
        window.history.replaceState({}, document.title, window.location.pathname);
    }

    dbService.getAppBranding().then(setBranding);
    
    let unsubscribeUser: (() => void) | null = null;
    const unsubscribeAuth = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        unsubscribeUser = dbService.subscribeToUser(firebaseUser.uid, (updatedUser) => {
            if (updatedUser) {
                setUser(updatedUser);
            }
            setIsAuthLoading(false);
        });
      } else {
        if (unsubscribeUser) unsubscribeUser();
        setUser(null);
        setIsAuthLoading(false);
      }
    });

    return () => {
        unsubscribeAuth();
        unsubscribeMaintenance();
        if (unsubscribeUser) unsubscribeUser();
    };
  }, []);

  useEffect(() => {
    const handleViewChange = (event: Event) => {
      const { view: newView, lesson, quiz, attempt, subject } = (event as CustomEvent).detail;
      if (newView) {
        if (newView === 'dashboard') setViewStack(['dashboard']);
        else setViewStack(prev => [...prev, newView]);
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
    // 🚧 فحص الصيانة - الأولوية القصوى (Strict Lockdown)
    const isBypassActive = localStorage.getItem('ssc_bypass_key') === 'true';
    
    if (maintenance?.isMaintenanceActive) {
        // يسمح بالمرور فقط للمدير، أو المعلم إذا كان الإعداد مفعلاً، أو من يملك مفتاح الرابط السري
        const isPrivileged = user?.role === 'admin' || (user?.role === 'teacher' && maintenance.allowTeachers);
        
        if (!isPrivileged && !isBypassActive) {
            return <MaintenanceMode />;
        }
    }

    if (isAuthLoading || isMaintenanceLoading) return (
      <div className="flex flex-col items-center justify-center h-[70vh] gap-6">
        <RefreshCw className="w-16 h-16 text-amber-400 animate-spin" />
        <p className="text-gray-400 font-black animate-pulse">تأمين الاتصال السحابي...</p>
      </div>
    );

    if (!user && currentView !== 'landing' && currentView !== 'auth') {
      return <Auth onLogin={u => { setUser(u); setViewStack(['dashboard']); }} onBack={() => setViewStack(['landing'])} />;
    }

    switch (currentView) {
      case 'landing': return <LandingPage onStart={() => setViewStack(['auth'])} />;
      case 'auth': return <Auth onLogin={u => { setUser(u); setViewStack(['dashboard']); }} onBack={() => setViewStack(['landing'])} />;
      case 'dashboard':
        if (user?.role === 'admin') return <AdminDashboard />;
        if (user?.role === 'teacher') return <TeacherDashboard user={user} />;
        return user ? <StudentDashboard user={user} /> : null;
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
      case 'admin-managers': return <AdminManager />;
      case 'admin-forum-posts': return <AdminForumPostManager />;
      case 'admin-security-fix': return <FirestoreRulesFixer />;
      case 'admin-payment-manager': return <AdminPaymentManager />;
      case 'admin-content': return <AdminContentManager />;
      case 'admin-labs': return <AdminLabManager />;
      case 'admin-recommendations': return <AdminRecommendationManager />;
      default: return user ? <StudentDashboard user={user} /> : <LandingPage onStart={() => setViewStack(['auth'])} />;
    }
  };

  if (currentView === 'landing' || currentView === 'auth') {
    return (
      <div className="min-h-screen bg-[#000000] text-right font-['Tajawal']" dir="rtl">
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
        branding={branding}
        activeSubject={activeSubject}
        onLogout={() => {
            // تنظيف مفتاح العبور عند تسجيل الخروج
            localStorage.removeItem('ssc_bypass_key'); 
            signOut(auth).then(() => setViewStack(['landing']));
        }}
        isOpen={isSidebarOpen}
        onClose={() => setIsSidebarOpen(false)}
      />
      
      <div className={`flex-1 flex flex-col min-w-0 transition-all duration-300 relative z-10 lg:mr-72`}>
        <header className="sticky top-0 z-[100] bg-[#0A2540]/80 backdrop-blur-xl border-b border-white/5 px-6 py-4 flex justify-between items-center shadow-2xl">
          <div className="flex items-center gap-4">
            <button onClick={() => setIsSidebarOpen(true)} className="lg:hidden p-3 text-white bg-white/5 rounded-2xl hover:bg-white/10 transition-all"><Menu size={24} /></button>
            {viewStack.length > 1 && currentView !== 'dashboard' ? (
              <button onClick={() => window.dispatchEvent(new CustomEvent('go-back'))} className="flex items-center gap-2 bg-white/5 hover:bg-white/10 text-white px-5 py-2.5 rounded-[20px] transition-all border border-white/10 group">
                <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
                <span className="font-bold text-sm">رجوع</span>
              </button>
            ) : (
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center overflow-hidden border border-white/10 shadow-lg">
                    {branding.logoUrl ? <img src={branding.logoUrl} className="w-full h-full object-contain p-1" /> : <LayoutDashboard size={20} className="text-amber-400" />}
                </div>
                <h1 className="font-black text-white text-lg tracking-tight uppercase">{branding.appName}</h1>
              </div>
            )}
          </div>

          <div className="flex items-center gap-4">
             <button onClick={() => setShowNotifications(true)} className="p-3 text-gray-400 hover:text-white bg-white/5 rounded-2xl relative transition-all border border-white/5"><Bell size={20} /><span className="absolute top-2.5 right-2.5 w-2 h-2 bg-amber-500 rounded-full border-2 border-[#0A2540] animate-pulse"></span></button>
             <div className="hidden sm:flex items-center gap-3 bg-black/20 p-2 pr-5 rounded-3xl border border-white/5 shadow-inner">
                <div className="text-right">
                    <p className="text-[10px] font-black text-white leading-none truncate max-w-[80px]">{user?.name}</p>
                    <p className="text-[8px] text-amber-500 font-bold uppercase mt-1.5">{user?.role}</p>
                </div>
                <div className="w-10 h-10 rounded-2xl bg-amber-400 flex items-center justify-center text-black font-black shadow-lg">{user?.name?.charAt(0)}</div>
             </div>
          </div>
        </header>

        <main className="flex-1 p-4 md:p-8 lg:p-12 w-full max-w-screen-2xl mx-auto overflow-x-hidden relative">
          <Suspense fallback={<div className="flex flex-col items-center justify-center h-[50vh] gap-4"><RefreshCw className="w-12 h-12 text-amber-400 animate-spin" /><p className="text-gray-500 text-xs font-bold uppercase">جاري عرض المحتوى...</p></div>}>
            {renderContent()}
          </Suspense>
          
          {user?.role === 'student' && <FloatingNav />}
        </main>
      </div>

      {showNotifications && user && <NotificationPanel user={user} onClose={() => setShowNotifications(false)} />}
      <PWAPrompt user={user} logoUrl={branding.logoUrl} />
    </div>
  );
};

export default App;

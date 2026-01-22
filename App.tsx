
import React, { useState, useEffect, Suspense, lazy } from 'react';
import { User, ViewState, Lesson, Quiz, StudentQuizAttempt } from './types';
import { dbService } from './services/db';
import { Bell, ArrowRight, Menu, RefreshCw, ChevronLeft, LayoutDashboard, User as UserIcon, LogOut } from 'lucide-react';
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
const PaymentCertificate = lazy(() => import('./components/PaymentCertificate'));

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
      if (newView) {
        // إذا كانت الوجهة هي الداشبورد، نصفر المكدس لضمان عدم وجود مسارات معلقة
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
            // توجيه تلقائي للداشبورد إذا كان المستخدم قد سجل دخوله وكان في صفحة الهبوط
            if (viewStack[0] === 'landing' || viewStack[0] === 'auth') {
              setViewStack(['dashboard']);
            }
          }
        } catch (e) {
          console.error("Auth sync error:", e);
        }
      } else {
        setUser(null);
      }
      setIsAuthLoading(false);
    });
    return () => unsubscribe();
  }, [viewStack]);

  const getViewTitle = (v: ViewState): string => {
    switch (v) {
      case 'curriculum': return 'المناهج الدراسية';
      case 'lesson': return activeLesson?.title || 'عرض الدرس';
      case 'quiz_center': return 'مركز الاختبارات';
      case 'quiz_player': return activeQuiz?.title || 'الاختبار جاري';
      case 'attempt_review': return 'مراجعة المحاولة';
      case 'discussions': return 'ساحة النقاش';
      case 'ai-chat': return 'المساعد الذكي';
      case 'virtual-lab': return 'المختبر الافتراضي';
      case 'live-sessions': return 'الجلسات المباشرة';
      case 'subscription': return 'باقات الاشتراك';
      case 'recommendations': return 'توصيات التعلم';
      case 'journey-map': return 'خريطة الرحلة';
      case 'resources-center': return 'المكتبة الرقمية';
      case 'reports': return 'تقارير الأداء';
      case 'admin-students': return 'إدارة الطلاب';
      case 'admin-teachers': return 'إدارة المعلمين';
      case 'admin-curriculum': return 'إدارة المحتوى';
      case 'admin-quizzes': return 'إدارة الاختبارات';
      case 'admin-financials': return 'التقارير المالية';
      case 'admin-settings': return 'إعدادات النظام';
      default: return 'الرئيسية';
    }
  };

  const renderContent = () => {
    if (isAuthLoading) {
      return (
        <div className="flex flex-col items-center justify-center h-[60vh] gap-6">
          <div className="w-16 h-16 border-4 border-amber-400 border-t-transparent rounded-full animate-spin"></div>
          <p className="text-gray-400 font-bold animate-pulse">جاري تحضير الواجهة...</p>
        </div>
      );
    }

    // إذا لم يكن المستخدم مسجلاً، دائماً اظهر صفحة الهبوط أو الدخول
    if (!user && view !== 'landing' && view !== 'auth') {
        return <LandingPage onStart={() => setViewStack(['auth'])} />;
    }

    switch (view) {
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
      case 'payment-certificate': return user && activeAttempt ? <PaymentCertificate user={user} invoice={activeAttempt as any} /> : null;
      default: 
        // الحالة الافتراضية لمنع الصفحات البيضاء
        return user ? <StudentDashboard user={user} /> : <LandingPage onStart={() => setViewStack(['auth'])} />;
    }
  };

  // تنسيق الصفحات العامة (Landing & Auth)
  if (view === 'landing' || view === 'auth' || !user) {
    return (
      <div className="min-h-screen bg-[#0A2540] text-right font-['Tajawal']" dir="rtl">
        <Suspense fallback={<div className="h-screen flex items-center justify-center"><RefreshCw className="animate-spin text-white" /></div>}>
          {renderContent()}
        </Suspense>
      </div>
    );
  }

  // تنسيق الصفحات الداخلية للمنصة بعد تسجيل الدخول
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
        {/* شريط الملاحة العلوي الثابت - يحتوي على زر الرجوع */}
        <header className="sticky top-0 z-[40] bg-[#0A2540]/80 backdrop-blur-md border-b border-white/5 px-6 py-4 flex justify-between items-center shadow-lg">
          <div className="flex items-center gap-4">
            <button onClick={() => setIsSidebarOpen(true)} className="lg:hidden p-2 text-white bg-white/5 rounded-xl"><Menu size={20} /></button>
            
            {/* زر الرجوع الذكي */}
            {viewStack.length > 1 && view !== 'dashboard' ? (
              <button 
                onClick={() => window.dispatchEvent(new CustomEvent('go-back'))}
                className="flex items-center gap-2 bg-white/5 hover:bg-white/10 text-white px-4 py-2 rounded-2xl transition-all border border-white/10 group"
              >
                <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
                <span className="font-bold text-sm">رجوع</span>
              </button>
            ) : (
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-amber-400 text-black rounded-xl flex items-center justify-center shadow-lg"><LayoutDashboard size={20}/></div>
                <h1 className="font-black text-white text-lg tracking-tight uppercase">الرئيسية</h1>
              </div>
            )}
          </div>

          <div className="flex items-center gap-4">
             {/* عنوان الصفحة الحالية */}
             {view !== 'dashboard' && (
                <h2 className="hidden md:block text-gray-400 text-xs font-bold uppercase tracking-widest border-r border-white/10 pr-4">
                    {getViewTitle(view)}
                </h2>
             )}
             
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
                    {user?.name.charAt(0)}
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

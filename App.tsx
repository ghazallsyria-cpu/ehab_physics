
import React, { useState, useEffect, Suspense, lazy } from 'react';
import { User, ViewState, Lesson, QuizAttempt, Curriculum, Invoice } from './types';
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
const AdminQuestionManager = lazy(() => import('./components/AdminQuestionManager'));
const AdminFinancials = lazy(() => import('./components/AdminFinancials'));
const QuizPerformance = lazy(() => import('./components/QuizPerformance'));
const AdminSettings = lazy(() => import('./components/AdminSettings'));
const PhysicsJourneyMap = lazy(() => import('./components/PhysicsJourneyMap'));
const AdminLiveSessions = lazy(() => import('./components/AdminLiveSessions'));


const App: React.FC = () => {
  const [user, setUser] = useState<User | null>(null);
  const [isAuthLoading, setIsAuthLoading] = useState(true);
  
  const [view, setView] = useState<ViewState>(() => {
    const path = window.location.pathname.replace('/', '');
    if (['landing', 'privacy-policy'].includes(path)) return path as ViewState;
    return 'dashboard';
  });
  
  const [activeSubject, setActiveSubject] = useState<'Physics' | 'Chemistry'>('Physics');
  const [activeLesson, setActiveLesson] = useState<Lesson | null>(null);
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
                const localUser = await dbService.getUser(localUid);
                if (localUser) setUser(localUser);
            }
            setIsAuthLoading(false);
        }
    };

    checkSession();

    return () => {
        if (unsubscribe) unsubscribe();
    };
  }, []);

  useEffect(() => {
    const handleChangeView = (e: any) => {
      if (e.detail.view) setView(e.detail.view);
      if (e.detail.subject) setActiveSubject(e.detail.subject);
      if (e.detail.lesson) setActiveLesson(e.detail.lesson);
      
      setIsSidebarOpen(false);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    };
    window.addEventListener('change-view', handleChangeView);
    return () => window.removeEventListener('change-view', handleChangeView);
  }, []);
  
  const handleLogout = () => {
    if (auth) {
        signOut(auth).catch(error => console.error('Sign out error', error));
    }
    sessionStorage.removeItem('ssc_active_uid');
    setUser(null);
    setView('landing');
  };

  const renderContent = () => {
    if (isAuthLoading) {
      return (
        <div className="w-full h-full flex items-center justify-center">
          <div className="w-16 h-16 border-4 border-amber-500 border-t-transparent rounded-full animate-spin"></div>
        </div>
      );
    }
    
    if (view === 'landing') return <LandingPage onStart={() => setView('dashboard')} />;
    if (view === 'privacy-policy') { return <div className="text-white p-8">Privacy Policy... <button onClick={() => setView('landing')}>Back</button></div>; }

    if (!user) return <Auth onLogin={(u) => { setUser(u); setView('dashboard'); }} onBack={() => setView('landing')} />;

    switch (view) {
      case 'dashboard':
        if (user.role === 'admin') return <AdminDashboard />;
        if (user.role === 'teacher') return <TeacherDashboard user={user} />;
        return <StudentDashboard user={user} />;
      
      case 'curriculum': return <CurriculumBrowser user={user} subject={activeSubject} />;
      case 'lesson': return activeLesson ? <LessonViewer user={user} lesson={activeLesson} /> : <CurriculumBrowser user={user} subject={activeSubject} />;
      case 'journey-map': return <PhysicsJourneyMap user={user} />;
      
      case 'quiz_center': return <QuizCenter user={user} onBack={() => setView('dashboard')} />;

      case 'discussions': return <Forum user={user} onAskAI={(q) => { setView('ai-chat'); }} />;
      
      case 'subscription': return <BillingCenter user={user} onUpdateUser={setUser} onBack={() => setView('dashboard')} onViewCertificate={(invoice) => { setActiveInvoice(invoice); setView('payment-certificate'); }} />;
      case 'payment-certificate': return activeInvoice ? <PaymentCertificate user={user} invoice={activeInvoice} onBack={() => setView('dashboard')} /> : <BillingCenter user={user} onUpdateUser={setUser} onBack={() => setView('dashboard')} onViewCertificate={(invoice) => { setActiveInvoice(invoice); setView('payment-certificate'); }}/>;
      
      case 'ai-chat': return <AiTutor grade={user.grade || '12'} subject={activeSubject} />;
      
      case 'gamification': return <GamificationCenter user={user} onUpdateUser={setUser} />;
      case 'recommendations': return <Recommendations user={user} />;

      case 'virtual-lab': return <LabHub user={user} />;
      
      case 'live-sessions': return <LiveSessions user={user} />;
      case 'reports': return <ProgressReport user={user} attempts={[]} onBack={() => setView('dashboard')} />;
      case 'quiz-performance': return <QuizPerformance user={user} />;
      
      case 'help-center': return <HelpCenter />;

      case 'admin-curriculum': return <AdminCurriculumManager />;
      case 'admin-students': return <AdminStudentManager />;
      case 'admin-teachers': return <AdminTeacherManager />;
      case 'admin-questions': return <AdminQuestionManager />;
      case 'admin-financials': return <AdminFinancials />;
      case 'admin-settings': return <AdminSettings />;
      case 'admin-live-sessions': return <AdminLiveSessions />;
      
      default: return <StudentDashboard user={user} />;
    }
  };

  const renderLoader = () => (
    <div className="w-full h-full flex items-center justify-center">
      <div className="w-16 h-16 border-4 border-amber-500 border-t-transparent rounded-full animate-spin"></div>
    </div>
  );

  return (
    <div className="min-h-screen flex relative overflow-hidden bg-geometric-pattern">
      {view !== 'landing' && view !== 'privacy-policy' && user && (
        <Sidebar 
          currentView={view} 
          setView={(v, s) => { setView(v); if(s) setActiveSubject(s); }} 
          user={user} 
          onLogout={handleLogout} 
          isOpen={isSidebarOpen}
          onClose={() => setIsSidebarOpen(false)}
        />
      )}
      <div className={`flex-1 flex flex-col ${view !== 'landing' && view !== 'privacy-policy' && user ? 'lg:mr-72' : ''} transition-all duration-500`}>
        {view !== 'landing' && view !== 'privacy-policy' && user && (
          <header className="px-6 py-4 md:px-10 md:py-6 flex justify-between items-center glass-panel sticky top-0 z-40 backdrop-blur-xl border-b border-white/5 bg-blue-950/80">
            <div className="flex items-center gap-6">
              <button onClick={() => setIsSidebarOpen(true)} className="lg:hidden text-white p-2 -ml-2">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="3" y1="12" x2="21" y2="12"></line><line x1="3" y1="6" x2="21" y2="6"></line><line x1="3" y1="18" x2="21" y2="18"></line></svg>
              </button>
              <h2 className="text-base md:text-lg font-bold uppercase tracking-tight text-white flex items-center gap-3">
                <span className="text-amber-400">⚛️</span> 
                <span className="hidden md:inline">المركز السوري للعلوم - الكويت</span>
                <span className="md:hidden">SSC Kuwait</span>
              </h2>
            </div>
            <div className="flex items-center gap-4">
              <div className="hidden sm:flex bg-blue-900/50 border border-white/10 rounded-full px-5 py-1.5 items-center gap-3">
                 <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{view.replace(/[-_]/g, ' ')}</span>
                 <div className="w-1.5 h-1.5 bg-amber-400 rounded-full animate-pulse shadow-[0_0_10px_#fbbf24]"></div>
              </div>
              <button onClick={() => setShowNotifications(true)} className="relative text-slate-400 hover:text-white transition-colors">
                <Bell size={20} />
                <span className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full border-2 border-blue-950/80"></span>
              </button>
            </div>
          </header>
        )}
        <main className={`flex-1 ${view === 'landing' ? '' : 'p-4 md:p-10'} pb-safe`}>
          <Suspense fallback={renderLoader()}>
            {renderContent()}
          </Suspense>
        </main>
      </div>
      {user && <PWAPrompt user={user} />}
      {user && showNotifications && <NotificationPanel user={user} onClose={() => setShowNotifications(false)} />}
    </div>
  );
};

export default App;

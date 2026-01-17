
import React, { useState, useEffect } from 'react';
import { User, ViewState, Lesson, QuizAttempt, Curriculum } from './types';
import { dbService } from './services/db';
import { Bell, Menu, X as CloseIcon } from 'lucide-react';
import { auth } from './services/firebase';
import { onAuthStateChanged, signOut } from 'firebase/auth';

// Core Components
import Sidebar from './components/Sidebar';
import LandingPage from './components/LandingPage';
import Auth from './components/Auth';
import StudentDashboard from './components/StudentDashboard';
import AdminDashboard from './components/AdminDashboard';
import TeacherDashboard from './components/TeacherDashboard';
import AiTutor from './components/PhysicsChat';
import PWAPrompt from './components/PWAPrompt';
import NotificationPanel from './components/NotificationPanel';

// Feature Components
import CurriculumBrowser from './components/CurriculumBrowser';
import LessonViewer from './components/LessonViewer';
import QuizCenter from './components/QuizCenter';
import SubscriptionCenter from './components/SubscriptionCenter';
import Forum from './components/Forum';
import GamificationCenter from './components/GamificationCenter';
import Recommendations from './components/Recommendations';
import LabHub from './components/LabHub';
import LiveSessions from './components/LiveSessions';
import ProgressReport from './components/ProgressReport';
import HelpCenter from './components/HelpCenter';
import AdminCurriculumManager from './components/AdminCurriculumManager';
import AdminStudentManager from './components/AdminStudentManager';
import AdminTeacherManager from './components/AdminTeacherManager';
import AdminQuestionManager from './components/AdminQuestionManager';
import AdminFinancials from './components/AdminFinancials';
import QuizPerformance from './components/QuizPerformance';

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
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  
  // Session Persistence
  useEffect(() => {
    let unsubscribe: any;
    if (auth) {
      unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
        if (firebaseUser) {
          const appUser = await dbService.getUser(firebaseUser.uid);
          if (appUser) {
            setUser(appUser);
          } else {
            setUser(null);
          }
        } else {
          setUser(null);
        }
        setIsAuthLoading(false);
      });
    } else {
      setIsAuthLoading(false);
    }
    return () => unsubscribe?.();
  }, []);

  // View Change Listener
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
  
  const handleLogout = async () => {
    if (auth) await signOut(auth);
    setUser(null);
    setView('landing');
  };

  const renderContent = () => {
    if (isAuthLoading) {
      return (
        <div className="w-full h-[80vh] flex flex-col items-center justify-center gap-6">
          <div className="w-16 h-16 border-4 border-sky-500 border-t-transparent rounded-full animate-spin"></div>
          <p className="text-sky-400 font-bold animate-pulse uppercase tracking-[0.2em]">SSC Engine Loading...</p>
        </div>
      );
    }
    
    if (view === 'landing') return <LandingPage onStart={() => setView('dashboard')} />;
    if (!user) return <Auth onLogin={(u) => { setUser(u); setView('dashboard'); }} onBack={() => setView('landing')} />;

    switch (view) {
      case 'dashboard':
        if (user.role === 'admin') return <AdminDashboard />;
        if (user.role === 'teacher') return <TeacherDashboard user={user} />;
        return <StudentDashboard user={user} />;
      
      case 'curriculum': return <CurriculumBrowser user={user} subject={activeSubject} />;
      case 'lesson': return activeLesson ? <LessonViewer user={user} lesson={activeLesson} /> : <CurriculumBrowser user={user} subject={activeSubject} />;
      case 'quiz_center': return <QuizCenter user={user} />;
      case 'discussions': return <Forum user={user} onAskAI={() => setView('ai-chat')} />;
      case 'subscription': return <SubscriptionCenter user={user} onUpdateUser={setUser} />;
      case 'ai-chat': return <AiTutor grade={user.grade || '12'} subject={activeSubject} />;
      case 'gamification': return <GamificationCenter user={user} onUpdateUser={setUser} />;
      case 'recommendations': return <Recommendations user={user} />;
      case 'virtual-lab': return <LabHub user={user} />;
      case 'live-sessions': return <LiveSessions />;
      case 'reports': return <ProgressReport user={user} attempts={[]} onBack={() => setView('dashboard')} />;
      case 'quiz-performance': return <QuizPerformance user={user} />;
      case 'help-center': return <HelpCenter />;
      case 'admin-curriculum': return <AdminCurriculumManager />;
      case 'admin-students': return <AdminStudentManager />;
      case 'admin-teachers': return <AdminTeacherManager />;
      case 'admin-questions': return <AdminQuestionManager />;
      case 'admin-financials': return <AdminFinancials />;
      default: return <StudentDashboard user={user} />;
    }
  };

  return (
    <div className="min-h-screen flex relative overflow-hidden bg-[#0f172a]" dir="rtl">
      {view !== 'landing' && user && (
        <Sidebar 
          currentView={view} 
          setView={(v, s) => { setView(v); if(s) setActiveSubject(s); }} 
          user={user} 
          onLogout={handleLogout} 
          isOpen={isSidebarOpen}
          onClose={() => setIsSidebarOpen(false)}
        />
      )}
      <div className={`flex-1 flex flex-col ${view !== 'landing' && user ? 'lg:mr-72' : ''} transition-all duration-500`}>
        {view !== 'landing' && user && (
          <header className="px-6 py-4 md:px-10 md:py-6 flex justify-between items-center glass-panel sticky top-0 z-40 backdrop-blur-xl border-b border-white/5 bg-slate-900/80">
            <div className="flex items-center gap-6">
              <button onClick={() => setIsSidebarOpen(true)} className="lg:hidden text-white p-2">
                <Menu size={24} />
              </button>
              <h2 className="text-base md:text-xl font-black text-white flex items-center gap-3">
                <span className="text-sky-400">⚛️</span> 
                <span>المركز السوري للعلوم</span>
              </h2>
            </div>
            <div className="flex items-center gap-4">
              <div className="hidden sm:flex bg-slate-800/50 border border-white/10 rounded-full px-5 py-1.5 items-center gap-3">
                 <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{view.replace(/[-_]/g, ' ')}</span>
                 <div className="w-1.5 h-1.5 bg-sky-400 rounded-full animate-pulse shadow-[0_0_10px_#38bdf8]"></div>
              </div>
              <button onClick={() => setShowNotifications(true)} className="relative text-slate-400 hover:text-white transition-colors">
                <Bell size={20} />
                <span className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full border-2 border-slate-900/80"></span>
              </button>
            </div>
          </header>
        )}
        <main className={`flex-1 ${view === 'landing' ? '' : 'p-4 md:p-10'} pb-safe`}>
          {renderContent()}
        </main>
      </div>
      {user && <PWAPrompt user={user} />}
      {user && showNotifications && <NotificationPanel user={user} onClose={() => setShowNotifications(false)} />}
    </div>
  );
};

export default App;


import React, { useState, useEffect } from 'react';
import { User, ViewState, Lesson, QuizAttempt } from './types';
import { dbService } from './services/db';
import { Bell } from 'lucide-react';
import { auth } from './services/firebase';
import { onAuthStateChanged, signOut } from 'firebase/auth';

// Core Components
import Sidebar from './components/Sidebar';
import LandingPage from './components/LandingPage';
import Auth from './components/Auth';
import StudentDashboard from './components/StudentDashboard';
import AdminDashboard from './components/AdminDashboard';
import TeacherDashboard from './components/TeacherDashboard';
import PhysicsChat from './components/PhysicsChat';
import PWAPrompt from './components/PWAPrompt';
import NotificationPanel from './components/NotificationPanel';

// New Structure Components
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

const App: React.FC = () => {
  const [user, setUser] = useState<User | null>(null);
  const [isAuthLoading, setIsAuthLoading] = useState(true);
  
  const [view, setView] = useState<ViewState>(() => {
    const path = window.location.pathname.replace('/', '');
    if (['landing', 'privacy-policy'].includes(path)) return path as ViewState;
    return 'dashboard';
  });

  const [activeLesson, setActiveLesson] = useState<Lesson | null>(null);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  
  // Session Persistence Check
  useEffect(() => {
    let unsubscribe: Function | undefined;

    const checkSession = async () => {
        if (auth) {
            unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
                if (firebaseUser) {
                    const appUser = await dbService.getUser(firebaseUser.uid);
                    if (appUser) {
                        setUser(appUser);
                    } else {
                        // User exists in Firebase but not our DB, force log out
                        await signOut(auth);
                        setUser(null);
                    }
                } else {
                    setUser(null);
                }
                setIsAuthLoading(false);
            });
        } else {
            // Fallback for local dev without Firebase
            const localUid = sessionStorage.getItem('ssc_active_uid');
            if (localUid) {
                const localUser = await dbService.getUser(localUid);
                if (localUser) {
                    setUser(localUser);
                }
            }
            setIsAuthLoading(false);
        }
    };

    checkSession();

    return () => {
        if (unsubscribe) {
            unsubscribe();
        }
    };
  }, []);

  // Global Event Listener for View Changes
  useEffect(() => {
    const handleChangeView = (e: any) => {
      if (e.detail.view) setView(e.detail.view);
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
    // Auth loading state
    if (isAuthLoading) {
      return (
        <div className="w-full h-full flex items-center justify-center">
          <div className="w-16 h-16 border-4 border-sky-500 border-t-transparent rounded-full animate-spin"></div>
        </div>
      );
    }
    
    // Public Views
    if (view === 'landing') return <LandingPage onStart={() => setView('dashboard')} />;
    if (view === 'privacy-policy') { return <div className="text-white p-8">Privacy Policy... <button onClick={() => setView('landing')}>Back</button></div>; }

    // Auth Wall
    if (!user) return <Auth onLogin={(u) => { setUser(u); setView('dashboard'); }} onBack={() => setView('landing')} />;

    // Authenticated Views
    switch (view) {
      case 'dashboard':
        if (user.role === 'admin') return <AdminDashboard />;
        if (user.role === 'teacher') return <TeacherDashboard user={user} />;
        return <StudentDashboard user={user} />;
      
      case 'curriculum': return <CurriculumBrowser user={user} />;
      case 'lesson': return activeLesson ? <LessonViewer user={user} lesson={activeLesson} /> : <CurriculumBrowser user={user} />;
      
      case 'quiz_center': return <QuizCenter user={user} />;

      case 'discussions': return <Forum user={user} onAskAI={(q) => { setView('ai-chat'); /* pass question */ }} />;
      
      case 'subscription': return <SubscriptionCenter user={user} onUpdateUser={setUser} />;
      
      case 'ai-chat': return <PhysicsChat grade={user.grade || '12'} />;
      
      case 'gamification': return <GamificationCenter user={user} onUpdateUser={setUser} />;
      case 'recommendations': return <Recommendations user={user} />;

      case 'virtual-lab': return <LabHub user={user} />;
      case 'live-sessions': return <LiveSessions />;
      case 'reports': return <ProgressReport user={user} attempts={[]} onBack={() => setView('dashboard')} />;
      
      case 'help-center': return <HelpCenter />;

      // Admin specific views
      case 'admin-curriculum': return <AdminCurriculumManager />;
      
      default: return <StudentDashboard user={user} />;
    }
  };

  return (
    <div className="min-h-screen flex relative overflow-hidden bg-[#0f172a]">
      {view !== 'landing' && view !== 'privacy-policy' && user && (
        <Sidebar 
          currentView={view} 
          setView={(v) => { setView(v); }} 
          user={user} 
          onLogout={handleLogout} 
          isOpen={isSidebarOpen}
          onClose={() => setIsSidebarOpen(false)}
        />
      )}
      <div className={`flex-1 flex flex-col ${view !== 'landing' && view !== 'privacy-policy' && user ? 'lg:mr-72' : ''} transition-all duration-500`}>
        {view !== 'landing' && view !== 'privacy-policy' && user && (
          <header className="px-6 py-4 md:px-10 md:py-6 flex justify-between items-center glass-panel sticky top-0 z-40 backdrop-blur-xl border-b border-white/5 bg-slate-900/80">
            <div className="flex items-center gap-6">
              <button onClick={() => setIsSidebarOpen(true)} className="lg:hidden text-white p-2 -ml-2">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="3" y1="12" x2="21" y2="12"></line><line x1="3" y1="6" x2="21" y2="6"></line><line x1="3" y1="18" x2="21" y2="18"></line></svg>
              </button>
              <h2 className="text-base md:text-lg font-bold uppercase tracking-tight text-white flex items-center gap-3">
                <span className="text-sky-400">⚛️</span> 
                <span className="hidden md:inline">المركز السوري للعلوم</span>
                <span className="md:hidden">SSC</span>
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

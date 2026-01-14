
import React, { useState, useEffect } from 'react';
import { User, ViewState, Invoice, PhysicsExperiment } from './types';
import { PHYSICS_TOPICS, INITIAL_EXPERIMENTS } from './constants';

// Components
import Sidebar from './components/Sidebar';
import StudentDashboard from './components/StudentDashboard';
import LessonViewer from './components/LessonViewer';
import ExamCenter from './components/ExamCenter';
import AdminDashboard from './components/AdminDashboard';
import CurriculumMap from './components/CurriculumMap';
import LandingPage from './components/LandingPage';
import Auth from './components/Auth';
import ParentPortal from './components/ParentPortal';
import BillingCenter from './components/BillingCenter';
import PaymentCertificate from './components/PaymentCertificate';
import QuestionBank from './components/QuestionBank';
import PhysicsJourneyMap from './components/PhysicsJourneyMap';
import ResourcesCenter from './components/ResourcesCenter';
import UniversityBridge from './components/UniversityBridge';
import TeacherDirectory from './components/TeacherDirectory';
import Forum from './components/Forum';

// Advanced Features & Tools
import PhysicsChat from './components/PhysicsChat';
import ImageGenerator from './components/ImageGenerator';
import PhysicsVeo from './components/PhysicsVeo';
import PhysicsSolver from './components/PhysicsSolver';
import EquationSolver from './components/EquationSolver';
import PhysicsGame from './components/PhysicsGame';
import ARLab from './components/ARLab';
import FutureLabs from './components/FutureLabs';
import ScientificArticles from './components/ScientificArticles';
import VirtualLab from './components/VirtualLab';

// Advanced & Tool Components
import ProgressReport from './components/ProgressReport';
import LiveSessions from './components/LiveSessions';
import StudyGroups from './components/StudyGroups';
import TodoList from './components/TodoList';
import TeacherJoin from './components/TeacherJoin';

import { dbService } from './services/db';

const App: React.FC = () => {
  const [user, setUser] = useState<User | null>(null);
  
  // Initialize view based on URL, defaulting to dashboard
  const [view, setView] = useState<ViewState>(() => {
    const path = window.location.pathname.replace('/', '');
    // Handle specific public routes
    if (path === 'landing') return 'landing';
    if (path === 'privacy-policy') return 'privacy-policy';
    if (path === 'teacher-join') return 'teacher-join';
    
    // Default to dashboard for root or any other path
    return 'dashboard';
  });

  const [activeTopicId, setActiveTopicId] = useState<string | null>(null);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [lastInvoice, setLastInvoice] = useState<Invoice | null>(null);
  const [isLoadingInvoice, setIsLoadingInvoice] = useState(false);
  const [activeExperiment, setActiveExperiment] = useState<PhysicsExperiment>(INITIAL_EXPERIMENTS[0]);

  useEffect(() => {
    const handleChangeView = (e: any) => {
      const targetView = e.detail.view as ViewState;
      
      const premiumViews: ViewState[] = ['physics-veo', 'ar-lab', 'physics-image-gen'];
      if (user && user.subscription === 'free' && premiumViews.includes(targetView)) {
        setView('billing');
        return;
      }

      if (e.detail.view) setView(targetView);
      if (e.detail.topicId) setActiveTopicId(e.detail.topicId);
      setIsSidebarOpen(false);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    };
    window.addEventListener('change-view', handleChangeView);
    return () => window.removeEventListener('change-view', handleChangeView);
  }, [user]);

  useEffect(() => {
    if ((view === 'certificates' || view === 'payment-certificate') && user && !lastInvoice) {
      setIsLoadingInvoice(true);
      dbService.getUserLatestPaidInvoice(user.uid).then(inv => {
        setLastInvoice(inv);
        setIsLoadingInvoice(false);
      });
    }
  }, [view, user, lastInvoice]);
  

  const renderContent = () => {
    // Public Routes
    if (view === 'landing') return <LandingPage onStart={() => setView('dashboard')} />;
    if (view === 'teacher-join') return <TeacherJoin />;
    
    // Privacy Policy Public/Private Access
    if (view === 'privacy-policy') {
      return (
        <div className="max-w-4xl mx-auto py-20 px-6 font-['Tajawal'] text-white text-right" dir="rtl">
          <h1 className="text-4xl font-bold mb-8 text-sky-400">سياسة الخصوصية</h1>
          <div className="glass-panel p-10 rounded-[30px] border-white/10 space-y-6 text-slate-300 leading-relaxed">
            <p>نحن في المركز السوري للعلوم نلتزم بحماية خصوصية بياناتك.</p>
            <p>1. <strong>جمع البيانات:</strong> نجمع البيانات الأساسية (الاسم، البريد، الصف) لغرض تحسين التجربة التعليمية.</p>
            <p>2. <strong>الدفع الإلكتروني:</strong> جميع عمليات الدفع تتم عبر بوابات آمنة ولا نحتفظ ببيانات البطاقات.</p>
            <p>3. <strong>الذكاء الاصطناعي:</strong> يتم استخدام البيانات الأكاديمية لتحليل الأداء عبر Google Gemini AI دون مشاركة معلومات تعريفية حساسة مع أطراف ثالثة لأغراض تسويقية.</p>
          </div>
          <button onClick={() => setView(user ? 'dashboard' : 'landing')} className="mt-8 text-sky-400 font-bold hover:underline">العودة ←</button>
        </div>
      );
    }

    if (!user) return <Auth onLogin={(u) => { setUser(u); setView('dashboard'); }} onBack={() => setView('landing')} />;

    switch (view) {
      case 'dashboard':
        if (user.role === 'admin') return <AdminDashboard />;
        if (user.role === 'parent') return <ParentPortal user={user} />;
        return <StudentDashboard user={user} setView={setView} />;
      
      // Core Content
      case 'physics-journey': return <PhysicsJourneyMap user={user} />;
      case 'course-catalog': return <CurriculumMap />;
      case 'course-content':
        const topic = PHYSICS_TOPICS.find(t => t.id === activeTopicId);
        return topic ? <LessonViewer user={user} topic={topic} onBack={() => setView('dashboard')} onComplete={() => {}} /> : <StudentDashboard user={user} setView={setView} />;
      case 'teachers': return <TeacherDirectory user={user} />;

      // Resources & Bridge
      case 'library': return <ResourcesCenter user={user} />;
      case 'university-bridge': return <UniversityBridge />;
      case 'scientific-articles': return <ScientificArticles />;
      
      // AI Tools
      case 'ai-chat': return <PhysicsChat grade={user.grade} />;
      case 'physics-image-gen': return <ImageGenerator />;
      case 'physics-veo': return <PhysicsVeo />;
      case 'physics-solver': return <PhysicsSolver />;
      case 'equation-solver': return <EquationSolver />;
      
      // Labs & Interactive
      case 'future-labs': return <FutureLabs onSelect={(exp) => { setActiveExperiment(exp); setView('virtual-lab'); }} />;
      case 'virtual-lab': return <VirtualLab experiment={activeExperiment} onBack={() => setView('future-labs')} onSaveResult={() => {}} />;
      case 'ar-lab': return <ARLab />;
      case 'physics-game': return <PhysicsGame />;
      
      // Assessment & Productivity
      case 'exam-center': return <ExamCenter user={user} onBack={() => setView('dashboard')} />;
      case 'question-bank': return <QuestionBank user={user} onExplainAI={() => {}} />;
      case 'live-sessions': return <LiveSessions />;
      case 'study-groups': return <StudyGroups />;
      case 'todo-list': return <TodoList />;
      case 'progress-report': return <ProgressReport user={user} attempts={[]} onBack={() => setView('dashboard')} />;
      case 'forum': return <Forum user={user} onAskAI={() => {}} />;

      // Operational & Admin Views
      case 'bank-digitizer': return <AdminDashboard initialTab='questions' />;
      case 'billing': return <BillingCenter user={user} onUpdateUser={setUser} onBack={() => setView('dashboard')} onViewCertificate={(inv) => { setLastInvoice(inv); setView('payment-certificate'); }} />;
      case 'payment-certificate': 
      case 'certificates':
        return lastInvoice ? <PaymentCertificate user={user} invoice={lastInvoice} onBack={() => setView('dashboard')} /> : <BillingCenter user={user} onUpdateUser={setUser} onBack={() => setView('dashboard')} />;
      
      default: return <StudentDashboard user={user} setView={setView} />;
    }
  };

  return (
    <div className="min-h-screen flex relative overflow-hidden bg-[#0f172a]">
      {view !== 'landing' && view !== 'privacy-policy' && user && (
        <Sidebar 
          currentView={view} 
          setView={(v) => { setView(v); }} 
          userRole={user.role} 
          onLogout={() => { setUser(null); setView('landing'); }} 
          isOpen={isSidebarOpen}
          onClose={() => setIsSidebarOpen(false)}
        />
      )}

      <div className={`flex-1 flex flex-col ${view !== 'landing' && view !== 'privacy-policy' && user ? 'lg:mr-80' : ''} transition-all duration-500`}>
        {view !== 'landing' && view !== 'privacy-policy' && user && (
          <header className="px-6 py-4 md:px-10 md:py-6 flex justify-between items-center glass-panel sticky top-0 z-40 backdrop-blur-xl border-b border-white/5 bg-slate-900/80">
            <div className="flex items-center gap-6">
              <button onClick={() => setIsSidebarOpen(true)} className="lg:hidden text-white text-2xl">☰</button>
              <h2 className="text-lg font-bold uppercase tracking-tight text-white flex items-center gap-2">
                <span className="text-sky-400">⚛️</span> المركز السوري للعلوم
              </h2>
            </div>
            <div className="flex bg-slate-800/50 border border-white/10 rounded-full px-5 py-1.5 items-center gap-3">
               <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{view.replace('-', ' ')}</span>
               <div className="w-1.5 h-1.5 bg-sky-400 rounded-full animate-pulse shadow-[0_0_10px_#38bdf8]"></div>
            </div>
          </header>
        )}

        <main className={`flex-1 ${view === 'landing' ? '' : 'p-4 md:p-10'} pb-safe`}>
          {renderContent()}
        </main>
      </div>
    </div>
  );
};

export default App;

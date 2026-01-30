
import React, { useState, useEffect, Suspense, lazy, createContext } from 'react';
import { Routes, Route, Outlet, useNavigate, useLocation, Navigate, NavLink } from 'react-router-dom';
import { User, AppBranding, MaintenanceSettings, ViewState } from './types';
import { dbService } from './services/db';
import { auth } from './services/firebase';
// @fix: Import ProtectedRoute to use it in the Routes component.
import ProtectedRoute, { AuthContext } from './components/ProtectedRoute';
import { Bell, ArrowRight, Menu, RefreshCw, LayoutDashboard, ShieldAlert } from 'lucide-react';

// Core Components
import Sidebar from './components/Sidebar';
import PWAPrompt from './components/PWAPrompt';
import NotificationPanel from './components/NotificationPanel';
import MaintenanceMode from './components/MaintenanceMode';
import FloatingNav from './components/FloatingNav';
import LandingPage from './components/LandingPage'; 
import Auth from './components/Auth'; 

// Lazy-loaded Components
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
const AdminCurriculumManager = lazy(() => import('./components/AdminCurriculumManager'));
const AdminStudentManager = lazy(() => import('./components/AdminStudentManager'));
const AdminDashboardPanel = lazy(() => import('./components/AdminDashboard'));
const InteractiveLessonBuilder = lazy(() => import('./components/InteractiveLessonBuilder'));

// A reusable layout for all authenticated pages that include the sidebar and header.
const AppLayout: React.FC<{ user: User; branding: AppBranding; onLogout: () => void; }> = ({ user, branding, onLogout }) => {
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);
    const navigate = useNavigate();
    const location = useLocation();

    return (
        <div className="min-h-screen bg-[#0A2540] text-right font-['Tajawal'] flex flex-col lg:flex-row relative overflow-hidden" dir="rtl">
            <Sidebar 
                user={user} 
                branding={branding}
                onLogout={onLogout}
                isOpen={isSidebarOpen}
                onClose={() => setIsSidebarOpen(false)}
            />
            <div className={`flex-1 flex flex-col min-w-0 transition-all duration-300 relative z-10 lg:mr-72`}>
                <header className="sticky top-0 z-[100] bg-[#0A2540]/80 backdrop-blur-xl border-b border-white/5 px-6 py-4 flex justify-between items-center shadow-2xl">
                    <div className="flex items-center gap-4">
                        <button onClick={() => setIsSidebarOpen(true)} className="lg:hidden p-3 text-white bg-white/5 rounded-2xl"><Menu size={24} /></button>
                        {location.pathname !== '/dashboard' && (
                             <button onClick={() => navigate(-1)} className="flex items-center gap-2 bg-white/5 hover:bg-white/10 text-white px-5 py-2.5 rounded-[20px] transition-all border border-white/10 group">
                                <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
                                <span className="font-bold text-sm">رجوع</span>
                            </button>
                        )}
                    </div>
                    {/* ... other header content */}
                </header>
                <main className={`flex-1 w-full max-w-screen-2xl mx-auto overflow-x-hidden relative p-4 md:p-8 lg:p-12`}>
                    <Suspense fallback={<div className="flex flex-col items-center justify-center h-[50vh] gap-4"><RefreshCw className="w-12 h-12 text-amber-400 animate-spin" /></div>}>
                        <Outlet /> {/* Child routes render here */}
                    </Suspense>
                    {user?.role === 'student' && <FloatingNav />}
                </main>
            </div>
            <PWAPrompt user={user} logoUrl={branding.logoUrl} />
        </div>
    );
};

const App: React.FC = () => {
    const [user, setUser] = useState<User | null>(null);
    const [isAuthLoading, setIsAuthLoading] = useState(true);
    const [branding] = useState<AppBranding>({ logoUrl: 'https://cdn-icons-png.flaticon.com/512/3063/3063206.png', appName: 'المركز السوري للعلوم' });
    const navigate = useNavigate();

    useEffect(() => {
        const unsubscribeAuth = auth.onAuthStateChanged((firebaseUser) => {
            if (firebaseUser) {
                dbService.subscribeToUser(firebaseUser.uid, (updatedUser) => {
                    setUser(updatedUser || null);
                    setIsAuthLoading(false);
                });
            } else {
                setUser(null);
                setIsAuthLoading(false);
            }
        });
        return () => unsubscribeAuth();
    }, []);

    const handleLogin = (loggedInUser: User) => {
        setUser(loggedInUser);
        navigate('/dashboard');
    };

    const handleLogout = () => {
        auth.signOut().then(() => {
            setUser(null);
            navigate('/login');
        });
    };
    
    // NOTE: Components like QuizPlayer need to be refactored internally
    // to use `useParams()` to fetch their data, similar to the updated LessonViewer.
    // This example focuses on the routing structure itself.

    return (
        <AuthContext.Provider value={{ user, isLoading: isAuthLoading }}>
            <Routes>
                {/* Public Routes */}
                <Route path="/" element={<LandingPage onStart={() => navigate('/login')} />} />
                <Route path="/login" element={user ? <Navigate to="/dashboard" /> : <Auth onLogin={handleLogin} onBack={() => navigate('/')} />} />

                {/* Main Protected Application Layout */}
                <Route element={<ProtectedRoute />}>
                    <Route element={<AppLayout user={user!} branding={branding} onLogout={handleLogout} />}>
                        <Route path="/dashboard" element={
                            user?.role === 'admin' ? <AdminDashboard /> :
                            user?.role === 'teacher' ? <TeacherDashboard user={user} /> :
                            <StudentDashboard user={user!} />
                        } />
                        <Route path="/curriculum" element={<CurriculumBrowser user={user!} subject="Physics" />} />
                        <Route path="/lesson/:lessonId" element={<LessonViewer user={user!} />} />
                        <Route path="/quiz-center" element={<QuizCenter user={user!} />} />
                        <Route path="/quiz/:quizId" element={<QuizPlayer user={user!} quiz={{id: ''} as any} onFinish={() => navigate('/quiz-center')} />} />
                        <Route path="/discussions" element={<Forum user={user} />} />
                        <Route path="/ai-chat" element={<AiTutor grade={user?.grade || '12'} subject="Physics" />} />
                        <Route path="/subscription" element={<BillingCenter user={user!} onUpdateUser={setUser} />} />
                    </Route>
                </Route>
                
                {/* Admin-Specific Routes */}
                <Route element={<ProtectedRoute allowedRoles={['admin', 'teacher']} />}>
                     <Route path="/admin" element={<AppLayout user={user!} branding={branding} onLogout={handleLogout} />}>
                        <Route index element={<Navigate to="/admin/dashboard" replace />} />
                        <Route path="dashboard" element={<AdminDashboard />} />
                        <Route path="curriculum" element={<AdminCurriculumManager />} />
                        <Route path="students" element={<AdminStudentManager />} />
                        {/* Add other admin routes here */}
                    </Route>
                    {/* Full-screen builder route for admins */}
                    <Route path="/lesson-builder" element={<InteractiveLessonBuilder />} />
                    <Route path="/lesson-builder/:lessonId" element={<InteractiveLessonBuilder />} />
                </Route>

                {/* Fallback Route */}
                <Route path="*" element={<Navigate to="/" />} />
            </Routes>
        </AuthContext.Provider>
    );
};

export default App;

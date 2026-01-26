
import React, { useState, useEffect } from 'react';
import { BookOpen, Users, Briefcase, Settings, Video, RefreshCw, HeartPulse, LayoutDashboard, Library, MessageSquare, ClipboardList, ShieldCheck, ShieldAlert, Lock, CreditCard, Newspaper, FlaskConical, Zap } from 'lucide-react';
import { dbService } from '../services/db';
import { auth } from '../services/firebase';
import anime from 'animejs';
import SupabaseConnectionFixer from './SupabaseConnectionFixer';
import EscalatedPostsWidget from './EscalatedPostsWidget';

const AdminDashboard: React.FC = () => {
  const [firestoreStatus, setFirestoreStatus] = useState<{ alive: boolean | null, error?: string }>({ alive: null });
  const [supabaseStatus, setSupabaseStatus] = useState<{ alive: boolean | null, error?: string }>({ alive: null });
  const [isChecking, setIsChecking] = useState(false);
  const [showGuides, setShowGuides] = useState(false);
  const [adminRoleValid, setAdminRoleValid] = useState<boolean>(true);

  useEffect(() => {
    checkHealth();
    verifyAdminRole();

    // أنيميشن دخول أدوات الإدارة
    (anime as any)({
      targets: '.admin-tool-card',
      scale: [0.9, 1],
      opacity: [0, 1],
      translateY: [20, 0],
      delay: (anime as any).stagger(100),
      easing: 'easeOutExpo',
      duration: 800
    });
  }, []);

  const verifyAdminRole = async () => {
    const user = auth.currentUser;
    if (user) {
        const userData = await dbService.getUser(user.uid);
        if (!userData || userData.role !== 'admin') {
            setAdminRoleValid(false);
        }
    }
  };

  const checkHealth = async () => {
    setIsChecking(true);
    const [fsStatus, sbStatus] = await Promise.all([
        dbService.checkConnection(),
        dbService.checkSupabaseConnection()
    ]);
    setFirestoreStatus(fsStatus);
    setSupabaseStatus(sbStatus);
    setIsChecking(false);
  };

  const adminTools = [
    { view: 'admin-curriculum', icon: BookOpen, title: 'إدارة المناهج', description: 'تعديل الدروس والمحتوى.' },
    { view: 'admin-quizzes', icon: ClipboardList, title: 'إدارة الاختبارات', description: 'بنوك الأسئلة والتقييم.' },
    { view: 'admin-labs', icon: FlaskConical, title: 'إدارة المختبرات', description: 'تجارب HTML5 و Phet.' },
    { view: 'admin-recommendations', icon: Zap, title: 'التوصيات الذكية', description: 'توجيه الطلاب أكاديمياً.' },
    { view: 'admin-content', icon: Newspaper, title: 'محتوى الرئيسية', description: 'الأخبار والإعلانات.' },
    { view: 'admin-students', icon: Users, title: 'إدارة الطلاب', description: 'الحسابات والاشتراكات.' },
    { view: 'admin-payment-manager', icon: CreditCard, title: 'إدارة الدفع', description: 'الأسعار ورقم ومض.' },
    { view: 'admin-teachers', icon: Briefcase, title: 'إدارة المعلمين', description: 'الصلاحيات والحسابات.' },
    { view: 'admin-managers', icon: ShieldCheck, title: 'إدارة المدراء', description: 'فريق الإدارة.' },
    { view: 'admin-forums', icon: MessageSquare, title: 'المنتديات', description: 'هيكل الأقسام.' },
    { view: 'admin-forum-posts', icon: ShieldAlert, title: 'الرقابة', description: 'إدارة المنشورات.' },
    { view: 'admin-security-fix', icon: Lock, title: 'الأمان', description: 'إصلاح القواعد.' },
    { view: 'admin-live-sessions', icon: Video, title: 'البث المباشر', description: 'جدولة الحصص.' },
    { view: 'admin-assets', icon: Library, title: 'المكتبة', description: 'إدارة الوسائط.' },
    { view: 'admin-settings', icon: Settings, title: 'الإعدادات', description: 'سياسات النظام.' },
  ];

  return (
    <div className="animate-fadeIn space-y-10 pb-20">
      <header className="flex flex-col md:flex-row justify-between items-end gap-6">
        <div>
            <h2 className="text-5xl font-black text-white italic tracking-tighter uppercase">غرفة <span className="text-amber-400">القيادة</span></h2>
            <p className="text-gray-500 mt-2 font-bold uppercase tracking-widest text-[10px]">نظام الإدارة المركزي لـ المركز السوري للعلوم</p>
        </div>
      </header>
      
      {!adminRoleValid && (
          <div className="bg-red-600/20 border-2 border-red-600/40 p-6 rounded-[30px] flex items-center gap-6 animate-pulse">
              <ShieldAlert className="text-red-500" size={32} />
              <div>
                  <h4 className="text-white font-black">تحذير الصلاحيات</h4>
                  <p className="text-xs text-gray-400 mt-1">حسابك الحالي غير مسجل بصفة "Admin" في قاعدة البيانات.</p>
              </div>
          </div>
      )}

      <div className="grid grid-cols-1 xl:grid-cols-12 gap-10 items-start">
        <div className="xl:col-span-9 space-y-8">
           <EscalatedPostsWidget />
           
           <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {adminTools.map(tool => (
                <div 
                  key={tool.view} 
                  onClick={() => window.dispatchEvent(new CustomEvent('change-view', { detail: { view: tool.view } }))} 
                  className="admin-tool-card glass-panel p-8 rounded-[45px] border-white/5 bg-black/20 cursor-pointer group hover:border-amber-400/40 transition-all flex flex-col gap-6 opacity-0"
                >
                  <div className="w-14 h-14 rounded-2xl bg-white/5 flex items-center justify-center text-amber-400 group-hover:bg-amber-400 group-hover:text-black transition-all duration-500"><tool.icon size={24} /></div>
                  <div>
                    <h3 className="text-xl font-black text-white group-hover:text-amber-400 transition-colors">{tool.title}</h3>
                    <p className="text-[10px] text-gray-500 mt-1 font-bold uppercase tracking-widest">{tool.description}</p>
                  </div>
                </div>
              ))}
           </div>
        </div>

        <div className="xl:col-span-3 space-y-6">
           <div className="glass-panel p-8 rounded-[40px] border-white/5 bg-[#0a1118] shadow-2xl">
              <h3 className="text-sm font-black text-gray-400 mb-8 flex items-center gap-3 uppercase tracking-[0.2em]"><HeartPulse className="text-red-500" size={16} /> سرعة الاستجابة</h3>
              <div className="space-y-4">
                 <div className={`p-5 rounded-2xl border flex justify-between items-center ${firestoreStatus.alive ? 'bg-green-500/10 border-green-500/20 text-green-400' : 'bg-red-500/10 border-red-500/20 text-red-400'}`}>
                    <span className="text-[10px] font-black uppercase">Firestore</span>
                    <span className="text-[10px] font-bold">{firestoreStatus.alive ? 'ONLINE' : 'ERROR'}</span>
                 </div>
                 <div className={`p-5 rounded-2xl border flex justify-between items-center ${supabaseStatus.alive ? 'bg-green-500/10 border-green-500/20 text-green-400' : 'bg-red-500/10 border-red-500/20 text-red-400'}`}>
                    <span className="text-[10px] font-black uppercase">Storage</span>
                    <span className="text-[10px] font-bold">{supabaseStatus.alive ? 'ONLINE' : 'ERROR'}</span>
                 </div>
                 <button onClick={checkHealth} className="w-full py-4 bg-white/5 rounded-xl text-gray-400 hover:text-white transition-all text-[10px] font-black uppercase tracking-widest flex items-center justify-center gap-3">
                    <RefreshCw size={14} className={isChecking ? 'animate-spin' : ''} /> تحديث الحالة
                 </button>
              </div>
           </div>
           
           <button onClick={() => setShowGuides(!showGuides)} className="w-full text-[10px] font-black text-gray-700 hover:text-blue-400 transition-colors uppercase tracking-[0.3em]">دليل إصلاح Supabase ▼</button>
           {showGuides && <SupabaseConnectionFixer onFix={checkHealth} />}
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;

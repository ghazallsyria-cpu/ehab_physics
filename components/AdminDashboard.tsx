
import React, { useState, useEffect } from 'react';
import { BookOpen, Users, Briefcase, Banknote, Settings, Video, Wifi, WifiOff, RefreshCw, AlertTriangle, ChevronDown, HeartPulse, LayoutDashboard, Library, MessageSquare, Award, ClipboardList, ShieldCheck, ShieldAlert } from 'lucide-react';
import { dbService } from '../services/db';
import SupabaseConnectionFixer from './SupabaseConnectionFixer';
import EscalatedPostsWidget from './EscalatedPostsWidget';

const AdminDashboard: React.FC = () => {
  const [firestoreStatus, setFirestoreStatus] = useState<{ alive: boolean | null, error?: string }>({ alive: null });
  const [supabaseStatus, setSupabaseStatus] = useState<{ alive: boolean | null, error?: string }>({ alive: null });
  const [isChecking, setIsChecking] = useState(false);
  const [showGuides, setShowGuides] = useState(false);

  useEffect(() => {
    checkHealth();
  }, []);

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
    { view: 'admin-curriculum', icon: BookOpen, title: 'إدارة المناهج', description: 'إضافة وتعديل الدروس والمحتوى التعليمي.' },
    { view: 'admin-quizzes', icon: ClipboardList, title: 'إدارة الاختبارات', description: 'إنشاء وتعديل الاختبارات وبنوك الأسئلة.' },
    { view: 'admin-students', icon: Users, title: 'إدارة الطلاب', description: 'متابعة حسابات الطلاب والاشتراكات.' },
    { view: 'admin-teachers', icon: Briefcase, title: 'إدارة المعلمين', description: 'إدارة صلاحيات المعلمين والحسابات.' },
    { view: 'admin-managers', icon: ShieldCheck, title: 'إدارة المدراء', description: 'تعيين وتغيير صلاحيات إدارة النظام.' },
    { view: 'admin-forums', icon: MessageSquare, title: 'هيكل المنتديات', description: 'إعداد الأقسام والمشرفين الأكاديميين.' },
    { view: 'admin-forum-posts', icon: ShieldAlert, title: 'إدارة المنشورات', description: 'الرقابة على المحتوى وحذف المنشورات.' },
    { view: 'admin-live-sessions', icon: Video, title: 'إدارة البث', description: 'جدولة حصص Zoom المباشرة.' },
    { view: 'admin-assets', icon: Library, title: 'مكتبة الوسائط', description: 'إدارة صور وملفات الدروس.' },
    { view: 'admin-settings', icon: Settings, title: 'إعدادات النظام', description: 'التحكم في السياسات وتسجيل البيانات.' },
  ];

  return (
    <div className="animate-fadeIn space-y-10 pb-20">
      <header>
        <h2 className="text-4xl font-black text-white italic">غرفة <span className="text-amber-400">التحكم</span></h2>
        <p className="text-gray-500 mt-2 font-medium">مرحباً بك في لوحة تحكم المسؤول الرئيسية.</p>
      </header>
      
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-8 items-start">
        <div className="xl:col-span-8 space-y-8">
           <EscalatedPostsWidget />
           
           <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {adminTools.map(tool => (
                <div key={tool.view} onClick={() => window.dispatchEvent(new CustomEvent('change-view', { detail: { view: tool.view } }))} className="glass-panel p-8 rounded-[40px] border-white/5 bg-gradient-to-br from-white/[0.02] to-transparent cursor-pointer group hover:border-amber-400/40 transition-all flex gap-6 items-center">
                  <div className="w-16 h-16 rounded-2xl bg-amber-400/10 flex items-center justify-center text-amber-400 shrink-0 group-hover:scale-110 transition-all"><tool.icon size={30} /></div>
                  <div>
                    <h3 className="text-xl font-black text-white group-hover:text-amber-400 transition-colors">{tool.title}</h3>
                    <p className="text-xs text-gray-500 mt-1">{tool.description}</p>
                  </div>
                </div>
              ))}
           </div>
        </div>

        <div className="xl:col-span-4 space-y-6">
           <div className="glass-panel p-8 rounded-[40px] border-white/5 bg-[#0a1118]/80 shadow-xl">
              <h3 className="text-lg font-black text-white mb-6 flex items-center gap-3"><HeartPulse className="text-red-400" /> صحة النظام</h3>
              <div className="space-y-4">
                 <div className={`p-4 rounded-2xl border flex justify-between items-center ${firestoreStatus.alive ? 'bg-green-500/10 border-green-500/20 text-green-400' : 'bg-red-500/10 border-red-500/20 text-red-400'}`}>
                    <span className="text-[10px] font-black uppercase">Firestore</span>
                    <span className="text-xs font-bold">{firestoreStatus.alive ? 'متصل' : 'خطأ'}</span>
                 </div>
                 <div className={`p-4 rounded-2xl border flex justify-between items-center ${supabaseStatus.alive ? 'bg-green-500/10 border-green-500/20 text-green-400' : 'bg-red-500/10 border-red-500/20 text-red-400'}`}>
                    <span className="text-[10px] font-black uppercase">Storage</span>
                    <span className="text-xs font-bold">{supabaseStatus.alive ? 'متصل' : 'خطأ'}</span>
                 </div>
                 <button onClick={checkHealth} className="w-full py-3 bg-white/5 rounded-xl text-gray-400 hover:text-white transition-all text-xs font-bold flex items-center justify-center gap-2">
                    <RefreshCw size={14} className={isChecking ? 'animate-spin' : ''} /> تحديث الحالة
                 </button>
              </div>
              <button onClick={() => setShowGuides(!showGuides)} className="w-full mt-6 text-[10px] font-bold text-gray-600 hover:text-blue-400 transition-colors">دليل إصلاح Supabase ▼</button>
           </div>
           
           {showGuides && <SupabaseConnectionFixer onFix={checkHealth} />}
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;

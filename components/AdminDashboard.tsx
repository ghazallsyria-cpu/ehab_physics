
import React, { useState, useEffect } from 'react';
import { BookOpen, Users, Briefcase, Banknote, Settings, Video, Wifi, WifiOff, RefreshCw, AlertTriangle, ExternalLink, Copy, Check, ClipboardList, LayoutDashboard, Library, MessageSquare, Award, ChevronDown, HeartPulse } from 'lucide-react';
import { dbService } from '../services/db';
import SupabaseConnectionFixer from './SupabaseConnectionFixer';
import EscalatedPostsWidget from './EscalatedPostsWidget';

const AdminDashboard: React.FC = () => {
  const [firestoreStatus, setFirestoreStatus] = useState<{ alive: boolean | null, error?: string }>({ alive: null });
  const [supabaseStatus, setSupabaseStatus] = useState<{ alive: boolean | null, error?: string }>({ alive: null });
  const [isChecking, setIsChecking] = useState(false);
  const [showGuides, setShowGuides] = useState(false);
  const [forceShowFixer, setForceShowFixer] = useState(false);

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
    
    // Automatically show guides if there is a detected permission error
    if (sbStatus.error === 'SUPABASE_PERMISSION_DENIED' || fsStatus.alive === false) {
        setShowGuides(true);
    }
    setIsChecking(false);
  };

  const navigate = (view: string) => {
    window.dispatchEvent(new CustomEvent('change-view', { detail: { view } }));
  };

  const adminTools = [
    { view: 'admin-curriculum', icon: BookOpen, title: 'إدارة المناهج', description: 'إضافة وتعديل الدروس والمحتوى التعليمي.' },
    { view: 'admin-quizzes', icon: ClipboardList, title: 'إدارة الاختبارات', description: 'إنشاء وتعديل الاختبارات وبنوك الأسئلة.' },
    { view: 'admin-students', icon: Users, title: 'إدارة الطلاب', description: 'متابعة حسابات الطلاب، الاشتراكات، والتقدم.' },
    { view: 'admin-teachers', icon: Briefcase, title: 'إدارة المعلمين', description: 'إدارة صلاحيات المعلمين، الحسابات، والبيانات.' },
    { view: 'admin-certificates', icon: Award, title: 'إدارة الشهادات', description: 'إصدار وتصميم وتوثيق شهادات إتمام المنهج.' },
    { view: 'admin-forums', icon: MessageSquare, title: 'إدارة المنتديات', description: 'إنشاء وتعديل أقسام ومنتديات النقاش.' },
    { view: 'admin-live-sessions', icon: Video, title: 'إدارة البث المباشر', description: 'جدولة جلسات Zoom وإضافة روابط البث للطلاب.' },
    { view: 'admin-financials', icon: Banknote, title: 'الأمور المالية', description: 'مراقبة سجلات الدفع، الفواتير، والإحصائيات.' },
    { view: 'admin-assets', icon: Library, title: 'مكتبة الوسائط', description: 'رفع وإدارة الصور والملفات المستخدمة في الدروس.' },
    { view: 'admin-content', icon: LayoutDashboard, title: 'إدارة الرئيسية', description: 'التحكم في الإعلانات والأخبار بالصفحة الرئيسية.' },
    { view: 'admin-settings', icon: Settings, title: 'إعدادات النظام', description: 'التحكم في تسجيل البيانات وسياسات الخصوصية.' },
  ];

  return (
    <div className="animate-fadeIn space-y-10 font-['Tajawal'] text-right" dir="rtl">
      <header>
        <h2 className="text-4xl font-black text-white italic tracking-tighter uppercase">غرفة <span className="text-amber-400">التحكم</span></h2>
        <p className="text-gray-500 mt-2 font-medium">مرحباً بك في لوحة تحكم المسؤول.</p>
      </header>
      
      {/* Escalated Posts Widget */}
      <EscalatedPostsWidget />

      {/* System Health & Guides Section */}
      <div className="glass-panel p-8 rounded-[40px] border-white/5 bg-[#0a1118]/80 shadow-xl">
          <div className="flex justify-between items-center mb-6">
             <div className="flex items-center gap-3">
                <HeartPulse className="text-amber-400" />
                <h3 className="text-xl font-black text-white">صحة النظام والأدلة الإرشادية</h3>
             </div>
             <div className="flex gap-4">
                <button onClick={() => { setShowGuides(!showGuides); if(!showGuides) setForceShowFixer(true); }} className="flex items-center gap-2 text-xs font-bold text-gray-400 hover:text-white transition-colors">
                    {showGuides ? 'إخفاء الأدلة' : 'دليل إصلاح Supabase'} <ChevronDown className={`w-4 h-4 transition-transform ${showGuides ? 'rotate-180' : ''}`} />
                </button>
             </div>
          </div>

          <div className="flex flex-col md:flex-row items-center gap-4">
            <div className={`flex-1 w-full flex items-center gap-3 px-5 py-3 rounded-2xl border transition-all duration-500 ${firestoreStatus.alive ? 'bg-green-500/10 border-green-500/20 text-green-400' : 'bg-red-500/10 border-red-500/20 text-red-400'}`}>
                <span className="text-[10px] font-black uppercase">Firestore DB</span>
                <span className="text-xs font-bold">{isChecking ? 'جاري الفحص...' : firestoreStatus.alive ? 'متصل بنجاح' : 'خطأ في القواعد'}</span>
                {isChecking ? <RefreshCw className="animate-spin" size={14} /> : firestoreStatus.alive ? <Wifi size={14}/> : <WifiOff size={14}/>}
            </div>
            <div className={`flex-1 w-full flex items-center gap-3 px-5 py-3 rounded-2xl border transition-all duration-500 ${supabaseStatus.alive ? 'bg-green-500/10 border-green-500/20 text-green-400' : 'bg-red-500/10 border-red-500/20 text-red-400'}`}>
                <span className="text-[10px] font-black uppercase">Supabase Storage</span>
                <span className="text-xs font-bold">{isChecking ? 'جاري الفحص...' : supabaseStatus.alive ? 'متصل بنجاح' : 'غير متصل (RLS Error)'}</span>
                {isChecking ? <RefreshCw className="animate-spin" size={14} /> : supabaseStatus.alive ? <Wifi size={14}/> : <WifiOff size={14}/>}
            </div>
            <button onClick={checkHealth} disabled={isChecking} className="p-3 bg-white/5 rounded-2xl hover:bg-white/10 transition-colors border border-white/10 text-gray-400" title="إعادة الفحص"><RefreshCw size={18} className={isChecking ? 'animate-spin' : ''}/></button>
        </div>
        
        {showGuides && (
            <div className="mt-8 space-y-6 animate-fadeIn">
                {firestoreStatus.alive === false && (
                    <div className="p-6 rounded-3xl border-red-500/20 bg-red-500/5">
                        <p className="text-red-400 font-bold mb-2">🔴 خطأ في Firestore: تحتاج إلى تحديث قواعد الأمان للسماح بالوصول للمستخدمين المسجلين.</p>
                    </div>
                )}
                
                {(supabaseStatus.error === 'SUPABASE_PERMISSION_DENIED' || forceShowFixer) ? (
                     <SupabaseConnectionFixer onFix={checkHealth} />
                ) : (
                    <div className="p-8 bg-blue-500/5 border border-blue-500/20 rounded-3xl text-center">
                        <p className="text-blue-400 font-bold text-sm">✓ حالة الاتصال بـ Supabase تبدو جيدة.</p>
                        <button onClick={() => setForceShowFixer(true)} className="text-[10px] text-gray-500 underline mt-2">إظهار دليل الإعداد على أي حال</button>
                    </div>
                )}
            </div>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {adminTools.map(tool => (
            <div 
              key={tool.view}
              onClick={() => navigate(tool.view)}
              className="glass-panel p-10 rounded-[50px] border-amber-500/20 bg-gradient-to-br from-white/5 to-transparent cursor-pointer group hover:border-amber-500/40 transition-all"
            >
              <div className="w-16 h-16 rounded-3xl bg-amber-500/10 border border-amber-500/20 text-amber-400 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                <tool.icon size={32} />
              </div>
              <h3 className="text-2xl font-black text-white group-hover:text-amber-400 transition-colors">{tool.title}</h3>
              <p className="text-sm text-gray-500">{tool.description}</p>
            </div>
          ))}
      </div>
    </div>
  );
};

export default AdminDashboard;

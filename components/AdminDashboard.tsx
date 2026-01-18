
import React, { useState, useEffect } from 'react';
import { BookOpen, Users, Briefcase, Banknote, BrainCircuit, Settings, Video, Wifi, WifiOff, RefreshCw } from 'lucide-react';
import { dbService } from '../services/db';

const AdminDashboard: React.FC = () => {
  const [isDbAlive, setIsDbAlive] = useState<boolean | null>(null);
  const [isChecking, setIsChecking] = useState(false);

  useEffect(() => {
    checkHealth();
  }, []);

  const checkHealth = async () => {
    setIsChecking(true);
    const alive = await dbService.checkConnection();
    setIsDbAlive(alive);
    setIsChecking(false);
  };

  const navigate = (view: string) => {
    window.dispatchEvent(new CustomEvent('change-view', { detail: { view } }));
  };

  const adminTools = [
    { view: 'admin-curriculum', icon: BookOpen, title: 'إدارة المناهج', description: 'إضافة وتعديل الدروس والمحتوى التعليمي.' },
    { view: 'admin-students', icon: Users, title: 'إدارة الطلاب', description: 'متابعة حسابات الطلاب، الاشتراكات، والتقدم.' },
    { view: 'admin-teachers', icon: Briefcase, title: 'إدارة المعلمين', description: 'إدارة صلاحيات المعلمين، الحسابات، والبيانات.' },
    { view: 'admin-live-sessions', icon: Video, title: 'إدارة البث المباشر', description: 'جدولة جلسات Zoom وإضافة روابط البث للطلاب.' },
    { view: 'admin-questions', icon: BrainCircuit, title: 'بنك الأسئلة المركزي', description: 'رقمنة، فحص، واعتماد أسئلة الامتحانات.' },
    { view: 'admin-financials', icon: Banknote, title: 'الأمور المالية', description: 'مراقبة سجلات الدفع، الفواتير، والإحصائيات.' },
    { view: 'admin-settings', icon: Settings, title: 'إعدادات النظام', description: 'التحكم في تسجيل البيانات وسياسات الخصوصية.' },
  ];

  return (
    <div className="animate-fadeIn space-y-10 font-['Tajawal'] text-right" dir="rtl">
      <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <div>
            <h2 className="text-4xl font-black text-white italic tracking-tighter uppercase">غرفة <span className="text-amber-400">التحكم</span></h2>
            <p className="text-gray-500 mt-2 font-medium">مرحباً بك في لوحة تحكم المسؤول.</p>
        </div>
        
        {/* Connection Status Indicator */}
        <div className={`flex items-center gap-4 px-6 py-3 rounded-2xl border ${isDbAlive === true ? 'bg-green-500/10 border-green-500/20 text-green-400' : isDbAlive === false ? 'bg-red-500/10 border-red-500/20 text-red-400' : 'bg-white/5 border-white/10 text-gray-500'}`}>
            <div className="flex flex-col items-end">
                <span className="text-[10px] font-black uppercase tracking-widest">حالة قاعدة البيانات</span>
                <span className="text-xs font-bold">{isChecking ? 'جاري الفحص...' : isDbAlive ? 'متصل وجاهز' : 'خطأ في الاتصال'}</span>
            </div>
            {isChecking ? <RefreshCw className="animate-spin" size={20} /> : isDbAlive ? <Wifi size={20}/> : <WifiOff size={20}/>}
            {!isChecking && <button onClick={checkHealth} className="mr-2 p-1.5 hover:bg-white/10 rounded-lg transition-colors"><RefreshCw size={14}/></button>}
        </div>
      </header>
      
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

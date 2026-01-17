
import React from 'react';
import { BookOpen, Users, Briefcase, Banknote, BrainCircuit } from 'lucide-react';

const AdminDashboard: React.FC = () => {

  const navigate = (view: string) => {
    window.dispatchEvent(new CustomEvent('change-view', { detail: { view } }));
  };

  const adminTools = [
    { view: 'admin-curriculum', icon: BookOpen, title: 'إدارة المناهج', description: 'إضافة وتعديل الدروس والمحتوى التعليمي.', color: 'sky' },
    { view: 'admin-students', icon: Users, title: 'إدارة الطلاب', description: 'متابعة حسابات الطلاب، الاشتراكات، والتقدم.', color: 'green' },
    { view: 'admin-teachers', icon: Briefcase, title: 'إدارة المعلمين', description: 'إدارة صلاحيات المعلمين، الحسابات، والبيانات.', color: 'indigo' },
    { view: 'admin-questions', icon: BrainCircuit, title: 'بنك الأسئلة المركزي', description: 'رقمنة، فحص، واعتماد أسئلة الامتحانات.', color: 'amber' },
    { view: 'admin-financials', icon: Banknote, title: 'الأمور المالية', description: 'مراقبة سجلات الدفع، الفواتير، والإحصائيات.', color: 'rose' },
  ];

  const colors = {
    sky: { border: 'border-sky-500/20', hoverBorder: 'hover:border-sky-500/40', bg: 'bg-sky-500/10', text: 'text-sky-400', hoverText: 'group-hover:text-sky-400' },
    green: { border: 'border-green-500/20', hoverBorder: 'hover:border-green-500/40', bg: 'bg-green-500/10', text: 'text-green-400', hoverText: 'group-hover:text-green-400' },
    indigo: { border: 'border-indigo-500/20', hoverBorder: 'hover:border-indigo-500/40', bg: 'bg-indigo-500/10', text: 'text-indigo-400', hoverText: 'group-hover:text-indigo-400' },
    amber: { border: 'border-amber-500/20', hoverBorder: 'hover:border-amber-500/40', bg: 'bg-amber-500/10', text: 'text-amber-400', hoverText: 'group-hover:text-amber-400' },
    rose: { border: 'border-rose-500/20', hoverBorder: 'hover:border-rose-500/40', bg: 'bg-rose-500/10', text: 'text-rose-400', hoverText: 'group-hover:text-rose-400' },
  };

  return (
    <div className="animate-fadeIn space-y-10 font-['Tajawal'] text-right" dir="rtl">
      <header className="mb-10">
        <h2 className="text-4xl font-black text-white italic tracking-tighter uppercase">غرفة <span className="text-[#fbbf24]">التحكم</span></h2>
        <p className="text-gray-500 mt-2 font-medium">مرحباً بك في لوحة تحكم المسؤول.</p>
      </header>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {adminTools.map(tool => {
          const c = colors[tool.color as keyof typeof colors];
          return (
            <div 
              key={tool.view}
              onClick={() => navigate(tool.view)}
              className={`glass-panel p-10 rounded-[50px] ${c.border} bg-gradient-to-br from-white/5 to-transparent cursor-pointer group ${c.hoverBorder} transition-all`}
            >
              <div className={`w-16 h-16 rounded-3xl ${c.bg} border ${c.border} ${c.text} flex items-center justify-center mb-6 group-hover:scale-110 transition-transform`}>
                <tool.icon size={32} />
              </div>
              <h3 className={`text-2xl font-black text-white mb-2 ${c.hoverText} transition-colors`}>{tool.title}</h3>
              <p className="text-sm text-gray-500">{tool.description}</p>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default AdminDashboard;

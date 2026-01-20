
import React from 'react';
import { ViewState, User } from '../types';

interface SidebarProps {
  currentView: ViewState;
  setView: (view: ViewState, subject?: 'Physics' | 'Chemistry') => void;
  user: User;
  onLogout: () => void;
  isOpen?: boolean;
  onClose?: () => void;
}

const Sidebar: React.FC<SidebarProps> = ({ currentView, setView, user, onLogout, isOpen, onClose }) => {
  
  const navigate = (view: ViewState, subject?: 'Physics' | 'Chemistry') => {
    const detail: { view: ViewState, subject?: 'Physics' | 'Chemistry' } = { view };
    if (subject) detail.subject = subject;
    window.dispatchEvent(new CustomEvent('change-view', { detail }));
    if (window.innerWidth < 1024) onClose?.();
  };
  
  const getNavItems = () => {
    switch (user.role) {
      case 'student':
        return [
          { label: 'الرئيسية', items: [
            { id: 'dashboard', label: 'لوحة التحكم', icon: '🏠' },
          ]},
          { label: 'المناهج', items: [
            { id: 'curriculum', subject: 'Physics', label: 'الفيزياء', icon: '⚛️' },
            { id: 'curriculum', subject: 'Chemistry', label: 'الكيمياء', icon: '🧪' },
          ]},
          { label: 'الأدوات', items: [
            { id: 'quiz_center', label: 'مركز الاختبارات', icon: '⚡' },
            { id: 'discussions', label: 'ساحة النقاش', icon: '💬' },
            { id: 'ai-chat', label: 'المساعد الذكي', icon: '🤖' },
          ]},
          { label: 'التطوير', items: [
            { id: 'recommendations', label: 'التوصيات', icon: '🧠' },
          ]},
          { label: 'التجارب المتقدمة', items: [
            { id: 'virtual-lab', label: 'المختبر التفاعلي', icon: '🔬' },
            { id: 'live-sessions', label: 'الجلسات المباشرة', icon: '🎥' },
          ]},
          { label: 'المتابعة', items: [
            { id: 'reports', label: 'تقارير الأداء', icon: '📈' },
            { id: 'quiz-performance', label: 'تحليل الاختبارات', icon: '📊' },
          ]},
          { label: 'الدعم', items: [
            { id: 'help-center', label: 'دليل الاستخدام', icon: '❓' },
          ]},
          { label: 'الحساب', items: [
              { id: 'subscription', label: 'الاشتراك', icon: '💳' },
          ]}
        ];
      case 'teacher':
        return [
          { label: 'الإدارة', items: [
            { id: 'dashboard', label: 'لوحة التحكم', icon: '📊' },
          ]}
        ];
      case 'admin':
        return [
          { label: 'الإدارة الشاملة', items: [
            { id: 'dashboard', label: 'لوحة التحكم الرئيسية', icon: '📊' },
            { id: 'admin-students', label: 'إدارة الطلاب', icon: '🎓' },
            { id: 'admin-teachers', label: 'إدارة المعلمين', icon: '👨‍🏫' },
            { id: 'admin-curriculum', label: 'إدارة المناهج', icon: '📚' },
            { id: 'admin-quizzes', label: 'إدارة الاختبارات', icon: '📝' },
            { id: 'admin-financials', label: 'الأمور المالية', icon: '💰' },
          ]}
        ];
      default:
        return [];
    }
  };

  const navItems = getNavItems();

  return (
    <>
      {isOpen && (
        <div className="fixed inset-0 bg-blue-950/80 backdrop-blur-sm z-[55] lg:hidden transition-opacity" onClick={onClose} />
      )}
      <div className={`fixed inset-y-0 right-0 z-[60] w-72 bg-blue-950/95 backdrop-blur-2xl border-l border-white/5 flex flex-col transition-transform duration-500 cubic-bezier(0.4, 0, 0.2, 1) shadow-[0_0_50px_rgba(0,0,0,0.5)] ${isOpen ? 'translate-x-0' : 'translate-x-full lg:translate-x-0'}`}>
        <div className="p-6 pb-2">
          <div className="bg-white/[0.03] border border-white/5 p-4 rounded-3xl flex items-center gap-4 mb-6 relative overflow-hidden group">
             <div className="absolute inset-0 bg-gradient-to-r from-amber-500/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
             <div className="w-12 h-12 rounded-[18px] sm:rounded-[25px] bg-gradient-to-tr from-amber-500 to-yellow-600 flex items-center justify-center text-black shadow-lg shadow-amber-500/20 shrink-0 relative z-10 font-bold text-lg transition-all duration-300 group-hover:scale-105 group-hover:bg-gradient-none group-hover:bg-slate-200">
                {user.name.charAt(0)}
             </div>
             <div className="min-w-0 relative z-10">
                <h3 className="font-bold text-white truncate text-sm">{user.name}</h3>
                <div className="flex items-center gap-1.5 mt-1">
                   <div className={`w-2 h-2 rounded-full ${user.subscription === 'premium' ? 'bg-amber-400' : 'bg-gray-500'}`}></div>
                   <span className="text-[10px] text-slate-400 uppercase font-bold tracking-wider truncate">
                     {user.role}
                   </span>
                </div>
             </div>
          </div>
        </div>
        <nav className="flex-1 px-4 overflow-y-auto no-scrollbar space-y-8 pb-10">
          {navItems.map((group, idx) => (
            <div key={idx} className="animate-slideUp" style={{animationDelay: `${idx * 0.05}s`}}>
              <p className="px-4 text-[9px] font-black text-slate-500 uppercase tracking-[0.2em] mb-3 opacity-80">{group.label}</p>
              <div className="space-y-1">
                {group.items.map((item: any) => (
                  <button
                    key={item.id + (item.subject || '')}
                    onClick={() => navigate(item.id as ViewState, item.subject)}
                    className={`w-full flex items-center gap-4 px-4 py-3 rounded-2xl transition-all duration-300 group relative overflow-hidden ${currentView === item.id && (!item.subject || item.subject === 'Physics') ? 'bg-gradient-to-r from-amber-500/20 to-yellow-600/5 text-amber-400 border border-amber-500/10' : 'text-slate-400 hover:bg-white/[0.03] hover:text-white border border-transparent'}`}
                  >
                    <span className={`text-lg transition-transform duration-300 ${currentView === item.id ? 'scale-110 drop-shadow-[0_0_8px_rgba(251,191,36,0.5)]' : 'group-hover:scale-110'}`}>{item.icon}</span>
                    <span className="font-bold text-[13px] tracking-wide">{item.label}</span>
                    {currentView === item.id && (!item.subject || item.subject === 'Physics') && ( <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-5 rounded-r-full bg-amber-400 shadow-[0_0_15px_#fbbf24]"></div> )}
                  </button>
                ))}
              </div>
            </div>
          ))}
        </nav>
        <div className="p-6 border-t border-white/5 bg-blue-950">
          <button onClick={onLogout} className="w-full flex items-center justify-center gap-3 p-3.5 rounded-2xl bg-white/[0.02] border border-white/5 hover:bg-red-500/10 hover:border-red-500/20 hover:text-red-400 text-slate-400 transition-all group">
            <span className="text-sm group-hover:-translate-x-1 transition-transform">🚪</span>
            <span className="font-black text-xs uppercase tracking-widest">تسجيل الخروج</span>
          </button>
        </div>
      </div>
    </>
  );
};

export default Sidebar;
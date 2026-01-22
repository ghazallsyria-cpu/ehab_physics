
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
    // النقر من السايدبار يعتبر انتقالاً رئيساً لذا نصفر الـ stack في App.tsx عبر فحص الوجهة
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
            { id: 'resources-center', label: 'المكتبة الرقمية', icon: '📚' },
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
          { label: 'القائمة الرئيسية', items: [
            { id: 'dashboard', label: 'لوحة التحكم', icon: '📊' },
            { id: 'admin-students', label: 'إدارة المستخدمين', icon: '👥' },
            { id: 'admin-teachers', label: 'إدارة المعلمين', icon: '👨‍🏫' },
            { id: 'admin-curriculum', label: 'إدارة المسارات', icon: '📚' },
            { id: 'admin-live-sessions', label: 'الجلسات المباشرة', icon: '📡' },
            { id: 'admin-quizzes', label: 'إدارة الاختبارات', icon: '❓' },
            { id: 'admin-assets', label: 'مكتبة الوسائط', icon: '🖼️' },
            { id: 'admin-financials', label: 'التقارير المالية', icon: '🧾' },
            { id: 'admin-settings', label: 'إعدادات المنصة', icon: '⚙️' },
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
      <div className={`fixed inset-y-0 right-0 z-[60] w-72 bg-[#0A2540] border-l border-white/5 flex flex-col transition-transform duration-500 shadow-[0_0_50px_rgba(0,0,0,0.5)] ${isOpen ? 'translate-x-0' : 'translate-x-full lg:translate-x-0'}`}>
        <div className="p-6">
          <div className="bg-white/[0.03] border border-white/5 p-4 rounded-3xl flex items-center gap-4 relative overflow-hidden group">
             <div className="absolute inset-0 bg-gradient-to-r from-amber-500/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
             <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-amber-500 to-yellow-600 flex items-center justify-center text-black shadow-lg shadow-amber-500/20 shrink-0 relative z-10 font-black">
                {user.name.charAt(0)}
             </div>
             <div className="min-w-0 relative z-10">
                <h3 className="font-bold text-white truncate text-sm">{user.name}</h3>
                <span className="text-[9px] text-slate-500 uppercase font-black tracking-widest">{user.role}</span>
             </div>
          </div>
        </div>

        <nav className="flex-1 px-4 overflow-y-auto no-scrollbar space-y-8 pb-10">
          {navItems.map((group, idx) => (
            <div key={idx}>
              <p className="px-4 text-[9px] font-black text-slate-600 uppercase tracking-[0.2em] mb-3">{group.label}</p>
              <div className="space-y-1">
                {group.items.map((item: any) => (
                  <button
                    key={item.id + (item.subject || '')}
                    onClick={() => navigate(item.id as ViewState, item.subject)}
                    className={`w-full flex items-center gap-4 px-4 py-3 rounded-2xl transition-all duration-300 group ${currentView === item.id && (!item.subject || item.subject === 'Physics') ? 'bg-amber-400 text-black shadow-lg shadow-amber-400/10' : 'text-slate-400 hover:bg-white/5 hover:text-white'}`}
                  >
                    <span className="text-lg">{item.icon}</span>
                    <span className="font-bold text-[13px] tracking-wide">{item.label}</span>
                  </button>
                ))}
              </div>
            </div>
          ))}
        </nav>

        <div className="p-6 border-t border-white/5 bg-black/20">
          <button onClick={onLogout} className="w-full flex items-center justify-center gap-3 p-3.5 rounded-2xl bg-red-500/10 border border-red-500/20 text-red-500 hover:bg-red-500 hover:text-white transition-all font-black text-xs uppercase tracking-widest">
            <span>🚪</span> تسجيل الخروج
          </button>
        </div>
      </div>
    </>
  );
};

export default Sidebar;

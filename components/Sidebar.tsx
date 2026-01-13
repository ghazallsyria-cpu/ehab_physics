
import React from 'react';
import { ViewState, UserRole } from '../types';

interface SidebarProps {
  currentView: ViewState;
  setView: (view: ViewState) => void;
  userRole: UserRole;
  onLogout: () => void;
  isOpen?: boolean;
  onClose?: () => void;
}

const Sidebar: React.FC<SidebarProps> = ({ currentView, setView, userRole, onLogout, isOpen, onClose }) => {
  
  const navItems = userRole === 'student' ? [
    { label: 'القيادة', items: [
      { id: 'dashboard', label: 'الرئيسية', icon: '🏠' },
      { id: 'physics-journey', label: 'مسار المنهج', icon: '🚀' },
      { id: 'university-bridge', label: 'جسر الجامعة', icon: '🎓' },
      { id: 'teachers', label: 'المعلمون', icon: '👨‍🏫' },
    ]},
    { label: 'المصادر', items: [
      { id: 'library', label: 'المكتبة الرقمية', icon: '📚' },
      { id: 'question-bank', label: 'بنك الأسئلة', icon: '📖' },
      { id: 'scientific-articles', label: 'مقالات إثرائية', icon: '📰' },
    ]},
    { label: 'أدوات الذكاء', items: [
      { id: 'ai-chat', label: 'المساعد الذكي', icon: '🤖' },
      { id: 'physics-solver', label: 'حل المسائل', icon: '📝' },
      { id: 'equation-solver', label: 'محلل المعادلات', icon: '📐' },
      { id: 'physics-image-gen', label: 'مولد الصور', icon: '🎨' },
      { id: 'physics-veo', label: 'فيديو توليدي', icon: '🎬' },
    ]},
    { label: 'المختبرات', items: [
      { id: 'future-labs', label: 'مختبرات المستقبل', icon: '🧪' },
      { id: 'ar-lab', label: 'الواقع المعزز', icon: '👓' },
      { id: 'physics-game', label: 'تحدي الجاذبية', icon: '🍎' },
    ]},
    { label: 'التفاعل', items: [
      { id: 'live-sessions', label: 'البث المباشر', icon: '📡' },
      { id: 'exam-center', label: 'الاختبارات', icon: '⚡' },
      { id: 'todo-list', label: 'مهامي', icon: '✅' },
    ]},
    { label: 'الشخصي', items: [
        { id: 'progress-report', label: 'الإنجاز', icon: '📈' },
        { id: 'billing', label: 'الاشتراك', icon: '💳' },
    ]}
  ] : [
    { label: 'الإدارة', items: [
      { id: 'dashboard', label: 'الرئيسية', icon: '📊' },
      { id: 'bank-digitizer', label: 'المحتوى', icon: '⚙️' },
    ]}
  ];

  return (
    <>
      {isOpen && (
        <div className="fixed inset-0 bg-slate-900/80 backdrop-blur-sm z-[55] lg:hidden transition-opacity" onClick={onClose} />
      )}

      <div className={`
        fixed inset-y-0 right-0 z-[60] 
        w-72 bg-slate-900/95 backdrop-blur-2xl border-l border-white/5 
        flex flex-col transition-transform duration-500 cubic-bezier(0.4, 0, 0.2, 1) shadow-2xl
        ${isOpen ? 'translate-x-0' : 'translate-x-full lg:translate-x-0'}
      `}>
        {/* Header */}
        <div className="p-8 pb-4">
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-sky-500 to-blue-600 flex items-center justify-center text-white shadow-lg shadow-sky-500/20">
               <span className="text-xl font-bold">⚛️</span>
            </div>
            <h2 className="text-lg font-bold text-white tracking-tight">المركز السوري للعلوم</h2>
          </div>
        </div>
        
        {/* Nav */}
        <nav className="flex-1 px-4 py-6 overflow-y-auto no-scrollbar space-y-8">
          {navItems.map((group, idx) => (
            <div key={idx}>
              <p className="px-4 text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-3">{group.label}</p>
              <div className="space-y-1">
                {group.items.map(item => (
                  <button
                    key={item.id}
                    onClick={() => { setView(item.id as ViewState); if (window.innerWidth < 1024) onClose?.(); }}
                    className={`
                      w-full flex items-center gap-4 px-4 py-3 rounded-xl transition-all duration-300 group relative overflow-hidden
                      ${currentView === item.id 
                        ? 'bg-sky-500/10 text-sky-400' 
                        : 'text-slate-400 hover:bg-white/5 hover:text-white'}
                    `}
                  >
                    <span className={`text-lg transition-transform duration-300 ${currentView === item.id ? 'scale-110' : 'group-hover:scale-110'}`}>{item.icon}</span>
                    <span className="font-medium text-sm">{item.label}</span>
                    {currentView === item.id && <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-6 rounded-r-full bg-sky-500 shadow-[0_0_10px_#38bdf8]"></div>}
                  </button>
                ))}
              </div>
            </div>
          ))}
        </nav>

        {/* Footer */}
        <div className="p-6 border-t border-white/5">
          <button onClick={onLogout} className="w-full flex items-center justify-center gap-3 p-3 rounded-xl border border-red-500/10 text-red-400 hover:bg-red-500/10 hover:border-red-500/20 transition-all group">
            <span className="text-sm group-hover:-translate-x-1 transition-transform">🚪</span>
            <span className="font-bold text-xs">تسجيل الخروج</span>
          </button>
        </div>
      </div>
    </>
  );
};

export default Sidebar;

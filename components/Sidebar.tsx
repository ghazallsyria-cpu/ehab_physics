
import React from 'react';
import { ViewState, User } from '../types';

interface SidebarProps {
  currentView: ViewState;
  setView: (view: ViewState) => void;
  user: User;
  onLogout: () => void;
  isOpen?: boolean;
  onClose?: () => void;
}

const Sidebar: React.FC<SidebarProps> = ({ currentView, setView, user, onLogout, isOpen, onClose }) => {
  
  const navItems = user.role === 'student' ? [
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
      { id: 'forum', label: 'منتدى النقاش', icon: '💬' },
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
        w-72 bg-[#0f172a]/95 backdrop-blur-2xl border-l border-white/5 
        flex flex-col transition-transform duration-500 cubic-bezier(0.4, 0, 0.2, 1) shadow-[0_0_50px_rgba(0,0,0,0.5)]
        ${isOpen ? 'translate-x-0' : 'translate-x-full lg:translate-x-0'}
      `}>
        {/* User Profile Card */}
        <div className="p-6 pb-2">
          <div className="bg-white/[0.03] border border-white/5 p-4 rounded-3xl flex items-center gap-4 mb-6 relative overflow-hidden group">
             <div className="absolute inset-0 bg-gradient-to-r from-sky-500/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
             
             <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-sky-500 to-blue-600 flex items-center justify-center text-white shadow-lg shadow-sky-500/20 shrink-0 relative z-10 font-bold text-lg">
                {user.name.charAt(0)}
             </div>
             <div className="min-w-0 relative z-10">
                <h3 className="font-bold text-white truncate text-sm">{user.name}</h3>
                <div className="flex items-center gap-1.5 mt-1">
                   <div className={`w-2 h-2 rounded-full ${user.subscription === 'premium' || user.subscription === 'university' ? 'bg-[#fbbf24]' : 'bg-gray-500'}`}></div>
                   <span className="text-[10px] text-slate-400 uppercase font-bold tracking-wider truncate">
                     {user.role === 'admin' ? 'Admin' : user.subscription === 'premium' ? 'Premium' : 'Student'}
                   </span>
                </div>
             </div>
          </div>
        </div>
        
        {/* Navigation */}
        <nav className="flex-1 px-4 overflow-y-auto no-scrollbar space-y-8 pb-10">
          {navItems.map((group, idx) => (
            <div key={idx} className="animate-slideUp" style={{animationDelay: `${idx * 0.05}s`}}>
              <p className="px-4 text-[9px] font-black text-slate-500 uppercase tracking-[0.2em] mb-3 opacity-80">{group.label}</p>
              <div className="space-y-1">
                {group.items.map(item => (
                  <button
                    key={item.id}
                    onClick={() => { setView(item.id as ViewState); if (window.innerWidth < 1024) onClose?.(); }}
                    className={`
                      w-full flex items-center gap-4 px-4 py-3 rounded-2xl transition-all duration-300 group relative overflow-hidden
                      ${currentView === item.id 
                        ? 'bg-gradient-to-r from-sky-500/20 to-blue-600/5 text-sky-400 border border-sky-500/10' 
                        : 'text-slate-400 hover:bg-white/[0.03] hover:text-white border border-transparent'}
                    `}
                  >
                    <span className={`text-lg transition-transform duration-300 ${currentView === item.id ? 'scale-110 drop-shadow-[0_0_8px_rgba(56,189,248,0.5)]' : 'group-hover:scale-110'}`}>{item.icon}</span>
                    <span className="font-bold text-[13px] tracking-wide">{item.label}</span>
                    {currentView === item.id && (
                        <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-5 rounded-r-full bg-sky-400 shadow-[0_0_15px_#38bdf8]"></div>
                    )}
                  </button>
                ))}
              </div>
            </div>
          ))}
        </nav>

        {/* Footer */}
        <div className="p-6 border-t border-white/5 bg-[#0f172a]">
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

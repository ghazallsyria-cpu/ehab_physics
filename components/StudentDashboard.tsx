
import React, { useState, useEffect } from 'react';
import { User, ViewState } from '../types';
import { Settings, Eye, Layout, X, Check, ArrowRight } from 'lucide-react';

interface StudentDashboardProps {
  user: User;
  setView: (view: ViewState) => void;
}

const StudentDashboard: React.FC<StudentDashboardProps> = ({ user, setView }) => {
  const [isCustomizeOpen, setIsCustomizeOpen] = useState(false);
  const [visibleModules, setVisibleModules] = useState({
    journey: true,
    tools: true,
    premium: true,
    stats: true
  });

  // Load preferences on mount
  useEffect(() => {
    const savedPrefs = localStorage.getItem(`ssc_dashboard_prefs_${user.uid}`);
    if (savedPrefs) {
      try {
        setVisibleModules(JSON.parse(savedPrefs));
      } catch (e) {
        console.error("Failed to parse dashboard prefs");
      }
    }
  }, [user.uid]);

  const toggleModule = (key: keyof typeof visibleModules) => {
    const newPrefs = { ...visibleModules, [key]: !visibleModules[key] };
    setVisibleModules(newPrefs);
    localStorage.setItem(`ssc_dashboard_prefs_${user.uid}`, JSON.stringify(newPrefs));
  };
  
  const checkEligibility = (itemId: string): boolean => {
    if (user.role === 'admin' || user.role === 'teacher') return true;
    return true; // Simplified for demo
  };

  const isAllHidden = !Object.values(visibleModules).some(Boolean);
  const isSidebarVisible = visibleModules.premium || visibleModules.stats;

  return (
    <div className="space-y-10 animate-fadeIn font-['Tajawal'] pb-24 text-right relative" dir="rtl">
      
      {/* Header / Welcome Section */}
      <div className="flex flex-col md:flex-row justify-between items-end gap-6">
         <div className="flex-1">
            <div className="flex items-center gap-3 mb-2">
               <span className="w-2 h-2 bg-emerald-500 rounded-full shadow-[0_0_10px_#10b981] animate-pulse"></span>
               <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">المساحة الشخصية</span>
            </div>
            <h2 className="text-3xl md:text-4xl font-bold text-white tracking-tight">
               مرحباً، <span className="text-sky-400">{user.name.split(' ')[0]}</span>
            </h2>
            <p className="text-slate-400 text-sm font-medium mt-2 opacity-80">
              الصف {user.grade} • {user.grade === '10' ? 'عام' : 'الشعبة العلمية'}
            </p>
         </div>
         
         <div className="flex items-center gap-4">
            <div className="flex gap-3 bg-slate-800/50 border border-white/5 p-1 rounded-2xl">
              <div className="px-5 py-2 text-center">
                 <p className="text-[9px] font-bold text-slate-500 uppercase tracking-widest mb-1">النقاط</p>
                 <p className="text-lg font-bold text-sky-400 tabular-nums">{user.points || 0}</p>
              </div>
              <div className="w-px bg-white/5 my-2"></div>
              <div className="px-5 py-2 text-center">
                 <p className="text-[9px] font-bold text-slate-500 uppercase tracking-widest mb-1">المستوى</p>
                 <p className="text-lg font-bold text-[#fbbf24] tabular-nums">3</p>
              </div>
            </div>
            
            <button 
              onClick={() => setIsCustomizeOpen(true)}
              className="bg-slate-800/50 border border-white/5 p-4 rounded-2xl hover:bg-slate-700/50 hover:border-sky-500/30 text-slate-400 hover:text-white transition-all group"
              title="تخصيص الواجهة"
            >
              <Settings className="w-6 h-6 group-hover:rotate-90 transition-transform duration-500" />
            </button>
         </div>
      </div>

      {/* Customization Modal */}
      {isCustomizeOpen && (
        <div className="fixed inset-0 z-[100] bg-slate-900/80 backdrop-blur-xl flex items-center justify-center p-6 animate-fadeIn">
          <div className="bg-[#0f172a] border border-white/10 w-full max-w-lg p-8 rounded-[40px] relative shadow-2xl">
            <button 
              onClick={() => setIsCustomizeOpen(false)}
              className="absolute top-6 left-6 p-2 bg-white/5 rounded-full hover:bg-white/10 transition-all text-slate-400 hover:text-white"
            >
              <X className="w-5 h-5" />
            </button>
            
            <div className="flex items-center gap-4 mb-8">
              <div className="w-14 h-14 rounded-2xl bg-sky-500/10 border border-sky-500/20 flex items-center justify-center text-sky-400">
                <Layout className="w-7 h-7" />
              </div>
              <div>
                <h3 className="text-xl font-bold text-white">تخصيص مساحة العمل</h3>
                <p className="text-xs text-slate-400 font-bold mt-1">قم بإظهار أو إخفاء الوحدات حسب أولوياتك الدراسية.</p>
              </div>
            </div>

            <div className="space-y-3">
              {[
                { id: 'journey', label: 'خريطة المنهج (Journey Map)', icon: '🚀', desc: 'تتبع التقدم والدروس' },
                { id: 'tools', label: 'الأدوات والاختبارات', icon: '⚡', desc: 'الوصول السريع للأدوات' },
                { id: 'premium', label: 'بانر الترقية (Premium)', icon: '💎', desc: 'عروض الباقات المميزة' },
                { id: 'stats', label: 'الإحصائيات السريعة', icon: '📊', desc: 'ملخص الأداء الأسبوعي' },
              ].map((item) => (
                <div 
                  key={item.id}
                  onClick={() => toggleModule(item.id as keyof typeof visibleModules)}
                  className={`flex items-center justify-between p-4 rounded-2xl border cursor-pointer transition-all ${
                    visibleModules[item.id as keyof typeof visibleModules] 
                      ? 'bg-sky-500/5 border-sky-500/30' 
                      : 'bg-white/[0.02] border-white/5 opacity-60 hover:opacity-100'
                  }`}
                >
                  <div className="flex items-center gap-4">
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-lg ${visibleModules[item.id as keyof typeof visibleModules] ? 'bg-sky-500/20 text-sky-400' : 'bg-white/5 text-slate-500'}`}>
                      {item.icon}
                    </div>
                    <div>
                        <span className={`text-sm font-bold block ${visibleModules[item.id as keyof typeof visibleModules] ? 'text-white' : 'text-slate-400'}`}>{item.label}</span>
                        <span className="text-[10px] text-slate-500 font-bold">{item.desc}</span>
                    </div>
                  </div>
                  
                  {/* Toggle Switch */}
                  <div className={`w-12 h-7 rounded-full p-1 transition-all duration-300 ${visibleModules[item.id as keyof typeof visibleModules] ? 'bg-sky-500' : 'bg-slate-700'}`}>
                    <div className={`w-5 h-5 bg-white rounded-full shadow-md transition-all duration-300 ${visibleModules[item.id as keyof typeof visibleModules] ? '-translate-x-[20px]' : ''}`}></div>
                  </div>
                </div>
              ))}
            </div>

            <button 
              onClick={() => setIsCustomizeOpen(false)}
              className="w-full mt-8 py-4 bg-white text-slate-900 rounded-2xl font-bold text-xs uppercase tracking-widest hover:bg-sky-50 transition-all shadow-lg"
            >
              حفظ التغييرات
            </button>
          </div>
        </div>
      )}

      {isAllHidden ? (
        <div className="py-32 text-center opacity-60 border-2 border-dashed border-slate-800 rounded-[50px] animate-fadeIn bg-slate-900/50">
           <div className="w-20 h-20 mx-auto bg-slate-800 rounded-full flex items-center justify-center mb-6 text-slate-500">
             <Eye className="w-10 h-10" />
           </div>
           <h3 className="text-2xl font-bold text-white mb-2">مساحة العمل فارغة</h3>
           <p className="text-sm font-bold text-slate-500 mb-8">لقد قمت بإخفاء جميع الوحدات. قم بتخصيص العرض للبدء.</p>
           <button onClick={() => setIsCustomizeOpen(true)} className="text-sky-400 hover:text-sky-300 font-bold text-sm flex items-center justify-center gap-2 mx-auto">
             <Settings className="w-4 h-4" />
             إعادة تخصيص العرض
           </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
           {/* Main Modules Area (Expands if sidebar is hidden) */}
           <div className={`grid grid-cols-1 md:grid-cols-2 gap-6 ${isSidebarVisible ? 'lg:col-span-8' : 'lg:col-span-12'}`}>
              
              {/* Journey Module */}
              {visibleModules.journey && (
                <div 
                   onClick={() => setView('physics-journey')}
                   className="col-span-full bg-gradient-to-br from-sky-500/10 to-indigo-600/10 border border-sky-500/20 p-8 rounded-[40px] cursor-pointer hover:border-sky-500/40 transition-all group relative overflow-hidden animate-slideUp"
                >
                   <div className="absolute top-0 right-0 p-6 opacity-10 group-hover:opacity-20 transition-opacity">
                      <svg className="w-32 h-32 text-sky-500" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2L2 7l10 5 10-5-10-5zm0 9l2.5-1.25L12 8.5l-2.5 1.25L12 11zm0 2.5l-5-2.5-5 2.5L12 22l10-8.5-5-2.5-5 2.5z"/></svg>
                   </div>
                   <div className="relative z-10">
                      <span className="px-3 py-1 bg-sky-500/20 text-sky-400 text-[10px] font-bold rounded-full uppercase tracking-widest mb-4 inline-block border border-sky-500/20">المنهج الدراسي</span>
                      <h3 className="text-2xl font-bold text-white mb-2">خريطة الصف {user.grade}</h3>
                      <p className="text-sm text-slate-400 font-medium max-w-md">تصفح الوحدات والفصول الدراسية وفق المنهج السوري المعتمد.</p>
                      <div className="mt-6 flex items-center gap-2 text-sky-400 font-bold text-xs uppercase tracking-widest group-hover:gap-4 transition-all">
                         <span>دخول الفصل الافتراضي</span>
                         <ArrowRight className="w-4 h-4" />
                      </div>
                   </div>
                </div>
              )}

              {/* Tools Grid */}
              {visibleModules.tools && [
                 { id: 'exam-center', title: 'مركز الاختبارات', icon: '📝', desc: 'تقييم ذاتي ومراجعة', color: 'text-rose-400', border: 'hover:border-rose-400/40', bg: 'hover:bg-rose-400/5' },
                 { id: 'question-bank', title: 'بنك الأسئلة', icon: '📚', desc: 'أسئلة سنوات سابقة', color: 'text-amber-400', border: 'hover:border-amber-400/40', bg: 'hover:bg-amber-400/5' },
              ].map((item) => {
                 const active = checkEligibility(item.id);
                 return (
                    <div 
                       key={item.id}
                       onClick={() => active ? setView(item.id as ViewState) : setView('billing')}
                       className={`bg-slate-800/30 border border-white/5 p-6 rounded-[30px] cursor-pointer transition-all group animate-slideUp ${active ? `${item.border} ${item.bg}` : 'opacity-60 grayscale'} col-span-full md:col-span-1`}
                    >
                       <div className="flex justify-between items-start mb-4">
                          <div className="text-3xl bg-slate-700/30 w-14 h-14 rounded-2xl flex items-center justify-center shadow-inner text-white">{item.icon}</div>
                          {!active && <span className="text-[10px] font-bold bg-white/5 px-2 py-1 rounded text-slate-400 border border-white/5">مغلق 🔒</span>}
                       </div>
                       <h4 className={`text-lg font-bold text-white mb-1 group-hover:${item.color.replace('text-', '')} transition-colors`}>{item.title}</h4>
                       <p className="text-xs text-slate-500 font-bold">{item.desc}</p>
                    </div>
                 )
              })}
           </div>

           {/* Sidebar Stats / CTA */}
           {isSidebarVisible && (
             <div className="lg:col-span-4 space-y-6">
                {visibleModules.premium && (
                  <div className="bg-amber-500/5 border border-amber-500/20 p-8 rounded-[40px] text-center relative overflow-hidden animate-slideUp group hover:bg-amber-500/10 transition-all">
                     <div className="relative z-10">
                        <div className="w-16 h-16 bg-amber-500/20 rounded-full flex items-center justify-center text-2xl mx-auto mb-4 text-[#fbbf24]">💎</div>
                        <h3 className="text-xl font-bold text-white mb-2">باقة التفوق</h3>
                        <p className="text-xs text-amber-200/60 mb-6 font-bold leading-relaxed">احصل على حلول كتاب التمارين ونماذج اختبارات محلولة.</p>
                        <button 
                           onClick={() => setView('billing')}
                           className="w-full py-4 bg-[#fbbf24] text-black rounded-2xl font-bold text-xs uppercase tracking-widest shadow-lg hover:scale-105 transition-transform"
                        >
                           ترقية الحساب
                        </button>
                     </div>
                  </div>
                )}

                {visibleModules.stats && (
                  <div className="bg-slate-800/40 border border-white/5 p-8 rounded-[40px] animate-slideUp">
                     <h4 className="text-sm font-bold text-white mb-6 border-r-4 border-sky-500 pr-3">إحصائيات سريعة</h4>
                     <div className="space-y-5">
                        <div className="space-y-2">
                           <div className="flex justify-between items-center text-xs">
                              <span className="text-slate-500 font-bold">الوحدات المنجزة</span>
                              <span className="text-white font-bold">2 / 5</span>
                           </div>
                           <div className="w-full h-1.5 bg-slate-700/50 rounded-full overflow-hidden">
                             <div className="w-[40%] h-full bg-sky-500 rounded-full shadow-[0_0_10px_#38bdf8]"></div>
                           </div>
                        </div>
                        
                        <div className="space-y-2">
                           <div className="flex justify-between items-center text-xs">
                              <span className="text-slate-500 font-bold">ساعات الدراسة</span>
                              <span className="text-white font-bold">4.5h</span>
                           </div>
                           <div className="w-full h-1.5 bg-slate-700/50 rounded-full overflow-hidden">
                             <div className="w-[35%] h-full bg-emerald-500 rounded-full"></div>
                           </div>
                        </div>
                     </div>
                  </div>
                )}
             </div>
           )}
        </div>
      )}
    </div>
  );
};

export default StudentDashboard;

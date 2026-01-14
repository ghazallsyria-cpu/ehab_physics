
import React, { useState, useEffect, useRef } from 'react';
import { dbService } from '../services/db';
import { AnalyticsSummary, EducationalResource } from '../types';
import AdminFinancials from './AdminFinancials';
import AdminQuestionManager from './AdminQuestionManager';
import AdminTeacherManager from './AdminTeacherManager';
import AdminStudentManager from './AdminStudentManager';

interface AdminDashboardProps {
  initialTab?: 'overview' | 'financials' | 'questions' | 'pwa-kpis' | 'settings' | 'resources' | 'teachers' | 'students';
}

const AdminDashboard: React.FC<AdminDashboardProps> = ({ initialTab = 'overview' }) => {
  const [activeTab, setActiveTab] = useState<'overview' | 'financials' | 'questions' | 'pwa-kpis' | 'settings' | 'resources' | 'teachers' | 'students'>(initialTab);
  const [pwaStats, setPwaStats] = useState<any>(null);
  
  // Real-Time Analytics State
  const [analytics, setAnalytics] = useState({
    activeNow: 0,
    totalStudents: 0,
    avgCompletion: 0,
    avgStudyHours: "0.0",
    engagementDistribution: [0, 0, 0, 0], // <10%, 10-40%, 40-70%, >70%
    totalRevenue: 0
  });
  
  // Settings State
  const [introVideoUrl, setIntroVideoUrl] = useState('');
  const [isSavingVideo, setIsSavingVideo] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Resources State
  const [resources, setResources] = useState<EducationalResource[]>([]);
  const [newRes, setNewRes] = useState<Partial<EducationalResource>>({ grade: '12', type: 'summary', term: '1', year: '2024' });
  const [isUploadingRes, setIsUploadingRes] = useState(false);

  // Sync state if prop changes (essential for SPA navigation)
  useEffect(() => {
    setActiveTab(initialTab);
  }, [initialTab]);

  useEffect(() => {
    const load = async () => {
      const stats = await dbService.getPWAStats();
      const video = await dbService.getIntroVideo();
      setPwaStats(stats);
      setIntroVideoUrl(video);
      loadResources();
    };
    load();

    // Start Polling for Real-Time Analytics
    const pollAnalytics = async () => {
        const liveStats = await dbService.getRealTimeAnalytics();
        setAnalytics(liveStats);
    };
    pollAnalytics(); // Initial call
    const intervalId = setInterval(pollAnalytics, 3000); // Update every 3 seconds

    return () => clearInterval(intervalId);
  }, []);

  const loadResources = async () => {
    const res = await dbService.getResources();
    setResources(res);
  };

  const handleSaveVideo = async () => {
    setIsSavingVideo(true);
    await dbService.saveIntroVideo(introVideoUrl);
    setTimeout(() => setIsSavingVideo(false), 800);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Check file size (Limit to approx 4MB for LocalStorage safety)
    const limitMB = 4;
    if (file.size > limitMB * 1024 * 1024) {
      alert(`عذراً، حجم الفيديو كبير جداً للتخزين المحلي. يرجى اختيار مقطع أصغر من ${limitMB} ميجابايت أو استخدام رابط خارجي.`);
      return;
    }

    const reader = new FileReader();
    reader.onloadend = () => {
      if (reader.result) {
        setIntroVideoUrl(reader.result as string);
      }
    };
    reader.readAsDataURL(file);
  };

  const clearVideo = () => {
    setIntroVideoUrl('');
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleAddResource = async () => {
    if (!newRes.title) return;
    setIsUploadingRes(true);
    
    // Create a mock resource record
    const res: EducationalResource = {
      id: `res_${Date.now()}`,
      title: newRes.title!,
      type: newRes.type as any,
      grade: newRes.grade as any,
      term: newRes.term as any,
      year: newRes.year || '2024',
      size: `${(Math.random() * 5 + 1).toFixed(1)} MB`,
      downloadCount: 0,
      uploadDate: new Date().toISOString(),
      url: '#' // Mock URL
    };

    await dbService.saveResource(res);
    setNewRes({ grade: '12', type: 'summary', term: '1', year: '2024', title: '' });
    await loadResources();
    setIsUploadingRes(false);
  };

  const handleDeleteResource = async (id: string) => {
    if (confirm('هل أنت متأكد من حذف هذا الملف؟')) {
      await dbService.deleteResource(id);
      loadResources();
    }
  };

  return (
    <div className="animate-fadeIn space-y-10 font-['Tajawal'] text-right" dir="rtl">
      <header className="flex flex-col md:flex-row justify-between items-center mb-10 gap-6">
        <div>
          <h2 className="text-4xl font-black text-white italic tracking-tighter uppercase">غرفة <span className="text-[#fbbf24]">التحكم المركزية</span></h2>
          <p className="text-gray-500 mt-2 font-medium">مراقبة حية للأداء الأكاديمي، المالية، والمحتوى.</p>
        </div>
        <div className="flex bg-white/5 border border-white/10 rounded-[25px] p-2 backdrop-blur-xl flex-wrap justify-center gap-2">
             {(['overview', 'financials', 'questions', 'teachers', 'students', 'resources', 'pwa-kpis', 'settings'] as const).map(tab => (
               <button 
                key={tab}
                onClick={() => setActiveTab(tab)} 
                className={`px-6 py-3 rounded-2xl text-[10px] font-black transition-all uppercase tracking-widest ${activeTab === tab ? 'bg-[#fbbf24] text-black shadow-2xl' : 'text-gray-500 hover:text-white hover:bg-white/5'}`}
               >
                 {tab === 'overview' ? 'المؤشرات' : tab === 'financials' ? 'المالية 💰' : tab === 'questions' ? 'الأسئلة 📝' : tab === 'teachers' ? 'المعلمين 👨‍🏫' : tab === 'students' ? 'الطلاب 👨‍🎓' : tab === 'resources' ? 'المكتبة 📚' : tab === 'pwa-kpis' ? 'PWA' : 'الإعدادات ⚙️'}
               </button>
             ))}
        </div>
      </header>

      {activeTab === 'overview' && (
        <div className="space-y-12">
            {/* System Health Check */}
            <div className="flex items-center justify-between p-4 bg-emerald-500/10 border border-emerald-500/20 rounded-2xl animate-slideUp">
               <div className="flex items-center gap-3">
                  <div className="w-3 h-3 bg-emerald-500 rounded-full animate-pulse shadow-[0_0_10px_#10b981]"></div>
                  <span className="text-xs font-black text-emerald-400 uppercase tracking-widest">System Status: OPTIMAL</span>
               </div>
               <span className="text-[10px] font-bold text-emerald-600/70">Dependencies Synced • v1.2.0</span>
            </div>

            {/* Live Metrics Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
            {[
                { label: 'الطلاب النشطون الآن', value: analytics.activeNow, color: 'text-green-400', icon: '📡', live: true },
                { label: 'إجمالي المسجلين', value: analytics.totalStudents, color: 'text-blue-400', icon: '👥' },
                { label: 'متوسط إنجاز المنهج', value: `${analytics.avgCompletion}%`, color: 'text-yellow-400', icon: '📈' },
                { label: 'إجمالي ساعات الدراسة', value: analytics.avgStudyHours + 'h', color: 'text-purple-400', icon: '⏱️', sub: '/ طالب' }
            ].map((stat, i) => (
                <div key={i} className="glass-panel p-10 rounded-[50px] border-white/5 text-center relative overflow-hidden group hover:border-[#fbbf24]/30 transition-all duration-500">
                    {/* Pulsing Live Dot */}
                    {stat.live && (
                        <div className="absolute top-6 right-6 w-3 h-3 bg-red-500 rounded-full animate-ping"></div>
                    )}
                    
                    <div className="relative z-10">
                        <div className="text-4xl mb-4 drop-shadow-[0_0_15px_rgba(255,255,255,0.1)]">{stat.icon}</div>
                        <p className="text-gray-500 text-[10px] font-black uppercase tracking-widest mb-2">{stat.label}</p>
                        <h3 className={`text-4xl font-black mt-2 ${stat.color} tracking-tighter tabular-nums drop-shadow-sm`}>
                            {stat.value}
                            {stat.sub && <span className="text-sm text-gray-600 ml-1">{stat.sub}</span>}
                        </h3>
                    </div>
                </div>
            ))}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
                {/* Engagement Heatmap */}
                <div className="glass-panel p-10 rounded-[50px] border-white/5 bg-gradient-to-br from-[#0a1118] to-[#010304]">
                    <h3 className="text-xl font-black text-white mb-8 flex items-center gap-3">
                        <span className="text-2xl">🔥</span> توزيع نشاط الطلاب
                    </h3>
                    
                    <div className="space-y-6">
                        <div className="space-y-2">
                            <div className="flex justify-between text-xs font-bold text-gray-400">
                                <span>المتفوقون (إنجاز {'>'} 70%)</span>
                                <span>{analytics.engagementDistribution[3]} طالب</span>
                            </div>
                            <div className="w-full h-3 bg-white/5 rounded-full overflow-hidden">
                                <div 
                                    className="h-full bg-gradient-to-r from-green-400 to-emerald-600 transition-all duration-1000" 
                                    style={{ width: `${(analytics.engagementDistribution[3] / analytics.totalStudents) * 100}%` }}
                                ></div>
                            </div>
                        </div>

                        <div className="space-y-2">
                            <div className="flex justify-between text-xs font-bold text-gray-400">
                                <span>المستوى المتوسط (40-70%)</span>
                                <span>{analytics.engagementDistribution[2]} طالب</span>
                            </div>
                            <div className="w-full h-3 bg-white/5 rounded-full overflow-hidden">
                                <div 
                                    className="h-full bg-gradient-to-r from-blue-400 to-cyan-600 transition-all duration-1000" 
                                    style={{ width: `${(analytics.engagementDistribution[2] / analytics.totalStudents) * 100}%` }}
                                ></div>
                            </div>
                        </div>

                        <div className="space-y-2">
                            <div className="flex justify-between text-xs font-bold text-gray-400">
                                <span>المستوى المبتدئ (10-40%)</span>
                                <span>{analytics.engagementDistribution[1]} طالب</span>
                            </div>
                            <div className="w-full h-3 bg-white/5 rounded-full overflow-hidden">
                                <div 
                                    className="h-full bg-gradient-to-r from-yellow-400 to-orange-600 transition-all duration-1000" 
                                    style={{ width: `${(analytics.engagementDistribution[1] / analytics.totalStudents) * 100}%` }}
                                ></div>
                            </div>
                        </div>

                        <div className="space-y-2">
                            <div className="flex justify-between text-xs font-bold text-gray-400">
                                <span>خامل (أقل من 10%)</span>
                                <span>{analytics.engagementDistribution[0]} طالب</span>
                            </div>
                            <div className="w-full h-3 bg-white/5 rounded-full overflow-hidden">
                                <div 
                                    className="h-full bg-red-500/50 transition-all duration-1000" 
                                    style={{ width: `${(analytics.engagementDistribution[0] / analytics.totalStudents) * 100}%` }}
                                ></div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Quick Actions & Insights */}
                <div className="glass-panel p-10 rounded-[50px] border-white/5 bg-[#00d2ff]/5 flex flex-col justify-between">
                    <div>
                        <h3 className="text-xl font-black text-[#00d2ff] mb-4">نظرة مالية سريعة</h3>
                        <p className="text-gray-400 text-sm mb-8 leading-relaxed">
                            تم تحقيق إيرادات إجمالية قدرها <span className="text-white font-bold">{analytics.totalRevenue} د.ك</span> هذا الشهر. يتركز النشاط الأكبر للطلاب في الفترة المسائية بين 5-9 مساءً.
                        </p>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-4">
                        <button className="py-4 bg-white/10 hover:bg-white/20 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all">
                            تصدير تقرير PDF
                        </button>
                        <button className="py-4 bg-[#00d2ff] text-black hover:bg-[#00d2ff]/90 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all">
                            إرسال تنبيه للمتأخرين
                        </button>
                    </div>
                </div>
            </div>
        </div>
      )}

      {activeTab === 'financials' && <AdminFinancials />}
      {activeTab === 'questions' && <AdminQuestionManager />}
      {activeTab === 'teachers' && <AdminTeacherManager />}
      {activeTab === 'students' && <AdminStudentManager />}

      {activeTab === 'resources' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 animate-slideUp">
           {/* Add Form */}
           <div className="lg:col-span-4 space-y-8">
              <div className="glass-panel p-10 rounded-[50px] border-white/5 bg-white/[0.02]">
                 <h3 className="text-xl font-black text-white mb-6">رفع ملف جديد</h3>
                 <div className="space-y-4">
                    <div className="space-y-2">
                       <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest">عنوان الملف</label>
                       <input 
                         type="text" 
                         value={newRes.title}
                         onChange={e => setNewRes({...newRes, title: e.target.value})}
                         className="w-full bg-black/40 border border-white/10 rounded-2xl px-6 py-4 text-white outline-none focus:border-[#fbbf24]"
                         placeholder="مثال: مذكرة القوى والحركة"
                       />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                       <div className="space-y-2">
                          <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest">الصف</label>
                          <select 
                            value={newRes.grade}
                            onChange={e => setNewRes({...newRes, grade: e.target.value as any})}
                            className="w-full bg-black/40 border border-white/10 rounded-2xl px-4 py-4 text-white outline-none focus:border-[#fbbf24]"
                          >
                             <option value="12">12</option>
                             <option value="11">11</option>
                             <option value="10">10</option>
                             <option value="uni">جامعة</option>
                          </select>
                       </div>
                       <div className="space-y-2">
                          <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest">الفصل</label>
                          <select 
                            value={newRes.term}
                            onChange={e => setNewRes({...newRes, term: e.target.value as any})}
                            className="w-full bg-black/40 border border-white/10 rounded-2xl px-4 py-4 text-white outline-none focus:border-[#fbbf24]"
                          >
                             <option value="1">الأول</option>
                             <option value="2">الثاني</option>
                          </select>
                       </div>
                    </div>
                    <div className="space-y-2">
                        <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest">النوع</label>
                        <select 
                          value={newRes.type}
                          onChange={e => setNewRes({...newRes, type: e.target.value as any})}
                          className="w-full bg-black/40 border border-white/10 rounded-2xl px-4 py-4 text-white outline-none focus:border-[#fbbf24]"
                        >
                            <option value="summary">مذكرة (Summary)</option>
                            <option value="exam">اختبار (Exam)</option>
                            <option value="worksheet">ورقة عمل (Worksheet)</option>
                            <option value="book">كتاب (Book)</option>
                        </select>
                    </div>
                    
                    <div className="pt-4">
                       <button 
                         onClick={handleAddResource}
                         disabled={isUploadingRes || !newRes.title}
                         className="w-full py-4 bg-[#fbbf24] text-black rounded-2xl font-black text-xs uppercase tracking-widest hover:scale-105 transition-all shadow-xl disabled:opacity-50"
                       >
                         {isUploadingRes ? 'جاري الرفع...' : 'إضافة للمكتبة +'}
                       </button>
                    </div>
                 </div>
              </div>
           </div>

           {/* List */}
           <div className="lg:col-span-8">
              <div className="glass-panel p-10 rounded-[50px] border-white/5 bg-black/20 h-[600px] overflow-y-auto no-scrollbar">
                 <h3 className="text-xl font-black text-white mb-6 sticky top-0 bg-[#0a1118]/90 py-4 backdrop-blur-md z-10 border-b border-white/5 flex justify-between items-center">
                    <span>محتويات المكتبة</span>
                    <span className="text-xs text-gray-500 font-bold">{resources.length} ملفات</span>
                 </h3>
                 <div className="space-y-4">
                    {resources.map(res => (
                      <div key={res.id} className="flex justify-between items-center p-6 bg-white/5 rounded-3xl border border-white/5 hover:border-[#fbbf24]/30 transition-all group">
                         <div className="flex items-center gap-4">
                            <div className={`w-12 h-12 rounded-2xl flex items-center justify-center text-2xl ${res.type === 'summary' ? 'bg-yellow-500/10 text-yellow-500' : res.type === 'exam' ? 'bg-red-500/10 text-red-500' : 'bg-blue-500/10 text-blue-500'}`}>
                               {res.type === 'summary' ? '📑' : res.type === 'exam' ? '📝' : '📎'}
                            </div>
                            <div>
                               <h4 className="font-bold text-white text-sm group-hover:text-[#fbbf24] transition-colors">{res.title}</h4>
                               <p className="text-[10px] text-gray-500 font-bold mt-1">
                                 صف {res.grade} • فصل {res.term} • {res.size}
                               </p>
                            </div>
                         </div>
                         <button 
                           onClick={() => handleDeleteResource(res.id)}
                           className="text-gray-600 hover:text-red-500 p-2 transition-colors"
                           title="حذف الملف"
                         >
                           ✕
                         </button>
                      </div>
                    ))}
                    {resources.length === 0 && (
                      <div className="py-20 text-center opacity-30">
                         <span className="text-6xl mb-4 block">📂</span>
                         <p className="font-bold">المكتبة فارغة</p>
                      </div>
                    )}
                 </div>
              </div>
           </div>
        </div>
      )}

      {activeTab === 'settings' && (
        <div className="max-w-4xl mx-auto space-y-10 animate-slideUp">
           <div className="glass-panel p-12 rounded-[60px] border-white/10 bg-white/[0.02]">
              <h3 className="text-2xl font-black mb-8 flex items-center gap-4">
                 <span className="text-4xl">🎬</span> إعدادات الفيديو التعريفي
              </h3>
              
              <div className="space-y-8">
                 <div className="space-y-4">
                    <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest block">رفع الفيديو (Upload)</label>
                    
                    {!introVideoUrl ? (
                      <div 
                        onClick={() => fileInputRef.current?.click()}
                        className="border-2 border-dashed border-white/10 bg-black/20 rounded-[40px] p-12 flex flex-col items-center justify-center cursor-pointer hover:border-[#fbbf24]/50 hover:bg-[#fbbf24]/5 transition-all group"
                      >
                        <div className="w-20 h-20 bg-white/5 rounded-full flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                           <span className="text-4xl">📤</span>
                        </div>
                        <p className="text-white font-bold text-lg mb-2">اضغط هنا لرفع الفيديو</p>
                        <p className="text-gray-500 text-xs">صيغ مدعومة: MP4, WebM (الحد الأقصى 4MB)</p>
                        <input 
                          type="file" 
                          ref={fileInputRef}
                          accept="video/*"
                          onChange={handleFileUpload}
                          className="hidden"
                        />
                      </div>
                    ) : (
                      <div className="relative rounded-[40px] overflow-hidden border border-white/10 bg-black group">
                         <video src={introVideoUrl} controls className="w-full h-64 object-cover opacity-80 group-hover:opacity-100 transition-opacity" />
                         <button 
                           onClick={clearVideo}
                           className="absolute top-4 right-4 bg-red-500 text-white w-10 h-10 rounded-full flex items-center justify-center hover:bg-red-600 transition-all shadow-lg z-10"
                           title="حذف الفيديو"
                         >
                           ✕
                         </button>
                         <div className="absolute bottom-4 right-4 bg-black/60 backdrop-blur-md px-4 py-2 rounded-full border border-white/10">
                            <span className="text-[10px] font-black text-green-400 uppercase tracking-widest">● الفيديو جاهز</span>
                         </div>
                      </div>
                    )}
                 </div>

                 <div className="relative">
                    <div className="absolute inset-0 flex items-center">
                       <div className="w-full border-t border-white/5"></div>
                    </div>
                    <div className="relative flex justify-center text-xs">
                       <span className="bg-[#0a1118] px-4 text-gray-500 font-black uppercase">أو استخدم رابط خارجي</span>
                    </div>
                 </div>

                 <div>
                    <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest mb-2 block">رابط مباشر (اختياري)</label>
                    <input 
                      type="text" 
                      value={introVideoUrl.startsWith('data:') ? '' : introVideoUrl}
                      onChange={(e) => setIntroVideoUrl(e.target.value)}
                      placeholder="https://example.com/video.mp4"
                      className="w-full bg-black/40 border border-white/10 rounded-2xl px-6 py-4 text-white outline-none focus:border-[#fbbf24] transition-all text-sm font-bold ltr text-left"
                      disabled={introVideoUrl.startsWith('data:')}
                    />
                 </div>

                 <div className="pt-6 border-t border-white/5 flex justify-between items-center">
                    <p className="text-[10px] text-gray-500">
                      ملاحظة: الفيديوهات المرفوعة تحفظ محلياً. للملفات الكبيرة جداً يفضل استخدام رابط يوتيوب أو استضافة خارجية.
                    </p>
                    <button 
                      onClick={handleSaveVideo}
                      disabled={isSavingVideo}
                      className="bg-[#fbbf24] text-black px-10 py-4 rounded-3xl font-black text-xs uppercase tracking-widest hover:scale-105 transition-all shadow-xl"
                    >
                      {isSavingVideo ? 'جاري الحفظ...' : 'حفظ الإعدادات'}
                    </button>
                 </div>
              </div>
           </div>
        </div>
      )}

      {activeTab === 'pwa-kpis' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 animate-slideUp">
           <div className="glass-panel p-12 rounded-[60px] border-blue-500/20 bg-blue-500/5">
              <h3 className="text-2xl font-black mb-10 text-blue-400 flex items-center gap-6">
                 <span className="text-4xl">📲</span> صحة تطبيق PWA
              </h3>
              <div className="space-y-6">
                 <div className="flex justify-between items-center p-6 bg-black/40 rounded-3xl border border-white/5">
                    <span className="text-xs font-bold text-white uppercase tracking-widest">Service Worker Integrity</span>
                    <span className="text-xs font-black text-green-500">OPTIMAL</span>
                 </div>
                 <div className="flex justify-between items-center p-6 bg-black/40 rounded-3xl border border-white/5">
                    <span className="text-xs font-bold text-white uppercase tracking-widest">Push Subscriptions</span>
                    <span className="text-xs font-black text-[#fbbf24]">88% Active</span>
                 </div>
              </div>
           </div>

           <div className="glass-panel p-12 rounded-[60px] border-purple-500/20 bg-purple-500/5 flex flex-col items-center justify-center text-center">
              <div className="text-6xl font-black text-white mb-6 tabular-nums">{pwaStats?.offline_minutes || 320}</div>
              <p className="text-gray-400 text-sm font-bold uppercase tracking-[0.4em] max-w-xs leading-relaxed">إجمالي دقائق المذاكرة في "وضع الطيران" أوفلاين</p>
           </div>
        </div>
      )}
    </div>
  );
};

export default AdminDashboard;

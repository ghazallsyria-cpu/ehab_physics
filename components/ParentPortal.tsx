
import React, { useState, useEffect } from 'react';
import { User, WeeklyReport, QuizAttempt, AppNotification } from '../types';
import { dbService } from '../services/db';

const ParentPortal: React.FC<{ user: User }> = ({ user }) => {
  const [studentData, setStudentData] = useState<User | null>(null);
  const [report, setReport] = useState<WeeklyReport | null>(null);
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadStudentData();
  }, [user]);

  const loadStudentData = async () => {
    const studentUid = user.linkedStudentUids?.[0];
    if (studentUid) {
      const { user: student, report: weekReport } = await dbService.getStudentProgressForParent(studentUid);
      const notes = await dbService.getNotifications(studentUid);
      setStudentData(student);
      setReport(weekReport);
      setNotifications(notes);
    }
    setIsLoading(false);
  };

  if (isLoading) return <div className="p-32 text-center text-gray-500 animate-pulse font-['Tajawal']">جاري تأمين الاتصال بنطاق الطالب...</div>;

  return (
    <div className="max-w-6xl mx-auto py-12 px-6 animate-fadeIn font-['Tajawal'] text-white text-right" dir="rtl">
      <header className="mb-16 border-r-4 border-[#00d2ff] pr-8">
        <h2 className="text-5xl font-black mb-2 tracking-tighter italic">بوابة <span className="text-[#00d2ff]">المتابعة الأكاديمية</span></h2>
        <p className="text-gray-500 text-xl font-medium">مستقبلك يبدأ هنا.. رؤية شفافة لتقدم ابنكم العلمي.</p>
      </header>

      {!studentData ? (
        <div className="py-32 text-center glass-panel rounded-[60px] border-dashed border-white/10 opacity-50">
           <span className="text-6xl mb-8 block">🗝️</span>
           <h3 className="text-2xl font-black mb-4 uppercase tracking-widest">بانتظار ربط بيانات الطالب</h3>
           <p className="text-gray-500 max-w-md mx-auto italic">يرجى استخدام كود الربط المقدم من الإدارة لتفعيل البوابة.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
          <div className="lg:col-span-8 space-y-10">
             {/* Weekly Insights */}
             <div className="glass-panel p-12 rounded-[70px] border-[#00d2ff]/20 bg-gradient-to-br from-[#00d2ff]/5 to-transparent">
                <div className="flex justify-between items-center mb-10">
                   <h3 className="text-3xl font-black">تقرير الأداء الذكي</h3>
                   <span className="bg-[#fbbf24] text-black px-5 py-2 rounded-full text-[10px] font-black uppercase tracking-widest shadow-xl">تحليل سقراط AI</span>
                </div>
                
                <div className="grid grid-cols-3 gap-6 mb-12">
                   <div className="text-center p-8 bg-black/40 rounded-[40px] border border-white/5">
                      <p className="text-[10px] font-black text-gray-500 mb-2 uppercase">معدل التحصيل</p>
                      <p className="text-4xl font-black text-[#00d2ff]">{report?.scoreAverage.toFixed(1)}%</p>
                   </div>
                   <div className="text-center p-8 bg-black/40 rounded-[40px] border border-white/5">
                      <p className="text-[10px] font-black text-gray-500 mb-2 uppercase">ساعات المذاكرة</p>
                      <p className="text-4xl font-black text-white">{report?.hoursSpent}h</p>
                   </div>
                   <div className="text-center p-8 bg-black/40 rounded-[40px] border border-white/5">
                      <p className="text-[10px] font-black text-gray-500 mb-2 uppercase">الأهداف المحققة</p>
                      <p className="text-4xl font-black text-green-500">{report?.completedUnits}</p>
                   </div>
                </div>

                <div className="p-8 bg-white/5 rounded-[40px] border border-white/5">
                   <h4 className="text-lg font-black text-[#fbbf24] mb-4">ملاحظة الخبير:</h4>
                   <p className="text-gray-300 leading-relaxed italic">"{report?.parentNote}"</p>
                </div>
             </div>

             {/* Academic Notifications */}
             <div className="glass-panel p-10 rounded-[60px] border-white/5">
                <h4 className="text-xl font-black mb-8 border-r-4 border-[#fbbf24] pr-4">آخر التحديثات</h4>
                <div className="space-y-4">
                   {notifications.length > 0 ? notifications.map(note => (
                     <div key={note.id} className="flex gap-6 items-start p-6 bg-black/40 rounded-[35px] border border-white/5 group hover:border-[#fbbf24]/30 transition-all">
                        <div className={`w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 ${note.type === 'success' ? 'bg-green-500/10 text-green-500' : 'bg-blue-500/10 text-blue-500'}`}>
                           {note.type === 'success' ? '✅' : '🔔'}
                        </div>
                        <div className="text-right">
                           <p className="text-lg font-bold text-white mb-1">{note.title}</p>
                           <p className="text-sm text-gray-400 italic mb-2">"{note.message}"</p>
                           <span className="text-[9px] font-black text-gray-600 uppercase tabular-nums">{new Date(note.timestamp).toLocaleTimeString('ar-SY')}</span>
                        </div>
                     </div>
                   )) : (
                     <div className="py-10 text-center text-gray-500 italic">لا توجد إشعارات حالياً.</div>
                   )}
                </div>
             </div>
          </div>

          <div className="lg:col-span-4 space-y-8">
             <div className="glass-panel p-10 rounded-[60px] border-white/5 text-center">
                <div className="w-32 h-32 rounded-full border-4 border-[#00d2ff] overflow-hidden mx-auto mb-8 shadow-2xl relative">
                   <img src={`https://api.dicebear.com/7.x/bottts/svg?seed=${studentData.name}`} alt={studentData.name} />
                </div>
                <h3 className="text-3xl font-black mb-2">{studentData.name}</h3>
                <p className="text-xs text-gray-500 font-bold uppercase tracking-[0.2em] mb-8">الصف {studentData.grade}</p>
                
                <div className="space-y-4 pt-8 border-t border-white/5">
                   <div className="flex justify-between items-center text-sm">
                      <span className="text-gray-500">حالة الاشتراك:</span>
                      <span className={`font-black ${studentData.subscription !== 'free' ? 'text-green-500' : 'text-orange-500'}`}>
                         {studentData.subscription === 'free' ? 'مجاني' : 'بريميوم ⚡'}
                      </span>
                   </div>
                   <div className="flex justify-between items-center text-sm">
                      <span className="text-gray-500">آخر ظهور:</span>
                      <span className="font-bold text-white">{studentData.progress.lastActivity ? new Date(studentData.progress.lastActivity).toLocaleDateString('ar-SY') : 'قيد الانتظار'}</span>
                   </div>
                </div>
                
                <button className="w-full mt-10 py-5 bg-[#00d2ff] text-black rounded-[25px] font-black text-[10px] uppercase tracking-widest shadow-2xl hover:scale-105 transition-all">تصدير تقرير PDF</button>
             </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ParentPortal;
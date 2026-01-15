
import React from 'react';
import { BookOpen, Users, GraduationCap, DollarSign, Database, Shield } from 'lucide-react';

const AdminDashboard: React.FC = () => {

  const navigate = (view: string) => {
    window.dispatchEvent(new CustomEvent('change-view', { detail: { view } }));
  };

  return (
    <div className="animate-fadeIn space-y-10 font-['Tajawal'] text-right" dir="rtl">
      <header className="mb-10">
        <h2 className="text-4xl font-black text-white italic tracking-tighter uppercase">غرفة <span className="text-[#fbbf24]">التحكم</span></h2>
        <p className="text-gray-500 mt-2 font-medium">مرحباً بك أ. ايهاب غزال في لوحة تحكم الإدارة العليا.</p>
      </header>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        <div 
          onClick={() => navigate('admin-curriculum')}
          className="glass-panel p-10 rounded-[50px] border-[#00d2ff]/20 bg-gradient-to-br from-[#00d2ff]/5 to-transparent cursor-pointer group hover:border-[#00d2ff]/40 transition-all"
        >
          <div className="w-16 h-16 rounded-3xl bg-[#00d2ff]/10 border border-[#00d2ff]/20 text-[#00d2ff] flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
            <BookOpen size={32} />
          </div>
          <h3 className="text-2xl font-black text-white mb-2 group-hover:text-[#00d2ff] transition-colors">إدارة المناهج الدراسية</h3>
          <p className="text-sm text-gray-500">إضافة وتعديل الدروس، الوحدات، والمحتوى التعليمي لجميع الصفوف.</p>
        </div>
        
        <div 
          onClick={() => navigate('admin-students')}
          className="glass-panel p-10 rounded-[50px] border-emerald-500/20 bg-gradient-to-br from-emerald-500/5 to-transparent cursor-pointer group hover:border-emerald-500/40 transition-all"
        >
          <div className="w-16 h-16 rounded-3xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-500 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
            <GraduationCap size={32} />
          </div>
          <h3 className="text-2xl font-black text-white mb-2 group-hover:text-emerald-500 transition-colors">إدارة الطلاب</h3>
          <p className="text-sm text-gray-500">متابعة تقدم الطلاب، تعديل اشتراكاتهم، وإرسال تنبيهات خاصة.</p>
        </div>

        <div 
          onClick={() => navigate('admin-teachers')}
          className="glass-panel p-10 rounded-[50px] border-[#fbbf24]/20 bg-gradient-to-br from-[#fbbf24]/5 to-transparent cursor-pointer group hover:border-[#fbbf24]/40 transition-all"
        >
          <div className="w-16 h-16 rounded-3xl bg-[#fbbf24]/10 border border-[#fbbf24]/20 text-[#fbbf24] flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
            <Users size={32} />
          </div>
          <h3 className="text-2xl font-black text-white mb-2 group-hover:text-[#fbbf24] transition-colors">إدارة المعلمين</h3>
          <p className="text-sm text-gray-500">تعيين مدرسين جدد، مراجعة تقييماتهم، وإدارة صلاحيات الوصول.</p>
        </div>

        <div 
          onClick={() => navigate('admin-financials')}
          className="glass-panel p-10 rounded-[50px] border-purple-500/20 bg-gradient-to-br from-purple-500/5 to-transparent cursor-pointer group hover:border-purple-500/40 transition-all"
        >
          <div className="w-16 h-16 rounded-3xl bg-purple-500/10 border border-purple-500/20 text-purple-500 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
            <DollarSign size={32} />
          </div>
          <h3 className="text-2xl font-black text-white mb-2 group-hover:text-purple-500 transition-colors">النظام المالي</h3>
          <p className="text-sm text-gray-500">مراجعة الفواتير المحصلة، إحصائيات الدخل، وتدقيق العمليات المالية.</p>
        </div>

        <div 
          onClick={() => navigate('admin-questions')}
          className="glass-panel p-10 rounded-[50px] border-rose-500/20 bg-gradient-to-br from-rose-500/5 to-transparent cursor-pointer group hover:border-rose-500/40 transition-all"
        >
          <div className="w-16 h-16 rounded-3xl bg-rose-500/10 border border-rose-500/20 text-rose-500 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
            <Database size={32} />
          </div>
          <h3 className="text-2xl font-black text-white mb-2 group-hover:text-rose-500 transition-colors">بنك الأسئلة المركزي</h3>
          <p className="text-sm text-gray-500">إدارة وتغذية قاعدة بيانات الأسئلة باستخدام الرقمنة الآلية 5C.</p>
        </div>

        <div 
          className="glass-panel p-10 rounded-[50px] border-white/5 bg-black/20 opacity-50 relative overflow-hidden"
        >
          <div className="w-16 h-16 rounded-3xl bg-white/5 flex items-center justify-center mb-6">
            <Shield size={32} className="text-gray-600" />
          </div>
          <h3 className="text-2xl font-black text-gray-600 mb-2">إعدادات الأمان</h3>
          <p className="text-sm text-gray-700">تشفير البيانات، النسخ الاحتياطي، وحماية الخادم (قريباً).</p>
        </div>

      </div>
    </div>
  );
};

export default AdminDashboard;

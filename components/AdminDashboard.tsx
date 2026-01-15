
import React from 'react';
import { BookOpen } from 'lucide-react';

const AdminDashboard: React.FC = () => {

  const navigate = (view: string) => {
    window.dispatchEvent(new CustomEvent('change-view', { detail: { view } }));
  };

  return (
    <div className="animate-fadeIn space-y-10 font-['Tajawal'] text-right" dir="rtl">
      <header className="mb-10">
        <h2 className="text-4xl font-black text-white italic tracking-tighter uppercase">غرفة <span className="text-[#fbbf24]">التحكم</span></h2>
        <p className="text-gray-500 mt-2 font-medium">مرحباً بك في لوحة تحكم المسؤول.</p>
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
          <p className="text-sm text-gray-500">إضافة وتعديل الدروس، الوحدات، والمحتوى التعليمي.</p>
        </div>
        
        {/* Placeholder for other admin tools */}
        <div className="glass-panel p-10 rounded-[50px] border-white/5 opacity-50">
           <h3 className="text-2xl font-black text-gray-600">إدارة الطلاب</h3>
        </div>
        <div className="glass-panel p-10 rounded-[50px] border-white/5 opacity-50">
           <h3 className="text-2xl font-black text-gray-600">إدارة المعلمين</h3>
        </div>

      </div>
    </div>
  );
};

export default AdminDashboard;

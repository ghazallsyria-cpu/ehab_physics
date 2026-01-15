import React from 'react';
import { User } from '../types';

const TeacherDashboard: React.FC<{ user: User }> = ({ user }) => {
  return (
    <div className="animate-fadeIn space-y-10 font-['Tajawal'] text-right" dir="rtl">
      <header className="mb-10">
        <h2 className="text-4xl font-black text-white tracking-tight">
          مرحباً، <span className="text-[#fbbf24]">{user.name}</span>
        </h2>
        <p className="text-slate-400 text-sm font-medium mt-2">
          لوحة تحكم المعلم
        </p>
      </header>
      <div className="glass-panel p-20 rounded-[50px] border-white/5 text-center">
        <span className="text-6xl mb-6 block">👨‍🏫</span>
        <h3 className="text-2xl font-black text-white">تحت الإنشاء</h3>
        <p className="text-gray-400 mt-2">
          تم تحديث بنية المنصة. يجري العمل على تطوير أدوات المعلمين الجديدة.
        </p>
      </div>
    </div>
  );
};

export default TeacherDashboard;

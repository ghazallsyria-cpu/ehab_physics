import React from 'react';
import { Folder } from 'lucide-react';

const AdminLessonCategories: React.FC = () => {
  return (
    <div className="p-8 text-white">
      <h2 className="text-3xl font-black mb-4 flex items-center gap-3">
        <Folder className="text-amber-400" />
        إدارة تصنيفات الدروس التفاعلية
      </h2>
      <div className="bg-white/5 p-20 rounded-2xl text-center text-gray-500 italic border border-dashed border-white/10">
        Placeholder page for managing interactive lesson categories.
      </div>
    </div>
  );
};

export default AdminLessonCategories;
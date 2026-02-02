import React from 'react';
import { Gift } from 'lucide-react';

const AdminRewards: React.FC = () => {
  return (
    <div className="p-8 text-white">
      <h2 className="text-3xl font-black mb-4 flex items-center gap-3">
        <Gift className="text-green-400" />
        إدارة المكافآت والإنجازات
      </h2>
       <div className="bg-white/5 p-20 rounded-2xl text-center text-gray-500 italic border border-dashed border-white/10">
        Placeholder page for managing rewards.
      </div>
    </div>
  );
};

export default AdminRewards;
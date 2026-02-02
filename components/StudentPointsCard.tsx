import React from 'react';
import { Star } from 'lucide-react';

const StudentPointsCard: React.FC = () => {
  return (
    <div className="p-8 bg-blue-500/10 border border-blue-500/20 rounded-2xl text-center">
        <Star className="mx-auto text-blue-400 mb-4" />
      <h3 className="text-lg font-bold text-blue-300">Student Points</h3>
      <p className="text-sm text-gray-400 mt-2">Student points card placeholder. Logic to be implemented.</p>
    </div>
  );
};

export default StudentPointsCard;

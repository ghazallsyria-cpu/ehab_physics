import React from 'react';
import { Trophy } from 'lucide-react';

const Leaderboard: React.FC = () => {
  return (
    <div className="p-8 bg-yellow-500/10 border border-yellow-500/20 rounded-2xl text-center">
        <Trophy className="mx-auto text-yellow-400 mb-4" />
      <h3 className="text-lg font-bold text-yellow-300">Leaderboard</h3>
      <p className="text-sm text-gray-400 mt-2">Leaderboard placeholder. Logic to be implemented.</p>
    </div>
  );
};

export default Leaderboard;
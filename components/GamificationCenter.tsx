import React, { useState, useEffect } from 'react';
import { User, Challenge, LeaderboardEntry, StudyGoal } from '../types';
import { dbService } from '../services/db';
import { Trophy, Shield, Zap } from 'lucide-react';

interface GamificationCenterProps {
  user: User;
  onUpdateUser: (user: User) => void;
}

const GamificationCenter: React.FC<GamificationCenterProps> = ({ user, onUpdateUser }) => {
  const [challenges, setChallenges] = useState<Challenge[]>([]);
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [studyGoals, setStudyGoals] = useState<StudyGoal[]>([]);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  useEffect(() => {
    const loadData = async () => {
      // FIX: Added 'await' to correctly handle the promises returned by dbService methods.
      // This ensures that `dbChallenges`, `dbLeaderboard`, and `dbStudyGoals` are arrays, not promises, before they are used.
      const dbChallenges = await dbService.getChallenges();
      const dbLeaderboard = await dbService.getLeaderboard();
      const dbStudyGoals = await dbService.getStudyGoals();
      
      // Mark challenges as completed based on user progress
      const userAchievements = user.progress.achievements || [];
      const updatedChallenges = dbChallenges.map(c => ({
          ...c,
          isCompleted: userAchievements.includes(c.id)
      }));
      
      setChallenges(updatedChallenges);
      setLeaderboard(dbLeaderboard);
      setStudyGoals(dbStudyGoals);
    };
    loadData();
  }, [user]);

  const handleCompleteChallenge = async (challengeId: string) => {
    const challenge = challenges.find(c => c.id === challengeId);
    if (!challenge || challenge.isCompleted) return;

    // Update challenges state locally
    setChallenges(prev => 
        prev.map(c => c.id === challengeId ? { ...c, isCompleted: true } : c)
    );

    // Update user points and achievements, then call parent updater
    const updatedUser: User = {
        ...user,
        progress: {
            ...user.progress,
            points: (user.progress.points || 0) + challenge.reward,
            achievements: [...(user.progress.achievements || []), challenge.id],
        },
        points: (user.points || 0) + challenge.reward, // Also update top-level points
    };
    
    await dbService.saveUser(updatedUser); // Persist changes
    onUpdateUser(updatedUser);

    // Show success feedback
    setSuccessMessage(`رائع! لقد ربحت ${challenge.reward} نقطة خبرة.`);
    setTimeout(() => setSuccessMessage(null), 4000);
  };

  return (
    <div className="max-w-7xl mx-auto py-12 px-6 animate-fadeIn font-['Tajawal']" dir="rtl">
      {successMessage && (
        <div className="fixed bottom-10 left-1/2 -translate-x-1/2 z-[200] bg-green-500 text-white px-8 py-4 rounded-full font-black text-sm shadow-2xl animate-slideUp">
          {successMessage}
        </div>
      )}

      <header className="mb-12 text-center">
        <h2 className="text-5xl font-black mb-4 tracking-tighter">ساحة <span className="text-[#fbbf24]">الأبطال</span></h2>
        <p className="text-gray-500 text-xl font-medium">تنافس، تعلم، وارتقِ في لوحة الصدارة.</p>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
        
        {/* Main Content: Challenges & Goals */}
        <div className="lg:col-span-8 space-y-10">
          
          {/* Challenges */}
          <div className="glass-panel p-10 rounded-[50px] border-yellow-500/20 bg-yellow-500/5">
            <h3 className="text-2xl font-black text-yellow-400 mb-6 flex items-center gap-3"><Trophy /> تحديات الأسبوع</h3>
            <div className="space-y-6">
              {challenges.map(c => (
                <div key={c.id} className={`p-6 rounded-[30px] border flex justify-between items-center group transition-all ${c.isCompleted ? 'bg-green-500/10 border-green-500/20 opacity-60' : 'bg-black/40 border-white/5 hover:border-yellow-400/40'}`}>
                  <div>
                    <h4 className="text-lg font-bold text-white mb-1">{c.title}</h4>
                    <p className="text-xs text-gray-400">{c.description}</p>
                  </div>
                  <button 
                    onClick={() => handleCompleteChallenge(c.id)}
                    disabled={c.isCompleted}
                    className={`px-6 py-3 rounded-2xl font-bold text-xs uppercase flex items-center gap-2 transition-all ${
                      c.isCompleted 
                        ? 'bg-green-500/20 text-green-400 cursor-not-allowed' 
                        : 'bg-yellow-500 text-black hover:scale-105 active:scale-95'
                    }`}>
                    {c.isCompleted ? 'مكتمل ✓' : <><Zap size={12} /> {c.reward} XP</>}
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* Community Goals */}
          <div className="glass-panel p-10 rounded-[50px] border-purple-500/20 bg-purple-500/5">
            <h3 className="text-2xl font-black text-purple-400 mb-6 flex items-center gap-3"><Shield /> أهداف المجتمع</h3>
            <div className="space-y-8">
              {studyGoals.map(g => (
                <div key={g.id}>
                  <div className="flex justify-between items-center mb-3">
                    <h4 className="text-sm font-bold text-white">{g.title}</h4>
                    <span className="text-xs font-bold text-gray-400">{g.participantCount} مشارك</span>
                  </div>
                  <div className="w-full h-3 bg-black/40 rounded-full border border-white/5 p-0.5">
                    <div className="h-full bg-gradient-to-r from-purple-500 to-indigo-500 rounded-full" style={{width: `${g.progress}%`}}></div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Leaderboard */}
        <div className="lg:col-span-4">
          <div className="glass-panel p-8 rounded-[50px] border-white/5 sticky top-24">
            <h3 className="text-xl font-bold text-center mb-6">🏆 لوحة الصدارة</h3>
            <div className="space-y-4">
              {leaderboard.map(p => (
                <div key={p.rank} className={`flex items-center gap-4 p-4 rounded-2xl border transition-all ${p.isCurrentUser ? 'bg-yellow-400/20 border-yellow-400/40 scale-105' : 'bg-white/5 border-transparent'}`}>
                  <span className={`w-8 font-black text-lg ${p.rank <= 3 ? 'text-yellow-300' : 'text-gray-500'}`}>{p.rank}</span>
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm ${p.isCurrentUser ? 'bg-yellow-400 text-black' : 'bg-gray-700 text-white'}`}>
                    {p.name.charAt(0)}
                  </div>
                  <span className={`flex-1 font-bold text-sm truncate ${p.isCurrentUser ? 'text-white' : 'text-gray-300'}`}>{p.name}</span>
                  <span className={`font-black text-sm ${p.isCurrentUser ? 'text-yellow-300' : 'text-gray-500'}`}>{p.points}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default GamificationCenter;

import React, { useState, useEffect } from 'react';
import { User, Achievement } from '../types';
import { dbService } from '../services/db';
import { Trophy, Star, Medal, Crown, Shield, Zap, Target } from 'lucide-react';

interface GamificationCenterProps {
  user: User;
}

const GamificationCenter: React.FC<GamificationCenterProps> = ({ user }) => {
  const [leaderboard, setLeaderboard] = useState<User[]>([]);
  const [achievements, setAchievements] = useState<Achievement[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadData = async () => {
        setIsLoading(true);
        try {
            // Get all students for leaderboard (simplified)
            // In a real app with many users, this should be a paginated/limited query
            const unsubscribe = dbService.subscribeToUsers((users) => {
                const sorted = users
                    .filter(u => u.role === 'student')
                    .sort((a, b) => (b.progress?.points || 0) - (a.progress?.points || 0))
                    .slice(0, 10);
                setLeaderboard(sorted);
            }, 'student');

            const allAchievements = await dbService.getAchievements();
            setAchievements(allAchievements);
            
            return () => unsubscribe();
        } catch (e) {
            console.error("Failed to load gamification data", e);
        } finally {
            setIsLoading(false);
        }
    };
    loadData();
  }, []);

  const myRank = leaderboard.findIndex(u => u.uid === user.uid) + 1;
  const userAchievements = achievements.filter(ach => user.progress?.achievements?.includes(ach.id));
  const lockedAchievements = achievements.filter(ach => !user.progress?.achievements?.includes(ach.id) && !ach.isHidden);

  return (
    <div className="max-w-6xl mx-auto py-12 px-6 animate-fadeIn font-['Tajawal'] text-right" dir="rtl">
        <header className="mb-16 text-center">
            <div className="inline-block p-4 bg-[#fbbf24]/10 rounded-full border border-[#fbbf24]/20 mb-6 shadow-[0_0_40px_rgba(251,191,36,0.2)]">
                <Trophy size={48} className="text-[#fbbf24]" />
            </div>
            <h2 className="text-5xl font-black text-white italic tracking-tighter">لوحة <span className="text-[#fbbf24] text-glow-gold">الأبطال</span></h2>
            <p className="text-gray-500 text-xl mt-4">تنافس مع زملائك واجمع الأوسمة لتتصدر القائمة.</p>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
            {/* Leaderboard Section */}
            <div className="lg:col-span-7 space-y-8">
                <div className="glass-panel p-8 rounded-[40px] border-white/5 bg-black/40">
                    <h3 className="text-2xl font-black text-white mb-8 flex items-center gap-3">
                        <Crown className="text-[#fbbf24]" /> المتصدرون هذا الأسبوع
                    </h3>
                    
                    <div className="space-y-4">
                        {leaderboard.map((student, idx) => (
                            <div key={student.uid} className={`flex items-center gap-6 p-4 rounded-[25px] border transition-all ${student.uid === user.uid ? 'bg-[#fbbf24]/10 border-[#fbbf24]/30' : 'bg-white/5 border-white/5'}`}>
                                <div className={`w-12 h-12 rounded-2xl flex items-center justify-center text-xl font-black ${idx === 0 ? 'bg-yellow-500 text-black shadow-lg shadow-yellow-500/30' : idx === 1 ? 'bg-gray-300 text-black' : idx === 2 ? 'bg-orange-400 text-black' : 'bg-white/10 text-gray-500'}`}>
                                    {idx + 1}
                                </div>
                                <div className="flex-1">
                                    <h4 className={`font-bold text-lg ${student.uid === user.uid ? 'text-[#fbbf24]' : 'text-white'}`}>{student.name}</h4>
                                    <p className="text-[10px] text-gray-500 font-bold uppercase tracking-widest">الصف {student.grade}</p>
                                </div>
                                <div className="text-center px-4">
                                    <p className="text-2xl font-black text-[#fbbf24] tabular-nums">{student.progress?.points || 0}</p>
                                    <p className="text-[9px] text-gray-500 font-bold uppercase">XP</p>
                                </div>
                            </div>
                        ))}
                    </div>
                    
                    {myRank > 10 && (
                        <div className="mt-8 pt-8 border-t border-white/10 text-center">
                            <p className="text-gray-400 font-bold">ترتيبك الحالي: <span className="text-white text-xl mx-2">#{myRank}</span> - استمر في التقدم!</p>
                        </div>
                    )}
                </div>
            </div>

            {/* Achievements Section */}
            <div className="lg:col-span-5 space-y-8">
                <div className="glass-panel p-8 rounded-[40px] border-white/5 bg-gradient-to-b from-purple-500/10 to-transparent">
                    <h3 className="text-2xl font-black text-white mb-8 flex items-center gap-3">
                        <Medal className="text-purple-400" /> إنجازاتي
                    </h3>
                    
                    <div className="grid grid-cols-2 gap-4">
                        {userAchievements.map(ach => (
                            <div key={ach.id} className="p-4 bg-purple-500/20 border border-purple-500/30 rounded-[25px] text-center group hover:scale-105 transition-all">
                                <div className="text-4xl mb-2 drop-shadow-lg group-hover:scale-110 transition-transform duration-500">{ach.icon}</div>
                                <h4 className="font-bold text-white text-sm">{ach.title}</h4>
                                <p className="text-[10px] text-purple-200 mt-1">{ach.points} XP</p>
                            </div>
                        ))}
                        {userAchievements.length === 0 && (
                            <div className="col-span-2 py-10 text-center opacity-50">
                                <p className="text-sm font-bold">لم تحصل على أوسمة بعد. أكمل الدروس!</p>
                            </div>
                        )}
                    </div>
                </div>

                <div className="glass-panel p-8 rounded-[40px] border-white/5 bg-black/20">
                    <h3 className="text-xl font-black text-white mb-6 flex items-center gap-3 opacity-60">
                        <Target /> القادمة
                    </h3>
                    <div className="space-y-4">
                        {lockedAchievements.map(ach => (
                            <div key={ach.id} className="flex items-center gap-4 p-4 rounded-2xl bg-white/5 border border-white/5 grayscale opacity-50 hover:grayscale-0 hover:opacity-100 transition-all">
                                <div className="text-2xl">{ach.icon}</div>
                                <div>
                                    <h4 className="font-bold text-white text-sm">{ach.title}</h4>
                                    <p className="text-[10px] text-gray-400">{ach.description}</p>
                                </div>
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
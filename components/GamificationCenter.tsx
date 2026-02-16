import React, { useState, useEffect } from 'react';
import { User, Achievement } from '../types';
import { dbService } from '../services/db';
import { Trophy, Star, Medal, Crown, Shield, Zap, Target, TrendingUp } from 'lucide-react';

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
            // Get all students for leaderboard (Realtime)
            const unsubscribe = dbService.subscribeToUsers((users) => {
                const sorted = users
                    .filter(u => u.role === 'student')
                    .sort((a, b) => (b.progress?.points || 0) - (a.progress?.points || 0))
                    .slice(0, 50); // Get top 50
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
  const nextRankPoints = leaderboard[myRank - 2]?.progress?.points || (user.progress?.points || 0) + 100;
  const pointsToNextRank = nextRankPoints - (user.progress?.points || 0);

  return (
    <div className="max-w-7xl mx-auto py-12 px-6 animate-fadeIn font-['Tajawal'] text-right" dir="rtl">
        
        {/* Header Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
            <div className="bg-gradient-to-br from-amber-500/20 to-transparent border border-amber-500/30 p-8 rounded-[40px] flex items-center gap-6">
                <div className="w-16 h-16 bg-amber-500 rounded-2xl flex items-center justify-center text-black shadow-[0_0_30px_#f59e0b] animate-float">
                    <Trophy size={32} />
                </div>
                <div>
                    <p className="text-gray-400 text-xs font-bold uppercase tracking-widest">ترتيبي الحالي</p>
                    <h3 className="text-4xl font-black text-white">#{myRank > 0 ? myRank : '-'}</h3>
                </div>
            </div>
            <div className="bg-gradient-to-br from-blue-500/20 to-transparent border border-blue-500/30 p-8 rounded-[40px] flex items-center gap-6">
                <div className="w-16 h-16 bg-blue-500 rounded-2xl flex items-center justify-center text-white shadow-[0_0_30px_#3b82f6]">
                    <Zap size={32} />
                </div>
                <div>
                    <p className="text-gray-400 text-xs font-bold uppercase tracking-widest">نقاط الخبرة (XP)</p>
                    <h3 className="text-4xl font-black text-white tabular-nums">{user.progress?.points || 0}</h3>
                </div>
            </div>
            <div className="bg-gradient-to-br from-purple-500/20 to-transparent border border-purple-500/30 p-8 rounded-[40px] flex items-center gap-6">
                <div className="w-16 h-16 bg-purple-500 rounded-2xl flex items-center justify-center text-white shadow-[0_0_30px_#a855f7]">
                    <Medal size={32} />
                </div>
                <div>
                    <p className="text-gray-400 text-xs font-bold uppercase tracking-widest">الأوسمة المكتسبة</p>
                    <h3 className="text-4xl font-black text-white">{userAchievements.length}</h3>
                </div>
            </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
            {/* Leaderboard Section */}
            <div className="lg:col-span-7 space-y-8">
                <div className="glass-panel p-8 rounded-[50px] border-white/5 bg-[#0a1118]/80 relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-64 h-64 bg-amber-500/5 rounded-full blur-[100px]"></div>
                    <div className="flex justify-between items-end mb-8 relative z-10">
                        <div>
                            <h3 className="text-2xl font-black text-white flex items-center gap-3">
                                <Crown className="text-[#fbbf24]" /> أبطال الفيزياء
                            </h3>
                            <p className="text-gray-500 text-xs mt-2">يتم تحديث الترتيب بناءً على الاختبارات والتفاعل.</p>
                        </div>
                        {myRank > 1 && (
                            <div className="text-[10px] text-gray-400 font-bold bg-white/5 px-4 py-2 rounded-full border border-white/5">
                                🔥 باقي {pointsToNextRank} نقطة لتتجاوز {leaderboard[myRank-2]?.name}
                            </div>
                        )}
                    </div>
                    
                    <div className="space-y-3 relative z-10 max-h-[600px] overflow-y-auto no-scrollbar pr-2">
                        {leaderboard.map((student, idx) => (
                            <div key={student.uid} className={`flex items-center gap-6 p-4 rounded-[30px] border transition-all hover:scale-[1.01] ${student.uid === user.uid ? 'bg-[#fbbf24]/10 border-[#fbbf24]/30' : 'bg-white/[0.02] border-white/5'}`}>
                                <div className={`w-12 h-12 rounded-2xl flex items-center justify-center text-lg font-black shrink-0 ${idx === 0 ? 'bg-gradient-to-br from-yellow-300 to-yellow-600 text-black shadow-lg shadow-yellow-500/20' : idx === 1 ? 'bg-gradient-to-br from-gray-300 to-gray-500 text-black' : idx === 2 ? 'bg-gradient-to-br from-orange-400 to-orange-700 text-black' : 'bg-white/5 text-gray-500'}`}>
                                    {idx + 1}
                                </div>
                                <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-2">
                                        <h4 className={`font-bold text-base truncate ${student.uid === user.uid ? 'text-[#fbbf24]' : 'text-white'}`}>{student.name}</h4>
                                        {student.uid === user.uid && <span className="text-[8px] bg-[#fbbf24] text-black px-2 rounded font-black">أنت</span>}
                                    </div>
                                    <p className="text-[10px] text-gray-500 font-bold uppercase tracking-widest mt-0.5">الصف {student.grade}</p>
                                </div>
                                <div className="text-center px-4">
                                    <p className="text-xl font-black text-white tabular-nums">{student.progress?.points || 0}</p>
                                    <p className="text-[8px] text-gray-600 font-black uppercase">XP</p>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* Achievements Section */}
            <div className="lg:col-span-5 space-y-8">
                <div className="glass-panel p-8 rounded-[50px] border-white/5 bg-gradient-to-b from-purple-500/10 to-transparent border-t-2 border-purple-500/20">
                    <h3 className="text-2xl font-black text-white mb-8 flex items-center gap-3">
                        <Medal className="text-purple-400" /> لوحة الأوسمة
                    </h3>
                    
                    <div className="grid grid-cols-2 gap-4 max-h-[400px] overflow-y-auto no-scrollbar pr-2">
                        {userAchievements.map(ach => (
                            <div key={ach.id} className="p-5 bg-purple-500/20 border border-purple-500/30 rounded-[35px] text-center group hover:scale-105 transition-all cursor-default">
                                <div className="text-5xl mb-4 drop-shadow-2xl group-hover:scale-110 transition-transform duration-500 animate-float">{ach.icon}</div>
                                <h4 className="font-bold text-white text-sm mb-1">{ach.title}</h4>
                                <p className="text-[10px] text-purple-200 opacity-60">{ach.description}</p>
                            </div>
                        ))}
                        {userAchievements.length === 0 && (
                            <div className="col-span-2 py-10 text-center opacity-50 border-2 border-dashed border-purple-500/20 rounded-[35px]">
                                <Star className="mx-auto mb-2 text-purple-400" size={32}/>
                                <p className="text-xs font-bold">لم تحصل على أوسمة بعد. أكمل الدروس!</p>
                            </div>
                        )}
                    </div>
                </div>

                <div className="glass-panel p-8 rounded-[50px] border-white/5 bg-black/20">
                    <h3 className="text-lg font-black text-gray-400 mb-6 flex items-center gap-3 uppercase tracking-widest">
                        <Target size={18}/> الأوسمة التالية
                    </h3>
                    <div className="space-y-4">
                        {lockedAchievements.map(ach => (
                            <div key={ach.id} className="flex items-center gap-4 p-4 rounded-[25px] bg-white/5 border border-white/5 grayscale opacity-60 hover:grayscale-0 hover:opacity-100 transition-all group">
                                <div className="text-3xl filter blur-[2px] group-hover:blur-0 transition-all">{ach.icon}</div>
                                <div>
                                    <h4 className="font-bold text-white text-sm">{ach.title}</h4>
                                    <p className="text-[10px] text-gray-400">{ach.description}</p>
                                </div>
                                <div className="mr-auto text-[10px] bg-white/10 px-2 py-1 rounded text-white font-mono">
                                    +{ach.points} XP
                                </div>
                            </div>
                        ))}
                        {lockedAchievements.length === 0 && <p className="text-center text-xs text-gray-500">لقد حصلت على كل الأوسمة المتاحة! 🎉</p>}
                    </div>
                </div>
            </div>
        </div>
    </div>
  );
};

export default GamificationCenter;
import React, { useState, useEffect } from 'react';
import { User, QuizAttempt, Question } from '../types';
import { dbService } from '../services/db';
import { Target, Clock, BarChart, AlertTriangle, CheckCircle, Percent } from 'lucide-react';

interface QuizPerformanceProps {
  user: User;
}

const QuizPerformance: React.FC<QuizPerformanceProps> = ({ user }) => {
  const [attempts, setAttempts] = useState<QuizAttempt[]>([]);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [stats, setStats] = useState({
    totalAttempts: 0,
    averageScore: 0,
    averageTime: 0,
    weakestAreas: [] as { area: string; count: number }[],
  });
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadData = async () => {
      setIsLoading(true);
      const [userAttempts, allQuestions] = await Promise.all([
        dbService.getUserAttempts(user.uid),
        dbService.getAllQuestions(),
      ]);
      setAttempts(userAttempts.sort((a, b) => new Date(b.completedAt).getTime() - new Date(a.completedAt).getTime()));
      setQuestions(allQuestions);
      setIsLoading(false);
    };
    loadData();
  }, [user.uid]);

  useEffect(() => {
    if (attempts.length > 0 && questions.length > 0) {
      calculateStats();
    } else if (!isLoading) {
      // Ensure stats are reset if there are no attempts
      setStats({ totalAttempts: 0, averageScore: 0, averageTime: 0, weakestAreas: [] });
    }
  }, [attempts, questions, isLoading]);

  const calculateStats = () => {
    const totalAttempts = attempts.length;
    const totalScorePercent = attempts.reduce((acc, attempt) => {
      const maxScore = attempt.maxScore || attempt.totalQuestions;
      return acc + (maxScore > 0 ? (attempt.score / maxScore) * 100 : 0);
    }, 0);
    const averageScore = totalAttempts > 0 ? totalScorePercent / totalAttempts : 0;
    
    const totalTime = attempts.reduce((acc, attempt) => acc + (attempt.timeSpent || 0), 0);
    const averageTime = totalAttempts > 0 ? totalTime / totalAttempts : 0;

    const wrongAnswers: Record<string, number> = {};
    // FIX: Explicitly type the Map to ensure TypeScript correctly infers the type of its values.
    const allQuestionsMap = new Map<string, Question>(questions.map(q => [q.id, q]));

    attempts.forEach(attempt => {
      Object.entries(attempt.answers).forEach(([questionId, answerId]) => {
        const question = allQuestionsMap.get(questionId);
        // FIX: Use `correctChoiceId` to match the `Question` type definition.
        if (question && answerId !== question.correctChoiceId) {
          const area = question.unit || 'General';
          wrongAnswers[area] = (wrongAnswers[area] || 0) + 1;
        }
      });
    });

    const weakestAreas = Object.entries(wrongAnswers)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 3)
      .map(([area, count]) => ({ area, count }));

    setStats({ totalAttempts, averageScore, averageTime, weakestAreas });
  };

  const formatTime = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${String(minutes).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
  };

  if (isLoading) {
    return (
        <div className="w-full h-full flex items-center justify-center">
          <div className="w-16 h-16 border-4 border-sky-500 border-t-transparent rounded-full animate-spin"></div>
        </div>
    );
  }

  if (attempts.length === 0) {
    return (
      <div className="py-32 text-center opacity-40 border-2 border-dashed border-white/10 rounded-[50px] font-['Tajawal'] text-white">
         <span className="text-6xl mb-4 block">📊</span>
         <p className="font-bold text-lg">لا توجد بيانات اختبارات كافية للتحليل</p>
         <p className="text-sm text-gray-500 mt-2">أكمل بعض الاختبارات في مركز الاختبارات أولاً.</p>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto py-12 px-6 animate-fadeIn font-['Tajawal'] text-white" dir="rtl">
      <header className="mb-12 border-r-4 border-[#00d2ff] pr-8">
        <h2 className="text-5xl font-black mb-4 tracking-tighter">تحليل أداء <span className="text-[#00d2ff]">الاختبارات</span></h2>
        <p className="text-gray-500 text-xl font-medium">نظرة شاملة على نتائجك لتحديد نقاط القوة والضعف.</p>
      </header>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 mb-12">
        <StatCard icon={<Target />} label="الاختبارات المنجزة" value={stats.totalAttempts.toString()} color="text-[#00d2ff]" />
        <StatCard icon={<Percent />} label="متوسط الدرجات" value={`${stats.averageScore.toFixed(1)}%`} color="text-green-400" />
        <StatCard icon={<Clock />} label="متوسط الوقت" value={formatTime(stats.averageTime)} color="text-yellow-400" />
        <StatCard icon={<BarChart />} label="أفضل أداء" value={`${Math.max(0, ...attempts.map(a => (a.maxScore ? (a.score / a.maxScore) * 100 : 0))).toFixed(1)}%`} color="text-purple-400" />
      </div>

      {/* Weaknesses and Recent Attempts */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        <div className="lg:col-span-4">
          <div className="glass-panel p-8 rounded-[40px] border-red-500/20 bg-red-500/5 h-full">
            <h3 className="text-xl font-black text-red-400 mb-6 flex items-center gap-3"><AlertTriangle /> مناطق تحتاج للتركيز</h3>
            {stats.weakestAreas.length > 0 ? (
                <div className="space-y-4">
                {stats.weakestAreas.map((area, index) => (
                    <div key={index} className="flex justify-between items-center p-4 bg-black/40 rounded-2xl border border-white/5">
                    <span className="font-bold text-sm text-white">{area.area}</span>
                    <span className="text-xs font-mono text-red-400 bg-red-500/10 px-2 py-1 rounded">{area.count} أخطاء</span>
                    </div>
                ))}
                </div>
            ) : (
                <div className="text-center py-10 text-green-400">
                    <CheckCircle className="w-10 h-10 mx-auto mb-4"/>
                    <p className="font-bold text-sm">أداء ممتاز! لم يتم رصد أخطاء متكررة.</p>
                </div>
            )}
          </div>
        </div>

        <div className="lg:col-span-8">
          <div className="glass-panel p-8 rounded-[40px] border-white/5 h-full">
            <h3 className="text-xl font-black text-white mb-6">سجل المحاولات الأخيرة</h3>
            <div className="space-y-3 max-h-[400px] overflow-y-auto no-scrollbar pr-1">
              {attempts.map(attempt => (
                <div key={attempt.id} className="grid grid-cols-12 items-center p-4 bg-black/40 rounded-2xl border border-white/5 text-sm gap-4">
                  <div className="col-span-4 font-bold truncate">اختبار {attempt.quizId}</div>
                  <div className={`col-span-3 font-black text-center tabular-nums ${attempt.score / (attempt.maxScore || 1) >= 0.8 ? 'text-green-400' : 'text-yellow-400'}`}>
                    {attempt.score} / {attempt.maxScore || attempt.totalQuestions}
                  </div>
                  <div className="col-span-2 text-center text-gray-400 font-mono">{formatTime(attempt.timeSpent || 0)}</div>
                  <div className="col-span-3 text-left text-xs text-gray-500 font-mono">{new Date(attempt.completedAt).toLocaleDateString('ar-KW')}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

const StatCard: React.FC<{ icon: React.ReactNode; label: string; value: string; color: string; }> = ({ icon, label, value, color }) => (
  <div className="glass-panel p-6 rounded-[30px] border-white/5">
    <div className={`w-12 h-12 rounded-2xl bg-white/5 flex items-center justify-center text-2xl mb-4 ${color}`}>
      {icon}
    </div>
    <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-1">{label}</p>
    <p className={`text-3xl font-black tabular-nums ${color}`}>{value}</p>
  </div>
);

export default QuizPerformance;
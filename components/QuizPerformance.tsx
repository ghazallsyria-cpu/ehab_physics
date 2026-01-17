
import React, { useState, useEffect } from 'react';
import { User, QuizAttempt, Question } from '../types';
import { dbService } from '../services/db';
import { Target, Clock, BarChart, AlertTriangle, CheckCircle, Percent, ChevronLeft } from 'lucide-react';

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
      try {
        const [userAttempts, allQuestions] = await Promise.all([
          dbService.getUserAttempts(user.uid),
          dbService.getAllQuestions(),
        ]);
        setAttempts((userAttempts || []).sort((a, b) => new Date(b.completedAt).getTime() - new Date(a.completedAt).getTime()));
        setQuestions(allQuestions || []);
      } catch (error) {
        console.error("Performance Load Error:", error);
      } finally {
        setIsLoading(false);
      }
    };
    loadData();
  }, [user.uid]);

  useEffect(() => {
    if (attempts.length > 0) {
      calculateStats();
    }
  }, [attempts, questions]);

  const calculateStats = () => {
    const totalAttempts = attempts.length;
    const totalScorePercent = attempts.reduce((acc, attempt) => {
      const max = attempt.maxScore || attempt.totalQuestions || 1;
      return acc + ((attempt.score / max) * 100);
    }, 0);
    const averageScore = totalAttempts > 0 ? totalScorePercent / totalAttempts : 0;
    
    const totalTime = attempts.reduce((acc, attempt) => acc + (attempt.timeSpent || 0), 0);
    const averageTime = totalAttempts > 0 ? totalTime / totalAttempts : 0;

    const wrongAnswers: Record<string, number> = {};
    const allQuestionsMap = new Map<string, Question>(questions.map(q => [q.id, q]));

    attempts.forEach(attempt => {
      if (!attempt.answers) return;
      Object.entries(attempt.answers).forEach(([questionId, answerId]) => {
        const question = allQuestionsMap.get(questionId);
        if (question && answerId !== question.correctAnswerId) {
          const area = question.unit || 'عام';
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
      <div className="w-full h-full flex flex-col items-center justify-center p-20 gap-4">
        <div className="w-12 h-12 border-4 border-sky-500 border-t-transparent rounded-full animate-spin"></div>
        <p className="text-gray-500 font-bold animate-pulse">جاري تحليل بياناتك الأكاديمية...</p>
      </div>
    );
  }

  if (attempts.length === 0) {
    return (
      <div className="max-w-4xl mx-auto py-32 text-center glass-panel rounded-[50px] border-dashed border-white/10 opacity-60 font-['Tajawal'] text-white">
         <span className="text-7xl mb-6 block animate-bounce">📊</span>
         <h3 className="text-2xl font-black mb-2">لا يوجد سجل اختبارات بعد</h3>
         <p className="text-gray-500 text-lg">أكمل بعض الاختبارات في مركز الاختبارات لتظهر لك تحليلات دقيقة هنا.</p>
         <button onClick={() => window.dispatchEvent(new CustomEvent('change-view', { detail: { view: 'quiz_center' } }))} className="mt-8 bg-sky-500 text-white px-10 py-4 rounded-full font-bold shadow-lg hover:scale-105 transition-transform">اذهب لمركز الاختبارات الآن</button>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto py-12 px-6 animate-fadeIn font-['Tajawal'] text-white" dir="rtl">
      <header className="mb-12 border-r-4 border-sky-400 pr-8">
        <h2 className="text-5xl font-black mb-4 tracking-tighter">مركز <span className="text-sky-400">تحليل البيانات</span></h2>
        <p className="text-gray-500 text-xl font-medium">نظرة عميقة مدعومة بالبيانات لتحديد مسارك نحو التفوق.</p>
      </header>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 mb-12">
        <StatCard icon={<Target />} label="الاختبارات المنجزة" value={stats.totalAttempts.toString()} color="text-sky-400" />
        <StatCard icon={<Percent />} label="متوسط التحصيل" value={`${stats.averageScore.toFixed(1)}%`} color="text-emerald-400" />
        <StatCard icon={<Clock />} label="متوسط زمن الحل" value={formatTime(stats.averageTime)} color="text-amber-400" />
        <StatCard icon={<BarChart />} label="أفضل نتيجة" value={`${Math.max(0, ...attempts.map(a => (a.maxScore ? (a.score / a.maxScore) * 100 : 0))).toFixed(1)}%`} color="text-purple-400" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
        {/* Weaknesses Section */}
        <div className="lg:col-span-4">
          <div className="glass-panel p-8 rounded-[40px] border-red-500/20 bg-red-500/5 h-full relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-red-500/5 rounded-full blur-3xl"></div>
            <h3 className="text-xl font-black text-red-400 mb-8 flex items-center gap-3 relative z-10"><AlertTriangle /> فجوات المعرفة</h3>
            {stats.weakestAreas.length > 0 ? (
                <div className="space-y-4 relative z-10">
                {stats.weakestAreas.map((area, index) => (
                    <div key={index} className="flex justify-between items-center p-5 bg-black/40 rounded-2xl border border-white/5 group hover:border-red-500/40 transition-all">
                      <span className="font-bold text-sm text-gray-200">{area.area}</span>
                      <span className="text-[10px] font-black text-red-400 bg-red-500/10 px-3 py-1 rounded-full uppercase tracking-widest">{area.count} أخطاء</span>
                    </div>
                ))}
                </div>
            ) : (
                <div className="text-center py-16 text-emerald-400 relative z-10">
                    <CheckCircle className="w-16 h-16 mx-auto mb-6 opacity-40 animate-pulse"/>
                    <p className="font-bold">أداء مذهل! لا توجد أخطاء متكررة حالياً.</p>
                </div>
            )}
          </div>
        </div>

        {/* History Table */}
        <div className="lg:col-span-8">
          <div className="glass-panel p-10 rounded-[40px] border-white/5 h-full">
            <h3 className="text-2xl font-black text-white mb-8 border-b border-white/5 pb-4">سجل النشاط الأخير</h3>
            <div className="space-y-4 max-h-[500px] overflow-y-auto no-scrollbar pr-1">
              {attempts.map(attempt => (
                <div key={attempt.id} className="grid grid-cols-12 items-center p-5 bg-black/40 rounded-3xl border border-white/5 hover:bg-white/[0.03] transition-all gap-4">
                  <div className="col-span-5">
                    <p className="font-bold text-gray-200 truncate">اختبار: {attempt.quizId.split('-').pop()}</p>
                    <p className="text-[10px] text-gray-600 font-mono">{new Date(attempt.completedAt).toLocaleDateString('ar-KW')}</p>
                  </div>
                  <div className="col-span-3 text-center">
                    <p className={`text-xl font-black tabular-nums ${attempt.score / (attempt.maxScore || 1) >= 0.8 ? 'text-emerald-400' : 'text-amber-400'}`}>
                      {attempt.score} <span className="text-xs text-gray-600">/ {attempt.maxScore || attempt.totalQuestions}</span>
                    </p>
                  </div>
                  <div className="col-span-3 text-center text-gray-400 font-mono text-sm">{formatTime(attempt.timeSpent || 0)}</div>
                  <div className="col-span-1 text-left">
                     <ChevronLeft className="text-gray-700" size={16} />
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

const StatCard: React.FC<{ icon: React.ReactNode; label: string; value: string; color: string; }> = ({ icon, label, value, color }) => (
  <div className="glass-panel p-8 rounded-[40px] border-white/5 bg-white/[0.01] hover:bg-white/[0.03] transition-all group">
    <div className={`w-14 h-14 rounded-2xl bg-black/40 flex items-center justify-center text-3xl mb-6 shadow-inner group-hover:scale-110 transition-transform ${color}`}>
      {icon}
    </div>
    <p className="text-[10px] font-black text-gray-500 uppercase tracking-widest mb-2">{label}</p>
    <p className={`text-4xl font-black tabular-nums tracking-tighter ${color}`}>{value}</p>
  </div>
);

export default QuizPerformance;

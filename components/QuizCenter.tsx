
import React, { useState, useEffect, useMemo } from 'react';
import { User, Quiz } from '../types';
import { dbService } from '../services/db';

const QuizCenter: React.FC<{ user: User; onBack: () => void }> = ({ user, onBack }) => {
  const [quizzes, setQuizzes] = useState<Quiz[]>([]);
  const [message, setMessage] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    loadQuizzes();
  }, [user]);

  const loadQuizzes = async () => {
    setIsLoading(true);
    const allQuizzes = await dbService.getQuizzes();
    const userGradeQuizzes = allQuizzes.filter(q => q.grade === user.grade);
    setQuizzes(userGradeQuizzes);
    setIsLoading(false);
  };

  const startQuiz = async (quiz: Quiz) => {
    if (quiz.isPremium && user.subscription !== 'premium') {
      setMessage("🔒 هذا الاختبار يتطلب اشتراك بريميوم.");
      setTimeout(() => setMessage(null), 3000);
      return;
    }

    const userAttempts = await dbService.getUserAttempts(user.uid, quiz.id);
    if (quiz.maxAttempts && userAttempts.length >= quiz.maxAttempts) {
       setMessage("لقد استنفدت جميع محاولاتك لهذا الاختبار.");
       setTimeout(() => setMessage(null), 3000);
       return;
    }

    // Dispatch event to App.tsx to switch to the new QuizPlayer
    window.dispatchEvent(new CustomEvent('change-view', { 
      detail: { view: 'quiz_player', quiz: quiz } 
    }));
  };

  const groupedQuizzes = useMemo(() => {
    // FIX: Use generic type argument for reduce to ensure correct type inference for the accumulator.
    return quizzes.reduce<Record<string, Quiz[]>>((acc, quiz) => {
      const category = quiz.category || 'اختبارات عامة';
      if (!acc[category]) {
        acc[category] = [];
      }
      acc[category].push(quiz);
      return acc;
    }, {});
  }, [quizzes]);

  return (
    <div className="max-w-4xl mx-auto py-12 text-white font-['Tajawal'] animate-fadeIn">
      <h2 className="text-4xl font-black mb-10 flex items-center gap-4">
         <span className="text-[#fbbf24]">📝</span> مركز التقييم الأكاديمي
      </h2>
      {message && <div className="mb-8 p-5 bg-red-500/10 border border-red-500/20 rounded-2xl text-red-500 text-sm font-bold animate-shake">{message}</div>}
      
      {isLoading ? (
        <div className="text-center py-20 text-gray-500 animate-pulse">جاري تحميل الاختبارات المتاحة...</div>
      ) : quizzes.length === 0 ? (
          <div className="md:col-span-2 text-center py-20 border-2 border-dashed border-white/10 rounded-[60px] opacity-40">
            <span className="text-6xl mb-4 block">🗂️</span>
            <p className="font-bold">لا توجد اختبارات متاحة لصفك حالياً.</p>
          </div>
      ) : (
        <div className="space-y-12">
          {Object.entries(groupedQuizzes).map(([category, quizList]) => (
            <div key={category}>
              <h3 className="text-2xl font-bold mb-6 border-r-4 border-[#fbbf24] pr-4">{category}</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {quizList.map(quiz => (
                  <div key={quiz.id} className="glass-panel p-10 rounded-[50px] border-white/5 hover:border-[#fbbf24]/40 transition-all relative overflow-hidden group">
                     {quiz.isPremium && <div className="absolute top-6 left-6 bg-[#fbbf24] text-black text-[8px] font-black px-3 py-1 rounded-full uppercase tracking-widest">Premium</div>}
                     <h3 className="text-2xl font-black mb-2 group-hover:text-[#fbbf24] transition-colors">{quiz.title}</h3>
                     <p className="text-xs text-gray-400 mb-6">{quiz.description}</p>
                     <div className="flex justify-between text-xs text-gray-500 mb-8 font-bold border-t border-white/5 pt-4">
                        <span><span className="font-mono text-base text-white">{quiz.questionIds.length}</span> سؤال</span>
                        <span>⏱ <span className="font-mono text-base text-white">{quiz.duration || 0}</span> دقيقة</span>
                        <span>🔄 <span className="font-mono text-base text-white">{quiz.maxAttempts || 1}</span> محاولات</span>
                     </div>
                     <button onClick={() => startQuiz(quiz)} disabled={isLoading} className="w-full py-4 bg-[#fbbf24] text-black rounded-2xl font-black text-[10px] uppercase tracking-widest shadow-xl active:scale-95 transition-all disabled:opacity-50">
                       {isLoading ? 'جاري التحضير...' : 'ابدأ الاختبار'}
                     </button>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default QuizCenter;

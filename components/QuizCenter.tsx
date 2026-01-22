import React, { useState, useEffect, useMemo } from 'react';
import { User, Quiz, StudentQuizAttempt } from '../types';
import { dbService } from '../services/db';

const QuizCenter: React.FC<{ user: User }> = ({ user }) => {
  const [quizzes, setQuizzes] = useState<Quiz[]>([]);
  const [userAttempts, setUserAttempts] = useState<StudentQuizAttempt[]>([]);
  const [message, setMessage] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    loadData();
  }, [user]);

  const loadData = async () => {
    setIsLoading(true);
    const [allQuizzes, allAttempts] = await Promise.all([
        dbService.getQuizzes(),
        dbService.getUserAttempts(user.uid)
    ]);
    const userGradeQuizzes = allQuizzes.filter(q => q.grade === user.grade);
    setQuizzes(userGradeQuizzes);
    setUserAttempts(allAttempts);
    setIsLoading(false);
  };

  const startQuiz = async (quiz: Quiz) => {
    if (quiz.isPremium && user.subscription !== 'premium') {
      setMessage("🔒 هذا الاختبار يتطلب اشتراك بريميوم.");
      setTimeout(() => setMessage(null), 3000);
      return;
    }

    const attemptsForThisQuiz = userAttempts.filter(a => a.quizId === quiz.id);
    if (quiz.maxAttempts && attemptsForThisQuiz.length >= quiz.maxAttempts) {
       setMessage("لقد استنفدت جميع محاولاتك لهذا الاختبار.");
       setTimeout(() => setMessage(null), 3000);
       return;
    }

    window.dispatchEvent(new CustomEvent('change-view', { 
      detail: { view: 'quiz_player', quiz: quiz } 
    }));
  };
  
  const reviewAttempt = (attempt: StudentQuizAttempt) => {
    window.dispatchEvent(new CustomEvent('change-view', {
      detail: { view: 'attempt_review', attempt: attempt }
    }));
  };

  const getStatusBadge = (status?: StudentQuizAttempt['status']) => {
    switch(status) {
        case 'pending-review': return <span className="text-[8px] font-bold text-yellow-400 bg-yellow-500/10 px-2 py-1 rounded">بانتظار المراجعة</span>;
        case 'manually-graded': return <span className="text-[8px] font-bold text-green-400 bg-green-500/10 px-2 py-1 rounded">تم التصحيح</span>;
        default: return <span className="text-[8px] font-bold text-gray-400 bg-white/5 px-2 py-1 rounded">مُصحح آلياً</span>;
    }
  };

  const groupedQuizzes = useMemo(() => {
    return quizzes.reduce((acc: Record<string, Quiz[]>, quiz) => {
      const category = quiz.category || 'اختبارات عامة';
      if (!acc[category]) {
        acc[category] = [];
      }
      acc[category].push(quiz);
      return acc;
    }, {} as Record<string, Quiz[]>);
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
                {quizList.map(quiz => {
                  const attemptsForThisQuiz: StudentQuizAttempt[] = userAttempts.filter(a => a.quizId === quiz.id).sort((a,b) => (b.attemptNumber || 0) - (a.attemptNumber || 0));
                  return (
                    <div key={quiz.id} className="glass-panel p-8 rounded-[50px] border-white/5 hover:border-[#fbbf24]/40 transition-all relative overflow-hidden group flex flex-col">
                       {quiz.isPremium && <div className="absolute top-6 left-6 bg-[#fbbf24] text-black text-[8px] font-black px-3 py-1 rounded-full uppercase tracking-widest">Premium</div>}
                       <div className="flex-1">
                          <h3 className="text-2xl font-black mb-2 group-hover:text-[#fbbf24] transition-colors">{quiz.title}</h3>
                          <p className="text-xs text-gray-400 mb-6">{quiz.description}</p>
                          <div className="flex justify-between text-xs text-gray-500 mb-8 font-bold border-t border-white/5 pt-4">
                              <span><span className="font-mono text-base text-white">{quiz.questionIds.length}</span> سؤال</span>
                              <span>⏱ <span className="font-mono text-base text-white">{quiz.duration || 0}</span> دقيقة</span>
                              <span>🔄 <span className="font-mono text-base text-white">{quiz.maxAttempts || '∞'}</span> محاولات</span>
                          </div>
                       </div>
                       
                       {attemptsForThisQuiz.length > 0 && (
                          <div className="mb-6 space-y-2 pt-6 border-t border-white/10">
                              <h5 className="text-xs font-bold text-gray-400 mb-2">محاولاتك السابقة:</h5>
                              {/* FIX: Replaced an invalid JavaScript-style comment ('//') inside JSX with a valid JSX comment ('{/* ... * /}'). The original syntax error caused a downstream TypeScript error where `attemptsForThisQuiz` was incorrectly typed as `unknown`, preventing the use of `.map()`. */}
                              {attemptsForThisQuiz.map(att => (
                                  <div key={att.id} className="flex justify-between items-center bg-black/40 p-3 rounded-xl text-xs">
                                      <span className="font-bold">محاولة #{att.attemptNumber}</span>
                                      <div className="flex items-center gap-2">
                                         {getStatusBadge(att.status)}
                                         <span className="font-mono font-bold text-lg">{att.score}/{att.maxScore}</span>
                                         <button onClick={() => reviewAttempt(att)} className="bg-white/10 px-3 py-1 rounded text-white font-bold hover:bg-white/20">مراجعة</button>
                                      </div>
                                  </div>
                              ))}
                          </div>
                       )}

                       <button onClick={() => startQuiz(quiz)} disabled={isLoading} className="w-full mt-auto py-4 bg-[#fbbf24] text-black rounded-2xl font-black text-[10px] uppercase tracking-widest shadow-xl active:scale-95 transition-all disabled:opacity-50">
                         {isLoading ? 'جاري التحضير...' : 'ابدأ الاختبار'}
                       </button>
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default QuizCenter;
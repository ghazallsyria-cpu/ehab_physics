


import React, { useState, useEffect, useMemo } from 'react';
import { User, StudentQuizAttempt, Quiz, Question } from '../types';
import { dbService } from '../services/db';
import katex from 'katex';
import { X, Check, MessageSquare, Award } from 'lucide-react';

interface AttemptReviewProps {
  user: User;
  attempt: StudentQuizAttempt;
  onBack: () => void;
}

const AttemptReview: React.FC<AttemptReviewProps> = ({ user, attempt, onBack }) => {
  const [quiz, setQuiz] = useState<Quiz | null>(null);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadData = async () => {
      setIsLoading(true);
      const [quizData, questionsData] = await Promise.all([
        dbService.getQuizById(attempt.quizId),
        dbService.getQuestionsForQuiz(attempt.quizId),
      ]);
      setQuiz(quizData);
      setQuestions(questionsData);
      setIsLoading(false);
    };
    loadData();
  }, [attempt]);
  
  const finalScore = useMemo(() => {
    if (attempt.status === 'manually-graded') {
      const autoScore = questions.filter(q => q.type === 'mcq' && attempt.answers[q.id] === q.correctChoiceId).reduce((sum, q) => sum + q.score, 0);
      // FIX: Explicitly type the 'grade' parameter in the reduce function to resolve the 'unknown' type error.
      const manualScore = Object.values(attempt.manualGrades || {}).reduce((sum, grade: { awardedScore: number }) => sum + (grade.awardedScore || 0), 0);
      return autoScore + manualScore;
    }
    return attempt.score;
  }, [attempt, questions]);

  const renderMathText = (text: string) => {
    try {
      if (!text) return <div />;
      const html = text.replace(/\$(.*?)\$/g, (match, math) => katex.renderToString(math, { throwOnError: false }));
      return <div dangerouslySetInnerHTML={{ __html: html }} />;
    } catch {
      return <div>{text}</div>;
    }
  };

  if (isLoading || !quiz) {
    return <div className="fixed inset-0 bg-[#0A2540] flex items-center justify-center text-white font-bold animate-pulse">جاري تحميل المراجعة...</div>;
  }
  
  return (
    <div className="min-h-screen bg-geometric-pattern p-4 md:p-10 font-['Tajawal'] text-white" dir="rtl">
        <div className="max-w-4xl mx-auto">
            <div className="glass-panel p-10 md:p-16 rounded-[60px] border-white/5 bg-black/40 text-center mb-8">
                <h2 className="text-4xl font-black mb-4">مراجعة محاولة: {quiz.title}</h2>
                <p className="text-8xl font-black text-[#fbbf24] mb-4 tabular-nums">{finalScore} / {attempt.maxScore}</p>
                <button onClick={onBack} className="bg-[#fbbf24] text-black px-10 py-4 rounded-full font-black text-xs uppercase tracking-widest hover:scale-105 transition-all">العودة لمركز الاختبارات</button>
            </div>

            <div className="space-y-6">
                <h3 className="text-2xl font-bold text-center">مراجعة الإجابات</h3>
                {questions.map((q, idx) => {
                    const userAnswer = attempt.answers[q.id];
                    const manualGrade = attempt.manualGrades?.[q.id];

                    return (
                        <div key={q.id} className={`glass-panel p-8 rounded-[40px] border-2 border-white/5`}>
                            <p className="text-lg font-bold mb-4">({idx + 1}) {renderMathText(q.text)}</p>
                            
                            {q.type === 'mcq' && q.choices?.map(choice => {
                                const isUserChoice = userAnswer === choice.id;
                                const isCorrectChoice = q.correctChoiceId === choice.id;
                                let choiceClass = 'bg-black/20 border-white/5';
                                if (isCorrectChoice) choiceClass = 'bg-green-500/10 border-green-500/20 text-green-400';
                                if (isUserChoice && !isCorrectChoice) choiceClass = 'bg-red-500/10 border-red-500/20 text-red-400';

                                return (
                                    <div key={choice.id} className={`p-4 mb-2 rounded-2xl border ${choiceClass} flex items-center gap-4`}>
                                        {isUserChoice ? '👈' : isCorrectChoice ? '✅' : '⚪️'}
                                        <span>{choice.text}</span>
                                    </div>
                                )
                            })}
                            
                            {q.type !== 'mcq' && (
                                <div className="p-4 bg-blue-500/5 rounded-2xl border border-blue-500/20 mb-4">
                                    <p className="text-xs text-blue-400 font-bold mb-2">إجابتك:</p>
                                    <p className="text-white italic">{userAnswer || "لم تتم الإجابة"}</p>
                                </div>
                            )}

                            {manualGrade && (
                                <>
                                  <div className="p-4 bg-yellow-500/5 rounded-2xl border border-yellow-500/10 mb-2">
                                      <p className="text-xs text-yellow-400 font-bold mb-2 flex items-center gap-2"><Award size={14}/> الدرجة الممنوحة من المعلم:</p>
                                      <p className="text-white font-black text-lg">{manualGrade.awardedScore} / {q.score}</p>
                                  </div>
                                  {manualGrade.feedback && (
                                    <div className="p-4 bg-purple-500/5 rounded-2xl border border-purple-500/10">
                                        <p className="text-xs text-purple-400 font-bold mb-2 flex items-center gap-2"><MessageSquare size={14}/> ملاحظات المعلم:</p>
                                        <p className="text-white italic">{manualGrade.feedback}</p>
                                    </div>
                                  )}
                                </>
                            )}

                            <div className="mt-4 pt-4 border-t border-white/10 text-xs text-gray-400 italic">
                                <p><span className="font-bold text-green-400">الشرح/الإجابة النموذجية:</span> {q.solution || q.modelAnswer || 'لا يوجد شرح متوفر.'}</p>
                            </div>
                        </div>
                    )
                })}
            </div>
        </div>
    </div>
  );
};

export default AttemptReview;

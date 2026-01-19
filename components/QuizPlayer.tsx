import React, { useState, useEffect } from 'react';
import { User, Quiz, Question, StudentQuizAttempt } from '../types';
import { dbService } from '../services/db';
import { UploadCloud, Check, X, ArrowRight, ArrowLeft } from 'lucide-react';
import katex from 'katex';

interface QuizPlayerProps {
  user: User;
  quiz: Quiz;
  onFinish: () => void;
}

const QuizPlayer: React.FC<QuizPlayerProps> = ({ user, quiz, onFinish }) => {
  const [questions, setQuestions] = useState<Question[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [userAnswers, setUserAnswers] = useState<Record<string, any>>({});
  const [timeLeft, setTimeLeft] = useState(quiz.duration * 60);
  const [startTime] = useState(Date.now());
  const [isFinished, setIsFinished] = useState(false);
  const [finalAttempt, setFinalAttempt] = useState<StudentQuizAttempt | null>(null);

  useEffect(() => {
    const loadQuestions = async () => {
      const quizQuestions = await dbService.getQuestionsForQuiz(quiz.id);
      setQuestions(quizQuestions);
      setIsLoading(false);
    };
    loadQuestions();
  }, [quiz.id]);

  useEffect(() => {
    if (!isFinished && timeLeft > 0) {
      const timer = setInterval(() => {
        setTimeLeft(prev => {
          if (prev <= 1) {
            clearInterval(timer);
            handleSubmit();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
      return () => clearInterval(timer);
    }
  }, [isFinished, timeLeft]);

  const handleSubmit = async () => {
    let score = 0;
    questions.forEach(q => {
      if (q.type === 'mcq' && userAnswers[q.id] === q.correctChoiceId) {
        score += q.score || 1;
      }
    });

    const timeSpent = Math.floor((Date.now() - startTime) / 1000);
    const userAttempts = await dbService.getUserAttempts(user.uid, quiz.id);

    const attempt: StudentQuizAttempt = {
      id: `attempt_${Date.now()}`,
      studentId: user.uid,
      studentName: user.name,
      quizId: quiz.id,
      score: score,
      totalQuestions: questions.length,
      maxScore: quiz.totalScore || questions.reduce((s, q) => s + q.score, 0),
      completedAt: new Date().toISOString(),
      answers: userAnswers,
      timeSpent: timeSpent,
      attemptNumber: userAttempts.length + 1,
    };

    await dbService.saveAttempt(attempt);
    setFinalAttempt(attempt);
    setIsFinished(true);
  };

  const renderMathText = (text: string) => {
    try {
      const html = text.replace(/\$(.*?)\$/g, (match, math) => katex.renderToString(math, { throwOnError: false }));
      return <div dangerouslySetInnerHTML={{ __html: html }} />;
    } catch {
      return <div>{text}</div>;
    }
  };

  if (isLoading) {
    return <div className="fixed inset-0 bg-[#0A2540] flex items-center justify-center text-white font-bold animate-pulse">جاري تحضير الاختبار...</div>;
  }
  
  if(isFinished && finalAttempt) {
    return (
        <div className="min-h-screen bg-geometric-pattern p-4 md:p-10 font-['Tajawal'] text-white" dir="rtl">
            <div className="max-w-4xl mx-auto">
                <div className="glass-panel p-10 md:p-16 rounded-[60px] border-white/5 bg-black/40 text-center mb-8">
                    <h2 className="text-4xl font-black mb-4">النتيجة النهائية</h2>
                    <p className="text-8xl font-black text-[#fbbf24] mb-4 tabular-nums">{finalAttempt.score} / {finalAttempt.maxScore}</p>
                    <button onClick={onFinish} className="bg-[#fbbf24] text-black px-10 py-4 rounded-full font-black text-xs uppercase tracking-widest hover:scale-105 transition-all">العودة لمركز الاختبارات</button>
                </div>

                <div className="space-y-6">
                    <h3 className="text-2xl font-bold text-center">مراجعة الإجابات</h3>
                    {questions.map((q, idx) => {
                        const userAnswer = finalAttempt.answers[q.id];
                        const isCorrect = userAnswer === q.correctChoiceId;
                        return (
                            <div key={q.id} className={`glass-panel p-8 rounded-[40px] border-2 ${isCorrect ? 'border-green-500/20' : 'border-red-500/20'}`}>
                                <p className="text-lg font-bold mb-4">({idx + 1}) {renderMathText(q.text)}</p>
                                {q.type === 'mcq' && q.choices?.map(choice => {
                                    const isUserChoice = userAnswer === choice.id;
                                    const isCorrectChoice = q.correctChoiceId === choice.id;
                                    let choiceClass = 'bg-black/20 border-white/5';
                                    if (isCorrectChoice) choiceClass = 'bg-green-500/10 border-green-500/20 text-green-400';
                                    if (isUserChoice && !isCorrectChoice) choiceClass = 'bg-red-500/10 border-red-500/20 text-red-400';

                                    return (
                                        <div key={choice.id} className={`p-4 rounded-2xl border ${choiceClass} flex items-center gap-4`}>
                                            {isUserChoice ? '👈' : isCorrectChoice ? '✅' : '⚪️'}
                                            <span>{choice.text}</span>
                                        </div>
                                    )
                                })}
                                <div className="mt-4 pt-4 border-t border-white/10 text-xs text-gray-400 italic">
                                    <p><span className="font-bold text-green-400">الشرح:</span> {q.solution || 'لا يوجد شرح متوفر.'}</p>
                                </div>
                            </div>
                        )
                    })}
                </div>
            </div>
        </div>
    );
  }

  const currentQuestion = questions[currentIndex];

  return (
    <div className="fixed inset-0 bg-[#0A2540] flex flex-col font-['Tajawal'] text-white overflow-y-auto no-scrollbar" dir="rtl">
        {/* Header */}
        <header className="sticky top-0 z-20 bg-[#0A2540]/80 backdrop-blur-xl border-b border-white/10 px-6 py-4 flex items-center justify-between">
            <h2 className="text-lg font-bold truncate">{quiz.title}</h2>
            <div className="flex items-center gap-6">
                <div className={`text-2xl font-mono font-black tabular-nums ${timeLeft < 60 ? 'text-red-500 animate-pulse' : 'text-[#00d2ff]'}`}>
                    {Math.floor(timeLeft / 60)}:{String(timeLeft % 60).padStart(2, '0')}
                </div>
                <div className="w-48 h-2 bg-white/10 rounded-full">
                    <div className="h-full bg-[#fbbf24] rounded-full transition-all" style={{ width: `${((currentIndex + 1) / questions.length) * 100}%` }}></div>
                </div>
            </div>
        </header>

        {/* Main Content */}
        <main className="flex-1 flex flex-col items-center justify-center p-6 md:p-12">
            <div className="w-full max-w-4xl">
                <div className="glass-panel p-8 md:p-12 rounded-[50px] border-white/10 mb-10 shadow-2xl min-h-[300px]">
                    <p className="text-xs text-gray-500 font-bold mb-4">السؤال {currentIndex + 1} من {questions.length}</p>
                    <div className="text-2xl font-bold leading-relaxed mb-10 text-right">{renderMathText(currentQuestion.text)}</div>
                    
                    <div className="space-y-4">
                        {currentQuestion.type === 'mcq' && currentQuestion.choices?.map((choice) => (
                            <button key={choice.id} onClick={() => setUserAnswers({...userAnswers, [currentQuestion.id]: choice.id})} className={`w-full text-right p-6 rounded-2xl border-2 transition-all flex justify-between items-center ${userAnswers[currentQuestion.id] === choice.id ? 'bg-[#fbbf24]/20 border-[#fbbf24] text-[#fbbf24]' : 'bg-white/5 border-transparent hover:border-white/20'}`}>
                                <span className="font-bold text-lg">{choice.text}</span>
                                <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center ${userAnswers[currentQuestion.id] === choice.id ? 'border-[#fbbf24]' : 'border-white/10'}`}>
                                    {userAnswers[currentQuestion.id] === choice.id && <div className="w-3 h-3 bg-[#fbbf24] rounded-full"></div>}
                                </div>
                            </button>
                        ))}
                         {currentQuestion.type === 'file_upload' && (
                            <div className="p-6 bg-white/5 border-2 border-dashed border-white/10 rounded-2xl text-center">
                                <label htmlFor={`file-upload-${currentQuestion.id}`} className="cursor-pointer">
                                    <UploadCloud className="w-10 h-10 mx-auto text-gray-500 mb-2"/>
                                    <span className="text-sm font-bold text-gray-400">
                                        {userAnswers[currentQuestion.id] ? `تم اختيار: ${userAnswers[currentQuestion.id]}` : 'اختر ملفاً أو صورة للرفع'}
                                    </span>
                                    <input id={`file-upload-${currentQuestion.id}`} type="file" className="hidden" onChange={(e) => {
                                        if (e.target.files && e.target.files[0]) { setUserAnswers({...userAnswers, [currentQuestion.id]: e.target.files[0].name }); }
                                    }}/>
                                </label>
                            </div>
                         )}
                    </div>
                </div>

                <div className="flex justify-between items-center">
                    <button onClick={() => setCurrentIndex(p => Math.max(0, p - 1))} disabled={currentIndex === 0} className="flex items-center gap-2 text-gray-400 font-bold disabled:opacity-30 hover:text-white"><ArrowRight size={16}/> السابق</button>
                    {currentIndex === questions.length - 1 ? (
                        <button onClick={handleSubmit} className="bg-green-500 text-black px-12 py-5 rounded-[25px] font-black text-xs uppercase tracking-widest shadow-2xl hover:scale-105 transition-all">إنهاء وتصحيح</button>
                    ) : (
                        <button onClick={() => setCurrentIndex(p => Math.min(questions.length - 1, p + 1))} className="flex items-center gap-2 text-[#fbbf24] font-bold hover:text-yellow-300">التالي <ArrowLeft size={16}/></button>
                    )}
                </div>
            </div>
        </main>
        
        {/* Footer Navigator */}
        <footer className="sticky bottom-0 z-20 bg-black/50 backdrop-blur-lg p-4">
            <div className="max-w-4xl mx-auto flex flex-wrap justify-center gap-2">
                {questions.map((_, index) => (
                    <button key={index} onClick={() => setCurrentIndex(index)} className={`w-8 h-8 rounded-lg text-xs font-bold transition-all ${index === currentIndex ? 'bg-[#fbbf24] text-black scale-110' : userAnswers[questions[index].id] ? 'bg-white/20' : 'bg-white/5'}`}>
                        {index + 1}
                    </button>
                ))}
            </div>
        </footer>
    </div>
  );
};

export default QuizPlayer;

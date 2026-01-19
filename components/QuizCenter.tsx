import React, { useState, useEffect, useRef } from 'react';
import { User, Quiz, Question, StudentQuizAttempt } from '../types';
import { dbService } from '../services/db';
import { UploadCloud } from 'lucide-react';

const QuizCenter: React.FC<{ user: User; onBack: () => void }> = ({ user, onBack }) => {
  const [step, setStep] = useState<'select' | 'active' | 'result' | 'remedial'>('select');
  const [quizzes, setQuizzes] = useState<Quiz[]>([]);
  const [currentQuiz, setCurrentQuiz] = useState<Quiz | null>(null);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [userAnswers, setUserAnswers] = useState<Record<string, any>>({});
  const [timeLeft, setTimeLeft] = useState(0);
  const [startTime, setStartTime] = useState<number>(0);
  const [finalScore, setFinalScore] = useState(0);
  const [message, setMessage] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [needsManualGrading, setNeedsManualGrading] = useState(false);
  const [finalAutoScore, setFinalAutoScore] = useState(0);
  const [maxAutoScore, setMaxAutoScore] = useState(0);

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

  useEffect(() => {
    if (step === 'active' && timeLeft > 0) {
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
  }, [step, timeLeft]);

  const startQuiz = async (quiz: Quiz) => {
    if (quiz.isPremium && user.subscription !== 'premium') {
      setMessage("🔒 هذا الاختبار يتطلب اشتراك بريميوم.");
      setTimeout(() => setMessage(null), 3000);
      return;
    }

    const userAttempts = await dbService.getUserAttempts(user.uid, quiz.id);
    if (quiz.maxAttempts && userAttempts.length >= quiz.maxAttempts) {
      setCurrentQuiz(quiz);
      setStep('remedial');
      return;
    }

    setIsLoading(true);
    const quizQuestions = await dbService.getQuestionsForQuiz(quiz.id);
    
    const manualGradingNeeded = quizQuestions.some(q => ['essay', 'short_answer', 'file_upload'].includes(q.type));
    setNeedsManualGrading(manualGradingNeeded);
    
    setQuestions(quizQuestions);
    setCurrentQuiz(quiz);
    setTimeLeft(quiz.duration * 60 || 600);
    setStartTime(Date.now());
    setCurrentIndex(0);
    setUserAnswers({});
    setStep('active');
    setIsLoading(false);
  };

  const handleSubmit = async () => {
    if (isSubmitting || !currentQuiz) return;
    setIsSubmitting(true);

    let score = 0;
    let autoGradedMax = 0;
    questions.forEach(q => {
        if (q.type === 'mcq') {
            autoGradedMax += (q.score || 1);
            if (userAnswers[q.id] === q.correctChoiceId) {
                score += (q.score || 1);
            }
        }
    });

    setFinalAutoScore(score);
    setMaxAutoScore(autoGradedMax);
    
    const timeSpent = Math.floor((Date.now() - startTime) / 1000);
    const userAttempts = await dbService.getUserAttempts(user.uid, currentQuiz.id);

    const attempt: StudentQuizAttempt = {
      id: `attempt_${Date.now()}`,
      studentId: user.uid,
      quizId: currentQuiz.id,
      score: score, // Initially store auto-graded score
      totalQuestions: questions.length,
      maxScore: currentQuiz.totalScore || questions.length,
      completedAt: new Date().toISOString(),
      answers: userAnswers,
      timeSpent: timeSpent,
      attemptNumber: userAttempts.length + 1,
    };

    await dbService.saveAttempt(attempt);
    
    setFinalScore(score); // Set the score for display
    setStep('result');
    setIsSubmitting(false);
  };
  
  const resetQuizState = () => {
      setStep('select');
      setCurrentQuiz(null);
      setQuestions([]);
      setCurrentIndex(0);
      setUserAnswers({});
      setMessage(null);
  }

  if (step === 'select') {
    return (
      <div className="max-w-4xl mx-auto py-12 text-white font-['Tajawal']">
        <h2 className="text-4xl font-black mb-10 flex items-center gap-4">
           <span className="text-[#fbbf24]">📝</span> مركز التقييم الأكاديمي
        </h2>
        {message && <div className="mb-8 p-5 bg-red-500/10 border border-red-500/20 rounded-2xl text-red-500 text-sm font-bold animate-shake">{message}</div>}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {quizzes.map(quiz => (
            <div key={quiz.id} className="glass-panel p-10 rounded-[50px] border-white/5 hover:border-[#fbbf24]/40 transition-all relative overflow-hidden group">
               {quiz.isPremium && <div className="absolute top-6 left-6 bg-[#fbbf24] text-black text-[8px] font-black px-3 py-1 rounded-full uppercase tracking-widest">Premium</div>}
               <h3 className="text-2xl font-black mb-6 group-hover:text-[#fbbf24] transition-colors">{quiz.title}</h3>
               <div className="flex justify-between text-xs text-gray-500 mb-8 font-bold">
                  <span>⏱ {quiz.duration || 0} دقيقة</span>
                  <span>🔄 {quiz.maxAttempts || 1} محاولات</span>
               </div>
               <button onClick={() => startQuiz(quiz)} disabled={isLoading} className="w-full py-4 bg-[#fbbf24] text-black rounded-2xl font-black text-[10px] uppercase tracking-widest shadow-xl active:scale-95 transition-all disabled:opacity-50">
                 {isLoading ? 'جاري التحضير...' : 'ابدأ الاختبار'}
               </button>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (step === 'active') {
    if (questions.length === 0) return <div className="text-center py-20">جاري تحميل الأسئلة...</div>;
    const q = questions[currentIndex];
    return (
      <div className="max-w-3xl mx-auto py-12 font-['Tajawal'] text-white">
        <div className="flex justify-between items-center mb-10 bg-white/5 p-6 rounded-3xl border border-white/10">
           <div className="text-2xl font-black text-[#fbbf24]">Q{currentIndex + 1} / {questions.length}</div>
           <div className={`text-2xl font-mono ${timeLeft < 60 ? 'text-red-500 animate-pulse' : 'text-[#00d2ff]'}`}>{Math.floor(timeLeft / 60)}:{String(timeLeft % 60).padStart(2, '0')}</div>
        </div>
        <div className="glass-panel p-12 rounded-[50px] border-white/10 mb-10 shadow-2xl">
           <div className="text-2xl font-bold leading-relaxed mb-10 text-right">{q.text}</div>
           <div className="space-y-4">
              {q.type === 'mcq' && q.choices?.map((choice) => (
                <button key={choice.id} onClick={() => setUserAnswers({...userAnswers, [q.id]: choice.id})} className={`w-full text-right p-6 rounded-2xl border transition-all flex justify-between items-center ${userAnswers[q.id] === choice.id ? 'bg-[#fbbf24]/20 border-[#fbbf24] text-[#fbbf24]' : 'bg-white/5 border-white/5 hover:border-white/20'}`}>
                  <span className="font-bold text-lg">{choice.text}</span>
                  <div className={`w-6 h-6 rounded-full border-2 ${userAnswers[q.id] === choice.id ? 'bg-[#fbbf24] border-[#fbbf24]' : 'border-white/10'}`}></div>
                </button>
              ))}
              {q.type === 'file_upload' && (
                  <div className="p-6 bg-white/5 border-2 border-dashed border-white/10 rounded-2xl text-center">
                      <label htmlFor={`file-upload-${q.id}`} className="cursor-pointer">
                          <UploadCloud className="w-10 h-10 mx-auto text-gray-500 mb-2"/>
                          <span className="text-sm font-bold text-gray-400">
                              {userAnswers[q.id] ? `تم اختيار: ${userAnswers[q.id]}` : 'اختر ملفاً أو صورة للرفع'}
                          </span>
                          <input id={`file-upload-${q.id}`} type="file" className="hidden" onChange={(e) => {
                              if (e.target.files && e.target.files[0]) {
                                  setUserAnswers({...userAnswers, [q.id]: e.target.files[0].name });
                              }
                          }}/>
                      </label>
                  </div>
              )}
           </div>
        </div>
        <div className="flex justify-between items-center">
           <button onClick={resetQuizState} className="text-gray-500 font-black text-xs">إلغاء</button>
           {currentIndex === questions.length - 1 ? (
             <button onClick={handleSubmit} disabled={isSubmitting} className="bg-green-500 text-black px-12 py-5 rounded-[25px] font-black text-xs uppercase tracking-widest shadow-2xl hover:scale-105 transition-all disabled:opacity-50">{isSubmitting ? 'جاري التصحيح...' : 'إنهاء وتصحيح'}</button>
           ) : (
             <button onClick={() => setCurrentIndex(prev => prev + 1)} className="text-[#fbbf24] font-black text-xs">التالي ←</button>
           )}
        </div>
      </div>
    );
  }

  if (step === 'result') { 
    return ( 
        <div className="max-w-2xl mx-auto py-20 text-center font-['Tajawal'] text-white">
            <div className="glass-panel p-16 rounded-[70px] border-white/10 shadow-3xl">
                <div className="text-9xl mb-10">🏆</div>
                <h2 className="text-5xl font-black mb-4">
                    {needsManualGrading ? 'تم تسليم الإجابات!' : 'اكتمل الاختبار!'}
                </h2>
                {needsManualGrading ? (
                    <>
                        <p className="text-lg text-gray-400 mb-4">تم تصحيح الأسئلة التلقائية. ستظهر نتيجتك النهائية بعد مراجعة المعلم للأسئلة المقالية.</p>
                        <div className="text-4xl font-black text-white/50 mb-2">النتيجة الأولية</div>
                        <div className="text-7xl font-black text-[#fbbf24] mb-10 tabular-nums">{finalAutoScore} / {maxAutoScore}</div>
                    </>
                ) : (
                    <div className="text-7xl font-black text-[#fbbf24] mb-10 tabular-nums">{finalScore} / {currentQuiz?.totalScore || questions.length}</div>
                )}
                <button onClick={resetQuizState} className="bg-white text-black px-16 py-6 rounded-[35px] font-black text-xs uppercase tracking-widest hover:scale-110 transition-all shadow-2xl">العودة للمركز</button>
            </div>
        </div>
    );
  }

  if (step === 'remedial') { return ( <div className="max-w-2xl mx-auto py-20 text-center font-['Tajawal'] text-white"><div className="glass-panel p-16 rounded-[60px] border-orange-500/20 bg-orange-500/5"><div className="text-7xl mb-8">🤖</div><h2 className="text-3xl font-black mb-6">لقد استنفدت محاولاتك!</h2><p className="text-gray-400 mb-10 leading-relaxed italic">"سقراط يرى أنك بحاجة لمراجعة الدرس العلاجي قبل فتح محاولة جديدة. التركيز أهم من التكرار العشوائي."</p><button onClick={resetQuizState} className="bg-[#fbbf24] text-black px-12 py-5 rounded-2xl font-black text-xs uppercase tracking-widest">عرض الدروس العلاجية</button></div></div> ); }

  return null;
};

export default QuizCenter;

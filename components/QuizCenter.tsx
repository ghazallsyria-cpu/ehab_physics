
import React, { useState, useEffect, useRef } from 'react';
import { User, Quiz, Question, StudentQuizAttempt } from '../types';
import { dbService } from '../services/db';

const QuizCenter: React.FC<{ user: User; onBack: () => void }> = ({ user, onBack }) => {
  const [step, setStep] = useState<'select' | 'active' | 'result' | 'remedial'>('select');
  const [quizzes, setQuizzes] = useState<Quiz[]>([]);
  const [currentQuiz, setCurrentQuiz] = useState<Quiz | null>(null);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [userAnswers, setUserAnswers] = useState<Record<string, string>>({});
  const [timeLeft, setTimeLeft] = useState(0);
  const [startTime, setStartTime] = useState<number>(0);
  const [finalScore, setFinalScore] = useState(0);
  const [message, setMessage] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    loadQuizzes();
  }, [user]);

  const loadQuizzes = async () => {
    const data = dbService.getQuizzes();
    setQuizzes(data);
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
    if (userAttempts.length >= (quiz.maxAttempts || 1)) {
      setCurrentQuiz(quiz);
      setStep('remedial');
      return;
    }

    setIsLoading(true);
    const quizQuestions = dbService.getQuestionsForQuiz(quiz.id);
    
    setQuestions(quizQuestions);
    setCurrentQuiz(quiz);
    setTimeLeft(quiz.duration || 600);
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
    questions.forEach(q => {
      if (userAnswers[q.id] === q.correctAnswerId) score += (q.score || 1);
    });
    
    const timeSpent = Math.floor((Date.now() - startTime) / 1000);
    const userAttempts = await dbService.getUserAttempts(user.uid, currentQuiz.id);

    const attempt: StudentQuizAttempt = {
      id: `attempt_${Date.now()}`,
      studentId: user.uid,
      quizId: currentQuiz.id,
      score: score,
      totalQuestions: questions.length,
      maxScore: currentQuiz.totalScore || questions.length,
      completedAt: new Date().toISOString(),
      answers: userAnswers,
      timeSpent: timeSpent,
      attemptNumber: userAttempts.length + 1,
      guessingDetected: false 
    };

    await dbService.saveAttempt(attempt);
    
    const scorePercentage = (currentQuiz.totalScore || questions.length) > 0 ? (score / (currentQuiz.totalScore || questions.length)) : 0;
    if (user.uid && scorePercentage > 0.9) {
      await dbService.addNotification(user.uid, {
        userId: user.uid,
        title: "إنجاز أكاديمي ممتاز",
        message: `أتم الطالب ${user.name} اختبار ${currentQuiz.title} بنسبة تفوق.`,
        type: "success",
        category: "academic"
      });
    }

    setFinalScore(score);
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
                  <span>⏱ {(quiz.duration || 0) / 60} دقيقة</span>
                  <span>🔄 {quiz.maxAttempts} محاولات</span>
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
           <div className="grid grid-cols-1 gap-4">
              {q.answers?.map((choice) => (
                <button key={choice.id} onClick={() => setUserAnswers({...userAnswers, [q.id]: choice.id})} className={`w-full text-right p-6 rounded-2xl border transition-all flex justify-between items-center ${userAnswers[q.id] === choice.id ? 'bg-[#fbbf24]/20 border-[#fbbf24] text-[#fbbf24]' : 'bg-white/5 border-white/5 hover:border-white/20'}`}>
                  <span className="font-bold text-lg">{choice.text}</span>
                  <div className={`w-6 h-6 rounded-full border-2 ${userAnswers[q.id] === choice.id ? 'bg-[#fbbf24] border-[#fbbf24]' : 'border-white/10'}`}></div>
                </button>
              ))}
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

  if (step === 'result') { return ( <div className="max-w-2xl mx-auto py-20 text-center font-['Tajawal'] text-white"><div className="glass-panel p-16 rounded-[70px] border-white/10 shadow-3xl"><div className="text-9xl mb-10">🏆</div><h2 className="text-5xl font-black mb-4">اكتمل الاختبار!</h2><div className="text-7xl font-black text-[#fbbf24] mb-10 tabular-nums">{finalScore} / {currentQuiz?.totalScore || questions.length}</div><button onClick={resetQuizState} className="bg-white text-black px-16 py-6 rounded-[35px] font-black text-xs uppercase tracking-widest hover:scale-110 transition-all shadow-2xl">العودة للمركز</button></div></div> ); }
  if (step === 'remedial') { return ( <div className="max-w-2xl mx-auto py-20 text-center font-['Tajawal'] text-white"><div className="glass-panel p-16 rounded-[60px] border-orange-500/20 bg-orange-500/5"><div className="text-7xl mb-8">🤖</div><h2 className="text-3xl font-black mb-6">لقد استنفدت محاولاتك!</h2><p className="text-gray-400 mb-10 leading-relaxed italic">"سقراط يرى أنك بحاجة لمراجعة الدرس العلاجي قبل فتح محاولة جديدة. التركيز أهم من التكرار العشوائي."</p><button onClick={resetQuizState} className="bg-[#fbbf24] text-black px-12 py-5 rounded-2xl font-black text-xs uppercase tracking-widest">عرض الدروس العلاجية</button></div></div> ); }

  return null;
};

export default QuizCenter;

import React, { useState, useEffect } from 'react';
import { User, Quiz, Question, StudentQuizAttempt } from '../types';
import { dbService } from '../services/db';

const QuizCenter: React.FC<{ user: User }> = ({ user }) => {
  const [step, setStep] = useState<'select' | 'active' | 'result'>('select');
  const [quizzes, setQuizzes] = useState<Quiz[]>([]);
  const [currentQuiz, setCurrentQuiz] = useState<Quiz | null>(null);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [userAnswers, setUserAnswers] = useState<Record<string, string>>({}); // { questionId: answerId }
  const [finalResult, setFinalResult] = useState<StudentQuizAttempt | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    setIsLoading(true);
    const data = dbService.getQuizzes();
    setQuizzes(data);
    setIsLoading(false);
  }, []);

  const startQuiz = (quiz: Quiz) => {
    setIsLoading(true);
    const quizQuestions = dbService.getQuestionsForQuiz(quiz.id);
    setQuestions(quizQuestions);
    setCurrentQuiz(quiz);
    setStep('active');
    setIsLoading(false);
  };

  const handleSubmit = () => {
    if (!currentQuiz) return;
    let score = 0;
    questions.forEach(q => {
      if (userAnswers[q.id] === q.correctAnswerId) score++;
    });

    const attempt: StudentQuizAttempt = {
      id: `att_${Date.now()}`, studentId: user.uid, quizId: currentQuiz.id,
      score, totalQuestions: questions.length,
      completedAt: new Date().toISOString(), answers: userAnswers
    };
    dbService.saveAttempt(attempt);

    setFinalResult(attempt);
    setStep('result');
  };

  const reset = () => {
    setStep('select');
    setCurrentIndex(0);
    setUserAnswers({});
    setFinalResult(null);
  };

  if (step === 'select') {
    return (
      <div className="max-w-4xl mx-auto py-12 text-white font-['Tajawal']">
        <h2 className="text-4xl font-black mb-10">⚡ مركز الاختبارات</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {quizzes.map(quiz => (
            <div key={quiz.id} className="glass-panel p-10 rounded-[50px] border-white/5 hover:border-[#fbbf24]/40 transition-all group">
               <h3 className="text-2xl font-black mb-6 group-hover:text-[#fbbf24]">{quiz.title}</h3>
               <button onClick={() => startQuiz(quiz)} className="w-full py-4 bg-[#fbbf24] text-black rounded-2xl font-black text-[10px] uppercase tracking-widest">ابدأ الاختبار</button>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (step === 'active' && questions.length > 0) {
    const q = questions[currentIndex];
    return (
      <div className="max-w-3xl mx-auto py-12 font-['Tajawal'] text-white">
        <div className="text-2xl font-black text-[#fbbf24] mb-10">Q{currentIndex + 1} / {questions.length}</div>
        <div className="glass-panel p-12 rounded-[50px] mb-10">
           <div className="text-2xl font-bold mb-10">{q.text}</div>
           <div className="grid grid-cols-1 gap-4">
              {q.answers.map(ans => (
                <button key={ans.id} onClick={() => setUserAnswers({...userAnswers, [q.id]: ans.id})} className={`w-full text-right p-6 rounded-2xl border ${userAnswers[q.id] === ans.id ? 'bg-[#fbbf24]/20 border-[#fbbf24]' : 'bg-white/5 border-white/5'}`}>
                  <span className="font-bold">{ans.text}</span>
                </button>
              ))}
           </div>
        </div>
        {currentIndex === questions.length - 1 ? (
          <button onClick={handleSubmit} className="w-full bg-green-500 text-black px-12 py-5 rounded-2xl font-black uppercase">إنهاء وتصحيح</button>
        ) : (
          <button onClick={() => setCurrentIndex(i => i + 1)} className="w-full text-[#fbbf24] font-black">التالي ←</button>
        )}
      </div>
    );
  }

  if (step === 'result' && finalResult) {
    return (
      <div className="max-w-2xl mx-auto py-20 text-center font-['Tajawal'] text-white">
        <div className="glass-panel p-16 rounded-[70px]">
          <div className="text-9xl mb-10">🏆</div>
          <h2 className="text-5xl font-black mb-4">اكتمل الاختبار!</h2>
          <div className="text-7xl font-black text-[#fbbf24] mb-10">{finalResult.score} / {finalResult.totalQuestions}</div>
          <button onClick={reset} className="bg-white text-black px-16 py-6 rounded-3xl font-black uppercase">العودة للمركز</button>
        </div>
      </div>
    );
  }

  return <div className="text-white p-20 text-center">جاري التحميل...</div>;
};

export default QuizCenter;

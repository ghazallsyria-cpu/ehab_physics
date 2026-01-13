
import React, { useState, useEffect, useRef } from 'react';
import { User, Quiz, Question, QuizAttempt } from '../types';
import { dbService } from '../services/db';

const ExamCenter: React.FC<{ user: User; onBack: () => void }> = ({ user, onBack }) => {
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

  useEffect(() => {
    loadQuizzes();
  }, [user]);

  const loadQuizzes = async () => {
    const mockQuizzes: Quiz[] = [
      { id: 'q-factors-12', title: 'مراجعة العوامل الفيزيائية (شامل)', lessonId: 'rev-12', duration: 900, totalScore: 70, maxAttempts: 5, isPremium: false, minTimeRequired: 60 },
      { id: 'q-1', title: 'اختبار الشغل والطاقة - الوحدة الأولى', lessonId: 'l12-1', duration: 600, totalScore: 20, maxAttempts: 2, isPremium: false, minTimeRequired: 120 },
      { id: 'q-2', title: 'الكهرباء والمغناطيسية - متقدم', lessonId: 'l12-2', duration: 1200, totalScore: 30, maxAttempts: 1, isPremium: true, minTimeRequired: 300 },
    ];
    setQuizzes(mockQuizzes);
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
    // 6B: التحقق من الاشتراك
    if (quiz.isPremium && user.subscription === 'free') {
      setMessage("🔒 هذا الاختبار يتطلب اشتراك بريميوم.");
      return;
    }

    // 6A: التحقق من المحاولات
    const userAttempts = await dbService.getUserAttempts(user.uid, quiz.id);
    if (userAttempts.length >= quiz.maxAttempts) {
      setStep('remedial');
      return;
    }

    let qs: Question[] = [];

    // تحميل الأسئلة بناءً على الاختبار المختار
    if (quiz.id === 'q-factors-12') {
      // الأسئلة المستخلصة من ملف الـ PDF (المراجعة النهائية)
      qs = [
        {
          id: 'f1', grade: '12', subject: 'Physics', unit: 'Mechanics',
          question_text: 'ما العوامل التي يتوقف عليها الشغل الناتج عن قوة منتظمة على مسار أفقي؟',
          type: 'mcq', difficulty: 'Easy', correct_answer: 'مقدار القوة والإزاحة والزاوية بينهما',
          solution: 'W = F d cos(θ)', score: 10,
          choices: [
            {key: 'A', text: 'مقدار القوة والإزاحة والزاوية بينهما'},
            {key: 'B', text: 'الكتلة والسرعة والزمن'},
            {key: 'C', text: 'شكل المسار والزمن المستغرق'}
          ]
        },
        {
          id: 'f2', grade: '12', subject: 'Physics', unit: 'Energy',
          question_text: 'على ماذا تعتمد الطاقة الحركية الخطية (KE) للجسم؟',
          type: 'mcq', difficulty: 'Medium', correct_answer: 'كتلة الجسم ومربع سرعته الخطية',
          solution: 'KE = 0.5 m v^2', score: 10,
          choices: [
            {key: 'A', text: 'وزن الجسم والارتفاع'},
            {key: 'B', text: 'كتلة الجسم ومربع سرعته الخطية'},
            {key: 'C', text: 'كمية الحركة والزمن'}
          ]
        },
        {
          id: 'f3', grade: '12', subject: 'Physics', unit: 'Energy',
          question_text: 'ما العوامل المؤثرة في الطاقة الكامنة المرنة المختزنة في نابض؟',
          type: 'mcq', difficulty: 'Medium', correct_answer: 'ثابت مرونة النابض ومربع الاستطالة',
          solution: 'PE_elastic = 0.5 k x^2', score: 10,
          choices: [
            {key: 'A', text: 'طول النابض الأصلي وكتلته'},
            {key: 'B', text: 'ثابت مرونة النابض ومربع الاستطالة'},
            {key: 'C', text: 'القوة المؤثرة والزمن'}
          ]
        },
        {
          id: 'f4', grade: '12', subject: 'Physics', unit: 'Rotation',
          question_text: 'القصور الذاتي الدوراني (I) للجسم يعتمد على:',
          type: 'mcq', difficulty: 'Hard', correct_answer: 'كتلة الجسم وتوزيع الكتلة حول محور الدوران',
          solution: 'I يعتمد على الكتلة وتوزيعها (الشكل الهندسي) وموضع محور الدوران', score: 10,
          choices: [
            {key: 'A', text: 'السرعة الزاوية للجسم'},
            {key: 'B', text: 'العزم المؤثر والزمن'},
            {key: 'C', text: 'كتلة الجسم وتوزيع الكتلة حول محور الدوران'}
          ]
        },
        {
          id: 'f5', grade: '12', subject: 'Physics', unit: 'Rotation',
          question_text: 'ما العوامل التي يتوقف عليها عزم القوة (Torque)؟',
          type: 'mcq', difficulty: 'Medium', correct_answer: 'مقدار القوة وذراع العزم',
          solution: 'τ = F . d', score: 10,
          choices: [
            {key: 'A', text: 'مقدار القوة وذراع العزم'},
            {key: 'B', text: 'القصور الذاتي والسرعة الزاوية'},
            {key: 'C', text: 'الشغل والطاقة'}
          ]
        },
        {
          id: 'f6', grade: '12', subject: 'Physics', unit: 'Momentum',
          question_text: 'تعتمد كمية الحركة الخطية (p) على:',
          type: 'mcq', difficulty: 'Easy', correct_answer: 'الكتلة والسرعة المتجهة',
          solution: 'p = m v', score: 10,
          choices: [
            {key: 'A', text: 'الكتلة والعجلة'},
            {key: 'B', text: 'الكتلة والسرعة المتجهة'},
            {key: 'C', text: 'القوة والزمن'}
          ]
        },
        {
          id: 'f7', grade: '12', subject: 'Physics', unit: 'Energy',
          question_text: 'الطاقة الكامنة التثاقلية (PEG) تتوقف على:',
          type: 'mcq', difficulty: 'Easy', correct_answer: 'الكتلة وعجلة الجاذبية والارتفاع الرأسي',
          solution: 'PEG = m g h', score: 10,
          choices: [
            {key: 'A', text: 'السرعة والمسار الأفقي'},
            {key: 'B', text: 'الكتلة وعجلة الجاذبية والارتفاع الرأسي'},
            {key: 'C', text: 'ثابت المرونة والازاحة'}
          ]
        }
      ];
    } else {
      // محاكاة أسئلة افتراضية للاختبارات الأخرى
      qs = [
        { id: 'q1', grade: '12', subject: 'Physics', unit: '1', question_text: 'ما هو شغل القوة إذا كانت القوة عمودية على الإزاحة؟', type: 'mcq', difficulty: 'Easy', correct_answer: 'صفر', solution: 'W = Fd cos(90) = 0', score: 10, choices: [{key: 'A', text: 'أقصى ما يمكن'}, {key: 'B', text: 'صفر'}, {key: 'C', text: 'قيمة سالبة'}] }
      ];
    }
    
    setQuestions(qs);
    setCurrentQuiz(quiz);
    setTimeLeft(quiz.duration);
    setStartTime(Date.now());
    setStep('active');
  };

  const handleSubmit = async () => {
    if (isSubmitting) return;
    setIsSubmitting(true);

    let score = 0;
    questions.forEach(q => {
      if (userAnswers[q.id] === q.correct_answer) score += q.score;
    });
    
    const timeSpent = Math.floor((Date.now() - startTime) / 1000);
    const userAttempts = await dbService.getUserAttempts(user.uid, currentQuiz!.id);

    const attempt: QuizAttempt = {
      userId: user.uid,
      quizId: currentQuiz!.id,
      score: score,
      maxScore: currentQuiz!.totalScore,
      timestamp: new Date().toISOString(),
      timeSpent: timeSpent,
      attemptNumber: userAttempts.length + 1,
      guessingDetected: false 
    };

    await dbService.saveAttempt(attempt);
    
    // إشعار لولي الأمر إذا كان الطالب متفوقاً أو متعثراً
    if (score / currentQuiz!.totalScore > 0.9) {
      await dbService.addNotification(user.uid, {
        title: "إنجاز أكاديمي ممتاز",
        message: `أتم الطالب ${user.name} اختبار ${currentQuiz!.title} بنسبة تفوق.`,
        type: "success",
        category: "academic"
      });
    }

    setFinalScore(score);
    setStep('result');
    setIsSubmitting(false);
  };

  if (step === 'remedial') {
    return (
      <div className="max-w-2xl mx-auto py-20 text-center font-['Tajawal'] text-white">
        <div className="glass-panel p-16 rounded-[60px] border-orange-500/20 bg-orange-500/5">
          <div className="text-7xl mb-8">🤖</div>
          <h2 className="text-3xl font-black mb-6">لقد استنفدت محاولاتك!</h2>
          <p className="text-gray-400 mb-10 leading-relaxed italic">
            "سقراط يرى أنك بحاجة لمراجعة الدرس العلاجي قبل فتح محاولة جديدة. التركيز أهم من التكرار العشوائي."
          </p>
          <button onClick={onBack} className="bg-[#fbbf24] text-black px-12 py-5 rounded-2xl font-black text-xs uppercase tracking-widest">عرض الدروس العلاجية</button>
        </div>
      </div>
    );
  }

  if (step === 'select') {
    return (
      <div className="max-w-4xl mx-auto py-12 text-white font-['Tajawal']">
        <h2 className="text-4xl font-black mb-10 flex items-center gap-4">
           <span className="text-[#fbbf24]">📝</span> مركز التقييم الأكاديمي
        </h2>
        
        {message && (
          <div className="mb-8 p-5 bg-red-500/10 border border-red-500/20 rounded-2xl text-red-500 text-sm font-bold animate-shake">
             {message}
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {quizzes.map(quiz => (
            <div key={quiz.id} className="glass-panel p-10 rounded-[50px] border-white/5 hover:border-[#fbbf24]/40 transition-all relative overflow-hidden group">
               {quiz.isPremium && (
                 <div className="absolute top-6 left-6 bg-[#fbbf24] text-black text-[8px] font-black px-3 py-1 rounded-full uppercase tracking-widest">Premium</div>
               )}
               {quiz.id === 'q-factors-12' && (
                 <div className="absolute top-6 right-6 bg-green-500 text-white text-[8px] font-black px-3 py-1 rounded-full uppercase tracking-widest animate-pulse">جديد: العوامل</div>
               )}
               <h3 className="text-2xl font-black mb-6 group-hover:text-[#fbbf24] transition-colors">{quiz.title}</h3>
               <div className="flex justify-between text-xs text-gray-500 mb-8 font-bold">
                  <span>⏱ {quiz.duration / 60} دقيقة</span>
                  <span>🔄 {quiz.maxAttempts} محاولات</span>
               </div>
               <button 
                onClick={() => startQuiz(quiz)} 
                className="w-full py-4 bg-[#fbbf24] text-black rounded-2xl font-black text-[10px] uppercase tracking-widest shadow-xl active:scale-95 transition-all"
               >
                 ابدأ الاختبار
               </button>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (step === 'active') {
    const q = questions[currentIndex];
    return (
      <div className="max-w-3xl mx-auto py-12 font-['Tajawal'] text-white">
        <div className="flex justify-between items-center mb-10 bg-white/5 p-6 rounded-3xl border border-white/10">
           <div className="text-2xl font-black text-[#fbbf24]">Q{currentIndex + 1} / {questions.length}</div>
           <div className={`text-2xl font-mono ${timeLeft < 60 ? 'text-red-500 animate-pulse' : 'text-[#00d2ff]'}`}>
              {Math.floor(timeLeft / 60)}:{String(timeLeft % 60).padStart(2, '0')}
           </div>
        </div>

        <div className="glass-panel p-12 rounded-[50px] border-white/10 mb-10 shadow-2xl">
           <div className="text-2xl font-bold leading-relaxed mb-10 text-right">{q.question_text}</div>
           <div className="grid grid-cols-1 gap-4">
              {q.choices?.map((choice, i) => (
                <button 
                  key={i}
                  onClick={() => setUserAnswers({...userAnswers, [q.id]: choice.text})}
                  className={`w-full text-right p-6 rounded-2xl border transition-all flex justify-between items-center ${userAnswers[q.id] === choice.text ? 'bg-[#fbbf24]/20 border-[#fbbf24] text-[#fbbf24]' : 'bg-white/5 border-white/5 hover:border-white/20'}`}
                >
                  <span className="font-bold text-lg">{choice.text}</span>
                  <div className={`w-6 h-6 rounded-full border-2 ${userAnswers[q.id] === choice.text ? 'bg-[#fbbf24] border-[#fbbf24]' : 'border-white/10'}`}></div>
                </button>
              ))}
           </div>
        </div>

        <div className="flex justify-between items-center">
           <button onClick={onBack} className="text-gray-500 font-black text-xs">إلغاء</button>
           {currentIndex === questions.length - 1 ? (
             <button onClick={handleSubmit} className="bg-green-500 text-black px-12 py-5 rounded-[25px] font-black text-xs uppercase tracking-widest shadow-2xl hover:scale-105 transition-all">إنهاء وتصحيح</button>
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
           <h2 className="text-5xl font-black mb-4">اكتمل الاختبار!</h2>
           <div className="text-7xl font-black text-[#fbbf24] mb-10 tabular-nums">{finalScore} / {currentQuiz?.totalScore}</div>
           <button onClick={onBack} className="bg-white text-black px-16 py-6 rounded-[35px] font-black text-xs uppercase tracking-widest hover:scale-110 transition-all shadow-2xl">العودة للوحة التحكم</button>
        </div>
      </div>
    );
  }

  return null;
};

export default ExamCenter;

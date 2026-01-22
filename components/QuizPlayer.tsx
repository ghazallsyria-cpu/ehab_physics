import React, { useState, useEffect } from 'react';
import { User, Quiz, Question, StudentQuizAttempt } from '../types';
import { dbService } from '../services/db';
import { UploadCloud, Check, X, ArrowRight, ArrowLeft, AlertTriangle, Loader2 } from 'lucide-react';
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
  const [uploadingQuestions, setUploadingQuestions] = useState<Record<string, boolean>>({});
  const [timeLeft, setTimeLeft] = useState(quiz.duration * 60);
  const [startTime] = useState(Date.now());
  const [isFinished, setIsFinished] = useState(false);
  const [finalAttempt, setFinalAttempt] = useState<StudentQuizAttempt | null>(null);

  useEffect(() => {
    const loadQuestions = async () => {
      setIsLoading(true);
      const quizQuestions = await dbService.getQuestionsForQuiz(quiz.id);
      setQuestions(quizQuestions);
      setIsLoading(false);
    };
    loadQuestions();
  }, [quiz.id]);

  useEffect(() => {
    if (!isFinished && timeLeft > 0 && !isLoading) {
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
  }, [isFinished, timeLeft, isLoading]);

  const handleFileUpload = async (questionId: string, file: File) => {
    if (!file) return;
    
    setUploadingQuestions(prev => ({ ...prev, [questionId]: true }));
    try {
      // رفع الملف إلى Supabase Storage
      const asset = await dbService.uploadAsset(file);
      // تخزين الرابط (URL) في الإجابات
      setUserAnswers(prev => ({ ...prev, [questionId]: asset.url }));
    } catch (error) {
      console.error("Upload failed:", error);
      alert("فشل رفع الملف، يرجى المحاولة مرة أخرى.");
    } finally {
      setUploadingQuestions(prev => ({ ...prev, [questionId]: false }));
    }
  };

  const handleSubmit = async () => {
    if (isFinished) return;
    
    // التحقق من وجود ملفات قيد الرفع
    const isStillUploading = Object.values(uploadingQuestions).some(val => val === true);
    if (isStillUploading) {
        alert("يرجى الانتظار حتى اكتمال رفع الملفات قبل التسليم.");
        return;
    }

    setIsFinished(true);

    const timeSpent = Math.floor((Date.now() - startTime) / 1000);
    const userAttempts = await dbService.getUserAttempts(user.uid, quiz.id);

    const attempt: StudentQuizAttempt = {
      id: `attempt_${Date.now()}`,
      studentId: user.uid,
      studentName: user.name,
      quizId: quiz.id,
      score: 0, 
      totalQuestions: questions.length,
      maxScore: quiz.totalScore || questions.reduce((s, q) => s + q.score, 0),
      completedAt: new Date().toISOString(),
      answers: userAnswers,
      timeSpent: timeSpent,
      attemptNumber: userAttempts.length + 1,
      status: 'pending-review',
    };

    await dbService.saveAttempt(attempt);
    setFinalAttempt(attempt);
    
    await dbService.createNotification({
        userId: user.uid,
        title: "تم استلام الاختبار بنجاح",
        message: `تم تسليم إجاباتك لاختبار "${quiz.title}". سيقوم المعلم بمراجعته قريباً.`,
        timestamp: new Date().toISOString(),
        isRead: false,
        type: 'info',
        category: 'academic'
    });
  };

  const renderMathText = (text: string) => {
    try {
      if (!text) return <div></div>;
      const html = text.replace(/\$(.*?)\$/g, (match, math) => katex.renderToString(math, { throwOnError: false }));
      return <div dangerouslySetInnerHTML={{ __html: html }} />;
    } catch {
      return <div>{text}</div>;
    }
  };

  if (isLoading) {
    return <div className="fixed inset-0 bg-[#0A2540] flex items-center justify-center text-white font-bold animate-pulse">جاري تحضير الاختبار...</div>;
  }
  
  if (!isLoading && questions.length === 0) {
    return (
        <div className="fixed inset-0 bg-[#0A2540] flex flex-col items-center justify-center text-white text-center p-8 font-['Tajawal']" dir="rtl">
            <div className="glass-panel p-12 rounded-[50px] border-red-500/20 bg-red-500/5">
                <AlertTriangle className="w-16 h-16 text-red-400 mx-auto mb-6" />
                <h2 className="text-3xl font-black mb-4">خطأ في تحميل الاختبار</h2>
                <p className="text-gray-400 mb-8">عذراً، هذا الاختبار لا يحتوي على أسئلة في الوقت الحالي.</p>
                <button onClick={onFinish} className="bg-red-500 text-white px-10 py-4 rounded-full font-black text-xs uppercase tracking-widest hover:scale-105 transition-all">العودة لمركز الاختبارات</button>
            </div>
        </div>
    );
  }
  
  if(isFinished && finalAttempt) {
    return (
        <div className="min-h-screen bg-geometric-pattern p-4 md:p-10 font-['Tajawal'] text-white flex items-center justify-center" dir="rtl">
            <div className="max-w-2xl mx-auto">
                <div className="glass-panel p-10 md:p-16 rounded-[60px] border-white/5 bg-black/40 text-center animate-fadeIn">
                    <div className="w-24 h-24 bg-green-500/10 border-2 border-green-500/20 text-green-400 rounded-full flex items-center justify-center mx-auto mb-8 text-5xl">✓</div>
                    <h2 className="text-4xl font-black mb-4">تم تسليم إجاباتك بنجاح!</h2>
                    <p className="text-gray-400 mb-8 max-w-md mx-auto">سيقوم المعلم بمراجعة المرفقات والإجابات المقالية وتصحيحها يدوياً.</p>
                    <button onClick={onFinish} className="bg-[#fbbf24] text-black px-10 py-4 rounded-full font-black text-xs uppercase tracking-widest hover:scale-105 transition-all">العودة لمركز الاختبارات</button>
                </div>
            </div>
        </div>
    );
  }

  const currentQuestion = questions[currentIndex];

  return (
    <div className="fixed inset-0 bg-[#0A2540] flex flex-col font-['Tajawal'] text-white overflow-y-auto no-scrollbar" dir="rtl">
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

        <main className="flex-1 flex flex-col items-center justify-center p-6 md:p-12">
            <div className="w-full max-w-4xl">
                <div className="glass-panel p-8 md:p-12 rounded-[50px] border-white/10 mb-10 shadow-2xl min-h-[300px]">
                    <p className="text-xs text-gray-500 font-bold mb-4">السؤال {currentIndex + 1} من {questions.length} ({currentQuestion.score} درجات)</p>
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
                            <div className={`p-10 border-2 border-dashed rounded-[35px] transition-all flex flex-col items-center justify-center text-center ${userAnswers[currentQuestion.id] ? 'bg-green-500/10 border-green-500/40' : 'bg-white/5 border-white/10'}`}>
                                {uploadingQuestions[currentQuestion.id] ? (
                                    <div className="flex flex-col items-center gap-4">
                                        <Loader2 className="w-12 h-12 text-[#fbbf24] animate-spin" />
                                        <p className="text-[#fbbf24] font-black uppercase tracking-widest text-xs">جاري رفع إجابتك للسحابة...</p>
                                    </div>
                                ) : userAnswers[currentQuestion.id] ? (
                                    <div className="flex flex-col items-center gap-4">
                                        <div className="w-16 h-16 bg-green-500 text-black rounded-full flex items-center justify-center text-2xl shadow-lg">✓</div>
                                        <div>
                                            <p className="text-white font-bold">تم رفع الملف بنجاح</p>
                                            <button onClick={() => setUserAnswers(prev => ({...prev, [currentQuestion.id]: undefined}))} className="text-red-400 text-[10px] font-bold mt-2 hover:underline">إلغاء ورفع ملف آخر</button>
                                        </div>
                                    </div>
                                ) : (
                                    <label className="cursor-pointer group">
                                        <div className="w-20 h-20 bg-white/5 rounded-3xl flex items-center justify-center text-gray-500 mb-6 group-hover:bg-[#fbbf24]/10 group-hover:text-[#fbbf24] transition-all">
                                            <UploadCloud size={40}/>
                                        </div>
                                        <p className="text-lg font-bold text-gray-400 group-hover:text-white transition-colors">اضغط لاختيار ملف الإجابة</p>
                                        <p className="text-[10px] text-gray-600 mt-2">صور الحل اليدوي أو ارفق ملف PDF</p>
                                        <input type="file" className="hidden" onChange={(e) => e.target.files && handleFileUpload(currentQuestion.id, e.target.files[0])}/>
                                    </label>
                                )}
                            </div>
                         )}

                         {(currentQuestion.type === 'short_answer' || currentQuestion.type === 'essay') && (
                            <textarea
                                value={userAnswers[currentQuestion.id] || ''}
                                onChange={e => setUserAnswers({...userAnswers, [currentQuestion.id]: e.target.value})}
                                placeholder="اكتب إجابتك هنا..."
                                className="w-full h-40 bg-black/40 border border-white/10 rounded-2xl p-4 text-white outline-none focus:border-[#fbbf24]"
                            />
                         )}
                    </div>
                </div>

                <div className="flex justify-between items-center">
                    <button onClick={() => setCurrentIndex(p => Math.max(0, p - 1))} disabled={currentIndex === 0} className="flex items-center gap-2 text-gray-400 font-bold disabled:opacity-30 hover:text-white"><ArrowRight size={16}/> السابق</button>
                    {currentIndex === questions.length - 1 ? (
                        <button onClick={handleSubmit} disabled={Object.values(uploadingQuestions).some(v => v)} className="bg-green-500 text-black px-12 py-5 rounded-[25px] font-black text-xs uppercase tracking-widest shadow-2xl hover:scale-105 transition-all disabled:opacity-50">تسليم الإجابات</button>
                    ) : (
                        <button onClick={() => setCurrentIndex(p => Math.min(questions.length - 1, p + 1))} className="flex items-center gap-2 text-[#fbbf24] font-bold hover:text-yellow-300">التالي <ArrowLeft size={16}/></button>
                    )}
                </div>
            </div>
        </main>
    </div>
  );
};

export default QuizPlayer;
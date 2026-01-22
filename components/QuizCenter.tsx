import React, { useState, useEffect, useMemo } from 'react';
import { User, Quiz, StudentQuizAttempt } from '../types';
import { dbService } from '../services/db';
import { 
  Clock, 
  HelpCircle, 
  Trophy, 
  Zap, 
  ChevronRight, 
  History, 
  Lock, 
  Award, 
  BarChart3,
  CheckCircle2,
  AlertCircle
} from 'lucide-react';

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
    try {
        const [allQuizzes, allAttempts] = await Promise.all([
            dbService.getQuizzes(),
            dbService.getUserAttempts(user.uid)
        ]);
        const userGradeQuizzes = allQuizzes.filter(q => q.grade === user.grade);
        setQuizzes(userGradeQuizzes);
        setUserAttempts(allAttempts);
    } catch (e) {
        console.error("Failed to load quiz center data", e);
    } finally {
        setIsLoading(false);
    }
  };

  const startQuiz = async (quiz: Quiz) => {
    if (quiz.isPremium && user.subscription !== 'premium') {
      setMessage("🔒 هذا الاختبار يتطلب اشتراك باقة التفوق.");
      setTimeout(() => setMessage(null), 3000);
      return;
    }

    const attemptsForThisQuiz = userAttempts.filter(a => a.quizId === quiz.id);
    if (quiz.maxAttempts && attemptsForThisQuiz.length >= quiz.maxAttempts) {
       setMessage("عذراً، لقد استنفدت كافة محاولاتك المتاحة لهذا الاختبار.");
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

  const groupedQuizzes = useMemo(() => {
    return quizzes.reduce((acc: Record<string, Quiz[]>, quiz) => {
      const category = quiz.category || 'اختبارات المنهج';
      if (!acc[category]) acc[category] = [];
      acc[category].push(quiz);
      return acc;
    }, {} as Record<string, Quiz[]>);
  }, [quizzes]);

  // إحصائيات سريعة للطالب
  const stats = useMemo(() => {
    const totalDone = userAttempts.length;
    const avgScore = totalDone > 0 
        ? Math.round(userAttempts.reduce((acc, curr) => acc + (curr.score / curr.maxScore * 100), 0) / totalDone) 
        : 0;
    return { totalDone, avgScore, points: user.progress.points };
  }, [userAttempts, user.progress.points]);

  return (
    <div className="max-w-6xl mx-auto py-8 text-white font-['Tajawal'] animate-fadeIn" dir="rtl">
      
      {/* Header & Stats Section */}
      <header className="mb-12 flex flex-col lg:flex-row justify-between items-end gap-8">
        <div className="text-right">
            <h2 className="text-5xl font-black mb-3 tracking-tighter italic">مركز <span className="text-[#fbbf24] text-glow-gold">التقييم</span></h2>
            <p className="text-gray-500 text-lg font-medium">قِس مستوى استيعابك للمفاهيم الفيزيائية من خلال اختباراتنا المرقمنة.</p>
        </div>
        
        <div className="flex gap-4 w-full lg:w-auto">
            <div className="flex-1 lg:flex-none bg-white/5 border border-white/10 p-4 rounded-3xl flex items-center gap-4 backdrop-blur-md">
                <div className="w-10 h-10 bg-[#fbbf24]/10 rounded-2xl flex items-center justify-center text-[#fbbf24]"><Award size={20}/></div>
                <div>
                    <p className="text-[9px] font-black text-gray-500 uppercase">متوسط الدرجات</p>
                    <p className="text-lg font-black tabular-nums">{stats.avgScore}%</p>
                </div>
            </div>
            <div className="flex-1 lg:flex-none bg-white/5 border border-white/10 p-4 rounded-3xl flex items-center gap-4 backdrop-blur-md">
                <div className="w-10 h-10 bg-blue-500/10 rounded-2xl flex items-center justify-center text-blue-400"><History size={20}/></div>
                <div>
                    <p className="text-[9px] font-black text-gray-500 uppercase">الاختبارات المنفذة</p>
                    <p className="text-lg font-black tabular-nums">{stats.totalDone}</p>
                </div>
            </div>
        </div>
      </header>

      {message && (
        <div className="mb-8 p-5 bg-red-500/10 border border-red-500/20 rounded-3xl text-red-400 text-sm font-bold flex items-center gap-3 animate-shake">
            <AlertCircle size={20}/> {message}
        </div>
      )}
      
      {isLoading ? (
        <div className="py-32 text-center">
            <div className="w-16 h-16 border-4 border-[#fbbf24] border-t-transparent rounded-full animate-spin mx-auto mb-6"></div>
            <p className="text-gray-500 font-black uppercase tracking-[0.2em]">جاري استدعاء بنك الاختبارات...</p>
        </div>
      ) : quizzes.length === 0 ? (
          <div className="py-32 text-center border-2 border-dashed border-white/10 rounded-[60px] bg-white/[0.02]">
            <div className="w-20 h-20 bg-white/5 rounded-full flex items-center justify-center mx-auto mb-6">
                <HelpCircle size={40} className="text-gray-600" />
            </div>
            <h3 className="text-xl font-bold text-gray-400">لا توجد اختبارات متاحة حالياً</h3>
            <p className="text-sm text-gray-600 mt-2">سيقوم المعلم بإضافة اختبارات جديدة لصفك قريباً.</p>
          </div>
      ) : (
        <div className="space-y-20">
          {/* Fix: Explicitly type the result of Object.entries to Quiz[] to resolve 'unknown' property errors */}
          {(Object.entries(groupedQuizzes) as [string, Quiz[]][]).map(([category, quizList], catIdx) => (
            <div key={category} className="animate-slideUp" style={{ animationDelay: `${catIdx * 0.1}s` }}>
              <div className="flex items-center gap-4 mb-8">
                <div className="h-8 w-1.5 bg-[#fbbf24] rounded-full shadow-[0_0_15px_#fbbf24]"></div>
                <h3 className="text-2xl font-black text-white">{category}</h3>
                <span className="bg-white/5 px-3 py-1 rounded-lg text-[10px] font-black text-gray-500 uppercase">متاح: {quizList.length}</span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {quizList.map(quiz => {
                  const attempts: StudentQuizAttempt[] = userAttempts
                    .filter(a => a.quizId === quiz.id)
                    .sort((a,b) => (b.attemptNumber || 0) - (a.attemptNumber || 0));
                  
                  return (
                    <div key={quiz.id} className="glass-panel group rounded-[50px] border-white/5 hover:border-[#fbbf24]/30 transition-all duration-500 flex flex-col relative overflow-hidden bg-gradient-to-br from-white/[0.02] to-transparent">
                       
                       {/* Top Section */}
                       <div className="p-8 md:p-10">
                          <div className="flex justify-between items-start mb-6">
                             <div className={`p-3 rounded-2xl ${quiz.isPremium ? 'bg-amber-500 text-black' : 'bg-white/5 text-gray-400'}`}>
                                {quiz.isPremium ? <Zap size={20} fill="currentColor"/> : <Award size={20}/>}
                             </div>
                             {quiz.isPremium && <span className="bg-amber-500/10 text-amber-500 text-[8px] font-black px-3 py-1 rounded-full uppercase tracking-widest border border-amber-500/20">باقة التفوق</span>}
                          </div>

                          <h3 className="text-2xl font-black text-white group-hover:text-[#fbbf24] transition-colors mb-4 leading-tight">{quiz.title}</h3>
                          <p className="text-sm text-gray-500 mb-8 leading-relaxed line-clamp-2">"{quiz.description || 'لا يوجد وصف متاح لهذا الاختبار، يغطي مواضيع المنهج المعتمدة.'}"</p>
                          
                          <div className="grid grid-cols-3 gap-4 mb-10 bg-black/30 p-5 rounded-[30px] border border-white/5">
                              <div className="text-center">
                                  <div className="flex justify-center mb-1 text-[#00d2ff] opacity-50"><HelpCircle size={14}/></div>
                                  <p className="text-lg font-black tabular-nums">{quiz.questionIds.length}</p>
                                  <p className="text-[8px] font-bold text-gray-500 uppercase">سؤال</p>
                              </div>
                              <div className="text-center border-x border-white/10">
                                  <div className="flex justify-center mb-1 text-emerald-400 opacity-50"><Clock size={14}/></div>
                                  <p className="text-lg font-black tabular-nums">{quiz.duration}</p>
                                  <p className="text-[8px] font-bold text-gray-500 uppercase">دقيقة</p>
                              </div>
                              <div className="text-center">
                                  <div className="flex justify-center mb-1 text-purple-400 opacity-50"><History size={14}/></div>
                                  <p className="text-lg font-black tabular-nums">{quiz.maxAttempts || '∞'}</p>
                                  <p className="text-[8px] font-bold text-gray-500 uppercase">محاولات</p>
                              </div>
                          </div>

                          <button 
                            onClick={() => startQuiz(quiz)} 
                            className="w-full py-5 bg-[#fbbf24] text-black rounded-[25px] font-black text-xs uppercase tracking-widest shadow-2xl hover:scale-[1.02] active:scale-95 transition-all flex items-center justify-center gap-3 group/btn"
                          >
                            {attempts.length > 0 ? 'إعادة المحاولة' : 'ابدأ الاختبار الآن'}
                            <ChevronRight size={18} className="group-hover:translate-x-[-5px] transition-transform" />
                          </button>
                       </div>
                       
                       {/* History Section */}
                       {attempts.length > 0 && (
                          <div className="bg-black/40 border-t border-white/5 p-8 md:p-10 space-y-4">
                              <h5 className="text-[10px] font-black text-gray-500 uppercase tracking-widest mb-2 flex items-center gap-2">
                                <History size={12}/> سجل محاولاتك السابقة
                              </h5>
                              <div className="space-y-3">
                                  {attempts.map(att => {
                                      const scorePercent = (att.score / att.maxScore) * 100;
                                      const isSuccess = scorePercent >= 50;
                                      
                                      return (
                                          <div key={att.id} className="flex justify-between items-center bg-white/[0.03] p-4 rounded-2xl border border-white/5 group/att hover:border-white/20 transition-all">
                                              <div className="flex items-center gap-4">
                                                  <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-black ${isSuccess ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'}`}>
                                                      #{att.attemptNumber}
                                                  </div>
                                                  <div>
                                                      <div className="flex items-center gap-2">
                                                        <span className="text-sm font-bold text-white tabular-nums">{att.score} / {att.maxScore}</span>
                                                        {att.status === 'pending-review' && <span className="text-[7px] bg-yellow-500/10 text-yellow-500 px-1.5 py-0.5 rounded font-black uppercase">قيد التصحيح</span>}
                                                      </div>
                                                      <p className="text-[8px] text-gray-600 font-bold uppercase">{new Date(att.completedAt).toLocaleDateString('ar-KW')}</p>
                                                  </div>
                                              </div>
                                              <button 
                                                onClick={() => reviewAttempt(att)} 
                                                className="px-4 py-2 bg-white/5 hover:bg-white text-gray-400 hover:text-black rounded-xl text-[9px] font-black uppercase tracking-widest transition-all"
                                              >
                                                مراجعة الحل
                                              </button>
                                          </div>
                                      );
                                  })}
                              </div>
                          </div>
                       )}
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

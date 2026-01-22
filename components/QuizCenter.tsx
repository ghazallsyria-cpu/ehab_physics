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
  AlertCircle,
  Play
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
      const category = quiz.category || 'اختبارات المنهج المعتمدة';
      if (!acc[category]) acc[category] = [];
      acc[category].push(quiz);
      return acc;
    }, {} as Record<string, Quiz[]>);
  }, [quizzes]);

  // إحصائيات سريعة للطالب
  const stats = useMemo(() => {
    const totalDone = new Set(userAttempts.map(a => a.quizId)).size;
    const scores = userAttempts.map(a => (a.score / (a.maxScore || 1)) * 100);
    const avgScore = scores.length > 0 
        ? Math.round(scores.reduce((a, b) => a + b, 0) / scores.length) 
        : 0;
    return { totalDone, avgScore, points: user.progress.points };
  }, [userAttempts, user.progress.points]);

  return (
    <div className="max-w-6xl mx-auto py-8 text-white font-['Tajawal'] animate-fadeIn" dir="rtl">
      
      {/* Header & Stats Section */}
      <header className="mb-16 flex flex-col lg:flex-row justify-between items-end gap-10">
        <div className="text-right">
            <h2 className="text-5xl font-black mb-4 tracking-tighter italic">مركز <span className="text-[#fbbf24] text-glow-gold">التقييم الرقمي</span></h2>
            <p className="text-gray-500 text-lg font-medium max-w-xl">قِس مستوى استيعابك للمفاهيم الفيزيائية من خلال بنك الاختبارات المطور والمدعوم بالتصحيح الذكي.</p>
        </div>
        
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4 w-full lg:w-auto">
            <div className="bg-white/5 border border-white/10 p-5 rounded-[30px] backdrop-blur-md">
                <p className="text-[9px] font-black text-gray-500 uppercase tracking-widest mb-1 text-center">معدل النجاح</p>
                <div className="flex items-center justify-center gap-2">
                    <span className="text-2xl font-black text-emerald-400 tabular-nums">{stats.avgScore}%</span>
                    <BarChart3 size={18} className="text-emerald-500 opacity-50" />
                </div>
            </div>
            <div className="bg-white/5 border border-white/10 p-5 rounded-[30px] backdrop-blur-md">
                <p className="text-[9px] font-black text-gray-500 uppercase tracking-widest mb-1 text-center">اختبارات منجزة</p>
                <div className="flex items-center justify-center gap-2">
                    <span className="text-2xl font-black text-blue-400 tabular-nums">{stats.totalDone}</span>
                    <CheckCircle2 size={18} className="text-blue-500 opacity-50" />
                </div>
            </div>
            <div className="hidden md:block bg-[#fbbf24]/5 border border-[#fbbf24]/20 p-5 rounded-[30px] backdrop-blur-md">
                <p className="text-[9px] font-black text-[#fbbf24] uppercase tracking-widest mb-1 text-center">نقاط الخبرة</p>
                <div className="flex items-center justify-center gap-2">
                    <span className="text-2xl font-black text-[#fbbf24] tabular-nums">{stats.points}</span>
                    <Trophy size={18} className="text-[#fbbf24] opacity-50" />
                </div>
            </div>
        </div>
      </header>

      {message && (
        <div className="mb-8 p-6 bg-red-500/10 border border-red-500/20 rounded-[30px] text-red-400 text-sm font-bold flex items-center gap-4 animate-slideUp">
            <AlertCircle size={24}/> {message}
        </div>
      )}
      
      {isLoading ? (
        <div className="py-40 text-center">
            <div className="w-16 h-16 border-4 border-[#fbbf24] border-t-transparent rounded-full animate-spin mx-auto mb-6 shadow-[0_0_20px_rgba(251,191,36,0.3)]"></div>
            <p className="text-gray-500 font-black uppercase tracking-[0.3em] text-xs">جاري استدعاء بنك الاختبارات...</p>
        </div>
      ) : quizzes.length === 0 ? (
          <div className="py-32 text-center border-2 border-dashed border-white/10 rounded-[60px] bg-white/[0.02]">
            <div className="w-20 h-20 bg-white/5 rounded-[40px] flex items-center justify-center mx-auto mb-6 text-gray-600">
                <HelpCircle size={48} />
            </div>
            <h3 className="text-2xl font-bold text-gray-400">لا توجد اختبارات متاحة لصفك حالياً</h3>
            <p className="text-sm text-gray-600 mt-2">سيقوم الفريق الأكاديمي بإضافة اختبارات جديدة قريباً.</p>
          </div>
      ) : (
        <div className="space-y-24">
          {(Object.entries(groupedQuizzes) as [string, Quiz[]][]).map(([category, quizList], catIdx) => (
            <div key={category} className="animate-slideUp" style={{ animationDelay: `${catIdx * 0.1}s` }}>
              <div className="flex items-center gap-6 mb-10">
                <div className="h-10 w-2 bg-[#fbbf24] rounded-full shadow-[0_0_20px_#fbbf24]"></div>
                <h3 className="text-3xl font-black text-white">{category}</h3>
                <div className="h-px flex-1 bg-white/5"></div>
                <span className="bg-white/5 px-4 py-2 rounded-2xl text-[10px] font-black text-gray-500 uppercase tracking-widest border border-white/10">متاح: {quizList.length}</span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                {quizList.map(quiz => {
                  const attempts = userAttempts
                    .filter(a => a.quizId === quiz.id)
                    .sort((a,b) => new Date(b.completedAt).getTime() - new Date(a.completedAt).getTime());
                  
                  return (
                    <div key={quiz.id} className="glass-panel group rounded-[60px] border-white/5 hover:border-[#fbbf24]/30 transition-all duration-700 flex flex-col relative overflow-hidden bg-gradient-to-br from-white/[0.03] to-transparent shadow-xl">
                       
                       {/* Top Section */}
                       <div className="p-10 md:p-12">
                          <div className="flex justify-between items-center mb-8">
                             <div className={`w-14 h-14 rounded-2xl flex items-center justify-center shadow-lg transition-transform group-hover:scale-110 ${quiz.isPremium ? 'bg-[#fbbf24] text-black shadow-yellow-500/20' : 'bg-white/5 text-gray-400 border border-white/10'}`}>
                                {quiz.isPremium ? <Zap size={24} fill="currentColor"/> : <Award size={24}/>}
                             </div>
                             {quiz.isPremium && <span className="bg-amber-500/10 text-amber-500 text-[9px] font-black px-4 py-1.5 rounded-full uppercase tracking-[0.2em] border border-amber-500/20">حزمة التفوق</span>}
                          </div>

                          <h3 className="text-3xl font-black text-white group-hover:text-[#fbbf24] transition-colors mb-4 leading-tight">{quiz.title}</h3>
                          <p className="text-gray-500 text-sm leading-relaxed mb-10 line-clamp-2 italic">"{quiz.description || 'يغطي هذا الاختبار مفاهيم الوحدة الدراسية بشكل شامل مع أسئلة استنتاجية مخصصة للمنهج الكويتي.'}"</p>
                          
                          <div className="grid grid-cols-3 gap-6 mb-12 bg-black/40 p-6 rounded-[35px] border border-white/5 shadow-inner">
                              <div className="text-center">
                                  <div className="flex justify-center mb-2 text-[#00d2ff] opacity-60"><HelpCircle size={16}/></div>
                                  <p className="text-xl font-black tabular-nums">{quiz.questionIds.length}</p>
                                  <p className="text-[9px] font-bold text-gray-600 uppercase tracking-widest">سؤال</p>
                              </div>
                              <div className="text-center border-x border-white/10">
                                  <div className="flex justify-center mb-2 text-emerald-400 opacity-60"><Clock size={16}/></div>
                                  <p className="text-xl font-black tabular-nums">{quiz.duration}</p>
                                  <p className="text-[9px] font-bold text-gray-600 uppercase tracking-widest">دقيقة</p>
                              </div>
                              <div className="text-center">
                                  <div className="flex justify-center mb-2 text-purple-400 opacity-60"><History size={16}/></div>
                                  <p className="text-xl font-black tabular-nums">{quiz.maxAttempts || '∞'}</p>
                                  <p className="text-[9px] font-bold text-gray-600 uppercase tracking-widest">محاولات</p>
                              </div>
                          </div>

                          <button 
                            onClick={() => startQuiz(quiz)} 
                            className="w-full py-6 bg-[#fbbf24] text-black rounded-[30px] font-black text-xs uppercase tracking-[0.3em] shadow-2xl hover:scale-[1.03] active:scale-95 transition-all flex items-center justify-center gap-4 group/btn"
                          >
                            <Play size={18} fill="currentColor" />
                            {attempts.length > 0 ? 'تحسين النتيجة' : 'بدء الاختبار الآن'}
                          </button>
                       </div>
                       
                       {/* History Section */}
                       {attempts.length > 0 && (
                          <div className="bg-black/40 border-t border-white/5 p-10 md:p-12 space-y-6">
                              <div className="flex items-center justify-between mb-2">
                                <h5 className="text-[10px] font-black text-gray-500 uppercase tracking-[0.4em] flex items-center gap-3">
                                    <History size={14}/> سجل المحاولات السابقة
                                </h5>
                                <span className="text-[9px] font-bold text-gray-600">{attempts.length} من {quiz.maxAttempts || '∞'}</span>
                              </div>
                              
                              <div className="space-y-4">
                                  {attempts.slice(0, 3).map((att, idx) => {
                                      const scorePercent = (att.score / (att.maxScore || 1)) * 100;
                                      const isSuccess = scorePercent >= 50;
                                      
                                      return (
                                          <div key={att.id} className="flex justify-between items-center bg-white/[0.02] p-5 rounded-[25px] border border-white/5 group/att hover:border-white/20 transition-all">
                                              <div className="flex items-center gap-6">
                                                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-xs font-black shadow-lg ${isSuccess ? 'bg-green-500/20 text-green-400 border border-green-500/30' : 'bg-red-500/20 text-red-400 border border-red-500/30'}`}>
                                                      #{attempts.length - idx}
                                                  </div>
                                                  <div>
                                                      <div className="flex items-center gap-3">
                                                        <span className="text-lg font-black text-white tabular-nums">{att.score} <span className="text-xs text-gray-600">/ {att.maxScore}</span></span>
                                                        {att.status === 'pending-review' && <span className="text-[7px] bg-yellow-500/10 text-yellow-500 px-2 py-0.5 rounded-full font-black uppercase tracking-widest border border-yellow-500/20">قيد المراجعة</span>}
                                                      </div>
                                                      <p className="text-[9px] text-gray-600 font-bold uppercase tracking-widest mt-1">{new Date(att.completedAt).toLocaleDateString('ar-KW', { day: 'numeric', month: 'short' })} • {Math.round(att.timeSpent / 60)} د</p>
                                                  </div>
                                              </div>
                                              <button 
                                                onClick={() => reviewAttempt(att)} 
                                                className="px-6 py-3 bg-white/5 hover:bg-white text-gray-400 hover:text-black rounded-xl text-[10px] font-black uppercase tracking-widest transition-all border border-white/10"
                                              >
                                                مراجعة الحل
                                              </button>
                                          </div>
                                      );
                                  })}
                                  {attempts.length > 3 && <p className="text-[9px] text-center text-gray-600 font-bold mt-4">+ محاولات أخرى مؤرشفة في سجل الأداء</p>}
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

      {/* Motivation Footer */}
      <footer className="mt-32 pt-16 border-t border-white/5 text-center pb-20">
         <div className="w-16 h-1 bg-gradient-to-r from-transparent via-[#fbbf24] to-transparent mx-auto mb-10 rounded-full opacity-30"></div>
         <p className="text-gray-500 font-bold text-sm leading-relaxed max-w-lg mx-auto">"الفيزياء ليست مجرد مادة، بل هي الطريقة التي نفهم بها لغة الكون. استمر في المحاولة، فكل خطأ هو خطوة أقرب للفهم العميق."</p>
      </footer>
    </div>
  );
};

export default QuizCenter;
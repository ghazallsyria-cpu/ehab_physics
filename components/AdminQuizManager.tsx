import React, { useState, useEffect, useMemo } from 'react';
import { Quiz, Question, StudentQuizAttempt } from '../types';
import { dbService } from '../services/db';
import { ClipboardList, PlusCircle, Edit, Trash2, X, Save, RefreshCw, BarChart, Check, Award, MessageSquare, ExternalLink, FileText, Image as ImageIcon } from 'lucide-react';
import QuestionEditor from './QuestionEditor';
import katex from 'katex';

const AdminQuizManager: React.FC = () => {
  const [quizzes, setQuizzes] = useState<Quiz[]>([]);
  const [allQuestions, setAllQuestions] = useState<Question[]>([]);
  const [editingQuiz, setEditingQuiz] = useState<Partial<Quiz> | null>(null);
  const [quizQuestions, setQuizQuestions] = useState<Question[]>([]);
  const [editingQuestion, setEditingQuestion] = useState<Partial<Question> | null>(null);
  const [filterGrade, setFilterGrade] = useState<'all' | '10' | '11' | '12' | 'uni'>('all');
  const [isLoading, setIsLoading] = useState(true);
  
  const [viewingAttemptsFor, setViewingAttemptsFor] = useState<Quiz | null>(null);
  const [quizAttempts, setQuizAttempts] = useState<StudentQuizAttempt[]>([]);
  const [reviewingAttempt, setReviewingAttempt] = useState<StudentQuizAttempt | null>(null);
  const [manualGrades, setManualGrades] = useState<Record<string, { awardedScore: number; feedback?: string }>>({});

  useEffect(() => {
    loadData();
  }, []);

  const filteredQuizzes = useMemo(() => {
    if (filterGrade === 'all') return quizzes;
    return quizzes.filter(q => q.grade === filterGrade);
  }, [quizzes, filterGrade]);

  const loadData = async () => {
    setIsLoading(true);
    const [quizData, questionData] = await Promise.all([
      dbService.getQuizzes(),
      dbService.getAllQuestions(),
    ]);
    setQuizzes(quizData);
    setAllQuestions(questionData);
    setIsLoading(false);
  };
  
  const handleViewAttempts = async (quiz: Quiz) => {
    setIsLoading(true);
    const attempts = await dbService.getAttemptsForQuiz(quiz.id);
    setQuizAttempts(attempts);
    setViewingAttemptsFor(quiz);
    setIsLoading(false);
  };
  
  const handleReviewAttempt = (attempt: StudentQuizAttempt) => {
    const questionsForQuiz = allQuestions.filter(q => viewingAttemptsFor?.questionIds.includes(q.id));
    setQuizQuestions(questionsForQuiz);
    setReviewingAttempt(attempt);
    setManualGrades(attempt.manualGrades || {});
  };

  const handleSaveReview = async () => {
    if (!reviewingAttempt || !viewingAttemptsFor) return;
    
    const autoScore = quizQuestions.filter(q => q.type === 'mcq' && reviewingAttempt.answers[q.id] === q.correctChoiceId).reduce((sum: number, q: Question) => sum + Number(q.score || 0), 0);
    const manualScore = Object.values(manualGrades || {}).reduce((sum: number, grade: { awardedScore: number; feedback?: string }) => sum + (grade.awardedScore || 0), 0);
    const finalScore = autoScore + manualScore;

    const updatedAttempt: StudentQuizAttempt = {
        ...reviewingAttempt,
        score: finalScore,
        manualGrades,
        status: 'manually-graded',
    };

    setIsLoading(true);
    await dbService.updateAttempt(updatedAttempt);
    
    await dbService.createNotification({
        userId: updatedAttempt.studentId,
        title: "تم تصحيح اختبارك!",
        message: `تم تصحيح اختبار "${viewingAttemptsFor.title}". نتيجتك النهائية هي ${finalScore}/${updatedAttempt.maxScore}.`,
        timestamp: new Date().toISOString(),
        isRead: false,
        type: 'success',
        category: 'academic'
    });
    
    setQuizAttempts(prev => prev.map(a => a.id === updatedAttempt.id ? updatedAttempt : a));
    setReviewingAttempt(null);
    setIsLoading(false);
  };

  const handleEditQuiz = (quiz: Quiz) => {
    setEditingQuiz(quiz);
    const questionsForQuiz = allQuestions.filter(q => quiz.questionIds.includes(q.id));
    setQuizQuestions(questionsForQuiz);
  };

  const handleCreateNewQuiz = () => {
    setEditingQuiz({
      id: `quiz_${Date.now()}`, title: '', description: '', grade: '12', subject: 'Physics',
      questionIds: [], duration: 30, totalScore: 0, isPremium: false,
    });
    setQuizQuestions([]);
  };

  const handleSaveQuiz = async () => {
    if (!editingQuiz || !editingQuiz.title) return;
    const finalQuiz: Quiz = {
        ...editingQuiz,
        questionIds: quizQuestions.map(q => q.id),
        totalScore: quizQuestions.reduce((sum: number, q: Question) => sum + Number(q.score || 0), 0)
    } as Quiz;
    
    await dbService.saveQuiz(finalQuiz);
    setEditingQuiz(null);
    setQuizQuestions([]);
    await loadData();
  };
  
  const handleDeleteQuiz = async (quizId: string) => {
    if (window.confirm('هل أنت متأكد من حذف هذا الاختبار؟')) {
      await dbService.deleteQuiz(quizId);
      await loadData();
    }
  };

  const handleSaveQuestion = async (question: Question) => {
    const isNew = !question.id || !allQuestions.some(q => q.id === question.id);
    let savedQuestion = question;
    if (isNew) {
      const newId = await dbService.saveQuestion(question);
      savedQuestion = {...question, id: newId};
    } else {
      await dbService.updateQuestion(question.id, question);
    }
    await loadData();
    
    setQuizQuestions(prev => {
        if(isNew) return [...prev, savedQuestion];
        return prev.map(q => q.id === savedQuestion.id ? savedQuestion : q);
    });

    setEditingQuestion(null);
  };
  
  const addQuestionToQuiz = (question: Question) => { if (!quizQuestions.some(q => q.id === question.id)) setQuizQuestions(prev => [...prev, question]); };
  const removeQuestionFromQuiz = (questionId: string) => setQuizQuestions(prev => prev.filter(q => q.id !== questionId));
  const renderMathText = (text: string) => { try { if (!text) return <div/>; const html = text.replace(/\$(.*?)\$/g, (match, math) => katex.renderToString(math, { throwOnError: false })); return <div dangerouslySetInnerHTML={{ __html: html }} />; } catch { return <div>{text}</div>; }};

  const renderAnswerContent = (answer: any) => {
    if (!answer) return <span className="text-gray-600 italic">لم تتم الإجابة</span>;
    
    // التحقق مما إذا كان الرابط هو ملف مرفوع لـ Supabase
    if (typeof answer === 'string' && (answer.startsWith('http') || answer.includes('supabase.co'))) {
        const isImage = answer.match(/\.(jpeg|jpg|gif|png)$/i);
        return (
            <div className="mt-4 flex flex-col gap-4">
                <div className="flex items-center gap-3 bg-blue-500/10 p-4 rounded-2xl border border-blue-500/20">
                    {isImage ? <ImageIcon className="text-blue-400" /> : <FileText className="text-blue-400" />}
                    <div className="flex-1">
                        <p className="text-xs font-bold text-blue-400 uppercase tracking-widest">ملف مرفق من الطالب</p>
                        <p className="text-[10px] text-gray-500 truncate max-w-[200px]">{answer}</p>
                    </div>
                    <a href={answer} target="_blank" rel="noreferrer" className="bg-blue-500 text-white px-4 py-2 rounded-xl text-[10px] font-black uppercase flex items-center gap-2 hover:bg-blue-600 transition-all shadow-lg">
                        <ExternalLink size={12} /> فتح المرفق
                    </a>
                </div>
                {isImage && (
                    <div className="rounded-2xl overflow-hidden border border-white/5 max-w-xs shadow-xl">
                        <img src={answer} alt="Student answer" className="w-full h-auto opacity-80 hover:opacity-100 transition-opacity cursor-zoom-in" onClick={() => window.open(answer, '_blank')} />
                    </div>
                )}
            </div>
        );
    }
    
    return <p className="text-sm text-cyan-300 mt-1 italic leading-relaxed">"{answer}"</p>;
  };

  if (reviewingAttempt && viewingAttemptsFor) {
    return (
        <div className="animate-fadeIn font-['Tajawal'] text-right pb-20" dir="rtl">
            <button onClick={() => setReviewingAttempt(null)} className="flex items-center gap-2 px-6 py-3 mb-6 bg-white/5 text-white rounded-lg text-xs font-bold border border-white/10">← العودة لقائمة المحاولات</button>
            <div className="glass-panel p-8 md:p-12 rounded-[50px] border-white/5">
                <div className="flex justify-between items-center mb-10 border-b border-white/5 pb-6">
                    <div>
                        <h3 className="text-2xl font-black">مراجعة وتصحيح: <span className="text-[#fbbf24]">{reviewingAttempt.studentName}</span></h3>
                        <p className="text-gray-500 text-xs mt-1">اختبار: {viewingAttemptsFor.title} • محاولة رقم {reviewingAttempt.attemptNumber}</p>
                    </div>
                    <div className="text-left">
                        <p className="text-[10px] font-black text-gray-600 uppercase tracking-widest">وقت التسليم</p>
                        <p className="text-sm font-bold text-white tabular-nums">{new Date(reviewingAttempt.completedAt).toLocaleString('ar-KW')}</p>
                    </div>
                </div>

                <div className="space-y-8">
                    {quizQuestions.map((q, idx) => {
                      const userAnswer = reviewingAttempt.answers[q.id];
                      const gradeInfo = manualGrades[q.id] || { awardedScore: 0, feedback: '' };
                      return (
                        <div key={q.id} className="p-8 bg-black/40 rounded-[40px] border border-white/5 relative overflow-hidden group">
                           <div className="flex justify-between items-start mb-6">
                                <div className="flex items-center gap-4">
                                    <span className="w-10 h-10 rounded-2xl bg-white/5 flex items-center justify-center font-black text-[#fbbf24]">{idx+1}</span>
                                    <h4 className="text-lg font-bold text-white">{renderMathText(q.text)}</h4>
                                </div>
                                <span className="px-4 py-1 bg-white/5 rounded-full text-[9px] font-black text-gray-500 uppercase tracking-widest">{q.type}</span>
                           </div>

                           <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mt-6">
                                <div className="space-y-4">
                                    <label className="text-[10px] font-black text-gray-600 uppercase tracking-widest block">إجابة الطالب:</label>
                                    <div className="bg-white/[0.02] p-6 rounded-[30px] border border-white/5">
                                        {renderAnswerContent(userAnswer)}
                                    </div>
                                    <div className="p-4 bg-green-500/5 rounded-2xl border border-green-500/10">
                                        <label className="text-[8px] font-black text-green-500 uppercase block mb-1">الإجابة النموذجية:</label>
                                        <p className="text-xs text-gray-400">{q.modelAnswer || q.correctChoiceId}</p>
                                    </div>
                                </div>

                                <div className="space-y-6">
                                    <label className="text-[10px] font-black text-gray-600 uppercase tracking-widest block">التقييم اليدوي:</label>
                                    <div className="flex flex-col gap-4">
                                        <div className="relative">
                                            <input 
                                                type="number" 
                                                max={q.score} 
                                                value={gradeInfo.awardedScore} 
                                                onChange={e => setManualGrades({...manualGrades, [q.id]: {...gradeInfo, awardedScore: Math.min(q.score, Number(e.target.value)) }})} 
                                                className="w-full bg-black/60 border border-white/10 rounded-2xl px-6 py-4 text-white outline-none focus:border-[#fbbf24] font-black text-xl tabular-nums" 
                                                placeholder={`الدرجة المستحقة`} 
                                            />
                                            <span className="absolute left-6 top-1/2 -translate-y-1/2 text-gray-500 font-bold">/ {q.score}</span>
                                        </div>
                                        <textarea 
                                            value={gradeInfo.feedback} 
                                            onChange={e => setManualGrades({...manualGrades, [q.id]: {...gradeInfo, feedback: e.target.value }})} 
                                            className="w-full bg-black/60 border border-white/10 rounded-2xl p-4 text-sm text-white outline-none focus:border-[#fbbf24] h-24" 
                                            placeholder="أضف ملاحظات تصحيحية للطالب هنا..." 
                                        />
                                    </div>
                                </div>
                           </div>
                        </div>
                      )
                    })}
                </div>

                <div className="mt-12 p-8 bg-[#fbbf24]/5 border border-[#fbbf24]/20 rounded-[40px] flex flex-col md:flex-row justify-between items-center gap-8">
                    <div className="text-center md:text-right">
                        <h4 className="text-lg font-black text-[#fbbf24]">اعتماد الدرجة النهائية</h4>
                        <p className="text-xs text-gray-500 mt-1">سيتم إرسال إشعار فوري للطالب بالنتيجة والملاحظات.</p>
                    </div>
                    <button onClick={handleSaveReview} disabled={isLoading} className="w-full md:w-auto bg-[#fbbf24] text-black px-12 py-5 rounded-2xl font-black text-sm uppercase tracking-widest shadow-2xl hover:scale-105 active:scale-95 transition-all flex items-center justify-center gap-3">
                        {isLoading ? <RefreshCw className="animate-spin" /> : <Save size={18}/>}
                        حفظ المراجعة والاعتماد
                    </button>
                </div>
            </div>
        </div>
    );
  }

  if (viewingAttemptsFor) {
    return (
        <div className="animate-fadeIn font-['Tajawal'] text-right" dir="rtl">
            <div className="flex justify-between items-center mb-8">
                <div>
                    <h2 className="text-3xl font-black text-white">سجل المحاولات: <span className="text-[#fbbf24]">{viewingAttemptsFor.title}</span></h2>
                    <p className="text-gray-500">{quizAttempts.length} محاولة مسجلة</p>
                </div>
                <button onClick={() => setViewingAttemptsFor(null)} className="flex items-center gap-2 px-6 py-3 bg-white/5 text-white rounded-lg text-xs font-bold border border-white/10"><X size={14}/> عودة</button>
            </div>
            <div className="glass-panel p-6 rounded-3xl border-white/5">
                <table className="w-full text-sm">
                    <thead className="border-b border-white/10 text-xs font-bold text-gray-500 uppercase"><tr className="text-right"><th className="p-4">اسم الطالب</th><th className="p-4 text-center">النتيجة</th><th className="p-4 text-center">الحالة</th><th className="p-4 text-center">الإجراء</th></tr></thead>
                    <tbody>
                        {quizAttempts.map(att => (
                            <tr key={att.id} className="border-b border-white/5 hover:bg-white/[0.02] transition-colors">
                                <td className="p-4 font-bold">{att.studentName}</td>
                                <td className="p-4 text-center font-mono">{att.score} / {att.maxScore}</td>
                                <td className="p-4 text-center">
                                    <span className={`text-[8px] font-bold px-2 py-1 rounded ${att.status === 'pending-review' ? 'bg-yellow-500/10 text-yellow-400 border border-yellow-500/20' : att.status === 'manually-graded' ? 'bg-green-500/10 text-green-400 border border-green-500/20' : 'bg-gray-500/10 text-gray-400'}`}>{att.status}</span>
                                </td>
                                <td className="p-4 text-center">
                                    <button onClick={() => handleReviewAttempt(att)} className="text-xs font-bold bg-[#fbbf24] text-black px-4 py-2 rounded-xl hover:scale-105 transition-all">مراجعة وتصحيح</button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
                 {quizAttempts.length === 0 && <div className="text-center p-10 text-gray-500">لا توجد محاولات لهذا الاختبار بعد.</div>}
            </div>
        </div>
    );
  }
  
  if (editingQuiz) {
    return (
      <div className="animate-fadeIn font-['Tajawal'] text-right" dir="rtl">
        {editingQuestion && ( <QuestionEditor question={editingQuestion} onSave={handleSaveQuestion} onCancel={() => setEditingQuestion(null)} /> )}
        <div className="flex justify-between items-center mb-8"> <h2 className="text-3xl font-black text-white">{editingQuiz.id?.startsWith('quiz_') ? 'إنشاء اختبار جديد' : 'تعديل الاختبار'}</h2><div className="flex gap-4"><button onClick={() => setEditingQuiz(null)} className="flex items-center gap-2 px-6 py-3 bg-white/5 text-white rounded-lg text-xs font-bold border border-white/10"><X size={14}/> إلغاء</button><button onClick={handleSaveQuiz} className="flex items-center gap-2 px-6 py-3 bg-green-500 text-black rounded-lg text-xs font-bold border border-green-500/20"><Save size={14}/> حفظ الاختبار</button></div></div>
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
            <div className="lg:col-span-4 space-y-6"><div className="glass-panel p-6 rounded-3xl border-white/5 space-y-4"><input type="text" placeholder="عنوان الاختبار" value={editingQuiz.title || ''} onChange={e => setEditingQuiz({...editingQuiz, title: e.target.value})} className="w-full bg-black/40 border border-white/10 rounded-lg p-3 text-white outline-none focus:border-[#fbbf24]"/><input type="text" placeholder="وصف موجز" value={editingQuiz.description || ''} onChange={e => setEditingQuiz({...editingQuiz, description: e.target.value})} className="w-full bg-black/40 border border-white/10 rounded-lg p-3 text-white outline-none focus:border-[#fbbf24]"/><input type="text" placeholder="فئة الاختبار" value={editingQuiz.category || ''} onChange={e => setEditingQuiz({...editingQuiz, category: e.target.value})} className="w-full bg-black/40 border border-white/10 rounded-lg p-3 text-white outline-none focus:border-[#fbbf24]"/><div className="grid grid-cols-2 gap-4"><select value={editingQuiz.grade} onChange={e => setEditingQuiz({...editingQuiz, grade: e.target.value as any})} className="w-full bg-black/40 border border-white/10 rounded-lg p-3 text-white outline-none focus:border-[#fbbf24]"><option value="10">الصف 10</option><option value="11">الصف 11</option><option value="12">الصف 12</option><option value="uni">جامعي</option></select><select value={editingQuiz.subject} onChange={e => setEditingQuiz({...editingQuiz, subject: e.target.value as any})} className="w-full bg-black/40 border border-white/10 rounded-lg p-3 text-white outline-none focus:border-[#fbbf24]"><option value="Physics">الفيزياء</option><option value="Chemistry">الكيمياء</option></select></div><div className="grid grid-cols-2 gap-4"><input type="number" placeholder="المدة (دقائق)" value={editingQuiz.duration || 0} onChange={e => setEditingQuiz({...editingQuiz, duration: parseInt(e.target.value)})} className="w-full bg-black/40 border border-white/10 rounded-lg p-3 text-white outline-none focus:border-[#fbbf24]"/><input type="number" placeholder="المحاولات" value={editingQuiz.maxAttempts || 1} onChange={e => setEditingQuiz({...editingQuiz, maxAttempts: parseInt(e.target.value)})} className="w-full bg-black/40 border border-white/10 rounded-lg p-3 text-white outline-none focus:border-[#fbbf24]"/></div><div className="flex items-center justify-between p-4 bg-black/40 rounded-2xl border border-white/10"><label className="font-bold text-[#fbbf24]">Premium؟</label><button onClick={() => setEditingQuiz({...editingQuiz, isPremium: !editingQuiz.isPremium})} className={`w-16 h-8 rounded-full p-1 transition-colors ${editingQuiz.isPremium ? 'bg-green-500' : 'bg-gray-700'}`}><div className={`w-6 h-6 bg-white rounded-full shadow-md transform transition-transform ${editingQuiz.isPremium ? 'translate-x-8' : 'translate-x-0'}`}/></button></div></div><div className="glass-panel p-6 rounded-3xl border-white/5"><h4 className="font-bold mb-4">إضافة سؤال من البنك</h4><div className="space-y-2 max-h-64 overflow-y-auto no-scrollbar">{allQuestions.filter(q => q.grade === editingQuiz.grade).map(q => (<div key={q.id} onClick={() => addQuestionToQuiz(q)} className="p-2 bg-black/40 rounded-lg text-xs cursor-pointer hover:bg-black/80">{q.text.substring(0, 50)}...</div>))}</div></div></div>
            <div className="lg:col-span-8 glass-panel p-6 rounded-3xl border-white/5 space-y-4"><div className="flex justify-between items-center"><h3 className="font-bold">أسئلة الاختبار ({quizQuestions.length})</h3><button onClick={() => setEditingQuestion({ score: 5, grade: editingQuiz.grade as any, subject: editingQuiz.subject, unit: '', type: 'mcq', text: '' })} className="text-xs font-bold text-green-400 flex items-center gap-1"><PlusCircle size={14}/> سؤال جديد</button></div><div className="space-y-3 max-h-[80vh] overflow-y-auto no-scrollbar">{quizQuestions.map(q => (<div key={q.id} className="p-4 bg-black/40 rounded-xl border border-white/5 flex justify-between items-center"><p className="flex-1 text-sm truncate">{q.text}</p><div className="flex items-center gap-2"><span className="text-[10px] bg-[#fbbf24]/20 text-[#fbbf24] px-2 py-1 rounded">{q.score} pts</span><button onClick={() => setEditingQuestion(q)} className="p-1"><Edit size={12}/></button><button onClick={() => removeQuestionFromQuiz(q.id)} className="p-1 text-red-500"><Trash2 size={12}/></button></div></div>))}</div></div>
        </div>
      </div>
    );
  }

  return (
    <div className="animate-fadeIn font-['Tajawal'] text-right" dir="rtl">
      <header className="flex flex-col md:flex-row justify-between items-center gap-6 mb-8"><h2 className="text-3xl font-black text-white">إدارة <span className="text-[#fbbf24]">الاختبارات</span></h2><div className="flex gap-4"><button onClick={loadData} className="p-4 bg-white/5 rounded-2xl text-white hover:bg-white/10 transition-all border border-white/10"><RefreshCw size={20} className={isLoading ? 'animate-spin' : ''}/></button><button onClick={handleCreateNewQuiz} className="bg-[#fbbf24] text-black px-6 py-4 rounded-2xl font-black text-xs uppercase tracking-widest shadow-lg hover:scale-105 transition-all flex items-center gap-2"><PlusCircle size={18} /> إنشاء اختبار جديد</button></div></header>
      <div className="bg-black/40 p-2 rounded-2xl flex gap-2 border border-white/5 max-w-md mb-8">{(['all', '12', '11', '10', 'uni'] as const).map(g => (<button key={g} onClick={() => setFilterGrade(g)} className={`flex-1 py-2 rounded-lg text-xs font-bold ${filterGrade === g ? 'bg-white text-black' : 'text-gray-400'}`}>{g === 'all' ? 'الكل' : (g === 'uni' ? 'جامعي' : `صف ${g}`)}</button>))}</div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredQuizzes.map(quiz => (
          <div key={quiz.id} className="glass-panel p-6 rounded-3xl border-white/5 flex flex-col">
            <h3 className="font-bold text-lg mb-2 text-white">{quiz.title}</h3>
            <div className="flex gap-2 mb-4"><span className="text-[9px] bg-white/5 px-2 py-1 rounded">{quiz.grade}</span><span className="text-[9px] bg-[#fbbf24]/20 text-[#fbbf24] px-2 py-1 rounded">{quiz.subject}</span>{quiz.isPremium && <span className="text-[9px] bg-yellow-400/20 text-yellow-400 font-black px-2 py-1 rounded">PREMIUM</span>}</div>
            <p className="text-xs text-gray-400 flex-1 mb-4">{quiz.questionIds.length} سؤال • {quiz.duration} دقيقة</p>
            <div className="flex gap-2 mt-auto pt-4 border-t border-white/5">
                <button onClick={() => handleViewAttempts(quiz)} className="flex-1 text-xs font-bold py-2 bg-white/5 rounded-lg hover:bg-white/10 flex items-center justify-center gap-1"><BarChart size={14}/> عرض المحاولات</button>
                <button onClick={() => handleEditQuiz(quiz)} className="flex-1 text-xs font-bold py-2 bg-white/10 rounded-lg hover:bg-white/20">تعديل</button>
                <button onClick={() => handleDeleteQuiz(quiz.id)} className="p-2 text-red-500 bg-red-500/10 rounded-lg hover:bg-red-500/20"><Trash2 size={14}/></button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default AdminQuizManager;
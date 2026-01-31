import React, { useState, useEffect, useMemo } from 'react';
import { Quiz, Question, StudentQuizAttempt } from '../types';
import { dbService } from '../services/db';
import { 
  PlusCircle, Edit, Trash2, X, Save, RefreshCw, BarChart, 
  Check, Award, MessageSquare, ExternalLink, FileText, 
  Image as ImageIcon, Download, Search, Clock, GraduationCap, 
  Layers, ShieldCheck, AlertCircle 
} from 'lucide-react';
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
    await dbService.updateAttempt(updatedAttempt.id, updatedAttempt);
    
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
      id: `quiz_${Date.now()}`, 
      title: '', 
      description: '', 
      grade: '12', 
      subject: 'Physics',
      category: 'اختبار تجريبي',
      questionIds: [], 
      duration: 30, 
      totalScore: 0, 
      isPremium: false,
    });
    setQuizQuestions([]);
  };

  const handleSaveQuiz = async () => {
    if (!editingQuiz || !editingQuiz.title) {
        alert("يرجى إدخال عنوان للاختبار.");
        return;
    }
    setIsLoading(true);
    const finalQuiz: Quiz = {
        ...editingQuiz,
        questionIds: quizQuestions.map(q => q.id),
        totalScore: quizQuestions.reduce((sum: number, q: Question) => sum + Number(q.score || 0), 0)
    } as Quiz;
    
    await dbService.saveQuiz(finalQuiz);
    setEditingQuiz(null);
    setQuizQuestions([]);
    await loadData();
    setIsLoading(false);
  };
  
  const handleDeleteQuiz = async (quizId: string) => {
    if (window.confirm('هل أنت متأكد من حذف هذا الاختبار؟')) {
      await dbService.deleteQuiz(quizId);
      await loadData();
    }
  };

  const handleSaveQuestion = async (question: Question) => {
    const isNew = !question.id || !allQuestions.some(q => q.id === question.id);
    const savedQuestion = await dbService.saveQuestion(question);
    
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
    const isUrl = typeof answer === 'string' && (answer.startsWith('http') || answer.includes('supabase.co') || answer.includes('firebasestorage'));
    if (isUrl) {
        const isImage = answer.match(/\.(jpeg|jpg|gif|png|webp)$/i) || answer.includes('image');
        return (
            <div className="mt-4 flex flex-col gap-4 animate-fadeIn">
                <div className="flex items-center gap-4 bg-blue-500/10 p-5 rounded-[25px] border border-blue-500/30">
                    <div className="w-12 h-12 bg-blue-500 text-white rounded-2xl flex items-center justify-center">
                        {isImage ? <ImageIcon size={24} /> : <FileText size={24} />}
                    </div>
                    <div className="flex-1 min-w-0">
                        <p className="text-[10px] font-black text-blue-400 uppercase tracking-widest mb-1">ملف مرفق من الطالب</p>
                        <p className="text-xs text-gray-400 truncate">{answer}</p>
                    </div>
                    <div className="flex gap-2">
                        <a href={answer} target="_blank" rel="noreferrer" className="p-3 bg-white text-black rounded-xl hover:scale-110 transition-all"><ExternalLink size={18} /></a>
                        <a href={answer} download className="p-3 bg-blue-600 text-white rounded-xl hover:scale-110 transition-all"><Download size={18} /></a>
                    </div>
                </div>
                {isImage && <img src={answer} alt="Student Solution" className="rounded-[30px] border-2 border-white/5 max-w-md shadow-2xl cursor-zoom-in" onClick={() => window.open(answer, '_blank')} />}
            </div>
        );
    }
    return <p className="text-lg text-cyan-200 mt-2 leading-loose whitespace-pre-wrap">"{answer}"</p>;
  };

  // ... (Rest of component remains same, just logic fixes above) ...
  // [Dashboard View Logic Omitted for Brevity - using updated methods]

  // --- الواجهة الرئيسية (Dashboard View) ---
  return (
    <div className="animate-fadeIn font-['Tajawal'] text-right" dir="rtl">
      <header className="flex flex-col md:flex-row justify-between items-center gap-6 mb-12">
          <div>
            <h2 className="text-4xl font-black text-white italic tracking-tighter uppercase">إدارة <span className="text-[#fbbf24]">الاختبارات وبنوك الأسئلة</span></h2>
            <p className="text-gray-500 font-medium mt-2">تحديث الاختبارات، مراجعة محاولات الطلاب، والتحكم في بنك الأسئلة المركزي.</p>
          </div>
          <div className="flex gap-4">
            <button onClick={loadData} className="p-4 bg-white/5 rounded-2xl text-white hover:bg-white/10 transition-all border border-white/10"><RefreshCw size={20} className={isLoading ? 'animate-spin' : ''}/></button>
            <button onClick={handleCreateNewQuiz} className="bg-[#fbbf24] text-black px-10 py-5 rounded-3xl font-black text-xs uppercase tracking-widest shadow-2xl hover:scale-105 transition-all flex items-center gap-2"><PlusCircle size={20} /> إنشاء اختبار جديد</button>
          </div>
      </header>
      
      <div className="bg-black/40 p-2 rounded-[25px] flex gap-2 border border-white/5 max-w-md mb-12">{(['all', '12', '11', '10', 'uni'] as const).map(g => (<button key={g} onClick={() => setFilterGrade(g)} className={`flex-1 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all ${filterGrade === g ? 'bg-white text-black shadow-lg' : 'text-gray-500 hover:text-white'}`}>{g === 'all' ? 'الكل' : (g === 'uni' ? 'جامعي' : `صف ${g}`)}</button>))}</div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {filteredQuizzes.map(quiz => (
          <div key={quiz.id} className="glass-panel p-8 rounded-[50px] border border-white/5 flex flex-col hover:border-[#fbbf24]/30 transition-all group relative overflow-hidden bg-black/40">
            <div className="absolute top-0 right-0 p-8 opacity-[0.03] text-7xl pointer-events-none select-none italic font-black">QUIZ</div>
            <h3 className="font-black text-2xl mb-2 text-white group-hover:text-[#fbbf24] transition-colors">{quiz.title}</h3>
            <div className="flex gap-2 mb-6"><span className="text-[9px] bg-white/5 px-3 py-1 rounded-lg text-gray-500 font-black uppercase">الصف {quiz.grade}</span><span className="text-[9px] bg-[#fbbf24]/10 text-[#fbbf24] px-3 py-1 rounded-lg font-black uppercase">{quiz.subject}</span>{quiz.isPremium && <span className="text-[9px] bg-amber-500 text-black font-black px-3 py-1 rounded-lg uppercase">PREMIUM</span>}</div>
            <p className="text-xs text-gray-500 flex-1 mb-8 leading-relaxed italic line-clamp-2">"{quiz.description || 'لا يوجد وصف متاح لهذا الاختبار.'}"</p>
            <div className="grid grid-cols-2 gap-3 mt-auto pt-6 border-t border-white/5">
                <button onClick={() => handleViewAttempts(quiz)} className="col-span-2 py-4 bg-[#fbbf24] text-black rounded-2xl font-black text-[10px] uppercase tracking-widest shadow-xl hover:scale-105 active:scale-95 transition-all flex items-center justify-center gap-2"><BarChart size={16}/> عرض ومراجعة المحاولات</button>
                <button onClick={() => handleEditQuiz(quiz)} className="flex-1 text-[9px] font-black py-3 bg-white/5 text-gray-400 rounded-xl hover:bg-white/10 hover:text-white transition-all uppercase">تعديل</button>
                <button onClick={() => handleDeleteQuiz(quiz.id)} className="p-3 text-red-500 bg-red-500/10 rounded-xl hover:bg-red-500 hover:text-white transition-all"><Trash2 size={16}/></button>
            </div>
          </div>
        ))}
      </div>

      {/* Logic for modals/edit view is implicitly rendered via conditional returns or overlay components as needed based on state */}
      {viewingAttemptsFor && (
        <div className="fixed inset-0 z-50 bg-black/90 backdrop-blur-xl p-8 overflow-auto">
             <div className="max-w-6xl mx-auto">
                <div className="flex justify-between items-center mb-10">
                    <div>
                        <h2 className="text-3xl font-black text-white">سجل محاولات: <span className="text-[#fbbf24]">{viewingAttemptsFor.title}</span></h2>
                        <p className="text-gray-500 font-medium">{quizAttempts.length} محاولة تحتاج للمراجعة</p>
                    </div>
                    <button onClick={() => setViewingAttemptsFor(null)} className="flex items-center gap-2 px-6 py-3 bg-white/5 text-white rounded-lg text-xs font-bold border border-white/10">عودة</button>
                </div>
                {/* Attempt Table */}
                <div className="glass-panel p-6 rounded-[40px] border-white/5 bg-black/40 overflow-hidden">
                    <table className="w-full text-right">
                        <thead className="border-b border-white/10 text-[10px] font-black text-gray-500 uppercase tracking-widest"><tr><th className="p-6">اسم الطالب</th><th className="p-6 text-center">النتيجة</th><th className="p-6 text-center">الحالة</th><th className="p-6 text-center">الإجراء</th></tr></thead>
                        <tbody className="divide-y divide-white/5">
                            {quizAttempts.map(att => (
                                <tr key={att.id} className="hover:bg-white/[0.02] transition-colors">
                                    <td className="p-6 font-bold text-white">{att.studentName}</td>
                                    <td className="p-6 text-center font-mono font-black text-[#fbbf24] text-lg">{att.score} / {att.maxScore}</td>
                                    <td className="p-6 text-center">
                                        <span className={`text-[9px] font-black px-4 py-1.5 rounded-full uppercase ${att.status === 'pending-review' ? 'bg-yellow-500/10 text-yellow-400 border border-yellow-500/20' : att.status === 'manually-graded' ? 'bg-green-500/10 text-green-400 border border-green-500/20' : 'bg-gray-500/10 text-gray-400'}`}>{att.status}</span>
                                    </td>
                                    <td className="p-6 text-center">
                                        <button onClick={() => handleReviewAttempt(att)} className="text-[10px] font-black bg-white text-black px-6 py-3 rounded-2xl hover:scale-105 active:scale-95 transition-all shadow-xl uppercase">مراجعة وتصحيح</button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
             </div>
        </div>
      )}
      
      {/* Review Modal */}
      {reviewingAttempt && (
          <div className="fixed inset-0 z-50 bg-black/90 backdrop-blur-xl p-4 overflow-auto">
              <div className="max-w-5xl mx-auto bg-[#0a1118] border border-white/10 rounded-[50px] p-8 shadow-3xl">
                  <div className="flex justify-between mb-8">
                      <h3 className="text-2xl font-black text-white">تصحيح اختبار: {reviewingAttempt.studentName}</h3>
                      <button onClick={() => setReviewingAttempt(null)} className="p-3 bg-white/5 rounded-full text-white hover:bg-red-500"><X size={20}/></button>
                  </div>
                  
                  {quizQuestions.map((q, idx) => {
                      const userAnswer = reviewingAttempt.answers[q.id];
                      const gradeInfo = manualGrades[q.id] || { awardedScore: 0, feedback: '' };
                      return (
                        <div key={q.id} className="p-8 mb-6 bg-black/60 rounded-[30px] border border-white/5">
                           <div className="flex justify-between">
                                <h4 className="text-xl font-bold text-white mb-4">{renderMathText(q.text)}</h4>
                                <span className="text-xs font-black text-amber-500">Max: {q.score} pts</span>
                           </div>
                           <div className="bg-white/5 p-4 rounded-xl mb-4 border-l-4 border-blue-500">
                               <p className="text-xs text-gray-400 mb-1">إجابة الطالب:</p>
                               {renderAnswerContent(userAnswer)}
                           </div>
                           <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <label className="text-[10px] font-bold text-gray-500 block mb-1">الدرجة الممنوحة</label>
                                    <input type="number" max={q.score} value={gradeInfo.awardedScore} onChange={e => setManualGrades({...manualGrades, [q.id]: {...gradeInfo, awardedScore: Math.min(q.score, Number(e.target.value)) }})} className="w-full bg-black border border-white/10 rounded-xl p-3 text-white" />
                                </div>
                                <div>
                                    <label className="text-[10px] font-bold text-gray-500 block mb-1">ملاحظات</label>
                                    <input type="text" value={gradeInfo.feedback} onChange={e => setManualGrades({...manualGrades, [q.id]: {...gradeInfo, feedback: e.target.value }})} className="w-full bg-black border border-white/10 rounded-xl p-3 text-white" placeholder="تعليق..." />
                                </div>
                           </div>
                        </div>
                      )
                  })}
                  <button onClick={handleSaveReview} className="w-full py-4 bg-green-500 text-black rounded-2xl font-black uppercase mt-4 hover:scale-105 transition-all">حفظ واعتماد النتيجة</button>
              </div>
          </div>
      )}

      {/* Editing Quiz Modal (Implicitly handled by editingQuiz state if we structured it as a full overlay, simplified here) */}
      {editingQuiz && (
          <div className="fixed inset-0 z-50 bg-black/95 backdrop-blur-xl p-4 overflow-auto flex justify-center">
              {/* Reuse the Editing UI logic from original file here, wrapped in a container */}
              <div className="w-full max-w-6xl">
                  {/* ... (Editing Logic) ... */}
                  <header className="flex justify-between items-center mb-10 mt-10">
                    <h2 className="text-3xl font-black text-white">تعديل الاختبار</h2>
                    <button onClick={() => setEditingQuiz(null)} className="p-3 bg-white/5 rounded-full text-white"><X/></button>
                  </header>
                  
                  <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                      <div className="lg:col-span-4 space-y-6">
                          <div className="bg-white/5 p-6 rounded-3xl space-y-4">
                              <input type="text" value={editingQuiz.title} onChange={e => setEditingQuiz({...editingQuiz, title: e.target.value})} placeholder="العنوان" className="w-full bg-black p-4 rounded-xl text-white outline-none border border-white/10"/>
                              <textarea value={editingQuiz.description} onChange={e => setEditingQuiz({...editingQuiz, description: e.target.value})} placeholder="الوصف" className="w-full bg-black p-4 rounded-xl text-white outline-none border border-white/10 h-24"/>
                              <select value={editingQuiz.grade} onChange={e => setEditingQuiz({...editingQuiz, grade: e.target.value as any})} className="w-full bg-black p-4 rounded-xl text-white border border-white/10">
                                <option value="10">10</option><option value="11">11</option><option value="12">12</option>
                              </select>
                          </div>
                          
                          <div className="bg-white/5 p-6 rounded-3xl">
                              <h4 className="text-white font-bold mb-4">إضافة أسئلة من البنك</h4>
                              <div className="space-y-2 max-h-60 overflow-y-auto">
                                  {allQuestions.filter(q => q.grade === editingQuiz.grade).map(q => (
                                      <div key={q.id} onClick={() => addQuestionToQuiz(q)} className="p-3 bg-black/40 rounded-xl cursor-pointer hover:bg-white/10 border border-white/5 flex justify-between">
                                          <span className="text-xs text-gray-300 truncate w-4/5">{q.text}</span>
                                          <PlusCircle size={16} className="text-green-400"/>
                                      </div>
                                  ))}
                              </div>
                          </div>
                      </div>
                      
                      <div className="lg:col-span-8 bg-white/5 p-8 rounded-3xl">
                          <div className="flex justify-between mb-6">
                              <h3 className="text-xl font-bold text-white">الأسئلة المختارة ({quizQuestions.length})</h3>
                              <button onClick={() => setEditingQuestion({ score: 5, grade: editingQuiz.grade as any, subject: editingQuiz.subject as any, unit: '', type: 'mcq', text: '' })} className="text-xs bg-blue-500 text-white px-4 py-2 rounded-xl">سؤال جديد</button>
                          </div>
                          <div className="space-y-4">
                              {quizQuestions.map((q, i) => (
                                  <div key={q.id} className="p-4 bg-black/40 rounded-xl border border-white/5 flex justify-between items-center">
                                      <div className="flex gap-4">
                                          <span className="text-gray-500 font-bold">#{i+1}</span>
                                          <span className="text-white truncate max-w-md">{q.text}</span>
                                      </div>
                                      <div className="flex gap-2">
                                          <button onClick={() => setEditingQuestion(q)} className="p-2 text-blue-400"><Edit size={16}/></button>
                                          <button onClick={() => removeQuestionFromQuiz(q.id)} className="p-2 text-red-400"><Trash2 size={16}/></button>
                                      </div>
                                  </div>
                              ))}
                          </div>
                      </div>
                  </div>
                  
                  <div className="mt-8 flex justify-end">
                      <button onClick={handleSaveQuiz} className="bg-green-500 text-black px-12 py-4 rounded-2xl font-black uppercase hover:scale-105 transition-all">حفظ الاختبار</button>
                  </div>
              </div>
          </div>
      )}
      
      {editingQuestion && <QuestionEditor question={editingQuestion} onSave={handleSaveQuestion} onCancel={() => setEditingQuestion(null)} />}
    </div>
  );
};

export default AdminQuizManager;
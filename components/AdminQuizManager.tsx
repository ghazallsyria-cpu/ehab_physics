import React, { useState, useEffect, useMemo } from 'react';
import { Quiz, Question, StudentQuizAttempt, SubjectType } from '../types';
import { dbService } from '../services/db';
import { ClipboardList, PlusCircle, Search, Edit, Trash2, X, Save, RefreshCw, BarChart, Users, Clock } from 'lucide-react';
import QuestionEditor from './QuestionEditor';

const AdminQuizManager: React.FC = () => {
  const [quizzes, setQuizzes] = useState<Quiz[]>([]);
  const [allQuestions, setAllQuestions] = useState<Question[]>([]);
  const [editingQuiz, setEditingQuiz] = useState<Partial<Quiz> | null>(null);
  const [quizQuestions, setQuizQuestions] = useState<Question[]>([]);
  const [editingQuestion, setEditingQuestion] = useState<Partial<Question> | null>(null);
  const [filterGrade, setFilterGrade] = useState<'all' | '10' | '11' | '12' | 'uni'>('all');
  const [isLoading, setIsLoading] = useState(true);
  
  const [viewingAttempts, setViewingAttempts] = useState<Quiz | null>(null);
  const [quizAttempts, setQuizAttempts] = useState<StudentQuizAttempt[]>([]);

  useEffect(() => {
    loadData();
  }, []);

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
    setViewingAttempts(quiz);
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
      questionIds: [],
      duration: 30,
      totalScore: 0,
      isPremium: false,
    });
    setQuizQuestions([]);
  };

  const handleSaveQuiz = async () => {
    if (!editingQuiz || !editingQuiz.title) return;
    const finalQuiz = {
        ...editingQuiz,
        questionIds: quizQuestions.map(q => q.id),
        totalScore: quizQuestions.reduce((sum, q) => sum + q.score, 0)
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
    const isNew = !allQuestions.some(q => q.id === question.id);
    if (isNew) {
      await dbService.saveQuestion(question);
    } else {
      await dbService.updateQuestion(question.id, question);
    }
    await loadData();
    
    setQuizQuestions(prev => {
        if(isNew) return [...prev, question];
        return prev.map(q => q.id === question.id ? question : q);
    });

    setEditingQuestion(null);
  };
  
  const addQuestionToQuiz = (question: Question) => {
    if (!quizQuestions.some(q => q.id === question.id)) {
        setQuizQuestions(prev => [...prev, question]);
    }
  };

  const removeQuestionFromQuiz = (questionId: string) => {
    setQuizQuestions(prev => prev.filter(q => q.id !== questionId));
  };
  
  const quizComposition = useMemo(() => {
    return quizQuestions.reduce((acc, q) => {
        const difficulty = q.difficulty || 'Medium';
        acc[difficulty] = (acc[difficulty] || 0) + 1;
        return acc;
    }, {} as Record<string, number>);
  }, [quizQuestions]);


  const filteredQuizzes = quizzes.filter(q => filterGrade === 'all' || q.grade === filterGrade);

  if (viewingAttempts) {
    return (
        <div className="animate-fadeIn font-['Tajawal'] text-right" dir="rtl">
            <div className="flex justify-between items-center mb-8">
                <div>
                    <h2 className="text-3xl font-black text-white">سجل المحاولات: <span className="text-[#fbbf24]">{viewingAttempts.title}</span></h2>
                    <p className="text-gray-500">{quizAttempts.length} محاولة مسجلة</p>
                </div>
                <button onClick={() => setViewingAttempts(null)} className="flex items-center gap-2 px-6 py-3 bg-white/5 text-white rounded-lg text-xs font-bold border border-white/10"><X size={14}/> عودة</button>
            </div>
            <div className="glass-panel p-6 rounded-3xl border-white/5">
                <table className="w-full text-sm">
                    <thead>
                        <tr className="border-b border-white/10 text-xs font-bold text-gray-500 uppercase">
                            <th className="p-4 text-right">اسم الطالب</th>
                            <th className="p-4 text-center">النتيجة</th>
                            <th className="p-4 text-center">الوقت المستغرق</th>
                            <th className="p-4 text-left">تاريخ الإنجاز</th>
                        </tr>
                    </thead>
                    <tbody>
                        {quizAttempts.map(att => (
                            <tr key={att.id} className="border-b border-white/5">
                                <td className="p-4 font-bold">{att.studentName}</td>
                                <td className="p-4 text-center font-mono">{att.score} / {att.maxScore}</td>
                                <td className="p-4 text-center font-mono">{Math.floor((att.timeSpent || 0) / 60)} د</td>
                                <td className="p-4 text-left font-mono text-xs text-gray-400">{new Date(att.completedAt).toLocaleString('ar-KW')}</td>
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
        <div className="flex justify-between items-center mb-8">
            <h2 className="text-3xl font-black text-white">{editingQuiz.id?.startsWith('quiz_') ? 'إنشاء اختبار جديد' : 'تعديل الاختبار'}</h2>
            <div className="flex gap-4">
                <button onClick={() => setEditingQuiz(null)} className="flex items-center gap-2 px-6 py-3 bg-white/5 text-white rounded-lg text-xs font-bold border border-white/10"><X size={14}/> إلغاء</button>
                <button onClick={handleSaveQuiz} className="flex items-center gap-2 px-6 py-3 bg-green-500 text-black rounded-lg text-xs font-bold border border-green-500/20"><Save size={14}/> حفظ الاختبار</button>
            </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
            <div className="lg:col-span-4 space-y-6">
                <div className="glass-panel p-6 rounded-3xl border-white/5 space-y-4">
                    <input type="text" placeholder="عنوان الاختبار" value={editingQuiz.title || ''} onChange={e => setEditingQuiz({...editingQuiz, title: e.target.value})} className="w-full bg-black/40 border border-white/10 rounded-lg p-3 text-white outline-none focus:border-[#fbbf24]"/>
                    <textarea placeholder="وصف موجز للاختبار" value={editingQuiz.description || ''} onChange={e => setEditingQuiz({...editingQuiz, description: e.target.value})} className="w-full h-24 bg-black/40 border border-white/10 rounded-lg p-3 text-white outline-none focus:border-[#fbbf24] no-scrollbar"/>
                    <div className="grid grid-cols-2 gap-4">
                        <select value={editingQuiz.grade} onChange={e => setEditingQuiz({...editingQuiz, grade: e.target.value as any})} className="w-full bg-black/40 border border-white/10 rounded-lg p-3 text-white outline-none focus:border-[#fbbf24]"><option value="10">الصف 10</option><option value="11">الصف 11</option><option value="12">الصف 12</option><option value="uni">جامعي</option></select>
                        <select value={editingQuiz.subject} onChange={e => setEditingQuiz({...editingQuiz, subject: e.target.value as any})} className="w-full bg-black/40 border border-white/10 rounded-lg p-3 text-white outline-none focus:border-[#fbbf24]"><option value="Physics">الفيزياء</option><option value="Chemistry">الكيمياء</option></select>
                    </div>
                    <input type="number" placeholder="مدة الاختبار (دقائق)" value={editingQuiz.duration || 0} onChange={e => setEditingQuiz({...editingQuiz, duration: parseInt(e.target.value)})} className="w-full bg-black/40 border border-white/10 rounded-lg p-3 text-white outline-none focus:border-[#fbbf24]"/>
                    <div className="flex items-center justify-between p-4 bg-black/40 rounded-2xl border border-white/10">
                        <label className="font-bold text-[#fbbf24]">اختبار للمشتركين (Premium)؟</label>
                        <button onClick={() => setEditingQuiz({...editingQuiz, isPremium: !editingQuiz.isPremium})} className={`w-16 h-8 rounded-full p-1 transition-colors ${editingQuiz.isPremium ? 'bg-green-500' : 'bg-gray-700'}`}><div className={`w-6 h-6 bg-white rounded-full shadow-md transform transition-transform ${editingQuiz.isPremium ? 'translate-x-8' : 'translate-x-0'}`}/></button>
                    </div>
                </div>
                <div className="glass-panel p-6 rounded-3xl border-white/5">
                    <h4 className="font-bold mb-4">تكوين الاختبار</h4>
                    <div className="space-y-2 text-xs">
                        <div className="flex justify-between items-center"><span className="text-green-400">سهل</span><span className="font-mono">{quizComposition['Easy'] || 0}</span></div>
                        <div className="flex justify-between items-center"><span className="text-yellow-400">متوسط</span><span className="font-mono">{quizComposition['Medium'] || 0}</span></div>
                        <div className="flex justify-between items-center"><span className="text-red-400">صعب</span><span className="font-mono">{quizComposition['Hard'] || 0}</span></div>
                        <div className="flex justify-between items-center pt-2 border-t border-white/10 mt-2 font-bold"><span className="text-white">المجموع</span><span className="font-mono">{quizQuestions.length}</span></div>
                    </div>
                </div>
                <div className="glass-panel p-6 rounded-3xl border-white/5">
                    <h4 className="font-bold mb-4">إضافة سؤال من البنك</h4>
                    <div className="space-y-2 max-h-64 overflow-y-auto no-scrollbar">{allQuestions.filter(q => q.grade === editingQuiz.grade).map(q => (<div key={q.id} onClick={() => addQuestionToQuiz(q)} className="p-2 bg-black/40 rounded-lg text-xs cursor-pointer hover:bg-black/80">{q.text.substring(0, 50)}...</div>))}</div>
                </div>
            </div>
            <div className="lg:col-span-8 glass-panel p-6 rounded-3xl border-white/5 space-y-4">
                 <div className="flex justify-between items-center"><h3 className="font-bold">أسئلة الاختبار ({quizQuestions.length})</h3><button onClick={() => setEditingQuestion({ id: `q_${Date.now()}`, score: 5, grade: editingQuiz.grade as any, subject: editingQuiz.subject, unit: '', type: 'mcq', text: '' })} className="text-xs font-bold text-green-400 flex items-center gap-1"><PlusCircle size={14}/> سؤال جديد</button></div>
                 <div className="space-y-3 max-h-[80vh] overflow-y-auto no-scrollbar">
                    {quizQuestions.map(q => (<div key={q.id} className="p-4 bg-black/40 rounded-xl border border-white/5 flex justify-between items-center"><p className="flex-1 text-sm truncate">{q.text}</p><div className="flex items-center gap-2"><span className={`text-[9px] font-black px-2 py-1 rounded-full ${ q.difficulty === 'Easy' ? 'bg-green-500/20 text-green-400' : q.difficulty === 'Medium' ? 'bg-yellow-500/20 text-yellow-400' : q.difficulty === 'Hard' ? 'bg-red-500/20 text-red-400' : 'bg-white/5' }`}>{q.difficulty || 'N/A'}</span><span className="text-[10px] bg-white/5 px-2 py-1 rounded">{q.type}</span><span className="text-[10px] bg-[#fbbf24]/20 text-[#fbbf24] px-2 py-1 rounded">{q.score} pts</span><button onClick={() => setEditingQuestion(q)} className="p-1"><Edit size={12}/></button><button onClick={() => removeQuestionFromQuiz(q.id)} className="p-1 text-red-500"><Trash2 size={12}/></button></div></div>))}
                 </div>
            </div>
        </div>
      </div>
    );
  }

  return (
    <div className="animate-fadeIn font-['Tajawal'] text-right" dir="rtl">
      <header className="flex flex-col md:flex-row justify-between items-center gap-6 mb-8">
        <h2 className="text-3xl font-black text-white">إدارة <span className="text-[#fbbf24]">الاختبارات</span></h2>
        <div className="flex gap-4"><button onClick={loadData} className="p-4 bg-white/5 rounded-2xl text-white hover:bg-white/10 transition-all border border-white/10"><RefreshCw size={20} className={isLoading ? 'animate-spin' : ''}/></button><button onClick={handleCreateNewQuiz} className="bg-[#fbbf24] text-black px-6 py-4 rounded-2xl font-black text-xs uppercase tracking-widest shadow-lg hover:scale-105 transition-all flex items-center gap-2"><PlusCircle size={18} /> إنشاء اختبار جديد</button></div>
      </header>
      
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
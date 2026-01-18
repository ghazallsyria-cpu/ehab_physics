
import React, { useState, useEffect } from 'react';
import { Curriculum, Unit, Lesson } from '../types';
import { dbService } from '../services/db';
import { BookOpen, Edit, Plus, Trash2, X, RefreshCw, CheckCircle } from 'lucide-react';
import LessonEditor from './LessonEditor';

const AdminCurriculumManager: React.FC = () => {
  const [curriculum, setCurriculum] = useState<Curriculum[]>([]);
  const [activeGrade, setActiveGrade] = useState<'10' | '11' | '12'>('12');
  const [activeSubject, setActiveSubject] = useState<'Physics' | 'Chemistry'>('Physics');
  const [editingLesson, setEditingLesson] = useState<{ lesson: Partial<Lesson>, unitId: string, grade: '10'|'11'|'12', subject: 'Physics' | 'Chemistry' } | null>(null);
  const [editingUnit, setEditingUnit] = useState<Partial<Unit> | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'success'>('idle');

  useEffect(() => {
    loadCurriculum();
  }, []);

  const loadCurriculum = async () => {
    setIsLoading(true);
    try {
      const data = await dbService.getCurriculum();
      setCurriculum(data);
    } catch (e) {
      console.error("Load failed", e);
    } finally {
      setIsLoading(false);
    }
  };

  const activeTopic = curriculum.find(t => t.grade === activeGrade && t.subject === activeSubject);

  const handleAddLesson = (unitId: string) => {
    setEditingLesson({
      lesson: {
        id: `new_${Date.now()}`,
        title: '',
        type: 'THEORY',
        duration: '10 د',
        content: [{ type: 'text', content: '' }]
      },
      unitId,
      grade: activeGrade,
      subject: activeSubject
    });
  };

  const handleEditLesson = (lesson: Lesson, unitId: string) => {
    setEditingLesson({ lesson, unitId, grade: activeGrade, subject: activeSubject });
  };
  
  const handleDeleteLesson = async (lessonId: string, unitId: string) => {
    if (window.confirm(`هل أنت متأكد من حذف هذا الدرس؟ لا يمكن التراجع عن هذا الإجراء.`)) {
        await dbService.deleteLesson(activeGrade, activeSubject, unitId, lessonId);
        loadCurriculum();
    }
  };

  const handleSaveLesson = async (lesson: Lesson, unitId: string, grade: '10'|'11'|'12', subject: 'Physics' | 'Chemistry') => {
    setSaveStatus('saving');
    await dbService.saveLesson(grade, subject, unitId, lesson);
    setEditingLesson(null);
    await loadCurriculum();
    setSaveStatus('success');
    setTimeout(() => setSaveStatus('idle'), 2000);
  };

  const handleSaveUnit = async () => {
    if (!editingUnit || !editingUnit.title?.trim()) {
      alert("يرجى إدخال عنوان للوحدة.");
      return;
    }
    setSaveStatus('saving');
    try {
        await dbService.saveUnit(activeGrade, activeSubject, editingUnit as Unit);
        setEditingUnit(null);
        await loadCurriculum();
        setSaveStatus('success');
    } catch (e) {
        alert("فشل حفظ الوحدة. تأكد من صلاحيات قاعدة البيانات.");
    } finally {
        setTimeout(() => setSaveStatus('idle'), 2000);
    }
  };
  
  const handleDeleteUnit = async (unitId: string) => {
    if (window.confirm(`⚠️ تحذير: سيتم حذف الوحدة وجميع الدروس بداخلها نهائياً. هل أنت متأكد؟`)) {
        await dbService.deleteUnit(activeGrade, activeSubject, unitId);
        loadCurriculum();
    }
  };

  if (editingLesson) {
    return <LessonEditor 
              lessonData={editingLesson.lesson} 
              unitId={editingLesson.unitId}
              grade={editingLesson.grade}
              subject={editingLesson.subject}
              onSave={handleSaveLesson} 
              onCancel={() => setEditingLesson(null)} 
           />;
  }

  return (
    <div className="max-w-7xl mx-auto py-12 px-6 animate-fadeIn font-['Tajawal'] text-white" dir="rtl">
      <header className="flex flex-col md:flex-row justify-between md:items-center gap-6 mb-12">
        <div className="flex items-center gap-6">
            <div className="w-20 h-20 bg-white/5 rounded-[30px] border border-white/10 flex items-center justify-center text-[#fbbf24] shadow-2xl">
                <BookOpen size={40}/>
            </div>
            <div>
                <h2 className="text-4xl font-black text-white mb-2">إدارة المناهج</h2>
                <div className="flex items-center gap-2">
                    <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
                    <p className="text-gray-500 font-medium italic">أنت تقوم بتعديل: <span className="text-[#fbbf24] font-bold">{activeSubject === 'Physics' ? 'الفيزياء' : 'الكيمياء'} - الصف {activeGrade}</span></p>
                </div>
            </div>
        </div>
        <div className="flex gap-4">
            <button onClick={loadCurriculum} className="p-4 bg-white/5 rounded-2xl hover:bg-white/10 transition-all border border-white/10" title="تحديث">
                <RefreshCw size={20} className={isLoading ? 'animate-spin' : ''} />
            </button>
            <button 
                onClick={() => setEditingUnit({ id: `u_${Date.now()}`, title: '', description: '', lessons: [] })} 
                className="bg-[#fbbf24] text-black px-8 py-4 rounded-2xl font-black text-xs uppercase tracking-widest shadow-lg flex items-center gap-2 hover:scale-105 active:scale-95 transition-all"
            >
                <Plus size={16}/> إضافة وحدة جديدة
            </button>
        </div>
      </header>

      {/* Selector Control Panel */}
      <div className="flex flex-col md:flex-row justify-center items-center gap-6 mb-16 bg-white/[0.02] p-8 rounded-[40px] border border-white/5">
        <div className="flex flex-col gap-3">
            <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest text-center">المادة الدراسية</label>
            <div className="bg-black/40 p-2 rounded-[20px] flex gap-2 border border-white/5 backdrop-blur-xl">
            {(['Physics', 'Chemistry'] as const).map(subject => (
                <button
                key={subject}
                onClick={() => setActiveSubject(subject)}
                className={`px-10 py-3 rounded-[15px] font-black text-xs uppercase tracking-widest transition-all ${activeSubject === subject ? 'bg-white text-black shadow-xl' : 'text-gray-500 hover:text-white'}`}
                >
                {subject === 'Physics' ? '⚛️ الفيزياء' : '🧪 الكيمياء'}
                </button>
            ))}
            </div>
        </div>
        <div className="flex flex-col gap-3">
            <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest text-center">المرحلة الدراسية</label>
            <div className="bg-black/40 p-2 rounded-[20px] flex gap-2 border border-white/5 backdrop-blur-xl">
            {(['12', '11', '10'] as const).map(grade => (
                <button
                key={grade}
                onClick={() => setActiveGrade(grade)}
                className={`px-10 py-3 rounded-[15px] font-black text-xs uppercase tracking-widest transition-all ${activeGrade === grade ? 'bg-[#fbbf24] text-black shadow-xl' : 'text-gray-500 hover:text-white'}`}
                >
                الصف {grade}
                </button>
            ))}
            </div>
        </div>
      </div>

      {isLoading ? (
        <div className="py-32 text-center">
            <div className="w-16 h-16 border-4 border-[#fbbf24] border-t-transparent rounded-full animate-spin mx-auto mb-6"></div>
            <p className="text-gray-500 font-bold uppercase tracking-widest">جاري جلب بيانات المنهج من السحابة...</p>
        </div>
      ) : activeTopic && activeTopic.units && activeTopic.units.length > 0 ? (
        <div className="space-y-8 animate-slideUp">
          {activeTopic.units.map((unit, uIdx) => (
            <div key={unit.id} className="glass-panel p-8 md:p-10 rounded-[50px] border border-white/5 group hover:border-[#fbbf24]/20 transition-all bg-gradient-to-br from-white/[0.01] to-transparent">
              <div className="flex flex-col md:flex-row justify-between items-start gap-6 mb-8 border-b border-white/5 pb-8">
                <div className="flex gap-6 items-start">
                    <div className="w-14 h-14 rounded-2xl bg-black/40 flex items-center justify-center text-xl font-black border border-white/10 text-[#fbbf24]">{uIdx + 1}</div>
                    <div>
                        <h3 className="text-2xl font-black text-white group-hover:text-[#fbbf24] transition-colors">{unit.title}</h3>
                        <p className="text-sm text-gray-500 mt-1 max-w-xl">{unit.description}</p>
                    </div>
                </div>
                <div className="flex gap-3">
                  <button onClick={() => setEditingUnit(unit)} className="p-4 bg-white/5 rounded-2xl text-white hover:bg-[#00d2ff] hover:text-black transition-all" title="تعديل الوحدة"><Edit size={18}/></button>
                  <button onClick={() => handleDeleteUnit(unit.id)} className="p-4 bg-white/5 rounded-2xl text-white hover:bg-red-500 transition-all" title="حذف الوحدة"><Trash2 size={18}/></button>
                  <button onClick={() => handleAddLesson(unit.id)} className="px-6 py-4 bg-green-500/10 rounded-2xl text-green-400 hover:bg-green-500 hover:text-black transition-all font-black text-[10px] uppercase tracking-widest flex items-center gap-2 shadow-lg">
                    <Plus size={16}/> إضافة درس
                  </button>
                </div>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {unit.lessons && unit.lessons.map((lesson, lIdx) => (
                  <div key={lesson.id} className="flex items-center justify-between p-6 bg-black/40 rounded-[30px] border border-white/5 hover:border-white/10 transition-all group/lesson">
                    <div className="flex gap-4 items-center">
                      <span className="w-8 h-8 rounded-xl bg-white/5 flex items-center justify-center text-[10px] font-black text-gray-600">{lIdx + 1}</span>
                      <div>
                        <p className="font-bold text-gray-200">{lesson.title}</p>
                        <div className="flex gap-3 mt-1">
                            <span className="text-[9px] font-black text-[#00d2ff] uppercase">{lesson.type}</span>
                            <span className="text-[9px] font-bold text-gray-600">⏱ {lesson.duration}</span>
                        </div>
                      </div>
                    </div>
                    <div className="flex gap-2 opacity-0 group-hover/lesson:opacity-100 transition-opacity">
                      <button onClick={() => handleEditLesson(lesson, unit.id)} className="p-2.5 bg-white/5 rounded-xl hover:bg-white/10 transition-all"><Edit size={14}/></button>
                      <button onClick={() => handleDeleteLesson(lesson.id, unit.id)} className="p-2.5 bg-red-500/10 text-red-400 rounded-xl hover:bg-red-500 hover:text-white transition-all"><Trash2 size={14}/></button>
                    </div>
                  </div>
                ))}
                {(!unit.lessons || unit.lessons.length === 0) && (
                    <div className="col-span-full py-10 text-center bg-black/20 rounded-[40px] border-2 border-dashed border-white/5 text-gray-600">
                        <p className="font-bold text-sm italic">لا توجد دروس مضافة لهذه الوحدة بعد.</p>
                    </div>
                )}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="py-40 text-center glass-panel rounded-[60px] border-dashed border-white/10 opacity-30">
          <span className="text-8xl mb-8 block">📚</span>
          <p className="font-black text-2xl uppercase tracking-widest mb-4">المنهج فارغ</p>
          <p className="text-lg">ابدأ ببناء المحتوى عبر إضافة الوحدة الأولى للصف والمادة المحددين.</p>
        </div>
      )}

      {/* Status Toasts */}
      {saveStatus !== 'idle' && (
          <div className="fixed bottom-10 right-10 z-[200] animate-slideUp">
              <div className={`px-8 py-4 rounded-2xl flex items-center gap-4 shadow-2xl border ${saveStatus === 'saving' ? 'bg-blue-500 text-white border-blue-400' : 'bg-green-500 text-white border-green-400'}`}>
                  {saveStatus === 'saving' ? <RefreshCw className="animate-spin" size={20}/> : <CheckCircle size={20}/>}
                  <span className="font-black text-xs uppercase tracking-widest">
                      {saveStatus === 'saving' ? 'جاري مزامنة البيانات...' : 'تم الحفظ والمزامنة بنجاح ✓'}
                  </span>
              </div>
          </div>
      )}

      {/* Edit/Add Unit Modal */}
      {editingUnit && (
        <div className="fixed inset-0 z-[150] bg-black/90 backdrop-blur-xl flex items-center justify-center p-4">
           <div className="glass-panel w-full max-w-xl p-12 rounded-[60px] border-white/10 relative shadow-3xl animate-fadeIn">
              <button onClick={() => setEditingUnit(null)} className="absolute top-8 left-8 text-gray-500 hover:text-white p-3 bg-white/5 rounded-full transition-all"><X size={24}/></button>
              
              <div className="mb-10">
                <span className="bg-[#fbbf24]/20 text-[#fbbf24] px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest border border-[#fbbf24]/30">وحدة دراسية جديدة</span>
                <h3 className="text-3xl font-black mt-4 text-white">إضافة وحدة إلى المنهج</h3>
                <p className="text-gray-500 text-xs mt-2 italic">سيتم ربط هذه الوحدة بـ: <span className="text-white font-bold">{activeSubject} - الصف {activeGrade}</span></p>
              </div>

              <div className="space-y-6">
                 <div className="space-y-2">
                    <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest mr-4">عنوان الوحدة</label>
                    <input type="text" placeholder="مثال: الوحدة الأولى - ميكانيكا الكم" value={editingUnit.title || ''} onChange={e => setEditingUnit({...editingUnit, title: e.target.value})} className="w-full bg-black/40 border border-white/10 rounded-[25px] px-8 py-5 text-white outline-none focus:border-[#fbbf24] font-bold text-lg shadow-inner transition-all"/>
                 </div>
                 <div className="space-y-2">
                    <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest mr-4">وصف الوحدة</label>
                    <textarea placeholder="وصف مختصر لما سيتعلمه الطالب في هذه الوحدة..." value={editingUnit.description || ''} onChange={e => setEditingUnit({...editingUnit, description: e.target.value})} className="w-full h-32 bg-black/40 border border-white/10 rounded-[25px] px-8 py-5 text-white outline-none focus:border-[#fbbf24] font-medium leading-relaxed shadow-inner transition-all no-scrollbar"/>
                 </div>
                 
                 <div className="pt-6">
                    <button 
                        onClick={handleSaveUnit} 
                        disabled={saveStatus === 'saving'}
                        className="w-full py-6 bg-[#fbbf24] text-black rounded-[30px] font-black text-sm uppercase tracking-widest shadow-[0_20px_50px_rgba(251,191,36,0.2)] hover:scale-105 active:scale-95 transition-all flex items-center justify-center gap-4"
                    >
                        {saveStatus === 'saving' ? <RefreshCw className="animate-spin" /> : 'تأكيد الحفظ والنشر'}
                    </button>
                    <p className="text-center text-[10px] text-gray-600 mt-6 font-bold uppercase tracking-widest">ملاحظة: سيظهر التغيير فوراً لجميع الطلاب في هذا الصف</p>
                 </div>
              </div>
           </div>
        </div>
      )}
    </div>
  );
};

export default AdminCurriculumManager;

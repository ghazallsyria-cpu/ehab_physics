
import React, { useState, useEffect } from 'react';
import { Curriculum, Unit, Lesson } from '../types';
import { dbService } from '../services/db';
import { BookOpen, Edit, Plus, Trash2, X } from 'lucide-react';
import LessonEditor from './LessonEditor';

const AdminCurriculumManager: React.FC = () => {
  const [curriculum, setCurriculum] = useState<Curriculum[]>([]);
  const [activeGrade, setActiveGrade] = useState<'10' | '11' | '12'>('12');
  const [activeSubject, setActiveSubject] = useState<'Physics' | 'Chemistry'>('Physics');
  const [editingLesson, setEditingLesson] = useState<{ lesson: Partial<Lesson>, unitId: string, grade: '10'|'11'|'12', subject: 'Physics' | 'Chemistry' } | null>(null);
  const [editingUnit, setEditingUnit] = useState<Partial<Unit> | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadCurriculum();
  }, []);

  const loadCurriculum = async () => {
    setIsLoading(true);
    const data = await dbService.getCurriculum();
    setCurriculum(data);
    setIsLoading(false);
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
    await dbService.saveLesson(grade, subject, unitId, lesson);
    setEditingLesson(null);
    loadCurriculum();
  };

  const handleSaveUnit = async () => {
    if (!editingUnit || !editingUnit.title?.trim()) {
      alert("يرجى إدخال عنوان للوحدة.");
      return;
    }
    await dbService.saveUnit(activeGrade, activeSubject, editingUnit as Unit);
    setEditingUnit(null);
    loadCurriculum();
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
    <div className="max-w-7xl mx-auto py-12 px-6 animate-fadeIn font-['Tajawal'] text-white">
      <header className="flex flex-col md:flex-row justify-between md:items-center gap-6 mb-12">
        <div>
            <h2 className="text-4xl font-black text-white mb-2 flex items-center gap-4"><BookOpen size={40}/> إدارة المناهج الدراسية</h2>
            <p className="text-gray-500 font-medium italic">إضافة وتعديل وحذف الوحدات والدروس في المنصة.</p>
        </div>
        <button onClick={() => setEditingUnit({ id: `new_${Date.now()}`, title: '', description: '', lessons: [] })} className="bg-[#fbbf24] text-black px-8 py-4 rounded-2xl font-black text-xs uppercase tracking-widest shadow-lg flex items-center gap-2">
            <Plus size={16}/> إضافة وحدة جديدة
        </button>
      </header>

      {/* Grade & Subject Selector */}
      <div className="flex flex-col md:flex-row justify-center items-center gap-4 mb-12">
        <div className="bg-white/5 p-2 rounded-[25px] flex gap-2 border border-white/10 backdrop-blur-xl">
          {(['Physics', 'Chemistry'] as const).map(subject => (
            <button
              key={subject}
              onClick={() => setActiveSubject(subject)}
              className={`px-10 py-4 rounded-[20px] font-black text-sm uppercase tracking-widest transition-all ${activeSubject === subject ? 'bg-white text-black' : 'text-gray-500 hover:text-white'}`}
            >
              {subject === 'Physics' ? '⚛️ الفيزياء' : '🧪 الكيمياء'}
            </button>
          ))}
        </div>
        <div className="bg-white/5 p-2 rounded-[25px] flex gap-2 border border-white/10 backdrop-blur-xl">
          {(['12', '11', '10'] as const).map(grade => (
            <button
              key={grade}
              onClick={() => setActiveGrade(grade)}
              className={`px-10 py-4 rounded-[20px] font-black text-sm uppercase tracking-widest transition-all ${activeGrade === grade ? 'bg-[#fbbf24] text-black' : 'text-gray-500 hover:text-white'}`}
            >
              الصف {grade}
            </button>
          ))}
        </div>
      </div>

      {isLoading ? <div className="text-center py-20">جاري تحميل بيانات المنهج...</div> : activeTopic ? (
        <div className="space-y-8">
          {activeTopic.units.map((unit) => (
            <div key={unit.id} className="glass-panel p-8 rounded-[40px] border border-white/5 group">
              <div className="flex justify-between items-center mb-6">
                <div>
                  <h3 className="text-2xl font-black text-white">{unit.title}</h3>
                  <p className="text-xs text-gray-400">{unit.description}</p>
                </div>
                <div className="flex gap-4">
                  <button onClick={() => setEditingUnit(unit)} className="p-3 bg-white/5 rounded-full text-white hover:bg-[#00d2ff] hover:text-black transition-all"><Edit size={16}/></button>
                  <button onClick={() => handleDeleteUnit(unit.id)} className="p-3 bg-white/5 rounded-full text-white hover:bg-red-500 transition-all"><Trash2 size={16}/></button>
                  <button onClick={() => handleAddLesson(unit.id)} className="p-3 bg-green-500/10 rounded-full text-green-400 hover:bg-green-500 hover:text-black transition-all"><Plus size={16}/></button>
                </div>
              </div>
              
              <div className="space-y-4">
                {unit.lessons.map(lesson => (
                  <div key={lesson.id} className="flex items-center justify-between p-4 bg-black/40 rounded-2xl border border-white/5">
                    <div>
                      <p className="font-bold">{lesson.title}</p>
                      <span className="text-xs text-gray-500">{lesson.type} • {lesson.duration}</span>
                    </div>
                    <div className="flex gap-2">
                      <button onClick={() => handleEditLesson(lesson, unit.id)} className="p-2 bg-white/5 rounded-lg text-xs"><Edit size={14}/></button>
                      <button onClick={() => handleDeleteLesson(lesson.id, unit.id)} className="p-2 bg-white/5 rounded-lg text-xs"><Trash2 size={14}/></button>
                    </div>
                  </div>
                ))}
                {unit.lessons.length === 0 && <p className="text-center text-gray-600 italic py-4">لا توجد دروس في هذه الوحدة بعد.</p>}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-20 opacity-40">
          <p className="font-black text-lg">لم يتم العثور على منهج لهذا الصف وهذه المادة.</p>
          <p>يمكنك إضافة وحدة جديدة للبدء.</p>
        </div>
      )}

      {/* Edit/Add Unit Modal */}
      {editingUnit && (
        <div className="fixed inset-0 z-[150] bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
           <div className="glass-panel w-full max-w-lg p-10 rounded-[50px] border-white/10 relative">
              <button onClick={() => setEditingUnit(null)} className="absolute top-6 left-6 text-gray-500 hover:text-white p-2 bg-white/5 rounded-full"><X size={18}/></button>
              <h3 className="text-2xl font-black mb-8">{editingUnit.id?.startsWith('new_') ? 'إضافة وحدة جديدة' : 'تعديل الوحدة'}</h3>
              <div className="space-y-6">
                 <input type="text" placeholder="عنوان الوحدة" value={editingUnit.title || ''} onChange={e => setEditingUnit({...editingUnit, title: e.target.value})} className="w-full bg-black/40 border border-white/10 rounded-2xl px-5 py-4 text-white outline-none focus:border-[#fbbf24]"/>
                 <textarea placeholder="وصف مختصر للوحدة" value={editingUnit.description || ''} onChange={e => setEditingUnit({...editingUnit, description: e.target.value})} className="w-full h-24 bg-black/40 border border-white/10 rounded-2xl px-5 py-4 text-white outline-none focus:border-[#fbbf24]"/>
                 <button onClick={handleSaveUnit} className="w-full py-4 bg-[#fbbf24] text-black rounded-2xl font-black text-sm uppercase tracking-widest">حفظ الوحدة</button>
              </div>
           </div>
        </div>
      )}
    </div>
  );
};

export default AdminCurriculumManager;

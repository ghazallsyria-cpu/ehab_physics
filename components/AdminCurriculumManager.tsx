
import React, { useState, useEffect } from 'react';
import { Curriculum, Unit, Lesson } from '../types';
import { dbService } from '../services/db';
import { BookOpen, Edit, Plus, Trash2 } from 'lucide-react';
import LessonEditor from './LessonEditor';

const AdminCurriculumManager: React.FC = () => {
  const [curriculum, setCurriculum] = useState<Curriculum[]>([]);
  const [activeGrade, setActiveGrade] = useState<'10' | '11' | '12'>('12');
  const [expandedUnitId, setExpandedUnitId] = useState<string | null>(null);
  const [editingLesson, setEditingLesson] = useState<{ lesson: Partial<Lesson>, unitId: string } | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadCurriculum();
  }, []);

  const loadCurriculum = () => {
    setIsLoading(true);
    const data = dbService.getCurriculum();
    setCurriculum(data);
    setIsLoading(false);
  };

  const activeTopic = curriculum.find(t => t.grade === activeGrade);

  const handleAddLesson = (unitId: string) => {
    setEditingLesson({
      lesson: {
        id: `new_${Date.now()}`,
        title: '',
        type: 'THEORY',
        duration: '10 د',
        content: [{ type: 'text', content: '' }]
      },
      unitId
    });
  };

  const handleEditLesson = (lesson: Lesson, unitId: string) => {
    setEditingLesson({ lesson, unitId });
  };
  
  const handleDeleteLesson = async (lessonId: string, unitId: string) => {
    if (window.confirm(`هل أنت متأكد من حذف هذا الدرس؟ لا يمكن التراجع عن هذا الإجراء.`)) {
        await dbService.deleteLesson(unitId, lessonId);
        loadCurriculum();
    }
  };

  const handleSaveLesson = async (lesson: Lesson, unitId: string) => {
    await dbService.saveLesson(unitId, lesson);
    setEditingLesson(null);
    loadCurriculum();
  };

  if (editingLesson) {
    return <LessonEditor 
              lessonData={editingLesson.lesson} 
              unitId={editingLesson.unitId}
              onSave={handleSaveLesson} 
              onCancel={() => setEditingLesson(null)} 
           />;
  }

  return (
    <div className="max-w-7xl mx-auto py-12 px-6 animate-fadeIn font-['Tajawal'] text-white">
      <header className="mb-12">
        <h2 className="text-4xl font-black text-white mb-2 flex items-center gap-4"><BookOpen size={40}/> إدارة المناهج الدراسية</h2>
        <p className="text-gray-500 font-medium italic">إضافة وتعديل وحذف الوحدات والدروس في المنصة.</p>
      </header>

      <div className="flex justify-center mb-12">
        <div className="bg-white/5 p-2 rounded-[25px] flex gap-2 border border-white/10">
          {(['12', '11', '10'] as const).map(grade => (
            <button key={grade} onClick={() => setActiveGrade(grade)} className={`px-10 py-4 rounded-[20px] font-black text-sm uppercase ${activeGrade === grade ? 'bg-[#fbbf24] text-black' : 'text-gray-500'}`}>
              الصف {grade}
            </button>
          ))}
        </div>
      </div>

      <div className="max-w-4xl mx-auto space-y-6">
        {activeTopic ? activeTopic.units.map((unit, idx) => (
          <div key={unit.id} className="glass-panel p-8 rounded-[40px] border border-white/5">
            <div className="flex justify-between items-center mb-6">
                <h3 className="text-2xl font-black text-[#00d2ff]">الوحدة {idx + 1}: {unit.title}</h3>
                <button onClick={() => handleAddLesson(unit.id)} className="flex items-center gap-2 px-4 py-2 bg-green-500/10 text-green-400 rounded-lg text-xs font-bold border border-green-500/20">
                    <Plus size={14}/> إضافة درس جديد
                </button>
            </div>
            <div className="space-y-3">
              {unit.lessons.length > 0 ? unit.lessons.map(lesson => (
                <div key={lesson.id} className="flex items-center justify-between p-4 rounded-2xl bg-black/40 border border-white/5 group">
                  <div>
                    <p className="font-bold text-white">{lesson.title}</p>
                    <p className="text-xs text-gray-500">{lesson.duration} • {lesson.type}</p>
                  </div>
                  <div className="flex items-center gap-3 md:opacity-0 group-hover:md:opacity-100 transition-opacity">
                    <button onClick={() => handleEditLesson(lesson, unit.id)} className="p-2 bg-white/5 text-white rounded-lg hover:bg-[#00d2ff] hover:text-black"><Edit size={14}/></button>
                    <button onClick={() => handleDeleteLesson(lesson.id, unit.id)} className="p-2 bg-white/5 text-white rounded-lg hover:bg-red-500"><Trash2 size={14}/></button>
                  </div>
                </div>
              )) : <p className="text-center text-gray-600 italic py-4">لا توجد دروس في هذه الوحدة بعد.</p>}
            </div>
          </div>
        )) : <p>المنهج غير متوفر لهذا الصف.</p>}
      </div>
    </div>
  );
};

export default AdminCurriculumManager;


import React, { useState, useEffect } from 'react';
import { CURRICULUM_DATA } from '../constants';
import { User, Unit, Lesson, Curriculum } from '../types';
import { dbService } from '../services/db';

interface CurriculumBrowserProps {
  user: User;
  subject: 'Physics' | 'Chemistry';
}

const CurriculumBrowser: React.FC<CurriculumBrowserProps> = ({ user, subject }) => {
  const gradeToShow = user.grade === 'uni' ? '12' : user.grade;
  const [expandedUnitId, setExpandedUnitId] = useState<string | null>(null);
  const [dbCurriculum, setDbCurriculum] = useState<Curriculum[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchCurriculum = async () => {
      setIsLoading(true);
      try {
        const data = await dbService.getCurriculum();
        setDbCurriculum(data);
      } catch (e) {
        console.error("Failed to fetch curriculum from DB, using fallback.");
        setDbCurriculum(CURRICULUM_DATA);
      } finally {
        setIsLoading(false);
      }
    };
    fetchCurriculum();
  }, [subject]);

  const activeTopic = dbCurriculum.find(t => t.grade === gradeToShow && t.subject === subject) 
                    || CURRICULUM_DATA.find(t => t.grade === gradeToShow && t.subject === subject);
  
  const subjectName = subject === 'Physics' ? 'الفيزياء' : 'الكيمياء';
  const subjectColor = subject === 'Physics' ? 'text-[#00d2ff]' : 'text-green-400';

  const navigateToLesson = (lesson: Lesson) => {
    window.dispatchEvent(new CustomEvent('change-view', { 
      detail: { view: 'lesson', lesson } 
    }));
  };

  return (
    <div className="max-w-7xl mx-auto py-12 px-6 animate-fadeIn font-['Tajawal'] text-white">
      <div className="mb-16 text-center">
        <h2 className="text-5xl font-black mb-4 tracking-tighter">منهج <span className={`${subjectColor} text-glow`}>{subjectName}</span> - الصف {gradeToShow}</h2>
        <p className="text-gray-500 max-w-2xl mx-auto text-lg">
          توزيع المنهج المعتمد لطلاب المرحلة الثانوية - الكويت.
        </p>
      </div>

      {isLoading ? (
        <div className="py-32 text-center animate-pulse">
          <div className="w-16 h-16 border-4 border-[#fbbf24] border-t-transparent rounded-full animate-spin mx-auto mb-6"></div>
          <p className="text-gray-500 font-bold">جاري تحميل المنهج الدراسي...</p>
        </div>
      ) : activeTopic && activeTopic.units && activeTopic.units.length > 0 ? (
        <div className="max-w-3xl mx-auto space-y-6">
          {activeTopic.units.map((unit: Unit, idx: number) => (
            <div key={unit.id} className={`glass-panel border transition-all duration-500 overflow-hidden ${ expandedUnitId === unit.id ? 'rounded-[40px] border-[#00d2ff]/40 bg-[#00d2ff]/5' : 'rounded-[30px] border-white/5 hover:border-white/20 bg-white/[0.02]' }`}>
              <button onClick={() => setExpandedUnitId(expandedUnitId === unit.id ? null : unit.id)} className="w-full flex items-center justify-between p-8 text-right group">
                <div className="flex items-center gap-6">
                  <div className={`w-12 h-12 rounded-2xl flex items-center justify-center text-lg font-black transition-all ${ expandedUnitId === unit.id ? 'bg-[#00d2ff] text-black shadow-lg' : 'bg-white/5 text-gray-500' }`}>{idx + 1}</div>
                  <div>
                    <h4 className={`text-xl font-black transition-colors ${expandedUnitId === unit.id ? 'text-[#00d2ff]' : 'text-white'}`}>{unit.title}</h4>
                    <p className="text-xs text-gray-500 mt-1">{unit.lessons?.length || 0} دروس • {unit.description}</p>
                  </div>
                </div>
                <div className={`transform transition-transform duration-500 ${expandedUnitId === unit.id ? 'rotate-180 text-[#00d2ff]' : 'text-gray-600'}`}>▼</div>
              </button>
              <div className={`transition-all duration-500 ease-in-out ${expandedUnitId === unit.id ? 'max-h-[1000px] opacity-100 pb-8' : 'max-h-0 opacity-0'}`}>
                 <div className="px-8 space-y-3">
                    {unit.lessons?.map((lesson) => {
                      const isCompleted = user.progress.completedLessonIds.includes(lesson.id);
                      return (
                        <div key={lesson.id} onClick={() => navigateToLesson(lesson)} className={`flex items-center justify-between p-4 rounded-2xl border cursor-pointer group transition-all ${ isCompleted ? 'bg-green-500/10 border-green-500/20' : 'bg-black/40 border-white/5 hover:border-[#fbbf24]/30'}`}>
                           <div className="flex items-center gap-4">
                              <span className={`w-8 h-8 rounded-lg flex items-center justify-center text-xs font-black ${isCompleted ? 'bg-green-500 text-black' : 'bg-white/5 text-gray-500'}`}>{isCompleted ? '✓' : '▶'}</span>
                              <p className={`text-sm font-bold ${isCompleted ? 'text-green-400 line-through' : 'text-gray-300'}`}>{lesson.title}</p>
                           </div>
                           <span className="text-[9px] font-black text-gray-600 uppercase tracking-widest">{lesson.duration}</span>
                        </div>
                      );
                    })}
                 </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="py-32 text-center opacity-40">
          <span className="text-6xl mb-6 block">🚧</span>
          <p className="font-black text-sm uppercase tracking-[0.4em]">محتوى هذا الصف وهذه المادة قيد الإعداد</p>
        </div>
      )}
    </div>
  );
};

export default CurriculumBrowser;

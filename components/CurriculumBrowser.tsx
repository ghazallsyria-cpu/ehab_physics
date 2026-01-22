
import React, { useState, useEffect, useMemo } from 'react';
import { CURRICULUM_DATA } from '../constants';
import { User, Unit, Lesson, Curriculum } from '../types';
import { dbService } from '../services/db';
// Add RefreshCw to the imports from lucide-react to fix line 73 error
import { Check, Play, Lock, Zap, RefreshCw } from 'lucide-react';

interface CurriculumBrowserProps {
  user: User;
  subject: 'Physics' | 'Chemistry';
}

const CurriculumBrowser: React.FC<CurriculumBrowserProps> = ({ user, subject }) => {
  const userInitialGrade = user.grade === 'uni' ? '12' : user.grade;
  const [selectedGrade, setSelectedGrade] = useState<'10' | '11' | '12'>(userInitialGrade);
  const [expandedUnitId, setExpandedUnitId] = useState<string | null>(null);
  const [dbCurriculum, setDbCurriculum] = useState<Curriculum[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const isSubscriber = user.subscription === 'premium' || user.role === 'admin' || user.role === 'teacher';

  useEffect(() => {
    const fetchCurriculum = async () => {
      setIsLoading(true);
      try {
        const data = await dbService.getCurriculum();
        setDbCurriculum(data);
      } catch (e) {
        setDbCurriculum(CURRICULUM_DATA);
      } finally {
        setIsLoading(false);
      }
    };
    fetchCurriculum();
  }, []);

  const activeTopic = dbCurriculum.find(t => t.grade === selectedGrade && t.subject === subject) 
                    || CURRICULUM_DATA.find(t => t.grade === selectedGrade && t.subject === subject);
  
  const navigateToLesson = (lesson: Lesson) => {
    if (!isSubscriber) {
        window.dispatchEvent(new CustomEvent('change-view', { detail: { view: 'subscription' } }));
        return;
    }
    window.dispatchEvent(new CustomEvent('change-view', { detail: { view: 'lesson', lesson } }));
  };

  return (
    <div className="max-w-7xl mx-auto py-12 px-6 animate-fadeIn font-['Tajawal'] text-white text-right" dir="rtl">
      <div className="mb-12 text-center">
        <h2 className="text-5xl font-black mb-4 tracking-tighter italic">منهج <span className="text-[#fbbf24] text-glow">{subject === 'Physics' ? 'الفيزياء' : 'الكيمياء'}</span></h2>
        {!isSubscriber && (
            <div className="bg-amber-500/10 border border-amber-500/20 p-4 rounded-2xl inline-flex items-center gap-3 mb-6">
                <Zap size={16} className="text-amber-500 animate-pulse" />
                <span className="text-xs font-bold text-amber-500">أنت تتصفح النسخة المجانية. اشترك لفتح كافة الدروس.</span>
            </div>
        )}
      </div>

      <div className="flex justify-center gap-4 mb-16">
        {(['12', '11', '10'] as const).map(grade => (
          <button
            key={grade}
            onClick={() => { setSelectedGrade(grade); setExpandedUnitId(null); }}
            className={`px-8 py-3 rounded-2xl font-black text-sm uppercase tracking-widest transition-all ${selectedGrade === grade ? 'bg-[#fbbf24] text-black shadow-lg' : 'bg-white/5 text-gray-500'}`}
          >
            الصف {grade}
          </button>
        ))}
      </div>

      {isLoading ? (
        <div className="py-32 text-center animate-pulse">
          {/* Fixed: RefreshCw is now correctly imported from lucide-react */}
          <RefreshCw className="w-12 h-12 text-[#fbbf24] animate-spin mx-auto mb-6" />
          <p className="text-gray-500 font-bold">جاري تحميل المنهج...</p>
        </div>
      ) : activeTopic && activeTopic.units && activeTopic.units.length > 0 ? (
        <div className="max-w-3xl mx-auto space-y-6">
          {activeTopic.units.map((unit: Unit, idx: number) => (
            <div key={unit.id} className={`glass-panel border transition-all duration-500 overflow-hidden ${ expandedUnitId === unit.id ? 'rounded-[40px] border-[#00d2ff]/40 bg-[#00d2ff]/5' : 'rounded-[30px] border-white/5 bg-white/[0.02]' }`}>
              <button onClick={() => setExpandedUnitId(expandedUnitId === unit.id ? null : unit.id)} className="w-full flex items-center justify-between p-8 text-right group">
                <div className="flex items-center gap-6">
                  <div className={`w-12 h-12 rounded-2xl flex items-center justify-center text-lg font-black transition-all ${ expandedUnitId === unit.id ? 'bg-[#00d2ff] text-black' : 'bg-white/5 text-gray-500' }`}>{idx + 1}</div>
                  <div>
                    <h4 className={`text-xl font-black transition-colors ${expandedUnitId === unit.id ? 'text-[#00d2ff]' : 'text-white'}`}>{unit.title}</h4>
                    <p className="text-xs text-gray-500 mt-1">{unit.lessons?.length || 0} دروس • {unit.description}</p>
                  </div>
                </div>
                <div className={`transform transition-transform ${expandedUnitId === unit.id ? 'rotate-180 text-[#00d2ff]' : 'text-gray-600'}`}>▼</div>
              </button>
              <div className={`transition-all duration-500 ease-in-out ${expandedUnitId === unit.id ? 'max-h-[1000px] opacity-100 pb-8' : 'max-h-0 opacity-0'}`}>
                 <div className="px-8 space-y-3">
                    {unit.lessons?.map((lesson, lIdx) => (
                        <div key={lesson.id} onClick={() => navigateToLesson(lesson)} className={`flex items-center justify-between p-4 rounded-2xl border cursor-pointer transition-all ${isSubscriber ? 'bg-white/5 border-white/5 hover:border-white/10' : 'bg-black/40 border-white/5 opacity-80'}`}>
                           <div className="flex items-center gap-4">
                              <span className="w-8 h-8 rounded-lg flex items-center justify-center text-xs font-black bg-white/5 text-gray-500">
                                  {isSubscriber ? lIdx + 1 : <Lock size={12} className="text-amber-500" />}
                              </span>
                              <p className={`text-sm ${!isSubscriber ? 'text-gray-500' : 'text-gray-200'}`}>{lesson.title}</p>
                           </div>
                           {!isSubscriber && <span className="text-[8px] font-black text-amber-500 bg-amber-500/10 px-2 py-0.5 rounded uppercase">Premium</span>}
                        </div>
                    ))}
                 </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="py-40 text-center opacity-30">
          <span className="text-8xl mb-8 block">📚</span>
          <p className="font-black text-sm uppercase tracking-widest">المحتوى قيد التجهيز</p>
        </div>
      )}
    </div>
  );
};

export default CurriculumBrowser;

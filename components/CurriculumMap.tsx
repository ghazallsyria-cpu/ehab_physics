
import React, { useState } from 'react';
import { PHYSICS_TOPICS } from '../constants';
import { Unit } from '../types';

const CurriculumMap: React.FC = () => {
  const [activeGrade, setActiveGrade] = useState<'10' | '11' | '12'>('12');
  const [expandedUnitId, setExpandedUnitId] = useState<string | null>(null);

  const activeTopic = PHYSICS_TOPICS.find(t => t.grade === activeGrade);

  const navigateToLesson = (lessonId: string) => {
    // In a real app, this would route to the lesson viewer with the specific lesson ID
    window.dispatchEvent(new CustomEvent('change-view', { 
      detail: { view: 'course-content', topicId: activeTopic?.id, lessonId } 
    }));
  };

  return (
    <div className="max-w-7xl mx-auto py-12 px-6 animate-fadeIn font-['Tajawal'] text-white">
      {/* Header */}
      <div className="mb-16 text-center">
        <h2 className="text-5xl font-black mb-4 tracking-tighter">منهج <span className="text-[#00d2ff] text-glow">الفيزياء</span> السوري</h2>
        <p className="text-gray-500 max-w-2xl mx-auto text-lg">
          توزيع المنهج المعتمد لطلاب المرحلة الثانوية - سوريا.
        </p>
      </div>

      {/* Grade Selector Tabs */}
      <div className="flex justify-center mb-12">
        <div className="bg-white/5 p-2 rounded-[25px] flex gap-2 border border-white/10 backdrop-blur-xl">
          {(['10', '11', '12'] as const).map(grade => (
            <button
              key={grade}
              onClick={() => { setActiveGrade(grade); setExpandedUnitId(null); }}
              className={`px-10 py-4 rounded-[20px] font-black text-sm uppercase tracking-widest transition-all ${
                activeGrade === grade 
                  ? 'bg-[#fbbf24] text-black shadow-lg shadow-[#fbbf24]/20 scale-105' 
                  : 'text-gray-500 hover:text-white hover:bg-white/5'
              }`}
            >
              الصف {grade}
            </button>
          ))}
        </div>
      </div>

      {/* Content Area */}
      {activeTopic ? (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 animate-slideUp">
          
          {/* Grade Info Sidebar */}
          <div className="lg:col-span-4 space-y-8">
            <div className="glass-panel p-10 rounded-[50px] border-[#00d2ff]/20 bg-gradient-to-br from-[#00d2ff]/5 to-transparent relative overflow-hidden">
               <div className="absolute top-0 right-0 w-64 h-64 bg-[#00d2ff]/5 rounded-full blur-[80px]"></div>
               <div className="relative z-10">
                 <div className="text-6xl mb-6">{activeTopic.icon}</div>
                 <h3 className="text-3xl font-black mb-2">{activeTopic.title}</h3>
                 <span className="inline-block px-4 py-1.5 bg-[#fbbf24]/10 text-[#fbbf24] rounded-full text-[10px] font-black uppercase tracking-widest mb-6">
                   {activeTopic.grade === '10' ? 'ثانوي عام' : 'القسم العلمي'}
                 </span>
                 <p className="text-gray-400 text-sm leading-relaxed mb-8 border-t border-white/5 pt-6">
                   {activeTopic.description}
                 </p>
                 <div className="flex gap-4">
                    <div className="flex-1 bg-black/40 rounded-2xl p-4 text-center border border-white/5">
                       <p className="text-[10px] text-gray-500 font-bold mb-1">الوحدات</p>
                       <p className="text-xl font-black text-white">{activeTopic.units?.length || 0}</p>
                    </div>
                    <div className="flex-1 bg-black/40 rounded-2xl p-4 text-center border border-white/5">
                       <p className="text-[10px] text-gray-500 font-bold mb-1">المدة</p>
                       <p className="text-xl font-black text-white">{activeTopic.duration || 'فصل'}</p>
                    </div>
                 </div>
               </div>
            </div>
            
            <div className="glass-panel p-8 rounded-[40px] border-white/5 text-center">
               <span className="text-4xl mb-4 block">📚</span>
               <h4 className="font-black text-white mb-2">الكتاب المدرسي</h4>
               <p className="text-xs text-gray-500 mb-6">احرص على متابعة أرقام الصفحات المرفقة مع كل درس.</p>
               <button className="w-full py-3 bg-white/5 border border-white/10 rounded-2xl text-[10px] font-black uppercase hover:bg-white hover:text-black transition-all">
                 تحميل كتاب الطالب PDF
               </button>
            </div>
          </div>

          {/* Units & Lessons Accordion */}
          <div className="lg:col-span-8 space-y-6">
            {activeTopic.units?.map((unit: Unit, idx: number) => (
              <div 
                key={unit.id}
                className={`glass-panel border transition-all duration-500 overflow-hidden ${
                  expandedUnitId === unit.id 
                    ? 'rounded-[40px] border-[#00d2ff]/40 bg-[#00d2ff]/5' 
                    : 'rounded-[30px] border-white/5 hover:border-white/20 bg-white/[0.02]'
                }`}
              >
                {/* Unit Header */}
                <button 
                  onClick={() => setExpandedUnitId(expandedUnitId === unit.id ? null : unit.id)}
                  className="w-full flex items-center justify-between p-8 text-right group"
                >
                  <div className="flex items-center gap-6">
                    <div className={`w-12 h-12 rounded-2xl flex items-center justify-center text-lg font-black transition-all ${
                      expandedUnitId === unit.id ? 'bg-[#00d2ff] text-black shadow-lg shadow-[#00d2ff]/20' : 'bg-white/5 text-gray-500 group-hover:text-white'
                    }`}>
                      {idx + 1}
                    </div>
                    <div>
                      <h4 className={`text-xl font-black transition-colors ${expandedUnitId === unit.id ? 'text-[#00d2ff]' : 'text-white'}`}>
                        {unit.title}
                      </h4>
                      <p className="text-xs text-gray-500 mt-1">{unit.lessons.length} دروس • {unit.description}</p>
                    </div>
                  </div>
                  <div className={`transform transition-transform duration-500 ${expandedUnitId === unit.id ? 'rotate-180 text-[#00d2ff]' : 'text-gray-600'}`}>
                    ▼
                  </div>
                </button>

                {/* Lessons List */}
                <div className={`transition-all duration-500 ease-in-out ${expandedUnitId === unit.id ? 'max-h-[1000px] opacity-100 pb-8' : 'max-h-0 opacity-0'}`}>
                   <div className="px-8 space-y-3">
                      {unit.lessons.map((lesson) => (
                        <div 
                          key={lesson.id}
                          onClick={() => navigateToLesson(lesson.id)}
                          className="flex items-center justify-between p-4 rounded-2xl bg-black/40 border border-white/5 hover:border-[#fbbf24]/30 cursor-pointer group transition-all"
                        >
                           <div className="flex items-center gap-4">
                              <span className={`text-xl ${lesson.type === 'THEORY' ? 'grayscale opacity-50' : ''}`}>
                                {lesson.type === 'THEORY' ? '📖' : lesson.type === 'EXAMPLE' ? '💡' : lesson.type === 'EXERCISE' ? '✍️' : '📝'}
                              </span>
                              <div>
                                 <p className="text-sm font-bold text-gray-300 group-hover:text-white transition-colors">{lesson.title}</p>
                                 {lesson.bookReference && (
                                   <span className="text-[9px] text-[#fbbf24] font-bold bg-[#fbbf24]/10 px-2 py-0.5 rounded ml-2 inline-block mt-1">
                                     {lesson.bookReference}
                                   </span>
                                 )}
                              </div>
                           </div>
                           <div className="flex items-center gap-4">
                              <span className="text-[9px] font-black text-gray-600 uppercase tracking-widest group-hover:text-[#00d2ff] transition-colors">
                                {lesson.type === 'THEORY' ? 'شرح' : lesson.type === 'EXAMPLE' ? 'مثال' : 'تمرين'}
                              </span>
                              <span className="text-gray-600 group-hover:translate-x-[-5px] transition-transform">←</span>
                           </div>
                        </div>
                      ))}
                   </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : (
        <div className="py-32 text-center opacity-40">
           <p>الرجاء اختيار الصف الدراسي لعرض المنهج.</p>
        </div>
      )}
    </div>
  );
};

export default CurriculumMap;

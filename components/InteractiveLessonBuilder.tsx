
import React, { useState, useEffect } from 'react';
import { Lesson, Curriculum, Unit } from '../types';
import AdminUniversalLessonEditor from './AdminUniversalLessonEditor';
import UniversalLessonViewer from './UniversalLessonViewer';
import { Edit, Eye, ArrowLeft, RefreshCw, Save, CheckCircle2, Pin, Layers, BookOpen, AlertCircle, Trash2, X } from 'lucide-react';
import { dbService } from '../services/db';

interface InteractiveLessonBuilderProps {
    initialLesson?: Lesson;
}

const InteractiveLessonBuilder: React.FC<InteractiveLessonBuilderProps> = ({ initialLesson }) => {
  const [mode, setMode] = useState<'EDIT' | 'PREVIEW'>('EDIT');
  const [isSaving, setIsSaving] = useState(false);
  const [showSaveModal, setShowSaveModal] = useState(false);
  
  // Save Modal State
  const [targetGrade, setTargetGrade] = useState<'10'|'11'|'12'>('12');
  const [targetSubject, setTargetSubject] = useState<'Physics'|'Chemistry'>('Physics');
  const [availableUnits, setAvailableUnits] = useState<Unit[]>([]);
  const [selectedUnitId, setSelectedUnitId] = useState<string>('');
  const [isPinned, setIsPinned] = useState(initialLesson?.isPinned || false);
  const [curriculums, setCurriculums] = useState<Curriculum[]>([]);
  const [saveSuccess, setSaveSuccess] = useState(false);

  // Initial state setup
  const [currentLesson, setCurrentLesson] = useState<Lesson>(initialLesson || {
    id: `temp_${Date.now()}`,
    title: 'عنوان الدرس الجديد',
    type: 'THEORY',
    duration: '15 د',
    templateType: 'UNIVERSAL',
    isPinned: false,
    content: [],
    universalConfig: {
        introduction: 'اكتب مقدمة الدرس هنا...',
        objectives: ['الهدف الأول', 'الهدف الثاني'],
        mainEquation: 'F = m \\times a',
        calculationFormula: 'm * a',
        resultUnit: 'Newton (N)',
        variables: [
            { id: 'm', name: 'الكتلة', symbol: 'm', unit: 'kg', defaultValue: 10, min: 1, max: 100, step: 1 },
            { id: 'a', name: 'التسارع', symbol: 'a', unit: 'm/s^2', defaultValue: 5, min: 0, max: 50, step: 0.5 }
        ],
        interactiveQuiz: {
            question: 'ماذا يحدث للقوة إذا تضاعفت الكتلة؟',
            options: ['تتضاعف', 'تقل للنصف', 'تبقى ثابتة'],
            correctIndex: 0
        },
        graphConfig: {
            xAxisVariableId: 'a',
            yAxisLabel: 'القوة (F)',
            chartType: 'line',
            lineColor: '#00d2ff'
        }
    }
  });

  // Keep lesson state in sync with initialLesson if provided (for editing mode)
  useEffect(() => {
    if (initialLesson) {
        setCurrentLesson(initialLesson);
        setIsPinned(initialLesson.isPinned || false);
    }
  }, [initialLesson]);

  const handleUpdateDraft = (updatedLesson: Lesson) => {
      setCurrentLesson(updatedLesson);
      // Only save temp draft to localStorage for new lessons
      if (!initialLesson) {
          localStorage.setItem('ssc_draft_lesson', JSON.stringify(updatedLesson));
      }
  };

  // Load curriculums when modal opens
  useEffect(() => {
      if (showSaveModal) {
          const loadCurriculums = async () => {
              const data = await dbService.getCurriculum();
              setCurriculums(data);
              updateAvailableUnits(data, targetGrade, targetSubject);
          };
          loadCurriculums();
      }
  }, [showSaveModal]);

  // Update units list when grade/subject changes in modal
  useEffect(() => {
      if (curriculums.length > 0) {
          updateAvailableUnits(curriculums, targetGrade, targetSubject);
      }
  }, [targetGrade, targetSubject]);

  const updateAvailableUnits = (data: Curriculum[], grade: string, subject: string) => {
      const targetCurriculum = data.find(c => c.grade === grade && c.subject === subject);
      const units = targetCurriculum?.units || [];
      setAvailableUnits(units);
      if (units.length > 0) {
          setSelectedUnitId(units[0].id);
      } else {
          setSelectedUnitId('');
      }
  };

  const handleSaveToDB = async () => {
      setIsSaving(true);
      try {
          const targetCurriculum = curriculums.find(c => c.grade === targetGrade && c.subject === targetSubject);
          if (!targetCurriculum) {
              alert("خطأ: المنهج غير موجود.");
              setIsSaving(false);
              return;
          }

          let finalUnitId = selectedUnitId;
          if (!finalUnitId) {
              const newUnit = { 
                  id: `u_${Date.now()}`, 
                  title: 'وحدة الدروس التفاعلية', 
                  description: 'تم إنشاؤها تلقائياً', 
                  lessons: [] 
              };
              await dbService.saveUnit(targetCurriculum.id!, newUnit, targetGrade, targetSubject as any);
              finalUnitId = newUnit.id;
          }

          const finalLesson: Lesson = { 
              ...currentLesson, 
              id: currentLesson.id.startsWith('temp') ? `l_${Date.now()}` : currentLesson.id,
              isPinned: isPinned
          };
          
          await dbService.saveLesson(targetCurriculum.id!, finalUnitId, finalLesson);
          
          setSaveSuccess(true);
          localStorage.removeItem('ssc_draft_lesson');
          
          setTimeout(() => {
              setSaveSuccess(false);
              setShowSaveModal(false);
              window.dispatchEvent(new CustomEvent('change-view', { detail: { view: 'dashboard' } }));
          }, 2000);
          
      } catch (e: any) {
          console.error(e);
          alert(`فشل الحفظ: ${e.message}`);
      } finally {
          setIsSaving(false);
      }
  };

  return (
    <div className="min-h-screen bg-[#0A2540] font-['Tajawal']" dir="rtl">
        {/* Navigation bar */}
        <div className="fixed top-0 left-0 right-0 z-[100] bg-[#0a1118]/90 backdrop-blur-md border-b border-white/10 px-6 py-4 flex justify-between items-center shadow-2xl">
            <div className="flex items-center gap-4">
                <button onClick={() => window.dispatchEvent(new CustomEvent('change-view', { detail: { view: 'dashboard' } }))} className="p-2 bg-white/5 rounded-full hover:bg-white/10 transition-all text-white">
                    <ArrowLeft size={20} />
                </button>
                <h2 className="text-xl font-black text-white flex items-center gap-2">
                    مختبر <span className="text-[#00d2ff]">الدروس الذكية</span>
                    {initialLesson && <span className="mr-4 px-3 py-1 bg-blue-500/20 text-blue-400 text-[10px] rounded-full uppercase border border-blue-500/30">وضع التعديل</span>}
                </h2>
            </div>
            
            <div className="flex bg-black/40 p-1 rounded-xl border border-white/10">
                <button 
                    onClick={() => setMode('EDIT')} 
                    className={`flex items-center gap-2 px-6 py-2 rounded-lg text-xs font-bold transition-all ${mode === 'EDIT' ? 'bg-[#fbbf24] text-black shadow-lg' : 'text-gray-400 hover:text-white'}`}
                >
                    <Edit size={14} /> التحرير
                </button>
                <button 
                    onClick={() => setMode('PREVIEW')} 
                    className={`flex items-center gap-2 px-6 py-2 rounded-lg text-xs font-bold transition-all ${mode === 'PREVIEW' ? 'bg-[#00d2ff] text-black shadow-lg' : 'text-gray-400 hover:text-white'}`}
                >
                    <Eye size={14} /> المعاينة
                </button>
            </div>
        </div>

        {/* Builder Content */}
        <div className="pt-20 h-screen overflow-hidden">
            {mode === 'EDIT' ? (
                <div className="h-full overflow-y-auto no-scrollbar pb-20 animate-fadeIn">
                    <AdminUniversalLessonEditor 
                        initialLesson={currentLesson} 
                        onSave={(lesson) => {
                            handleUpdateDraft(lesson);
                            setShowSaveModal(true);
                        }}
                        onCancel={() => window.dispatchEvent(new CustomEvent('change-view', { detail: { view: 'dashboard' } }))}
                    />
                </div>
            ) : (
                <div className="h-full overflow-y-auto pb-20 animate-slideUp bg-[#0A2540]">
                    <UniversalLessonViewer 
                        lesson={currentLesson} 
                        onBack={() => setMode('EDIT')} 
                        onComplete={() => alert("تجربة ناجحة!")}
                        isCompleted={false}
                    />
                </div>
            )}
        </div>
        
        {/* Modern Save Modal */}
        {showSaveModal && (
            <div className="fixed inset-0 z-[250] bg-black/95 backdrop-blur-md flex items-center justify-center p-4 animate-fadeIn">
                <div className="bg-[#0a1118] border border-white/10 w-full max-w-lg rounded-[40px] p-8 shadow-3xl relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-64 h-64 bg-[#00d2ff]/10 rounded-full blur-[80px]"></div>
                    
                    {saveSuccess ? (
                        <div className="flex flex-col items-center justify-center py-10 animate-slideUp">
                            <div className="w-20 h-20 bg-green-500 rounded-full flex items-center justify-center mb-6 shadow-[0_0_30px_#22c55e]">
                                <CheckCircle2 size={40} className="text-white" />
                            </div>
                            <h3 className="text-2xl font-black text-white mb-2">تم النشر بنجاح!</h3>
                            <p className="text-gray-400">سيتم إعادة توجيهك الآن...</p>
                        </div>
                    ) : (
                        <>
                            <div className="flex justify-between items-center mb-8 relative z-10">
                                <h3 className="text-2xl font-black text-white flex items-center gap-3">
                                    <Save className="text-[#fbbf24]" /> نشر الدرس التفاعلي
                                </h3>
                                <button onClick={() => setShowSaveModal(false)} className="text-gray-500 hover:text-white transition-colors"><X/></button>
                            </div>
                            
                            <div className="space-y-6 relative z-10">
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest">الصف الدراسي</label>
                                        <select 
                                            value={targetGrade} 
                                            onChange={e => setTargetGrade(e.target.value as any)}
                                            className="w-full bg-black/40 border border-white/10 rounded-2xl px-4 py-3 text-white outline-none focus:border-[#00d2ff]"
                                        >
                                            <option value="10">الصف 10</option>
                                            <option value="11">الصف 11</option>
                                            <option value="12">الصف 12</option>
                                        </select>
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest">المادة</label>
                                        <select 
                                            value={targetSubject} 
                                            onChange={e => setTargetSubject(e.target.value as any)}
                                            className="w-full bg-black/40 border border-white/10 rounded-2xl px-4 py-3 text-white outline-none focus:border-[#00d2ff]"
                                        >
                                            <option value="Physics">الفيزياء</option>
                                            <option value="Chemistry">الكيمياء</option>
                                        </select>
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest flex items-center gap-2">
                                        <Layers size={12}/> الوحدة الدراسية
                                    </label>
                                    {availableUnits.length > 0 ? (
                                        <select 
                                            value={selectedUnitId} 
                                            onChange={e => setSelectedUnitId(e.target.value)}
                                            className="w-full bg-black/40 border border-white/10 rounded-2xl px-4 py-3 text-white outline-none focus:border-[#00d2ff]"
                                        >
                                            {availableUnits.map(u => (
                                                <option key={u.id} value={u.id}>{u.title}</option>
                                            ))}
                                        </select>
                                    ) : (
                                        <div className="p-3 bg-yellow-500/10 border border-yellow-500/20 rounded-2xl text-xs text-yellow-500 flex items-center gap-2">
                                            <AlertCircle size={14}/> سيتم إنشاء وحدة جديدة تلقائياً.
                                        </div>
                                    )}
                                </div>

                                <div 
                                    onClick={() => setIsPinned(!isPinned)}
                                    className={`p-4 rounded-2xl border transition-all cursor-pointer flex items-center justify-between ${isPinned ? 'bg-[#fbbf24]/10 border-[#fbbf24] text-[#fbbf24]' : 'bg-white/5 border-white/10 text-gray-400 hover:bg-white/10'}`}
                                >
                                    <div className="flex items-center gap-3">
                                        <Pin size={20} fill={isPinned ? "currentColor" : "none"} />
                                        <div className="text-right">
                                            <p className="font-bold text-sm">تثبيت وتمييز الدرس</p>
                                            <p className="text-[10px] opacity-70">سيظهر بلون ذهبي وفي أعلى قائمة الدروس.</p>
                                        </div>
                                    </div>
                                    <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center ${isPinned ? 'border-[#fbbf24] bg-[#fbbf24]' : 'border-gray-600'}`}>
                                        {isPinned && <CheckCircle2 size={16} className="text-black" />}
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 gap-4 mt-8">
                                    <button 
                                        onClick={() => setShowSaveModal(false)}
                                        className="py-4 rounded-2xl font-bold text-xs uppercase bg-white/5 text-gray-400 hover:text-white"
                                    >
                                        إلغاء
                                    </button>
                                    <button 
                                        onClick={handleSaveToDB}
                                        disabled={isSaving}
                                        className="py-4 rounded-2xl font-bold text-xs uppercase bg-[#00d2ff] text-black shadow-lg hover:scale-105 transition-all flex items-center justify-center gap-2"
                                    >
                                        {isSaving ? <RefreshCw className="animate-spin" size={16}/> : <Save size={16}/>}
                                        اعتماد ونشر
                                    </button>
                                </div>
                            </div>
                        </>
                    )}
                </div>
            </div>
        )}
    </div>
  );
};

export default InteractiveLessonBuilder;

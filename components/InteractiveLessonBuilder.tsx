
import React, { useState } from 'react';
import { Lesson } from '../types';
import AdminUniversalLessonEditor from './AdminUniversalLessonEditor';
import UniversalLessonViewer from './UniversalLessonViewer';
import { Edit, Eye, ArrowLeft, RefreshCw, Save } from 'lucide-react';
import { dbService } from '../services/db';

const InteractiveLessonBuilder: React.FC = () => {
  const [mode, setMode] = useState<'EDIT' | 'PREVIEW'>('EDIT');
  const [isSaving, setIsSaving] = useState(false);
  const [saveMessage, setSaveMessage] = useState<string | null>(null);
  
  // الحالة المبدئية للدرس
  const [currentLesson, setCurrentLesson] = useState<Lesson>({
    id: `temp_${Date.now()}`,
    title: 'عنوان الدرس الجديد',
    type: 'THEORY',
    duration: '15 د',
    templateType: 'UNIVERSAL',
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

  // تحديث الحالة عند التعديل في المحرر
  const handleUpdateDraft = (updatedLesson: Lesson) => {
      setCurrentLesson(updatedLesson);
      // حفظ تلقائي في LocalStorage للحماية من فقدان البيانات أثناء العمل
      localStorage.setItem('ssc_draft_lesson', JSON.stringify(updatedLesson));
  };

  const handleSaveToDB = async (lessonToSave: Lesson) => {
      setIsSaving(true);
      setSaveMessage(null);
      
      // نطلب من المستخدم تحديد الصف والمادة (مؤقتاً، يمكن تحسينها لتكون داخل المحرر)
      const targetGrade = prompt("أدخل الصف المستهدف (10, 11, 12, uni):", "12");
      if (!targetGrade) { setIsSaving(false); return; }
      
      const targetSubject = prompt("أدخل المادة (Physics, Chemistry):", "Physics");
      if (!targetSubject) { setIsSaving(false); return; }

      // نحتاج وحدة (Unit) لحفظ الدرس فيها. سأقوم بإنشاء وحدة "مسودات" أو طلب ID الوحدة
      // للتبسيط في هذا الرد، سنبحث عن المنهج ونضيفها لأول وحدة، أو نطلب Unit ID
      const unitId = prompt("أدخل معرف الوحدة (Unit ID) لإضافة الدرس إليها (أو اترك فارغاً للإنشاء في وحدة جديدة):");
      
      try {
          // جلب المنهج المناسب
          const curriculums = await dbService.getCurriculum();
          let targetCurriculum = curriculums.find(c => c.grade === targetGrade && c.subject === targetSubject);
          
          if (!targetCurriculum) {
              // إنشاء منهج جديد إذا لم يوجد
              // (هذا جزء متقدم، سنفترض وجود المنهج أو نعطي خطأ)
              alert("لم يتم العثور على منهج لهذا الصف والمادة. يرجى إنشاؤه أولاً من إدارة المناهج.");
              setIsSaving(false);
              return;
          }

          let targetUnitId = unitId;
          
          // إذا لم يحدد وحدة، ننشئ وحدة "دروس تفاعلية جديدة"
          if (!targetUnitId) {
              const newUnit = { 
                  id: `u_${Date.now()}`, 
                  title: 'دروس تفاعلية جديدة', 
                  description: 'تم إنشاؤها عبر الباني الذكي', 
                  lessons: [] 
              };
              await dbService.saveUnit(targetCurriculum.id!, newUnit, targetGrade, targetSubject as any);
              targetUnitId = newUnit.id;
          }

          // حفظ الدرس
          // تأكد من أن الـ ID ليس temp
          const finalLesson = { ...lessonToSave, id: lessonToSave.id.startsWith('temp') ? `l_${Date.now()}` : lessonToSave.id };
          
          await dbService.saveLesson(targetCurriculum.id!, targetUnitId!, finalLesson);
          
          setSaveMessage("تم الحفظ في قاعدة البيانات بنجاح! ✅");
          localStorage.removeItem('ssc_draft_lesson'); // مسح المسودة
          
      } catch (e: any) {
          console.error(e);
          setSaveMessage(`فشل الحفظ: ${e.message}`);
      } finally {
          setIsSaving(false);
          setTimeout(() => setSaveMessage(null), 5000);
      }
  };

  return (
    <div className="min-h-screen bg-[#0A2540] font-['Tajawal']" dir="rtl">
        {/* شريط التحكم العلوي */}
        <div className="fixed top-0 left-0 right-0 z-[100] bg-[#0a1118]/90 backdrop-blur-md border-b border-white/10 px-6 py-4 flex justify-between items-center shadow-2xl">
            <div className="flex items-center gap-4">
                <button onClick={() => window.dispatchEvent(new CustomEvent('change-view', { detail: { view: 'dashboard' } }))} className="p-2 bg-white/5 rounded-full hover:bg-white/10 transition-all text-white">
                    <ArrowLeft size={20} />
                </button>
                <div>
                    <h2 className="text-xl font-black text-white flex items-center gap-2">
                        مختبر <span className="text-[#00d2ff]">الدروس الذكية</span>
                    </h2>
                    {saveMessage && <span className="text-[10px] font-bold text-green-400 animate-pulse">{saveMessage}</span>}
                </div>
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

        {/* منطقة المحتوى */}
        <div className="pt-20 h-screen overflow-hidden">
            {mode === 'EDIT' ? (
                <div className="h-full overflow-y-auto no-scrollbar pb-20 animate-fadeIn">
                    {/* شريط معلومات سريع */}
                    <div className="max-w-6xl mx-auto px-6 mb-6 mt-4">
                        <div className="bg-blue-500/10 border border-blue-500/20 p-4 rounded-2xl text-blue-300 text-xs font-bold flex items-center gap-3">
                            <Save size={16} />
                            <span>يتم حفظ المسودة محلياً تلقائياً. اضغط "حفظ النظام" داخل المحرر للنشر في قاعدة البيانات.</span>
                        </div>
                    </div>
                    
                    <AdminUniversalLessonEditor 
                        initialLesson={currentLesson} 
                        onSave={(lesson) => {
                            handleUpdateDraft(lesson); // تحديث الحالة المحلية
                            handleSaveToDB(lesson);    // الحفظ في القاعدة
                        }}
                        onCancel={() => window.dispatchEvent(new CustomEvent('change-view', { detail: { view: 'dashboard' } }))}
                    />
                </div>
            ) : (
                <div className="h-full overflow-y-auto pb-20 animate-slideUp bg-[#0A2540]">
                    <UniversalLessonViewer 
                        lesson={currentLesson} 
                        onBack={() => setMode('EDIT')} 
                        onComplete={() => alert("تجربة ناجحة! الوضع التفاعلي يعمل بشكل صحيح.")}
                        isCompleted={false}
                    />
                </div>
            )}
        </div>
        
        {isSaving && (
            <div className="fixed inset-0 z-[200] bg-black/80 backdrop-blur-sm flex flex-col items-center justify-center text-white">
                <RefreshCw className="w-16 h-16 text-[#00d2ff] animate-spin mb-4" />
                <p className="text-xl font-black">جاري الحفظ في السحابة...</p>
            </div>
        )}
    </div>
  );
};

export default InteractiveLessonBuilder;

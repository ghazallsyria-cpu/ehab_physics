
import React, { useState } from 'react';
import { Lesson } from '../types';
import AdminUniversalLessonEditor from './AdminUniversalLessonEditor';
import UniversalLessonViewer from './UniversalLessonViewer';
import { Edit, Eye, ArrowLeft } from 'lucide-react';

const InteractiveLessonBuilder: React.FC = () => {
  const [mode, setMode] = useState<'EDIT' | 'PREVIEW'>('EDIT');
  
  // الحالة المبدئية للدرس (قالب فارغ جاهز للتعديل)
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

  const handleSaveDraft = (updatedLesson: Lesson) => {
      setCurrentLesson(updatedLesson);
      setMode('PREVIEW');
  };

  return (
    <div className="min-h-screen bg-[#0A2540] font-['Tajawal']" dir="rtl">
        {/* شريط التحكم العلوي */}
        <div className="fixed top-0 left-0 right-0 z-[100] bg-[#0a1118]/90 backdrop-blur-md border-b border-white/10 px-6 py-4 flex justify-between items-center">
            <div className="flex items-center gap-4">
                <button onClick={() => window.dispatchEvent(new CustomEvent('change-view', { detail: { view: 'dashboard' } }))} className="p-2 bg-white/5 rounded-full hover:bg-white/10 transition-all text-white">
                    <ArrowLeft size={20} />
                </button>
                <h2 className="text-xl font-black text-white">مختبر بناء الدروس التفاعلية</h2>
            </div>
            
            <div className="flex bg-black/40 p-1 rounded-xl border border-white/10">
                <button 
                    onClick={() => setMode('EDIT')} 
                    className={`flex items-center gap-2 px-6 py-2 rounded-lg text-xs font-bold transition-all ${mode === 'EDIT' ? 'bg-[#fbbf24] text-black shadow-lg' : 'text-gray-400 hover:text-white'}`}
                >
                    <Edit size={14} /> التحرير والبناء
                </button>
                <button 
                    onClick={() => setMode('PREVIEW')} 
                    className={`flex items-center gap-2 px-6 py-2 rounded-lg text-xs font-bold transition-all ${mode === 'PREVIEW' ? 'bg-[#00d2ff] text-black shadow-lg' : 'text-gray-400 hover:text-white'}`}
                >
                    <Eye size={14} /> المعاينة الحية
                </button>
            </div>
        </div>

        {/* منطقة المحتوى */}
        <div className="pt-20">
            {mode === 'EDIT' ? (
                <div className="animate-fadeIn">
                    <div className="max-w-6xl mx-auto px-6 mb-6">
                        <div className="bg-blue-500/10 border border-blue-500/20 p-4 rounded-2xl text-blue-300 text-sm font-bold text-center">
                            💡 نصيحة: قم بتعريف المتغيرات والقانون الرياضي، وسيقوم النظام تلقائياً بإنشاء المحاكاة والرسوم البيانية في وضع المعاينة.
                        </div>
                    </div>
                    <AdminUniversalLessonEditor 
                        initialLesson={currentLesson} 
                        onSave={handleSaveDraft}
                        onCancel={() => window.dispatchEvent(new CustomEvent('change-view', { detail: { view: 'dashboard' } }))}
                    />
                </div>
            ) : (
                <div className="animate-slideUp">
                    <UniversalLessonViewer 
                        lesson={currentLesson} 
                        onBack={() => setMode('EDIT')} 
                        onComplete={() => alert("تجربة ناجحة! يمكنك الآن حفظ الدرس من وضع التحرير.")}
                        isCompleted={false}
                    />
                </div>
            )}
        </div>
    </div>
  );
};

export default InteractiveLessonBuilder;
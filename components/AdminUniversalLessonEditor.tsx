
import React, { useState } from 'react';
import { Lesson, UniversalLessonConfig, ContentBlock } from '../types';
import { Save, Plus, Trash2, Sliders, LineChart, MessageSquare, X } from 'lucide-react';

interface AdminUniversalLessonEditorProps {
  initialLesson: Partial<Lesson>;
  onSave: (lesson: Lesson) => void;
  onCancel: () => void;
}

const AdminUniversalLessonEditor: React.FC<AdminUniversalLessonEditorProps> = ({ initialLesson, onSave, onCancel }) => {
  const [lesson, setLesson] = useState<Partial<Lesson>>({
    ...initialLesson,
    templateType: 'UNIVERSAL',
    // Ensure config object exists
    universalConfig: initialLesson.universalConfig || {
        objectives: [],
        introduction: '',
        mainEquation: '',
        variables: [],
        calculationFormula: '',
        resultUnit: '',
        interactiveQuiz: { question: '', options: ['', '', ''], correctIndex: 0 }
    }
  });

  const config = lesson.universalConfig!;

  const updateConfig = (field: keyof UniversalLessonConfig, value: any) => {
    setLesson(prev => ({
        ...prev,
        universalConfig: { ...prev.universalConfig!, [field]: value }
    }));
  };

  const addVariable = () => {
    const newVar = { id: `var_${Date.now()}`, symbol: 'x', name: 'Variable', unit: 'unit', defaultValue: 10, min: 0, max: 100, step: 1 };
    updateConfig('variables', [...config.variables, newVar]);
  };

  const updateVariable = (idx: number, field: string, value: any) => {
    const vars = [...config.variables];
    vars[idx] = { ...vars[idx], [field]: value };
    updateConfig('variables', vars);
  };

  const removeVariable = (idx: number) => {
    const vars = [...config.variables];
    vars.splice(idx, 1);
    updateConfig('variables', vars);
  };

  const addObjective = () => updateConfig('objectives', [...config.objectives, '']);
  const updateObjective = (idx: number, val: string) => {
      const objs = [...config.objectives];
      objs[idx] = val;
      updateConfig('objectives', objs);
  };

  const handleSave = () => {
      if (!lesson.title || !config.mainEquation || !config.calculationFormula) {
          alert("يرجى ملء الحقول الأساسية: العنوان، المعادلة، وصيغة الحساب.");
          return;
      }
      onSave(lesson as Lesson);
  };

  // Helper to add standard content blocks inside this editor too
  const addContentBlock = () => {
      const currentContent = lesson.content || [];
      setLesson({...lesson, content: [...currentContent, { type: 'text', content: '', caption: 'عنوان القسم' }]});
  };

  const updateContentBlock = (idx: number, field: keyof ContentBlock, val: string) => {
      const content = [...(lesson.content || [])];
      content[idx] = { ...content[idx], [field]: val };
      setLesson({...lesson, content});
  };

  return (
    <div className="max-w-6xl mx-auto py-10 font-['Tajawal'] text-right text-white" dir="rtl">
        <header className="flex justify-between items-center mb-10">
            <div>
                <h2 className="text-3xl font-black text-[#fbbf24]">منشئ الدروس التفاعلية الذكي</h2>
                <p className="text-gray-500 text-sm">قم بتعريف القوانين والمتغيرات، وسيقوم النظام ببناء المحاكاة تلقائياً.</p>
            </div>
            <div className="flex gap-4">
                <button onClick={onCancel} className="px-6 py-3 rounded-2xl bg-white/5 hover:bg-white/10 transition-all font-bold text-sm">إلغاء</button>
                <button onClick={handleSave} className="px-8 py-3 rounded-2xl bg-[#fbbf24] text-black font-black text-sm uppercase tracking-widest hover:scale-105 transition-all shadow-xl">حفظ ونشر</button>
            </div>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
            {/* Left Column: Settings */}
            <div className="lg:col-span-8 space-y-8">
                <div className="glass-panel p-8 rounded-[40px] border-white/5 bg-black/40 space-y-6">
                    <h3 className="text-xl font-bold text-white border-b border-white/5 pb-4">البيانات الأساسية</h3>
                    <div className="grid grid-cols-2 gap-6">
                        <div className="col-span-2">
                            <label className="block text-xs font-bold text-gray-500 mb-2">عنوان الدرس</label>
                            <input type="text" value={lesson.title || ''} onChange={e => setLesson({...lesson, title: e.target.value})} className="w-full bg-black/40 border border-white/10 rounded-xl p-4 text-white outline-none focus:border-[#fbbf24]" />
                        </div>
                        <div className="col-span-2">
                            <label className="block text-xs font-bold text-gray-500 mb-2">مقدمة الدرس</label>
                            <textarea value={config.introduction} onChange={e => updateConfig('introduction', e.target.value)} className="w-full h-32 bg-black/40 border border-white/10 rounded-xl p-4 text-white outline-none focus:border-[#fbbf24]" />
                        </div>
                        <div>
                            <label className="block text-xs font-bold text-gray-500 mb-2">معادلة العرض (LaTeX)</label>
                            <input type="text" placeholder="مثال: E = mc^2" value={config.mainEquation} onChange={e => updateConfig('mainEquation', e.target.value)} className="w-full bg-black/40 border border-white/10 rounded-xl p-4 text-yellow-400 font-mono text-sm outline-none ltr text-left" />
                        </div>
                        <div>
                            <label className="block text-xs font-bold text-gray-500 mb-2">صيغة الحساب (JS Syntax)</label>
                            <input type="text" placeholder="مثال: m * Math.pow(c, 2)" value={config.calculationFormula} onChange={e => updateConfig('calculationFormula', e.target.value)} className="w-full bg-black/40 border border-white/10 rounded-xl p-4 text-green-400 font-mono text-sm outline-none ltr text-left" />
                        </div>
                    </div>
                </div>

                {/* Variables Section */}
                <div className="glass-panel p-8 rounded-[40px] border-white/5 bg-black/40">
                    <div className="flex justify-between items-center mb-6">
                        <h3 className="text-xl font-bold text-white flex items-center gap-2"><Sliders size={20}/> المتغيرات (Inputs)</h3>
                        <button onClick={addVariable} className="text-xs bg-[#00d2ff]/10 text-[#00d2ff] px-4 py-2 rounded-lg font-bold hover:bg-[#00d2ff] hover:text-black transition-all">+ متغير</button>
                    </div>
                    <div className="space-y-4">
                        {config.variables.map((v, idx) => (
                            <div key={idx} className="p-4 bg-white/5 rounded-2xl border border-white/5 grid grid-cols-6 gap-4 items-end">
                                <div className="col-span-1">
                                    <label className="text-[9px] text-gray-500 block">ID (JS)</label>
                                    <input type="text" value={v.id} onChange={e => updateVariable(idx, 'id', e.target.value)} className="w-full bg-black/40 rounded-lg p-2 text-xs text-green-400 font-mono" />
                                </div>
                                <div className="col-span-1">
                                    <label className="text-[9px] text-gray-500 block">الرمز (LaTeX)</label>
                                    <input type="text" value={v.symbol} onChange={e => updateVariable(idx, 'symbol', e.target.value)} className="w-full bg-black/40 rounded-lg p-2 text-xs text-yellow-400 font-mono" />
                                </div>
                                <div className="col-span-2">
                                    <label className="text-[9px] text-gray-500 block">الاسم</label>
                                    <input type="text" value={v.name} onChange={e => updateVariable(idx, 'name', e.target.value)} className="w-full bg-black/40 rounded-lg p-2 text-xs text-white" />
                                </div>
                                <div className="col-span-1">
                                    <label className="text-[9px] text-gray-500 block">الوحدة</label>
                                    <input type="text" value={v.unit} onChange={e => updateVariable(idx, 'unit', e.target.value)} className="w-full bg-black/40 rounded-lg p-2 text-xs text-white" />
                                </div>
                                <button onClick={() => removeVariable(idx)} className="bg-red-500/20 text-red-500 p-2 rounded-lg hover:bg-red-500 hover:text-white transition-all"><Trash2 size={16}/></button>
                                
                                {/* Sliders Config Row */}
                                <div className="col-span-6 grid grid-cols-4 gap-4 mt-2 border-t border-white/5 pt-2">
                                    <input type="number" placeholder="Min" value={v.min} onChange={e => updateVariable(idx, 'min', Number(e.target.value))} className="bg-black/40 rounded-lg p-2 text-xs text-gray-400" />
                                    <input type="number" placeholder="Max" value={v.max} onChange={e => updateVariable(idx, 'max', Number(e.target.value))} className="bg-black/40 rounded-lg p-2 text-xs text-gray-400" />
                                    <input type="number" placeholder="Step" value={v.step} onChange={e => updateVariable(idx, 'step', Number(e.target.value))} className="bg-black/40 rounded-lg p-2 text-xs text-gray-400" />
                                    <input type="number" placeholder="Default" value={v.defaultValue} onChange={e => updateVariable(idx, 'defaultValue', Number(e.target.value))} className="bg-black/40 rounded-lg p-2 text-xs text-[#00d2ff] font-bold" />
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Content Sections */}
                <div className="glass-panel p-8 rounded-[40px] border-white/5 bg-black/40">
                    <div className="flex justify-between items-center mb-6">
                        <h3 className="text-xl font-bold text-white">المحتوى النصي والإثرائي</h3>
                        <button onClick={addContentBlock} className="text-xs bg-white/10 px-4 py-2 rounded-lg font-bold hover:bg-white/20">+ قسم جديد</button>
                    </div>
                    <div className="space-y-6">
                        {lesson.content?.map((block, idx) => (
                            <div key={idx} className="p-4 bg-white/5 rounded-2xl border border-white/5">
                                <input type="text" placeholder="عنوان القسم" value={block.caption || ''} onChange={e => updateContentBlock(idx, 'caption', e.target.value)} className="w-full bg-transparent border-b border-white/10 pb-2 mb-4 text-white font-bold text-lg outline-none focus:border-[#fbbf24]" />
                                <textarea value={block.content} onChange={e => updateContentBlock(idx, 'content', e.target.value)} placeholder="محتوى النص (HTML/Text)..." className="w-full h-32 bg-black/40 rounded-xl p-4 text-gray-300 text-sm outline-none" />
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* Right Column: Extras */}
            <div className="lg:col-span-4 space-y-8">
                <div className="glass-panel p-6 rounded-[40px] border-white/5 bg-black/40">
                    <h3 className="text-lg font-bold text-[#fbbf24] mb-4 flex items-center gap-2"><LineChart size={18}/> إعدادات الرسم البياني</h3>
                    <div className="space-y-4">
                        <div>
                            <label className="text-xs text-gray-500 block mb-1">متغير المحور السيني (X)</label>
                            <select 
                                value={config.graphConfig?.xAxisVariableId || ''} 
                                onChange={e => updateConfig('graphConfig', { ...config.graphConfig, xAxisVariableId: e.target.value })}
                                className="w-full bg-black/40 rounded-lg p-3 text-sm text-white border border-white/10"
                            >
                                <option value="">اختر متغير...</option>
                                {config.variables.map(v => <option key={v.id} value={v.id}>{v.name}</option>)}
                            </select>
                        </div>
                        <div>
                            <label className="text-xs text-gray-500 block mb-1">عنوان المحور الصادي (Y)</label>
                            <input 
                                type="text" 
                                value={config.graphConfig?.yAxisLabel || ''} 
                                onChange={e => updateConfig('graphConfig', { ...config.graphConfig, yAxisLabel: e.target.value })}
                                className="w-full bg-black/40 rounded-lg p-3 text-sm text-white border border-white/10" 
                            />
                        </div>
                        <div>
                            <label className="text-xs text-gray-500 block mb-1">وحدة النتيجة النهائية</label>
                            <input 
                                type="text" 
                                value={config.resultUnit} 
                                onChange={e => updateConfig('resultUnit', e.target.value)}
                                placeholder="Joule, Newton..."
                                className="w-full bg-black/40 rounded-lg p-3 text-sm text-[#00d2ff] font-bold border border-white/10" 
                            />
                        </div>
                    </div>
                </div>

                <div className="glass-panel p-6 rounded-[40px] border-white/5 bg-black/40">
                    <h3 className="text-lg font-bold text-green-400 mb-4 flex items-center gap-2"><MessageSquare size={18}/> اختبار الفهم</h3>
                    <div className="space-y-4">
                        <textarea 
                            placeholder="السؤال التفاعلي..." 
                            value={config.interactiveQuiz?.question || ''}
                            onChange={e => updateConfig('interactiveQuiz', { ...config.interactiveQuiz, question: e.target.value })}
                            className="w-full h-20 bg-black/40 rounded-lg p-3 text-sm text-white border border-white/10 resize-none"
                        />
                        {config.interactiveQuiz?.options.map((opt, i) => (
                            <div key={i} className="flex gap-2 items-center">
                                <input 
                                    type="radio" 
                                    name="correctOpt" 
                                    checked={config.interactiveQuiz?.correctIndex === i} 
                                    onChange={() => updateConfig('interactiveQuiz', { ...config.interactiveQuiz, correctIndex: i })}
                                />
                                <input 
                                    type="text" 
                                    value={opt} 
                                    onChange={e => {
                                        const newOpts = [...(config.interactiveQuiz?.options || [])];
                                        newOpts[i] = e.target.value;
                                        updateConfig('interactiveQuiz', { ...config.interactiveQuiz, options: newOpts });
                                    }}
                                    className="flex-1 bg-black/40 rounded-lg p-2 text-xs text-white border border-white/10"
                                    placeholder={`خيار ${i+1}`}
                                />
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    </div>
  );
};

export default AdminUniversalLessonEditor;

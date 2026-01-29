
import React, { useState } from 'react';
import { Lesson, UniversalLessonConfig, ContentBlock } from '../types';
import { Save, Plus, Trash2, Sliders, LineChart, MessageSquare, X, BarChart, Activity, Layers, Settings, Variable } from 'lucide-react';

interface AdminUniversalLessonEditorProps {
  initialLesson: Partial<Lesson>;
  onSave: (lesson: Lesson) => void;
  onCancel: () => void;
}

const AdminUniversalLessonEditor: React.FC<AdminUniversalLessonEditorProps> = ({ initialLesson, onSave, onCancel }) => {
  const [lesson, setLesson] = useState<Partial<Lesson>>({
    ...initialLesson,
    templateType: 'UNIVERSAL',
    universalConfig: initialLesson.universalConfig || {
        objectives: [],
        introduction: '',
        mainEquation: '',
        variables: [],
        calculationFormula: '',
        resultUnit: '',
        interactiveQuiz: { question: '', options: ['', '', ''], correctIndex: 0 },
        graphConfig: {
            xAxisVariableId: '',
            yAxisLabel: 'النتيجة',
            chartType: 'line',
            lineColor: '#00d2ff'
        }
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

  const handleSave = () => {
      if (!lesson.title || !config.mainEquation || !config.calculationFormula) {
          alert("يرجى ملء الحقول الأساسية: العنوان، المعادلة، وصيغة الحساب.");
          return;
      }
      onSave(lesson as Lesson);
  };

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
    <div className="max-w-7xl mx-auto py-10 font-['Tajawal'] text-right text-white" dir="rtl">
        <header className="flex flex-col md:flex-row justify-between items-center gap-6 mb-12 border-b border-white/5 pb-8">
            <div>
                <h2 className="text-3xl font-black text-[#fbbf24] flex items-center gap-3">
                    <Sliders className="text-white" /> محرر الدروس التفاعلية
                </h2>
                <p className="text-gray-500 text-sm mt-1">بناء تجارب تعليمية حية مع محاكاة فيزيائية ورسوم بيانية.</p>
            </div>
            <div className="flex gap-4">
                <button onClick={onCancel} className="px-6 py-3 rounded-2xl bg-white/5 hover:bg-white/10 transition-all font-bold text-sm">إلغاء</button>
                <button onClick={handleSave} className="px-8 py-3 rounded-2xl bg-[#fbbf24] text-black font-black text-sm uppercase tracking-widest hover:scale-105 transition-all shadow-xl flex items-center gap-2">
                    <Save size={16} /> حفظ ونشر
                </button>
            </div>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
            {/* Left Column: Core Settings & Variables */}
            <div className="lg:col-span-7 space-y-10">
                {/* Basic Info */}
                <div className="glass-panel p-8 rounded-[40px] border-white/5 bg-black/20">
                    <h3 className="text-lg font-bold text-white mb-6 flex items-center gap-2"><Settings size={18} /> البيانات الأساسية</h3>
                    <div className="space-y-4">
                        <input type="text" placeholder="عنوان الدرس" value={lesson.title || ''} onChange={e => setLesson({...lesson, title: e.target.value})} className="w-full bg-black/40 border border-white/10 rounded-2xl p-4 text-white outline-none focus:border-[#fbbf24] font-bold text-lg" />
                        <textarea placeholder="مقدمة تشويقية للدرس..." value={config.introduction} onChange={e => updateConfig('introduction', e.target.value)} className="w-full h-24 bg-black/40 border border-white/10 rounded-2xl p-4 text-white outline-none focus:border-[#fbbf24] resize-none" />
                    </div>
                </div>

                {/* Mathematical Core */}
                <div className="glass-panel p-8 rounded-[40px] border-white/5 bg-black/20">
                    <div className="flex justify-between items-center mb-6">
                        <h3 className="text-lg font-bold text-white flex items-center gap-2"><Variable size={18} /> المحرك الرياضي (Math Engine)</h3>
                        <button onClick={addVariable} className="text-xs bg-[#00d2ff]/10 text-[#00d2ff] px-4 py-2 rounded-xl font-bold hover:bg-[#00d2ff] hover:text-black transition-all flex items-center gap-2">+ متغير جديد</button>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-4 mb-6">
                        <div>
                            <label className="block text-[10px] font-black text-gray-500 mb-2 uppercase tracking-widest">معادلة العرض (LaTeX)</label>
                            <input type="text" placeholder="E = mc^2" value={config.mainEquation} onChange={e => updateConfig('mainEquation', e.target.value)} className="w-full bg-black/40 border border-white/10 rounded-2xl p-4 text-yellow-400 font-mono text-sm outline-none ltr text-left focus:border-yellow-500" />
                        </div>
                        <div>
                            <label className="block text-[10px] font-black text-gray-500 mb-2 uppercase tracking-widest">صيغة الحساب (JavaScript)</label>
                            <input type="text" placeholder="m * Math.pow(c, 2)" value={config.calculationFormula} onChange={e => updateConfig('calculationFormula', e.target.value)} className="w-full bg-black/40 border border-white/10 rounded-2xl p-4 text-green-400 font-mono text-sm outline-none ltr text-left focus:border-green-500" />
                        </div>
                    </div>

                    <div className="space-y-3 max-h-[400px] overflow-y-auto no-scrollbar pr-2">
                        {config.variables.map((v, idx) => (
                            <div key={idx} className="p-4 bg-white/[0.03] rounded-3xl border border-white/5 grid grid-cols-12 gap-3 items-end group hover:border-white/10 transition-all">
                                <div className="col-span-2">
                                    <label className="text-[8px] text-gray-500 block mb-1">ID (JS)</label>
                                    <input type="text" value={v.id} onChange={e => updateVariable(idx, 'id', e.target.value)} className="w-full bg-black/40 rounded-xl p-2 text-xs text-green-400 font-mono text-center" />
                                </div>
                                <div className="col-span-2">
                                    <label className="text-[8px] text-gray-500 block mb-1">Symbol</label>
                                    <input type="text" value={v.symbol} onChange={e => updateVariable(idx, 'symbol', e.target.value)} className="w-full bg-black/40 rounded-xl p-2 text-xs text-yellow-400 font-mono text-center" />
                                </div>
                                <div className="col-span-3">
                                    <label className="text-[8px] text-gray-500 block mb-1">Name</label>
                                    <input type="text" value={v.name} onChange={e => updateVariable(idx, 'name', e.target.value)} className="w-full bg-black/40 rounded-xl p-2 text-xs text-white" />
                                </div>
                                <div className="col-span-2">
                                    <label className="text-[8px] text-gray-500 block mb-1">Unit</label>
                                    <input type="text" value={v.unit} onChange={e => updateVariable(idx, 'unit', e.target.value)} className="w-full bg-black/40 rounded-xl p-2 text-xs text-white text-center" />
                                </div>
                                <div className="col-span-3 flex justify-end">
                                     <button onClick={() => removeVariable(idx)} className="bg-red-500/10 text-red-500 p-2 rounded-xl hover:bg-red-500 hover:text-white transition-all"><Trash2 size={16}/></button>
                                </div>
                                
                                <div className="col-span-12 grid grid-cols-4 gap-3 mt-2 border-t border-white/5 pt-3">
                                    <div className="bg-black/20 p-1 rounded-lg flex items-center px-2"><span className="text-[8px] text-gray-500 mr-2">MIN</span><input type="number" value={v.min} onChange={e => updateVariable(idx, 'min', Number(e.target.value))} className="bg-transparent w-full text-xs text-gray-300 outline-none" /></div>
                                    <div className="bg-black/20 p-1 rounded-lg flex items-center px-2"><span className="text-[8px] text-gray-500 mr-2">MAX</span><input type="number" value={v.max} onChange={e => updateVariable(idx, 'max', Number(e.target.value))} className="bg-transparent w-full text-xs text-gray-300 outline-none" /></div>
                                    <div className="bg-black/20 p-1 rounded-lg flex items-center px-2"><span className="text-[8px] text-gray-500 mr-2">STEP</span><input type="number" value={v.step} onChange={e => updateVariable(idx, 'step', Number(e.target.value))} className="bg-transparent w-full text-xs text-gray-300 outline-none" /></div>
                                    <div className="bg-black/20 p-1 rounded-lg flex items-center px-2 border border-[#00d2ff]/30"><span className="text-[8px] text-[#00d2ff] mr-2">DEF</span><input type="number" value={v.defaultValue} onChange={e => updateVariable(idx, 'defaultValue', Number(e.target.value))} className="bg-transparent w-full text-xs text-[#00d2ff] font-bold outline-none" /></div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Content Sections */}
                <div className="glass-panel p-8 rounded-[40px] border-white/5 bg-black/20">
                    <div className="flex justify-between items-center mb-6">
                        <h3 className="text-lg font-bold text-white flex items-center gap-2"><Layers size={18} /> المحتوى التعليمي</h3>
                        <button onClick={addContentBlock} className="text-xs bg-white/10 px-4 py-2 rounded-xl font-bold hover:bg-white/20 transition-all">+ قسم نصي</button>
                    </div>
                    <div className="space-y-4">
                        {lesson.content?.map((block, idx) => (
                            <div key={idx} className="p-4 bg-white/[0.03] rounded-3xl border border-white/5">
                                <input type="text" placeholder="عنوان القسم الفرعي" value={block.caption || ''} onChange={e => updateContentBlock(idx, 'caption', e.target.value)} className="w-full bg-transparent border-b border-white/10 pb-2 mb-4 text-white font-bold text-sm outline-none focus:border-[#fbbf24]" />
                                <textarea value={block.content} onChange={e => updateContentBlock(idx, 'content', e.target.value)} placeholder="محتوى الشرح (يدعم HTML والمعادلات)..." className="w-full h-24 bg-black/40 rounded-xl p-4 text-gray-300 text-xs outline-none" />
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* Right Column: Visualization & Extras */}
            <div className="lg:col-span-5 space-y-10">
                
                {/* Advanced Graph Settings */}
                <div className="glass-panel p-8 rounded-[40px] border-white/5 bg-black/20">
                    <h3 className="text-lg font-bold text-[#fbbf24] mb-6 flex items-center gap-2">
                        <LineChart size={18}/> إعدادات الرسم البياني
                    </h3>
                    
                    <div className="space-y-6">
                        {/* Chart Type Selector */}
                        <div className="grid grid-cols-3 gap-3 bg-black/40 p-2 rounded-2xl">
                            {(['line', 'bar', 'area'] as const).map(type => (
                                <button 
                                    key={type}
                                    onClick={() => updateConfig('graphConfig', { ...config.graphConfig, chartType: type })}
                                    className={`py-3 rounded-xl flex flex-col items-center gap-1 transition-all ${config.graphConfig?.chartType === type ? 'bg-[#00d2ff] text-black shadow-lg' : 'hover:bg-white/5 text-gray-500'}`}
                                >
                                    {type === 'line' ? <Activity size={16}/> : type === 'bar' ? <BarChart size={16}/> : <LineChart size={16}/>}
                                    <span className="text-[9px] font-black uppercase">{type}</span>
                                </button>
                            ))}
                        </div>

                        <div>
                            <label className="text-xs text-gray-500 font-bold block mb-2">المتغير على المحور السيني (X-Axis)</label>
                            <select 
                                value={config.graphConfig?.xAxisVariableId || ''} 
                                onChange={e => updateConfig('graphConfig', { ...config.graphConfig, xAxisVariableId: e.target.value })}
                                className="w-full bg-black/40 border border-white/10 rounded-2xl p-4 text-sm text-white outline-none focus:border-[#fbbf24]"
                            >
                                <option value="">اختر المتغير المتغير...</option>
                                {config.variables.map(v => <option key={v.id} value={v.id}>{v.name} ({v.symbol})</option>)}
                            </select>
                            <p className="text-[9px] text-gray-600 mt-2">سيتم رسم العلاقة بين هذا المتغير والنتيجة النهائية للمعادلة.</p>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="text-xs text-gray-500 font-bold block mb-2">تسمية المحور الصادي (Y)</label>
                                <input 
                                    type="text" 
                                    value={config.graphConfig?.yAxisLabel || ''} 
                                    onChange={e => updateConfig('graphConfig', { ...config.graphConfig, yAxisLabel: e.target.value })}
                                    className="w-full bg-black/40 border border-white/10 rounded-2xl p-4 text-sm text-white outline-none focus:border-[#fbbf24]" 
                                />
                            </div>
                            <div>
                                <label className="text-xs text-gray-500 font-bold block mb-2">وحدة النتيجة</label>
                                <input 
                                    type="text" 
                                    value={config.resultUnit} 
                                    onChange={e => updateConfig('resultUnit', e.target.value)}
                                    placeholder="J, N, m/s..."
                                    className="w-full bg-black/40 border border-white/10 rounded-2xl p-4 text-sm text-[#00d2ff] font-bold outline-none focus:border-[#00d2ff] text-center" 
                                />
                            </div>
                        </div>

                        <div className="flex items-center justify-between p-4 bg-white/5 rounded-2xl border border-white/5">
                            <span className="text-xs font-bold text-gray-400">لون الرسم البياني</span>
                            <input 
                                type="color" 
                                value={config.graphConfig?.lineColor || '#00d2ff'}
                                onChange={e => updateConfig('graphConfig', { ...config.graphConfig, lineColor: e.target.value })}
                                className="w-10 h-10 rounded-full bg-transparent cursor-pointer border-none"
                            />
                        </div>
                    </div>
                </div>

                <div className="glass-panel p-8 rounded-[40px] border-white/5 bg-black/20">
                    <h3 className="text-lg font-bold text-green-400 mb-6 flex items-center gap-2"><MessageSquare size={18}/> التقييم الذاتي</h3>
                    <div className="space-y-4">
                        <textarea 
                            placeholder="سؤال التحدي للطالب..." 
                            value={config.interactiveQuiz?.question || ''}
                            onChange={e => updateConfig('interactiveQuiz', { ...config.interactiveQuiz, question: e.target.value })}
                            className="w-full h-24 bg-black/40 rounded-2xl p-4 text-sm text-white border border-white/10 resize-none outline-none focus:border-green-500"
                        />
                        <div className="space-y-2">
                            {config.interactiveQuiz?.options.map((opt, i) => (
                                <div key={i} className="flex gap-3 items-center">
                                    <input 
                                        type="radio" 
                                        name="correctOpt" 
                                        checked={config.interactiveQuiz?.correctIndex === i} 
                                        onChange={() => updateConfig('interactiveQuiz', { ...config.interactiveQuiz, correctIndex: i })}
                                        className="accent-green-500 w-4 h-4"
                                    />
                                    <input 
                                        type="text" 
                                        value={opt} 
                                        onChange={e => {
                                            const newOpts = [...(config.interactiveQuiz?.options || [])];
                                            newOpts[i] = e.target.value;
                                            updateConfig('interactiveQuiz', { ...config.interactiveQuiz, options: newOpts });
                                        }}
                                        className="flex-1 bg-black/40 rounded-xl p-3 text-xs text-white border border-white/10 outline-none focus:border-green-500"
                                        placeholder={`الخيار ${i+1}`}
                                    />
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </div>
  );
};

export default AdminUniversalLessonEditor;

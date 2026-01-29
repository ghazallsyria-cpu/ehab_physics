
import React, { useState, useEffect, useMemo } from 'react';
import { 
  BookOpen, Calculator, LineChart, ChevronDown, ChevronUp, 
  ZoomIn, X, CheckCircle2, FlaskConical, Share2, Info 
} from 'lucide-react';
import katex from 'katex';
import { Chart as ChartJS, CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend } from 'chart.js';
import { Line } from 'react-chartjs-2';
import { Lesson, UniversalLessonConfig } from '../types';

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend);

// Math Renderer Component
const MathBlock: React.FC<{ tex: string; inline?: boolean }> = ({ tex, inline }) => {
  const html = katex.renderToString(tex, { throwOnError: false, displayMode: !inline });
  return <span dangerouslySetInnerHTML={{ __html: html }} className={inline ? "font-serif text-[#00d2ff]" : "block my-4 text-center text-xl md:text-2xl text-white"} />;
};

interface UniversalLessonViewerProps {
  lesson: Lesson;
  onBack: () => void;
  onComplete: () => void;
  isCompleted: boolean;
}

const UniversalLessonViewer: React.FC<UniversalLessonViewerProps> = ({ lesson, onBack, onComplete, isCompleted }) => {
  const config = lesson.universalConfig;
  
  if (!config) {
      return <div className="p-20 text-center text-red-500 font-bold">خطأ: تكوين الدرس الشامل مفقود.</div>;
  }

  // State
  const [calcValues, setCalcValues] = useState<Record<string, number>>({});
  const [result, setResult] = useState(0);
  const [lightboxImage, setLightboxImage] = useState<string | null>(null);
  const [showQuiz, setShowQuiz] = useState(false);

  // Initialize values
  useEffect(() => {
    const initials: Record<string, number> = {};
    config.variables.forEach(v => {
        initials[v.id] = v.defaultValue;
    });
    setCalcValues(initials);
  }, [config]);

  // Dynamic Calculation
  useEffect(() => {
    try {
        // Construct the function dynamically
        // Note: In a real production environment, validate this more strictly.
        // We map the variable IDs to their values.
        const vars = Object.keys(calcValues);
        const values = Object.values(calcValues);
        
        // Replace variable IDs in formula with parameter names if needed, 
        // but here we assume the formula uses the variable IDs directly as defined in the Admin Editor.
        // E.g. Formula: "0.5 * m * v**2" -> we pass 'm' and 'v' as keys.
        
        // Since the user might use symbols in the formula that match variable IDs:
        // We create a function context.
        
        const func = new Function(...vars, `return ${config.calculationFormula};`);
        const res = func(...values);
        setResult(isNaN(res) ? 0 : res);
    } catch (e) {
        console.error("Calculation Error:", e);
    }
  }, [calcValues, config.calculationFormula]);

  // Chart Logic
  const chartData = useMemo(() => {
    if (!config.graphConfig) return null;
    
    const xVarId = config.graphConfig.xAxisVariableId;
    const xVar = config.variables.find(v => v.id === xVarId);
    
    if (!xVar) return null;

    // Generate X labels (range based on min/max of the X variable)
    const step = (xVar.max - xVar.min) / 6; // 6 points
    const labels = Array.from({length: 7}, (_, i) => Math.round(xVar.min + i * step));

    // Generate Data
    const dataPoints = labels.map(val => {
        const tempValues = { ...calcValues, [xVarId]: val };
        try {
            const func = new Function(...Object.keys(tempValues), `return ${config.calculationFormula};`);
            return func(...Object.values(tempValues));
        } catch { return 0; }
    });

    return {
        labels,
        datasets: [{
            label: `${config.graphConfig.yAxisLabel}`,
            data: dataPoints,
            borderColor: '#00d2ff',
            backgroundColor: 'rgba(0, 210, 255, 0.2)',
            tension: 0.4,
            pointRadius: 6,
            pointHoverRadius: 8
        }]
    };
  }, [calcValues, config]);

  const chartOptions = {
    responsive: true,
    plugins: {
      legend: { labels: { color: '#fff', font: { family: 'Tajawal' } } },
      tooltip: { backgroundColor: '#0a1118', titleColor: '#fbbf24', bodyFont: { family: 'Tajawal' } }
    },
    scales: {
      y: { grid: { color: 'rgba(255,255,255,0.1)' }, ticks: { color: '#aaa' } },
      x: { grid: { color: 'rgba(255,255,255,0.1)' }, ticks: { color: '#aaa' } }
    }
  };

  return (
    <div className="min-h-screen bg-[#0A2540] font-['Tajawal'] text-right text-white pb-20 animate-fadeIn" dir="rtl">
        {/* Header */}
        <div className="relative h-[300px] overflow-hidden rounded-b-[60px] border-b border-white/10 shadow-2xl mb-12">
            <div className="absolute inset-0 bg-gradient-to-r from-blue-900 via-[#0A2540] to-black opacity-90 z-10"></div>
            <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-10 z-0"></div>
            <div className="relative z-20 container mx-auto px-6 h-full flex flex-col justify-center items-start">
                <div className="flex gap-3 mb-4">
                    <span className="px-4 py-1 bg-[#fbbf24] text-black rounded-full text-xs font-black uppercase tracking-widest">درس تفاعلي</span>
                </div>
                <h1 className="text-4xl md:text-6xl font-black mb-4 leading-tight">{lesson.title}</h1>
                <p className="text-gray-300 text-lg max-w-2xl leading-relaxed">{config.introduction}</p>
                <button onClick={onBack} className="absolute top-8 left-8 p-3 bg-white/5 hover:bg-white/10 rounded-full transition-all border border-white/10"><X size={24}/></button>
            </div>
        </div>

        <div className="container mx-auto px-6 grid grid-cols-1 lg:grid-cols-12 gap-10">
            <div className="lg:col-span-8 space-y-12">
                {/* Objectives */}
                <div className="bg-white/[0.02] border border-white/5 rounded-[40px] p-8">
                    <h3 className="text-2xl font-black text-[#fbbf24] mb-6 flex items-center gap-3"><CheckCircle2 /> أهداف الدرس</h3>
                    <ul className="space-y-4">
                        {config.objectives.map((obj, i) => (
                            <li key={i} className="flex items-start gap-4">
                                <span className="w-6 h-6 rounded-full bg-[#00d2ff]/20 text-[#00d2ff] flex items-center justify-center text-xs font-black shrink-0 mt-1">{i + 1}</span>
                                <span className="text-gray-300 leading-relaxed">{obj}</span>
                            </li>
                        ))}
                    </ul>
                </div>

                {/* Main Content & Equation */}
                <div className="glass-panel p-10 rounded-[40px] border-l-4 border-[#00d2ff] bg-gradient-to-r from-[#00d2ff]/5 to-transparent">
                    <h3 className="text-xl font-black text-white mb-6">الصيغة الرياضية</h3>
                    <MathBlock tex={config.mainEquation} />
                    <div className="grid grid-cols-3 gap-4 mt-8 text-center">
                        {config.variables.map((v, i) => (
                            <div key={i} className="bg-black/30 p-4 rounded-2xl border border-white/5">
                                <MathBlock tex={v.symbol} inline />
                                <p className="text-xs text-gray-400 mt-2 font-bold">{v.name}</p>
                                <p className="text-[10px] text-[#fbbf24] font-mono mt-1">({v.unit})</p>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Content Sections from standard Lesson.content if mixed */}
                {lesson.content && lesson.content.map((block, i) => (
                    <div key={i} className="space-y-4">
                        {block.caption && <h3 className="text-2xl font-bold text-white border-r-4 border-[#fbbf24] pr-4">{block.caption}</h3>}
                        {block.type === 'text' && (
                            <div className="prose prose-invert max-w-none text-gray-300 text-lg leading-loose">
                                <p dangerouslySetInnerHTML={{__html: block.content.replace(/\$(.*?)\$/g, (match) => katex.renderToString(match.slice(1, -1), {throwOnError:false}))}} />
                            </div>
                        )}
                        {block.type === 'image' && (
                            <div className="relative group rounded-[30px] overflow-hidden border border-white/10 cursor-zoom-in" onClick={() => setLightboxImage(block.content)}>
                                <img src={block.content} className="w-full h-64 object-cover" alt="visual" />
                                <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center"><ZoomIn className="text-white w-10 h-10"/></div>
                            </div>
                        )}
                    </div>
                ))}

                {/* Dynamic Chart */}
                {chartData && (
                    <div className="glass-panel p-8 rounded-[40px] border-white/5 bg-black/40">
                        <h3 className="text-xl font-black text-white mb-6 flex items-center gap-3"><LineChart className="text-[#00d2ff]" /> التحليل البياني</h3>
                        <div className="h-[300px] w-full"><Line data={chartData} options={chartOptions} /></div>
                    </div>
                )}
            </div>

            {/* Sidebar Calculator */}
            <div className="lg:col-span-4 space-y-8">
                <div className="sticky top-8">
                    <div className="glass-panel p-8 rounded-[40px] border-[#fbbf24]/20 bg-[#fbbf24]/5 shadow-xl mb-8 relative overflow-hidden">
                        <div className="absolute -top-10 -left-10 w-32 h-32 bg-[#fbbf24]/10 rounded-full blur-[50px]"></div>
                        <h3 className="text-xl font-black text-[#fbbf24] mb-6 flex items-center gap-3 relative z-10"><Calculator /> المختبر الحسابي</h3>
                        
                        <div className="space-y-6 relative z-10">
                            {config.variables.map(variable => (
                                <div key={variable.id} className="space-y-2">
                                    <label className="text-xs font-bold text-gray-400 flex justify-between">
                                        <span>{variable.name} ({variable.symbol})</span>
                                        <span className="text-[#00d2ff]">{calcValues[variable.id]} {variable.unit}</span>
                                    </label>
                                    <input 
                                        type="range" min={variable.min} max={variable.max} step={variable.step}
                                        value={calcValues[variable.id] || variable.defaultValue}
                                        onChange={(e) => setCalcValues({...calcValues, [variable.id]: Number(e.target.value)})}
                                        className="w-full h-2 bg-black/40 rounded-full appearance-none accent-[#fbbf24] cursor-pointer"
                                    />
                                </div>
                            ))}
                            <div className="pt-6 border-t border-white/10 text-center animate-pulse">
                                <p className="text-[10px] font-black uppercase text-gray-500 tracking-widest mb-2">النتيجة النهائية</p>
                                <div className="text-5xl font-black text-white drop-shadow-[0_0_15px_rgba(251,191,36,0.5)] tabular-nums">
                                    {result.toLocaleString(undefined, { maximumFractionDigits: 2 })} <span className="text-lg text-[#fbbf24]">{config.resultUnit}</span>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Quiz Widget */}
                    {config.interactiveQuiz && (
                        <div className="bg-black/40 rounded-[30px] border border-white/5 overflow-hidden">
                            <button onClick={() => setShowQuiz(!showQuiz)} className="w-full flex justify-between items-center p-6 hover:bg-white/5 transition-all">
                                <span className="font-bold flex items-center gap-3"><Info size={18} className="text-green-400"/> اختبر فهمك</span>
                                {showQuiz ? <ChevronUp size={18}/> : <ChevronDown size={18}/>}
                            </button>
                            {showQuiz && (
                                <div className="p-6 pt-0 border-t border-white/5 bg-black/20">
                                    <p className="text-sm text-gray-300 mb-4">{config.interactiveQuiz.question}</p>
                                    <div className="space-y-2">
                                        {config.interactiveQuiz.options.map((opt, idx) => (
                                            <button key={idx} onClick={() => alert(idx === config.interactiveQuiz?.correctIndex ? "إجابة صحيحة! أحسنت." : "حاول مرة أخرى.")} className="w-full text-right p-3 rounded-xl bg-white/5 hover:bg-[#00d2ff]/20 hover:text-[#00d2ff] transition-all text-xs font-bold border border-white/5">
                                                {opt}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>
                    )}

                    <div className="mt-8 flex justify-end">
                        <button onClick={onComplete} className={`px-8 py-4 rounded-2xl font-bold text-xs uppercase transition-all shadow-xl w-full ${isCompleted ? 'bg-green-500/10 text-green-400 border-green-500/20' : 'bg-[#fbbf24] text-black hover:scale-105 active:scale-95'}`}>
                            {isCompleted ? '✓ تم إكمال الدرس' : 'إتمام الدرس والحصول على النقاط'}
                        </button>
                    </div>
                </div>
            </div>
        </div>

        {lightboxImage && (
            <div className="fixed inset-0 z-[1000] bg-black/95 backdrop-blur-xl flex items-center justify-center p-4 animate-fadeIn" onClick={() => setLightboxImage(null)}>
                <img src={lightboxImage} alt="Zoom" className="max-w-full max-h-[90vh] rounded-[30px] shadow-2xl border-2 border-white/10" />
                <button className="absolute top-8 right-8 text-white bg-white/10 p-4 rounded-full hover:bg-red-500 transition-all"><X size={24} /></button>
            </div>
        )}
    </div>
  );
};

export default UniversalLessonViewer;

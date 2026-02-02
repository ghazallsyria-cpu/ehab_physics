import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { InteractiveLesson, InteractiveScene, SceneInteraction } from '../types';
import { dbService } from '../services/db';
import { Save, Plus, Trash2, ArrowLeft, RefreshCw, Layers, Edit, Image as ImageIcon, X } from 'lucide-react';

const AdminInteractiveLessonBuilder: React.FC = () => {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const [lesson, setLesson] = useState<InteractiveLesson | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [selectedScene, setSelectedScene] = useState<InteractiveScene | null>(null);
    const [isSaving, setIsSaving] = useState(false);

    useEffect(() => {
        if (!id) return;
        const loadLesson = async () => {
            setIsLoading(true);
            try {
                const data = await dbService.getInteractiveLessonById(id);
                if (data) {
                    setLesson(data);
                    if (data.scenes && data.scenes.length > 0) {
                        setSelectedScene(data.scenes[0]);
                    }
                }
            } catch (e) {
                console.error("Failed to load lesson", e);
            } finally {
                setIsLoading(false);
            }
        };
        loadLesson();
    }, [id]);

    const handleSave = async () => {
        if (!lesson) return;
        setIsSaving(true);
        try {
            await dbService.saveInteractiveLesson(lesson);
            alert("تم الحفظ بنجاح!");
        } catch (e) {
            console.error(e);
            alert("فشل الحفظ.");
        } finally {
            setIsSaving(false);
        }
    };

    const updateScene = (field: keyof InteractiveScene, value: any) => {
        if (!selectedScene || !lesson) return;
        
        const updatedScene = { ...selectedScene, [field]: value };
        const updatedScenes = lesson.scenes?.map(s => s.id === selectedScene.id ? updatedScene : s);
        
        setLesson({ ...lesson, scenes: updatedScenes });
        setSelectedScene(updatedScene);
    };

    const addScene = () => {
        if (!lesson) return;
        const newScene: InteractiveScene = {
            id: `scn_${Date.now()}`,
            interactive_lesson_id: lesson.id,
            order_index: (lesson.scenes?.length || 0),
            title: 'مشهد جديد',
            content: '',
            scene_type: 'info',
            interactions: []
        };
        setLesson({ ...lesson, scenes: [...(lesson.scenes || []), newScene] });
        setSelectedScene(newScene);
    };

    const removeScene = (sceneId: string) => {
        if (!lesson) return;
        if (!confirm("هل أنت متأكد من حذف المشهد؟")) return;
        const updatedScenes = lesson.scenes?.filter(s => s.id !== sceneId);
        setLesson({ ...lesson, scenes: updatedScenes });
        if (selectedScene?.id === sceneId) {
            setSelectedScene(updatedScenes?.[0] || null);
        }
    };

    if (isLoading) return <div className="p-40 text-center"><RefreshCw className="animate-spin mx-auto text-purple-400"/></div>;
    if (!lesson) return <div className="p-20 text-center text-red-500">لم يتم العثور على الدرس.</div>;

    return (
        <div className="flex h-screen bg-[#0A2540] font-['Tajawal'] text-white text-right" dir="rtl">
            {/* Sidebar */}
            <aside className="w-80 bg-black/20 border-l border-white/5 flex flex-col p-6 overflow-hidden">
                <button onClick={() => navigate('/admin/interactive-lessons')} className="text-xs text-gray-400 hover:text-white font-bold flex items-center gap-2 mb-6">
                    <ArrowLeft size={16}/> العودة للقائمة
                </button>
                <div className="flex justify-between items-center mb-6">
                    <h2 className="text-xl font-black text-white">المشاهد</h2>
                    <button onClick={addScene} className="p-2 bg-purple-500 text-white rounded-lg hover:scale-110 transition-transform"><Plus size={16}/></button>
                </div>
                <div className="flex-1 overflow-y-auto no-scrollbar space-y-3">
                    {lesson.scenes?.map((scene, idx) => (
                        <div 
                            key={scene.id} 
                            onClick={() => setSelectedScene(scene)} 
                            className={`p-4 rounded-xl border-2 cursor-pointer transition-all flex justify-between items-center ${selectedScene?.id === scene.id ? 'border-purple-500 bg-purple-500/10' : 'border-transparent bg-white/5 hover:bg-white/10'}`}
                        >
                            <div className="flex items-center gap-3">
                                <span className="text-xs font-mono opacity-50">{idx + 1}</span>
                                <p className="font-bold text-sm truncate w-32">{scene.title}</p>
                            </div>
                            <button onClick={(e) => { e.stopPropagation(); removeScene(scene.id); }} className="text-gray-500 hover:text-red-500"><Trash2 size={14}/></button>
                        </div>
                    ))}
                </div>
                <button onClick={handleSave} disabled={isSaving} className="mt-6 w-full bg-green-500 text-black py-3 rounded-xl font-black text-sm hover:scale-105 transition-all flex items-center justify-center gap-2">
                    {isSaving ? <RefreshCw className="animate-spin" size={16}/> : <Save size={16}/>} حفظ التغييرات
                </button>
            </aside>

            {/* Editor Area */}
            <main className="flex-1 p-8 overflow-y-auto bg-[#0a1118]">
                {selectedScene ? (
                    <div className="max-w-4xl mx-auto space-y-8 animate-fadeIn">
                        <div className="glass-panel p-8 rounded-[40px] border-white/5 bg-black/20">
                            <div className="mb-6">
                                <label className="text-xs font-bold text-gray-500 block mb-2">عنوان المشهد</label>
                                <input 
                                    type="text" 
                                    value={selectedScene.title || ''} 
                                    onChange={e => updateScene('title', e.target.value)} 
                                    className="w-full bg-black/40 border border-white/10 rounded-xl p-4 text-white font-bold text-xl outline-none focus:border-purple-500" 
                                />
                            </div>
                            
                            <div className="grid grid-cols-2 gap-6 mb-6">
                                <div>
                                    <label className="text-xs font-bold text-gray-500 block mb-2">نوع المحتوى البصري</label>
                                    <select 
                                        value={selectedScene.visual_type || 'none'} 
                                        onChange={e => updateScene('visual_type', e.target.value)} 
                                        className="w-full bg-black/40 border border-white/10 rounded-xl p-3 text-white outline-none"
                                    >
                                        <option value="none">بدون</option>
                                        <option value="image">صورة</option>
                                        <option value="ai_description">وصف AI (توليد)</option>
                                    </select>
                                </div>
                                {selectedScene.visual_type === 'image' && (
                                    <div>
                                        <label className="text-xs font-bold text-gray-500 block mb-2">رابط الصورة</label>
                                        <input 
                                            type="text" 
                                            value={selectedScene.visual_url || ''} 
                                            onChange={e => updateScene('visual_url', e.target.value)} 
                                            className="w-full bg-black/40 border border-white/10 rounded-xl p-3 text-white outline-none text-xs font-mono" 
                                            placeholder="https://..."
                                        />
                                    </div>
                                )}
                            </div>

                            <div className="mb-6">
                                <label className="text-xs font-bold text-gray-500 block mb-2">نص المحتوى (الشرح)</label>
                                <textarea 
                                    value={selectedScene.content || ''} 
                                    onChange={e => updateScene('content', e.target.value)} 
                                    className="w-full h-40 bg-black/40 border border-white/10 rounded-xl p-4 text-white text-lg leading-relaxed outline-none focus:border-purple-500 resize-none" 
                                />
                            </div>
                        </div>

                        {/* Interactions Editor */}
                        <div className="glass-panel p-8 rounded-[40px] border-white/5 bg-black/20">
                            <div className="flex justify-between items-center mb-6">
                                <h3 className="text-xl font-bold text-white flex items-center gap-2"><Layers size={20} className="text-purple-400"/> التفاعلات والأسئلة</h3>
                                <button 
                                    onClick={() => {
                                        const newInteraction = { id: `act_${Date.now()}`, scene_id: selectedScene.id, interaction_type: 'choice', options: [], points: 10 };
                                        updateScene('interactions', [...(selectedScene.interactions || []), newInteraction]);
                                    }}
                                    className="text-xs bg-white/5 hover:bg-white/10 px-4 py-2 rounded-lg font-bold"
                                >
                                    + إضافة سؤال
                                </button>
                            </div>
                            
                            <div className="space-y-6">
                                {selectedScene.interactions?.map((interaction, iIdx) => (
                                    <div key={interaction.id} className="p-6 bg-white/5 rounded-2xl border border-white/5 relative">
                                        <button 
                                            onClick={() => {
                                                const newInteractions = selectedScene.interactions?.filter(i => i.id !== interaction.id);
                                                updateScene('interactions', newInteractions);
                                            }} 
                                            className="absolute top-4 left-4 text-red-500 hover:bg-red-500/10 p-2 rounded-lg"
                                        >
                                            <Trash2 size={16}/>
                                        </button>
                                        
                                        <div className="mb-4 pr-8">
                                            <label className="text-[10px] font-bold text-gray-500 uppercase">نص السؤال</label>
                                            <input 
                                                type="text" 
                                                value={interaction.question_text || ''} 
                                                onChange={e => {
                                                    const newInteractions = [...(selectedScene.interactions || [])];
                                                    newInteractions[iIdx].question_text = e.target.value;
                                                    updateScene('interactions', newInteractions);
                                                }}
                                                className="w-full bg-black/40 border border-white/10 rounded-lg p-2 text-white outline-none"
                                            />
                                        </div>

                                        <div className="space-y-2 pl-4 border-r-2 border-white/10 mr-2">
                                            <div className="flex justify-between">
                                                <label className="text-[10px] font-bold text-gray-500 uppercase">الخيارات</label>
                                                <button 
                                                    onClick={() => {
                                                        const newInteractions = [...(selectedScene.interactions || [])];
                                                        newInteractions[iIdx].options.push({ id: `opt_${Date.now()}`, text: '', isCorrect: false });
                                                        updateScene('interactions', newInteractions);
                                                    }}
                                                    className="text-[10px] text-green-400 font-bold"
                                                >
                                                    + خيار
                                                </button>
                                            </div>
                                            {interaction.options.map((opt, oIdx) => (
                                                <div key={opt.id} className="flex gap-2 items-center">
                                                    <input 
                                                        type="radio" 
                                                        name={`correct_${interaction.id}`} 
                                                        checked={opt.isCorrect} 
                                                        onChange={() => {
                                                            const newInteractions = [...(selectedScene.interactions || [])];
                                                            newInteractions[iIdx].options.forEach((o, idx) => o.isCorrect = idx === oIdx);
                                                            updateScene('interactions', newInteractions);
                                                        }}
                                                        className="accent-green-500"
                                                    />
                                                    <input 
                                                        type="text" 
                                                        value={opt.text} 
                                                        onChange={e => {
                                                            const newInteractions = [...(selectedScene.interactions || [])];
                                                            newInteractions[iIdx].options[oIdx].text = e.target.value;
                                                            updateScene('interactions', newInteractions);
                                                        }}
                                                        className="flex-1 bg-black/40 border border-white/10 rounded p-2 text-sm text-white"
                                                        placeholder={`الخيار ${oIdx + 1}`}
                                                    />
                                                    <button 
                                                        onClick={() => {
                                                            const newInteractions = [...(selectedScene.interactions || [])];
                                                            newInteractions[iIdx].options.splice(oIdx, 1);
                                                            updateScene('interactions', newInteractions);
                                                        }}
                                                        className="text-red-500"
                                                    >
                                                        <X size={14}/>
                                                    </button>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                ))}
                                {(!selectedScene.interactions || selectedScene.interactions.length === 0) && (
                                    <div className="text-center py-8 text-gray-500 text-sm italic border-2 border-dashed border-white/5 rounded-2xl">
                                        لا توجد تفاعلات مضافة لهذا المشهد.
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                ) : (
                    <div className="h-full flex flex-col items-center justify-center text-gray-500 opacity-50">
                        <Layers size={64} className="mb-4"/>
                        <p className="font-bold text-xl">اختر مشهداً من القائمة للبدء</p>
                    </div>
                )}
            </main>
        </div>
    );
};

export default AdminInteractiveLessonBuilder;
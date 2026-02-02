import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { InteractiveLesson, InteractiveScene, SceneInteraction } from '../../types';
import { dbService } from '../../services/db';
import { generateInteractiveLesson } from '../../services/gemini';
import { RefreshCw, Zap, Plus, Edit, Trash2, X, Eye, Send, Loader2, FileText, AlertTriangle } from 'lucide-react';
import { useAuth } from '../../components/ProtectedRoute';

const AdminInteractiveLessons: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [lessons, setLessons] = useState<InteractiveLesson[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showAIModal, setShowAIModal] = useState(false);
  
  // AI Modal State
  const [aiContent, setAiContent] = useState('');
  const [aiTitle, setAiTitle] = useState('');
  const [aiSubject, setAiSubject] = useState('الفيزياء');
  const [aiGrade, setAiGrade] = useState('12');
  const [isGenerating, setIsGenerating] = useState(false);
  const [generationError, setGenerationError] = useState<string | null>(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setIsLoading(true);
    try {
      // Fetch all lessons, including drafts
      const lessonsData = await dbService.getInteractiveLessons(false);
      setLessons(lessonsData);
    } catch (error) {
      console.error("Failed to load interactive lessons:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const generateId = (prefix: string) => `${prefix}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

  const handleCreateManual = async () => {
      if (!user) return;
      const newLessonId = generateId('int');
      const newLesson: Partial<InteractiveLesson> = {
          id: newLessonId,
          title: 'درس تفاعلي جديد',
          subject: 'الفيزياء',
          grade_level: '12',
          is_published: false,
          created_by: user.uid,
          scenes: [],
          total_points: 0
      };
      
      try {
          await dbService.saveInteractiveLesson(newLesson);
          navigate(`/lesson-builder/${newLessonId}`);
      } catch (e) {
          console.error("Failed to create manual lesson:", e);
          alert("حدث خطأ أثناء إنشاء الدرس.");
      }
  };
  
  const handleGenerateAndSave = async () => {
      if (!aiTitle.trim() || !aiContent.trim() || !user) {
          setGenerationError("يرجى تعبئة جميع الحقول المطلوبة.");
          return;
      }
      
      setIsGenerating(true);
      setGenerationError(null);
      
      try {
          const generatedData = await generateInteractiveLesson(aiContent, aiTitle, aiSubject, aiGrade);
          
          if (!generatedData) {
              throw new Error("فشل توليد البيانات من الذكاء الاصطناعي.");
          }

          const lessonId = generateId('int');
          
          // Process scenes to ensure they have IDs and link to lesson
          const processedScenes: InteractiveScene[] = (generatedData.scenes || []).map((scene: any, index: number) => {
              const sceneId = generateId('scn') + index; // Ensure unique ID
              
              // Process interactions within scene
              const processedInteractions: SceneInteraction[] = (scene.interactions || []).map((interaction: any, iIdx: number) => ({
                  ...interaction,
                  id: generateId('act') + iIdx,
                  scene_id: sceneId,
                  points: interaction.points || 10
              }));

              return {
                  ...scene,
                  id: sceneId,
                  interactive_lesson_id: lessonId,
                  order_index: index,
                  interactions: processedInteractions,
                  scene_type: scene.scene_type || 'info'
              };
          });

          const totalPoints = processedScenes.reduce((sum, scene) => {
              const interactionPoints = scene.interactions?.reduce((iSum, i) => iSum + (i.points || 0), 0) || 0;
              return sum + interactionPoints;
          }, 0);

          const newLesson: Partial<InteractiveLesson> = {
              id: lessonId,
              title: aiTitle,
              subject: aiSubject,
              grade_level: aiGrade,
              description: generatedData.description || aiContent.substring(0, 100) + '...',
              is_published: false,
              created_by: user.uid,
              source_type: 'ai_generated',
              source_content: aiContent,
              total_points: totalPoints,
              scenes: processedScenes
          };

          await dbService.saveInteractiveLesson(newLesson);
          setShowAIModal(false);
          resetAIModal();
          await loadData();

      } catch (e: any) {
          console.error("AI Generation failed:", e);
          setGenerationError("فشل التوليد. قد يكون النص طويلاً جداً أو غير واضح. حاول تقليل النص أو صياغته بشكل أفضل.");
      } finally {
          setIsGenerating(false);
      }
  };
  
  const resetAIModal = () => {
      setAiContent('');
      setAiTitle('');
      setGenerationError(null);
  };
  
  const handleDelete = async (lessonId: string) => {
      if (window.confirm("هل أنت متأكد من حذف هذا الدرس التفاعلي نهائياً؟")) {
          await dbService.deleteInteractiveLesson(lessonId);
          await loadData();
      }
  };

  return (
    <div className="animate-fadeIn space-y-8 pb-20">
      <header className="flex flex-col md:flex-row justify-between items-center gap-6">
          <div className="flex items-center gap-4">
              <div className="w-14 h-14 bg-purple-500/10 rounded-2xl flex items-center justify-center text-purple-400 border border-purple-500/20 shadow-lg">
                  <Zap size={28} />
              </div>
              <div>
                  <h1 className="text-3xl font-black text-white italic">إدارة الدروس التفاعلية</h1>
                  <p className="text-gray-500 text-xs font-bold uppercase tracking-widest mt-1">إنشاء وتعديل الرحلات التعليمية للطلاب.</p>
              </div>
          </div>
          <div className="flex gap-3">
              <button onClick={handleCreateManual} className="bg-white/5 text-white border border-white/10 px-6 py-4 rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-white/10 transition-all flex items-center gap-2">
                  <FileText size={16} /> إنشاء يدوي
              </button>
              <button onClick={() => setShowAIModal(true)} className="bg-purple-500 text-white px-8 py-4 rounded-2xl font-black text-xs uppercase tracking-widest shadow-lg shadow-purple-500/20 hover:scale-105 transition-all flex items-center gap-2">
                  <Zap size={16} /> إنشاء بالذكاء الاصطناعي
              </button>
          </div>
      </header>
      
      {/* Lessons Table/List */}
      <div className="glass-panel p-6 rounded-[40px] border-white/5 bg-black/20">
          <table className="w-full text-sm">
              <thead className="border-b border-white/10 text-[9px] font-black text-gray-500 uppercase tracking-widest">
                  <tr>
                      <th className="p-4 text-right">العنوان</th>
                      <th className="p-4 text-center">المادة</th>
                      <th className="p-4 text-center">الحالة</th>
                      <th className="p-4 text-center">الإجراءات</th>
                  </tr>
              </thead>
              <tbody>
                  {isLoading ? (
                      <tr><td colSpan={4} className="p-20 text-center"><Loader2 className="animate-spin mx-auto text-purple-400" /></td></tr>
                  ) : lessons.length === 0 ? (
                      <tr><td colSpan={4} className="p-20 text-center text-gray-500">لا توجد دروس تفاعلية بعد. ابدأ بإنشاء واحد جديد!</td></tr>
                  ) : lessons.map(lesson => (
                      <tr key={lesson.id} className="border-b border-white/5 last:border-none hover:bg-white/[0.02] transition-colors">
                          <td className="p-4 font-bold text-white">{lesson.title}</td>
                          <td className="p-4 text-center text-gray-400">{lesson.subject} - {lesson.grade_level}</td>
                          <td className="p-4 text-center">
                              <span className={`px-3 py-1 rounded-full text-[9px] font-black uppercase ${lesson.is_published ? 'bg-green-500/10 text-green-400' : 'bg-yellow-500/10 text-yellow-500'}`}>
                                  {lesson.is_published ? 'منشور' : 'مسودة'}
                              </span>
                          </td>
                          <td className="p-4 text-center flex justify-center gap-2">
                              <button onClick={() => navigate(`/interactive/${lesson.id}`)} className="p-2.5 text-blue-400 bg-blue-500/10 rounded-xl hover:bg-blue-500/20 transition-all" title="معاينة"><Eye size={16}/></button>
                              <button onClick={() => navigate(`/lesson-builder/${lesson.id}`)} className="p-2.5 text-amber-400 bg-amber-500/10 rounded-xl hover:bg-amber-500/20 transition-all" title="تعديل"><Edit size={16}/></button>
                              <button onClick={() => handleDelete(lesson.id)} className="p-2.5 text-red-500 bg-red-500/10 rounded-xl hover:bg-red-500/20 transition-all" title="حذف"><Trash2 size={16}/></button>
                          </td>
                      </tr>
                  ))}
              </tbody>
          </table>
      </div>

      {/* AI Generation Modal */}
      {showAIModal && (
          <div className="fixed inset-0 z-[200] bg-black/90 backdrop-blur-md flex items-center justify-center p-4 animate-fadeIn">
              <div className="bg-[#0a1118] border border-purple-500/20 w-full max-w-2xl rounded-[40px] p-8 shadow-2xl relative overflow-hidden flex flex-col max-h-[90vh]">
                  <button onClick={() => setShowAIModal(false)} className="absolute top-6 right-6 p-2 text-gray-500 hover:text-white bg-white/5 rounded-full"><X/></button>
                  <h2 className="text-2xl font-black text-purple-400 mb-6 flex items-center gap-3"><Zap size={24}/> مولد الدروس التفاعلية</h2>
                  
                  <div className="flex-1 overflow-y-auto no-scrollbar pr-2 space-y-4">
                      {generationError && (
                          <div className="p-4 bg-red-500/10 text-red-400 text-xs rounded-xl flex items-start gap-3">
                              <AlertTriangle className="shrink-0" size={16} />
                              <p>{generationError}</p>
                          </div>
                      )}
                      <input type="text" value={aiTitle} onChange={e => setAiTitle(e.target.value)} placeholder="عنوان الدرس" className="w-full bg-black/40 p-4 rounded-xl border border-white/10 text-white font-bold outline-none focus:border-purple-500 transition-all"/>
                      <div className="grid grid-cols-2 gap-4">
                          <select value={aiSubject} onChange={e => setAiSubject(e.target.value)} className="w-full bg-black/40 p-4 rounded-xl border border-white/10 text-white outline-none focus:border-purple-500"><option>الفيزياء</option><option>الكيمياء</option></select>
                          <select value={aiGrade} onChange={e => setAiGrade(e.target.value)} className="w-full bg-black/40 p-4 rounded-xl border border-white/10 text-white outline-none focus:border-purple-500"><option>12</option><option>11</option><option>10</option></select>
                      </div>
                      <textarea
                          value={aiContent}
                          onChange={e => setAiContent(e.target.value)}
                          placeholder="الصق محتوى الدرس الخام هنا (من كتاب، ملف Word، إلخ). كلما كان النص أكثر تفصيلاً، كانت النتيجة أفضل..."
                          className="w-full h-64 bg-black/40 p-4 rounded-xl border border-white/10 text-sm text-gray-300 resize-none outline-none focus:border-purple-400"
                      />
                  </div>
                  
                  <div className="mt-6 pt-6 border-t border-white/10">
                      <button onClick={handleGenerateAndSave} disabled={isGenerating} className="w-full bg-purple-600 text-white py-4 rounded-xl font-black text-xs uppercase tracking-widest hover:bg-purple-500 transition-all flex items-center justify-center gap-3 disabled:opacity-50">
                          {isGenerating ? <Loader2 className="animate-spin"/> : <Send/>}
                          {isGenerating ? 'جاري التحليل والبناء (قد يستغرق وقتاً)...' : 'توليد الدرس التفاعلي'}
                      </button>
                  </div>
              </div>
          </div>
      )}
    </div>
  );
};

export default AdminInteractiveLessons;
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { dbService } from '../../services/db';
import { InteractiveLesson, InteractiveScene, InteractiveLessonProgress } from '../../types';
import { useAuth } from '../ProtectedRoute';
import { Loader2, ArrowLeft, ArrowRight, BookOpen, Star, CheckCircle, Lock, XCircle, Home, Trophy } from 'lucide-react';
import { InteractionRenderer } from './InteractionRenderer';
import GameRenderer from './GameRenderer';
import SimulationRenderer from './SimulationRenderer';
import VisualSimulator from './VisualSimulator';
import { motion, AnimatePresence } from 'framer-motion';

export const InteractiveLessonViewer: React.FC<{ lessonId: string }> = ({ lessonId }) => {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [lesson, setLesson] = useState<InteractiveLesson | null>(null);
  const [progress, setProgress] = useState<InteractiveLessonProgress | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  
  const currentSceneIndex = progress?.current_scene_index || 0;
  const currentScene = lesson?.scenes?.[currentSceneIndex] || null;
  const sceneHasInteractions = currentScene && currentScene.interactions && currentScene.interactions.length > 0;
  const isSceneCompleted = currentScene && progress?.completed_scenes.includes(currentScene.id);

  useEffect(() => {
    const loadLessonData = async () => {
      if (!user) return;
      setIsLoading(true);
      const [lessonData, progressData] = await Promise.all([
        dbService.getInteractiveLessonById(lessonId),
        dbService.getInteractiveLessonProgress(user.uid, lessonId)
      ]);
      setLesson(lessonData);
      setProgress(progressData || {
        user_id: user.uid,
        interactive_lesson_id: lessonId,
        current_scene_index: 0,
        total_points: 0,
        completed_scenes: [],
        last_activity_at: new Date().toISOString()
      });
      setIsLoading(false);
    };
    loadLessonData();
  }, [lessonId, user]);

  const updateProgress = async (updates: Partial<InteractiveLessonProgress>) => {
    if (!user || !progress) return;
    const newProgress = { ...progress, ...updates, last_activity_at: new Date().toISOString() };
    setProgress(newProgress);
    await dbService.saveInteractiveLessonProgress(newProgress);
  };
  
  const handleInteractionComplete = (points: number) => {
    if (!currentScene || isSceneCompleted) return;
    updateProgress({
      total_points: (progress?.total_points || 0) + points,
      completed_scenes: [...(progress?.completed_scenes || []), currentScene.id]
    });
  };

  const goToScene = (index: number) => {
    if (lesson && index >= 0 && index < lesson.scenes.length) {
      updateProgress({ current_scene_index: index });
    } else if (lesson && index >= lesson.scenes.length) {
      handleLessonComplete();
    }
  };

  const handleLessonComplete = async () => {
      if (!user || !lesson) return;
      await dbService.saveInteractiveLessonProgress({ 
          ...progress, 
          completed_at: new Date().toISOString(),
          current_scene_index: lesson.scenes.length - 1
      });
      // Award final points to user's main profile
      await dbService.saveUser({
          ...user,
          progress: {
              ...user.progress,
              points: (user.progress.points || 0) + (lesson.total_points || 100),
          }
      });
      // Show completion screen
      setProgress(prev => prev ? {...prev, current_scene_index: lesson.scenes.length } : prev);
  };
  
  const sceneBgColor = currentScene?.background_color || 'transparent';

  // UI States
  if (isLoading) return <div className="flex flex-col items-center justify-center h-[70vh] gap-4"><Loader2 className="animate-spin text-purple-400" size={48} /><p className="text-gray-500 font-bold uppercase tracking-widest">تحميل الرحلة...</p></div>;
  if (!lesson) return <div>لم يتم العثور على الدرس.</div>;
  
  // Completion Screen
  if (currentSceneIndex >= lesson.scenes.length) {
    return (
        <div className="flex flex-col items-center justify-center text-center h-[80vh] animate-fadeIn" dir="rtl">
            <Trophy className="w-24 h-24 text-amber-400 drop-shadow-[0_0_20px_#fbb_40]" />
            <h2 className="text-4xl font-black mt-6">أحسنت! لقد أكملت الرحلة.</h2>
            <p className="text-gray-400 mt-2">تمت إضافة <span className="font-bold text-amber-300">{lesson.total_points || 100} نقطة</span> إلى رصيدك.</p>
            <button onClick={() => navigate('/interactive')} className="mt-8 bg-purple-500 text-white px-8 py-3 rounded-full font-bold text-sm">العودة إلى قائمة الرحلات</button>
        </div>
    );
  }

  if (!currentScene) return <div>خطأ: لم يتم العثور على المشهد الحالي.</div>;

  return (
    <div className="flex flex-col h-[calc(100vh-100px)] animate-fadeIn" dir="rtl">
      {/* Header */}
      <header className="p-4 border-b border-white/10 flex-shrink-0">
        <h1 className="text-xl font-black text-purple-300 text-center">{lesson.title}</h1>
        {/* Progress Bar */}
        <div className="w-full bg-black/20 rounded-full h-2.5 mt-2 border border-white/5">
          <div 
            className="bg-purple-500 h-2 rounded-full transition-all duration-500" 
            style={{ width: `${((currentSceneIndex + 1) / lesson.scenes.length) * 100}%` }}
          ></div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto p-6 md:p-10 transition-colors" style={{ backgroundColor: sceneBgColor }}>
        <AnimatePresence mode="wait">
            <motion.div
                key={currentScene.id}
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -30 }}
                transition={{ duration: 0.4 }}
                className="max-w-4xl mx-auto"
            >
                <div className="bg-black/20 p-8 rounded-[40px] border border-white/10 backdrop-blur-md">
                    <h2 className="text-3xl font-black text-white mb-4">{currentScene.title}</h2>
                    <p className="text-gray-300 leading-relaxed whitespace-pre-line mb-8">{currentScene.content}</p>
                    
                    {currentScene.visual_type === 'image' && currentScene.visual_url && (
                        <img src={currentScene.visual_url} alt={currentScene.title || ''} className="rounded-2xl mb-6" />
                    )}
                    
                    {currentScene.visual_type === 'ai_description' && currentScene.visual_description && (
                        <VisualSimulator title={currentScene.title} visualDescription={currentScene.visual_description} />
                    )}

                    {currentScene.interactions && currentScene.interactions.length > 0 && (
                        // FIX: Pass currentScene.interactions directly, as the type in InteractionRenderer has been corrected to be compatible.
                        <InteractionRenderer interactions={currentScene.interactions} onComplete={handleInteractionComplete} />
                    )}
                    
                    {currentScene.game && <GameRenderer game={currentScene.game} onComplete={() => {}} />}
                    {currentScene.simulation && <SimulationRenderer simulation={currentScene.simulation} onComplete={() => {}} />}
                </div>
            </motion.div>
        </AnimatePresence>
      </main>

      {/* Footer Navigation */}
      <footer className="p-4 border-t border-white/10 flex justify-between items-center bg-black/30 flex-shrink-0">
        <button onClick={() => goToScene(currentSceneIndex - 1)} disabled={currentSceneIndex === 0} className="px-6 py-3 bg-white/5 rounded-full text-sm font-bold disabled:opacity-30">السابق</button>
        <span className="text-xs font-mono text-gray-500">
            {currentSceneIndex + 1} / {lesson.scenes.length}
        </span>
        <button 
            onClick={() => goToScene(currentSceneIndex + 1)} 
            disabled={sceneHasInteractions && !isSceneCompleted}
            className="px-6 py-3 bg-purple-500 text-white rounded-full text-sm font-bold disabled:opacity-50 disabled:bg-gray-600"
        >
            {currentSceneIndex === lesson.scenes.length - 1 ? 'إنهاء الرحلة' : 'التالي'}
        </button>
      </footer>
    </div>
  );
};

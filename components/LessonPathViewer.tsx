
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { User, LessonScene, StudentLessonProgress, Asset } from '../types';
import { dbService } from '../services/db';
import { useAuth } from './ProtectedRoute';
import { RefreshCw, Lock, UploadCloud, FileText, CheckCircle2 } from 'lucide-react';

const LessonPathViewer: React.FC<{ user: User }> = ({ user }) => {
    const { lessonId, sceneId } = useParams<{ lessonId: string; sceneId: string }>();
    const navigate = useNavigate();
    
    const [scene, setScene] = useState<LessonScene | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [file, setFile] = useState<File | null>(null);
    const [isUploading, setIsUploading] = useState(false);
    const [uploadedFile, setUploadedFile] = useState<Asset | null>(null);

    const isSubscriber = user.subscription === 'premium' || user.role === 'admin' || user.role === 'teacher';

    useEffect(() => {
        if (!sceneId) return;
        
        const loadScene = async () => {
            setIsLoading(true);
            setError(null);
            try {
                const sceneData = await dbService.getLessonScene(sceneId);
                if (!sceneData) throw new Error("المشهد غير موجود.");
                
                if (sceneData.is_premium && !isSubscriber) {
                    navigate('/subscription');
                    return;
                }
                
                setScene(sceneData);
            } catch (e: any) {
                setError(e.message);
            } finally {
                setIsLoading(false);
            }
        };
        loadScene();

    }, [sceneId, user, navigate, isSubscriber]);

    const handleDecision = async (nextSceneId: string, decisionText: string) => {
        if (!lessonId || !sceneId) return;
        
        let fileAsset: Asset | null = uploadedFile;
        if (file && !uploadedFile) {
            setIsUploading(true);
            fileAsset = await dbService.uploadAsset(file, true);
            setIsUploading(false);
        }

        const progress: Partial<StudentLessonProgress> = {
            student_id: user.uid,
            lesson_id: lessonId,
            current_scene_id: nextSceneId,
            answers: { [sceneId]: decisionText },
            uploaded_files: fileAsset ? { [sceneId]: fileAsset } : {},
            updated_at: new Date().toISOString()
        };

        await dbService.saveStudentLessonProgress(progress);
        navigate(`/lesson/${lessonId}/path/${nextSceneId}`);
    };

    if (isLoading) {
        return <div className="p-40 text-center animate-pulse"><RefreshCw className="animate-spin mx-auto" /></div>;
    }
    
    if (error) {
        return <div className="p-20 text-center text-red-500 font-bold">{error}</div>;
    }

    if (!scene) return null;

    return (
        <div className="max-w-4xl mx-auto py-12 animate-fadeIn" dir="rtl">
            <div className="glass-panel p-12 rounded-[50px] border-white/5 bg-black/20">
                <h1 className="text-4xl font-black mb-8 text-[#fbbf24]">{scene.title}</h1>
                <p className="text-lg text-gray-300 leading-relaxed mb-10">{scene.content.text}</p>
                
                {scene.content.imageUrl && <img src={scene.content.imageUrl} className="rounded-2xl mb-6" />}
                {scene.content.videoUrl && <video src={scene.content.videoUrl} controls className="rounded-2xl mb-6 w-full" />}
                
                {scene.content.requiresUpload && (
                    <div className="p-6 bg-white/5 rounded-2xl border border-white/10 mb-8">
                        {uploadedFile ? (
                            <div className="flex items-center gap-3 text-green-400 font-bold">
                                <CheckCircle2 /> <span>تم رفع الملف: {uploadedFile.name}</span>
                            </div>
                        ) : (
                            <label className="flex items-center gap-3 cursor-pointer">
                                <UploadCloud />
                                <span className="font-bold">{file ? `الملف المحدد: ${file.name}` : 'ارفع ملفاً للمتابعة'}</span>
                                <input type="file" onChange={e => setFile(e.target.files ? e.target.files[0] : null)} className="hidden" />
                            </label>
                        )}
                    </div>
                )}

                <div className="pt-8 border-t border-white/10 space-y-4">
                    <h3 className="text-lg font-bold">ما هو قرارك؟</h3>
                    {scene.decisions.map((dec, idx) => (
                        <button 
                            key={idx}
                            onClick={() => handleDecision(dec.next_scene_id, dec.text)}
                            disabled={isUploading || (scene.content.requiresUpload && !file && !uploadedFile)}
                            className="w-full p-4 bg-blue-500/10 text-blue-300 rounded-lg text-right font-bold hover:bg-blue-500/20 disabled:opacity-50"
                        >
                            {dec.text}
                        </button>
                    ))}
                </div>
            </div>
        </div>
    );
};

export default LessonPathViewer;

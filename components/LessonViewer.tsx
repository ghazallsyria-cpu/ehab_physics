import React, { useState, useEffect } from 'react';
import { Lesson, User, ContentBlock } from '../types';
import { dbService } from '../services/db';
import katex from 'katex';
import YouTubePlayer from './YouTubePlayer';
import { Share2, Copy, Send, Twitter, Mail, X, Check, Eye, EyeOff, Lock, Zap } from 'lucide-react';

interface LessonViewerProps {
  user: User;
  lesson: Lesson;
}

const LessonViewer: React.FC<LessonViewerProps> = ({ user, lesson }) => {
  const [isCompleted, setIsCompleted] = useState(false);
  const [isShareModalOpen, setIsShareModalOpen] = useState(false);
  const [copySuccess, setCopySuccess] = useState(false);
  const [isContentVisible, setIsContentVisible] = useState(true);
  const [scrollProgress, setScrollProgress] = useState(0);

  // 💰 التحقق من الاشتراك: الدروس الأولى مجانية (اختياري)، الباقي بريميوم
  const isSubscriber = user.subscription === 'premium' || user.role === 'admin' || user.role === 'teacher';

  useEffect(() => {
    setIsCompleted((user.progress.completedLessonIds || []).includes(lesson.id));
  }, [user, lesson]);

  useEffect(() => {
    const handleScroll = () => {
        const totalScrollableHeight = document.documentElement.scrollHeight - window.innerHeight;
        if (totalScrollableHeight <= 0) {
            setScrollProgress(100);
            return;
        }
        const currentScroll = window.scrollY;
        const progress = (currentScroll / totalScrollableHeight) * 100;
        setScrollProgress(Math.min(progress, 100));
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const handleToggleComplete = async () => {
    if (!isSubscriber) return;
    const wasCompleted = isCompleted;
    await dbService.toggleLessonComplete(user.uid, lesson.id);
    setIsCompleted(!isCompleted);
    if (!wasCompleted) {
        await dbService.createNotification({
            userId: user.uid,
            title: "إنجاز جديد!",
            message: `أحسنت! لقد أكملت درس "${lesson.title}". +10 نقاط!`,
            timestamp: new Date().toISOString(),
            isRead: false,
            type: 'success',
            category: 'academic'
        });
    }
  };

  const renderContentBlock = (block: ContentBlock, index: number) => {
    // 🛡️ منطق حماية المحتوى: إذا لم يكن مشتركاً، لا ترسم أي بلوك محتوى فعلي
    if (!isSubscriber) return null;

    switch (block.type) {
      case 'text':
        const html = block.content
          .replace(/(\$\$[\s\S]*?\$\$)/g, (match) => katex.renderToString(match.slice(2, -2), { displayMode: true, throwOnError: false }))
          .replace(/(\$.*?\$)/g, (match) => katex.renderToString(match.slice(1, -1), { throwOnError: false }));
        return <div key={index} className="prose prose-invert prose-lg max-w-none text-gray-300 leading-loose text-xl md:text-2xl mb-10" dangerouslySetInnerHTML={{ __html: html }} />;
      case 'image':
        return <img key={index} src={block.content} className="w-full h-auto rounded-[30px] border border-white/10 my-10" />;
      case 'video':
      case 'youtube':
        // تحويل الروابط لعرض الفيديو
        return <div key={index} className="aspect-video bg-black rounded-[30px] overflow-hidden border border-white/10 my-10"><YouTubePlayer videoId={block.content.includes('v=') ? block.content.split('v=')[1] : block.content} /></div>;
      default:
        return null;
    }
  };

  return (
    <div className="max-w-4xl mx-auto animate-fadeIn font-['Tajawal']" dir="rtl">
        <div className="glass-panel p-10 md:p-16 rounded-[60px] border-white/5 bg-black/40 relative overflow-hidden">
            
            {/* عرض قفل للمشتركين المجانيين */}
            {!isSubscriber && (
                <div className="absolute inset-0 z-50 flex flex-col items-center justify-center bg-[#0a1118]/95 backdrop-blur-xl p-10 text-center">
                    <div className="w-24 h-24 bg-amber-500/20 rounded-[40px] flex items-center justify-center text-amber-500 mb-8 border border-amber-500/30 animate-bounce">
                        <Lock size={48} />
                    </div>
                    <h2 className="text-4xl font-black text-white mb-4 italic">هذا المحتوى <span className="text-amber-500">حصرى</span></h2>
                    <p className="text-gray-400 text-lg mb-10 max-w-md">يجب أن تكون مشتركاً في باقة التفوق للوصول إلى كافة الدروس، الفيديوهات، وبنك الأسئلة.</p>
                    <button 
                        onClick={() => window.dispatchEvent(new CustomEvent('change-view', { detail: { view: 'subscription' } }))}
                        className="bg-amber-500 text-black px-12 py-5 rounded-2xl font-black text-xs uppercase tracking-widest hover:scale-105 transition-all shadow-2xl flex items-center gap-3"
                    >
                        <Zap size={18} /> اشترك الآن وفعل حسابك
                    </button>
                    <p className="mt-8 text-gray-600 text-xs font-bold">بوابة المركز السوري للعلوم - الكويت</p>
                </div>
            )}

            <h2 className="text-4xl md:text-5xl font-black text-white mb-4 text-right">{lesson.title}</h2>
            
            {isSubscriber && (
                <>
                    <div className="flex items-center justify-between mb-10">
                        <div className="flex items-center gap-4">
                            <span className="px-4 py-1 bg-[#00d2ff]/10 text-[#00d2ff] rounded-full text-[10px] font-bold border border-[#00d2ff]/20">{lesson.type}</span>
                        </div>
                        <button onClick={() => setIsShareModalOpen(true)} className="p-3 bg-white/5 border border-white/10 rounded-2xl text-gray-400 hover:text-[#00d2ff] transition-all"><Share2 size={18} /></button>
                    </div>
                    
                    <div className="w-full h-1 bg-white/5 rounded-full mb-10 overflow-hidden">
                        <div className="h-full bg-gradient-to-r from-amber-400 to-yellow-500 rounded-full transition-all" style={{ width: `${scrollProgress}%` }}></div>
                    </div>

                    <div className="space-y-2">
                        {(lesson.content || []).map(renderContentBlock)}
                    </div>

                    <div className="mt-16 pt-10 border-t border-white/5 flex justify-end gap-6">
                        <button onClick={handleToggleComplete} className={`px-8 py-4 rounded-2xl font-bold text-xs uppercase transition-all flex items-center gap-2 shadow-xl ${isCompleted ? 'bg-green-500/10 text-green-400 border-green-500/20' : 'bg-[#fbbf24] text-black hover:scale-105 active:scale-95'}`}>
                        {isCompleted ? '✓ مكتمل' : 'إكمال الدرس'}
                        </button>
                    </div>
                </>
            )}
        </div>
    </div>
  );
};

export default LessonViewer;

import React, { useState, useEffect } from 'react';
import { Lesson, User, ContentBlock } from '../types';
import { dbService } from '../services/db';
import katex from 'katex';
import YouTubePlayer from './YouTubePlayer';
import { Share2, Copy, Send, Twitter, Mail, X, Check, Eye, EyeOff, Lock, Zap, FileText, Download, ExternalLink } from 'lucide-react';
import UniversalLessonViewer from './UniversalLessonViewer';

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

  // 💰 التحقق من الاشتراك
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

  const handleBack = () => {
      window.dispatchEvent(new CustomEvent('go-back'));
  };

  // ROUTING: Check for Universal Lesson Template
  if (lesson.templateType === 'UNIVERSAL') {
      return (
          <UniversalLessonViewer 
              lesson={lesson} 
              onBack={handleBack} 
              onComplete={handleToggleComplete}
              isCompleted={isCompleted}
          />
      );
  }

  const renderContentBlock = (block: ContentBlock, index: number) => {
    // 🛡️ حماية المحتوى
    if (!isSubscriber) return null;

    switch (block.type) {
      case 'text':
        const html = block.content
          .replace(/(\$\$[\s\S]*?\Metadata[\s\S]*?\$\$)/g, (match) => katex.renderToString(match.slice(2, -2), { displayMode: true, throwOnError: false }))
          .replace(/(\$.*?\$)/g, (match) => katex.renderToString(match.slice(1, -1), { throwOnError: false }));
        return <div key={index} className="prose prose-invert prose-lg max-w-none text-gray-300 leading-loose text-xl md:text-2xl mb-10" dangerouslySetInnerHTML={{ __html: html }} />;
      
      case 'image':
        return (
          <div key={index} className="my-10 space-y-4">
            <img src={block.content} className="w-full h-auto rounded-[30px] border border-white/10 shadow-2xl" alt={block.caption || 'Lesson visual'} />
            {block.caption && <p className="text-center text-gray-500 text-sm italic">{block.caption}</p>}
          </div>
        );

      case 'pdf':
        return (
          <div key={index} className="my-10 p-8 md:p-12 glass-panel rounded-[40px] border-2 border-blue-500/20 bg-blue-500/5 flex flex-col md:flex-row items-center gap-8 group hover:border-blue-500/40 transition-all">
            <div className="w-20 h-20 bg-blue-500 text-white rounded-[25px] flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform">
                <FileText size={40} />
            </div>
            <div className="flex-1 text-center md:text-right">
                <h4 className="text-xl font-black text-white mb-2">{block.caption || 'ملف PDF ملحق بالدرس'}</h4>
                <p className="text-gray-500 text-sm font-medium">مذكرة دراسية أو ملخص بصيغة PDF قابلة للتحميل والطباعة.</p>
            </div>
            <div className="flex flex-col gap-3 w-full md:w-auto">
                <a 
                    href={block.content} 
                    target="_blank" 
                    rel="noopener noreferrer" 
                    className="flex items-center justify-center gap-3 px-8 py-4 bg-white text-black rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-blue-400 transition-all shadow-xl"
                >
                    <ExternalLink size={16} /> فتح الملف
                </a>
                <a 
                    href={block.content} 
                    download 
                    className="flex items-center justify-center gap-3 px-8 py-3 bg-white/5 border border-white/10 text-gray-400 rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-white/10 hover:text-white transition-all"
                >
                    <Download size={14} /> تحميل للتحضير
                </a>
            </div>
          </div>
        );

      case 'video':
      case 'youtube':
        const videoId = block.content.includes('v=') ? block.content.split('v=')[1] : block.content;
        return (
          <div key={index} className="my-10 space-y-4">
            <div className="aspect-video bg-black rounded-[30px] overflow-hidden border border-white/10 shadow-2xl">
              <YouTubePlayer videoId={videoId} />
            </div>
            {block.caption && <p className="text-center text-gray-500 text-sm italic">{block.caption}</p>}
          </div>
        );
        
      case 'html':
        return (
          <div key={index} className="my-12 w-full bg-black border border-white/10 rounded-[30px] overflow-hidden shadow-2xl relative group">
             <div className="absolute top-0 left-0 bg-[#fbbf24] text-black px-3 py-1 text-[9px] font-black uppercase tracking-widest z-10 rounded-br-xl">Custom Component</div>
             <iframe
                srcDoc={`
                  <!DOCTYPE html>
                  <html dir="rtl">
                  <head>
                    <meta charset="UTF-8">
                    <style>body { margin: 0; background: transparent; color: #fff; font-family: sans-serif; }</style>
                  </head>
                  <body>
                    ${block.content}
                  </body>
                  </html>
                `}
                title={`Interactive Content ${index}`}
                className="w-full h-[500px] border-none bg-transparent"
                sandbox="allow-scripts allow-same-origin allow-popups"
             />
             {block.caption && <p className="p-4 bg-black/80 text-center text-gray-500 text-sm italic">{block.caption}</p>}
          </div>
        );

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

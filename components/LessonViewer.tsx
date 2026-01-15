
import React, { useState, useEffect } from 'react';
import { Lesson, User, ContentBlock } from '../types';
import { dbService } from '../services/db';
import katex from 'katex';
import YouTubePlayer from './YouTubePlayer';
import { Share2, Copy, Send, Twitter, Mail, X, Check } from 'lucide-react';

interface LessonViewerProps {
  user: User;
  lesson: Lesson;
}

const LessonViewer: React.FC<LessonViewerProps> = ({ user, lesson }) => {
  const [isCompleted, setIsCompleted] = useState(false);
  const [isShareModalOpen, setIsShareModalOpen] = useState(false);
  const [copySuccess, setCopySuccess] = useState(false);

  useEffect(() => {
    setIsCompleted((user.progress.completedLessonIds || []).includes(lesson.id));
  }, [user, lesson]);

  const handleToggleComplete = async () => {
    await dbService.toggleLessonComplete(user.uid, lesson.id);
    setIsCompleted(!isCompleted);
  };
  
  const handleCopyLink = () => {
    const url = window.location.href;
    navigator.clipboard.writeText(url).then(() => {
      setCopySuccess(true);
      setTimeout(() => setCopySuccess(false), 2000);
    });
  };

  const extractYoutubeId = (url: string) => {
    try {
      const urlObj = new URL(url);
      if (urlObj.hostname.includes('youtube.com')) {
        if (urlObj.pathname.includes('/shorts/')) return urlObj.pathname.split('/shorts/')[1].split(/[?#]/)[0];
        if (urlObj.pathname.includes('/embed/')) return urlObj.pathname.split('/embed/')[1].split(/[?#]/)[0];
        return urlObj.searchParams.get('v');
      } else if (urlObj.hostname.includes('youtu.be')) {
        return urlObj.pathname.slice(1).split(/[?#]/)[0];
      }
    } catch (e) {
      const regExp = /^.*(youtu\.be\/|v\/|u\/\w\/|embed\/|watch\?v=|\&v=)([^#\&\?]*).*/;
      const match = url.match(regExp);
      return (match && match[2].length === 11) ? match[2] : null;
    }
    return null;
  };

  const handleNativeShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: `درس: ${lesson.title} - المركز السوري للعلوم`,
          text: `شاهد درس "${lesson.title}" على منصة المركز السوري للعلوم.`,
          url: window.location.href,
        });
      } catch (err) {
        console.log('Share failed:', err);
      }
    }
  };

  const shareLinks = {
    whatsapp: `https://wa.me/?text=${encodeURIComponent(`درس: ${lesson.title} - المركز السوري للعلوم \n ${window.location.href}`)}`,
    twitter: `https://twitter.com/intent/tweet?text=${encodeURIComponent(`أدرس الآن درس "${lesson.title}" على منصة المركز السوري للعلوم ⚛️`)}&url=${encodeURIComponent(window.location.href)}`,
    email: `mailto:?subject=${encodeURIComponent(`درس فيزياء: ${lesson.title}`)}&body=${encodeURIComponent(`مرحباً، \n\nأود مشاركة هذا الدرس معك من المركز السوري للعلوم: \n\n${lesson.title} \n\nالرابط: ${window.location.href}`)}`
  };
  
  const renderTextBlock = (content: string) => {
    const html = content
      .replace(/(\$\$[\s\S]*?\$\$)/g, (match) => katex.renderToString(match.slice(2, -2), { displayMode: true, throwOnError: false }))
      .replace(/(\$.*?\$)/g, (match) => katex.renderToString(match.slice(1, -1), { throwOnError: false }));
      
    return <div className="prose prose-invert prose-lg max-w-none text-gray-300 leading-loose text-xl md:text-2xl" dangerouslySetInnerHTML={{ __html: html }} />;
  };

  const renderVideoBlock = (url: string) => {
    const videoId = extractYoutubeId(url);

    if (videoId) {
        return (
            <div className="aspect-video bg-black rounded-[30px] overflow-hidden border border-white/10 shadow-lg">
                <YouTubePlayer videoId={videoId} />
            </div>
        );
    }

    // Fallback for non-youtube generic video links
    return (
      <div className="aspect-video bg-black rounded-[30px] overflow-hidden border border-white/10 shadow-lg">
        <iframe
          width="100%"
          height="100%"
          src={url}
          title="Video player"
          frameBorder="0"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowFullScreen
        ></iframe>
      </div>
    );
  };

  const renderContentBlock = (block: ContentBlock, index: number) => {
    switch (block.type) {
      case 'text':
        return renderTextBlock(block.content);
      case 'image':
        return (
          <figure className="my-10">
            <img src={block.content} alt={block.caption || `Lesson image ${index + 1}`} className="w-full h-auto rounded-[30px] border border-white/10" />
            {block.caption && <figcaption className="text-center text-sm text-gray-500 mt-4 italic">{block.caption}</figcaption>}
          </figure>
        );
      case 'video':
        return (
           <figure className="my-10">
            {renderVideoBlock(block.content)}
            {block.caption && <figcaption className="text-center text-sm text-gray-500 mt-4 italic">{block.caption}</figcaption>}
          </figure>
        );
      case 'youtube':
        const ytId = extractYoutubeId(block.content);
        return (
          <figure className="my-10">
            <div className="aspect-video bg-black rounded-[30px] overflow-hidden border border-white/10 shadow-lg">
               {ytId ? (
                 <YouTubePlayer videoId={ytId} />
               ) : (
                 <div className="w-full h-full flex flex-col items-center justify-center p-10 text-center bg-white/5">
                    <span className="text-4xl mb-4">⚠️</span>
                    <p className="text-sm font-bold text-red-400">رابط يوتيوب غير صالح</p>
                    <p className="text-[10px] text-gray-500 mt-2">يرجى التحقق من الرابط في محرر الدروس</p>
                 </div>
               )}
            </div>
             {block.caption && <figcaption className="text-center text-sm text-gray-500 mt-4 italic">{block.caption}</figcaption>}
          </figure>
        );
      case 'pdf':
        return (
          <figure className="my-10">
            <div className="aspect-[4/5] bg-black rounded-[30px] overflow-hidden border border-white/10 shadow-lg">
              <iframe src={block.content} width="100%" height="100%" title={block.caption || `PDF Document ${index+1}`}></iframe>
            </div>
             {block.caption && <figcaption className="text-center text-sm text-gray-500 mt-4 italic">{block.caption}</figcaption>}
          </figure>
        );
      default:
        return null;
    }
  };

  return (
    <div className="max-w-4xl mx-auto animate-fadeIn font-['Tajawal']">
        <div className="glass-panel p-10 md:p-16 rounded-[60px] border-white/5 bg-black/40 relative">
            <h2 className="text-4xl md:text-5xl font-black text-white mb-4">{lesson.title}</h2>
            <div className="flex items-center justify-between mb-10">
                <div className="flex items-center gap-4">
                  <span className="px-4 py-1 bg-[#00d2ff]/10 text-[#00d2ff] rounded-full text-[10px] font-bold border border-[#00d2ff]/20">{lesson.type}</span>
                </div>
                <button 
                  onClick={() => setIsShareModalOpen(true)}
                  className="p-3 bg-white/5 border border-white/10 rounded-2xl text-gray-400 hover:text-[#00d2ff] hover:bg-[#00d2ff]/5 transition-all flex items-center gap-2 group"
                >
                  <Share2 size={18} className="group-hover:scale-110 transition-transform" />
                  <span className="text-[10px] font-bold uppercase tracking-widest hidden sm:inline">مشاركة</span>
                </button>
            </div>
            <div className="space-y-8">
              {(lesson.content || []).map(renderContentBlock)}
            </div>

            <div className="mt-16 pt-10 border-t border-white/5 flex flex-col sm:flex-row justify-between items-center gap-6">
              <button onClick={() => window.dispatchEvent(new CustomEvent('change-view', { detail: { view: 'curriculum' } }))} className="text-gray-500 font-bold text-sm hover:text-white transition-colors">← العودة للمنهج</button>
              <div className="flex items-center gap-4">
                <button onClick={() => setIsShareModalOpen(true)} className="px-8 py-4 rounded-2xl font-bold text-xs uppercase bg-white/5 border border-white/10 text-gray-400 hover:text-white transition-all flex items-center gap-2">
                   <Share2 size={14} /> مشاركة الدرس
                </button>
                <button onClick={handleToggleComplete} className={`px-8 py-4 rounded-2xl font-bold text-xs uppercase transition-all flex items-center gap-2 shadow-xl ${isCompleted ? 'bg-green-500/10 text-green-500 border border-green-500/20' : 'bg-[#fbbf24] text-black hover:scale-105 active:scale-95'}`}>
                  {isCompleted ? '✓ مكتمل' : 'إكمال الدرس'}
                </button>
              </div>
            </div>
        </div>

        {/* Share Modal */}
        {isShareModalOpen && (
          <div className="fixed inset-0 z-[150] bg-black/80 backdrop-blur-md flex items-center justify-center p-6 animate-fadeIn" onClick={() => setIsShareModalOpen(false)}>
            <div 
              className="glass-panel w-full max-w-md p-10 rounded-[50px] border-white/10 relative shadow-3xl bg-[#0a1118]"
              onClick={e => e.stopPropagation()}
            >
              <button onClick={() => setIsShareModalOpen(false)} className="absolute top-6 left-6 text-gray-500 hover:text-white p-2 bg-white/5 rounded-full">
                <X size={18} />
              </button>
              
              <div className="text-center mb-10">
                <div className="w-16 h-16 bg-[#00d2ff]/10 text-[#00d2ff] rounded-3xl flex items-center justify-center mx-auto mb-6">
                  <Share2 size={32} />
                </div>
                <h3 className="text-2xl font-black text-white">مشاركة الدرس</h3>
                <p className="text-gray-500 text-sm mt-2">شارك الفائدة مع زملائك في الدراسة</p>
              </div>

              <div className="space-y-4">
                <div className="flex items-center gap-4 p-4 bg-black/40 border border-white/10 rounded-2xl">
                   <input 
                    type="text" 
                    readOnly 
                    value={window.location.href} 
                    className="flex-1 bg-transparent text-[10px] text-gray-500 outline-none truncate font-mono"
                   />
                   <button 
                    onClick={handleCopyLink}
                    className={`flex items-center gap-2 px-4 py-2 rounded-xl text-[10px] font-black uppercase transition-all ${copySuccess ? 'bg-green-500 text-white' : 'bg-white/5 text-gray-300 hover:bg-white/10'}`}
                   >
                     {copySuccess ? <><Check size={12}/> تم النسخ</> : <><Copy size={12}/> نسخ</>}
                   </button>
                </div>

                <div className="grid grid-cols-3 gap-3">
                   <a 
                    href={shareLinks.whatsapp} 
                    target="_blank" 
                    rel="noreferrer"
                    className="flex flex-col items-center justify-center gap-3 p-6 bg-green-500/10 border border-green-500/20 rounded-3xl text-green-500 hover:bg-green-500 hover:text-black transition-all group"
                   >
                      <Send size={24} className="group-hover:scale-110 transition-transform" />
                      <span className="text-[9px] font-black uppercase tracking-widest">WhatsApp</span>
                   </a>
                   <a 
                    href={shareLinks.twitter} 
                    target="_blank" 
                    rel="noreferrer"
                    className="flex flex-col items-center justify-center gap-3 p-6 bg-sky-500/10 border border-sky-500/20 rounded-3xl text-sky-400 hover:bg-sky-500 hover:text-black transition-all group"
                   >
                      <Twitter size={24} className="group-hover:scale-110 transition-transform" />
                      <span className="text-[9px] font-black uppercase tracking-widest">Twitter</span>
                   </a>
                   <a 
                    href={shareLinks.email} 
                    className="flex flex-col items-center justify-center gap-3 p-6 bg-purple-500/10 border border-purple-500/20 rounded-3xl text-purple-400 hover:bg-purple-500 hover:text-black transition-all group"
                   >
                      <Mail size={24} className="group-hover:scale-110 transition-transform" />
                      <span className="text-[9px] font-black uppercase tracking-widest">Email</span>
                   </a>
                </div>

                {navigator.share && (
                  <button 
                    onClick={handleNativeShare}
                    className="w-full mt-4 py-4 bg-[#00d2ff] text-black rounded-[25px] font-black text-xs uppercase tracking-widest shadow-xl hover:scale-[1.02] active:scale-95 transition-all"
                  >
                    مشاركة عبر النظام
                  </button>
                )}
              </div>
            </div>
          </div>
        )}
    </div>
  );
};

export default LessonViewer;

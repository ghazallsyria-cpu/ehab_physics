
import React, { useState, useEffect, useMemo } from 'react';
import { User, ForumPost, ForumReply, ForumSection, Forum as ForumType, LoggingSettings } from '../types';
import { dbService } from '../services/db';
import { contentFilter } from '../services/contentFilter';
import { 
  ArrowUp, 
  MessageSquare, 
  ChevronLeft, 
  Users, 
  Clock,
  ArrowRight,
  Pin,
  AlertCircle,
  Plus,
  RefreshCw,
  X,
  Send,
  Lock,
  Zap,
  Bell
} from 'lucide-react';

interface ForumProps {
  user: User | null;
}

const Forum: React.FC<ForumProps> = ({ user }) => {
  const [sections, setSections] = useState<ForumSection[]>([]);
  const [activeForum, setActiveForum] = useState<ForumType | null>(null);
  const [posts, setPosts] = useState<ForumPost[]>([]);
  const [showAskModal, setShowAskModal] = useState(false);
  const [selectedPost, setSelectedPost] = useState<ForumPost | null>(null);
  const [newQuestion, setNewQuestion] = useState({ title: '', content: '' });
  const [replyContent, setReplyContent] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [sortBy, setSortBy] = useState<'newest' | 'top'>('newest');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [forumSettings, setForumSettings] = useState<LoggingSettings | null>(null);

  useEffect(() => {
    loadInitialData();
  }, []);

  const loadInitialData = async () => {
    setIsLoading(true);
    try {
      const [sectionsData, settingsData] = await Promise.all([
        dbService.getForumSections(),
        dbService.getLoggingSettings()
      ]);
      setSections(sectionsData);
      setForumSettings(settingsData);
    } catch (e) { console.error("Forum init failed", e); }
    finally { setIsLoading(false); }
  };

  const loadPosts = async (forumId: string) => {
    setIsLoading(true);
    try {
        const forumPosts = await dbService.getForumPosts(forumId);
        setPosts(forumPosts);
    } catch (e) { console.error(e); }
    finally { setIsLoading(false); }
  };

  const handleForumClick = (forum: ForumType) => {
    setActiveForum(forum);
    loadPosts(forum.id);
  };

  const canInteract = useMemo(() => {
    if (!user) return false;
    if (user.role === 'admin' || user.role === 'teacher') return true;
    if (forumSettings?.forumAccessTier === 'premium') return user.subscription === 'premium';
    return true;
  }, [user, forumSettings]);

  const handleAsk = async () => {
    if (!user || !activeForum) return;
    if (!canInteract) { 
        alert("🔒 النشر متاح لمشتركي باقة التفوق فقط."); 
        return; 
    }
    
    const title = newQuestion.title.trim();
    const content = newQuestion.content.trim();
    if (!title || !content) { 
        setErrorMsg("يرجى ملء جميع الحقول."); 
        return; 
    }

    const check = contentFilter.filter(`${title} ${content}`);
    if (!check.isClean) { 
        setErrorMsg("⚠️ محتوى غير لائق."); 
        return; 
    }

    setIsSubmitting(true);
    setErrorMsg(null);
    try {
      const postData = {
        authorUid: user.uid,
        authorEmail: user.email,
        authorName: user.name,
        title, content,
        tags: [activeForum.id],
        upvotes: 0,
        replies: [],
        timestamp: new Date().toISOString()
      };
      await dbService.createForumPost(postData);
      setShowAskModal(false);
      setNewQuestion({ title: '', content: '' });
      await loadPosts(activeForum.id);
    } catch (e) { 
        console.error(e);
        setErrorMsg("فشل النشر. تأكد من اتصالك بالإنترنت."); 
    }
    finally { setIsSubmitting(false); }
  };

  const handleReply = async () => {
    if (!user || !selectedPost || !replyContent.trim()) return;
    if (!canInteract) { 
        alert("🔒 الردود متاحة للمشتركين فقط."); 
        return; 
    }

    setIsSubmitting(true);
    try {
      await dbService.addForumReply(selectedPost.id, {
        authorUid: user.uid,
        authorEmail: user.email,
        authorName: user.name,
        content: replyContent,
        role: user.role
      });
      setReplyContent('');
      const updatedPosts = await dbService.getForumPosts(activeForum!.id);
      setPosts(updatedPosts);
      setSelectedPost(updatedPosts.find(p => p.id === selectedPost.id) || null);
    } catch (e) { alert("فشل إرسال الرد."); }
    finally { setIsSubmitting(false); }
  };

  const sortedPosts = useMemo(() => {
    return [...posts].sort((a, b) => {
      if (sortBy === 'top') return (b.upvotes || 0) - (a.upvotes || 0);
      return new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime();
    });
  }, [posts, sortBy]);

  if (!activeForum) {
    return (
      <div className="max-w-6xl mx-auto py-12 animate-fadeIn text-right" dir="rtl">
        <header className="mb-16">
          <h2 className="text-4xl md:text-6xl font-black text-white italic tracking-tighter">ساحة <span className="text-[#fbbf24]">النقاش</span> الأكاديمي</h2>
          <p className="text-gray-500 text-lg md:text-xl mt-2 font-medium">بيئة آمنة لتبادل المعرفة الفيزيائية بين المعلمين والطلاب.</p>
        </header>
        {isLoading ? (
            <div className="py-20 text-center animate-pulse">
                <RefreshCw className="w-12 h-12 text-[#fbbf24] animate-spin mx-auto mb-4" />
                <p className="text-gray-500 font-bold">جاري تحميل الأقسام...</p>
            </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {sections.flatMap(s => s.forums).map(forum => (
              <div key={forum.id} onClick={() => handleForumClick(forum)} className="glass-panel p-8 rounded-[40px] border-white/5 hover:border-[#fbbf24]/40 cursor-pointer transition-all group relative overflow-hidden bg-black/20 shadow-xl">
                <div className="w-16 h-16 rounded-2xl bg-white/5 flex items-center justify-center text-3xl mb-6 group-hover:bg-[#fbbf24] group-hover:text-black transition-all">
                    {forum.imageUrl ? <img src={forum.imageUrl} className="w-full h-full object-cover rounded-2xl" alt={forum.title} /> : forum.icon}
                </div>
                <h3 className="text-2xl font-black text-white group-hover:text-[#fbbf24] transition-colors">{forum.title}</h3>
                <p className="text-gray-500 text-sm line-clamp-2 mt-2 leading-relaxed">{forum.description}</p>
                <div className="mt-8 pt-6 border-t border-white/5 flex justify-between items-center text-[10px] font-black text-gray-600 uppercase tracking-widest">
                   <span className="flex items-center gap-2"><Users size={14}/> تصفح المواضيع</span>
                   <ChevronLeft className="group-hover:translate-x-[-10px] transition-transform" />
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto animate-fadeIn pb-24 text-right font-['Tajawal']" dir="rtl">
      <div className="flex flex-col lg:flex-row justify-between items-end mb-12 gap-8">
        <button onClick={() => setActiveForum(null)} className="flex items-center gap-2 text-gray-500 hover:text-white font-black text-xs uppercase tracking-widest transition-all"> <ArrowRight /> العودة للدليل الرئيسي </button>
        <div className="text-right lg:text-left">
          <h2 className="text-4xl font-black text-white">{activeForum.title}</h2>
          <p className="text-gray-500 italic mt-1">{activeForum.description}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
        <div className="lg:col-span-8 space-y-6">
          <div className="flex flex-col sm:flex-row justify-between items-center bg-black/40 p-4 rounded-[30px] border border-white/5 gap-4 shadow-xl">
             <div className="flex gap-2 bg-black/40 p-1.5 rounded-2xl border border-white/5">
                <button onClick={() => setSortBy('newest')} className={`px-6 py-2 rounded-xl text-[10px] font-black transition-all ${sortBy === 'newest' ? 'bg-white text-black shadow-lg' : 'text-gray-500'}`}>الأحدث</button>
                <button onClick={() => setSortBy('top')} className={`px-6 py-2 rounded-xl text-[10px] font-black transition-all ${sortBy === 'top' ? 'bg-white text-black shadow-lg' : 'text-gray-500'}`}>الأكثر تفاعلاً</button>
             </div>
             <button 
                onClick={() => setShowAskModal(true)} 
                className={`px-10 py-4 rounded-2xl font-black text-xs uppercase flex items-center gap-3 transition-all z-10 shadow-xl ${canInteract ? 'bg-[#fbbf24] text-black hover:scale-105 active:scale-95 shadow-yellow-500/10' : 'bg-gray-800 text-gray-500 cursor-not-allowed'}`}
             >
                {canInteract ? <Plus size={18}/> : <Lock size={18}/>} موضوع جديد
             </button>
          </div>

          {isLoading ? (
              <div className="py-20 text-center animate-pulse text-gray-500">جاري جلب النقاشات...</div>
          ) : sortedPosts.map(post => (
            <div key={post.id} onClick={() => setSelectedPost(post)} className={`glass-panel p-8 rounded-[40px] border-2 cursor-pointer transition-all flex gap-8 group relative bg-black/20 ${selectedPost?.id === post.id ? 'border-[#fbbf24] bg-[#fbbf24]/5 shadow-[0_0_40px_rgba(251,191,36,0.1)]' : 'border-white/5 hover:border-white/10'}`}>
              <div className="flex flex-col items-center gap-2 bg-white/5 p-4 rounded-[25px] h-fit border border-white/5 min-w-[70px]">
                <button onClick={(e) => { e.stopPropagation(); dbService.upvoteForumPost(post.id).then(() => loadPosts(activeForum.id)); }} className="text-gray-500 hover:text-amber-400 hover:scale-125 transition-all active:scale-90"><ArrowUp size={28} /></button>
                <span className="font-black text-2xl text-white tabular-nums">{post.upvotes || 0}</span>
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-3 mb-3">
                   {post.isPinned && <Pin size={16} className="text-amber-400 fill-amber-400" />}
                   <h3 className="text-2xl font-black text-white group-hover:text-[#fbbf24] transition-colors truncate">{post.title}</h3>
                </div>
                <p className="text-gray-500 line-clamp-2 text-sm leading-relaxed mb-6 italic">"{post.content}"</p>
                <div className="flex justify-between items-center text-[9px] font-black text-gray-600 uppercase tracking-widest border-t border-white/5 pt-5">
                  <span className="flex items-center gap-2 bg-white/5 px-4 py-2 rounded-full">👤 {post.authorName} • <Clock size={12}/> {new Date(post.timestamp).toLocaleDateString('ar-KW')}</span>
                  <span className="bg-white/5 px-4 py-2 rounded-full flex items-center gap-2 text-blue-400"><MessageSquare size={12}/> {post.replies?.length || 0} ردود</span>
                </div>
              </div>
            </div>
          ))}
          {sortedPosts.length === 0 && !isLoading && <div className="py-40 text-center glass-panel rounded-[50px] border-2 border-dashed border-white/10 opacity-30"><MessageSquare size={64} className="mx-auto mb-6 text-gray-600" /><p className="font-black text-xl uppercase tracking-widest">لا توجد مواضيع في هذا القسم حالياً.</p></div>}
        </div>

        <div className="lg:col-span-4 h-fit sticky top-32">
          {selectedPost ? (
            <div className="glass-panel p-8 rounded-[50px] border-white/10 bg-[#0a1118]/90 flex flex-col max-h-[75vh] shadow-3xl animate-slideUp overflow-hidden border-2">
              <div className="flex justify-between items-center mb-8 border-b border-white/5 pb-4">
                <button onClick={() => setSelectedPost(null)} className="text-[10px] font-black text-gray-500 hover:text-white transition-colors">إغلاق ✕</button>
                <span className="text-[10px] font-black text-[#fbbf24] uppercase tracking-widest flex items-center gap-2"><Zap size={14} fill="currentColor"/> تفاصيل النقاش</span>
              </div>
              <div className="overflow-y-auto no-scrollbar flex-1 space-y-10 pr-2">
                <div className="space-y-6">
                  <h3 className="text-2xl font-black text-white">{selectedPost.title}</h3>
                  <div className="bg-white/5 p-8 rounded-[35px] text-gray-300 text-base leading-relaxed italic shadow-inner border border-white/5">{selectedPost.content}</div>
                </div>
                <div className="space-y-6 pt-10 border-t border-white/10">
                  <h4 className="text-[10px] font-black text-blue-400 uppercase tracking-widest">منصة الردود ({selectedPost.replies?.length || 0})</h4>
                  <div className="space-y-4">
                      {selectedPost.replies?.map(reply => (
                        <div key={reply.id} className="p-6 bg-black/40 rounded-[25px] border border-white/5 group">
                          <div className="flex justify-between items-center mb-2">
                            <span className={`text-xs font-black ${reply.role === 'teacher' ? 'text-amber-400' : 'text-white'}`}>{reply.authorName} {reply.role === 'teacher' && '⭐'}</span>
                            <span className="text-[9px] text-gray-600 tabular-nums">{new Date(reply.timestamp).toLocaleDateString('ar-KW')}</span>
                          </div>
                          <p className="text-sm text-gray-400 leading-relaxed italic">"{reply.content}"</p>
                        </div>
                      ))}
                      {(!selectedPost.replies || selectedPost.replies.length === 0) && <p className="text-center text-gray-600 text-xs italic py-10">لا توجد ردود بعد على هذا الموضوع.</p>}
                  </div>
                </div>
              </div>
              
              <div className="mt-8 pt-8 border-t border-white/10 space-y-5">
                <textarea 
                    value={replyContent} 
                    onChange={e => setReplyContent(e.target.value)} 
                    placeholder={canInteract ? "اكتب ردك الأكاديمي..." : "🔒 الميزة مخصصة للمشتركين فقط."}
                    disabled={!canInteract}
                    className="w-full bg-black/60 border border-white/10 rounded-[25px] p-6 text-sm text-white outline-none focus:border-[#fbbf24] h-32 transition-all shadow-inner" 
                />
                <button 
                    onClick={handleReply} 
                    disabled={!replyContent.trim() || isSubmitting || !canInteract} 
                    className={`w-full py-5 rounded-[25px] font-black text-xs uppercase tracking-widest flex items-center justify-center gap-3 transition-all ${canInteract ? 'bg-[#fbbf24] text-black shadow-2xl hover:scale-105 active:scale-95' : 'bg-gray-800 text-gray-600 cursor-not-allowed'}`}
                >
                  {isSubmitting ? <RefreshCw className="animate-spin" size={16}/> : <Send size={16}/>} إرسال الرد
                </button>
              </div>
            </div>
          ) : (
            <div className="glass-panel p-16 rounded-[60px] border-2 border-dashed border-white/10 text-center opacity-30 bg-black/10">
              <div className="w-20 h-20 bg-white/5 rounded-full flex items-center justify-center mx-auto mb-8 shadow-inner"><Bell size={40} className="text-gray-600" /></div>
              <p className="font-black text-sm uppercase tracking-widest italic">اختر موضوعاً لمشاهدة النقاش<br/>أو المشاركة بأسئلتك</p>
            </div>
          )}
        </div>
      </div>

      {/* مودال طرح سؤال جديد - تم تعديل الـ Z-index وضمان الثبات */}
      {showAskModal && (
        <div className="fixed inset-0 z-[5000] bg-black/95 backdrop-blur-3xl flex items-center justify-center p-6 animate-fadeIn" onClick={() => setShowAskModal(false)}>
          <div className="glass-panel w-full max-w-2xl p-12 rounded-[70px] border-white/10 relative shadow-[0_50px_150px_rgba(0,0,0,0.9)] bg-[#0a1118] border-2" onClick={e => e.stopPropagation()}>
            <button onClick={() => setShowAskModal(false)} className="absolute top-10 left-10 text-gray-500 hover:text-white p-3 bg-white/5 rounded-full transition-colors"><X size={24}/></button>
            <div className="mb-12">
                <span className="bg-amber-500/10 text-amber-500 px-5 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest border border-amber-500/20">طرح سؤال أكاديمي</span>
                <h3 className="text-4xl font-black mt-6 text-white leading-tight italic">سؤالك في <br/><span className="text-[#fbbf24]">{activeForum.title}</span></h3>
            </div>
            <div className="space-y-8">
              <div className="space-y-3">
                <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest mr-6">عنوان السؤال</label>
                <input type="text" value={newQuestion.title} onChange={e => setNewQuestion({...newQuestion, title: e.target.value})} className="w-full bg-black/40 border border-white/10 rounded-2xl px-8 py-5 text-white outline-none focus:border-[#fbbf24] font-bold text-lg shadow-inner" placeholder="اكتب عنواناً معبراً لسؤالك..." />
              </div>
              <div className="space-y-3">
                <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest mr-6">تفاصيل الاستفسار</label>
                <textarea value={newQuestion.content} onChange={e => setNewQuestion({...newQuestion, content: e.target.value})} className="w-full bg-black/40 border border-white/10 rounded-2xl p-8 text-white outline-none focus:border-blue-400 h-48 leading-relaxed shadow-inner no-scrollbar italic" placeholder="اشرح ما تود السؤال عنه بالتفصيل..." />
              </div>
              {errorMsg && <div className="p-4 bg-red-600/10 border border-red-600/20 text-red-500 text-xs font-bold rounded-2xl text-center flex items-center justify-center gap-3 animate-shake"><AlertCircle size={18}/> {errorMsg}</div>}
              <button onClick={handleAsk} disabled={isSubmitting || !canInteract} className={`w-full py-6 rounded-[30px] font-black uppercase tracking-widest shadow-2xl transition-all flex items-center justify-center gap-4 text-xl ${canInteract ? 'bg-[#fbbf24] text-black hover:scale-[1.02] active:scale-95' : 'bg-gray-800 text-gray-600 cursor-not-allowed'}`}>
                {isSubmitting ? <RefreshCw className="animate-spin" size={24}/> : "🚀 نشر السؤال الآن"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Forum;

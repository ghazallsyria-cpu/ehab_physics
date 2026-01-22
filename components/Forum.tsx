import React, { useState, useEffect, useMemo } from 'react';
import { User, ForumPost, ForumReply, ForumSection, Forum as ForumType, LoggingSettings } from '../types';
import { dbService } from '../services/db';
import { contentFilter } from '../services/contentFilter';
import { 
  ArrowUp, 
  CheckCircle, 
  MessageSquare, 
  ChevronLeft, 
  ChevronRight, 
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
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
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
    } catch (e) {
      console.error("Failed to load forum", e);
    } finally {
      setIsLoading(false);
    }
  };

  const loadPosts = async (forumId: string) => {
    setIsLoading(true);
    try {
      const forumPosts = await dbService.getForumPosts(forumId);
      setPosts(forumPosts);
    } catch (e) {
      console.error("Failed to load posts", e);
    } finally {
      setIsLoading(false);
    }
  };

  const handleForumClick = (forum: ForumType) => {
    setActiveForum(forum);
    loadPosts(forum.id);
  };

  const canInteract = useMemo(() => {
    if (!user) return false;
    if (user.role === 'admin' || user.role === 'teacher') return true;
    if (forumSettings?.forumAccessTier === 'premium') {
        return user.subscription === 'premium';
    }
    return true; 
  }, [user, forumSettings]);

  const handleAsk = async () => {
    if (!user || !activeForum) return;
    
    if (!canInteract) {
        setErrorMsg("🔒 عذراً، المشاركة في ساحة النقاش تتطلب اشتراك باقة التفوق.");
        return;
    }

    const title = newQuestion.title.trim();
    const content = newQuestion.content.trim();

    if (!title || !content) {
      setErrorMsg("يرجى ملء جميع الحقول المطلوبة.");
      return;
    }

    const filterResult = contentFilter.filter(`${title} ${content}`);
    if (!filterResult.isClean) {
      setErrorMsg(`⚠️ محتوى غير لائق: ${filterResult.detectedWords.join(', ')}`);
      return;
    }

    setIsSubmitting(true);
    setErrorMsg(null);

    try {
      const postData = {
        authorUid: user.uid,
        authorEmail: user.email,
        authorName: user.name,
        title: title,
        content: content,
        tags: [activeForum.id],
        upvotes: 0,
        replies: [],
        timestamp: new Date().toISOString()
      };

      await dbService.createForumPost(postData);

      setSuccessMsg("تم نشر موضوعك بنجاح! 🚀");
      setShowAskModal(false);
      setNewQuestion({ title: '', content: '' });
      await loadPosts(activeForum.id);
      setTimeout(() => setSuccessMsg(null), 3000);
    } catch (e: any) {
      console.error("Publish error:", e);
      setErrorMsg(`فشل النشر: ${e.message || 'خطأ في الاتصال بالخادم'}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleReply = async () => {
    if (!user || !selectedPost || !replyContent.trim()) return;

    if (!canInteract) {
        alert("🔒 المشاركة في الردود تتطلب اشتراك باقة التفوق.");
        return;
    }

    setIsSubmitting(true);
    try {
      const replyData = {
        authorUid: user.uid,
        authorEmail: user.email,
        authorName: user.name,
        content: replyContent,
        role: user.role
      };

      await dbService.addForumReply(selectedPost.id, replyData);

      if (selectedPost.authorUid !== user.uid) {
        await dbService.createNotification({
          userId: selectedPost.authorUid,
          title: "رد جديد على منشورك 💬",
          message: `قام ${user.name} بالرد على موضوعك: ${selectedPost.title}`,
          timestamp: new Date().toISOString(),
          isRead: false,
          type: 'info',
          category: 'academic'
        });
      }

      setReplyContent('');
      const updatedPosts = await dbService.getForumPosts(activeForum!.id);
      setPosts(updatedPosts);
      setSelectedPost(updatedPosts.find(p => p.id === selectedPost.id) || null);
    } catch (e) {
      alert("فشل إرسال الرد.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const sortedPosts = useMemo(() => {
    const pinned = posts.filter(p => p.isPinned);
    const regular = posts.filter(p => !p.isPinned);
    const sortFn = (a: any, b: any) => {
      if (sortBy === 'top') return (b.upvotes || 0) - (a.upvotes || 0);
      return new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime();
    };
    return [...pinned.sort(sortFn), ...regular.sort(sortFn)];
  }, [posts, sortBy]);

  if (!activeForum) {
    return (
      <div className="max-w-6xl mx-auto py-12 animate-fadeIn text-right" dir="rtl">
        <header className="text-center mb-16">
          <h2 className="text-5xl font-black text-white mb-4 italic tracking-tighter">ساحة <span className="text-[#00d2ff]">النقاش</span></h2>
          <p className="text-gray-500 italic">اختر قسماً للمشاركة في الحوارات العلمية.</p>
        </header>

        {isLoading ? (
          <div className="text-center py-20"><RefreshCw className="animate-spin mx-auto text-[#00d2ff]" size={40} /></div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {sections.flatMap(s => s.forums).map(forum => (
              <div key={forum.id} onClick={() => handleForumClick(forum)} className="glass-panel p-8 rounded-[40px] border-white/5 hover:border-[#00d2ff]/40 cursor-pointer transition-all group overflow-hidden relative bg-black/20 shadow-xl">
                <div className="w-16 h-16 rounded-2xl bg-white/5 flex items-center justify-center text-3xl mb-6 group-hover:bg-[#00d2ff] group-hover:text-black transition-all shadow-inner">{forum.icon}</div>
                <h3 className="text-2xl font-black text-white mb-2">{forum.title}</h3>
                <p className="text-gray-500 text-sm line-clamp-2 italic leading-relaxed">{forum.description}</p>
                <div className="mt-8 pt-6 border-t border-white/5 flex justify-between items-center">
                  <span className="text-[10px] font-black text-gray-600 uppercase tracking-widest flex items-center gap-2"><Users size={14}/> تصفح المواضيع</span>
                  <ChevronLeft className="text-gray-500 group-hover:text-[#00d2ff] transition-all" />
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto animate-fadeIn pb-20 text-right font-['Tajawal']" dir="rtl">
      {successMsg && <div className="fixed top-24 left-1/2 -translate-x-1/2 z-[1000] bg-green-600 text-white px-8 py-4 rounded-full shadow-2xl animate-bounce font-bold">✓ {successMsg}</div>}
      
      <div className="flex flex-col md:flex-row justify-between items-end mb-12 gap-8">
        <button onClick={() => setActiveForum(null)} className="flex items-center gap-2 text-gray-500 hover:text-white font-black text-xs uppercase tracking-widest transition-all group">
            <ArrowRight className="group-hover:translate-x-1 transition-transform" /> عودة للدليل
        </button>
        <div>
          <h2 className="text-4xl font-black text-white leading-tight">{activeForum.title}</h2>
          <p className="text-gray-500 italic mt-1 font-medium">{activeForum.description}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
        <div className="lg:col-span-8 space-y-6">
          <div className="flex flex-col sm:flex-row justify-between items-center bg-black/20 p-4 rounded-[30px] border border-white/5 gap-4">
             <div className="flex gap-2 bg-white/5 p-1 rounded-2xl border border-white/5">
                <button onClick={() => setSortBy('newest')} className={`px-6 py-2 rounded-xl text-[10px] font-black uppercase transition-all ${sortBy === 'newest' ? 'bg-white text-black shadow-lg' : 'text-gray-500'}`}>الأحدث</button>
                <button onClick={() => setSortBy('top')} className={`px-6 py-2 rounded-xl text-[10px] font-black uppercase transition-all ${sortBy === 'top' ? 'bg-white text-black shadow-lg' : 'text-gray-500'}`}>الأنشط</button>
             </div>
             <button 
                onClick={() => { setErrorMsg(null); setShowAskModal(true); }} 
                className={`px-10 py-4 rounded-2xl font-black text-[10px] uppercase tracking-widest flex items-center gap-3 transition-all shadow-xl ${canInteract ? 'bg-[#00d2ff] text-black hover:scale-105 active:scale-95' : 'bg-gray-800 text-gray-500 border border-white/5'}`}
             >
                {!canInteract && <Lock size={16}/>}
                موضوع جديد
             </button>
          </div>

          {isLoading ? (
            <div className="py-20 text-center animate-pulse font-black text-gray-600 uppercase tracking-widest">جاري جلب البيانات...</div>
          ) : sortedPosts.length > 0 ? sortedPosts.map(post => (
            <div key={post.id} onClick={() => setSelectedPost(post)} className={`glass-panel p-8 rounded-[40px] border-2 cursor-pointer transition-all flex gap-8 group relative overflow-hidden bg-black/10 ${selectedPost?.id === post.id ? 'border-[#00d2ff] bg-[#00d2ff]/5 shadow-[0_0_30px_rgba(0,210,255,0.1)]' : 'border-white/5 hover:border-white/10'}`}>
              <div className="flex flex-col items-center gap-2 bg-white/5 p-4 rounded-[25px] h-fit border border-white/5">
                <button onClick={(e) => { e.stopPropagation(); dbService.upvoteForumPost(post.id).then(() => loadPosts(activeForum.id)); }} className="text-gray-500 hover:text-[#00d2ff] hover:scale-125 transition-all active:scale-90"><ArrowUp size={28} /></button>
                <span className="font-black text-2xl text-white tabular-nums">{post.upvotes || 0}</span>
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-3 mb-3">
                   {post.isPinned && <Pin size={16} className="text-amber-400 fill-amber-400" />}
                   <h3 className="text-2xl font-black text-white group-hover:text-[#00d2ff] transition-all truncate leading-tight">{post.title}</h3>
                </div>
                <p className="text-gray-500 line-clamp-2 text-sm leading-relaxed mb-8 italic">"{post.content}"</p>
                <div className="flex justify-between items-center text-[9px] font-black text-gray-600 uppercase tracking-widest border-t border-white/5 pt-6">
                  <span className="flex items-center gap-2 bg-white/5 px-4 py-1.5 rounded-full border border-white/5">👤 {post.authorName} • <Clock size={12}/> {new Date(post.timestamp).toLocaleDateString('ar-KW')}</span>
                  <span className="bg-white/5 px-4 py-1.5 rounded-full flex items-center gap-2 border border-white/5 text-[#00d2ff]"><MessageSquare size={12}/> {post.replies?.length || 0} ردود</span>
                </div>
              </div>
            </div>
          )) : (
            <div className="py-40 text-center glass-panel rounded-[50px] border-2 border-dashed border-white/10 opacity-30">
                <MessageSquare size={64} className="mx-auto mb-6 text-gray-600" />
                <p className="font-black text-xl uppercase tracking-widest">لا توجد مواضيع منشورة هنا بعد.</p>
                <p className="text-sm mt-2 italic">كن أول من يشارك زملاءه المعرفة.</p>
            </div>
          )}
        </div>

        <div className="lg:col-span-4 h-fit sticky top-24">
          {selectedPost ? (
            <div className="glass-panel p-8 rounded-[50px] border-[#00d2ff]/30 bg-[#0a1118]/90 flex flex-col max-h-[80vh] shadow-3xl animate-slideUp">
              <div className="flex justify-between items-center mb-8 pb-4 border-b border-white/5">
                <button onClick={() => setSelectedPost(null)} className="text-[10px] font-black text-gray-500 hover:text-white transition-colors">إغلاق ✕</button>
                <span className="text-[10px] font-black text-[#00d2ff] uppercase tracking-widest flex items-center gap-2"><Zap size={10} fill="currentColor"/> تفاصيل الموضوع</span>
              </div>
              <div className="overflow-y-auto no-scrollbar flex-1 space-y-10 pr-2 pb-6">
                <div className="space-y-6">
                  <h3 className="text-2xl font-black text-white leading-tight">{selectedPost.title}</h3>
                  <div className="bg-white/5 p-8 rounded-[35px] text-gray-300 text-base leading-relaxed italic shadow-inner border border-white/5">{selectedPost.content}</div>
                </div>
                
                <div className="space-y-6 pt-10 border-t border-white/10">
                  <h4 className="text-[10px] font-black text-[#00d2ff] uppercase tracking-[0.3em] flex items-center gap-2">منصة الحوار ({selectedPost.replies?.length || 0})</h4>
                  <div className="space-y-4">
                      {selectedPost.replies?.map(reply => (
                        <div key={reply.id} className="p-6 bg-white/[0.03] rounded-[25px] border border-white/5 relative group">
                          <div className="flex justify-between items-center mb-3">
                            <span className="text-xs font-black text-white">{reply.authorName}</span>
                          </div>
                          <p className="text-xs text-gray-400 leading-relaxed italic">"{reply.content}"</p>
                        </div>
                      ))}
                  </div>
                </div>
              </div>
              
              <div className="mt-8 pt-8 border-t border-white/10 space-y-5">
                <textarea 
                    value={replyContent} 
                    onChange={e => setReplyContent(e.target.value)} 
                    placeholder={canInteract ? "اكتب ردك الأكاديمي هنا..." : "🔒 يجب الاشتراك للقدرة على الرد."}
                    disabled={!canInteract}
                    className="w-full bg-black/40 border border-white/10 rounded-[25px] p-6 text-sm text-white outline-none focus:border-[#00d2ff] h-32 shadow-inner transition-all" 
                />
                <button 
                    onClick={handleReply} 
                    disabled={!replyContent.trim() || isSubmitting || !canInteract} 
                    className={`w-full py-6 rounded-[25px] font-black text-[10px] uppercase tracking-[0.3em] flex items-center justify-center gap-3 shadow-2xl transition-all ${canInteract ? 'bg-[#00d2ff] text-black hover:scale-105 active:scale-95' : 'bg-gray-800 text-gray-600 cursor-not-allowed'}`}
                >
                  {isSubmitting ? <RefreshCw className="animate-spin" size={14}/> : <Send size={16}/>} 
                  {canInteract ? 'إرسال الرد المعتمد' : 'ميزة المشتركين فقط'}
                </button>
              </div>
            </div>
          ) : (
            <div className="glass-panel p-16 rounded-[60px] border-2 border-dashed border-white/5 text-center opacity-30 bg-black/10">
              <div className="w-20 h-20 bg-white/5 rounded-full flex items-center justify-center mx-auto mb-8 shadow-inner">
                <Bell size={40} className="text-gray-600" />
              </div>
              <p className="font-black text-sm uppercase tracking-[0.2em] leading-relaxed italic">اختر موضوعاً لمشاهدة الحوار<br/>أو المشاركة بأسئلتك</p>
            </div>
          )}
        </div>
      </div>

      {showAskModal && (
        <div className="fixed inset-0 z-[1100] bg-black/95 backdrop-blur-3xl flex items-center justify-center p-6 animate-fadeIn" onClick={() => setShowAskModal(false)}>
          <div className="glass-panel w-full max-w-2xl p-14 rounded-[70px] border-white/10 relative shadow-[0_50px_150px_rgba(0,0,0,0.9)] overflow-hidden bg-[#0a1118]" onClick={e => e.stopPropagation()}>
            <button onClick={() => setShowAskModal(false)} className="absolute top-10 left-10 text-gray-500 hover:text-white p-3 bg-white/5 rounded-full transition-all hover:scale-110"><X size={24}/></button>
            
            <div className="mb-12">
                <span className="bg-[#00d2ff]/10 text-[#00d2ff] px-5 py-1.5 rounded-full text-[9px] font-black uppercase tracking-[0.4em] border border-[#00d2ff]/20">مساحة الحوار</span>
                {/* Fixed: Use activeForum instead of undefined activeTopic */}
                <h3 className="text-4xl font-black mt-6 text-white leading-tight tracking-tighter italic">طرح موضوع جديد في <br/><span className="text-[#00d2ff]">{activeForum.title}</span></h3>
            </div>

            <div className="space-y-8">
              <div className="space-y-3">
                <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest mr-6">عنوان السؤال</label>
                <input 
                    type="text" 
                    value={newQuestion.title} 
                    onChange={e => setNewQuestion({...newQuestion, title: e.target.value})} 
                    className="w-full bg-black/40 border border-white/5 rounded-[25px] px-10 py-5 text-white outline-none focus:border-[#00d2ff] font-bold text-lg shadow-inner transition-all" 
                    placeholder="عن ماذا تود أن تسأل؟" 
                />
              </div>
              <div className="space-y-3">
                <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest mr-6">تفاصيل الاستفسار</label>
                <textarea 
                    value={newQuestion.content} 
                    onChange={e => setNewQuestion({...newQuestion, content: e.target.value})} 
                    className="w-full bg-black/40 border border-white/5 rounded-[35px] p-10 text-white outline-none focus:border-[#00d2ff] h-48 leading-relaxed shadow-inner italic transition-all no-scrollbar" 
                    placeholder="اشرح ما يدور في ذهنك بالتفصيل..." 
                />
              </div>
              {errorMsg && (
                <div className="p-5 bg-red-600/10 border border-red-600/20 text-red-500 text-xs font-bold rounded-3xl text-center flex items-center justify-center gap-3 animate-shake">
                    <AlertCircle size={18}/> {errorMsg}
                </div>
              )}
              
              <button 
                onClick={handleAsk} 
                disabled={isSubmitting || !canInteract} 
                className={`w-full py-8 rounded-[35px] font-black uppercase tracking-[0.4em] transition-all flex items-center justify-center gap-4 text-xl ${canInteract ? 'bg-[#00d2ff] text-black hover:scale-[1.02] active:scale-95' : 'bg-gray-800 text-gray-600 cursor-not-allowed'}`}
              >
                {isSubmitting ? <RefreshCw className="animate-spin" size={24}/> : "🚀"} 
                {canInteract ? 'نشر الموضوع الآن' : 'ميزة المشتركين فقط'}
              </button>
              
              {!canInteract && (
                <p className="text-center text-[10px] text-amber-500 font-bold uppercase tracking-widest">يجب الاشتراك في "باقة التفوق" لتتمكن من النشر ⚡</p>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Forum;

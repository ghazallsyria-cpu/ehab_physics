
import React, { useState, useEffect, useMemo } from 'react';
import { User, ForumPost, ForumReply, ForumSection, Forum as ForumType } from '../types';
import { dbService } from '../services/db';
import { contentFilter } from '../services/contentFilter';
import { 
  ArrowUp, 
  CheckCircle, 
  MessageSquare, 
  ChevronLeft, 
  ChevronRight, 
  LayoutGrid, 
  Users, 
  Clock,
  ArrowRight,
  Pin,
  PinOff,
  Trash2,
  AlertCircle,
  Plus,
  RefreshCw,
  X,
  ShieldAlert,
  Send
} from 'lucide-react';

interface ForumProps {
  user: User | null;
  onAskAI?: (text: string) => void;
}

const Forum: React.FC<ForumProps> = ({ user, onAskAI }) => {
  const [sections, setSections] = useState<ForumSection[]>([]);
  const [activeForum, setActiveForum] = useState<ForumType | null>(null);
  const [posts, setPosts] = useState<ForumPost[]>([]);
  const [showAskModal, setShowAskModal] = useState(false);
  const [selectedPost, setSelectedPost] = useState<ForumPost | null>(null);
  const [newQuestion, setNewQuestion] = useState({ title: '', content: '', tags: '' });
  const [replyContent, setReplyContent] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [sortBy, setSortBy] = useState<'newest' | 'top'>('newest');
  const [filterWarning, setFilterWarning] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  useEffect(() => {
    loadInitialData();
  }, []);

  const loadInitialData = async () => {
    setIsLoading(true);
    try {
      const sectionsData = await dbService.getForumSections();
      setSections(sectionsData);
    } catch (e) {
      console.error("Failed to load forum sections", e);
    } finally {
      setIsLoading(false);
    }
  };

  const loadPosts = async (forumId: string) => {
    setIsLoading(true);
    try {
      const allPosts = await dbService.getForumPosts();
      // تأمين الفلترة ضد المصفوفات الفارغة أو غير المعرفة
      const forumPosts = allPosts.filter(p => p.tags && p.tags.includes(forumId));
      setPosts(forumPosts);
    } catch (e) {
      console.error("Failed to load forum posts", e);
    } finally {
      setIsLoading(false);
    }
  };

  const handleForumClick = (forum: ForumType) => {
    setActiveForum(forum);
    loadPosts(forum.id);
  };

  const goBackToDirectory = () => {
    setActiveForum(null);
    setSelectedPost(null);
    setPosts([]);
  };

  const sortedPosts = useMemo(() => {
    const pinned = posts.filter(p => p.isPinned);
    const regular = posts.filter(p => !p.isPinned);

    const sortFn = (a: ForumPost, b: ForumPost) => {
      if (sortBy === 'top') return (b.upvotes || 0) - (a.upvotes || 0);
      return new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime();
    };

    return [...pinned.sort(sortFn), ...regular.sort(sortFn)];
  }, [posts, sortBy]);

  const handleAsk = async () => {
    if (!user || !activeForum) { alert('يجب تسجيل الدخول واختيار منتدى لطرح سؤال.'); return; }
    if (!newQuestion.title.trim() || !newQuestion.content.trim()) {
        alert('يرجى ملء العنوان والمحتوى.');
        return;
    }

    // 1. فحص الرقابة
    const checkTitle = contentFilter.filter(newQuestion.title);
    const checkContent = contentFilter.filter(newQuestion.content);

    if (!checkTitle.isClean || !checkContent.isClean) {
        const detected = Array.from(new Set([...checkTitle.detectedWords, ...checkContent.detectedWords])).join(', ');
        setFilterWarning(`⚠️ عذراً، يحتوي سؤالك على كلمات غير لائقة (${detected}). يرجى الالتزام بآداب الحوار التعليمي.`);
        setTimeout(() => setFilterWarning(null), 5000);
        return;
    }

    setIsSubmitting(true);
    try {
        await dbService.createForumPost({
          authorEmail: user.email,
          authorName: user.name || 'طالب مجهول',
          title: newQuestion.title,
          content: newQuestion.content,
          tags: [activeForum.id, ...newQuestion.tags.split(',').map(t => t.trim()).filter(Boolean)],
        });

        setSuccessMsg("تم نشر موضوعك في الساحة بنجاح! 🚀");
        setNewQuestion({ title: '', content: '', tags: '' });
        setShowAskModal(false);
        await loadPosts(activeForum.id);
        setTimeout(() => setSuccessMsg(null), 3000);
    } catch (error) {
        alert("عذراً، فشل النشر. يرجى التحقق من اتصالك بالإنترنت.");
    } finally {
        setIsSubmitting(false);
    }
  };

  const handleReply = async () => {
    if (!user || !selectedPost || !replyContent.trim()) return;

    const checkReply = contentFilter.filter(replyContent);
    if (!checkReply.isClean) {
        setFilterWarning(`⚠️ الرد يحتوي على كلمات محظورة. يرجى تعديله.`);
        setTimeout(() => setFilterWarning(null), 5000);
        return;
    }

    setIsSubmitting(true);
    try {
        const replyData = {
            authorEmail: user.email,
            authorName: user.name || 'Anonymous',
            content: replyContent,
            role: user.role,
        };
        
        await dbService.addForumReply(selectedPost.id, replyData);
        setReplyContent('');
        
        const allPosts = await dbService.getForumPosts();
        const updatedSelectedPost = allPosts.find(p => p.id === selectedPost.id);
        if (updatedSelectedPost) {
            setSelectedPost(updatedSelectedPost);
            setPosts(prev => prev.map(p => p.id === selectedPost.id ? updatedSelectedPost : p));
        }
    } catch (e) {
        alert("فشل إرسال الرد.");
    } finally {
        setIsSubmitting(false);
    }
  };

  const handleTogglePin = async (postId: string, currentPin: boolean) => {
    if (user?.role !== 'admin') return;
    try {
        await (dbService as any).updateForumPost(postId, { isPinned: !currentPin });
        setPosts(prev => prev.map(p => p.id === postId ? { ...p, isPinned: !currentPin } : p));
        if (selectedPost?.id === postId) setSelectedPost(prev => prev ? { ...prev, isPinned: !currentPin } : null);
    } catch (e) {
        alert("فشل تحديث حالة التثبيت.");
    }
  };

  // Add comment: Fix missing closing parenthesis for filter function
  const handleDeletePost = async (postId: string) => {
    if (user?.role !== 'admin') return;
    if (!confirm("هل أنت متأكد من حذف هذا المنشور نهائياً؟")) return;
    
    try {
        await (dbService as any).deleteForumPost(postId);
        setPosts(prev => prev.filter(p => p.id !== postId));
        if (selectedPost?.id === postId) setSelectedPost(null);
    } catch (e) {
        alert("فشل حذف المنشور.");
    }
  };

  // Add comment: Add handleUpvotePost function for post interaction
  const handleUpvotePost = async (postId: string) => {
    try {
      await dbService.upvoteForumPost(postId);
      setPosts(prev => prev.map(p => p.id === postId ? { ...p, upvotes: (p.upvotes || 0) + 1 } : p));
      if (selectedPost?.id === postId) setSelectedPost(prev => prev ? { ...prev, upvotes: (prev.upvotes || 0) + 1 } : null);
    } catch (e) {
      console.error("Upvote failed", e);
    }
  };

  const getRoleBadge = (role: User['role']) => {
    if (role === 'teacher') return <span className="text-[8px] font-black bg-[#fbbf24]/20 text-[#fbbf24] px-2 py-0.5 rounded border border-[#fbbf24]/30 uppercase tracking-widest">معلم</span>;
    if (role === 'admin') return <span className="text-[8px] font-black bg-red-600/20 text-red-500 px-2 py-0.5 rounded border border-red-500/30 uppercase tracking-widest">إدارة</span>;
    return null;
  };

  if (!activeForum) {
    return (
      <div className="max-w-6xl mx-auto py-12 px-6 animate-fadeIn font-['Tajawal'] text-right" dir="rtl">
        <header className="mb-20 text-center">
          <h2 className="text-6xl font-black text-white mb-6 tracking-tighter italic uppercase">ساحة <span className="text-[#00d2ff] text-glow-cyan">النقاش المفتوح</span></h2>
          <p className="text-gray-500 text-xl max-w-3xl mx-auto leading-relaxed">تواصل مع المعلمين والزملاء لمناقشة الدروس، حل المسائل، وتبادل الخبرات الأكاديمية.</p>
        </header>

        {isLoading ? (
          <div className="py-40 text-center">
            <RefreshCw className="w-16 h-16 border-4 border-[#00d2ff] border-t-transparent rounded-full animate-spin mx-auto mb-6 shadow-xl" />
            <p className="text-gray-600 font-bold uppercase tracking-[0.2em]">جاري تحميل الدليل...</p>
          </div>
        ) : sections.length > 0 ? (
          <div className="space-y-24">
            {sections.map((section) => (
              <div key={section.id} className="animate-slideUp">
                <div className="flex items-center gap-6 mb-12">
                  <div className="h-10 w-2 bg-[#fbbf24] rounded-full shadow-[0_0_20px_#fbbf24]"></div>
                  <h3 className="text-3xl font-black text-white italic">{section.title}</h3>
                  <div className="h-px flex-1 bg-white/5"></div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                  {section.forums.map((forum) => (
                    <div 
                      key={forum.id} 
                      onClick={() => handleForumClick(forum)}
                      className="group glass-panel rounded-[50px] border border-white/5 hover:border-[#00d2ff]/40 bg-gradient-to-br from-white/[0.03] to-transparent cursor-pointer transition-all duration-700 overflow-hidden shadow-xl"
                    >
                      <div className="h-48 relative overflow-hidden">
                         <img 
                            src={forum.imageUrl || "https://images.unsplash.com/photo-1532094349884-543bc11b234d?q=80&w=2070&auto=format&fit=crop"} 
                            className="w-full h-full object-cover transition-transform duration-1000 group-hover:scale-110 grayscale group-hover:grayscale-0 opacity-40 group-hover:opacity-100" 
                            alt="" 
                         />
                         <div className="absolute inset-0 bg-gradient-to-t from-[#0a1118] via-[#0a1118]/40 to-transparent"></div>
                         <div className="absolute bottom-6 right-6">
                            <div className="w-14 h-14 rounded-2xl bg-white/10 backdrop-blur-xl border border-white/10 flex items-center justify-center text-3xl shadow-2xl group-hover:bg-[#00d2ff] group-hover:text-black transition-all">
                                {forum.icon || '💬'}
                            </div>
                         </div>
                      </div>
                      <div className="p-8">
                        <h4 className="text-2xl font-black text-white group-hover:text-[#00d2ff] transition-colors mb-3 leading-tight">{forum.title}</h4>
                        <p className="text-gray-500 text-sm leading-relaxed mb-8 line-clamp-2 italic">"{forum.description || 'منصة للنقاش العلمي وتبادل الخبرات بين الطلاب والمعلمين.'}"</p>
                        
                        <div className="flex items-center justify-between pt-6 border-t border-white/5">
                           <span className="flex items-center gap-2 text-[10px] font-black text-gray-600 uppercase tracking-widest">
                               <MessageSquare size={14}/> تصفح المواضيع
                           </span>
                           <div className="p-3 bg-white/5 rounded-xl text-gray-500 group-hover:text-[#00d2ff] group-hover:translate-x-[-5px] transition-all">
                              <ChevronLeft size={20} />
                           </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="py-40 text-center glass-panel rounded-[60px] border-2 border-dashed border-white/10 opacity-30">
            <LayoutGrid size={64} className="mx-auto mb-6 text-gray-600" />
            <p className="text-2xl font-black uppercase tracking-[0.4em]">لا توجد أقسام منشورة</p>
            <p className="mt-4 italic">سيقوم مدير المنصة بتهيئة ساحات النقاش قريباً.</p>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto py-12 px-6 animate-fadeIn font-['Tajawal'] text-right" dir="rtl">
      {filterWarning && (
        <div className="fixed top-24 left-1/2 -translate-x-1/2 z-[1000] w-[90%] max-w-2xl animate-bounce">
            <div className="bg-red-600 text-white p-6 rounded-[30px] shadow-2xl flex items-center gap-6 border-4 border-white/20">
                <ShieldAlert size={40} className="shrink-0" />
                <p className="font-black text-sm">{filterWarning}</p>
            </div>
        </div>
      )}

      {successMsg && (
        <div className="fixed top-24 left-1/2 -translate-x-1/2 z-[1000] w-[90%] max-w-2xl animate-fadeIn">
            <div className="bg-green-600 text-white p-6 rounded-[30px] shadow-2xl flex items-center gap-6 border-4 border-white/20">
                <CheckCircle size={40} className="shrink-0" />
                <p className="font-black text-sm">{successMsg}</p>
            </div>
        </div>
      )}

      <button 
        onClick={goBackToDirectory}
        className="flex items-center gap-3 text-gray-500 hover:text-white font-black text-xs uppercase tracking-widest mb-12 transition-all group"
      >
        <ArrowRight size={20} className="group-hover:translate-x-2 transition-transform" />
        العودة للدليل الرئيسي
      </button>

      <header className="flex flex-col lg:flex-row justify-between items-end mb-16 gap-10">
        <div className="flex gap-8 items-start">
          <div className="w-24 h-24 rounded-[35px] overflow-hidden border-2 border-[#00d2ff]/30 shadow-2xl shrink-0 group">
             <img src={activeForum.imageUrl || "https://images.unsplash.com/photo-1532094349884-543bc11b234d?q=80&w=2070&auto=format&fit=crop"} className="w-full h-full object-cover" alt="" />
          </div>
          <div>
            <h2 className="text-5xl font-black text-white mb-4 tracking-tighter">{activeForum.title}</h2>
            <p className="text-gray-500 font-medium max-w-2xl italic leading-relaxed text-lg">"{activeForum.description}"</p>
          </div>
        </div>
        <button 
          onClick={() => setShowAskModal(true)}
          className="bg-[#00d2ff] text-black px-12 py-6 rounded-[30px] font-black text-xs uppercase tracking-[0.2em] shadow-[0_15px_40px_rgba(0,210,255,0.3)] hover:scale-105 active:scale-95 transition-all flex items-center gap-3"
        >
          <Plus size={20}/> طرح موضوع جديد
        </button>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
        <div className="lg:col-span-8 space-y-6">
          <div className="mb-8 flex justify-between items-center bg-black/40 p-5 rounded-[30px] border border-white/5 backdrop-blur-xl">
            <div className="flex bg-white/5 p-1.5 rounded-2xl border border-white/10 shadow-inner">
              <button onClick={() => setSortBy('newest')} className={`px-8 py-3 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${sortBy === 'newest' ? 'bg-white text-black shadow-lg' : 'text-gray-500 hover:text-white'}`}>الأحدث</button>
              <button onClick={() => setSortBy('top')} className={`px-8 py-3 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${sortBy === 'top' ? 'bg-white text-black shadow-lg' : 'text-gray-500 hover:text-white'}`}>الأنشط</button>
            </div>
            <div className="flex items-center gap-4 text-[10px] font-black text-gray-500 uppercase tracking-widest px-4">
                <span className="flex items-center gap-2"><Users size={16}/> {posts.length} مشاركة</span>
            </div>
          </div>

          {isLoading && posts.length === 0 ? (
            <div className="text-center py-40 animate-pulse text-gray-600 font-black uppercase tracking-[0.4em]">جاري استدعاء المنشورات...</div>
          ) : sortedPosts.length > 0 ? (
            sortedPosts.map(post => (
              <div 
                key={post.id} 
                className={`glass-panel p-8 md:p-10 rounded-[50px] border-2 transition-all cursor-pointer group relative flex gap-8 ${post.isPinned ? 'border-[#fbbf24]/30 bg-[#fbbf24]/5' : (selectedPost?.id === post.id ? 'border-[#00d2ff]/40 bg-[#00d2ff]/5' : 'border-white/5 hover:border-white/10')}`}
                onClick={() => setSelectedPost(post)}
              >
                {post.isPinned && (
                    <div className="absolute top-6 left-10 flex items-center gap-2 bg-[#fbbf24] text-black px-4 py-1 rounded-full text-[8px] font-black uppercase tracking-widest shadow-lg">
                        <Pin size={10} fill="currentColor"/> مثبت
                    </div>
                )}
                
                <div className="flex flex-col items-center gap-3">
                    <button onClick={(e) => { e.stopPropagation(); handleUpvotePost(post.id); }} className="w-14 h-14 rounded-2xl bg-white/5 text-gray-400 hover:text-white hover:bg-[#00d2ff]/20 transition-all flex items-center justify-center border border-white/5 group-hover:scale-110 active:scale-90"><ArrowUp size={24}/></button>
                    <span className="font-black text-2xl text-white tabular-nums">{post.upvotes || 0}</span>
                </div>

                <div className="flex-1">
                    <h3 className="text-2xl font-black mb-4 text-white group-hover:text-[#00d2ff] transition-colors leading-tight">{post.title}</h3>
                    <p className="text-gray-500 text-sm line-clamp-2 mb-8 italic leading-relaxed">"{post.content}"</p>
                    
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-6 text-[10px] font-black uppercase tracking-widest text-gray-600">
                            <span className="flex items-center gap-2"><div className="w-6 h-6 rounded-lg bg-white/5 flex items-center justify-center text-xs">👤</div> {post.authorName}</span>
                            <span className="flex items-center gap-2"><Clock size={14}/> {new Date(post.timestamp).toLocaleDateString('ar-KW')}</span>
                        </div>
                        <div className="flex items-center gap-4">
                             {user?.role === 'admin' && (
                                <div className="flex gap-2">
                                    <button 
                                        onClick={(e) => { e.stopPropagation(); handleTogglePin(post.id, !!post.isPinned); }} 
                                        className={`p-3 rounded-xl transition-all ${post.isPinned ? 'bg-[#fbbf24] text-black' : 'bg-white/5 text-gray-500 hover:text-[#fbbf24]'}`}
                                        title={post.isPinned ? "إلغاء التثبيت" : "تثبيت المنشور"}
                                    >
                                        {post.isPinned ? <PinOff size={16}/> : <Pin size={16}/>}
                                    </button>
                                    <button 
                                        onClick={(e) => { e.stopPropagation(); handleDeletePost(post.id); }} 
                                        className="p-3 bg-red-500/10 text-red-500 rounded-xl hover:bg-red-500 hover:text-white transition-all"
                                        title="حذف المنشور"
                                    >
                                        <Trash2 size={16}/>
                                    </button>
                                </div>
                             )}
                             <span className="bg-white/5 px-5 py-2 rounded-2xl text-[#00d2ff] border border-white/5 flex items-center gap-2 font-black text-[10px]">
                                <MessageSquare size={14}/> {post.replies?.length || 0} ردود
                             </span>
                        </div>
                    </div>
                </div>
              </div>
            ))
          ) : (
            <div className="py-40 text-center glass-panel rounded-[60px] border-2 border-dashed border-white/10 opacity-30">
               <span className="text-8xl mb-8 block">📝</span>
               <p className="font-black text-2xl uppercase tracking-[0.4em]">المنتدى هادئ جداً</p>
               <p className="mt-4 italic">بادر بطرح أول سؤال أو فكرة للنقاش هنا.</p>
            </div>
          )}
        </div>

        <div className="lg:col-span-4">
           {selectedPost ? (
             <div className="glass-panel p-8 md:p-10 rounded-[60px] border-[#00d2ff]/30 bg-[#0a1118]/90 space-y-10 sticky top-24 max-h-[85vh] flex flex-col shadow-3xl animate-slideUp">
                <div className="flex justify-between items-center">
                    <button onClick={() => setSelectedPost(null)} className="text-[10px] font-black text-gray-500 hover:text-white transition-all flex items-center gap-2">✕ إغلاق</button>
                    {selectedPost.isPinned && <Pin size={14} className="text-[#fbbf24]" fill="currentColor"/>}
                </div>
                <div className="overflow-y-auto no-scrollbar pr-2 flex-1 space-y-10">
                    <div className="border-b border-white/5 pb-10">
                        <h3 className="text-3xl font-black text-white mb-6 leading-tight">{selectedPost.title}</h3>
                        <div className="p-8 bg-white/[0.02] rounded-[35px] border border-white/5 italic text-gray-300 leading-relaxed text-base shadow-inner">
                            {selectedPost.content}
                        </div>
                        <div className="mt-6 flex items-center gap-4">
                            <div className="w-10 h-10 rounded-xl bg-[#00d2ff]/20 flex items-center justify-center text-xl shadow-lg border border-[#00d2ff]/30">👤</div>
                            <div>
                                <p className="text-xs font-black text-white">{selectedPost.authorName}</p>
                                <p className="text-[9px] font-bold text-gray-600 uppercase tracking-widest">{new Date(selectedPost.timestamp).toLocaleString('ar-KW')}</p>
                            </div>
                        </div>
                    </div>
                    
                    <div className="space-y-8">
                        <h4 className="text-[10px] font-black text-[#00d2ff] uppercase tracking-[0.4em] border-r-4 border-[#00d2ff] pr-4">منصة الحوار ({selectedPost.replies?.length || 0})</h4>
                        <div className="space-y-6">
                            {selectedPost.replies?.sort((a,b) => (b.upvotes || 0) - (a.upvotes || 0)).map(reply => (
                                <div key={reply.id} className="bg-white/[0.03] p-6 rounded-[30px] border border-white/5 hover:border-white/10 transition-all relative">
                                    <div className="flex items-center justify-between mb-4">
                                        <div className="flex items-center gap-4">
                                            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-gray-700 to-gray-900 flex items-center justify-center text-sm font-black text-white shadow-xl">{reply.authorName.charAt(0)}</div>
                                            <div>
                                                <div className="flex items-center gap-2">
                                                    <span className="text-sm text-white font-black">{reply.authorName}</span>
                                                    {getRoleBadge(reply.role)}
                                                </div>
                                                <span className="text-[8px] text-gray-600 font-mono">{new Date(reply.timestamp).toLocaleString('ar-KW')}</span>
                                            </div>
                                        </div>
                                    </div>
                                    <p className="text-sm text-gray-400 leading-relaxed italic">"{reply.content}"</p>
                                </div>
                            ))}
                            {(!selectedPost.replies || selectedPost.replies.length === 0) && (
                                <div className="text-center py-10 opacity-30 italic text-xs font-bold">لا يوجد ردود بعد. كن أول من يضيف بصمته!</div>
                            )}
                        </div>
                    </div>
                </div>

                <div className="pt-8 border-t border-white/10">
                   <textarea 
                    value={replyContent}
                    onChange={(e) => setReplyContent(e.target.value)}
                    placeholder="اكتب ردك هنا لتبادل المعرفة..."
                    className="w-full h-32 bg-black border border-white/5 rounded-[25px] p-6 text-sm outline-none focus:border-[#00d2ff] text-white transition-all shadow-inner no-scrollbar"
                   />
                   <button 
                    onClick={handleReply} 
                    disabled={!replyContent.trim() || isSubmitting} 
                    className="w-full mt-6 bg-[#00d2ff] text-black py-5 rounded-[25px] font-black text-xs uppercase tracking-[0.3em] shadow-2xl disabled:opacity-50 hover:scale-105 active:scale-95 transition-all flex items-center justify-center gap-2"
                   >
                     {isSubmitting ? <RefreshCw className="animate-spin" size={14}/> : <Send size={14}/>}
                     إرسال الرد الآن
                   </button>
                </div>
             </div>
           ) : (
             <div className="glass-panel p-16 rounded-[60px] border-2 border-dashed border-white/5 text-center opacity-30 sticky top-24 bg-black/40">
                <div className="w-20 h-20 bg-white/5 rounded-full flex items-center justify-center mx-auto mb-8 shadow-inner">
                    <MessageSquare size={40} className="text-gray-600" />
                </div>
                <p className="font-black text-sm uppercase tracking-[0.2em] leading-relaxed italic">اختر منشوراً من القائمة<br/>لمشاهدة التفاصيل والمشاركة في الحوار الأكاديمي</p>
             </div>
           )}
        </div>
      </div>

      {showAskModal && (
        <div className="fixed inset-0 z-[500] bg-black/95 backdrop-blur-3xl flex items-center justify-center p-6 animate-fadeIn">
           <div className="glass-panel w-full max-w-2xl p-14 rounded-[70px] border-white/10 relative shadow-[0_50px_150px_rgba(0,0,0,0.9)] overflow-hidden">
              <div className="absolute top-0 right-0 p-16 opacity-[0.03] text-9xl pointer-events-none italic font-black">ASK</div>
              <button onClick={() => setShowAskModal(false)} className="absolute top-10 left-10 text-gray-500 hover:text-white p-3 bg-white/5 rounded-full transition-all hover:scale-110"><X size={24}/></button>
              
              <div className="mb-12">
                <span className="bg-[#00d2ff]/10 text-[#00d2ff] px-5 py-1.5 rounded-full text-[9px] font-black uppercase tracking-[0.4em] border border-[#00d2ff]/20">مساحة الطالب</span>
                <h3 className="text-4xl font-black mt-6 text-white leading-tight tracking-tighter">طرح موضوع في <br/><span className="text-[#00d2ff] italic">{activeForum.title}</span></h3>
              </div>

              <div className="space-y-8">
                 <div className="space-y-3">
                    <label className="text-[10px] font-black text-gray-600 uppercase tracking-widest mr-6">ما هو عنوان سؤالك؟</label>
                    <input 
                        type="text" 
                        placeholder="عنوان واضح يشد انتباه الزملاء والمعلمين..."
                        value={newQuestion.title}
                        onChange={e => setNewQuestion({...newQuestion, title: e.target.value})}
                        className="w-full bg-black/40 border border-white/5 rounded-[25px] px-10 py-5 text-white outline-none focus:border-[#00d2ff] font-bold shadow-inner transition-all"
                    />
                 </div>
                 <div className="space-y-3">
                    <label className="text-[10px] font-black text-gray-600 uppercase tracking-widest mr-6">اشرح استفسارك بالتفصيل</label>
                    <textarea 
                        placeholder="اكتب هنا كل ما يدور في ذهنك، يمكنك ذكر الرموز الفيزيائية..."
                        value={newQuestion.content}
                        onChange={e => setNewQuestion({...newQuestion, content: e.target.value})}
                        className="w-full h-48 bg-black/40 border border-white/5 rounded-[35px] p-10 text-white outline-none focus:border-[#00d2ff] leading-relaxed shadow-inner no-scrollbar italic transition-all"
                    />
                 </div>
                 <button 
                    onClick={handleAsk} 
                    disabled={isSubmitting}
                    className="w-full bg-[#00d2ff] text-black py-7 rounded-[30px] font-black uppercase tracking-[0.4em] shadow-2xl hover:scale-[1.02] active:scale-95 transition-all text-xl flex items-center justify-center gap-4"
                 >
                   {isSubmitting ? <RefreshCw className="animate-spin" size={24}/> : "🚀"}
                   نشر الاستفسار في الساحة
                 </button>
              </div>
           </div>
        </div>
      )}
    </div>
  );
};

export default Forum;

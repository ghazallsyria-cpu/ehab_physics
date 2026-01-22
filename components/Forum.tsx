import React, { useState, useEffect, useMemo } from 'react';
import { User, ForumPost, ForumReply, ForumSection, Forum as ForumType } from '../types';
import { dbService } from '../services/db';
import { 
  ArrowUp, 
  CheckCircle, 
  MessageSquare, 
  ChevronLeft, 
  ChevronRight, 
  LayoutGrid, 
  Users, 
  Clock,
  ArrowRight
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
  const [sortBy, setSortBy] = useState<'newest' | 'top'>('newest');

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
      // Filter posts by forumId (stored in tags for this implementation or extended schema)
      const forumPosts = allPosts.filter(p => p.tags.includes(forumId));
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
    return [...posts].sort((a, b) => {
      if (sortBy === 'top') {
        return (b.upvotes || 0) - (a.upvotes || 0);
      }
      return new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime();
    });
  }, [posts, sortBy]);

  const handleAsk = async () => {
    if (!user || !activeForum) { alert('يجب تسجيل الدخول واختيار منتدى لطرح سؤال.'); return; }
    if (!newQuestion.title || !newQuestion.content) return;

    await dbService.createForumPost({
      authorEmail: user.email,
      authorName: user.name || 'Anonymous',
      title: newQuestion.title,
      content: newQuestion.content,
      tags: [activeForum.id, ...newQuestion.tags.split(',').map(t => t.trim()).filter(Boolean)],
    });

    setNewQuestion({ title: '', content: '', tags: '' });
    setShowAskModal(false);
    await loadPosts(activeForum.id);
  };

  const handleReply = async () => {
    if (!user || !selectedPost || !replyContent) return;

    const replyData = {
        authorEmail: user.email,
        authorName: user.name || 'Anonymous',
        content: replyContent,
        role: user.role,
    };
    
    setReplyContent('');
    await dbService.addForumReply(selectedPost.id, replyData);
    
    // Refresh the specific post content
    const allPosts = await dbService.getForumPosts();
    const updatedSelectedPost = allPosts.find(p => p.id === selectedPost.id);
    if (updatedSelectedPost) {
        setSelectedPost(updatedSelectedPost);
        setPosts(prev => prev.map(p => p.id === selectedPost.id ? updatedSelectedPost : p));
    }
  };

  const handleUpvotePost = async (postId: string) => {
    await dbService.upvotePost(postId);
    setPosts(prev => prev.map(p => p.id === postId ? { ...p, upvotes: (p.upvotes || 0) + 1 } : p));
    if(selectedPost?.id === postId) {
      setSelectedPost(prev => prev ? { ...prev, upvotes: (prev.upvotes || 0) + 1 } : null);
    }
  };

  const getRoleBadge = (role: User['role']) => {
    if (role === 'teacher') return <span className="text-[8px] font-black bg-[#fbbf24]/20 text-[#fbbf24] px-2 py-0.5 rounded border border-[#fbbf24]/30">معلم معتمد</span>;
    if (role === 'admin') return <span className="text-[8px] font-black bg-red-500/20 text-red-400 px-2 py-0.5 rounded border border-red-500/30">مشرف</span>;
    return null;
  };

  // --- واجهة دليل المنتديات (Directory View) ---
  if (!activeForum) {
    return (
      <div className="max-w-6xl mx-auto py-12 px-6 animate-fadeIn font-['Tajawal'] text-right" dir="rtl">
        <header className="mb-16">
          <h2 className="text-5xl font-black text-white mb-4 tracking-tighter italic">ساحة <span className="text-[#00d2ff]">النقاش العلمي</span></h2>
          <p className="text-gray-500 text-xl font-medium">تصفح أقسام المنتدى وشارك زملائك المعرفة والأسئلة.</p>
        </header>

        {isLoading ? (
          <div className="py-40 text-center animate-pulse">
            <div className="w-16 h-16 border-4 border-[#00d2ff] border-t-transparent rounded-full animate-spin mx-auto mb-6"></div>
            <p className="text-gray-600 font-bold">جاري تحميل دليل المنتديات...</p>
          </div>
        ) : sections.length > 0 ? (
          <div className="space-y-16">
            {sections.map((section) => (
              <div key={section.id} className="animate-slideUp">
                <div className="flex items-center gap-4 mb-8">
                  <div className="h-8 w-1.5 bg-[#fbbf24] rounded-full shadow-[0_0_15px_#fbbf24]"></div>
                  <h3 className="text-2xl font-black text-white">{section.title}</h3>
                  <div className="h-px flex-1 bg-white/5"></div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {section.forums.map((forum) => (
                    <div 
                      key={forum.id} 
                      onClick={() => handleForumClick(forum)}
                      className="glass-panel p-8 rounded-[40px] border border-white/5 hover:border-[#00d2ff]/40 bg-gradient-to-br from-white/[0.02] to-transparent cursor-pointer group transition-all duration-500"
                    >
                      <div className="flex justify-between items-start mb-6">
                        <div className="w-14 h-14 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center text-3xl group-hover:scale-110 group-hover:bg-[#00d2ff]/10 transition-all">
                          {forum.icon || '💬'}
                        </div>
                        <div className="p-2 bg-white/5 rounded-full text-gray-600 group-hover:text-[#00d2ff] transition-colors">
                          <ChevronLeft size={20} />
                        </div>
                      </div>
                      <h4 className="text-xl font-black text-white group-hover:text-[#00d2ff] transition-colors mb-2">{forum.title}</h4>
                      <p className="text-gray-500 text-sm leading-relaxed mb-6 line-clamp-2 italic">{forum.description || 'منصة للنقاش العلمي وتبادل الخبرات بين الطلاب والمعلمين.'}</p>
                      
                      <div className="pt-6 border-t border-white/5 flex items-center gap-4 text-[10px] font-black text-gray-600 uppercase tracking-widest">
                         <span className="flex items-center gap-2"><MessageSquare size={12}/> استكشاف المواضيع</span>
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
            <p className="mt-4">سيقوم المدير بإضافة الأقسام قريباً.</p>
          </div>
        )}
      </div>
    );
  }

  // --- واجهة عرض المنتدى المختار (Forum Content View) ---
  return (
    <div className="max-w-7xl mx-auto py-12 px-6 animate-fadeIn font-['Tajawal'] text-right" dir="rtl">
      <button 
        onClick={goBackToDirectory}
        className="flex items-center gap-2 text-gray-500 hover:text-white font-bold text-sm mb-10 transition-colors group"
      >
        <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
        العودة لدليل المنتديات
      </button>

      <header className="flex flex-col lg:flex-row justify-between items-end mb-12 gap-8">
        <div>
          <div className="flex items-center gap-4 mb-4">
             <span className="text-4xl">{activeForum.icon}</span>
             <h2 className="text-4xl font-black text-white">{activeForum.title}</h2>
          </div>
          <p className="text-gray-500 font-medium max-w-2xl italic leading-relaxed">{activeForum.description}</p>
        </div>
        <button 
          onClick={() => setShowAskModal(true)}
          className="bg-[#00d2ff] text-black px-12 py-5 rounded-3xl font-black text-xs uppercase tracking-widest shadow-2xl hover:scale-105 active:scale-95 transition-all glow-teal"
        >
          + طرح سؤال جديد هنا
        </button>
      </header>

      <div className="mb-10 flex justify-between items-center bg-black/40 p-4 rounded-[30px] border border-white/5">
        <div className="flex bg-white/5 p-1 rounded-2xl border border-white/10">
          <button onClick={() => setSortBy('newest')} className={`px-6 py-2 rounded-xl text-xs font-bold transition-all ${sortBy === 'newest' ? 'bg-white text-black shadow-md' : 'text-gray-400 hover:text-white'}`}>الأحدث</button>
          <button onClick={() => setSortBy('top')} className={`px-6 py-2 rounded-xl text-xs font-bold transition-all ${sortBy === 'top' ? 'bg-white text-black shadow-md' : 'text-gray-400 hover:text-white'}`}>الأكثر تفاعلاً</button>
        </div>
        <div className="flex items-center gap-2 text-[10px] font-black text-gray-600 uppercase tracking-widest">
            <Users size={14}/> {posts.length} مشاركة
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
        <div className="lg:col-span-8 space-y-6">
          {isLoading ? (
            <div className="text-center py-20 animate-pulse text-gray-600">جاري تحميل المنشورات...</div>
          ) : sortedPosts.length > 0 ? (
            sortedPosts.map(post => (
              <div 
                key={post.id} 
                className={`glass-panel p-8 rounded-[40px] border-2 transition-all cursor-pointer group relative flex gap-8 ${selectedPost?.id === post.id ? 'border-[#00d2ff]/50 bg-[#00d2ff]/5' : 'border-transparent hover:border-white/10'}`}
                onClick={() => setSelectedPost(post)}
              >
                <div className="flex flex-col items-center gap-2">
                    <button onClick={(e) => { e.stopPropagation(); handleUpvotePost(post.id); }} className="w-12 h-12 rounded-2xl bg-white/5 text-gray-400 hover:text-white hover:bg-[#00d2ff]/20 transition-all flex items-center justify-center border border-white/5"><ArrowUp size={20}/></button>
                    <span className="font-black text-lg text-white tabular-nums">{post.upvotes || 0}</span>
                </div>
                <div className="flex-1">
                    <h3 className="text-2xl font-black mb-3 text-white group-hover:text-[#00d2ff] transition-colors leading-tight">{post.title}</h3>
                    <p className="text-gray-500 text-sm line-clamp-2 mb-6 italic leading-relaxed">{post.content}</p>
                    
                    <div className="flex items-center justify-between text-[10px] font-black uppercase tracking-widest text-gray-600">
                        <div className="flex items-center gap-4">
                            <span className="flex items-center gap-1.5"><Users size={12}/> {post.authorName}</span>
                            <span className="flex items-center gap-1.5"><Clock size={12}/> {new Date(post.timestamp).toLocaleDateString('ar-KW')}</span>
                        </div>
                        <span className="bg-white/5 px-4 py-1.5 rounded-full text-[#00d2ff] border border-white/5 flex items-center gap-2">
                           <MessageSquare size={12}/> {post.replies?.length || 0} ردود
                        </span>
                    </div>
                </div>
              </div>
            ))
          ) : (
            <div className="py-40 text-center glass-panel rounded-[60px] border-2 border-dashed border-white/5 opacity-30">
               <span className="text-7xl mb-6 block">📝</span>
               <p className="font-black text-xl uppercase tracking-widest">هذا المنتدى فارغ حالياً</p>
               <p className="mt-2">كن أول من يطرح سؤالاً في هذا القسم!</p>
            </div>
          )}
        </div>

        <div className="lg:col-span-4">
           {selectedPost ? (
             <div className="glass-panel p-8 rounded-[50px] border-[#00d2ff]/30 bg-[#00d2ff]/5 space-y-8 sticky top-24 max-h-[85vh] flex flex-col shadow-2xl animate-slideUp">
                <button onClick={() => setSelectedPost(null)} className="text-[10px] font-black text-gray-500 hover:text-white mb-2 self-start flex items-center gap-2">✕ إغلاق المعاينة</button>
                <div className="overflow-y-auto no-scrollbar pr-2 flex-1 space-y-8">
                    <div>
                        <h3 className="text-2xl font-black text-white mb-4 leading-tight">{selectedPost.title}</h3>
                        <div className="p-6 bg-black/40 rounded-3xl border border-white/10 italic text-gray-300 leading-relaxed text-sm shadow-inner">
                            {selectedPost.content}
                        </div>
                    </div>
                    
                    <div className="space-y-6">
                        <h4 className="text-xs font-black text-[#00d2ff] uppercase tracking-[0.3em] border-r-4 border-[#00d2ff] pr-3">الإجابات والتعليقات ({selectedPost.replies?.length || 0})</h4>
                        <div className="space-y-4">
                            {selectedPost.replies?.sort((a,b) => (b.upvotes || 0) - (a.upvotes || 0)).map(reply => (
                                <div key={reply.id} className="bg-white/[0.03] p-5 rounded-[25px] border border-white/5 hover:border-white/10 transition-all">
                                    <div className="flex items-center justify-between mb-3">
                                        <div className="flex items-center gap-3">
                                            <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-gray-700 to-gray-900 flex items-center justify-center text-xs font-bold text-white shadow-lg">{reply.authorName.charAt(0)}</div>
                                            <span className="text-xs text-white font-black">{reply.authorName}</span>
                                            {getRoleBadge(reply.role)}
                                        </div>
                                        <span className="text-[9px] text-gray-600 font-mono">{new Date(reply.timestamp).toLocaleDateString('ar-SY')}</span>
                                    </div>
                                    <p className="text-sm text-gray-400 leading-relaxed">{reply.content}</p>
                                </div>
                            ))}
                            {(!selectedPost.replies || selectedPost.replies.length === 0) && (
                                <p className="text-[10px] text-gray-600 italic text-center py-6 border border-dashed border-white/5 rounded-2xl">لا توجد ردود بعد. بادر بالإجابة وكسب النقاط!</p>
                            )}
                        </div>
                    </div>
                </div>

                <div className="pt-6 border-t border-white/10 bg-gradient-to-t from-black/40 to-transparent rounded-b-[50px]">
                   <textarea 
                    value={replyContent}
                    onChange={(e) => setReplyContent(e.target.value)}
                    placeholder="اكتب إجابتك أو تعليقك هنا..."
                    className="w-full h-24 bg-black/60 border border-white/10 rounded-2xl p-4 text-sm outline-none focus:border-[#00d2ff] text-white transition-all shadow-inner"
                   />
                   <button onClick={handleReply} disabled={!replyContent.trim()} className="w-full mt-4 bg-[#00d2ff] text-black py-4 rounded-2xl font-black text-xs uppercase tracking-widest shadow-xl disabled:opacity-50 hover:scale-105 active:scale-95 transition-all">إضافة الرد الآن</button>
                </div>
             </div>
           ) : (
             <div className="glass-panel p-12 rounded-[50px] border-white/5 text-center opacity-30 sticky top-24 bg-black/20 border-2 border-dashed">
                <MessageSquare size={64} className="mx-auto mb-6 text-gray-600" />
                <p className="font-black text-sm uppercase tracking-widest leading-relaxed">اختر موضوعاً من القائمة<br/>لمشاهدة التفاصيل والمشاركة في الحوار</p>
             </div>
           )}
        </div>
      </div>

      {showAskModal && (
        <div className="fixed inset-0 z-[500] bg-black/95 backdrop-blur-2xl flex items-center justify-center p-6 animate-fadeIn">
           <div className="glass-panel w-full max-w-2xl p-12 rounded-[60px] border-white/10 relative shadow-3xl bg-[#0a1118]">
              <button onClick={() => setShowAskModal(false)} className="absolute top-10 left-10 text-gray-500 hover:text-white text-2xl transition-colors">✕</button>
              
              <div className="mb-10">
                <span className="bg-[#00d2ff]/10 text-[#00d2ff] px-4 py-1 rounded-full text-[9px] font-black uppercase tracking-widest border border-[#00d2ff]/20">طرح سؤال جديد</span>
                <h3 className="text-3xl font-black mt-4 text-white">طرح موضوع في <span className="text-[#00d2ff]">{activeForum.title}</span></h3>
              </div>

              <div className="space-y-6">
                 <div className="space-y-2">
                    <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest mr-4">عنوان السؤال</label>
                    <input 
                        type="text" 
                        placeholder="كن واضحاً ومختصراً (مثلاً: سؤال في المحولات الكهربائية)"
                        value={newQuestion.title}
                        onChange={e => setNewQuestion({...newQuestion, title: e.target.value})}
                        className="w-full bg-black/40 border border-white/10 rounded-[25px] px-8 py-5 text-white outline-none focus:border-[#00d2ff] font-bold shadow-inner"
                    />
                 </div>
                 <div className="space-y-2">
                    <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest mr-4">تفاصيل الاستفسار</label>
                    <textarea 
                        placeholder="اكتب هنا كل ما يتعلق بسؤالك، يمكنك إضافة الرموز الفيزيائية..."
                        value={newQuestion.content}
                        onChange={e => setNewQuestion({...newQuestion, content: e.target.value})}
                        className="w-full h-48 bg-black/40 border border-white/10 rounded-[30px] p-8 text-white outline-none focus:border-[#00d2ff] leading-relaxed shadow-inner no-scrollbar"
                    />
                 </div>
                 <div className="space-y-2">
                    <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest mr-4">الوسوم (اختياري)</label>
                    <input 
                        type="text" 
                        placeholder="افصل بينها بفاصلة (مثلاً: صف-12، مراجعة)"
                        value={newQuestion.tags}
                        onChange={e => setNewQuestion({...newQuestion, tags: e.target.value})}
                        className="w-full bg-black/40 border border-white/10 rounded-2xl px-6 py-4 text-white outline-none focus:border-[#00d2ff] text-sm"
                    />
                 </div>
                 <button onClick={handleAsk} className="w-full bg-[#00d2ff] text-black py-6 rounded-[30px] font-black uppercase tracking-widest shadow-2xl hover:scale-[1.02] active:scale-95 transition-all text-lg">نشر الموضوع الآن 🚀</button>
              </div>
           </div>
        </div>
      )}
    </div>
  );
};

export default Forum;

import React, { useState, useEffect, useMemo } from 'react';
import { User, ForumPost, ForumReply } from '../types';
import { dbService } from '../services/db';
import { ArrowUp, CheckCircle, MessageSquare } from 'lucide-react';

interface ForumProps {
  user: User | null;
  onAskAI: (text: string) => void;
}

const Forum: React.FC<ForumProps> = ({ user, onAskAI }) => {
  const [posts, setPosts] = useState<ForumPost[]>([]);
  const [showAskModal, setShowAskModal] = useState(false);
  const [selectedPost, setSelectedPost] = useState<ForumPost | null>(null);
  const [newQuestion, setNewQuestion] = useState({ title: '', content: '', tags: '' });
  const [replyContent, setReplyContent] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [sortBy, setSortBy] = useState<'newest' | 'top'>('newest');

  useEffect(() => {
    loadPosts();
  }, []);

  const loadPosts = async () => {
    setIsLoading(true);
    try {
      const data = await dbService.getForumPosts();
      setPosts(data);
    } catch (e) {
      console.error("Failed to load forum posts", e);
    } finally {
      setIsLoading(false);
    }
  };

  const sortedPosts = useMemo(() => {
    return [...posts].sort((a, b) => {
      if (sortBy === 'top') {
        return (b.upvotes || 0) - (a.upvotes || 0);
      }
      // The default query from dbService already sorts by newest timestamp
      return 1;
    });
  }, [posts, sortBy]);

  const handleAsk = async () => {
    if (!user) { alert('يجب تسجيل الدخول لطرح سؤال.'); return; }
    if (!newQuestion.title || !newQuestion.content) return;

    await dbService.createForumPost({
      authorEmail: user.email,
      authorName: user.name || 'Anonymous',
      title: newQuestion.title,
      content: newQuestion.content,
      tags: newQuestion.tags.split(',').map(t => t.trim()).filter(Boolean),
    });

    setNewQuestion({ title: '', content: '', tags: '' });
    setShowAskModal(false);
    await loadPosts();
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
    
    const updatedPosts = await dbService.getForumPosts();
    setPosts(updatedPosts);
    
    const updatedSelectedPost = updatedPosts.find(p => p.id === selectedPost.id);
    setSelectedPost(updatedSelectedPost || null);
  };

  const handleUpvotePost = async (postId: string) => {
    await dbService.upvotePost(postId);
    const updatedPosts = await dbService.getForumPosts();
    setPosts(updatedPosts);
    if(selectedPost?.id === postId) {
      const updatedSelected = updatedPosts.find(p => p.id === postId);
      setSelectedPost(updatedSelected || null);
    }
  };
  
  const handleUpvoteReply = async (postId: string, replyId: string) => {
    await dbService.upvoteReply(postId, replyId);
    const updatedPosts = await dbService.getForumPosts();
    setPosts(updatedPosts);
    const updatedSelected = updatedPosts.find(p => p.id === postId);
    setSelectedPost(updatedSelected || null);
  };
  
  const getRoleBadge = (role: User['role']) => {
    if (role === 'teacher') return <span className="text-[8px] font-black bg-[#fbbf24]/20 text-[#fbbf24] px-2 py-0.5 rounded border border-[#fbbf24]/30">معلم معتمد</span>;
    if (role === 'admin') return <span className="text-[8px] font-black bg-red-500/20 text-red-400 px-2 py-0.5 rounded border border-red-500/30">مشرف</span>;
    return null;
  };

  return (
    <div className="max-w-7xl mx-auto py-12 px-6 animate-fadeIn font-['Tajawal']">
      <header className="flex flex-col md:flex-row justify-between items-start md:items-center mb-12 gap-8">
        <div>
          <h2 className="text-4xl font-black text-white mb-2">منتدى <span className="text-[#00d2ff]">الفيزياء</span></h2>
          <p className="text-gray-500 font-medium italic">اطرح تساؤلاتك، شارك معرفتك، واحصل على إجابات من الخبراء.</p>
        </div>
        <button 
          onClick={() => setShowAskModal(true)}
          className="bg-[#00d2ff] text-black px-10 py-4 rounded-3xl font-black text-xs uppercase tracking-widest glow-teal shadow-2xl hover:scale-105 transition-all"
        >
          + طرح سؤال جديد
        </button>
      </header>
      
      <div className="mb-8 flex justify-between items-center">
        <div className="flex bg-white/5 p-1.5 rounded-2xl border border-white/10">
          <button onClick={() => setSortBy('newest')} className={`px-5 py-2 rounded-xl text-xs font-bold transition-all ${sortBy === 'newest' ? 'bg-white text-black' : 'text-gray-400'}`}>الأحدث</button>
          <button onClick={() => setSortBy('top')} className={`px-5 py-2 rounded-xl text-xs font-bold transition-all ${sortBy === 'top' ? 'bg-white text-black' : 'text-gray-400'}`}>الأكثر تصويتاً</button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
        <div className="lg:col-span-8 space-y-6">
          {isLoading ? (
            <div className="text-center py-20 text-gray-500">جاري تحميل النقاشات...</div>
          ) : sortedPosts.length > 0 ? (
            sortedPosts.map(post => (
              <div 
                key={post.id} 
                className={`glass-panel p-8 rounded-[40px] border-2 hover:border-[#00d2ff]/30 transition-all cursor-pointer group relative flex gap-6 ${selectedPost?.id === post.id ? 'border-[#00d2ff]/50 bg-[#00d2ff]/5' : 'border-transparent'}`}
                onClick={() => setSelectedPost(post)}
              >
                <div className="flex flex-col items-center gap-1">
                    <button onClick={(e) => { e.stopPropagation(); handleUpvotePost(post.id); }} className="p-2 rounded-lg text-gray-400 hover:text-white hover:bg-white/10"><ArrowUp size={16}/></button>
                    <span className="font-black text-sm text-white">{post.upvotes || 0}</span>
                </div>
                <div className="flex-1">
                    <div className="flex justify-between items-start mb-4">
                        <div className="flex gap-2 flex-wrap">
                            {post.tags.map(tag => (
                            <span key={tag} className="text-[8px] font-black bg-white/5 text-gray-400 px-3 py-1 rounded-lg uppercase tracking-widest border border-white/5 group-hover:border-[#00d2ff]/20 transition-all">#{tag}</span>
                            ))}
                        </div>
                    </div>
                    <h3 className="text-xl font-black mb-2 group-hover:text-[#00d2ff] transition-colors">{post.title}</h3>
                    
                    <div className="mt-4 pt-4 border-t border-white/5 flex justify-between items-center text-[10px] font-black uppercase tracking-widest text-gray-500">
                        <span>بواسطة: {post.authorName}</span>
                        <div className="flex items-center gap-4">
                            <span>{new Date(post.timestamp).toLocaleDateString('ar-SY')}</span>
                            <span className="flex items-center gap-2"><MessageSquare size={12}/> {post.replies?.length || 0}</span>
                        </div>
                    </div>
                </div>
              </div>
            ))
          ) : (
            <div className="py-20 text-center opacity-30 glass-panel rounded-[50px]">
               <span className="text-6xl mb-6 block">💬</span>
               <p className="font-black text-xs uppercase tracking-widest">لا توجد مواضيع نقاش حالياً</p>
            </div>
          )}
        </div>

        <div className="lg:col-span-4">
           {selectedPost ? (
             <div className="glass-panel p-8 rounded-[50px] border-[#00d2ff]/30 bg-[#00d2ff]/5 space-y-6 sticky top-24 max-h-[80vh] flex flex-col">
                <button onClick={() => setSelectedPost(null)} className="text-[10px] font-black text-gray-500 hover:text-white mb-2 self-start">✕ إغلاق التفاصيل</button>
                <h3 className="text-2xl font-black text-white">{selectedPost.title}</h3>
                <p className="text-gray-300 leading-relaxed italic text-sm pb-4 border-b border-white/10">{selectedPost.content}</p>
                
                <div className="flex-1 space-y-4 overflow-y-auto no-scrollbar pr-2">
                   <h4 className="text-xs font-black text-[#00d2ff] uppercase tracking-widest">الردود ({selectedPost.replies?.length || 0})</h4>
                   {selectedPost.replies?.sort((a,b) => (b.upvotes || 0) - (a.upvotes || 0)).map(reply => (
                    <div key={reply.id} className="bg-black/40 p-4 rounded-2xl border border-white/5 flex gap-4">
                        <div className="flex flex-col items-center gap-1">
                            <button onClick={(e) => { e.stopPropagation(); handleUpvoteReply(selectedPost.id, reply.id); }} className="p-1 rounded-md text-gray-500 hover:text-white hover:bg-white/10"><ArrowUp size={12}/></button>
                            <span className="font-bold text-xs text-gray-300">{reply.upvotes || 0}</span>
                        </div>
                        <div className="flex-1">
                           <div className="flex items-center gap-2 mb-1">
                              <span className="text-xs text-white font-bold">{reply.authorName}</span>
                              {getRoleBadge(reply.role)}
                           </div>
                           <p className="text-xs text-gray-300">{reply.content}</p>
                        </div>
                    </div>
                   ))}
                   {(!selectedPost.replies || selectedPost.replies.length === 0) && (
                    <p className="text-[10px] text-gray-600 italic text-center py-4">كن أول من يضيف رداً...</p>
                   )}
                </div>

                <div className="pt-4 border-t border-white/10">
                   <textarea 
                    value={replyContent}
                    onChange={(e) => setReplyContent(e.target.value)}
                    placeholder="أضف ردك هنا..."
                    className="w-full h-20 bg-black/40 border border-white/10 rounded-2xl p-4 text-xs outline-none focus:border-[#00d2ff] text-white"
                   />
                   <button onClick={handleReply} disabled={!replyContent.trim()} className="w-full mt-2 bg-[#00d2ff] text-black py-3 rounded-2xl font-black text-[10px] uppercase tracking-widest disabled:opacity-50">إرسال الرد</button>
                </div>
             </div>
           ) : (
             <div className="glass-panel p-10 rounded-[50px] border-white/5 text-center opacity-30 sticky top-24">
                <span className="text-6xl mb-6 block">💬</span>
                <p className="font-black text-xs uppercase tracking-widest">اختر موضوعاً لمشاهدة التفاصيل والمشاركة في الحوار</p>
             </div>
           )}
        </div>
      </div>

      {showAskModal && (
        <div className="fixed inset-0 z-[150] bg-black/90 backdrop-blur-xl flex items-center justify-center p-6 animate-fadeIn">
           <div className="glass-panel w-full max-w-2xl p-12 rounded-[60px] border-white/10 relative shadow-3xl">
              <button onClick={() => setShowAskModal(false)} className="absolute top-8 left-8 text-white/40 hover:text-white text-xl">✕</button>
              <h3 className="text-3xl font-black mb-8 text-white">طرح سؤال جديد في المجتمع</h3>
              <div className="space-y-6">
                 <input 
                  type="text" 
                  placeholder="عنوان السؤال (مثلاً: سؤال في قوانين نيوتن)"
                  value={newQuestion.title}
                  onChange={e => setNewQuestion({...newQuestion, title: e.target.value})}
                  className="w-full bg-white/5 border border-white/10 rounded-2xl px-6 py-4 text-white outline-none focus:border-[#00d2ff]"
                 />
                 <textarea 
                  placeholder="تفاصيل السؤال..."
                  value={newQuestion.content}
                  onChange={e => setNewQuestion({...newQuestion, content: e.target.value})}
                  className="w-full h-48 bg-white/5 border border-white/10 rounded-2xl p-6 text-white outline-none focus:border-[#00d2ff]"
                 />
                 <input 
                  type="text" 
                  placeholder="الوسوم (مفصولة بفاصلة: ميكانيكا, صف-12)"
                  value={newQuestion.tags}
                  onChange={e => setNewQuestion({...newQuestion, tags: e.target.value})}
                  className="w-full bg-white/5 border border-white/10 rounded-2xl px-6 py-4 text-white outline-none focus:border-[#00d2ff]"
                 />
                 <button onClick={handleAsk} className="w-full bg-[#00d2ff] text-black py-6 rounded-3xl font-black uppercase tracking-widest shadow-2xl hover:scale-105 transition-all">نشر السؤال الآن</button>
              </div>
           </div>
        </div>
      )}
    </div>
  );
};

export default Forum;

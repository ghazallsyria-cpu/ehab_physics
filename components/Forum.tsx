
import React, { useState, useEffect } from 'react';
import { User, ForumPost, ForumReply } from '../types';
import { dbService } from '../services/db';

interface ForumProps {
  user: User | null;
  onAskAI: (text: string) => void;
}

// المكون الرئيسي للمنتدى - تم إصلاح البتر في الملف وإضافة التصدير الافتراضي
const Forum: React.FC<ForumProps> = ({ user, onAskAI }) => {
  const [posts, setPosts] = useState<ForumPost[]>([]);
  const [showAskModal, setShowAskModal] = useState(false);
  const [selectedPost, setSelectedPost] = useState<ForumPost | null>(null);
  const [newQuestion, setNewQuestion] = useState({ title: '', content: '', tags: '' });
  const [replyContent, setReplyContent] = useState('');

  useEffect(() => {
    loadPosts();
  }, []);

  // تحميل المنشورات مع التحقق من وجود البيانات
  const loadPosts = async () => {
    try {
      const res = await dbService.getForumPosts();
      if (res && res.data) {
        setPosts(res.data || []);
      }
    } catch (e) {
      console.error("Failed to load forum posts", e);
    }
  };

  const handleAsk = async () => {
    if (!user) { alert('يجب تسجيل الدخول لطرح سؤال.'); return; }
    if (!newQuestion.title || !newQuestion.content) return;

    await dbService.createForumPost({
      authorEmail: user.email,
      authorName: user.name || 'Anonymous',
      title: newQuestion.title,
      content: newQuestion.content,
      tags: newQuestion.tags.split(',').map(t => t.trim())
    });

    setNewQuestion({ title: '', content: '', tags: '' });
    setShowAskModal(false);
    loadPosts();
  };

  const handleReply = async () => {
    if (!user || !selectedPost || !replyContent) return;

    await dbService.addForumReply(selectedPost.id, {
      authorEmail: user.email,
      authorName: user.name || 'Anonymous',
      content: replyContent,
      role: user.role || 'student'
    });

    setReplyContent('');
    loadPosts();
    try {
      const updated = await dbService.getForumPosts();
      if (updated && updated.data) {
        setSelectedPost(updated.data.find((p: any) => p.id === selectedPost.id) || null);
      }
    } catch (e) {
      console.error("Failed to refresh post after reply", e);
    }
  };

  return (
    <div className="max-w-6xl mx-auto py-12 px-6 animate-fadeIn font-['Tajawal']">
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

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
        {/* قائمة الأسئلة */}
        <div className="lg:col-span-8 space-y-6">
          {posts.map(post => (
            <div 
              key={post.id} 
              onClick={() => setSelectedPost(post)}
              className={`glass-panel p-8 rounded-[40px] border-white/5 hover:border-[#00d2ff]/30 transition-all cursor-pointer group relative overflow-hidden ${selectedPost?.id === post.id ? 'border-[#00d2ff]/50 bg-[#00d2ff]/5' : ''}`}
            >
              <div className="flex justify-between items-start mb-6">
                <div className="flex gap-2">
                  {post.tags.map(tag => (
                    <span key={tag} className="text-[8px] font-black bg-white/5 text-gray-400 px-3 py-1 rounded-lg uppercase tracking-widest border border-white/5 group-hover:border-[#00d2ff]/20 transition-all">#{tag}</span>
                  ))}
                </div>
                <span className="text-[9px] font-bold text-gray-600 tabular-nums">{new Date(post.timestamp).toLocaleDateString('ar-KW')}</span>
              </div>
              <h3 className="text-xl font-black mb-4 group-hover:text-[#00d2ff] transition-colors">{post.title}</h3>
              <p className="text-gray-400 text-sm line-clamp-2 leading-relaxed">{post.content}</p>
              
              <div className="mt-6 pt-6 border-t border-white/5 flex justify-between items-center text-[10px] font-black uppercase tracking-widest text-gray-500">
                <span>بواسطة: {post.authorName}</span>
                <span>{post.replies?.length || 0} ردود</span>
              </div>
            </div>
          ))}
          
          {posts.length === 0 && (
            <div className="py-20 text-center opacity-30">
               <span className="text-6xl mb-6 block">💬</span>
               <p className="font-black text-xs uppercase tracking-widest">لا توجد مواضيع نقاش حالياً</p>
            </div>
          )}
        </div>

        {/* تفاصيل المنشور المختار */}
        <div className="lg:col-span-4">
           {selectedPost ? (
             <div className="glass-panel p-10 rounded-[50px] border-[#00d2ff]/30 bg-[#00d2ff]/5 space-y-8 sticky top-24">
                <button onClick={() => setSelectedPost(null)} className="text-[10px] font-black text-gray-500 hover:text-white mb-4">✕ إغلاق التفاصيل</button>
                <h3 className="text-2xl font-black text-white">{selectedPost.title}</h3>
                <p className="text-gray-300 leading-relaxed italic text-sm">{selectedPost.content}</p>
                
                <div className="space-y-4 pt-8 border-t border-white/10">
                   <h4 className="text-xs font-black text-[#00d2ff] uppercase tracking-widest">الردود المباشرة</h4>
                   <div className="space-y-4 max-h-60 overflow-y-auto no-scrollbar">
                      {selectedPost.replies?.map(reply => (
                        <div key={reply.id} className="bg-black/40 p-4 rounded-2xl border border-white/5">
                           <p className="text-xs text-white mb-2">{reply.content}</p>
                           <span className="text-[8px] text-gray-500 font-bold uppercase">{reply.authorName} • {reply.role}</span>
                        </div>
                      ))}
                      {(!selectedPost.replies || selectedPost.replies.length === 0) && (
                        <p className="text-[10px] text-gray-600 italic">كن أول من يضيف رداً...</p>
                      )}
                   </div>
                </div>

                <div className="pt-6">
                   <textarea 
                    value={replyContent}
                    onChange={(e) => setReplyContent(e.target.value)}
                    placeholder="أضف ردك هنا..."
                    className="w-full h-32 bg-black/40 border border-white/10 rounded-2xl p-4 text-xs outline-none focus:border-[#00d2ff] text-white"
                   />
                   <button onClick={handleReply} className="w-full mt-4 bg-[#00d2ff] text-black py-4 rounded-2xl font-black text-[10px] uppercase tracking-widest">إرسال الرد</button>
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
        <div className="fixed inset-0 z-[150] bg-black/90 backdrop-blur-xl flex items-center justify-center p-6">
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

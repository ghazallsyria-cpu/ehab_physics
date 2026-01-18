
import React, { useState, useEffect, useMemo } from 'react';
import { User, Discussion, Comment, ForumPost, ForumReply } from '../types';
import { dbService } from '../services/db';
import { ArrowUp, MessageSquare } from 'lucide-react';

const Discussions: React.FC<{ user: User }> = ({ user }) => {
  const [posts, setPosts] = useState<Discussion[]>([]);
  const [selectedPost, setSelectedPost] = useState<Discussion | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadPosts = async () => {
      setIsLoading(true);
      try {
        const forumPosts: ForumPost[] = await dbService.getForumPosts();
        const mappedDiscussions: Discussion[] = forumPosts.map(post => ({
          id: post.id,
          title: post.title,
          content: post.content,
          authorName: post.authorName,
          timestamp: post.timestamp,
          upvotes: post.upvotes || 0,
          comments: (post.replies || []).map((reply: ForumReply) => ({
            id: reply.id,
            authorName: reply.authorName,
            content: reply.content,
            timestamp: reply.timestamp,
          })),
        }));
        setPosts(mappedDiscussions);
      } catch (error) {
        console.error("Failed to load discussions", error);
        setPosts([]);
      } finally {
        setIsLoading(false);
      }
    };

    loadPosts();
  }, []);
  
  return (
    <div className="max-w-7xl mx-auto py-12 px-6 animate-fadeIn font-['Tajawal']">
      <header className="mb-12">
        <h2 className="text-4xl font-black text-white mb-2">ساحة <span className="text-[#00d2ff]">النقاش</span></h2>
        <p className="text-gray-500 font-medium italic">اطرح تساؤلاتك، شارك معرفتك، واحصل على إجابات.</p>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
        <div className="lg:col-span-7 space-y-6">
          {isLoading ? <div className="text-center py-20">جاري تحميل النقاشات...</div>
           : posts.map(post => (
              <div 
                key={post.id} 
                className={`glass-panel p-8 rounded-[40px] border-2 hover:border-[#00d2ff]/30 transition-all cursor-pointer group flex gap-6 ${selectedPost?.id === post.id ? 'border-[#00d2ff]/50 bg-[#00d2ff]/5' : 'border-transparent'}`}
                onClick={() => setSelectedPost(post)}
              >
                <div className="flex flex-col items-center gap-1">
                    <button className="p-2 rounded-lg text-gray-400 hover:bg-white/10"><ArrowUp size={16}/></button>
                    <span className="font-black text-sm text-white">{post.upvotes}</span>
                </div>
                <div className="flex-1">
                    <h3 className="text-xl font-black mb-2 group-hover:text-[#00d2ff]">{post.title}</h3>
                    <div className="mt-4 pt-4 border-t border-white/5 flex justify-between items-center text-[10px] font-black text-gray-500">
                        <span>بواسطة: {post.authorName}</span>
                        <span className="flex items-center gap-2"><MessageSquare size={12}/> {post.comments.length}</span>
                    </div>
                </div>
              </div>
            ))
          }
        </div>

        <div className="lg:col-span-5">
           {selectedPost ? (
             <div className="glass-panel p-8 rounded-[50px] border-[#00d2ff]/30 bg-[#00d2ff]/5 space-y-6 sticky top-24">
                <h3 className="text-2xl font-black text-white">{selectedPost.title}</h3>
                <p className="text-gray-300 leading-relaxed text-sm pb-4 border-b border-white/10">{selectedPost.content}</p>
                <div className="space-y-4">
                   <h4 className="text-xs font-black text-[#00d2ff] uppercase">الردود ({selectedPost.comments.length})</h4>
                   {selectedPost.comments.map(comment => (
                    <div key={comment.id} className="bg-black/40 p-4 rounded-2xl border border-white/5">
                       <p className="text-xs text-white font-bold">{comment.authorName}</p>
                       <p className="text-xs text-gray-300">{comment.content}</p>
                    </div>
                   ))}
                </div>
             </div>
           ) : (
             <div className="glass-panel p-10 rounded-[50px] border-white/5 text-center opacity-30 sticky top-24">
                <span className="text-6xl mb-6 block">💬</span>
                <p className="font-black text-xs uppercase tracking-widest">اختر موضوعاً للمشاركة</p>
             </div>
           )}
        </div>
      </div>
    </div>
  );
};

export default Discussions;


import React, { useState, useEffect, useMemo } from 'react';
import { User, ForumPost, ForumReply, ForumSection, Forum as ForumType, LoggingSettings } from '../types';
import { dbService } from '../services/db';
import { contentFilter } from '../services/contentFilter';
import { auth } from '../services/firebase';
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
  Bell,
  ShieldAlert,
  ShieldCheck,
  UserCheck,
  // Added missing Info icon import
  Info
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
  const [permissionError, setPermissionError] = useState(false);

  // فحص هل المستخدم حقيقي (Auth) أم وهمي (Demo)
  const isRealUser = useMemo(() => {
    return auth.currentUser !== null;
  }, [user]);

  useEffect(() => {
    loadInitialData();
  }, []);

  const loadInitialData = async () => {
    setIsLoading(true);
    try {
      const sectionsData = await dbService.getForumSections();
      setSections(sectionsData);
    } catch (e) { console.error("Forum init failed", e); }
    finally { setIsLoading(false); }
  };

  const loadPosts = async (forumId: string) => {
    setIsLoading(true);
    setPermissionError(false);
    try {
        const forumPosts = await dbService.getForumPosts(forumId);
        setPosts(forumPosts);
    } catch (e: any) { 
        if (e.code === 'permission-denied' || e.message === 'PERMISSION_DENIED') setPermissionError(true);
    }
    finally { setIsLoading(false); }
  };

  const handleForumClick = (forum: ForumType) => {
    setActiveForum(forum);
    loadPosts(forum.id);
  };

  const handleOpenAskModal = () => {
    if (!isRealUser) {
      alert("⚠️ أنت تستخدم 'حساب تجريبي'. للنشر في الساحة، يرجى تسجيل الخروج وإنشاء حساب حقيقي ببريدك الإلكتروني.");
      return;
    }
    setErrorMsg(null);
    setShowAskModal(true);
  };

  const handleAsk = async () => {
    if (!user || !activeForum || !isRealUser) return;
    
    const title = newQuestion.title.trim();
    const content = newQuestion.content.trim();
    
    if (!title || !content) { 
        setErrorMsg("يرجى كتابة عنوان وسؤال واضح."); 
        return; 
    }

    setIsSubmitting(true);
    setErrorMsg(null);
    try {
      await dbService.createForumPost({
        authorUid: auth.currentUser?.uid || user.uid,
        authorEmail: user.email,
        authorName: user.name,
        title, 
        content,
        tags: [activeForum.id],
        upvotes: 0,
        replies: [],
        timestamp: new Date().toISOString(),
        isPinned: false,
        isEscalated: false
      });
      
      setShowAskModal(false);
      setNewQuestion({ title: '', content: '' });
      await loadPosts(activeForum.id);
    } catch (e: any) { 
        console.error("Publish Error:", e);
        setErrorMsg("❌ فشل النشر. تأكد من تحديث 'مركز الأمان V5' في لوحة التحكم.");
    }
    finally { setIsSubmitting(false); }
  };

  const handleReply = async () => {
    if (!user || !selectedPost || !replyContent.trim()) return;
    if (!isRealUser) {
        alert("التفاعل متاح للحسابات الحقيقية فقط.");
        return;
    }

    setIsSubmitting(true);
    try {
      await dbService.addForumReply(selectedPost.id, {
        authorUid: auth.currentUser?.uid || user.uid,
        authorEmail: user.email,
        authorName: user.name,
        content: replyContent,
        role: user.role
      });
      setReplyContent('');
      await loadPosts(activeForum!.id);
      // التحديث المباشر للبوست المختار
      const updatedPosts = await dbService.getForumPosts(activeForum!.id);
      setSelectedPost(updatedPosts.find(p => p.id === selectedPost.id) || null);
    } catch (e: any) { alert("فشل إرسال الرد."); }
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
        <header className="mb-16 border-r-4 border-amber-400 pr-8">
          <h2 className="text-4xl md:text-6xl font-black text-white italic tracking-tighter">ساحة <span className="text-amber-400">النقاش</span></h2>
          <p className="text-gray-500 text-lg md:text-xl mt-2 font-medium flex items-center gap-2">
            {!isRealUser && <span className="bg-red-500/20 text-red-400 px-3 py-1 rounded-lg text-xs font-black">وضع المعاينة (تجريبي)</span>}
            مرحباً بك {user?.name.split(' ')[0]}، تصفح واطرح استفساراتك.
          </p>
        </header>

        {!isRealUser && (
            <div className="mb-12 bg-blue-500/10 border border-blue-500/30 p-6 rounded-[30px] flex items-center gap-4 animate-pulse">
                {/* Fixed: Added missing Info icon to imports from lucide-react */}
                <Info className="text-blue-400" />
                <p className="text-blue-200 text-sm font-bold">ملاحظة: للنشر في الساحة، يجب التسجيل بحساب حقيقي وليس عبر "الدخول التجريبي".</p>
            </div>
        )}

        {isLoading ? (
            <div className="py-20 text-center animate-pulse">
                <RefreshCw className="w-12 h-12 text-amber-400 animate-spin mx-auto mb-4" />
            </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {sections.flatMap(s => s.forums).map(forum => (
              <div key={forum.id} onClick={() => handleForumClick(forum)} className="glass-panel p-8 rounded-[40px] border-white/5 hover:border-amber-400/40 cursor-pointer transition-all group relative overflow-hidden bg-black/20 shadow-xl">
                <div className="w-16 h-16 rounded-2xl bg-white/5 flex items-center justify-center text-3xl mb-6 group-hover:bg-amber-400 group-hover:text-black transition-all">
                    {forum.icon}
                </div>
                <h3 className="text-2xl font-black text-white group-hover:text-amber-400 transition-colors">{forum.title}</h3>
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
        <button onClick={() => setActiveForum(null)} className="flex items-center gap-2 text-gray-500 hover:text-white font-black text-xs uppercase tracking-widest transition-all"> <ArrowRight /> العودة للدليل </button>
        <div className="text-right">
          <h2 className="text-4xl font-black text-white">{activeForum.title}</h2>
          <p className="text-gray-500 italic mt-1">{activeForum.description}</p>
        </div>
      </div>

      {permissionError && (
          <div className="mb-10 bg-red-600/20 border-2 border-red-600/40 p-8 rounded-[40px] flex items-center gap-6">
              <ShieldAlert size={48} className="text-red-500" />
              <div>
                  <h4 className="text-white font-black text-xl">⚠️ عذراً، لا تملك صلاحية الوصول</h4>
                  <p className="text-gray-300 mt-1">يجب على المدير تحديث "مركز الأمان V5" في لوحة التحكم، ويجب عليك استخدام حساب حقيقي.</p>
              </div>
          </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
        <div className="lg:col-span-8 space-y-6">
          <div className="flex flex-col sm:flex-row justify-between items-center bg-black/40 p-4 rounded-[30px] border border-white/5 gap-4">
             <div className="flex gap-2">
                <button onClick={() => setSortBy('newest')} className={`px-6 py-2 rounded-xl text-[10px] font-black transition-all ${sortBy === 'newest' ? 'bg-white text-black' : 'text-gray-500'}`}>الأحدث</button>
                <button onClick={() => setSortBy('top')} className={`px-6 py-2 rounded-xl text-[10px] font-black transition-all ${sortBy === 'top' ? 'bg-white text-black' : 'text-gray-500'}`}>الأفضل</button>
             </div>
             <button 
                onClick={handleOpenAskModal} 
                className="bg-amber-400 text-black px-10 py-4 rounded-2xl font-black text-xs uppercase flex items-center gap-3 hover:scale-105 transition-all shadow-xl"
             >
                <Plus size={18}/> موضوع جديد
             </button>
          </div>

          {isLoading ? (
              <div className="py-20 text-center animate-pulse text-gray-500">جاري جلب المواضيع...</div>
          ) : sortedPosts.map(post => (
            <div key={post.id} onClick={() => setSelectedPost(post)} className={`glass-panel p-8 rounded-[40px] border-2 cursor-pointer transition-all flex gap-8 group bg-black/20 ${selectedPost?.id === post.id ? 'border-amber-400 shadow-[0_0_40px_rgba(251,191,36,0.1)]' : 'border-white/5 hover:border-white/20'}`}>
              <div className="flex flex-col items-center gap-2 bg-white/5 p-4 rounded-[25px] h-fit border border-white/5 min-w-[70px]">
                <button onClick={(e) => { e.stopPropagation(); dbService.upvoteForumPost(post.id).then(() => loadPosts(activeForum.id)); }} className="text-gray-500 hover:text-amber-400 transition-all"><ArrowUp size={28} /></button>
                <span className="font-black text-2xl text-white">{post.upvotes || 0}</span>
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-3 mb-3">
                   {post.isPinned && <Pin size={16} className="text-amber-400 fill-amber-400" />}
                   <h3 className="text-2xl font-black text-white group-hover:text-amber-400 transition-colors truncate">{post.title}</h3>
                </div>
                <p className="text-gray-500 line-clamp-2 text-sm leading-relaxed mb-6 italic">"{post.content}"</p>
                <div className="flex justify-between items-center text-[9px] font-black text-gray-600 uppercase tracking-widest border-t border-white/5 pt-5">
                  <span className="flex items-center gap-2">👤 {post.authorName} • <Clock size={12}/> {new Date(post.timestamp).toLocaleDateString('ar-KW')}</span>
                  <span className="flex items-center gap-2 text-blue-400"><MessageSquare size={12}/> {post.replies?.length || 0} ردود</span>
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="lg:col-span-4 h-fit sticky top-32">
          {selectedPost ? (
            <div className="glass-panel p-8 rounded-[50px] border-white/10 bg-[#0a1118]/90 flex flex-col max-h-[75vh] shadow-3xl animate-slideUp overflow-hidden border-2">
              <div className="flex justify-between items-center mb-8 border-b border-white/5 pb-4">
                <button onClick={() => setSelectedPost(null)} className="text-[10px] font-black text-gray-500 hover:text-white transition-colors">إغلاق ✕</button>
                <span className="text-[10px] font-black text-amber-400 uppercase tracking-widest flex items-center gap-2"><Zap size={14} fill="currentColor"/> تفاصيل النقاش</span>
              </div>
              <div className="overflow-y-auto no-scrollbar flex-1 space-y-10 pr-2">
                <div className="space-y-6">
                  <h3 className="text-2xl font-black text-white">{selectedPost.title}</h3>
                  <div className="bg-white/5 p-8 rounded-[35px] text-gray-300 text-base leading-relaxed italic shadow-inner border border-white/5">{selectedPost.content}</div>
                </div>
                <div className="space-y-6 pt-10 border-t border-white/10">
                  <h4 className="text-[10px] font-black text-blue-400 uppercase tracking-widest">منصة الردود</h4>
                  <div className="space-y-4">
                      {selectedPost.replies?.map(reply => (
                        <div key={reply.id} className="p-6 bg-black/40 rounded-[25px] border border-white/5">
                          <div className="flex justify-between items-center mb-2">
                            <span className={`text-xs font-black ${reply.role === 'teacher' ? 'text-amber-400' : 'text-white'}`}>{reply.authorName}</span>
                            <span className="text-[9px] text-gray-600">{new Date(reply.timestamp).toLocaleDateString('ar-KW')}</span>
                          </div>
                          <p className="text-sm text-gray-400 leading-relaxed italic">"{reply.content}"</p>
                        </div>
                      ))}
                  </div>
                </div>
              </div>
              
              <div className="mt-8 pt-8 border-t border-white/10 space-y-5">
                <textarea 
                    value={replyContent} 
                    onChange={e => setReplyContent(e.target.value)} 
                    placeholder="اكتب ردك..."
                    className="w-full bg-black/60 border border-white/10 rounded-[25px] p-6 text-sm text-white outline-none focus:border-amber-400 h-32 transition-all shadow-inner" 
                />
                <button 
                    onClick={handleReply} 
                    disabled={!replyContent.trim() || isSubmitting} 
                    className="w-full py-5 bg-amber-400 text-black rounded-[25px] font-black text-xs uppercase tracking-widest flex items-center justify-center gap-3 transition-all hover:scale-105 active:scale-95 disabled:opacity-50 shadow-2xl"
                >
                  {isSubmitting ? <RefreshCw className="animate-spin" size={16}/> : <Send size={16}/>} إرسال الرد
                </button>
              </div>
            </div>
          ) : (
            <div className="glass-panel p-16 rounded-[60px] border-2 border-dashed border-white/10 text-center opacity-30 bg-black/10">
              <div className="w-20 h-20 bg-white/5 rounded-full flex items-center justify-center mx-auto mb-8 shadow-inner"><Bell size={40} className="text-gray-600" /></div>
              <p className="font-black text-sm uppercase tracking-widest italic">اختر موضوعاً للمشاركة</p>
            </div>
          )}
        </div>
      </div>

      {/* Modal */}
      {showAskModal && (
        <div className="fixed inset-0 z-[9999] bg-black/95 backdrop-blur-3xl flex items-center justify-center p-6 animate-fadeIn" onClick={() => setShowAskModal(false)}>
          <div className="glass-panel w-full max-w-2xl p-10 md:p-14 rounded-[60px] border-white/10 relative shadow-3xl bg-[#0a1118] border-2" onClick={e => e.stopPropagation()}>
            <button onClick={() => setShowAskModal(false)} className="absolute top-10 left-10 text-gray-500 hover:text-white p-3 bg-white/5 rounded-full"><X size={24}/></button>
            <div className="mb-10">
                <span className="bg-amber-500/10 text-amber-500 px-5 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest border border-amber-500/20">طرح سؤال</span>
                <h3 className="text-3xl font-black mt-6 text-white leading-tight">سؤال جديد في <span className="text-amber-400">{activeForum.title}</span></h3>
            </div>
            <div className="space-y-6">
              <div className="space-y-2">
                <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest mr-4">عنوان السؤال</label>
                <input type="text" value={newQuestion.title} onChange={e => setNewQuestion({...newQuestion, title: e.target.value})} className="w-full bg-black/40 border border-white/10 rounded-2xl px-8 py-5 text-white outline-none focus:border-amber-400 font-bold text-lg" placeholder="اكتب عنواناً واضحاً..." />
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest mr-4">تفاصيل السؤال</label>
                <textarea value={newQuestion.content} onChange={e => setNewQuestion({...newQuestion, content: e.target.value})} className="w-full bg-black/40 border border-white/10 rounded-2xl p-8 text-white outline-none focus:border-amber-400 h-48 leading-relaxed italic" placeholder="اشرح سؤالك هنا بالتفصيل..." />
              </div>
              
              {errorMsg && (
                <div className="p-4 bg-red-600/10 border border-red-600/20 text-red-500 text-xs font-bold rounded-2xl text-center flex items-center justify-center gap-3">
                  <AlertCircle size={18}/> {errorMsg}
                </div>
              )}

              <button 
                onClick={handleAsk} 
                disabled={isSubmitting} 
                className="w-full py-6 rounded-[30px] font-black uppercase tracking-widest shadow-2xl transition-all flex items-center justify-center gap-4 text-lg bg-amber-400 text-black hover:scale-[1.02] active:scale-95 disabled:opacity-50"
              >
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

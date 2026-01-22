
import React, { useState, useEffect } from 'react';
import { ForumSection, Forum, User } from '../types';
import { dbService } from '../services/db';
import { Plus, Trash2, Edit, Save, X, RefreshCw, ChevronUp, ChevronDown, MessageSquare, GripVertical, PlusCircle, Image as ImageIcon, Users } from 'lucide-react';

const AdminForumManager: React.FC = () => {
    const [sections, setSections] = useState<ForumSection[]>([]);
    const [teachers, setTeachers] = useState<User[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);
    const [editingSection, setEditingSection] = useState<Partial<ForumSection> | null>(null);
    const [editingForum, setEditingForum] = useState<{ forum: Partial<Forum>, sectionId: string } | null>(null);
    const [message, setMessage] = useState<string | null>(null);

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        setIsLoading(true);
        const [sectionsData, teachersData] = await Promise.all([
            dbService.getForumSections(),
            dbService.getTeachers()
        ]);
        setSections(sectionsData);
        setTeachers(teachersData);
        setIsLoading(false);
    };

    const handleSaveStructure = async () => {
        setIsSaving(true);
        try {
            await dbService.saveForumSections(sections);
            setMessage("تم حفظ هيكل المنتديات بنجاح!");
        } catch (error) {
            setMessage("فشل حفظ الهيكل.");
        } finally {
            setIsSaving(false);
            setTimeout(() => setMessage(null), 3000);
        }
    };

    const addSection = () => setEditingSection({ id: `sec_${Date.now()}`, title: '', description: '', forums: [], order: sections.length });
    
    const saveSection = () => {
        if (!editingSection || !editingSection.title) return;
        if (sections.some(s => s.id === editingSection.id)) {
            setSections(sections.map(s => s.id === editingSection.id ? editingSection as ForumSection : s));
        } else {
            setSections([...sections, editingSection as ForumSection]);
        }
        setEditingSection(null);
    };

    const deleteSection = (id: string) => {
        if(confirm("هل أنت متأكد من حذف القسم وجميع منتدياته؟")) {
            setSections(sections.filter(s => s.id !== id));
        }
    };

    const moveSection = (index: number, direction: 'up' | 'down') => {
        const newSections = [...sections];
        const targetIndex = direction === 'up' ? index - 1 : index + 1;
        if (targetIndex < 0 || targetIndex >= newSections.length) return;
        [newSections[index], newSections[targetIndex]] = [newSections[targetIndex], newSections[index]];
        setSections(newSections.map((s, i) => ({ ...s, order: i })));
    };

    const addForum = (sectionId: string) => {
        const section = sections.find(s => s.id === sectionId);
        if (!section) return;
        setEditingForum({
            forum: { id: `forum_${Date.now()}`, title: '', description: '', icon: '💬', imageUrl: '', order: section.forums.length },
            sectionId
        });
    };

    const saveForum = () => {
        if (!editingForum || !editingForum.forum.title) return;
        const newSections = sections.map(section => {
            if (section.id === editingForum.sectionId) {
                const newForums = [...section.forums];
                const existingIndex = newForums.findIndex(f => f.id === editingForum.forum.id);
                if (existingIndex > -1) {
                    newForums[existingIndex] = editingForum.forum as Forum;
                } else {
                    newForums.push(editingForum.forum as Forum);
                }
                return { ...section, forums: newForums };
            }
            return section;
        });
        setSections(newSections);
        setEditingForum(null);
    };

    const deleteForum = (sectionId: string, forumId: string) => {
        setSections(sections.map(s => s.id === sectionId ? { ...s, forums: s.forums.filter(f => f.id !== forumId) } : s));
    };

    return (
        <div className="max-w-5xl mx-auto py-8 animate-fadeIn font-['Tajawal'] text-right" dir="rtl">
            <header className="flex justify-between items-center gap-6 mb-12">
                <div>
                    <h2 className="text-4xl font-black text-white flex items-center gap-4 italic uppercase tracking-tighter">
                        <MessageSquare className="text-[#fbbf24]" size={32} /> إدارة <span className="text-[#fbbf24]">المنتديات</span>
                    </h2>
                    <p className="text-gray-500 mt-2">قم ببناء الهيكل التنظيمي للنقاشات وتخصيص الصور والأقسام.</p>
                </div>
                <div className="flex gap-4">
                    <button onClick={addSection} className="bg-[#fbbf24] text-black px-8 py-4 rounded-2xl font-black text-xs uppercase flex items-center gap-2 shadow-lg hover:scale-105 transition-all"><PlusCircle size={18} /> قسم رئيسي جديد</button>
                    <button onClick={handleSaveStructure} disabled={isSaving} className="bg-green-500 text-black px-8 py-4 rounded-2xl font-black text-xs uppercase flex items-center gap-2 shadow-lg hover:scale-105 transition-all">
                        {isSaving ? <RefreshCw className="animate-spin" size={18}/> : <Save size={18} />} حفظ التغييرات نهائياً
                    </button>
                </div>
            </header>

            {message && <div className="mb-8 p-5 bg-green-500/10 text-green-400 rounded-3xl text-sm font-bold border border-green-500/20 flex items-center gap-3 animate-slideUp">✓ {message}</div>}
            
            {isLoading ? (
                <div className="py-40 text-center animate-pulse">
                    <RefreshCw className="w-12 h-12 text-[#fbbf24] animate-spin mx-auto mb-6" />
                    <p className="text-gray-600 font-bold uppercase tracking-widest">جاري تحميل الهيكل الحالي...</p>
                </div>
            ) : (
                <div className="space-y-10">
                    {sections.map((section, index) => (
                        <div key={section.id} className="glass-panel p-8 rounded-[40px] border border-white/5 bg-gradient-to-br from-white/[0.02] to-transparent relative group">
                            <div className="absolute left-[-20px] top-1/2 -translate-y-1/2 flex flex-col gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                <button onClick={() => moveSection(index, 'up')} disabled={index === 0} className="w-10 h-10 bg-white text-black rounded-full flex items-center justify-center shadow-2xl disabled:opacity-30 hover:scale-110 transition-all"><ChevronUp size={20}/></button>
                                <button onClick={() => moveSection(index, 'down')} disabled={index === sections.length - 1} className="w-10 h-10 bg-white text-black rounded-full flex items-center justify-center shadow-2xl disabled:opacity-30 hover:scale-110 transition-all"><ChevronDown size={20}/></button>
                            </div>
                            <div className="flex-1">
                                <div className="flex justify-between items-start mb-8 border-b border-white/5 pb-6">
                                    <div className="flex items-center gap-6">
                                        <div className="w-14 h-14 bg-white/5 rounded-2xl flex items-center justify-center text-xl font-black text-[#fbbf24]">{index + 1}</div>
                                        <div>
                                            <h3 className="text-2xl font-black text-white group-hover:text-[#fbbf24] transition-colors">{section.title}</h3>
                                            <p className="text-sm text-gray-500">{section.description}</p>
                                        </div>
                                    </div>
                                    <div className="flex gap-2">
                                        <button onClick={() => setEditingSection(section)} className="p-3 bg-white/5 rounded-xl text-blue-400 hover:bg-blue-400 hover:text-black transition-all"><Edit size={18}/></button>
                                        <button onClick={() => deleteSection(section.id)} className="p-3 bg-white/5 rounded-xl text-red-500 hover:bg-red-500 hover:text-white transition-all"><Trash2 size={18}/></button>
                                    </div>
                                </div>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    {section.forums.map(forum => (
                                        <div key={forum.id} className="bg-black/40 p-5 rounded-[30px] border border-white/5 flex justify-between items-center group/forum hover:border-[#fbbf24]/40 transition-all">
                                            <div className="flex items-center gap-4">
                                                <div className="w-12 h-12 rounded-xl bg-white/5 overflow-hidden flex items-center justify-center border border-white/10">
                                                    {forum.imageUrl ? <img src={forum.imageUrl} className="w-full h-full object-cover" alt="" /> : <span className="text-2xl">{forum.icon}</span>}
                                                </div>
                                                <div>
                                                    <span className="text-lg font-black text-white">{forum.title}</span>
                                                    <p className="text-[10px] text-gray-500 truncate max-w-[150px] flex items-center gap-1">{forum.moderatorName ? <>🔐 {forum.moderatorName}</> : 'بدون إشراف'}</p>
                                                </div>
                                            </div>
                                            <div className="flex gap-2 opacity-0 group-hover/forum:opacity-100 transition-opacity">
                                                <button onClick={() => setEditingForum({ forum, sectionId: section.id })} className="p-2 bg-white/5 rounded-lg text-blue-400 hover:bg-white/10"><Edit size={14}/></button>
                                                <button onClick={() => deleteForum(section.id, forum.id)} className="p-2 bg-red-500/10 text-red-400 rounded-lg hover:bg-red-500 hover:text-white"><Trash2 size={14}/></button>
                                            </div>
                                        </div>
                                    ))}
                                    <button onClick={() => addForum(section.id)} className="col-span-full text-center p-4 text-xs font-black text-green-400 border-2 border-dashed border-green-500/20 rounded-[30px] hover:bg-green-500/10 transition-all uppercase tracking-widest">
                                        + إضافة منتدى فرعي (رابط نقاش)
                                    </button>
                                </div>
                            </div>
                        </div>
                    ))}
                    {sections.length === 0 && (
                        <div className="py-40 text-center glass-panel rounded-[60px] border-2 border-dashed border-white/10 opacity-30">
                            <Plus size={64} className="mx-auto mb-6 text-gray-600" />
                            <p className="text-2xl font-black uppercase tracking-[0.4em]">ابدأ ببناء هيكل المنتدى</p>
                            <p className="mt-4">أضف أقساماً رئيسية لتصنيف الحوارات (مثلاً: الاستفسارات العلمية، الدعم الفني).</p>
                        </div>
                    )}
                </div>
            )}

            {(editingSection || editingForum) && (
                <div className="fixed inset-0 z-[150] bg-black/95 backdrop-blur-2xl flex items-center justify-center p-4 animate-fadeIn">
                    <div className="bg-[#0a1118] border border-white/10 w-full max-w-xl rounded-[60px] p-12 relative shadow-3xl overflow-hidden">
                        <div className="absolute top-0 right-0 p-12 opacity-[0.03] text-9xl pointer-events-none italic font-black">SSC</div>
                        <button onClick={() => { setEditingSection(null); setEditingForum(null); }} className="absolute top-8 left-8 text-gray-500 hover:text-white p-3 bg-white/5 rounded-full"><X/></button>
                        
                        {editingSection && (
                            <div className="space-y-8 relative z-10">
                                <h3 className="text-3xl font-black text-white mb-2">إعدادات القسم الرئيسي</h3>
                                <div className="space-y-6">
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black text-gray-500 uppercase mr-4">عنوان القسم</label>
                                        <input type="text" placeholder="مثال: نقاشات الصف الثاني عشر" value={editingSection.title} onChange={e => setEditingSection({...editingSection, title: e.target.value})} className="w-full bg-black/40 border border-white/10 rounded-2xl px-6 py-4 text-white outline-none focus:border-[#fbbf24]" />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black text-gray-500 uppercase mr-4">وصف القسم (اختياري)</label>
                                        <textarea placeholder="وصف قصير يظهر للطالب..." value={editingSection.description} onChange={e => setEditingSection({...editingSection, description: e.target.value})} className="w-full bg-black/40 border border-white/10 rounded-2xl px-6 py-4 text-white outline-none focus:border-[#fbbf24] h-32" />
                                    </div>
                                    <button onClick={saveSection} className="w-full bg-[#fbbf24] text-black py-5 rounded-[30px] font-black uppercase tracking-widest shadow-2xl hover:scale-105 transition-all mt-4">تأكيد الإعدادات</button>
                                </div>
                            </div>
                        )}

                        {editingForum && (
                             <div className="space-y-8 relative z-10">
                                <h3 className="text-3xl font-black text-white mb-2">إعدادات المنتدى (الرابط)</h3>
                                <div className="space-y-6">
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black text-gray-500 uppercase mr-4">اسم المنتدى</label>
                                        <input type="text" placeholder="مثال: استفسارات الوحدة الأولى" value={editingForum.forum.title} onChange={e => setEditingForum({...editingForum, forum: {...editingForum.forum, title: e.target.value}})} className="w-full bg-black/40 border border-white/10 rounded-2xl px-6 py-4 text-white outline-none focus:border-blue-400" />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black text-gray-500 uppercase mr-4 flex items-center gap-2"><Users size={12}/> تعيين مشرف</label>
                                        <select 
                                            value={editingForum.forum.moderatorUid || ''}
                                            onChange={e => {
                                                const selectedTeacher = teachers.find(t => t.uid === e.target.value);
                                                setEditingForum({
                                                    ...editingForum, 
                                                    forum: {
                                                        ...editingForum.forum, 
                                                        moderatorUid: selectedTeacher?.uid,
                                                        moderatorName: selectedTeacher?.name
                                                    }
                                                });
                                            }}
                                            className="w-full bg-black/40 border border-white/10 rounded-2xl px-6 py-4 text-white outline-none focus:border-blue-400 font-bold"
                                        >
                                            <option value="">-- بدون مشرف --</option>
                                            {teachers.map(teacher => (
                                                <option key={teacher.uid} value={teacher.uid}>{teacher.name}</option>
                                            ))}
                                        </select>
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black text-gray-500 uppercase mr-4">رابط صورة الغلاف (ImageUrl)</label>
                                        <div className="flex gap-4">
                                            <div className="w-16 h-16 rounded-xl bg-black/60 border border-white/10 flex items-center justify-center overflow-hidden shrink-0">
                                                {editingForum.forum.imageUrl ? <img src={editingForum.forum.imageUrl} className="w-full h-full object-cover" /> : <ImageIcon className="text-gray-700" />}
                                            </div>
                                            <input type="text" placeholder="انسخ رابط الصورة من مكتبة الوسائط..." value={editingForum.forum.imageUrl} onChange={e => setEditingForum({...editingForum, forum: {...editingForum.forum, imageUrl: e.target.value}})} className="flex-1 bg-black/40 border border-white/10 rounded-2xl px-6 py-4 text-white outline-none focus:border-blue-400 text-xs font-mono" />
                                        </div>
                                    </div>
                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="space-y-2">
                                            <label className="text-[10px] font-black text-gray-500 uppercase mr-4">أيقونة احتياطية (Emoji)</label>
                                            <input type="text" value={editingForum.forum.icon} onChange={e => setEditingForum({...editingForum, forum: {...editingForum.forum, icon: e.target.value}})} className="w-full bg-black/40 border border-white/10 rounded-2xl px-6 py-4 text-white outline-none text-center text-2xl" />
                                        </div>
                                        <div className="space-y-2 flex flex-col justify-end">
                                            <button onClick={saveForum} className="w-full bg-blue-500 text-white py-4 rounded-2xl font-black uppercase tracking-widest shadow-xl hover:bg-blue-600 transition-all">حفظ</button>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
};

export default AdminForumManager;

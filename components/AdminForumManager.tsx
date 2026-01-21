
import React, { useState, useEffect } from 'react';
import { ForumSection, Forum } from '../types';
import { dbService } from '../services/db';
import { Plus, Trash2, Edit, Save, X, RefreshCw, ChevronUp, ChevronDown, MessageSquare, GripVertical, PlusCircle } from 'lucide-react';

const AdminForumManager: React.FC = () => {
    const [sections, setSections] = useState<ForumSection[]>([]);
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
        const data = await dbService.getForumSections();
        setSections(data);
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

    // Section handlers
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
    const deleteSection = (id: string) => setSections(sections.filter(s => s.id !== id));
    const moveSection = (index: number, direction: 'up' | 'down') => {
        const newSections = [...sections];
        const targetIndex = direction === 'up' ? index - 1 : index + 1;
        if (targetIndex < 0 || targetIndex >= newSections.length) return;
        [newSections[index], newSections[targetIndex]] = [newSections[targetIndex], newSections[index]];
        setSections(newSections.map((s, i) => ({ ...s, order: i })));
    };

    // Forum handlers
    const addForum = (sectionId: string) => {
        const section = sections.find(s => s.id === sectionId);
        if (!section) return;
        setEditingForum({
            forum: { id: `forum_${Date.now()}`, title: '', description: '', icon: '💬', order: section.forums.length },
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
        <div className="max-w-4xl mx-auto py-8 animate-fadeIn font-['Tajawal'] text-right" dir="rtl">
            <header className="flex justify-between items-center gap-6 mb-8">
                <h2 className="text-3xl font-black text-white flex items-center gap-4"><MessageSquare /> إدارة المنتديات</h2>
                <div className="flex gap-4">
                    <button onClick={addSection} className="bg-[#fbbf24] text-black px-6 py-3 rounded-xl font-black text-xs uppercase flex items-center gap-2"><PlusCircle size={16} /> قسم جديد</button>
                    <button onClick={handleSaveStructure} disabled={isSaving} className="bg-green-500 text-white px-6 py-3 rounded-xl font-black text-xs uppercase flex items-center gap-2">
                        {isSaving ? <RefreshCw className="animate-spin" size={16}/> : <Save size={16} />} حفظ الهيكل
                    </button>
                </div>
            </header>

            {message && <div className="mb-4 p-3 bg-green-500/10 text-green-400 rounded-xl text-xs font-bold text-center">{message}</div>}
            
            <div className="space-y-6">
                {sections.map((section, index) => (
                    <div key={section.id} className="glass-panel p-6 rounded-3xl border border-white/5 flex gap-4">
                        <div className="flex flex-col gap-1">
                            <button onClick={() => moveSection(index, 'up')} disabled={index === 0} className="p-1 text-gray-500 hover:text-white disabled:opacity-20"><ChevronUp size={16}/></button>
                            <GripVertical className="text-gray-700 cursor-grab" />
                            <button onClick={() => moveSection(index, 'down')} disabled={index === sections.length - 1} className="p-1 text-gray-500 hover:text-white disabled:opacity-20"><ChevronDown size={16}/></button>
                        </div>
                        <div className="flex-1">
                            <div className="flex justify-between items-start mb-4">
                                <div>
                                    <h3 className="text-xl font-bold text-white">{section.title}</h3>
                                    <p className="text-xs text-gray-400">{section.description}</p>
                                </div>
                                <div className="flex gap-2">
                                    <button onClick={() => setEditingSection(section)} className="p-2 text-blue-400"><Edit size={14}/></button>
                                    <button onClick={() => deleteSection(section.id)} className="p-2 text-red-500"><Trash2 size={14}/></button>
                                </div>
                            </div>
                            <div className="space-y-2">
                                {section.forums.map(forum => (
                                    <div key={forum.id} className="bg-black/40 p-3 rounded-xl border border-white/5 flex justify-between items-center">
                                        <div className="flex items-center gap-3">
                                            <span className="text-lg">{forum.icon}</span>
                                            <span className="text-sm font-bold">{forum.title}</span>
                                        </div>
                                        <div className="flex gap-2">
                                            <button onClick={() => setEditingForum({ forum, sectionId: section.id })} className="p-1 text-blue-400"><Edit size={12}/></button>
                                            <button onClick={() => deleteForum(section.id, forum.id)} className="p-1 text-red-500"><Trash2 size={12}/></button>
                                        </div>
                                    </div>
                                ))}
                                <button onClick={() => addForum(section.id)} className="w-full text-center p-2 text-xs font-bold text-green-400 border-2 border-dashed border-green-500/20 rounded-xl hover:bg-green-500/10">
                                    + إضافة منتدى فرعي
                                </button>
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            {(editingSection || editingForum) && (
                <div className="fixed inset-0 z-[150] bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
                    <div className="bg-[#0a1118] border border-white/10 w-full max-w-lg rounded-[40px] p-8 shadow-3xl animate-fadeIn">
                        {editingSection && (
                            <>
                                <h3 className="text-xl font-bold mb-4">إعدادات القسم</h3>
                                <input type="text" placeholder="عنوان القسم" value={editingSection.title} onChange={e => setEditingSection({...editingSection, title: e.target.value})} className="w-full bg-black/20 border border-white/10 rounded-lg p-3 mb-2" />
                                <input type="text" placeholder="وصف القسم" value={editingSection.description} onChange={e => setEditingSection({...editingSection, description: e.target.value})} className="w-full bg-black/20 border border-white/10 rounded-lg p-3 mb-4" />
                                <div className="flex gap-2">
                                    <button onClick={() => setEditingSection(null)} className="flex-1 py-2 bg-white/10 rounded-lg">إلغاء</button>
                                    <button onClick={saveSection} className="flex-1 py-2 bg-green-500 text-black rounded-lg">حفظ</button>
                                </div>
                            </>
                        )}
                        {editingForum && (
                             <>
                                <h3 className="text-xl font-bold mb-4">إعدادات المنتدى الفرعي</h3>
                                <input type="text" placeholder="عنوان المنتدى" value={editingForum.forum.title} onChange={e => setEditingForum({...editingForum, forum: {...editingForum.forum, title: e.target.value}})} className="w-full bg-black/20 border border-white/10 rounded-lg p-3 mb-2" />
                                <input type="text" placeholder="وصف المنتدى" value={editingForum.forum.description} onChange={e => setEditingForum({...editingForum, forum: {...editingForum.forum, description: e.target.value}})} className="w-full bg-black/20 border border-white/10 rounded-lg p-3 mb-2" />
                                <input type="text" placeholder="أيقونة (Emoji)" value={editingForum.forum.icon} onChange={e => setEditingForum({...editingForum, forum: {...editingForum.forum, icon: e.target.value}})} className="w-full bg-black/20 border border-white/10 rounded-lg p-3 mb-4" />
                                <div className="flex gap-2">
                                    <button onClick={() => setEditingForum(null)} className="flex-1 py-2 bg-white/10 rounded-lg">إلغاء</button>
                                    <button onClick={saveForum} className="flex-1 py-2 bg-green-500 text-black rounded-lg">حفظ</button>
                                </div>
                            </>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
};

export default AdminForumManager;

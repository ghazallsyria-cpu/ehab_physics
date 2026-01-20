
import React, { useState, useEffect } from 'react';
import { HomePageContent, ViewState } from '../types';
import { dbService } from '../services/db';
import { PlusCircle, Edit, Trash2, X, Save, RefreshCw, LayoutDashboard, AlertTriangle, Newspaper, Image as ImageIcon, Megaphone } from 'lucide-react';

const AdminContentManager: React.FC = () => {
    const [contentItems, setContentItems] = useState<HomePageContent[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [editingItem, setEditingItem] = useState<Partial<HomePageContent> | null>(null);
    const [message, setMessage] = useState<string | null>(null);

    useEffect(() => {
        loadContent();
    }, []);

    const loadContent = async () => {
        setIsLoading(true);
        try {
            const data = await dbService.getHomePageContent();
            setContentItems(data);
        } catch (error) {
            setMessage("فشل تحميل المحتوى.");
            console.error(error);
        } finally {
            setIsLoading(false);
        }
    };

    const handleSave = async () => {
        if (!editingItem || !editingItem.title || !editingItem.content) {
            alert("يرجى تعبئة العنوان والمحتوى.");
            return;
        }
        setIsLoading(true);
        try {
            await dbService.saveHomePageContent(editingItem);
            setEditingItem(null);
            await loadContent();
            setMessage("تم الحفظ بنجاح!");
        } catch (error) {
            setMessage("فشل الحفظ.");
        } finally {
            setIsLoading(false);
            setTimeout(() => setMessage(null), 3000);
        }
    };

    const handleDelete = async (id: string) => {
        if (window.confirm("هل أنت متأكد من حذف هذا العنصر؟")) {
            await dbService.deleteHomePageContent(id);
            await loadContent();
        }
    };
    
    const startNewItem = () => {
        setEditingItem({
            type: 'news',
            priority: 'normal',
            title: '',
            content: '',
            createdAt: new Date().toISOString()
        });
    };
    
    const getIconForType = (type: HomePageContent['type']) => {
        switch (type) {
          case 'alert': return <AlertTriangle size={14} />;
          case 'announcement': return <Megaphone size={14} />;
          case 'image': return <ImageIcon size={14} />;
          case 'news': default: return <Newspaper size={14} />;
        }
    };

    return (
        <div className="max-w-6xl mx-auto py-8 animate-fadeIn font-['Tajawal'] text-right" dir="rtl">
            <header className="flex flex-col md:flex-row justify-between items-center gap-6 mb-8">
                <h2 className="text-3xl font-black text-white flex items-center gap-4"><LayoutDashboard /> إدارة محتوى الصفحة الرئيسية</h2>
                <div className="flex gap-4">
                    <button onClick={loadContent} className="p-4 bg-white/5 rounded-2xl text-white hover:bg-white/10 transition-all border border-white/10"><RefreshCw size={20} className={isLoading ? 'animate-spin' : ''} /></button>
                    <button onClick={startNewItem} className="bg-[#fbbf24] text-black px-6 py-4 rounded-2xl font-black text-xs uppercase tracking-widest shadow-lg hover:scale-105 transition-all flex items-center gap-2"><PlusCircle size={18} /> إضافة عنصر جديد</button>
                </div>
            </header>

            {message && <div className="mb-4 p-3 bg-green-500/10 text-green-400 rounded-xl text-xs font-bold text-center">{message}</div>}

            <div className="glass-panel p-8 rounded-[40px] border-white/5">
                <table className="w-full text-sm">
                    <thead className="border-b border-white/10 text-xs font-bold text-gray-500 uppercase">
                        <tr className="text-right">
                            <th className="p-4">العنوان</th>
                            <th className="p-4 text-center">النوع</th>
                            <th className="p-4 text-center">الأولوية</th>
                            <th className="p-4 text-center">الإجراءات</th>
                        </tr>
                    </thead>
                    <tbody>
                        {contentItems.map(item => (
                            <tr key={item.id} className="border-b border-white/5">
                                <td className="p-4 font-bold">{item.title}</td>
                                <td className="p-4 text-center">
                                    <span className="bg-white/5 px-2 py-1 rounded text-xs font-bold flex items-center gap-2 justify-center">
                                        {getIconForType(item.type)} {item.type}
                                    </span>
                                </td>
                                <td className="p-4 text-center">
                                    <span className={`px-2 py-1 rounded text-xs font-bold ${item.priority === 'high' ? 'bg-red-500/10 text-red-400' : 'bg-gray-500/10 text-gray-400'}`}>{item.priority}</span>
                                </td>
                                <td className="p-4 text-center flex justify-center gap-2">
                                    <button onClick={() => setEditingItem(item)} className="p-2 text-blue-400 bg-blue-500/10 rounded-lg hover:bg-blue-500/20"><Edit size={14} /></button>
                                    <button onClick={() => handleDelete(item.id)} className="p-2 text-red-500 bg-red-500/10 rounded-lg hover:bg-red-500/20"><Trash2 size={14} /></button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
                {contentItems.length === 0 && !isLoading && <div className="text-center p-10 text-gray-500">لا يوجد محتوى حالياً.</div>}
            </div>
            
            {editingItem && (
                <div className="fixed inset-0 z-[150] bg-black/80 backdrop-blur-md flex items-center justify-center p-4" onClick={() => setEditingItem(null)}>
                    <div className="bg-[#0a1118] border border-white/10 w-full max-w-2xl rounded-[40px] p-8 shadow-3xl animate-fadeIn flex flex-col max-h-[90vh]" onClick={e => e.stopPropagation()}>
                        <div className="flex justify-between items-center mb-6">
                            <h3 className="text-2xl font-black text-white">{editingItem.id ? 'تعديل العنصر' : 'عنصر جديد'}</h3>
                            <button onClick={() => setEditingItem(null)} className="p-2 text-gray-500 hover:text-white"><X /></button>
                        </div>
                        <div className="flex-1 overflow-y-auto no-scrollbar pr-2 space-y-4">
                            <input type="text" placeholder="العنوان" value={editingItem.title || ''} onChange={e => setEditingItem({ ...editingItem, title: e.target.value })} className="w-full bg-black/20 border border-white/10 rounded-lg p-3 text-white outline-none focus:border-[#fbbf24]" />
                            <textarea placeholder="المحتوى..." value={editingItem.content || ''} onChange={e => setEditingItem({ ...editingItem, content: e.target.value })} className="w-full h-32 bg-black/20 border border-white/10 rounded-lg p-3 text-white outline-none focus:border-[#fbbf24]" />
                            <input type="text" placeholder="رابط صورة (اختياري)" value={editingItem.imageUrl || ''} onChange={e => setEditingItem({ ...editingItem, imageUrl: e.target.value })} className="w-full bg-black/20 border border-white/10 rounded-lg p-3 text-white outline-none focus:border-[#fbbf24]" />
                            <div className="grid grid-cols-2 gap-4">
                                <select value={editingItem.type || 'news'} onChange={e => setEditingItem({ ...editingItem, type: e.target.value as any })} className="w-full bg-black/20 border border-white/10 rounded-lg p-3 text-white outline-none focus:border-[#fbbf24]">
                                    <option value="news">خبر</option>
                                    <option value="announcement">إعلان</option>
                                    <option value="alert">تنبيه</option>
                                    <option value="image">صورة</option>
                                </select>
                                <select value={editingItem.priority || 'normal'} onChange={e => setEditingItem({ ...editingItem, priority: e.target.value as any })} className="w-full bg-black/20 border border-white/10 rounded-lg p-3 text-white outline-none focus:border-[#fbbf24]">
                                    <option value="normal">عادي</option>
                                    <option value="high">أولوية عالية</option>
                                </select>
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <input type="text" placeholder="نص الزر (اختياري)" value={editingItem.ctaText || ''} onChange={e => setEditingItem({ ...editingItem, ctaText: e.target.value })} className="w-full bg-black/20 border border-white/10 rounded-lg p-3 text-white outline-none focus:border-[#fbbf24]" />
                                <input type="text" placeholder="رابط الزر (اختياري)" value={editingItem.ctaLink || ''} onChange={e => setEditingItem({ ...editingItem, ctaLink: e.target.value as any })} className="w-full bg-black/20 border border-white/10 rounded-lg p-3 text-white outline-none focus:border-[#fbbf24]" />
                            </div>
                        </div>
                        <div className="mt-6 pt-6 border-t border-white/10">
                            <button onClick={handleSave} className="w-full bg-green-500 text-black py-4 rounded-2xl font-black text-sm uppercase tracking-widest hover:scale-105 transition-all">حفظ</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default AdminContentManager;

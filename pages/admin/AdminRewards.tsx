import React, { useState, useEffect } from 'react';
import { Achievement, User } from '../../types';
import { dbService } from '../../services/db';
import { Gift, Plus, Trash2, Edit, Save, X, RefreshCw, Trophy, Medal, Star, UserPlus, Search, CheckCircle2 } from 'lucide-react';

const AdminRewards: React.FC = () => {
  const [achievements, setAchievements] = useState<Achievement[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [editingItem, setEditingItem] = useState<Partial<Achievement> | null>(null);
  
  // Student Assignment State
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [foundStudent, setFoundStudent] = useState<User | null>(null);
  const [selectedAchievementId, setSelectedAchievementId] = useState<string>('');

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setIsLoading(true);
    try {
      const data = await dbService.getAchievements();
      setAchievements(data);
    } catch (e) {
      console.error("Failed to load achievements", e);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSave = async () => {
    if (!editingItem?.title || !editingItem?.points) {
      alert("يرجى إدخال العنوان والنقاط.");
      return;
    }
    setIsSaving(true);
    try {
      await dbService.saveAchievement(editingItem);
      setEditingItem(null);
      await loadData();
    } catch (e) {
      alert("فشل الحفظ.");
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("هل أنت متأكد من حذف هذا الإنجاز؟")) return;
    await dbService.deleteAchievement(id);
    await loadData();
  };

  const handleSearchStudent = async (e: React.FormEvent) => {
      e.preventDefault();
      if (!searchQuery) return;
      // Note: In a real app, this should probably search by email or ID more robustly
      // Here assuming email search for simplicity based on existing dbService.getUser
      const user = await dbService.getUser(searchQuery);
      if (user && user.role === 'student') {
          setFoundStudent(user);
      } else {
          alert("لم يتم العثور على طالب بهذا البريد.");
          setFoundStudent(null);
      }
  };

  const handleAssign = async () => {
      if (!foundStudent || !selectedAchievementId) return;
      setIsSaving(true);
      try {
          await dbService.assignAchievementToStudent(foundStudent.uid, selectedAchievementId);
          alert(`تم منح الوسام للطالب ${foundStudent.name} بنجاح!`);
          setShowAssignModal(false);
          setFoundStudent(null);
          setSearchQuery('');
      } catch (e) {
          alert("فشل تعيين الوسام.");
      } finally {
          setIsSaving(false);
      }
  };

  const getCategoryColor = (cat: Achievement['category']) => {
      switch(cat) {
          case 'academic': return 'text-blue-400 bg-blue-400/10 border-blue-400/20';
          case 'participation': return 'text-green-400 bg-green-400/10 border-green-400/20';
          case 'streak': return 'text-orange-400 bg-orange-400/10 border-orange-400/20';
          case 'special': return 'text-purple-400 bg-purple-400/10 border-purple-400/20';
          default: return 'text-gray-400 bg-gray-400/10';
      }
  };

  if (isLoading) return <div className="p-20 text-center"><RefreshCw className="animate-spin text-white mx-auto" /></div>;

  return (
    <div className="animate-fadeIn space-y-8 pb-20 font-['Tajawal']" dir="rtl">
      <header className="flex flex-col md:flex-row justify-between items-center gap-6">
        <div>
            <h2 className="text-3xl font-black text-white flex items-center gap-3">
                <Gift className="text-green-400" /> إدارة المكافآت والإنجازات
            </h2>
            <p className="text-gray-500 text-sm mt-1">إنشاء أوسمة، تحديد نقاط الخبرة (XP)، وتكريم الطلاب المتميزين.</p>
        </div>
        <div className="flex gap-3">
            <button onClick={() => setShowAssignModal(true)} className="bg-white/5 text-white border border-white/10 px-6 py-4 rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-white/10 transition-all flex items-center gap-2">
                <UserPlus size={16} /> منح وسام لطالب
            </button>
            <button onClick={() => setEditingItem({ title: '', description: '', points: 10, icon: '🏆', category: 'academic', isHidden: false })} className="bg-green-500 text-black px-8 py-4 rounded-2xl font-black text-xs uppercase tracking-widest shadow-lg hover:scale-105 transition-all flex items-center gap-2">
                <Plus size={16} /> وسام جديد
            </button>
        </div>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {achievements.map(ach => (
              <div key={ach.id} className="glass-panel p-6 rounded-[30px] border border-white/5 bg-black/20 group hover:border-green-500/30 transition-all relative overflow-hidden">
                  <div className="flex justify-between items-start mb-4">
                      <div className="w-16 h-16 bg-white/5 rounded-2xl flex items-center justify-center text-4xl shadow-inner">
                          {ach.icon}
                      </div>
                      <div className="flex gap-2">
                          <button onClick={() => setEditingItem(ach)} className="p-2 text-blue-400 hover:bg-blue-400/10 rounded-lg"><Edit size={16}/></button>
                          <button onClick={() => handleDelete(ach.id)} className="p-2 text-red-400 hover:bg-red-400/10 rounded-lg"><Trash2 size={16}/></button>
                      </div>
                  </div>
                  <h3 className="text-xl font-bold text-white mb-2">{ach.title}</h3>
                  <p className="text-gray-400 text-xs mb-6 h-10 line-clamp-2">{ach.description}</p>
                  
                  <div className="flex items-center justify-between border-t border-white/5 pt-4">
                      <span className={`px-3 py-1 rounded-lg text-[10px] font-black uppercase tracking-widest border ${getCategoryColor(ach.category)}`}>
                          {ach.category}
                      </span>
                      <span className="text-yellow-400 font-bold text-sm flex items-center gap-1">
                          <Star size={14} fill="currentColor" /> {ach.points} XP
                      </span>
                  </div>
              </div>
          ))}
          
          {achievements.length === 0 && (
              <div className="col-span-full py-20 text-center opacity-40 border-2 border-dashed border-white/10 rounded-[40px]">
                  <Trophy size={64} className="mx-auto mb-4" />
                  <p className="text-xl font-bold">لا توجد أوسمة مضافة بعد</p>
              </div>
          )}
      </div>

      {/* Editor Modal */}
      {editingItem && (
          <div className="fixed inset-0 z-50 bg-black/90 backdrop-blur-md flex items-center justify-center p-4">
              <div className="bg-[#0a1118] border border-white/10 w-full max-w-lg rounded-[40px] p-8 shadow-2xl relative">
                  <button onClick={() => setEditingItem(null)} className="absolute top-6 left-6 text-gray-500 hover:text-white"><X/></button>
                  <h3 className="text-2xl font-black text-white mb-8">{editingItem.id ? 'تعديل الوسام' : 'وسام جديد'}</h3>
                  
                  <div className="space-y-4">
                      <div className="flex gap-4">
                          <div className="w-1/4">
                              <label className="text-xs text-gray-500 block mb-2">الأيقونة (Emoji)</label>
                              <input type="text" value={editingItem.icon} onChange={e => setEditingItem({...editingItem, icon: e.target.value})} className="w-full bg-black/40 border border-white/10 rounded-xl p-3 text-center text-2xl" placeholder="🏆" />
                          </div>
                          <div className="flex-1">
                              <label className="text-xs text-gray-500 block mb-2">عنوان الوسام</label>
                              <input type="text" value={editingItem.title} onChange={e => setEditingItem({...editingItem, title: e.target.value})} className="w-full bg-black/40 border border-white/10 rounded-xl p-3 text-white" placeholder="مثال: عبقري الفيزياء" />
                          </div>
                      </div>
                      
                      <div>
                          <label className="text-xs text-gray-500 block mb-2">الوصف</label>
                          <textarea value={editingItem.description} onChange={e => setEditingItem({...editingItem, description: e.target.value})} className="w-full h-24 bg-black/40 border border-white/10 rounded-xl p-3 text-white text-sm" placeholder="وصف سبب الحصول على الوسام..." />
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                          <div>
                              <label className="text-xs text-gray-500 block mb-2">النقاط (XP)</label>
                              <input type="number" value={editingItem.points} onChange={e => setEditingItem({...editingItem, points: Number(e.target.value)})} className="w-full bg-black/40 border border-white/10 rounded-xl p-3 text-white font-bold" />
                          </div>
                          <div>
                              <label className="text-xs text-gray-500 block mb-2">التصنيف</label>
                              <select value={editingItem.category} onChange={e => setEditingItem({...editingItem, category: e.target.value as any})} className="w-full bg-black/40 border border-white/10 rounded-xl p-3 text-white text-sm">
                                  <option value="academic">أكاديمي</option>
                                  <option value="participation">مشاركة</option>
                                  <option value="streak">تتابع (Streak)</option>
                                  <option value="special">خاص</option>
                              </select>
                          </div>
                      </div>
                      
                      <div className="flex items-center gap-3 p-4 bg-white/5 rounded-xl">
                          <input type="checkbox" checked={editingItem.isHidden} onChange={e => setEditingItem({...editingItem, isHidden: e.target.checked})} className="w-5 h-5 accent-green-500" />
                          <label className="text-sm text-gray-300">إخفاء الوسام حتى يتم الحصول عليه (Secret)</label>
                      </div>

                      <button onClick={handleSave} disabled={isSaving} className="w-full bg-green-500 text-black py-4 rounded-xl font-black mt-4 hover:scale-[1.02] transition-all">
                          {isSaving ? 'جاري الحفظ...' : 'حفظ الوسام'}
                      </button>
                  </div>
              </div>
          </div>
      )}

      {/* Manual Assignment Modal */}
      {showAssignModal && (
          <div className="fixed inset-0 z-50 bg-black/90 backdrop-blur-md flex items-center justify-center p-4">
              <div className="bg-[#0a1118] border border-white/10 w-full max-w-lg rounded-[40px] p-8 shadow-2xl relative">
                  <button onClick={() => { setShowAssignModal(false); setFoundStudent(null); setSearchQuery(''); }} className="absolute top-6 left-6 text-gray-500 hover:text-white"><X/></button>
                  <h3 className="text-2xl font-black text-white mb-2">منح وسام لطالب</h3>
                  <p className="text-gray-500 text-xs mb-8">ابحث عن الطالب ثم اختر الوسام المراد منحه.</p>

                  <form onSubmit={handleSearchStudent} className="flex gap-2 mb-6">
                      <input 
                          type="email" 
                          placeholder="بريد الطالب..." 
                          value={searchQuery} 
                          onChange={e => setSearchQuery(e.target.value)} 
                          className="flex-1 bg-black/40 border border-white/10 rounded-xl p-3 text-white text-sm"
                      />
                      <button type="submit" className="bg-white/10 px-4 rounded-xl hover:bg-white/20"><Search size={20}/></button>
                  </form>

                  {foundStudent && (
                      <div className="mb-6 p-4 bg-green-500/10 border border-green-500/20 rounded-xl flex items-center gap-4">
                          <div className="w-10 h-10 rounded-full bg-green-500/20 flex items-center justify-center text-green-400 font-bold">{foundStudent.name.charAt(0)}</div>
                          <div>
                              <p className="text-white font-bold text-sm">{foundStudent.name}</p>
                              <p className="text-gray-400 text-xs">{foundStudent.email}</p>
                          </div>
                          <CheckCircle2 className="text-green-500 mr-auto" />
                      </div>
                  )}

                  <div className="space-y-2 mb-8 max-h-48 overflow-y-auto no-scrollbar pr-2">
                      <label className="text-xs text-gray-500 block mb-2">اختر الوسام</label>
                      {achievements.map(ach => (
                          <div 
                              key={ach.id} 
                              onClick={() => setSelectedAchievementId(ach.id)}
                              className={`p-3 rounded-xl border flex items-center gap-3 cursor-pointer transition-all ${selectedAchievementId === ach.id ? 'bg-green-500/10 border-green-500' : 'bg-white/5 border-white/5 hover:border-white/20'}`}
                          >
                              <span className="text-2xl">{ach.icon}</span>
                              <div className="flex-1">
                                  <p className="text-white text-sm font-bold">{ach.title}</p>
                                  <p className="text-gray-500 text-[10px]">{ach.points} XP</p>
                              </div>
                              {selectedAchievementId === ach.id && <div className="w-3 h-3 bg-green-500 rounded-full"></div>}
                          </div>
                      ))}
                  </div>

                  <button 
                      onClick={handleAssign} 
                      disabled={!foundStudent || !selectedAchievementId || isSaving}
                      className="w-full bg-white text-black py-4 rounded-xl font-black hover:bg-gray-200 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                      {isSaving ? 'جاري التنفيذ...' : 'تأكيد المنح'}
                  </button>
              </div>
          </div>
      )}
    </div>
  );
};

export default AdminRewards;
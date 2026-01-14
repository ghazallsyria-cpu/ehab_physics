
import React, { useState, useEffect, useRef } from 'react';
import { TeacherProfile, TeacherMessage, TeacherPermission } from '../types';
import { dbService } from '../services/db';

const AdminTeacherManager: React.FC = () => {
  const [teachers, setTeachers] = useState<TeacherProfile[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [viewingMessagesFor, setViewingMessagesFor] = useState<TeacherProfile | null>(null);
  const [managingTeacher, setManagingTeacher] = useState<TeacherProfile | null>(null);
  const [messages, setMessages] = useState<TeacherMessage[]>([]);
  
  // Form State
  const [newTeacher, setNewTeacher] = useState<Partial<TeacherProfile>>({
    name: '',
    specialization: 'فيزياء الثانوية',
    yearsExperience: 5,
    bio: '',
    avatar: '👨‍🏫',
    grades: [],
    photoUrl: undefined,
    status: 'active',
    jobTitle: '',
    permissions: ['create_content', 'reply_messages']
  });
  
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    loadTeachers();
  }, []);

  useEffect(() => {
    if (viewingMessagesFor) {
        loadMessages(viewingMessagesFor.id);
    }
  }, [viewingMessagesFor]);

  const loadTeachers = async () => {
    setIsLoading(true);
    const data = await dbService.getTeachers();
    setTeachers(data);
    setIsLoading(false);
  };

  const loadMessages = async (teacherId: string) => {
    const msgs = await dbService.getAllTeacherMessages(teacherId);
    setMessages(msgs);
  };

  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setNewTeacher(prev => ({ ...prev, photoUrl: reader.result as string }));
      };
      reader.readAsDataURL(file);
    }
  };

  const toggleGrade = (grade: string) => {
    const current = newTeacher.grades || [];
    if (current.includes(grade)) {
      setNewTeacher({ ...newTeacher, grades: current.filter(g => g !== grade) });
    } else {
      setNewTeacher({ ...newTeacher, grades: [...current, grade] });
    }
  };

  const handleAddTeacher = async () => {
    if (!newTeacher.name || !newTeacher.bio || (newTeacher.grades?.length === 0)) {
        alert('الرجاء تعبئة البيانات الأساسية وتحديد صف واحد على الأقل.');
        return;
    }

    const teacher: TeacherProfile = {
      id: `t_${Date.now()}`,
      name: newTeacher.name!,
      specialization: newTeacher.specialization || 'فيزياء',
      bio: newTeacher.bio!,
      yearsExperience: newTeacher.yearsExperience || 0,
      avatar: newTeacher.avatar || '👨‍🏫',
      grades: newTeacher.grades || [],
      photoUrl: newTeacher.photoUrl,
      status: 'active',
      jobTitle: newTeacher.jobTitle || 'معلم',
      permissions: newTeacher.permissions || ['create_content', 'reply_messages']
    };

    await dbService.saveTeacher(teacher);
    setNewTeacher({ name: '', specialization: 'فيزياء الثانوية', yearsExperience: 5, bio: '', avatar: '👨‍🏫', grades: [], photoUrl: undefined, status: 'active', jobTitle: '', permissions: ['create_content', 'reply_messages'] });
    if(fileInputRef.current) fileInputRef.current.value = '';
    loadTeachers();
  };

  const handleDeleteTeacher = async (id: string) => {
    if (confirm('هل أنت متأكد من حذف هذا المعلم؟ سيتم فقدان بيانات التقييم المرتبطة به.')) {
        await dbService.deleteTeacher(id);
        loadTeachers();
    }
  };

  const handleUpdateTeacherSettings = async () => {
    if (!managingTeacher) return;
    await dbService.saveTeacher(managingTeacher);
    setManagingTeacher(null);
    loadTeachers();
  };

  const togglePermission = (perm: TeacherPermission) => {
    if (!managingTeacher) return;
    const current = managingTeacher.permissions || [];
    if (current.includes(perm)) {
        setManagingTeacher({...managingTeacher, permissions: current.filter(p => p !== perm)});
    } else {
        setManagingTeacher({...managingTeacher, permissions: [...current, perm]});
    }
  };

  const PERMISSIONS_LIST: {key: TeacherPermission, label: string}[] = [
    { key: 'create_content', label: 'إضافة محتوى (دروس/اختبارات)' },
    { key: 'reply_messages', label: 'الرد على رسائل الطلاب' },
    { key: 'view_analytics', label: 'الاطلاع على التحليلات' },
    { key: 'manage_exams', label: 'إدارة الامتحانات' }
  ];

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 animate-slideUp font-['Tajawal'] text-right" dir="rtl">
        {/* Form Section */}
        <div className="lg:col-span-4">
            <div className="glass-panel p-10 rounded-[50px] border-white/5 bg-white/[0.02] sticky top-24">
                <h3 className="text-2xl font-black text-white mb-8">إدارة الهيئة التدريسية</h3>
                
                <div className="space-y-6">
                    {/* Basic Info */}
                    <div className="space-y-2">
                        <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest">الاسم الكامل</label>
                        <input 
                            type="text" 
                            value={newTeacher.name}
                            onChange={e => setNewTeacher({...newTeacher, name: e.target.value})}
                            className="w-full bg-black/40 border border-white/10 rounded-2xl px-6 py-4 text-white outline-none focus:border-[#fbbf24]"
                            placeholder="مثال: أ. محمد العلي"
                        />
                    </div>

                    {/* Image Upload */}
                    <div className="space-y-2">
                        <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest">الصورة الشخصية</label>
                        <div className="flex items-center gap-4">
                            <div className="w-16 h-16 rounded-2xl bg-black/40 border border-white/10 flex items-center justify-center overflow-hidden">
                                {newTeacher.photoUrl ? (
                                    <img src={newTeacher.photoUrl} alt="Preview" className="w-full h-full object-cover" />
                                ) : (
                                    <span className="text-2xl">{newTeacher.avatar}</span>
                                )}
                            </div>
                            <input 
                                type="file" 
                                ref={fileInputRef}
                                accept="image/*"
                                onChange={handlePhotoUpload}
                                className="hidden"
                            />
                            <button 
                                onClick={() => fileInputRef.current?.click()}
                                className="px-4 py-2 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl text-[10px] text-gray-300 font-bold"
                            >
                                رفع صورة 📸
                            </button>
                        </div>
                    </div>

                    {/* Grades Selection */}
                    <div className="space-y-2">
                        <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest">الصفوف الدراسية</label>
                        <div className="flex flex-wrap gap-2">
                            {['10', '11', '12', 'uni'].map(g => (
                                <button
                                    key={g}
                                    onClick={() => toggleGrade(g)}
                                    className={`px-4 py-2 rounded-xl text-xs font-bold border transition-all ${
                                        newTeacher.grades?.includes(g) 
                                        ? 'bg-[#00d2ff] text-black border-[#00d2ff]' 
                                        : 'bg-black/40 text-gray-500 border-white/10 hover:border-white/30'
                                    }`}
                                >
                                    {g === 'uni' ? 'جامعة' : `صف ${g}`}
                                </button>
                            ))}
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest">التخصص</label>
                            <input 
                                type="text" 
                                value={newTeacher.specialization}
                                onChange={e => setNewTeacher({...newTeacher, specialization: e.target.value})}
                                className="w-full bg-black/40 border border-white/10 rounded-2xl px-4 py-4 text-white outline-none focus:border-[#fbbf24]"
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest">الخبرة (سنة)</label>
                            <input 
                                type="number" 
                                value={newTeacher.yearsExperience}
                                onChange={e => setNewTeacher({...newTeacher, yearsExperience: parseInt(e.target.value)})}
                                className="w-full bg-black/40 border border-white/10 rounded-2xl px-4 py-4 text-white outline-none focus:border-[#fbbf24]"
                            />
                        </div>
                    </div>

                    <div className="space-y-2">
                        <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest">اللقب الوظيفي</label>
                        <input 
                            type="text" 
                            value={newTeacher.jobTitle}
                            onChange={e => setNewTeacher({...newTeacher, jobTitle: e.target.value})}
                            placeholder="مثال: رئيس القسم"
                            className="w-full bg-black/40 border border-white/10 rounded-2xl px-4 py-4 text-white outline-none focus:border-[#fbbf24]"
                        />
                    </div>

                    <div className="space-y-2">
                        <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest">نبذة تعريفية</label>
                        <textarea 
                            value={newTeacher.bio}
                            onChange={e => setNewTeacher({...newTeacher, bio: e.target.value})}
                            className="w-full h-24 bg-black/40 border border-white/10 rounded-2xl px-6 py-4 text-white outline-none focus:border-[#fbbf24] text-sm leading-relaxed"
                            placeholder="نبذة عن المؤهلات..."
                        />
                    </div>

                    <button 
                        onClick={handleAddTeacher}
                        className="w-full py-4 bg-[#00d2ff] text-black rounded-2xl font-black text-xs uppercase tracking-widest hover:scale-[1.02] transition-all shadow-xl"
                    >
                        حفظ بيانات المعلم
                    </button>
                </div>
            </div>
        </div>

        {/* List Section */}
        <div className="lg:col-span-8">
            <div className="glass-panel p-10 rounded-[50px] border-white/5 bg-black/20 min-h-[600px]">
                <h3 className="text-2xl font-black text-white mb-8 flex justify-between items-center">
                    <span>قائمة الهيئة التدريسية</span>
                    <span className="text-sm text-[#00d2ff] bg-[#00d2ff]/10 px-4 py-1 rounded-full">{teachers.length} معلمين</span>
                </h3>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {teachers.map(t => (
                        <div key={t.id} className={`p-6 border rounded-[35px] group hover:border-[#fbbf24]/30 transition-all relative overflow-hidden ${t.status === 'suspended' ? 'bg-red-900/10 border-red-500/20 grayscale' : 'bg-white/5 border-white/5'}`}>
                            <div className="flex items-start gap-4">
                                <div className="w-16 h-16 rounded-2xl bg-black/40 flex items-center justify-center overflow-hidden shadow-inner border border-white/5 shrink-0 relative">
                                    {t.photoUrl ? (
                                        <img src={t.photoUrl} alt={t.name} className="w-full h-full object-cover" />
                                    ) : (
                                        <span className="text-3xl">{t.avatar}</span>
                                    )}
                                    <div className={`absolute bottom-0 right-0 w-4 h-4 rounded-full border-2 border-black ${t.status === 'active' ? 'bg-green-500' : 'bg-red-500'}`}></div>
                                </div>
                                <div>
                                    <h4 className="text-lg font-black text-white group-hover:text-[#fbbf24] transition-colors">{t.name}</h4>
                                    <span className="text-[9px] text-[#fbbf24] font-bold block mb-1">{t.jobTitle || 'معلم'}</span>
                                    <div className="flex flex-wrap gap-2 mt-1 mb-2">
                                        {t.grades?.map(g => (
                                            <span key={g} className="text-[8px] bg-[#00d2ff]/10 text-[#00d2ff] px-2 py-0.5 rounded font-black uppercase">
                                                {g === 'uni' ? 'جامعة' : `صف ${g}`}
                                            </span>
                                        ))}
                                    </div>
                                </div>
                            </div>
                            <p className="mt-4 text-xs text-gray-400 leading-relaxed border-t border-white/5 pt-4 line-clamp-2">
                                {t.bio}
                            </p>
                            
                            <div className="flex gap-2 mt-4">
                                <button 
                                    onClick={() => setViewingMessagesFor(t)}
                                    className="flex-1 py-2 bg-white/5 text-gray-300 rounded-xl text-[10px] font-bold hover:bg-[#00d2ff] hover:text-black transition-all flex items-center justify-center gap-2"
                                >
                                    <span>✉️</span> المراسلات
                                </button>
                                <button 
                                    onClick={() => setManagingTeacher(t)}
                                    className="flex-1 py-2 bg-white/5 text-gray-300 rounded-xl text-[10px] font-bold hover:bg-[#fbbf24] hover:text-black transition-all flex items-center justify-center gap-2"
                                >
                                    <span>⚙️</span> إدارة
                                </button>
                                <button 
                                    onClick={() => handleDeleteTeacher(t.id)}
                                    className="px-4 py-2 bg-red-500/10 text-red-500 rounded-xl hover:bg-red-500 hover:text-white transition-colors"
                                    title="حذف المعلم"
                                >
                                    🗑️
                                </button>
                            </div>
                        </div>
                    ))}
                    {teachers.length === 0 && !isLoading && (
                        <div className="col-span-full py-20 text-center opacity-30">
                            <span className="text-6xl mb-4 block">👨‍🏫</span>
                            <p className="font-bold">لا يوجد معلمين مضافين حالياً</p>
                        </div>
                    )}
                </div>
            </div>
        </div>

        {/* Management Modal */}
        {managingTeacher && (
            <div className="fixed inset-0 z-[250] bg-black/90 backdrop-blur-md flex items-center justify-center p-6">
                <div className="glass-panel w-full max-w-lg p-10 rounded-[50px] border border-white/10 relative shadow-3xl animate-slideUp">
                    <button onClick={() => setManagingTeacher(null)} className="absolute top-8 left-8 text-gray-500 hover:text-white text-xl">✕</button>
                    
                    <div className="flex items-center gap-4 mb-8">
                        <div className="w-16 h-16 rounded-2xl bg-black/40 flex items-center justify-center text-3xl overflow-hidden">
                             {managingTeacher.photoUrl ? <img src={managingTeacher.photoUrl} className="w-full h-full object-cover" /> : managingTeacher.avatar}
                        </div>
                        <div>
                            <h3 className="text-xl font-black text-white">{managingTeacher.name}</h3>
                            <p className="text-xs text-gray-500">إدارة الحساب والصلاحيات</p>
                        </div>
                    </div>

                    <div className="space-y-6">
                        {/* Status Toggle */}
                        <div className="bg-white/5 p-4 rounded-2xl border border-white/5 flex justify-between items-center">
                            <div>
                                <p className="text-sm font-bold text-white">حالة الحساب</p>
                                <p className="text-[10px] text-gray-500">{managingTeacher.status === 'active' ? 'الحساب نشط ويمكنه الدخول' : 'الحساب مجمد ومحظور من الدخول'}</p>
                            </div>
                            <button 
                                onClick={() => setManagingTeacher({...managingTeacher, status: managingTeacher.status === 'active' ? 'suspended' : 'active'})}
                                className={`px-4 py-2 rounded-xl text-xs font-black uppercase transition-all ${managingTeacher.status === 'active' ? 'bg-green-500 text-white' : 'bg-red-500 text-white'}`}
                            >
                                {managingTeacher.status === 'active' ? 'نشط' : 'مجمد'}
                            </button>
                        </div>

                        {/* Title Input */}
                        <div className="space-y-2">
                            <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest">اللقب الوظيفي (يظهر للطلاب)</label>
                            <input 
                                type="text" 
                                value={managingTeacher.jobTitle || ''}
                                onChange={(e) => setManagingTeacher({...managingTeacher, jobTitle: e.target.value})}
                                className="w-full bg-black/40 border border-white/10 rounded-2xl px-4 py-3 text-white outline-none focus:border-[#fbbf24] text-sm"
                                placeholder="مثال: معلم أول"
                            />
                        </div>

                        {/* Permissions */}
                        <div className="space-y-3">
                            <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest">الصلاحيات الممنوحة</label>
                            <div className="grid grid-cols-2 gap-3">
                                {PERMISSIONS_LIST.map(perm => (
                                    <button 
                                        key={perm.key}
                                        onClick={() => togglePermission(perm.key)}
                                        className={`p-3 rounded-2xl border text-[10px] font-bold text-right transition-all ${
                                            managingTeacher.permissions?.includes(perm.key)
                                            ? 'bg-[#00d2ff]/10 border-[#00d2ff] text-[#00d2ff]'
                                            : 'bg-black/40 border-white/5 text-gray-500'
                                        }`}
                                    >
                                        {managingTeacher.permissions?.includes(perm.key) ? '✅ ' : '⬜ '} 
                                        {perm.label}
                                    </button>
                                ))}
                            </div>
                        </div>

                        <button 
                            onClick={handleUpdateTeacherSettings}
                            className="w-full py-4 bg-[#fbbf24] text-black rounded-2xl font-black text-xs uppercase tracking-widest hover:scale-[1.02] transition-all shadow-xl mt-4"
                        >
                            حفظ التغييرات
                        </button>
                    </div>
                </div>
            </div>
        )}

        {/* Messages Modal */}
        {viewingMessagesFor && (
            <div className="fixed inset-0 z-[200] bg-black/90 backdrop-blur-md flex items-center justify-center p-6">
                <div className="glass-panel w-full max-w-3xl p-10 rounded-[50px] border border-white/10 relative shadow-3xl h-[80vh] flex flex-col">
                    <button onClick={() => setViewingMessagesFor(null)} className="absolute top-8 left-8 text-gray-500 hover:text-white text-xl">✕</button>
                    
                    <h3 className="text-2xl font-black text-white mb-2">سجل المراسلات</h3>
                    <p className="text-sm text-[#00d2ff] font-bold mb-8">مع: {viewingMessagesFor.name}</p>
                    
                    <div className="flex-1 overflow-y-auto no-scrollbar space-y-4 pr-2">
                        {messages.length > 0 ? messages.map(msg => (
                            <div key={msg.id} className="p-6 bg-white/[0.03] border border-white/5 rounded-3xl">
                                <div className="flex justify-between items-start mb-4">
                                    <div className="flex items-center gap-3">
                                        <div className="w-8 h-8 rounded-full bg-[#fbbf24] flex items-center justify-center text-black font-black text-xs">
                                            {msg.studentName.charAt(0)}
                                        </div>
                                        <div>
                                            <p className="text-sm font-bold text-white">{msg.studentName}</p>
                                            <p className="text-[9px] text-gray-500 font-mono">{new Date(msg.timestamp).toLocaleString('ar-SY')}</p>
                                        </div>
                                    </div>
                                    {msg.isRedacted && (
                                        <span className="text-[8px] bg-red-500/20 text-red-400 px-2 py-1 rounded font-black uppercase">تم حجب رقم الهاتف</span>
                                    )}
                                </div>
                                <p className="text-gray-300 text-sm leading-relaxed bg-black/40 p-4 rounded-xl border border-white/5">
                                    {msg.content}
                                </p>
                            </div>
                        )) : (
                            <div className="h-full flex flex-col items-center justify-center opacity-30">
                                <span className="text-6xl mb-4">📭</span>
                                <p className="font-bold">لا توجد رسائل مسجلة لهذا المعلم</p>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        )}
    </div>
  );
};

export default AdminTeacherManager;
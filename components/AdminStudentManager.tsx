
import React, { useState, useEffect } from 'react';
import { User, EducationalLevel } from '../types';
import { dbService } from '../services/db';
import { 
  Search, User as UserIcon, Shield, Zap, Trash2, Ban, 
  Save, RefreshCw, GraduationCap, Clock, AlertTriangle,
  Mail, Phone, School, FileText, PlusCircle, CheckCircle
} from 'lucide-react';

const AdminStudentManager: React.FC = () => {
  const [students, setStudents] = useState<User[]>([]);
  const [filteredStudents, setFilteredStudents] = useState<User[]>([]);
  const [selectedStudent, setSelectedStudent] = useState<User | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState<'PROFILE' | 'SUBSCRIPTION' | 'PROGRESS' | 'ACTIONS'>('PROFILE');
  const [message, setMessage] = useState<{text: string, type: 'success' | 'error'} | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  // Editable Fields
  const [editForm, setEditForm] = useState<Partial<User>>({});

  useEffect(() => {
    loadStudents();
  }, []);

  useEffect(() => {
    if (searchQuery.trim() === '') {
      setFilteredStudents(students);
    } else {
      const lower = searchQuery.toLowerCase();
      setFilteredStudents(students.filter(s => 
        s.name.toLowerCase().includes(lower) || 
        s.email.toLowerCase().includes(lower) ||
        (s.phone && s.phone.includes(lower))
      ));
    }
  }, [searchQuery, students]);

  const loadStudents = async () => {
    setIsLoading(true);
    const data = await dbService.getAllStudents();
    setStudents(data);
    setFilteredStudents(data);
    setIsLoading(false);
  };

  const handleSelectStudent = (student: User) => {
    setSelectedStudent(student);
    setEditForm({ ...student });
    setActiveTab('PROFILE');
    setMessage(null);
  };

  // --- New Feature: Manual Student Addition ---
  const handleCreateNewMode = () => {
    setSearchQuery(''); // Reset search to show clean slate
    const newStudentTemplate: User = {
        uid: 'new_entry', // Temporary ID
        name: '',
        email: '',
        role: 'student',
        grade: '12',
        stage: 'secondary',
        educationalLevel: EducationalLevel.SECONDARY,
        status: 'active',
        subscription: 'free',
        createdAt: new Date().toISOString(),
        points: 0,
        completedLessonIds: [],
        progress: {
            completedLessonIds: [],
            quizScores: {},
            totalStudyHours: 0,
            currentFatigue: 0,
            strengths: [],
            weaknesses: []
        }
    };
    setSelectedStudent(newStudentTemplate);
    setEditForm(newStudentTemplate);
    setActiveTab('PROFILE');
    setMessage(null);
  };

  const handleSave = async () => {
    if (!selectedStudent || !editForm) return;
    
    // Validation
    if (!editForm.name || !editForm.email) {
        setMessage({ text: 'يرجى تعبئة الاسم والبريد الإلكتروني على الأقل', type: 'error' });
        return;
    }

    setIsLoading(true);
    
    try {
        let updatedUser = { ...selectedStudent, ...editForm } as User;

        // Check if creating a new user
        if (selectedStudent.uid === 'new_entry') {
            // Generate a real UID
            updatedUser.uid = `user_${Date.now()}`;
            // Check email uniqueness (basic check against loaded list)
            const exists = students.some(s => s.email.toLowerCase() === updatedUser.email.toLowerCase());
            if (exists) {
                setMessage({ text: 'هذا البريد الإلكتروني مسجل مسبقاً', type: 'error' });
                setIsLoading(false);
                return;
            }
            setMessage({ text: 'تم إنشاء حساب الطالب بنجاح', type: 'success' });
        } else {
            setMessage({ text: 'تم تحديث بيانات الطالب بنجاح', type: 'success' });
        }
        
        await dbService.saveUser(updatedUser);
        
        await loadStudents(); // Reload list to reflect changes
        setSelectedStudent(updatedUser); // Update local state
    } catch (e) {
        console.error(e);
        setMessage({ text: 'حدث خطأ أثناء الحفظ', type: 'error' });
    }
    
    setIsLoading(false);
    setTimeout(() => setMessage(null), 3000);
  };

  const handleResetProgress = async () => {
    if (!selectedStudent || selectedStudent.uid === 'new_entry' || !window.confirm('⚠️ تحذير: هل أنت متأكد تماماً؟ \nسيتم تصفير جميع الدرجات، الساعات الدراسية، وسجل الأنشطة.\nلا يمكن التراجع عن هذا الإجراء.')) return;
    
    const resetUser = {
        ...selectedStudent,
        points: 0,
        completedLessonIds: [],
        progress: {
            completedLessonIds: [],
            quizScores: {},
            totalStudyHours: 0,
            currentFatigue: 0,
            strengths: [],
            weaknesses: []
        }
    };
    
    await dbService.saveUser(resetUser);
    setSelectedStudent(resetUser);
    setEditForm(resetUser);
    setMessage({ text: 'تم تصفير التقدم الأكاديمي', type: 'success' });
    setTimeout(() => setMessage(null), 3000);
  };

  const handleToggleBan = async () => {
    if (!selectedStudent || selectedStudent.uid === 'new_entry') return;
    const isBanning = selectedStudent.status !== 'banned';
    
    if (isBanning && !window.confirm('سيتم منع الطالب من الدخول للمنصة نهائياً. هل أنت متأكد؟')) return;

    const updatedUser = { ...selectedStudent, status: isBanning ? 'banned' : 'active' };
    await dbService.saveUser(updatedUser as User);
    setSelectedStudent(updatedUser as User);
    setEditForm(updatedUser as User);
    loadStudents();
    setMessage({ text: isBanning ? 'تم حظر الطالب' : 'تم تفعيل الحساب', type: isBanning ? 'error' : 'success' });
    setTimeout(() => setMessage(null), 3000);
  };

  // --- New Feature: Delete Student (Full Control) ---
  const handleDelete = async () => {
    if (!selectedStudent || selectedStudent.uid === 'new_entry') return;
    
    // Strict Safety Check
    const confirmDelete = window.confirm(
      `⚠️ تحذير خطير: أنت على وشك حذف الطالب "${selectedStudent.name}" نهائياً.\n\nسيتم فقدان كافة السجلات والدرجات والتقدم الدراسي.\n\nهل أنت متأكد تماماً؟`
    );
    
    if (!confirmDelete) return;

    setIsLoading(true);
    try {
        await dbService.deleteUser(selectedStudent.uid);
        setMessage({ text: 'تم حذف الطالب نهائياً', type: 'success' });
        
        // Refresh list
        const updatedStudents = students.filter(s => s.uid !== selectedStudent.uid);
        setStudents(updatedStudents);
        setFilteredStudents(updatedStudents);
        setSelectedStudent(null);
        setEditForm({});
    } catch (e) {
        console.error(e);
        setMessage({ text: 'حدث خطأ أثناء الحذف', type: 'error' });
    }
    setIsLoading(false);
    setTimeout(() => setMessage(null), 3000);
  };

  const getStatusColor = (status: string) => {
    switch(status) {
        case 'active': return 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30';
        case 'banned': return 'bg-red-500/20 text-red-400 border-red-500/30';
        case 'suspended': return 'bg-orange-500/20 text-orange-400 border-orange-500/30';
        default: return 'bg-gray-500/20 text-gray-400 border-gray-500/30';
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 font-['Tajawal'] text-right animate-fadeIn" dir="rtl">
        {/* List Section */}
        <div className="lg:col-span-4 flex flex-col gap-6 h-[calc(100vh-140px)] sticky top-6">
            <div className="glass-panel p-6 rounded-[30px] border-white/5 bg-[#0a1118]/80 flex flex-col h-full overflow-hidden">
                {/* Actions Header */}
                <div className="space-y-4 mb-6">
                    <button 
                        onClick={handleCreateNewMode}
                        className="w-full py-4 bg-[#fbbf24] text-black rounded-2xl font-black text-xs uppercase tracking-widest shadow-lg hover:scale-105 active:scale-95 transition-all flex items-center justify-center gap-2"
                    >
                        <PlusCircle size={16} /> إضافة طالب جديد
                    </button>
                    
                    <div className="relative">
                        <Search className="absolute top-1/2 right-4 -translate-y-1/2 w-5 h-5 text-gray-500" />
                        <input 
                            type="text" 
                            placeholder="بحث بالاسم، البريد، أو الهاتف..." 
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full bg-white/5 border border-white/10 rounded-2xl pr-12 pl-4 py-4 text-white outline-none focus:border-[#fbbf24] transition-all text-sm font-bold shadow-inner"
                        />
                    </div>
                </div>
                
                <div className="flex-1 overflow-y-auto no-scrollbar space-y-3 pr-1">
                    {filteredStudents.map(student => (
                        <div 
                            key={student.uid} 
                            onClick={() => handleSelectStudent(student)}
                            className={`p-4 rounded-2xl border cursor-pointer transition-all flex items-center gap-4 group ${selectedStudent?.uid === student.uid ? 'bg-[#fbbf24] border-[#fbbf24] text-black shadow-lg shadow-[#fbbf24]/20' : 'bg-white/[0.02] border-white/5 text-gray-300 hover:bg-white/5 hover:border-white/10'}`}
                        >
                            <div className="relative">
                                <div className={`w-12 h-12 rounded-xl flex items-center justify-center font-black text-lg overflow-hidden ${selectedStudent?.uid === student.uid ? 'bg-black/20' : 'bg-black/40'}`}>
                                    <img src={`https://api.dicebear.com/7.x/bottts/svg?seed=${student.uid}`} alt="avatar" className="w-full h-full p-1" />
                                </div>
                                <div className={`absolute -bottom-1 -right-1 w-3 h-3 rounded-full border-2 border-[#0a1118] ${student.status === 'active' ? 'bg-emerald-500' : 'bg-red-500'}`}></div>
                            </div>
                            
                            <div className="flex-1 min-w-0">
                                <h4 className="font-bold truncate text-sm">{student.name}</h4>
                                <p className={`text-[10px] font-mono truncate ${selectedStudent?.uid === student.uid ? 'text-black/60' : 'text-gray-500'}`}>{student.email}</p>
                            </div>
                            
                            <div className="flex flex-col items-end gap-1">
                                {student.subscription !== 'free' && <Zap className={`w-4 h-4 ${selectedStudent?.uid === student.uid ? 'text-black' : 'text-[#fbbf24]'}`} fill="currentColor" />}
                                <span className={`text-[9px] font-black ${selectedStudent?.uid === student.uid ? 'text-black/60' : 'text-gray-600'}`}>
                                    {student.grade === 'uni' ? 'UNI' : `GR${student.grade}`}
                                </span>
                            </div>
                        </div>
                    ))}
                    {filteredStudents.length === 0 && (
                        <div className="text-center py-20 opacity-40">
                            <UserIcon className="w-12 h-12 mx-auto mb-2 text-gray-500" />
                            <p className="text-xs font-bold">لا توجد نتائج مطابقة</p>
                        </div>
                    )}
                </div>
                
                <div className="mt-4 pt-4 border-t border-white/5 flex justify-between text-[10px] text-gray-500 font-bold uppercase tracking-widest">
                    <span>العدد الكلي: {students.length}</span>
                    <span>نشط: {students.filter(s => s.status === 'active').length}</span>
                </div>
            </div>
        </div>

        {/* Detail/Edit Section */}
        <div className="lg:col-span-8">
            {selectedStudent ? (
                <div className="glass-panel p-8 md:p-12 rounded-[50px] border-white/10 bg-[#0a1118]/60 relative min-h-[600px] animate-slideUp">
                    {/* Header */}
                    <div className="flex flex-col md:flex-row justify-between items-start gap-6 mb-10 pb-8 border-b border-white/5">
                        <div className="flex items-center gap-6">
                            <div className="w-24 h-24 rounded-[30px] border-2 border-white/10 bg-black/40 p-2 shadow-2xl relative">
                                {selectedStudent.uid === 'new_entry' ? (
                                    <div className="w-full h-full flex items-center justify-center text-4xl">🆕</div>
                                ) : (
                                    <>
                                        <img src={`https://api.dicebear.com/7.x/bottts/svg?seed=${selectedStudent.uid}`} alt="avatar" className="w-full h-full" />
                                        <div className="absolute -bottom-3 -right-3 bg-[#fbbf24] text-black text-[10px] font-black px-3 py-1 rounded-full border-4 border-[#0a1118]">
                                            Level {Math.floor((selectedStudent.points || 0) / 1000) + 1}
                                        </div>
                                    </>
                                )}
                            </div>
                            <div>
                                <h2 className="text-3xl font-black text-white mb-2">{selectedStudent.uid === 'new_entry' ? 'تسجيل طالب جديد' : selectedStudent.name}</h2>
                                <div className="flex flex-wrap gap-2">
                                    <span className={`px-3 py-1 rounded-lg text-[9px] font-black uppercase tracking-widest border ${getStatusColor(selectedStudent.status)}`}>
                                        {selectedStudent.status}
                                    </span>
                                    {selectedStudent.subscription !== 'free' && (
                                        <span className="px-3 py-1 rounded-lg text-[9px] font-black uppercase tracking-widest bg-purple-500/20 text-purple-400 border border-purple-500/30 flex items-center gap-1">
                                            <Zap size={10} /> {selectedStudent.subscription}
                                        </span>
                                    )}
                                </div>
                                <p className="text-[10px] text-gray-500 font-mono mt-3 opacity-60">
                                    UID: {selectedStudent.uid === 'new_entry' ? 'سيتم التوليد تلقائياً' : selectedStudent.uid}
                                </p>
                            </div>
                        </div>
                        
                        {selectedStudent.uid !== 'new_entry' && (
                            <div className="flex gap-3">
                                <div className="text-center px-6 py-3 bg-white/5 rounded-2xl border border-white/5">
                                    <p className="text-[9px] text-gray-500 uppercase font-black mb-1">النقاط</p>
                                    <p className="text-xl font-black text-[#fbbf24] tabular-nums">{selectedStudent.points || 0}</p>
                                </div>
                                <div className="text-center px-6 py-3 bg-white/5 rounded-2xl border border-white/5">
                                    <p className="text-[9px] text-gray-500 uppercase font-black mb-1">الدروس</p>
                                    <p className="text-xl font-black text-[#00d2ff] tabular-nums">{selectedStudent.completedLessonIds?.length || 0}</p>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Tabs */}
                    <div className="flex gap-2 mb-8 overflow-x-auto no-scrollbar p-1">
                        {[
                            {id: 'PROFILE', label: 'الملف الشخصي', icon: UserIcon},
                            {id: 'SUBSCRIPTION', label: 'الاشتراك', icon: Zap},
                            {id: 'PROGRESS', label: 'DNA الأكاديمي', icon: GraduationCap, disabled: selectedStudent.uid === 'new_entry'},
                            {id: 'ACTIONS', label: 'منطقة الخطر', icon: AlertTriangle, disabled: selectedStudent.uid === 'new_entry'}
                        ].map(tab => (
                            <button 
                                key={tab.id}
                                onClick={() => !tab.disabled && setActiveTab(tab.id as any)}
                                disabled={tab.disabled}
                                className={`flex items-center gap-2 px-6 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest whitespace-nowrap transition-all ${
                                    tab.disabled ? 'opacity-30 cursor-not-allowed bg-transparent text-gray-600' :
                                    activeTab === tab.id ? 'bg-[#fbbf24] text-black shadow-lg shadow-[#fbbf24]/20' : 'bg-white/5 text-gray-400 hover:text-white hover:bg-white/10'
                                }`}
                            >
                                <tab.icon size={14} />
                                {tab.label}
                            </button>
                        ))}
                    </div>

                    {/* Tab Content */}
                    <div className="space-y-6 min-h-[300px]">
                        {activeTab === 'PROFILE' && (
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 animate-slideUp">
                                <div className="space-y-2">
                                    <label className="flex items-center gap-2 text-[10px] font-black text-gray-500 uppercase tracking-widest">
                                        <UserIcon size={12}/> الاسم الكامل
                                    </label>
                                    <input type="text" value={editForm.name || ''} onChange={e => setEditForm({...editForm, name: e.target.value})} className="w-full bg-black/40 border border-white/10 rounded-2xl px-5 py-4 text-white outline-none focus:border-[#fbbf24] transition-all font-medium" placeholder="اسم الطالب" />
                                </div>
                                <div className="space-y-2">
                                    <label className="flex items-center gap-2 text-[10px] font-black text-gray-500 uppercase tracking-widest">
                                        <Mail size={12}/> البريد الإلكتروني
                                    </label>
                                    <input type="email" value={editForm.email || ''} onChange={e => setEditForm({...editForm, email: e.target.value})} className="w-full bg-black/40 border border-white/10 rounded-2xl px-5 py-4 text-white outline-none focus:border-[#fbbf24] transition-all font-medium font-mono text-sm" placeholder="student@example.com" />
                                </div>
                                <div className="space-y-2">
                                    <label className="flex items-center gap-2 text-[10px] font-black text-gray-500 uppercase tracking-widest">
                                        <Phone size={12}/> رقم الهاتف
                                    </label>
                                    <input type="text" value={editForm.phone || ''} onChange={e => setEditForm({...editForm, phone: e.target.value})} className="w-full bg-black/40 border border-white/10 rounded-2xl px-5 py-4 text-white outline-none focus:border-[#fbbf24] transition-all font-medium font-mono text-sm" placeholder="+963..." />
                                </div>
                                <div className="space-y-2">
                                    <label className="flex items-center gap-2 text-[10px] font-black text-gray-500 uppercase tracking-widest">
                                        <School size={12}/> المدرسة
                                    </label>
                                    <input type="text" value={editForm.school || ''} onChange={e => setEditForm({...editForm, school: e.target.value})} className="w-full bg-black/40 border border-white/10 rounded-2xl px-5 py-4 text-white outline-none focus:border-[#fbbf24] transition-all font-medium" placeholder="اسم المدرسة..." />
                                </div>
                                <div className="space-y-2">
                                    <label className="flex items-center gap-2 text-[10px] font-black text-gray-500 uppercase tracking-widest">
                                        <GraduationCap size={12}/> الصف الدراسي
                                    </label>
                                    <div className="relative">
                                        <select value={editForm.grade || '12'} onChange={e => setEditForm({...editForm, grade: e.target.value})} className="w-full bg-black/40 border border-white/10 rounded-2xl px-5 py-4 text-white outline-none focus:border-[#fbbf24] transition-all font-medium appearance-none">
                                            <option value="10">الصف 10</option>
                                            <option value="11">الصف 11</option>
                                            <option value="12">الصف 12</option>
                                            <option value="uni">جامعة (Foundation)</option>
                                        </select>
                                        <div className="absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none text-gray-500">▼</div>
                                    </div>
                                </div>
                            </div>
                        )}

                        {activeTab === 'SUBSCRIPTION' && (
                            <div className="space-y-6 animate-slideUp">
                                <div className="p-8 bg-gradient-to-br from-[#fbbf24]/10 to-transparent border border-[#fbbf24]/20 rounded-[35px] relative overflow-hidden">
                                    <div className="absolute top-0 right-0 w-32 h-32 bg-[#fbbf24]/10 rounded-full blur-[50px]"></div>
                                    <div className="relative z-10 grid grid-cols-1 md:grid-cols-2 gap-8">
                                        <div className="space-y-4">
                                            <h4 className="text-lg font-black text-[#fbbf24] flex items-center gap-2">
                                                <Zap className="fill-current" />
                                                إدارة الباقة والصلاحيات
                                            </h4>
                                            <div className="space-y-2">
                                                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">نوع الاشتراك</label>
                                                <select value={editForm.subscription || 'free'} onChange={e => setEditForm({...editForm, subscription: e.target.value as any})} className="w-full bg-black/40 border border-white/10 rounded-2xl px-4 py-3 text-white outline-none focus:border-[#fbbf24] text-sm font-bold">
                                                    <option value="free">مجاني (Free)</option>
                                                    <option value="monthly">شهري (Monthly)</option>
                                                    <option value="term">فصلي (Term)</option>
                                                    <option value="yearly">سنوي (Yearly)</option>
                                                    <option value="premium">بريميوم (Premium)</option>
                                                </select>
                                            </div>
                                            <div className="space-y-2">
                                                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">تاريخ الانتهاء</label>
                                                <input type="date" value={editForm.subscriptionExpiry ? editForm.subscriptionExpiry.split('T')[0] : ''} onChange={e => setEditForm({...editForm, subscriptionExpiry: new Date(e.target.value).toISOString()})} className="w-full bg-black/40 border border-white/10 rounded-2xl px-4 py-3 text-white outline-none focus:border-[#fbbf24] text-sm font-mono" />
                                            </div>
                                        </div>
                                        <div className="flex flex-col justify-center items-center text-center p-6 bg-black/20 rounded-3xl border border-white/5">
                                            <div className="text-4xl mb-4">🎮</div>
                                            <p className="font-bold text-white mb-2">رصيد النقاط (Gamification)</p>
                                            <div className="flex items-center justify-center gap-2 w-full">
                                                <button onClick={() => setEditForm(prev => ({...prev, points: (prev.points || 0) - 100}))} className="w-8 h-8 rounded-lg bg-white/5 hover:bg-white/10 text-white">-</button>
                                                <input type="number" value={editForm.points || 0} onChange={e => setEditForm({...editForm, points: parseInt(e.target.value)})} className="w-24 bg-transparent text-center font-black text-2xl text-[#fbbf24] outline-none" />
                                                <button onClick={() => setEditForm(prev => ({...prev, points: (prev.points || 0) + 100}))} className="w-8 h-8 rounded-lg bg-white/5 hover:bg-white/10 text-white">+</button>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}

                        {activeTab === 'PROGRESS' && (
                            <div className="space-y-6 animate-slideUp">
                                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                    <div className="p-6 bg-white/5 rounded-[30px] text-center border border-white/5 group hover:border-[#00d2ff]/30 transition-all">
                                        <Clock className="w-6 h-6 text-gray-500 mx-auto mb-3 group-hover:text-[#00d2ff] transition-colors" />
                                        <p className="text-[9px] text-gray-500 uppercase font-black tracking-widest mb-1">ساعات الدراسة</p>
                                        <p className="text-2xl font-black text-white">{selectedStudent.progress.totalStudyHours}</p>
                                    </div>
                                    <div className="p-6 bg-white/5 rounded-[30px] text-center border border-white/5 group hover:border-[#00d2ff]/30 transition-all">
                                        <FileText className="w-6 h-6 text-gray-500 mx-auto mb-3 group-hover:text-[#00d2ff] transition-colors" />
                                        <p className="text-[9px] text-gray-500 uppercase font-black tracking-widest mb-1">الدروس المكتملة</p>
                                        <p className="text-2xl font-black text-[#00d2ff]">{selectedStudent.completedLessonIds.length}</p>
                                    </div>
                                    <div className="p-6 bg-white/5 rounded-[30px] text-center border border-white/5 group hover:border-red-500/30 transition-all">
                                        <AlertTriangle className="w-6 h-6 text-gray-500 mx-auto mb-3 group-hover:text-red-500 transition-colors" />
                                        <p className="text-[9px] text-gray-500 uppercase font-black tracking-widest mb-1">نقاط الضعف</p>
                                        <p className="text-2xl font-black text-white">{selectedStudent.progress.weaknesses?.length || 0}</p>
                                    </div>
                                    <div className="p-6 bg-white/5 rounded-[30px] text-center border border-white/5 group hover:border-green-500/30 transition-all">
                                        <Shield className="w-6 h-6 text-gray-500 mx-auto mb-3 group-hover:text-green-500 transition-colors" />
                                        <p className="text-[9px] text-gray-500 uppercase font-black tracking-widest mb-1">نقاط القوة</p>
                                        <p className="text-2xl font-black text-white">{selectedStudent.progress.strengths?.length || 0}</p>
                                    </div>
                                </div>
                                
                                <div className="p-8 bg-red-500/5 border border-red-500/10 rounded-[35px] flex justify-between items-center">
                                    <div>
                                        <h4 className="text-red-400 font-bold mb-1 flex items-center gap-2"><Trash2 size={16}/> منطقة الخطر</h4>
                                        <p className="text-[10px] text-gray-400">تصفير التقدم سيحذف جميع الدرجات وسجلات الحضور والنشاط لهذا الطالب.</p>
                                    </div>
                                    <button onClick={handleResetProgress} className="px-6 py-3 bg-red-500/10 text-red-500 border border-red-500/20 rounded-2xl text-[10px] font-black uppercase hover:bg-red-500 hover:text-white transition-all shadow-lg">
                                        تصفير التقدم الدراسي
                                    </button>
                                </div>
                            </div>
                        )}

                        {activeTab === 'ACTIONS' && (
                            <div className="space-y-6 animate-slideUp">
                                <div className="space-y-4">
                                    <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest">ملاحظات إدارية (سرية)</label>
                                    <textarea 
                                        value={editForm.adminNotes || ''} 
                                        onChange={e => setEditForm({...editForm, adminNotes: e.target.value})}
                                        className="w-full h-40 bg-[#fbbf24]/5 border border-[#fbbf24]/20 rounded-2xl p-6 text-sm text-[#fbbf24] outline-none focus:border-[#fbbf24] placeholder-yellow-500/30"
                                        placeholder="اكتب ملاحظات خاصة عن سلوك الطالب أو حالته..."
                                    />
                                </div>
                                <div className="border-t border-white/10 pt-8 flex flex-col gap-4">
                                    <div className="flex flex-col md:flex-row gap-4">
                                        <button 
                                            onClick={handleToggleBan}
                                            className={`flex-1 py-4 rounded-2xl font-black text-xs uppercase tracking-widest transition-all shadow-xl flex items-center justify-center gap-3 ${selectedStudent.status === 'banned' ? 'bg-green-600 text-white hover:bg-green-500' : 'bg-orange-600/20 text-orange-500 border border-orange-500/30 hover:bg-orange-600 hover:text-white'}`}
                                        >
                                            <Ban size={16} />
                                            {selectedStudent.status === 'banned' ? 'إلغاء الحظر وتنشيط الحساب' : 'حظر الحساب مؤقتاً'}
                                        </button>
                                        
                                        <button 
                                            onClick={() => window.print()}
                                            className="flex-1 py-4 bg-white/5 border border-white/10 rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-white hover:text-black transition-all"
                                        >
                                            تصدير تقرير إداري 📄
                                        </button>
                                    </div>

                                    <button 
                                        onClick={handleDelete}
                                        className="w-full py-4 bg-red-600/10 border border-red-600/30 text-red-500 rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-red-600 hover:text-white transition-all flex items-center justify-center gap-3 shadow-lg mt-4"
                                    >
                                        <Trash2 size={16} />
                                        حذف الحساب نهائياً (Dangerous)
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>

                    <div className="absolute bottom-8 left-8 right-8 flex gap-4 border-t border-white/10 pt-6 bg-[#0a1118]/80 backdrop-blur-md rounded-b-[40px]">
                        {message && (
                            <div className={`flex-1 p-3 rounded-xl text-xs font-bold flex items-center gap-2 ${message.type === 'success' ? 'bg-green-500/10 text-green-400' : 'bg-red-500/10 text-red-400'}`}>
                                <span>{message.type === 'success' ? '✓' : '⚠️'}</span>
                                {message.text}
                            </div>
                        )}
                        <button 
                            onClick={handleSave} 
                            disabled={isLoading}
                            className="bg-[#fbbf24] text-black px-12 py-4 rounded-2xl font-black text-xs uppercase tracking-widest shadow-xl hover:scale-105 active:scale-95 transition-all flex items-center gap-3 ml-auto disabled:opacity-50"
                        >
                            {isLoading ? <RefreshCw className="animate-spin w-4 h-4" /> : (selectedStudent.uid === 'new_entry' ? <PlusCircle className="w-4 h-4" /> : <Save className="w-4 h-4" />)}
                            {selectedStudent.uid === 'new_entry' ? 'إنشاء الحساب' : 'حفظ التعديلات'}
                        </button>
                    </div>
                </div>
            ) : (
                <div className="glass-panel rounded-[50px] border-white/5 flex flex-col items-center justify-center h-[calc(100vh-140px)] opacity-30 bg-black/20 text-center p-10">
                    <div className="w-32 h-32 bg-white/5 rounded-full flex items-center justify-center mb-8 animate-pulse">
                        <UserIcon size={48} className="text-gray-500" />
                    </div>
                    <h3 className="text-3xl font-black text-white mb-2">إدارة الطلاب</h3>
                    <p className="font-medium text-gray-500 max-w-sm">اختر طالباً من القائمة لعرض ملفه الشخصي، أو قم بإضافة طالب جديد يدوياً.</p>
                </div>
            )}
        </div>
    </div>
  );
};

export default AdminStudentManager;

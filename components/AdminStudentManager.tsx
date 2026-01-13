
import React, { useState, useEffect } from 'react';
import { User } from '../types';
import { dbService } from '../services/db';

const AdminStudentManager: React.FC = () => {
  const [students, setStudents] = useState<User[]>([]);
  const [filteredStudents, setFilteredStudents] = useState<User[]>([]);
  const [selectedStudent, setSelectedStudent] = useState<User | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState<'PROFILE' | 'SUBSCRIPTION' | 'PROGRESS' | 'ACTIONS'>('PROFILE');
  const [message, setMessage] = useState('');

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
    const data = await dbService.getAllStudents();
    setStudents(data);
    setFilteredStudents(data);
  };

  const handleSelectStudent = (student: User) => {
    setSelectedStudent(student);
    setEditForm({ ...student });
    setActiveTab('PROFILE');
    setMessage('');
  };

  const handleSave = async () => {
    if (!selectedStudent || !editForm) return;
    
    // Merge updates
    const updatedUser = { ...selectedStudent, ...editForm } as User;
    
    await dbService.saveUser(updatedUser);
    
    setMessage('تم حفظ التعديلات بنجاح ✅');
    loadStudents();
    setSelectedStudent(updatedUser); // Update local state
    setTimeout(() => setMessage(''), 3000);
  };

  const handleResetProgress = async () => {
    if (!selectedStudent || !window.confirm('هل أنت متأكد من تصفير جميع بيانات تقدم الطالب؟ لا يمكن التراجع عن هذا الإجراء.')) return;
    
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
    alert('تم تصفير التقدم الدراسي.');
  };

  const handleToggleBan = async () => {
    if (!selectedStudent) return;
    const newStatus = selectedStudent.status === 'banned' ? 'active' : 'banned';
    
    if (newStatus === 'banned' && !window.confirm('سيتم منع الطالب من الدخول للمنصة نهائياً. هل أنت متأكد؟')) return;

    const updatedUser = { ...selectedStudent, status: newStatus };
    await dbService.saveUser(updatedUser as User);
    setSelectedStudent(updatedUser as User);
    setEditForm(updatedUser as User);
    loadStudents();
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 font-['Tajawal'] text-right animate-fadeIn" dir="rtl">
        {/* List Section */}
        <div className="lg:col-span-4 flex flex-col gap-6">
            <div className="glass-panel p-6 rounded-[40px] border-white/5 bg-black/20">
                <input 
                    type="text" 
                    placeholder="بحث باسم الطالب، البريد، أو الهاتف..." 
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full bg-white/5 border border-white/10 rounded-2xl px-4 py-3 text-white outline-none focus:border-[#fbbf24] transition-all text-sm mb-4"
                />
                <div className="max-h-[600px] overflow-y-auto no-scrollbar space-y-3">
                    {filteredStudents.map(student => (
                        <div 
                            key={student.uid} 
                            onClick={() => handleSelectStudent(student)}
                            className={`p-4 rounded-3xl border cursor-pointer transition-all flex items-center gap-4 ${selectedStudent?.uid === student.uid ? 'bg-[#fbbf24] border-[#fbbf24] text-black' : 'bg-white/5 border-white/5 text-gray-300 hover:bg-white/10'}`}
                        >
                            <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm ${selectedStudent?.uid === student.uid ? 'bg-black text-[#fbbf24]' : 'bg-black/40 text-white'}`}>
                                {student.name.charAt(0)}
                            </div>
                            <div className="flex-1 min-w-0">
                                <h4 className="font-bold truncate text-sm">{student.name}</h4>
                                <p className={`text-[10px] truncate ${selectedStudent?.uid === student.uid ? 'text-black/70' : 'text-gray-500'}`}>{student.email}</p>
                            </div>
                            {student.status === 'banned' && <span className="text-xl">🚫</span>}
                            {student.subscription !== 'free' && <span className="text-xl">💎</span>}
                        </div>
                    ))}
                </div>
            </div>
        </div>

        {/* Detail/Edit Section */}
        <div className="lg:col-span-8">
            {selectedStudent ? (
                <div className="glass-panel p-10 rounded-[50px] border-white/10 bg-white/[0.02] relative min-h-[600px]">
                    <div className="flex justify-between items-start mb-8 border-b border-white/5 pb-6">
                        <div>
                            <h2 className="text-3xl font-black text-white">{selectedStudent.name}</h2>
                            <p className="text-sm text-gray-500 font-mono mt-1">{selectedStudent.uid}</p>
                        </div>
                        <div className="flex gap-2">
                            <span className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest ${selectedStudent.status === 'active' ? 'bg-green-500/20 text-green-500' : 'bg-red-500/20 text-red-500'}`}>
                                {selectedStudent.status === 'active' ? 'نشط' : selectedStudent.status === 'banned' ? 'محظور' : 'مجمد'}
                            </span>
                            {selectedStudent.subscription !== 'free' && (
                                <span className="px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest bg-[#fbbf24]/20 text-[#fbbf24]">
                                    {selectedStudent.subscription}
                                </span>
                            )}
                        </div>
                    </div>

                    {/* Tabs */}
                    <div className="flex gap-2 mb-8 overflow-x-auto no-scrollbar">
                        {[
                            {id: 'PROFILE', label: 'البيانات الشخصية'},
                            {id: 'SUBSCRIPTION', label: 'الاشتراك والمالية'},
                            {id: 'PROGRESS', label: 'التقدم الأكاديمي'},
                            {id: 'ACTIONS', label: 'إجراءات الحساب'}
                        ].map(tab => (
                            <button 
                                key={tab.id}
                                onClick={() => setActiveTab(tab.id as any)}
                                className={`px-6 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest whitespace-nowrap transition-all ${activeTab === tab.id ? 'bg-[#00d2ff] text-black' : 'bg-white/5 text-gray-400 hover:text-white'}`}
                            >
                                {tab.label}
                            </button>
                        ))}
                    </div>

                    {/* Tab Content */}
                    <div className="space-y-6">
                        {activeTab === 'PROFILE' && (
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 animate-fadeIn">
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-gray-500 uppercase">الاسم الكامل</label>
                                    <input type="text" value={editForm.name || ''} onChange={e => setEditForm({...editForm, name: e.target.value})} className="w-full bg-black/40 border border-white/10 rounded-2xl px-4 py-3 text-white outline-none focus:border-[#00d2ff]" />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-gray-500 uppercase">البريد الإلكتروني</label>
                                    <input type="email" value={editForm.email || ''} onChange={e => setEditForm({...editForm, email: e.target.value})} className="w-full bg-black/40 border border-white/10 rounded-2xl px-4 py-3 text-white outline-none focus:border-[#00d2ff]" />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-gray-500 uppercase">رقم الهاتف</label>
                                    <input type="text" value={editForm.phone || ''} onChange={e => setEditForm({...editForm, phone: e.target.value})} className="w-full bg-black/40 border border-white/10 rounded-2xl px-4 py-3 text-white outline-none focus:border-[#00d2ff]" />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-gray-500 uppercase">المدرسة</label>
                                    <input type="text" value={editForm.school || ''} onChange={e => setEditForm({...editForm, school: e.target.value})} className="w-full bg-black/40 border border-white/10 rounded-2xl px-4 py-3 text-white outline-none focus:border-[#00d2ff]" placeholder="اسم المدرسة..." />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-gray-500 uppercase">الصف الدراسي</label>
                                    <select value={editForm.grade || '12'} onChange={e => setEditForm({...editForm, grade: e.target.value})} className="w-full bg-black/40 border border-white/10 rounded-2xl px-4 py-3 text-white outline-none focus:border-[#00d2ff]">
                                        <option value="10">الصف 10</option>
                                        <option value="11">الصف 11</option>
                                        <option value="12">الصف 12</option>
                                    </select>
                                </div>
                            </div>
                        )}

                        {activeTab === 'SUBSCRIPTION' && (
                            <div className="space-y-6 animate-fadeIn">
                                <div className="p-6 bg-[#fbbf24]/5 border border-[#fbbf24]/20 rounded-3xl">
                                    <h4 className="text-lg font-black text-[#fbbf24] mb-4">ترقية / تعديل الباقة</h4>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                        <div className="space-y-2">
                                            <label className="text-[10px] font-black text-gray-500 uppercase">نوع الاشتراك</label>
                                            <select value={editForm.subscription || 'free'} onChange={e => setEditForm({...editForm, subscription: e.target.value as any})} className="w-full bg-black/40 border border-white/10 rounded-2xl px-4 py-3 text-white outline-none focus:border-[#fbbf24]">
                                                <option value="free">مجاني (Free)</option>
                                                <option value="monthly">شهري (Monthly)</option>
                                                <option value="term">فصلي (Term)</option>
                                                <option value="yearly">سنوي (Yearly)</option>
                                                <option value="premium">بريميوم (Premium)</option>
                                            </select>
                                        </div>
                                        <div className="space-y-2">
                                            <label className="text-[10px] font-black text-gray-500 uppercase">تاريخ الانتهاء (YYYY-MM-DD)</label>
                                            <input type="date" value={editForm.subscriptionExpiry ? editForm.subscriptionExpiry.split('T')[0] : ''} onChange={e => setEditForm({...editForm, subscriptionExpiry: new Date(e.target.value).toISOString()})} className="w-full bg-black/40 border border-white/10 rounded-2xl px-4 py-3 text-white outline-none focus:border-[#fbbf24]" />
                                        </div>
                                    </div>
                                </div>
                                <div className="p-6 bg-white/5 border border-white/5 rounded-3xl flex justify-between items-center">
                                    <div>
                                        <p className="font-bold text-white">رصيد النقاط (Gamification)</p>
                                        <p className="text-xs text-gray-500">يستخدم لفتح الألعاب والمكافآت</p>
                                    </div>
                                    <input type="number" value={editForm.points || 0} onChange={e => setEditForm({...editForm, points: parseInt(e.target.value)})} className="w-32 bg-black/40 border border-white/10 rounded-xl px-4 py-2 text-center font-black text-[#00d2ff] outline-none" />
                                </div>
                            </div>
                        )}

                        {activeTab === 'PROGRESS' && (
                            <div className="space-y-6 animate-fadeIn">
                                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                    <div className="p-4 bg-white/5 rounded-2xl text-center border border-white/5">
                                        <p className="text-[10px] text-gray-500 uppercase">ساعات الدراسة</p>
                                        <p className="text-xl font-black text-white">{selectedStudent.progress.totalStudyHours}</p>
                                    </div>
                                    <div className="p-4 bg-white/5 rounded-2xl text-center border border-white/5">
                                        <p className="text-[10px] text-gray-500 uppercase">الدروس المكتملة</p>
                                        <p className="text-xl font-black text-[#00d2ff]">{selectedStudent.completedLessonIds.length}</p>
                                    </div>
                                </div>
                                
                                <div className="p-6 bg-red-500/5 border border-red-500/10 rounded-3xl">
                                    <h4 className="text-red-500 font-bold mb-2">منطقة الخطر</h4>
                                    <p className="text-xs text-gray-400 mb-4">تصفير التقدم سيحذف جميع الدرجات وسجلات الحضور والنشاط لهذا الطالب.</p>
                                    <button onClick={handleResetProgress} className="px-6 py-3 bg-red-500 text-white rounded-xl text-xs font-black hover:bg-red-600 transition-all">تصفير التقدم الدراسي بالكامل</button>
                                </div>
                            </div>
                        )}

                        {activeTab === 'ACTIONS' && (
                            <div className="space-y-6 animate-fadeIn">
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-gray-500 uppercase">ملاحظات إدارية (خاصة)</label>
                                    <textarea 
                                        value={editForm.adminNotes || ''} 
                                        onChange={e => setEditForm({...editForm, adminNotes: e.target.value})}
                                        className="w-full h-32 bg-black/40 border border-white/10 rounded-2xl p-4 text-sm text-yellow-100 outline-none focus:border-[#fbbf24]"
                                        placeholder="اكتب ملاحظات سرية عن الطالب لا يراها إلا المشرفون..."
                                    />
                                </div>
                                <div className="border-t border-white/10 pt-6">
                                    <button 
                                        onClick={handleToggleBan}
                                        className={`w-full py-4 rounded-2xl font-black text-xs uppercase tracking-widest transition-all ${selectedStudent.status === 'banned' ? 'bg-green-500 text-white hover:bg-green-600' : 'bg-red-500/20 text-red-500 border border-red-500/30 hover:bg-red-500 hover:text-white'}`}
                                    >
                                        {selectedStudent.status === 'banned' ? 'إلغاء الحظر وتنشيط الحساب' : 'حظر الحساب ومنع الدخول 🚫'}
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>

                    <div className="absolute bottom-10 left-10 flex gap-4">
                        {message && <span className="text-green-500 text-sm font-bold animate-fadeIn">{message}</span>}
                        <button onClick={handleSave} className="bg-[#fbbf24] text-black px-12 py-4 rounded-[25px] font-black text-xs uppercase tracking-widest shadow-xl hover:scale-105 transition-all">
                            حفظ التغييرات
                        </button>
                    </div>
                </div>
            ) : (
                <div className="glass-panel rounded-[50px] border-white/5 flex flex-col items-center justify-center h-[600px] opacity-30 bg-black/20">
                    <span className="text-6xl mb-6">👨‍🎓</span>
                    <p className="font-black text-lg">اختر طالباً للبدء في الإدارة</p>
                </div>
            )}
        </div>
    </div>
  );
};

export default AdminStudentManager;

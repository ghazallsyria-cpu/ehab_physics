
import React, { useState, useEffect, useRef } from 'react';
import { User, EducationalLevel } from '../types';
import { dbService } from '../services/db';
import { auth } from '../services/firebase';
import { createUserWithEmailAndPassword } from 'firebase/auth';
import { 
  Search, User as UserIcon, Shield, Zap, Trash2, Ban, 
  Save, RefreshCw, GraduationCap, Clock, AlertTriangle,
  Mail, Phone, School, FileText, PlusCircle, CheckCircle, KeyRound, X
} from 'lucide-react';

const AdminStudentManager: React.FC = () => {
  const [students, setStudents] = useState<User[]>([]);
  const [filteredStudents, setFilteredStudents] = useState<User[]>([]);
  const [selectedStudent, setSelectedStudent] = useState<User | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState<'PROFILE' | 'SUBSCRIPTION' | 'PROGRESS' | 'ACTIONS'>('PROFILE');
  const [message, setMessage] = useState<{text: string, type: 'success' | 'error'} | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [password, setPassword] = useState('');
  const [activationCode, setActivationCode] = useState('');

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
    setPassword('');
    setActivationCode('');
    setIsModalOpen(true);
  };
  
  const handleCloseModal = () => {
      setIsModalOpen(false);
      setSelectedStudent(null);
      setEditForm({});
      loadStudents();
  };

  const handleCreateNewMode = () => {
    setSearchQuery('');
    const newStudentTemplate: User = {
        uid: 'new_entry', name: '', email: '', role: 'student',
        grade: '12', educationalLevel: 'SECONDARY',
        status: 'active', subscription: 'free', createdAt: new Date().toISOString(),
        points: 0, completedLessonIds: [],
        progress: { completedLessonIds: [], points: 0, quizScores: {}, totalStudyHours: 0, currentFatigue: 0 }
    };
    setSelectedStudent(newStudentTemplate);
    setEditForm(newStudentTemplate);
    setActiveTab('PROFILE');
    setMessage(null);
    setPassword('');
    setActivationCode('');
    setIsModalOpen(true);
  };

  const handleSave = async () => {
    if (!selectedStudent || !editForm) return;
    if (!editForm.name || !editForm.email) {
        setMessage({ text: 'يرجى تعبئة الاسم والبريد الإلكتروني', type: 'error' });
        return;
    }
    setIsLoading(true);
    try {
        let updatedUser = { ...selectedStudent, ...editForm } as User;
        if (selectedStudent.uid === 'new_entry') {
            if (!password || password.length < 6) {
                setMessage({ text: 'يرجى إدخال كلمة مرور مؤقتة (6 أحرف على الأقل)', type: 'error' });
                setIsLoading(false); return;
            }
            const userCredential = await createUserWithEmailAndPassword(auth, updatedUser.email, password);
            updatedUser.uid = userCredential.user.uid;
            setMessage({ text: 'تم إنشاء حساب الطالب بنجاح', type: 'success' });
            setPassword('');
        } else {
            setMessage({ text: 'تم تحديث بيانات الطالب بنجاح', type: 'success' });
        }
        await dbService.saveUser(updatedUser);
        await loadStudents();
        setSelectedStudent(updatedUser);
    } catch (e: any) {
        console.error(e);
        let errorMsg = 'حدث خطأ أثناء الحفظ.';
        if (e.code === 'auth/email-already-in-use') errorMsg = 'هذا البريد الإلكتروني مسجل مسبقاً.';
        if (e.code === 'auth/invalid-email') errorMsg = 'البريد الإلكتروني غير صالح.';
        setMessage({ text: errorMsg, type: 'error' });
    }
    setIsLoading(false);
    setTimeout(() => setMessage(null), 3000);
  };

  const handleActivateByCode = async () => {
    if (!selectedStudent || !activationCode.trim()) return;
    setIsLoading(true);
    const result = await dbService.activateSubscriptionWithCode(activationCode, selectedStudent.uid);
    if (result.success) {
        setMessage({ text: result.message, type: 'success' });
        const updatedUser = { ...editForm, subscription: 'premium' } as User;
        setEditForm(updatedUser);
        setSelectedStudent(updatedUser);
        setActivationCode('');
    } else {
        setMessage({ text: result.message, type: 'error' });
    }
    setIsLoading(false);
    setTimeout(() => setMessage(null), 4000);
  };
  
  const handleResetProgress = async () => {
    if (!selectedStudent || selectedStudent.uid === 'new_entry' || !window.confirm('⚠️ تحذير: هل أنت متأكد تماماً؟ \nسيتم تصفير جميع الدرجات، الساعات الدراسية، وسجل الأنشطة.\nلا يمكن التراجع عن هذا الإجراء.')) return;
    
    const resetUser = { ...selectedStudent, points: 0, completedLessonIds: [], progress: { completedLessonIds: [], quizScores: {}, totalStudyHours: 0, currentFatigue: 0 } };
    await dbService.saveUser(resetUser as User);
    setSelectedStudent(resetUser as User); setEditForm(resetUser);
    setMessage({ text: 'تم تصفير التقدم الأكاديمي', type: 'success' });
    setTimeout(() => setMessage(null), 3000);
  };

  const handleToggleBan = async () => {
    if (!selectedStudent || selectedStudent.uid === 'new_entry') return;
    const isBanning = selectedStudent.status !== 'banned';
    if (isBanning && !window.confirm('سيتم منع الطالب من الدخول للمنصة نهائياً. هل أنت متأكد؟')) return;

    const updatedUser = { ...selectedStudent, status: isBanning ? 'banned' : 'active' };
    await dbService.saveUser(updatedUser as User);
    setSelectedStudent(updatedUser as User); setEditForm(updatedUser as User);
    loadStudents();
    setMessage({ text: isBanning ? 'تم حظر الطالب' : 'تم تفعيل الحساب', type: isBanning ? 'error' : 'success' });
    setTimeout(() => setMessage(null), 3000);
  };

  const handleDelete = async () => {
    if (!selectedStudent || selectedStudent.uid === 'new_entry') return;
    const confirmDelete = window.confirm(`⚠️ تحذير خطير: أنت على وشك حذف الطالب "${selectedStudent.name}" نهائياً.\n\nهل أنت متأكد تماماً؟`);
    if (!confirmDelete) return;
    setIsLoading(true);
    try {
        await dbService.deleteUser(selectedStudent.uid);
        await loadStudents();
        handleCloseModal();
    } catch (e) {
        console.error(e);
        setMessage({ text: 'حدث خطأ أثناء الحذف', type: 'error' });
    }
    setIsLoading(false);
  };

  const getStatusColor = (status: string | undefined) => {
    switch(status) {
        case 'active': return 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30';
        case 'banned': return 'bg-red-500/20 text-red-400 border-red-500/30';
        case 'suspended': return 'bg-orange-500/20 text-orange-400 border-orange-500/30';
        default: return 'bg-gray-500/20 text-gray-400 border-gray-500/30';
    }
  };

  return (
    <div className="font-['Tajawal'] text-right animate-fadeIn" dir="rtl">
        <div className="glass-panel p-6 rounded-[30px] border-white/5 bg-[#0a1118]/80">
            <div className="space-y-4 mb-6">
                <button onClick={handleCreateNewMode} className="w-full md:w-auto py-4 px-8 bg-[#fbbf24] text-black rounded-2xl font-black text-xs uppercase tracking-widest shadow-lg hover:scale-105 active:scale-95 transition-all flex items-center justify-center gap-2">
                    <PlusCircle size={16} /> إضافة طالب جديد
                </button>
                <div className="relative">
                    <Search className="absolute top-1/2 right-4 -translate-y-1/2 w-5 h-5 text-gray-500" />
                    <input type="text" placeholder="بحث بالاسم، البريد، أو الهاتف..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="w-full bg-white/5 border border-white/10 rounded-2xl pr-12 pl-4 py-4 text-white outline-none focus:border-[#fbbf24] transition-all text-sm font-bold shadow-inner" />
                </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                {filteredStudents.map(student => ( <div key={student.uid} onClick={() => handleSelectStudent(student)} className="p-4 rounded-2xl border cursor-pointer transition-all flex items-center gap-4 group bg-white/[0.02] border-white/5 text-gray-300 hover:bg-white/5 hover:border-white/10"> <div className="relative"> <div className="w-12 h-12 rounded-xl flex items-center justify-center font-black text-lg overflow-hidden bg-black/40"> <img src={`https://api.dicebear.com/7.x/bottts/svg?seed=${student.uid}`} alt="avatar" className="w-full h-full p-1" /> </div> <div className={`absolute -bottom-1 -right-1 w-3 h-3 rounded-full border-2 border-[#0a1118] ${student.status === 'active' ? 'bg-emerald-500' : 'bg-red-500'}`}></div> </div> <div className="flex-1 min-w-0"> <h4 className="font-bold truncate text-sm text-white">{student.name}</h4> <p className="text-[10px] font-mono truncate text-gray-500">{student.email}</p> </div> </div> ))}
                {filteredStudents.length === 0 && ( <div className="md:col-span-2 lg:col-span-3 xl:col-span-4 text-center py-20 opacity-40"> <UserIcon className="w-12 h-12 mx-auto mb-2 text-gray-500" /> <p className="text-xs font-bold">لا توجد نتائج مطابقة</p> </div> )}
            </div>
            <div className="mt-4 pt-4 border-t border-white/5 flex justify-between text-[10px] text-gray-500 font-bold uppercase tracking-widest"> <span>العدد الكلي: {students.length}</span> <span>نشط: {students.filter(s => s.status === 'active').length}</span> </div>
        </div>

      {isModalOpen && selectedStudent && (
        <div className="fixed inset-0 z-[200] bg-black/80 backdrop-blur-md flex items-center justify-center p-4 animate-fadeIn">
          <div className="glass-panel p-8 md:p-12 rounded-[50px] border-white/10 bg-[#0a1118]/95 relative w-full max-w-5xl h-[90vh] flex flex-col shadow-2xl">
            <button onClick={handleCloseModal} className="absolute top-8 left-8 text-gray-500 hover:text-white transition-colors z-20 p-2 rounded-full bg-white/5"><X size={20}/></button>
            <div className="flex-1 flex flex-col overflow-hidden">
                <div className="flex flex-col md:flex-row justify-between items-start gap-6 mb-6 pb-6 border-b border-white/5">
                    <div className="flex items-center gap-6"> <div className="w-24 h-24 rounded-[30px] border-2 border-white/10 bg-black/40 p-2 shadow-2xl relative"> {selectedStudent.uid === 'new_entry' ? ( <div className="w-full h-full flex items-center justify-center text-4xl">🆕</div> ) : ( <> <img src={`https://api.dicebear.com/7.x/bottts/svg?seed=${selectedStudent.uid}`} alt="avatar" className="w-full h-full" /> <div className="absolute -bottom-3 -right-3 bg-[#fbbf24] text-black text-[10px] font-black px-3 py-1 rounded-full border-4 border-[#0a1118]"> Lvl {Math.floor((editForm.points || 0) / 1000) + 1} </div> </> )} </div> <div> <h2 className="text-3xl font-black text-white mb-2">{editForm.uid === 'new_entry' ? 'تسجيل طالب جديد' : editForm.name}</h2> <div className="flex flex-wrap gap-2"> <span className={`px-3 py-1 rounded-lg text-[9px] font-black uppercase tracking-widest border ${getStatusColor(editForm.status)}`}> {editForm.status} </span> {editForm.subscription !== 'free' && ( <span className="px-3 py-1 rounded-lg text-[9px] font-black uppercase tracking-widest bg-purple-500/20 text-purple-400 border border-purple-500/30 flex items-center gap-1"> <Zap size={10} /> {editForm.subscription} </span> )} </div> <p className="text-[10px] text-gray-500 font-mono mt-3 opacity-60"> UID: {editForm.uid === 'new_entry' ? 'سيتم التوليد تلقائياً' : editForm.uid} </p> </div> </div> {selectedStudent.uid !== 'new_entry' && ( <div className="flex gap-3"> <div className="text-center px-6 py-3 bg-white/5 rounded-2xl border border-white/5"> <p className="text-[9px] text-gray-500 uppercase font-black mb-1">النقاط</p> <p className="text-xl font-black text-[#fbbf24] tabular-nums">{editForm.points || 0}</p> </div> <div className="text-center px-6 py-3 bg-white/5 rounded-2xl border border-white/5"> <p className="text-[9px] text-gray-500 uppercase font-black mb-1">الدروس</p> <p className="text-xl font-black text-[#00d2ff] tabular-nums">{editForm.completedLessonIds?.length || 0}</p> </div> </div> )}
                </div>
                <div className="flex gap-2 mb-6 overflow-x-auto no-scrollbar p-1"> {[ {id: 'PROFILE', label: 'الملف الشخصي', icon: UserIcon}, {id: 'SUBSCRIPTION', label: 'الاشتراك', icon: Zap}, {id: 'PROGRESS', label: 'DNA الأكاديمي', icon: GraduationCap, disabled: selectedStudent.uid === 'new_entry'}, {id: 'ACTIONS', label: 'منطقة الخطر', icon: AlertTriangle, disabled: selectedStudent.uid === 'new_entry'} ].map(tab => ( <button key={tab.id} onClick={() => !tab.disabled && setActiveTab(tab.id as any)} disabled={tab.disabled} className={`flex items-center gap-2 px-6 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest whitespace-nowrap transition-all ${ tab.disabled ? 'opacity-30 cursor-not-allowed bg-transparent text-gray-600' : activeTab === tab.id ? 'bg-[#fbbf24] text-black shadow-lg shadow-[#fbbf24]/20' : 'bg-white/5 text-gray-400 hover:text-white hover:bg-white/10' }`}> <tab.icon size={14} /> {tab.label} </button> ))} </div>
                <div className="flex-1 overflow-y-auto no-scrollbar pr-2 pb-24">
                  {activeTab === 'PROFILE' && ( <div className="grid grid-cols-1 md:grid-cols-2 gap-6 animate-slideUp">
                      <div className="space-y-2"> <label className="flex items-center gap-2 text-[10px] font-black text-gray-500 uppercase tracking-widest"> <UserIcon size={12}/> الاسم الكامل </label> <input type="text" value={editForm.name || ''} onChange={e => setEditForm({...editForm, name: e.target.value})} className="w-full bg-black/40 border border-white/10 rounded-2xl px-5 py-4 text-white outline-none focus:border-[#fbbf24] transition-all font-medium" placeholder="اسم الطالب" /> </div>
                      <div className="space-y-2"> <label className="flex items-center gap-2 text-[10px] font-black text-gray-500 uppercase tracking-widest"> <Mail size={12}/> البريد الإلكتروني </label> <input type="email" value={editForm.email || ''} onChange={e => setEditForm({...editForm, email: e.target.value})} className="w-full bg-black/40 border border-white/10 rounded-2xl px-5 py-4 text-white outline-none focus:border-[#fbbf24] transition-all font-medium font-mono text-sm" placeholder="student@example.com" /> </div>
                      {selectedStudent.uid === 'new_entry' && <div className="space-y-2"> <label className="flex items-center gap-2 text-[10px] font-black text-gray-500 uppercase tracking-widest"> <KeyRound size={12}/> كلمة المرور المؤقتة </label> <input type="password" value={password} onChange={e => setPassword(e.target.value)} className="w-full bg-black/40 border border-white/10 rounded-2xl px-5 py-4 text-white outline-none focus:border-red-500/50 transition-all font-medium" /> </div>}
                      <div className="space-y-2"> <label className="flex items-center gap-2 text-[10px] font-black text-gray-500 uppercase tracking-widest"> <Phone size={12}/> رقم الهاتف </label> <input type="text" value={editForm.phone || ''} onChange={e => setEditForm({...editForm, phone: e.target.value})} className="w-full bg-black/40 border border-white/10 rounded-2xl px-5 py-4 text-white outline-none focus:border-[#fbbf24] transition-all font-medium font-mono text-sm" placeholder="+965..." /> </div>
                      <div className="space-y-2"> <label className="flex items-center gap-2 text-[10px] font-black text-gray-500 uppercase tracking-widest"> <School size={12}/> المدرسة </label> <input type="text" value={editForm.school || ''} onChange={e => setEditForm({...editForm, school: e.target.value})} className="w-full bg-black/40 border border-white/10 rounded-2xl px-5 py-4 text-white outline-none focus:border-[#fbbf24] transition-all font-medium" placeholder="اسم المدرسة..." /> </div>
                      <div className="space-y-2"> <label className="flex items-center gap-2 text-[10px] font-black text-gray-500 uppercase tracking-widest"> <GraduationCap size={12}/> الصف الدراسي </label> <div className="relative"> <select value={editForm.grade || '12'} onChange={e => setEditForm({...editForm, grade: e.target.value})} className="w-full bg-black/40 border border-white/10 rounded-2xl px-5 py-4 text-white outline-none focus:border-[#fbbf24] transition-all font-medium appearance-none"> <option value="10">الصف 10</option> <option value="11">الصف 11</option> <option value="12">الصف 12</option> <option value="uni">جامعة (Foundation)</option> </select> <div className="absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none text-gray-500">▼</div> </div> </div>
                  </div> )}
                  {activeTab === 'SUBSCRIPTION' && ( <div className="space-y-6 animate-slideUp">
                      <div className="bg-purple-500/5 border border-purple-500/20 rounded-[35px] p-8">
                         <h4 className="text-lg font-black text-purple-400 mb-6">إدارة الاشتراك</h4>
                         <div className="flex items-center justify-between p-6 bg-black/40 rounded-3xl border border-white/5">
                             <div>
                                 <h5 className="font-bold text-white">الاشتراك الحالي</h5>
                                 <p className="text-xs text-gray-500">تغيير حالة اشتراك الطالب</p>
                             </div>
                             <select value={editForm.subscription || 'free'} onChange={e => setEditForm({...editForm, subscription: e.target.value})} className="bg-black/60 border border-white/10 rounded-2xl px-5 py-4 text-white outline-none focus:border-purple-500 font-bold">
                                 <option value="free">مجاني</option>
                                 <option value="premium">بريميوم</option>
                             </select>
                         </div>
                      </div>
                      <div className="bg-green-500/5 border border-green-500/20 rounded-[35px] p-8">
                         <h4 className="text-lg font-black text-green-400 mb-6">التفعيل اليدوي</h4>
                         <div className="flex gap-3">
                            <input type="text" value={activationCode} onChange={e => setActivationCode(e.target.value)} placeholder="أدخل كود التفعيل..." className="flex-1 bg-black/40 border border-white/10 rounded-2xl px-5 py-4 text-white outline-none focus:border-green-500 transition-all font-mono" />
                            <button onClick={handleActivateByCode} disabled={isLoading} className="px-8 py-4 bg-green-500 text-black rounded-2xl font-black text-xs uppercase tracking-widest hover:scale-105 transition-all">تفعيل بالكود</button>
                         </div>
                      </div>
                  </div> )}
                  {activeTab === 'PROGRESS' && ( <div className="text-center py-20 opacity-40"> <GraduationCap className="w-12 h-12 mx-auto mb-2 text-gray-500" /> <p className="text-xs font-bold">ملف الإنجاز الأكاديمي قيد التطوير</p> </div> )}
                  {activeTab === 'ACTIONS' && ( <div className="space-y-6 animate-slideUp">
                     <div className="bg-red-500/5 border border-red-500/20 rounded-[35px] p-8 space-y-4">
                         <div className="flex items-center justify-between"> <div><h5 className="font-bold text-red-400">حظر الحساب</h5><p className="text-xs text-gray-500">سيتم منع الطالب من الدخول للمنصة</p></div> <button onClick={handleToggleBan} className="px-6 py-3 rounded-xl font-black text-xs uppercase text-white bg-red-500 hover:bg-red-600">{editForm.status === 'banned' ? 'إلغاء الحظر' : 'حظر'}</button> </div>
                         <div className="flex items-center justify-between"> <div><h5 className="font-bold text-red-400">تصفير التقدم</h5><p className="text-xs text-gray-500">حذف جميع الدرجات والأنشطة للطالب</p></div> <button onClick={handleResetProgress} className="px-6 py-3 rounded-xl font-black text-xs uppercase text-red-400 bg-red-500/10 hover:bg-red-500/20">تصفير</button> </div>
                         <div className="flex items-center justify-between pt-4 border-t border-red-500/10"> <div><h5 className="font-bold text-red-400">حذف نهائي</h5><p className="text-xs text-gray-500">سيتم حذف حساب الطالب نهائياً (لا يمكن التراجع)</p></div> <button onClick={handleDelete} className="px-6 py-3 rounded-xl font-black text-xs uppercase text-white bg-red-800 hover:bg-red-900">حذف</button> </div>
                     </div>
                  </div> )}
                </div>
                <div className="absolute bottom-0 left-0 right-0 p-8 flex gap-4 border-t border-white/10 bg-[#0a1118]/80 backdrop-blur-md rounded-b-[50px]"> {message && ( <div className={`flex-1 p-3 rounded-xl text-xs font-bold flex items-center gap-2 ${message.type === 'success' ? 'bg-green-500/10 text-green-400' : 'bg-red-500/10 text-red-400'}`}> <span>{message.type === 'success' ? '✓' : '⚠️'}</span> {message.text} </div> )} <button onClick={handleSave} disabled={isLoading} className="bg-[#fbbf24] text-black px-12 py-4 rounded-2xl font-black text-xs uppercase tracking-widest shadow-xl hover:scale-105 active:scale-95 transition-all flex items-center gap-3 ml-auto disabled:opacity-50"> {isLoading ? <RefreshCw className="animate-spin w-4 h-4" /> : (selectedStudent.uid === 'new_entry' ? <PlusCircle className="w-4 h-4" /> : <Save className="w-4 h-4" />)} {selectedStudent.uid === 'new_entry' ? 'إنشاء الحساب' : 'حفظ التعديلات'} </button> </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminStudentManager;
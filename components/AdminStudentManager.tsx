import React, { useState, useEffect, useRef } from 'react';
import { User } from '../types';
import { dbService } from '../services/db';
import { secondaryAuth } from '../services/firebase';
import { createUserWithEmailAndPassword } from 'firebase/auth';
import { 
  Search, User as UserIcon, Zap, Save, RefreshCw, GraduationCap, 
  Mail, Phone, School, PlusCircle, X, KeyRound, Trash2
} from 'lucide-react';

const AdminStudentManager: React.FC = () => {
  const [students, setStudents] = useState<User[]>([]);
  const [filteredStudents, setFilteredStudents] = useState<User[]>([]);
  const [selectedStudent, setSelectedStudent] = useState<User | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState<'PROFILE' | 'SUBSCRIPTION' | 'PROGRESS'>('PROFILE');
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
        s.email.toLowerCase().includes(lower)
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
    setIsModalOpen(true);
  };
  
  const handleCloseModal = () => {
      setIsModalOpen(false);
      setSelectedStudent(null);
      setEditForm({});
  };

  const handleCreateNewMode = () => {
    const newStudentTemplate: User = {
        uid: 'new_entry', name: '', email: '', role: 'student',
        grade: '12', status: 'active', subscription: 'free', createdAt: new Date().toISOString(),
        progress: { completedLessonIds: [], points: 0 }
    };
    setSelectedStudent(newStudentTemplate);
    setEditForm(newStudentTemplate);
    setActiveTab('PROFILE');
    setMessage(null);
    setPassword('');
    setIsModalOpen(true);
  };

  const handleSave = async () => {
    if (!editForm.name || !editForm.email) {
        setMessage({ text: 'يرجى تعبئة جميع الحقول المطلوبة', type: 'error' });
        return;
    }
    setIsLoading(true);
    setMessage(null);

    try {
        let updatedUser = { ...selectedStudent, ...editForm } as User;
        
        if (selectedStudent?.uid === 'new_entry') {
            if (!password || password.length < 6) {
                setMessage({ text: 'كلمة المرور يجب أن تكون 6 أحرف على الأقل', type: 'error' });
                setIsLoading(false); return;
            }
            // Use secondaryAuth to create user without logging out the current admin
            const userCredential = await createUserWithEmailAndPassword(secondaryAuth, updatedUser.email, password);
            updatedUser.uid = userCredential.user.uid;
        }

        await dbService.saveUser(updatedUser);
        await loadStudents();
        setMessage({ text: 'تم حفظ البيانات بنجاح ✅', type: 'success' });
        
        if (selectedStudent?.uid === 'new_entry') {
            setTimeout(handleCloseModal, 1500);
        }
    } catch (e: any) {
        console.error(e);
        let errorMsg = 'حدث خطأ غير متوقع.';
        if (e.code === 'auth/email-already-in-use') errorMsg = 'البريد الإلكتروني مسجل مسبقاً.';
        setMessage({ text: errorMsg, type: 'error' });
    } finally {
        setIsLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!selectedStudent || selectedStudent.uid === 'new_entry') return;

    if (!window.confirm(`⚠️ تحذير: هل أنت متأكد من حذف الطالب "${selectedStudent.name}"؟ سيتم حذف جميع بياناته بشكل دائم.`)) {
      return;
    }

    setIsLoading(true);
    setMessage(null);
    try {
      await dbService.deleteUser(selectedStudent.uid);
      await loadStudents();
      setMessage({ text: 'تم حذف الطالب بنجاح.', type: 'success' });
      setTimeout(() => {
        handleCloseModal();
        setMessage(null);
      }, 1500);
    } catch (e) {
      console.error("Failed to delete student", e);
      setMessage({ text: 'فشل حذف الطالب.', type: 'error' });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="font-['Tajawal'] text-right animate-fadeIn" dir="rtl">
        <div className="glass-panel p-8 rounded-[40px] border-white/5 bg-[#0a1118]/80 shadow-2xl">
            <div className="flex flex-col md:flex-row justify-between items-center gap-6 mb-8">
                <h2 className="text-3xl font-black text-white">إدارة <span className="text-[#fbbf24]">الطلاب</span></h2>
                <button onClick={handleCreateNewMode} className="bg-[#fbbf24] text-black px-8 py-4 rounded-2xl font-black text-xs uppercase tracking-widest shadow-lg hover:scale-105 transition-all flex items-center gap-2">
                    <PlusCircle size={18} /> تسجيل طالب جديد
                </button>
            </div>
            
            <div className="relative mb-8">
                <Search className="absolute top-1/2 right-5 -translate-y-1/2 w-5 h-5 text-gray-500" />
                <input type="text" placeholder="بحث باسم الطالب أو البريد الإلكتروني..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="w-full bg-white/5 border border-white/10 rounded-3xl pr-14 pl-6 py-5 text-white outline-none focus:border-[#fbbf24] transition-all font-bold" />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {filteredStudents.map(student => (
                    <div key={student.uid} onClick={() => handleSelectStudent(student)} className="p-5 rounded-3xl border border-white/5 bg-white/[0.02] hover:bg-white/[0.05] cursor-pointer transition-all flex items-center gap-4 group">
                        <div className="w-14 h-14 rounded-2xl bg-black/40 p-1 border border-white/10 overflow-hidden">
                            <img src={`https://api.dicebear.com/7.x/bottts/svg?seed=${student.uid}`} alt="avatar" />
                        </div>
                        <div className="flex-1 min-w-0">
                            <h4 className="font-bold text-white truncate">{student.name}</h4>
                            <p className="text-[10px] text-gray-500 font-mono">الصف {student.grade}</p>
                        </div>
                        <div className={`w-2 h-2 rounded-full ${student.subscription === 'premium' ? 'bg-[#fbbf24] shadow-[0_0_10px_#fbbf24]' : 'bg-gray-700'}`}></div>
                    </div>
                ))}
            </div>
        </div>

      {isModalOpen && selectedStudent && (
        <div className="fixed inset-0 z-[250] bg-black/90 backdrop-blur-xl flex items-center justify-center p-4">
          <div className="bg-[#0a1118] border border-white/10 w-full max-w-2xl rounded-[50px] p-10 relative shadow-3xl animate-slideUp overflow-hidden">
            <button onClick={handleCloseModal} className="absolute top-8 left-8 text-gray-500 hover:text-white bg-white/5 p-2 rounded-full"><X size={20}/></button>
            
            <div className="text-center mb-10">
                <div className="w-20 h-20 bg-[#fbbf24] rounded-[25px] flex items-center justify-center text-4xl mx-auto mb-4 shadow-2xl">
                    {selectedStudent.uid === 'new_entry' ? '🆕' : '🎓'}
                </div>
                <h3 className="text-3xl font-black text-white">{selectedStudent.uid === 'new_entry' ? 'تسجيل طالب جديد' : 'تعديل بيانات الطالب'}</h3>
                <p className="text-gray-500 text-sm mt-2">نظام إدارة المركز السوري للعلوم</p>
            </div>

            <div className="space-y-6 max-h-[60vh] overflow-y-auto no-scrollbar px-2">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                        <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest mr-2">الاسم الكامل</label>
                        <input type="text" value={editForm.name || ''} onChange={e => setEditForm({...editForm, name: e.target.value})} className="w-full bg-white/5 border border-white/10 rounded-2xl px-6 py-4 text-white outline-none focus:border-[#fbbf24]" placeholder="اسم الطالب" />
                    </div>
                    <div className="space-y-2">
                        <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest mr-2">البريد الإلكتروني</label>
                        <input type="email" value={editForm.email || ''} onChange={e => setEditForm({...editForm, email: e.target.value})} className="w-full bg-white/5 border border-white/10 rounded-2xl px-6 py-4 text-white outline-none focus:border-[#fbbf24] text-left ltr" placeholder="email@example.com" />
                    </div>
                    {selectedStudent.uid === 'new_entry' && (
                        <div className="space-y-2">
                            <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest mr-2">كلمة المرور المؤقتة</label>
                            <input type="password" value={password} onChange={e => setPassword(e.target.value)} className="w-full bg-white/5 border border-white/10 rounded-2xl px-6 py-4 text-white outline-none focus:border-[#fbbf24] text-left ltr" placeholder="••••••••" />
                        </div>
                    )}
                    <div className="space-y-2">
                        <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest mr-2">الصف الدراسي</label>
                        <select value={editForm.grade || '12'} onChange={e => setEditForm({...editForm, grade: e.target.value as any})} className="w-full bg-white/5 border border-white/10 rounded-2xl px-6 py-4 text-white outline-none focus:border-[#fbbf24]">
                            <option value="10">الصف العاشر</option>
                            <option value="11">الصف الحادي عشر</option>
                            <option value="12">الصف الثاني عشر</option>
                            <option value="uni">جامعي</option>
                        </select>
                    </div>
                </div>
                
                <div className="pt-6 border-t border-white/5">
                    <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest mr-2 mb-4 block">حالة الاشتراك</label>
                    <div className="grid grid-cols-2 gap-4">
                        <button onClick={() => setEditForm({...editForm, subscription: 'free'})} className={`py-4 rounded-2xl font-bold transition-all border ${editForm.subscription === 'free' ? 'bg-white/10 border-white text-white' : 'bg-transparent border-white/10 text-gray-500'}`}>مجاني</button>
                        <button onClick={() => setEditForm({...editForm, subscription: 'premium'})} className={`py-4 rounded-2xl font-bold transition-all border ${editForm.subscription === 'premium' ? 'bg-[#fbbf24]/20 border-[#fbbf24] text-[#fbbf24]' : 'bg-transparent border-white/10 text-gray-500'}`}>بريميوم ⚡</button>
                    </div>
                </div>
            </div>

            <div className="mt-10 pt-8 border-t border-white/10 flex flex-col gap-4">
                {message && (
                    <div className={`p-4 rounded-2xl text-xs font-bold text-center ${message.type === 'success' ? 'bg-green-500/10 text-green-400' : 'bg-red-500/10 text-red-400'}`}>
                        {message.text}
                    </div>
                )}
                <div className="flex gap-4">
                    {selectedStudent.uid !== 'new_entry' && (
                        <button
                            onClick={handleDelete}
                            disabled={isLoading}
                            className="bg-red-500/10 text-red-400 p-5 rounded-[25px] font-black uppercase tracking-widest hover:bg-red-500 hover:text-white transition-all disabled:opacity-50"
                        >
                            <Trash2 size={18} />
                        </button>
                    )}
                    <button 
                        onClick={handleSave} 
                        disabled={isLoading}
                        className="flex-1 bg-[#fbbf24] text-black py-5 rounded-[25px] font-black text-sm uppercase tracking-widest shadow-2xl hover:scale-[1.02] active:scale-95 transition-all flex items-center justify-center gap-3 disabled:opacity-50"
                    >
                        {isLoading ? <RefreshCw className="animate-spin" /> : <Save size={18} />}
                        {selectedStudent.uid === 'new_entry' ? 'إنشاء الحساب' : 'حفظ التعديلات'}
                    </button>
                </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminStudentManager;
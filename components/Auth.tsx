import React, { useState, useRef } from 'react';
import { User } from '../types';
import { dbService } from '../services/db';
import { auth, googleProvider } from '../services/firebase';
import { signInWithEmailAndPassword, createUserWithEmailAndPassword, sendPasswordResetEmail, updateProfile, signInWithPopup } from 'firebase/auth';
import { hashPassword, validatePasswordStrength } from '../services/security';
import { ShieldCheck, AlertCircle } from 'lucide-react';

interface AuthProps {
  onLogin: (user: User) => void;
  onBack: () => void;
}

const Auth: React.FC<AuthProps> = ({ onLogin, onBack }) => {
  const [isRegistering, setIsRegistering] = useState(false);
  const [isResetMode, setIsResetMode] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [grade, setGrade] = useState<'10'|'11'|'12'>('12');
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState<{ text: string; type: 'success' | 'error' | 'info' }>({ text: '', type: 'info' });
  
  const emailRef = useRef<HTMLInputElement>(null);

  const handlePasswordReset = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) {
        setMessage({ text: 'يرجى إدخال البريد الإلكتروني.', type: 'error' });
        return;
    }
    setIsLoading(true);
    try {
        await sendPasswordResetEmail(auth, email);
        setMessage({ text: 'تم إرسال رابط إعادة تعيين كلمة المرور إلى بريدك الإلكتروني.', type: 'success' });
    } catch (error: any) {
        setMessage({ text: 'لا يوجد حساب مسجل بهذا البريد.', type: 'error' });
    } finally {
        setIsLoading(true);
    }
  };

  const handleGoogleSignIn = async () => {
    if (!auth || !googleProvider) {
      setMessage({ text: 'خدمة الدخول عبر جوجل غير متاحة حالياً.', type: 'error' });
      return;
    }
    setIsLoading(true);
    setMessage({ text: 'جاري فتح نافذة جوجل المتأمنة...', type: 'info' });
    try {
      const result = await signInWithPopup(auth, googleProvider);
      const firebaseUser = result.user;
      let appUser = await dbService.getUser(firebaseUser.uid);

      if (!appUser) {
        const newUser: User = {
          uid: firebaseUser.uid,
          name: firebaseUser.displayName || 'طالب جديد',
          email: firebaseUser.email!,
          role: 'student',
          grade: '12',
          subscription: 'free',
          createdAt: new Date().toISOString(),
          progress: { completedLessonIds: [], points: 0 }
        };
        await dbService.saveUser(newUser);
        appUser = newUser;
      }
      onLogin(appUser);
    } catch (error: any) {
      console.error("Google Sign-In Error:", error);
      let msg = 'فشل تسجيل الدخول عبر جوجل. قد تكون النافذة أغلقت أو تم حظرها.';
      if (error.code === 'auth/popup-blocked') msg = 'يرجى السماح بالنوافذ المنبثقة في متصفحك لإتمام تسجيل الدخول.';
      setMessage({ text: msg, type: 'error' });
    } finally {
      setIsLoading(false);
    }
  };

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setMessage({ text: 'جاري تشفير البيانات وتأمين الاتصال...', type: 'info' });
    
    try {
      // 1. Client-side Secure Hashing
      const securePassword = await hashPassword(password);
      
      let user: User | null = null;
      if (isRegistering) {
        // Validation check for registering
        const strength = validatePasswordStrength(password);
        if (!strength.isValid) {
            setMessage({ text: strength.message, type: 'error' });
            setIsLoading(false);
            return;
        }

        const newUser: User = {
            uid: '', name, email, role: 'student', grade,
            subscription: 'free', createdAt: new Date().toISOString(),
            progress: { completedLessonIds: [], points: 0 }
        };

        const userCredential = await createUserWithEmailAndPassword(auth, email, securePassword);
        await updateProfile(userCredential.user, { displayName: name });
        newUser.uid = userCredential.user.uid;
        await dbService.saveUser(newUser);
        user = newUser;
      } else {
        const userCredential = await signInWithEmailAndPassword(auth, email, securePassword);
        user = await dbService.getUser(userCredential.user.uid);
      }

      if (user) onLogin(user);
    } catch (error: any) {
        let msg = "البريد الإلكتروني أو كلمة المرور غير صحيحة.";
        if (error.code === 'auth/email-already-in-use') msg = "البريد الإلكتروني مسجل مسبقاً.";
        setMessage({ text: msg, type: 'error' });
    } finally {
        setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-6 bg-[#0f172a] font-['Tajawal']" dir="rtl">
        <div className="w-full max-w-md bg-white/[0.02] border border-white/10 p-8 rounded-[40px] relative overflow-hidden backdrop-blur-xl shadow-2xl">
            <div className="absolute -top-20 -right-20 w-40 h-40 bg-sky-500/10 rounded-full blur-3xl"></div>
            
            <button onClick={onBack} className="absolute top-6 left-6 text-gray-500 hover:text-white transition-colors">✕</button>
            <div className="text-center mb-8 relative z-10">
                <div className="w-16 h-16 bg-sky-500/10 rounded-2xl flex items-center justify-center mx-auto mb-4 border border-sky-500/20 shadow-lg">
                    <ShieldCheck className="text-sky-400 w-8 h-8" />
                </div>
                <h2 className="text-3xl font-black text-white mb-2">{isResetMode ? 'استعادة الحساب' : isRegistering ? 'انضم للمركز السوري' : 'تسجيل الدخول'}</h2>
                <p className="text-gray-500 text-sm">بوابة التعليم المشفرة 🔒</p>
            </div>

            {message.text && (
                <div className={`mb-6 p-4 rounded-2xl text-xs font-bold text-center flex items-center justify-center gap-2 animate-fadeIn ${
                    message.type === 'success' ? 'bg-green-500/10 text-green-400' : 
                    message.type === 'error' ? 'bg-red-500/10 text-red-400 animate-shake' : 
                    'bg-sky-500/10 text-sky-400'
                }`}>
                    {message.type === 'error' && <AlertCircle size={14} />}
                    {message.text}
                </div>
            )}

            {isResetMode ? (
                <form onSubmit={handlePasswordReset} className="space-y-4">
                    <div>
                        <label className="block text-[10px] font-black text-gray-500 uppercase tracking-widest mb-2 mr-2">البريد الإلكتروني</label>
                        <input type="email" value={email} onChange={e => setEmail(e.target.value)} className="w-full bg-black/20 border border-white/10 rounded-2xl px-5 py-4 text-white outline-none focus:border-sky-400 transition-all text-left" placeholder="name@example.com" />
                    </div>
                    <button type="submit" disabled={isLoading} className="w-full bg-sky-500 text-white py-4 rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-sky-400 transition-all disabled:opacity-50">إرسال رابط الاستعادة</button>
                    <button type="button" onClick={() => setIsResetMode(false)} className="w-full text-gray-500 text-xs font-bold hover:text-white mt-4">العودة للدخول</button>
                </form>
            ) : (
                <>
                <form onSubmit={handleAuth} className="space-y-4"> 
                    {isRegistering && (
                        <div>
                            <label className="block text-[10px] font-black text-gray-500 uppercase tracking-widest mb-2 mr-2">الاسم الكامل</label>
                            <input type="text" value={name} onChange={e => setName(e.target.value)} className="w-full bg-black/20 border border-white/10 rounded-2xl px-5 py-4 text-white outline-none focus:border-sky-400 transition-all" placeholder="الاسم الثلاثي" />
                        </div>
                    )} 
                    <div>
                        <label className="block text-[10px] font-black text-gray-500 uppercase tracking-widest mb-2 mr-2">البريد الإلكتروني</label>
                        <input type="email" value={email} onChange={e => setEmail(e.target.value)} className="w-full bg-black/20 border border-white/10 rounded-2xl px-5 py-4 text-white outline-none focus:border-sky-400 transition-all text-left" placeholder="name@example.com" />
                    </div> 
                    <div>
                        <label className="block text-[10px] font-black text-gray-500 uppercase tracking-widest mb-2 mr-2">كلمة المرور (سيتم تشفيرها 🔐)</label>
                        <input type="password" value={password} onChange={e => setPassword(e.target.value)} className="w-full bg-black/20 border border-white/10 rounded-2xl px-5 py-4 text-white outline-none focus:border-sky-400 transition-all text-left" placeholder="••••••••" />
                    </div> 
                    {isRegistering && (
                        <div>
                            <label className="block text-[10px] font-black text-gray-500 uppercase tracking-widest mb-2 mr-2">الصف الدراسي</label>
                            <select value={grade} onChange={e => setGrade(e.target.value as any)} className="w-full bg-black/20 border border-white/10 rounded-2xl px-5 py-4 text-white outline-none focus:border-sky-400 transition-all">
                                <option value="10">الصف العاشر</option>
                                <option value="11">الصف الحادي عشر</option>
                                <option value="12">الصف الثاني عشر</option>
                            </select>
                        </div>
                    )} 
                    {!isRegistering && (
                        <div className="flex justify-end">
                            <button type="button" onClick={() => setIsResetMode(true)} className="text-[10px] font-bold text-gray-500 hover:text-sky-400">نسيت كلمة المرور؟</button>
                        </div>
                    )} 
                    <button type="submit" disabled={isLoading} className="w-full bg-sky-500 text-white py-4 rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-sky-400 transition-all disabled:opacity-50 mt-4 shadow-lg shadow-sky-500/10">
                        {isLoading ? 'جاري التأمين...' : isRegistering ? 'إنشاء حساب آمن' : 'دخول آمن'}
                    </button> 
                </form>
                
                <div className="relative flex py-6 items-center">
                    <div className="flex-grow border-t border-white/5"></div>
                    <span className="flex-shrink mx-4 text-[10px] text-gray-600 font-black uppercase tracking-widest">أو عبر الهوية الرقمية</span>
                    <div className="flex-grow border-t border-white/5"></div>
                </div>

                <button
                    type="button"
                    onClick={handleGoogleSignIn}
                    disabled={isLoading}
                    className="w-full bg-white/5 border border-white/10 rounded-2xl px-5 py-4 text-white font-bold hover:bg-white hover:text-black transition-all flex items-center justify-center gap-3 disabled:opacity-50"
                >
                    <img src="https://www.google.com/favicon.ico" alt="Google" className="w-5 h-5" />
                    المتابعة باستخدام Google
                </button>

                <div className="pt-8 border-t border-white/5 text-center mt-6"> 
                    <button type="button" onClick={() => setIsRegistering(!isRegistering)} className="text-xs font-bold text-gray-400 hover:text-white transition-colors">
                        {isRegistering ? 'لديك حساب بالفعل؟ سجل دخولك' : 'ليس لديك حساب؟ انضم إلينا الآن'}
                    </button> 
                </div>
                </>
            )}
        </div>
    </div>
  );
};

export default Auth;
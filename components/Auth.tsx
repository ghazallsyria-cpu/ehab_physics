
import React, { useState, useRef } from 'react';
import { User } from '../types';
import { dbService } from '../services/db';
import { auth, googleProvider } from '../services/firebase';
import { signInWithEmailAndPassword, createUserWithEmailAndPassword, sendPasswordResetEmail, updateProfile, signInWithPopup, signInWithRedirect } from 'firebase/auth';

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
  const [message, setMessage] = useState<{ text: string; type: 'success' | 'error' | '' }>({ text: '', type: '' });
  
  const emailRef = useRef<HTMLInputElement>(null);

  const handlePasswordReset = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) {
        setMessage({ text: 'يرجى إدخال البريد الإلكتروني.', type: 'error' });
        setTimeout(() => emailRef.current?.focus(), 100);
        return;
    }
    setIsLoading(true);
    setMessage({ text: '', type: '' });
    try {
        if (auth) {
            await sendPasswordResetEmail(auth, email);
            setMessage({ text: 'تم إرسال رابط إعادة تعيين كلمة المرور.', type: 'success' });
            setTimeout(() => setIsResetMode(false), 5000);
        }
    } catch (error: any) {
        setMessage({ text: 'لا يوجد حساب مسجل بهذا البريد.', type: 'error' });
    } finally {
        setIsLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    if (!auth || !googleProvider) {
      setMessage({ text: 'خدمة جوجل غير متاحة حالياً.', type: 'error' });
      return;
    }
    setIsLoading(true);
    setMessage({ text: '', type: '' });
    try {
      // المحاولة الأولى عبر النافذة المنبثقة
      const result = await signInWithPopup(auth, googleProvider);
      const firebaseUser = result.user;
      await processFirebaseUser(firebaseUser);
    } catch (error: any) {
      console.error("Google Sign-In Error:", error);
      
      // إذا كان الخطأ هو إغلاق النافذة، نحاول عبر Redirect
      if (error.code === 'auth/popup-closed-by-user' || error.code === 'auth/cancelled-by-user') {
          setMessage({ text: 'تم إغلاق النافذة، جاري محاولة تسجيل الدخول البديل...', type: 'error' });
          try {
              await signInWithRedirect(auth, googleProvider);
          } catch (e) {
              setMessage({ text: 'فشل تسجيل الدخول. يرجى التأكد من تفعيل Google Provider في Firebase.', type: 'error' });
          }
      } else if (error.code === 'auth/unauthorized-domain') {
          setMessage({ text: '⚠️ النطاق الحالي غير مصرح له بتسجيل الدخول. أضف النطاق في Firebase Console.', type: 'error' });
      } else {
          setMessage({ text: `فشل تسجيل الدخول: ${error.code}`, type: 'error' });
      }
    } finally {
      setIsLoading(false);
    }
  };

  const processFirebaseUser = async (firebaseUser: any) => {
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
  };

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setMessage({ text: '', type: '' });
    try {
      let user: User | null = null;
      if (isRegistering) {
        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        await updateProfile(userCredential.user, { displayName: name });
        const newUser: User = {
            uid: userCredential.user.uid, name, email, role: 'student', grade,
            status: 'active', subscription: 'free', createdAt: new Date().toISOString(),
            progress: { completedLessonIds: [], achievements: [], points: 0 }
        };
        await dbService.saveUser(newUser);
        user = newUser;
      } else {
        const userCredential = await signInWithEmailAndPassword(auth, email, password);
        user = await dbService.getUser(userCredential.user.uid);
      }
      if (user) onLogin(user);
    } catch (error: any) {
        setMessage({ text: "خطأ في البريد أو كلمة المرور.", type: 'error' });
    } finally {
        setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-6 bg-geometric-pattern font-['Tajawal']" dir="rtl">
        <div className="w-full max-w-md bg-blue-950/[0.6] border border-white/10 p-8 rounded-[40px] relative overflow-hidden backdrop-blur-xl shadow-2xl">
            <button onClick={onBack} className="absolute top-6 left-6 text-gray-500 hover:text-white transition-colors">✕</button>
            <div className="text-center mb-8">
                <h2 className="text-3xl font-black text-white mb-2">{isResetMode ? 'استعادة كلمة المرور' : isRegistering ? 'إنشاء حساب جديد' : 'تسجيل الدخول'}</h2>
                <p className="text-amber-400/50 text-sm font-bold">بوابة المركز السوري للعلوم - الكويت</p>
            </div>
            {message.text && (<div className={`mb-6 p-4 rounded-2xl text-xs font-bold text-center ${message.type === 'success' ? 'bg-green-500/10 text-green-400' : 'bg-red-500/10 text-red-400'}`}>{message.text}</div>)}
            
            {isResetMode ? (
              <form onSubmit={handlePasswordReset} className="space-y-4">
                <div>
                    <label className="block text-[10px] font-black text-gray-500 uppercase tracking-widest mb-2">البريد الإلكتروني</label>
                    <input ref={emailRef} type="email" value={email} onChange={e => setEmail(e.target.value)} className="w-full bg-black/20 border border-white/10 rounded-2xl px-5 py-4 text-white outline-none focus:border-amber-400 transition-all ltr text-left" placeholder="name@example.com" />
                </div>
                <button type="submit" disabled={isLoading} className="w-full bg-amber-400 text-black py-4 rounded-2xl font-black text-xs uppercase tracking-widest hover:scale-105 transition-all disabled:opacity-50">{isLoading ? 'جاري الإرسال...' : 'إرسال رابط الاستعادة'}</button>
                <button type="button" onClick={() => setIsResetMode(false)} className="w-full text-gray-500 text-xs font-bold hover:text-white mt-4">العودة لتسجيل الدخول</button>
              </form>
            ) : ( 
            <>
              <form onSubmit={handleAuth} className="space-y-4"> 
                {isRegistering && ( <div> <label className="block text-[10px] font-black text-gray-500 uppercase tracking-widest mb-2">الاسم الكامل</label> <input type="text" value={name} onChange={e => setName(e.target.value)} className="w-full bg-black/20 border border-white/10 rounded-2xl px-5 py-4 text-white outline-none focus:border-amber-400 transition-all" placeholder="الاسم الثلاثي" /> </div> )} 
                <div> <label className="block text-[10px] font-black text-gray-500 uppercase tracking-widest mb-2">البريد الإلكتروني</label> <input ref={emailRef} type="email" value={email} onChange={e => setEmail(e.target.value)} className="w-full bg-black/20 border border-white/10 rounded-2xl px-5 py-4 text-white outline-none focus:border-amber-400 transition-all ltr text-left" placeholder="name@example.com" /> </div> 
                <div> <label className="block text-[10px] font-black text-gray-500 uppercase tracking-widest mb-2">كلمة المرور</label> <input type="password" value={password} onChange={e => setPassword(e.target.value)} className="w-full bg-black/20 border border-white/10 rounded-2xl px-5 py-4 text-white outline-none focus:border-amber-400 transition-all ltr text-left" placeholder="••••••••" /> </div> 
                {isRegistering && ( <div> <label className="block text-[10px] font-black text-gray-500 uppercase tracking-widest mb-2">الصف الدراسي</label> <select value={grade} onChange={e => setGrade(e.target.value as any)} className="w-full bg-black/40 border border-white/10 rounded-2xl px-5 py-4 text-white outline-none focus:border-amber-400 transition-all"> <option value="10">الصف العاشر</option> <option value="11">الصف الحادي عشر</option> <option value="12">الصف الثاني عشر</option> </select> </div> )} 
                {!isRegistering && ( <div className="flex justify-end"> <button type="button" onClick={() => setIsResetMode(true)} className="text-[10px] font-bold text-gray-500 hover:text-amber-400">نسيت كلمة المرور؟</button> </div> )} 
                <button type="submit" disabled={isLoading} className="w-full bg-amber-400 text-black py-4 rounded-2xl font-black text-xs uppercase tracking-widest hover:scale-105 transition-all disabled:opacity-50 mt-6 shadow-lg">{isLoading ? 'جاري المعالجة...' : isRegistering ? 'إنشاء الحساب' : 'دخول'}</button> 
              </form>
              <div className="relative flex py-5 items-center">
                  <div className="flex-grow border-t border-white/10"></div>
                  <span className="flex-shrink mx-4 text-xs text-gray-500 font-bold">أو</span>
                  <div className="flex-grow border-t border-white/10"></div>
              </div>
              <button
                type="button"
                onClick={handleGoogleSignIn}
                disabled={isLoading}
                className="w-full bg-white/5 border border-white/10 rounded-2xl px-5 py-4 text-white font-bold hover:bg-white hover:text-black transition-all flex items-center justify-center gap-3 disabled:opacity-50"
              >
                <img src="https://www.google.com/favicon.ico" alt="Google icon" className="w-5 h-5" />
                المتابعة باستخدام جوجل
              </button>

              <div className="pt-6 border-t border-white/5 text-center mt-6"> 
                <button type="button" onClick={() => setIsRegistering(!isRegistering)} className="text-xs font-bold text-white">{isRegistering ? 'لديك حساب بالفعل؟ تسجيل الدخول' : 'ليس لديك حساب؟ إنشاء حساب جديد'}</button> 
              </div>
            </>
            )}
        </div>
    </div>
  );
};

export default Auth;

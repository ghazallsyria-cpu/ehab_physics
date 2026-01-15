
import React, { useState, useRef } from 'react';
import { User } from '../types';
import { dbService } from '../services/db';
import { auth } from '../services/firebase';

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
  const [grade, setGrade] = useState<'10'|'11'|'12'|'uni'>('12');
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState<{ text: string; type: 'success' | 'error' | '' }>({ text: '', type: '' });
  
  const emailRef = useRef<HTMLInputElement>(null);

  const handlePasswordReset = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) {
        setMessage({ text: 'يرجى إدخال البريد الإلكتروني أولاً.', type: 'error' });
        setTimeout(() => emailRef.current?.focus(), 100);
        return;
    }
    
    setIsLoading(true);
    setMessage({ text: '', type: '' });

    try {
        if (auth) {
            await auth.sendPasswordResetEmail(email);
            setMessage({ 
                text: 'تم إرسال رابط إعادة التعيين بنجاح! يرجى تفقد بريدك الإلكتروني (والبريد المهمل Spam).', 
                type: 'success' 
            });
            setTimeout(() => setIsResetMode(false), 5000);
        } else {
            const localUser = await dbService.getUser(email);
            if (localUser) {
                setMessage({ text: 'تمت محاكاة إرسال بريد استعادة بنجاح (وضع التجربة).', type: 'success' });
                setTimeout(() => setIsResetMode(false), 5000);
            } else {
                throw { code: 'auth/user-not-found' };
            }
        }
    } catch (error: any) {
        console.error("Reset Error:", error);
        let errorMsg = 'حدث خطأ غير متوقع، يرجى المحاولة لاحقاً.';
        if (error.code === 'auth/user-not-found') errorMsg = 'هذا البريد الإلكتروني غير مسجل في نظامنا.';
        if (error.code === 'auth/invalid-email') errorMsg = 'تنسيق البريد الإلكتروني غير صحيح.';
        if (error.code === 'auth/too-many-requests') errorMsg = 'تم إرسال الكثير من الطلبات. يرجى الانتظار قليلاً.';
        
        setMessage({ text: errorMsg, type: 'error' });
    } finally {
        setIsLoading(false);
    }
  };

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setMessage({ text: '', type: '' });
    try {
      let user: User | null = null;
      
      // 1. التفتيش عن حساب المدير العام بشكل خاص لتسهيل الدخول التجريبي
      if (email.toLowerCase() === 'ghazallsyria@gmail.com') {
          if (password !== 'Gh@870495') {
              throw { code: 'auth/wrong-password' };
          }
          user = await dbService.getUser('admin_demo');
      }

      if (!user) {
        if (isRegistering) {
            const newUser: User = {
                uid: `local_${Date.now()}`, name, email, role: 'student', grade,
                status: 'active', subscription: 'free', createdAt: new Date().toISOString(),
                progress: { completedLessonIds: [], achievements: [], points: 0 }
            };

            if (auth) {
                const userCredential = await auth.createUserWithEmailAndPassword(email, password);
                if (userCredential.user) {
                    await userCredential.user.updateProfile({ displayName: name });
                    newUser.uid = userCredential.user.uid;
                }
            }
            await dbService.saveUser(newUser);
            localStorage.setItem('ssc_active_uid', newUser.uid);
            user = newUser;
        } else {
            if (auth) {
                const userCredential = await auth.signInWithEmailAndPassword(email, password);
                if (userCredential.user) {
                    user = await dbService.getUser(userCredential.user.uid);
                    if (!user) {
                        user = {
                            uid: userCredential.user.uid, name: userCredential.user.displayName || 'طالب',
                            email: userCredential.user.email || email, role: 'student', grade: '12',
                            status: 'active', subscription: 'free', createdAt: new Date().toISOString(),
                            progress: { completedLessonIds: [], achievements: [], points: 0 }
                        };
                        await dbService.saveUser(user);
                    }
                }
            } else {
                user = await dbService.getUser(email);
            }
        }
      }

      if (user) {
          localStorage.setItem('ssc_active_uid', user.uid);
          onLogin(user);
      } else {
          throw { code: 'auth/user-not-found' };
      }
    } catch (error: any) {
        let msg = "البريد الإلكتروني أو كلمة المرور غير صحيحة.";
        if (error.code === 'auth/email-already-in-use') msg = "هذا البريد مسجل مسبقاً، جرب تسجيل الدخول.";
        if (error.code === 'auth/weak-password') msg = "كلمة المرور ضعيفة جداً (يجب أن تكون 6 خانات فأكثر).";
        if (error.code === 'auth/user-not-found') msg = "لا يوجد حساب بهذا البريد، يمكنك إنشاء حساب جديد.";
        if (error.code === 'auth/wrong-password') msg = "كلمة المرور غير صحيحة.";
        setMessage({ text: msg, type: 'error' });
    } finally {
        setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-6 bg-[#0f172a] font-['Tajawal']" dir="rtl">
        <div className="w-full max-w-md bg-white/[0.02] border border-white/10 p-8 rounded-[40px] relative overflow-hidden backdrop-blur-xl shadow-2xl">
            <button onClick={onBack} className="absolute top-6 left-6 text-gray-500 hover:text-white transition-colors">✕</button>
            <div className="text-center mb-8">
                <h2 className="text-3xl font-black text-white mb-2">{isResetMode ? 'استعادة كلمة المرور' : isRegistering ? 'إنشاء حساب جديد' : 'تسجيل الدخول'}</h2>
                <p className="text-gray-500 text-sm">بوابة المركز السوري للعلوم</p>
            </div>
            {message.text && (<div className={`mb-6 p-4 rounded-2xl text-xs font-bold text-center ${message.type === 'success' ? 'bg-green-500/10 text-green-400' : 'bg-red-500/10 text-red-400'}`}>{message.text}</div>)}
            {isResetMode ? ( 
                <form onSubmit={handlePasswordReset} className="space-y-4"> 
                    <div> 
                        <label className="block text-[10px] font-black text-gray-500 uppercase tracking-widest mb-2">البريد الإلكتروني المسجل</label> 
                        <input ref={emailRef} type="email" value={email} onChange={e => setEmail(e.target.value)} className="w-full bg-black/20 border border-white/10 rounded-2xl px-5 py-4 text-white outline-none focus:border-[#fbbf24] transition-all ltr text-left" placeholder="name@example.com" /> 
                    </div> 
                    <button type="submit" disabled={isLoading} className="w-full bg-[#fbbf24] text-black py-4 rounded-2xl font-black text-xs uppercase tracking-widest hover:scale-105 transition-all disabled:opacity-50">
                        {isLoading ? 'جاري الإرسال...' : 'إرسال رابط الاستعادة'}
                    </button> 
                    <button type="button" onClick={() => setIsResetMode(false)} className="w-full text-gray-500 text-xs font-bold hover:text-white mt-4">العودة لتسجيل الدخول</button> 
                </form> 
            ) : ( 
                <form onSubmit={handleAuth} className="space-y-4"> 
                    {isRegistering && ( <div> <label className="block text-[10px] font-black text-gray-500 uppercase tracking-widest mb-2">الاسم الكامل</label> <input type="text" value={name} onChange={e => setName(e.target.value)} className="w-full bg-black/20 border border-white/10 rounded-2xl px-5 py-4 text-white outline-none focus:border-[#fbbf24] transition-all" placeholder="الاسم الثلاثي" /> </div> )} 
                    <div> <label className="block text-[10px] font-black text-gray-500 uppercase tracking-widest mb-2">البريد الإلكتروني</label> <input ref={emailRef} type="email" value={email} onChange={e => setEmail(e.target.value)} className="w-full bg-black/20 border border-white/10 rounded-2xl px-5 py-4 text-white outline-none focus:border-[#fbbf24] transition-all ltr text-left" placeholder="name@example.com" /> </div> 
                    <div> <label className="block text-[10px] font-black text-gray-500 uppercase tracking-widest mb-2">كلمة المرور</label> <input type="password" value={password} onChange={e => setPassword(e.target.value)} className="w-full bg-black/20 border border-white/10 rounded-2xl px-5 py-4 text-white outline-none focus:border-[#fbbf24] transition-all ltr text-left" placeholder="••••••••" /> </div> 
                    {isRegistering && ( <div> <label className="block text-[10px] font-black text-gray-500 uppercase tracking-widest mb-2">الصف الدراسي</label> <select value={grade} onChange={e => setGrade(e.target.value as any)} className="w-full bg-black/40 border border-white/10 rounded-2xl px-5 py-4 text-white outline-none focus:border-[#fbbf24] transition-all"> <option value="10">الصف العاشر</option> <option value="11">الصف الحادي عشر</option> <option value="12">الصف الثاني عشر</option> <option value="uni">جامعة</option> </select> </div> )} 
                    {!isRegistering && ( <div className="flex justify-end"> <button type="button" onClick={() => setIsResetMode(true)} className="text-[10px] font-bold text-gray-500 hover:text-[#fbbf24]">نسيت كلمة المرور؟</button> </div> )} 
                    <button type="submit" disabled={isLoading} className="w-full bg-[#00d2ff] text-black py-4 rounded-2xl font-black text-xs uppercase tracking-widest hover:scale-105 transition-all disabled:opacity-50 mt-6 shadow-lg">
                        {isLoading ? 'جاري المعالجة...' : isRegistering ? 'إنشاء الحساب' : 'دخول'}
                    </button> 
                    <div className="pt-6 border-t border-white/5 text-center"> 
                        <button type="button" onClick={() => setIsRegistering(!isRegistering)} className="text-xs font-bold text-white">{isRegistering ? 'لديك حساب بالفعل؟ تسجيل الدخول' : 'ليس لديك حساب؟ إنشاء حساب جديد'}</button> 
                    </div> 
                </form> 
            )}
        </div>
    </div>
  );
};

export default Auth;

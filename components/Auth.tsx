
import React, { useState, useRef } from 'react';
import { User, EducationalLevel } from '../types';
import { dbService } from '../services/db';
import { auth } from '../services/firebase';
import { signInWithEmailAndPassword, createUserWithEmailAndPassword, sendPasswordResetEmail, updateProfile } from 'firebase/auth';

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
  const [grade, setGrade] = useState('12');
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
        // التحقق من وجود الإيميل في قاعدة البيانات أولاً
        const existingUser = await dbService.getUser(email);
        
        // Use Firebase Auth for reset if available
        if (auth) {
            await sendPasswordResetEmail(auth, email);
        } else {
            // محاكاة الإرسال في الوضع المحلي إذا كان المستخدم موجوداً
            if (!existingUser) throw new Error('EMAIL_NOT_FOUND_IN_DB');
            console.log("Simulating reset email for local user:", email);
            await new Promise(resolve => setTimeout(resolve, 1000));
        }

        setMessage({ text: 'تم إرسال رابط إعادة تعيين كلمة المرور إلى بريدك الإلكتروني.', type: 'success' });
        setTimeout(() => setIsResetMode(false), 5000); // Auto go back after 5s
    } catch (error: any) {
        console.error("Reset Password Error:", error);
        let errorMsg = 'حدث خطأ أثناء محاولة إرسال البريد.';
        
        if (error.message === 'EMAIL_NOT_FOUND_IN_DB') {
            errorMsg = 'هذا البريد الإلكتروني غير مسجل في قاعدة البيانات.';
        } else if (error.code === 'auth/user-not-found') {
            errorMsg = 'لا يوجد حساب مسجل بهذا البريد.';
        } else if (error.code === 'auth/invalid-email') {
            errorMsg = 'البريد الإلكتروني غير صحيح.';
        } else if (error.message === 'Firebase Auth not initialized') {
             // Fallback for local mode simulation
             if (!await dbService.getUser(email)) {
                 errorMsg = 'هذا البريد الإلكتروني غير مسجل.';
             } else {
                 setMessage({ text: 'تم إرسال رابط (محاكاة) إلى بريدك.', type: 'success' });
                 setIsLoading(false);
                 return;
             }
        }
        
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

      if (isRegistering) {
        // Register
        if (auth) {
            const userCredential = await createUserWithEmailAndPassword(auth, email, password);
            await updateProfile(userCredential.user, { displayName: name });
            const uid = userCredential.user.uid;
            
            const newUser: User = {
                uid,
                name,
                email,
                role: 'student',
                grade,
                status: 'active',
                subscription: 'free',
                createdAt: new Date().toISOString(),
                completedLessonIds: [],
                educationalLevel: EducationalLevel.SECONDARY,
                progress: {
                    completedLessonIds: [],
                    quizScores: {},
                    totalStudyHours: 0,
                    currentFatigue: 0
                }
            };
            await dbService.saveUser(newUser);
            user = newUser;
        } else {
            // Local Mode Registration
            const existing = await dbService.getUser(email);
            if (existing) throw new Error('Email already exists');
            
            const newUser: User = {
                uid: `local_${Date.now()}`,
                name,
                email,
                role: 'student',
                grade,
                status: 'active',
                subscription: 'free',
                createdAt: new Date().toISOString(),
                completedLessonIds: [],
                educationalLevel: EducationalLevel.SECONDARY,
                progress: { completedLessonIds: [], quizScores: {}, totalStudyHours: 0, currentFatigue: 0 }
            };
            await dbService.saveUser(newUser);
            user = newUser;
        }
      } else {
        // Login
        if (auth) {
            const userCredential = await signInWithEmailAndPassword(auth, email, password);
            user = await dbService.getUser(userCredential.user.uid);
            if (!user) {
                // If user exists in Auth but not DB (edge case), try fetch by email or create basic profile
                user = await dbService.getUser(email); 
            }
        } else {
            // Local Mode Login
            const localUser = await dbService.getUser(email);
            if (!localUser) throw new Error('User not found');
            // Simplified password check for local mode (in real app, hash check)
            user = localUser; 
        }
      }

      if (user) {
        onLogin(user);
      } else {
        throw new Error('فشل في استرجاع بيانات المستخدم.');
      }

    } catch (error: any) {
        console.error("Auth Error:", error);
        let msg = "حدث خطأ غير متوقع.";
        if (error.code === 'auth/wrong-password' || error.message === 'User not found') msg = "البريد الإلكتروني أو كلمة المرور غير صحيحة.";
        if (error.code === 'auth/email-already-in-use' || error.message === 'Email already exists') msg = "البريد الإلكتروني مسجل مسبقاً.";
        if (error.code === 'auth/weak-password') msg = "كلمة المرور ضعيفة (يجب أن تكون 6 أحرف على الأقل).";
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
                <h2 className="text-3xl font-black text-white mb-2">
                    {isResetMode ? 'استعادة كلمة المرور' : isRegistering ? 'إنشاء حساب جديد' : 'تسجيل الدخول'}
                </h2>
                <p className="text-gray-500 text-sm">بوابة المركز السوري للعلوم</p>
            </div>

            {message.text && (
                <div className={`mb-6 p-4 rounded-2xl text-xs font-bold text-center ${message.type === 'success' ? 'bg-green-500/10 text-green-400' : 'bg-red-500/10 text-red-400'}`}>
                    {message.text}
                </div>
            )}

            {isResetMode ? (
                <form onSubmit={handlePasswordReset} className="space-y-4">
                    <div>
                        <label className="block text-[10px] font-black text-gray-500 uppercase tracking-widest mb-2">البريد الإلكتروني</label>
                        <input 
                            ref={emailRef}
                            type="email" 
                            value={email}
                            onChange={e => setEmail(e.target.value)}
                            className="w-full bg-black/20 border border-white/10 rounded-2xl px-5 py-4 text-white outline-none focus:border-[#fbbf24] transition-all ltr text-left"
                            placeholder="name@example.com"
                        />
                    </div>
                    <button type="submit" disabled={isLoading} className="w-full bg-[#fbbf24] text-black py-4 rounded-2xl font-black text-xs uppercase tracking-widest hover:scale-105 transition-all disabled:opacity-50">
                        {isLoading ? 'جاري الإرسال...' : 'إرسال رابط الاستعادة'}
                    </button>
                    <button type="button" onClick={() => setIsResetMode(false)} className="w-full text-gray-500 text-xs font-bold hover:text-white mt-4">
                        العودة لتسجيل الدخول
                    </button>
                </form>
            ) : (
                <form onSubmit={handleAuth} className="space-y-4">
                    {isRegistering && (
                        <div>
                            <label className="block text-[10px] font-black text-gray-500 uppercase tracking-widest mb-2">الاسم الكامل</label>
                            <input 
                                type="text" 
                                value={name}
                                onChange={e => setName(e.target.value)}
                                className="w-full bg-black/20 border border-white/10 rounded-2xl px-5 py-4 text-white outline-none focus:border-[#fbbf24] transition-all"
                                placeholder="الاسم الثلاثي"
                            />
                        </div>
                    )}
                    
                    <div>
                        <label className="block text-[10px] font-black text-gray-500 uppercase tracking-widest mb-2">البريد الإلكتروني</label>
                        <input 
                            ref={emailRef}
                            type="email" 
                            value={email}
                            onChange={e => setEmail(e.target.value)}
                            className="w-full bg-black/20 border border-white/10 rounded-2xl px-5 py-4 text-white outline-none focus:border-[#fbbf24] transition-all ltr text-left"
                            placeholder="name@example.com"
                        />
                    </div>

                    <div>
                        <label className="block text-[10px] font-black text-gray-500 uppercase tracking-widest mb-2">كلمة المرور</label>
                        <input 
                            type="password" 
                            value={password}
                            onChange={e => setPassword(e.target.value)}
                            className="w-full bg-black/20 border border-white/10 rounded-2xl px-5 py-4 text-white outline-none focus:border-[#fbbf24] transition-all ltr text-left"
                            placeholder="••••••••"
                        />
                    </div>

                    {isRegistering && (
                        <div>
                            <label className="block text-[10px] font-black text-gray-500 uppercase tracking-widest mb-2">الصف الدراسي</label>
                            <select value={grade} onChange={e => setGrade(e.target.value)} className="w-full bg-black/20 border border-white/10 rounded-2xl px-5 py-4 text-white outline-none focus:border-[#fbbf24] transition-all">
                                <option value="10">الصف العاشر</option>
                                <option value="11">الصف الحادي عشر</option>
                                <option value="12">الصف الثاني عشر</option>
                            </select>
                        </div>
                    )}

                    {!isRegistering && (
                        <div className="flex justify-end">
                            <button type="button" onClick={() => setIsResetMode(true)} className="text-[10px] font-bold text-gray-500 hover:text-[#fbbf24]">
                                نسيت كلمة المرور؟
                            </button>
                        </div>
                    )}

                    <button type="submit" disabled={isLoading} className="w-full bg-[#00d2ff] text-black py-4 rounded-2xl font-black text-xs uppercase tracking-widest hover:scale-105 transition-all disabled:opacity-50 mt-6 shadow-lg">
                        {isLoading ? 'جاري المعالجة...' : isRegistering ? 'إنشاء الحساب' : 'دخول'}
                    </button>

                    <div className="pt-6 border-t border-white/5 text-center">
                        <button type="button" onClick={() => setIsRegistering(!isRegistering)} className="text-xs font-bold text-white">
                            {isRegistering ? 'لديك حساب بالفعل؟ تسجيل الدخول' : 'ليس لديك حساب؟ إنشاء حساب جديد'}
                        </button>
                    </div>
                </form>
            )}
        </div>
    </div>
  );
};

export default Auth;

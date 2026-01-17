import React, { useState, useRef, useEffect } from 'react';
import { User } from '../types';
import { dbService } from '../services/db';
import { auth, googleProvider } from '../services/firebase';
import { 
    signInWithEmailAndPassword, 
    createUserWithEmailAndPassword, 
    sendPasswordResetEmail, 
    updateProfile, 
    signInWithPopup, 
    signInWithRedirect, 
    getRedirectResult 
} from 'firebase/auth';
import { hashPassword, validatePasswordStrength } from '../services/security';
import { ShieldCheck, AlertCircle, RefreshCcw, ExternalLink, Eye, EyeOff } from 'lucide-react';

interface AuthProps {
  onLogin: (user: User) => void;
  onBack: () => void;
}

const Auth: React.FC<AuthProps> = ({ onLogin, onBack }) => {
  const [isRegistering, setIsRegistering] = useState(false);
  const [isResetMode, setIsResetMode] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [name, setName] = useState('');
  const [grade, setGrade] = useState<'10'|'11'|'12'>('12');
  const [isLoading, setIsLoading] = useState(false);
  const [showRedirectOption, setShowRedirectOption] = useState(false);
  const [message, setMessage] = useState<{ text: string; type: 'success' | 'error' | 'info' }>({ text: '', type: 'info' });
  
  // التحقق من نتائج إعادة التوجيه عند تحميل المكون
  useEffect(() => {
    const checkRedirect = async () => {
        if (!auth) return;
        try {
            const result = await getRedirectResult(auth);
            if (result) {
                handleLoginSuccess(result.user);
            }
        } catch (error: any) {
            console.error("Redirect Result Error:", error);
            setMessage({ text: 'فشل إكمال تسجيل الدخول بعد إعادة التوجيه.', type: 'error' });
        }
    };
    checkRedirect();
  }, []);

  const handleLoginSuccess = async (firebaseUser: any) => {
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

  const handleGoogleSignIn = async (useRedirect: boolean = false) => {
    if (!auth || !googleProvider) {
      setMessage({ text: 'خدمة الدخول عبر جوجل غير متاحة حالياً.', type: 'error' });
      return;
    }
    setIsLoading(true);
    setMessage({ text: useRedirect ? 'جاري إعادة التوجيه لصفحة جوجل...' : 'جاري فتح نافذة جوجل المؤمنة...', type: 'info' });
    
    try {
      if (useRedirect) {
        await signInWithRedirect(auth, googleProvider);
        // الدالة لن تستمر هنا لأن الصفحة ستعيد التوجيه
      } else {
        const result = await signInWithPopup(auth, googleProvider);
        await handleLoginSuccess(result.user);
      }
    } catch (error: any) {
      console.error("Google Sign-In Error:", error);
      let msg = 'فشل تسجيل الدخول. يرجى المحاولة مرة أخرى.';
      
      if (error.code === 'auth/popup-blocked') {
        msg = 'تم حظر النافذة المنبثقة! يرجى السماح بالنوافذ المنبثقة في متصفحك أو استخدم زر "إعادة التوجيه" أدناه.';
        setShowRedirectOption(true);
      } else if (error.code === 'auth/popup-closed-by-user') {
        msg = 'لقد قمت بإغلاق نافذة تسجيل الدخول قبل إتمام العملية.';
        setShowRedirectOption(true);
      } else if (error.code === 'auth/network-request-failed') {
        msg = 'فشل الاتصال بالخادم. يرجى التحقق من جودة الإنترنت لديك.';
      }

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
      const securePassword = await hashPassword(password);
      let user: User | null = null;
      if (isRegistering) {
        const strength = validatePasswordStrength(password);
        if (!strength.isValid) {
            setMessage({ text: strength.message, type: 'error' });
            setIsLoading(false);
            return;
        }
        const userCredential = await createUserWithEmailAndPassword(auth, email, securePassword);
        await updateProfile(userCredential.user, { displayName: name });
        const newUser: User = {
            uid: userCredential.user.uid, name, email, role: 'student', grade,
            subscription: 'free', createdAt: new Date().toISOString(),
            progress: { completedLessonIds: [], points: 0 }
        };
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
                <div className={`mb-6 p-4 rounded-2xl text-xs font-bold text-center flex flex-col items-center justify-center gap-3 animate-fadeIn ${
                    message.type === 'success' ? 'bg-green-500/10 text-green-400' : 
                    message.type === 'error' ? 'bg-red-500/10 text-red-400 animate-shake' : 
                    'bg-sky-500/10 text-sky-400'
                }`}>
                    <div className="flex items-center gap-2">
                        {message.type === 'error' && <AlertCircle size={14} />}
                        {message.text}
                    </div>
                    {showRedirectOption && (
                        <button 
                            onClick={() => handleGoogleSignIn(true)}
                            className="text-[10px] bg-white/10 hover:bg-white/20 text-white px-4 py-2 rounded-lg transition-all flex items-center gap-2 border border-white/10"
                        >
                            <ExternalLink size={12} /> استخدام طريقة إعادة التوجيه (Redirect)
                        </button>
                    )}
                </div>
            )}

            {isResetMode ? (
                <form onSubmit={(e) => { e.preventDefault(); /* Reset Logic */ }} className="space-y-4">
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
                        <label className="block text-[10px] font-black text-gray-500 uppercase tracking-widest mb-2 mr-2">كلمة المرور (تشفير AES-256 🔐)</label>
                        <div className="relative">
                            <input 
                                type={showPassword ? 'text' : 'password'} 
                                value={password} 
                                onChange={e => setPassword(e.target.value)} 
                                className="w-full bg-black/20 border border-white/10 rounded-2xl px-5 py-4 pl-14 text-white outline-none focus:border-sky-400 transition-all text-left" 
                                placeholder="••••••••" 
                            />
                            <button 
                                type="button" 
                                onClick={() => setShowPassword(!showPassword)}
                                className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 hover:text-sky-400 transition-colors"
                            >
                                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                            </button>
                        </div>
                    </div> 
                    {isRegistering && (
                        <div>
                            <label className="block text-[10px] font-black text-gray-500 uppercase tracking-widest mb-2 mr-2">الصف الدراسي</label>
                            <select value={grade} onChange={e => setGrade(e.target.value as any)} className="w-full bg-black/40 border border-white/10 rounded-2xl px-5 py-4 text-white outline-none focus:border-sky-400 transition-all">
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

                <div className="space-y-3">
                    <button
                        type="button"
                        onClick={() => handleGoogleSignIn(false)}
                        disabled={isLoading}
                        className="w-full bg-white/5 border border-white/10 rounded-2xl px-5 py-4 text-white font-bold hover:bg-white hover:text-black transition-all flex items-center justify-center gap-3 disabled:opacity-50"
                    >
                        <img src="https://www.google.com/favicon.ico" alt="Google" className="w-5 h-5" />
                        المتابعة باستخدام Google
                    </button>
                    
                    {showRedirectOption && (
                        <p className="text-[9px] text-center text-gray-500 px-4 leading-relaxed font-medium">
                            * إذا لم تظهر لك نافذة جوجل، يرجى تفعيل "النوافذ المنبثقة" من إعدادات المتصفح أو استخدام زر التوجيه.
                        </p>
                    )}
                </div>

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
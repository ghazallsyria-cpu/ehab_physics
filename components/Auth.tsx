
import React, { useState, useEffect, useRef } from 'react';
import { User, EducationalLevel, BetaConfig } from '../types';
import { dbService } from '../services/db';
import { Mail, Lock, User as UserIcon, Phone, Camera, School, Key, ArrowRight, ShieldCheck, Sparkles, AlertCircle, CheckCircle2, XCircle } from 'lucide-react';

interface AuthProps {
  onLogin: (user: User) => void;
  onBack: () => void;
}

const Auth: React.FC<AuthProps> = ({ onLogin, onBack }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [photoURL, setPhotoURL] = useState('');
  const [grade, setGrade] = useState('12');
  const [level, setLevel] = useState<EducationalLevel>(EducationalLevel.SECONDARY);
  const [betaCode, setBetaCode] = useState('');
  const [isSignUp, setIsSignUp] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState({ text: '', type: '' });
  const [betaInfo, setBetaInfo] = useState<BetaConfig | null>(null);

  // Refs for focus management
  const nameRef = useRef<HTMLInputElement>(null);
  const emailRef = useRef<HTMLInputElement>(null);
  const passwordRef = useRef<HTMLInputElement>(null);
  const betaCodeRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    dbService.getBetaConfig().then(setBetaInfo);
  }, []);

  const handleDemoLogin = async (role: 'admin' | 'student') => {
    setIsLoading(true);
    setMessage({ text: '', type: '' });
    
    const targetUid = role === 'admin' ? 'admin_demo' : 'beta002';
    
    // Create a robust demo user with Premium access and existing progress
    const demoUser: User = {
      uid: targetUid,
      email: role === 'admin' ? 'admin@rafid.test' : 'student.beta@rafid.test',
      name: role === 'admin' ? 'مدير المنصة' : 'طالب تجريبي (Beta)',
      role: role === 'admin' ? 'admin' : 'student',
      grade: '12',
      stage: 'secondary',
      educationalLevel: EducationalLevel.SECONDARY,
      status: 'active',
      // Grant Premium to allow testing of AI/Labs features
      subscription: 'premium', 
      points: 1250,
      createdAt: new Date().toISOString(),
      // Pre-fill progress to unlock games/exams
      completedLessonIds: ['l12-1', 'l12-2'], 
      progress: {
        completedLessonIds: ['l12-1', 'l12-2'],
        quizScores: {'q-1': 18},
        totalStudyHours: 42,
        currentFatigue: 15,
        lastActivity: new Date().toISOString(),
        strengths: ['الميكانيكا', 'قوانين نيوتن'],
        weaknesses: ['الفيزياء النووية']
      }
    };

    try {
      // Await save to ensure data exists before Dashboard mounts
      await dbService.saveUser(demoUser);
      
      // Small artificial delay for better UX feeling
      await new Promise(r => setTimeout(r, 800));
      
      onLogin(demoUser);
    } catch (e) {
      console.error("Login Error", e);
      setIsLoading(false);
      setMessage({ text: 'تعذر تهيئة الحساب التجريبي. يرجى المحاولة مرة أخرى.', type: 'error' });
    }
  };

  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setPhotoURL(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage({ text: '', type: '' });
    setIsLoading(true);

    try {
      // Small delay for UX on normal login only
      await new Promise(r => setTimeout(r, 500));

      if (isSignUp) {
        // Strict validation for Sign Up
        if (!name.trim()) throw new Error('MISSING_NAME');
        if (!email.trim()) throw new Error('MISSING_EMAIL');
        if (!email.includes('@')) throw new Error('INVALID_EMAIL_FORMAT');
        if (!password.trim()) throw new Error('MISSING_PASSWORD');
        if (password.length < 6) throw new Error('WEAK_PASSWORD');

        if (betaInfo?.isActive && betaCode !== betaInfo.invitationCode) {
           throw new Error('INVALID_BETA_CODE');
        }

        const existing = await dbService.getUser(email);
        if (existing) {
          throw new Error('EMAIL_EXISTS');
        }

        const newUser: User = {
          uid: `user_${Date.now()}`,
          email: email.toLowerCase(),
          name: name,
          phone: phone,
          photoURL: photoURL,
          role: email.includes('admin') ? 'admin' : (email.includes('parent') ? 'parent' : 'student'),
          stage: 'secondary',
          points: 100,
          educationalLevel: level,
          grade: grade as any,
          status: 'active',
          subscription: 'free',
          createdAt: new Date().toISOString(),
          completedLessonIds: [],
          progress: {
            completedLessonIds: [],
            quizScores: {},
            totalStudyHours: 0,
            strengths: [],
            weaknesses: [],
            currentFatigue: 0
          }
        };
        await dbService.saveUser(newUser);
        onLogin(newUser);
      } else {
        // Strict validation for Login
        if (!email.trim()) throw new Error('MISSING_EMAIL');
        
        // Allow demo accounts to login without typing a password
        const isDemoUser = ['admin@rafid.test', 'student.beta@rafid.test'].includes(email.toLowerCase());
        if (!password.trim() && !isDemoUser) throw new Error('MISSING_PASSWORD');

        const userData = await dbService.getUser(email);
        if (userData) {
          // In a real app, we would verify password hash here
          onLogin(userData);
        } else {
          throw new Error('USER_NOT_FOUND');
        }
      }
    } catch (err: any) {
      // Don't log known validation errors to console to keep it clean
      const knownErrors = ['MISSING_NAME', 'MISSING_EMAIL', 'INVALID_EMAIL_FORMAT', 'MISSING_PASSWORD', 'WEAK_PASSWORD', 'INVALID_BETA_CODE', 'EMAIL_EXISTS', 'USER_NOT_FOUND'];
      if (!knownErrors.includes(err.message)) {
        console.error("Auth Error:", err);
      }
      
      let errorText = 'حدث خطأ غير متوقع في النظام.';
      
      switch (err.message) {
        case 'MISSING_NAME':
          errorText = 'الاسم مطلوب لإنشاء ملفك الأكاديمي.';
          setTimeout(() => nameRef.current?.focus(), 100);
          break;
        case 'MISSING_EMAIL':
          errorText = 'يرجى إدخال البريد الإلكتروني للمتابعة.';
          setTimeout(() => emailRef.current?.focus(), 100);
          break;
        case 'INVALID_EMAIL_FORMAT':
          errorText = 'صيغة البريد الإلكتروني غير صحيحة.';
          setTimeout(() => emailRef.current?.focus(), 100);
          break;
        case 'MISSING_PASSWORD':
          errorText = 'يرجى إدخال كلمة المرور.';
          setTimeout(() => passwordRef.current?.focus(), 100);
          break;
        case 'WEAK_PASSWORD':
          errorText = 'كلمة المرور قصيرة جداً. يجب أن تكون 6 أحرف على الأقل.';
          setTimeout(() => passwordRef.current?.focus(), 100);
          break;
        case 'INVALID_BETA_CODE':
          errorText = 'كود الدعوة (Beta) غير صحيح. النظام حالياً متاح للمدعوين فقط.';
          setTimeout(() => betaCodeRef.current?.focus(), 100);
          break;
        case 'EMAIL_EXISTS':
          errorText = 'هذا البريد مسجل مسبقاً. هل تحاول تسجيل الدخول؟';
          setTimeout(() => emailRef.current?.focus(), 100);
          break;
        case 'USER_NOT_FOUND':
          errorText = 'لم نعثر على حساب بهذا البريد. تأكد من البيانات أو أنشئ حساباً جديداً.';
          setTimeout(() => emailRef.current?.focus(), 100);
          break;
        default:
          errorText = 'تعذر الاتصال بالخادم. تحقق من اتصال الإنترنت وحاول مجدداً.';
      }
      
      setMessage({ text: errorText, type: 'error' });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 sm:p-8 bg-[#010304] relative overflow-hidden font-['Tajawal']" dir="rtl">
       {/* Background Elements */}
       <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-[-20%] right-[-10%] w-[800px] h-[800px] bg-[#fbbf24]/5 rounded-full blur-[150px] animate-pulse"></div>
          <div className="absolute bottom-[-10%] left-[-10%] w-[600px] h-[600px] bg-[#00d2ff]/5 rounded-full blur-[150px] animate-pulse" style={{animationDelay: '2s'}}></div>
          <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/stardust.png')] opacity-10"></div>
       </div>

       <div className="w-full max-w-6xl z-10 grid grid-cols-1 lg:grid-cols-2 bg-black/40 backdrop-blur-2xl rounded-[40px] border border-white/5 shadow-2xl overflow-hidden relative">
          
          {/* Right Panel (Hero & Demo) - Actually Right in RTL */}
          <div className="relative p-10 lg:p-16 flex flex-col justify-between bg-gradient-to-br from-[#0a0a0a] to-[#050505] border-l border-white/5">
             <div className="absolute inset-0 bg-grid-white/[0.02] bg-[length:32px_32px]"></div>
             
             <div className="relative z-10">
                <div className="w-16 h-16 bg-gradient-to-tr from-[#fbbf24] to-orange-600 rounded-2xl flex items-center justify-center text-3xl shadow-[0_0_30px_rgba(251,191,36,0.3)] mb-8">
                   ⚛️
                </div>
                <h1 className="text-4xl md:text-5xl font-black text-white mb-4 tracking-tighter">
                  المركز <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#fbbf24] to-orange-400">السوري</span> للعلوم
                </h1>
                <p className="text-gray-400 text-lg max-w-md leading-relaxed">
                  المنصة العلمية الأولى في سوريا المدعومة بالذكاء الاصطناعي التوليدي.
                </p>
             </div>

             <div className="relative z-10 mt-12 space-y-6">
               <div className="p-6 rounded-3xl bg-white/5 border border-white/5 hover:border-[#fbbf24]/20 transition-all group">
                 <h3 className="text-xs font-black text-gray-500 uppercase tracking-widest mb-4 flex items-center gap-2">
                   <Sparkles className="w-4 h-4 text-[#fbbf24]" />
                   وصول سريع (Demo)
                 </h3>
                 <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                   <button 
                     onClick={() => handleDemoLogin('student')}
                     disabled={isLoading}
                     className="flex items-center gap-3 p-3 rounded-2xl bg-white/5 hover:bg-[#fbbf24] group/btn transition-all border border-white/5"
                   >
                     <div className="w-10 h-10 rounded-xl bg-black/40 flex items-center justify-center text-lg group-hover/btn:bg-black/20 group-hover/btn:text-black transition-colors">🎓</div>
                     <div className="text-right">
                       <p className="text-xs font-bold text-white group-hover/btn:text-black">طالب (Beta)</p>
                       <p className="text-[9px] text-gray-500 group-hover/btn:text-black/60">تجربة المنهج</p>
                     </div>
                   </button>
                   
                   <button 
                     onClick={() => handleDemoLogin('admin')}
                     disabled={isLoading}
                     className="flex items-center gap-3 p-3 rounded-2xl bg-white/5 hover:bg-white group/btn transition-all border border-white/5"
                   >
                     <div className="w-10 h-10 rounded-xl bg-black/40 flex items-center justify-center text-lg group-hover/btn:bg-black/20 group-hover/btn:text-black transition-colors">🛡️</div>
                     <div className="text-right">
                       <p className="text-xs font-bold text-white group-hover/btn:text-black">المشرف</p>
                       <p className="text-[9px] text-gray-500 group-hover/btn:text-black/60">إدارة النظام</p>
                     </div>
                   </button>
                 </div>
               </div>
             </div>
             
             <div className="relative z-10 mt-10 text-[10px] text-gray-600 font-medium">
               &copy; 2026 Syrian Science Center. Powered by Gemini 2.0
             </div>
          </div>

          {/* Left Panel (Form) */}
          <div className="p-10 lg:p-16 flex flex-col justify-center bg-white/[0.01]">
             <div className="mb-8">
               <h2 className="text-3xl font-black text-white mb-2">{isSignUp ? 'حساب جديد' : 'تسجيل الدخول'}</h2>
               <p className="text-gray-500 text-sm">
                 {isSignUp ? 'انضم لنخبة طلاب العلوم.' : 'مرحباً بعودتك إلى مساحتك التعليمية.'}
               </p>
             </div>

             {message.text && (
                <div className={`p-4 mb-6 rounded-2xl text-xs font-bold flex items-start gap-3 animate-fadeIn transition-all ${message.type === 'error' ? 'bg-red-500/10 text-red-400 border border-red-500/20' : 'bg-green-500/10 text-green-400 border border-green-500/20'}`}>
                  {message.type === 'error' ? <XCircle className="w-5 h-5 shrink-0" /> : <CheckCircle2 className="w-5 h-5 shrink-0" />}
                  <span className="leading-5">{message.text}</span>
                </div>
             )}

             <form onSubmit={handleSubmit} className="space-y-4">
               {isSignUp && (
                 <>
                   <div className="relative group">
                     <UserIcon className="absolute top-1/2 right-4 -translate-y-1/2 w-4 h-4 text-gray-500 group-focus-within:text-[#fbbf24] transition-colors" />
                     <input 
                       ref={nameRef}
                       type="text" 
                       value={name} 
                       onChange={e => setName(e.target.value)} 
                       className={`w-full bg-black/20 border rounded-xl pr-12 pl-4 py-4 text-white outline-none transition-all text-sm font-bold placeholder-gray-700 ${message.type === 'error' && message.text.includes('الاسم') ? 'border-red-500/50 focus:border-red-500' : 'border-white/10 focus:border-[#fbbf24]'}`}
                       placeholder="الاسم الكامل"
                     />
                   </div>
                   
                   <div className="grid grid-cols-2 gap-4">
                     <div className="relative group">
                       <School className="absolute top-1/2 right-4 -translate-y-1/2 w-4 h-4 text-gray-500 group-focus-within:text-[#fbbf24] transition-colors" />
                       <select 
                          value={grade} 
                          onChange={e => setGrade(e.target.value)}
                          className="w-full bg-black/20 border border-white/10 rounded-xl pr-12 pl-4 py-4 text-white outline-none focus:border-[#fbbf24] transition-all text-sm font-bold appearance-none"
                        >
                          <option value="10" className="bg-black">الصف 10</option>
                          <option value="11" className="bg-black">الصف 11</option>
                          <option value="12" className="bg-black">الصف 12</option>
                        </select>
                     </div>
                     <div className="relative group">
                       <Key className="absolute top-1/2 right-4 -translate-y-1/2 w-4 h-4 text-gray-500 group-focus-within:text-[#fbbf24] transition-colors" />
                       <input 
                         ref={betaCodeRef}
                         type="text" 
                         value={betaCode} 
                         onChange={e => setBetaCode(e.target.value)} 
                         className={`w-full bg-black/20 border rounded-xl pr-12 pl-4 py-4 text-[#fbbf24] outline-none transition-all text-sm font-bold placeholder-gray-700 ${message.type === 'error' && message.text.includes('كود') ? 'border-red-500/50 focus:border-red-500' : 'border-white/10 focus:border-[#fbbf24]'}`}
                         placeholder="كود الدعوة"
                       />
                     </div>
                   </div>
                 </>
               )}

               <div className="relative group">
                 <Mail className="absolute top-1/2 right-4 -translate-y-1/2 w-4 h-4 text-gray-500 group-focus-within:text-[#fbbf24] transition-colors" />
                 <input 
                   ref={emailRef}
                   type="email" 
                   value={email} 
                   onChange={e => setEmail(e.target.value)} 
                   className={`w-full bg-black/20 border rounded-xl pr-12 pl-4 py-4 text-white outline-none transition-all text-sm font-bold placeholder-gray-700 ${message.type === 'error' && message.text.includes('البريد') ? 'border-red-500/50 focus:border-red-500' : 'border-white/10 focus:border-[#fbbf24]'}`}
                   placeholder="البريد الإلكتروني"
                   autoComplete="email"
                 />
               </div>

               <div className="relative group">
                 <Lock className="absolute top-1/2 right-4 -translate-y-1/2 w-4 h-4 text-gray-500 group-focus-within:text-[#fbbf24] transition-colors" />
                 <input 
                   ref={passwordRef}
                   type="password" 
                   value={password} 
                   onChange={e => setPassword(e.target.value)} 
                   className={`w-full bg-black/20 border rounded-xl pr-12 pl-4 py-4 text-white outline-none transition-all text-sm font-bold placeholder-gray-700 ${message.type === 'error' && message.text.includes('كلمة المرور') ? 'border-red-500/50 focus:border-red-500' : 'border-white/10 focus:border-[#fbbf24]'}`}
                   placeholder="كلمة المرور"
                 />
               </div>

               <button 
                 type="submit" 
                 disabled={isLoading}
                 className="w-full py-4 mt-6 bg-[#fbbf24] hover:bg-[#f59e0b] text-black rounded-xl font-black text-sm uppercase tracking-widest transition-all shadow-[0_0_30px_rgba(251,191,36,0.3)] hover:shadow-[0_0_50px_rgba(251,191,36,0.5)] hover:scale-[1.02] active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
               >
                 {isLoading ? (
                    <div className="w-5 h-5 border-2 border-black/30 border-t-black rounded-full animate-spin" />
                 ) : (
                    <>
                      {isSignUp ? 'إنشاء الحساب' : 'الدخول للمنصة'}
                      <ArrowRight className="w-4 h-4" />
                    </>
                 )}
               </button>
             </form>

             <div className="mt-8 pt-8 border-t border-white/5 flex flex-col items-center gap-4">
               <p className="text-xs text-gray-500">
                 {isSignUp ? 'لديك حساب بالفعل؟' : 'ليس لديك حساب؟'}
                 <button 
                   onClick={() => { setIsSignUp(!isSignUp); setMessage({text:'', type:''}); }}
                   className="text-[#fbbf24] font-bold mx-2 hover:underline underline-offset-4"
                 >
                   {isSignUp ? 'تسجيل الدخول' : 'إنشاء حساب جديد'}
                 </button>
               </p>
               
               <button onClick={onBack} className="text-[10px] font-black text-gray-600 hover:text-white uppercase tracking-widest transition-colors">
                  العودة للرئيسية
               </button>
             </div>
          </div>
       </div>
    </div>
  );
};

export default Auth;

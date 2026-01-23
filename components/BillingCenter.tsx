
import React, { useState, useEffect } from 'react';
import { User, Invoice, SubscriptionPlan, PaymentSettings } from '../types';
import { PRICING_PLANS } from '../constants';
import { dbService } from '../services/db';
import { 
  MessageCircle, 
  Camera, 
  CheckCircle2, 
  AlertCircle, 
  Smartphone, 
  Send, 
  ArrowRight, 
  ShieldCheck, 
  Zap, 
  RefreshCw, 
  Copy,
  ExternalLink
} from 'lucide-react';

interface BillingCenterProps {
  user: User;
  onUpdateUser: (user: User) => void;
  onViewCertificate?: (invoice: Invoice) => void;
}

const BillingCenter: React.FC<BillingCenterProps> = ({ user, onUpdateUser, onViewCertificate }) => {
  const [step, setStep] = useState<'PLANS' | 'GATEWAY' | 'MANUAL_PAY' | 'RESULT'>('PLANS');
  const [activeInvoice, setActiveInvoice] = useState<Invoice | null>(null);
  const [paymentSettings, setPaymentSettings] = useState<PaymentSettings | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [finalResult, setFinalResult] = useState<'SUCCESS' | 'FAIL'>('SUCCESS');

  useEffect(() => {
    const fetchSettings = async () => {
      const settings = await dbService.getPaymentSettings();
      setPaymentSettings(settings);
    };
    fetchSettings();
  }, []);

  const handleInitiate = async (plan: SubscriptionPlan) => {
    setIsProcessing(true);
    try {
      // استخدام السعر الديناميكي من قاعدة البيانات
      const dynamicPrice = plan.tier === 'premium' 
        ? (paymentSettings?.planPrices.premium || plan.price) 
        : (paymentSettings?.planPrices.basic || plan.price);

      const invoice = await dbService.initiatePayment(user.uid, plan.id, dynamicPrice);
      setActiveInvoice(invoice);
      
      setTimeout(() => {
        setIsProcessing(false);
        if (paymentSettings?.isOnlinePaymentEnabled) {
          setStep('GATEWAY');
        } else {
          setStep('MANUAL_PAY');
        }
      }, 1000);
    } catch (e) {
      setIsProcessing(false);
      alert("حدث خطأ أثناء تهيئة عملية الدفع.");
    }
  };

  const openWhatsApp = () => {
    if (!activeInvoice) return;
    const phoneNumber = "965" + (paymentSettings?.womdaPhoneNumber || "55315661");
    const planName = activeInvoice.planId === 'plan_premium' ? 'باقة التفوق' : 'الباقة الأساسية';
    const message = encodeURIComponent(`مرحباً إدارة فيزياء الكويت،\nلقد قمت بتحويل مبلغ ${activeInvoice.amount} د.ك عبر خدمة ومض للاشتراك في ${planName}.\n\nرقم الفاتورة المرجعي: ${activeInvoice.trackId}\nمرفق لكم صورة إيصال الدفع للتفعيل.`);
    window.open(`https://wa.me/${phoneNumber}?text=${message}`, '_blank');
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    alert("تم نسخ الرقم بنجاح!");
  };

  // --- واجهة بوابة الدفع الإلكتروني (Sandbox) ---
  if (step === 'GATEWAY' && activeInvoice) {
    return (
      <div className="min-h-screen fixed inset-0 z-[200] bg-[#f4f4f4] flex items-center justify-center font-['Tajawal'] text-black p-4">
        <div className="w-full max-w-xl bg-white shadow-2xl rounded-2xl overflow-hidden border border-gray-200 animate-slideUp">
           <header className="bg-gray-800 p-6 flex justify-between items-center text-white">
              <span className="font-black text-lg">بوابة الدفع (Kuwait Payments)</span>
              <div className="text-right">
                 <p className="text-[10px] font-bold opacity-80 uppercase tracking-widest text-white">التاجر: المركز السوري للعلوم</p>
                 <p className="text-sm font-black text-white">اتصال آمن ومجفر</p>
              </div>
           </header>

           <div className="p-8 space-y-6">
              <div className="bg-blue-50 p-6 rounded-xl border border-blue-100 flex justify-between items-center">
                 <div className="text-right">
                    <p className="text-[10px] text-gray-500 font-bold uppercase mb-1">المبلغ الإجمالي</p>
                    <p className="text-3xl font-black text-gray-800">{activeInvoice.amount.toLocaleString()} د.ك</p>
                 </div>
                 <div className="text-left text-xs text-gray-500 font-mono">
                    <p>Track ID: {activeInvoice.trackId}</p>
                 </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                 <button 
                  onClick={() => setStep('RESULT')} 
                  className="bg-gray-800 text-white py-5 rounded-xl font-black text-sm uppercase tracking-widest hover:bg-black transition-all shadow-xl"
                 >
                   تأكيد الدفع (تجريبي)
                 </button>
                 <button 
                  onClick={() => setStep('PLANS')}
                  className="bg-gray-100 text-gray-600 py-5 rounded-xl font-black text-sm uppercase tracking-widest hover:bg-gray-200 transition-all"
                 >
                   إلغاء
                 </button>
              </div>
           </div>
        </div>
      </div>
    );
  }

  // --- واجهة الدفع اليدوي عبر ومض ---
  if (step === 'MANUAL_PAY' && activeInvoice) {
    return (
      <div className="max-w-2xl mx-auto py-12 px-6 font-['Tajawal'] text-white animate-fadeIn text-right" dir="rtl">
        <button onClick={() => setStep('PLANS')} className="mb-10 flex items-center gap-3 text-gray-500 hover:text-white font-black text-xs uppercase tracking-widest transition-all group"> 
          <ArrowRight className="group-hover:translate-x-2 transition-transform" /> العودة للباقات 
        </button>

        <div className="glass-panel p-10 md:p-14 rounded-[60px] border-amber-500/20 bg-black/40 shadow-3xl relative overflow-hidden">
            <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-amber-500 to-yellow-600"></div>
            
            <header className="text-center mb-12">
                <div className="w-20 h-20 bg-amber-500/10 border-2 border-amber-500/30 rounded-[30px] flex items-center justify-center mx-auto mb-6 text-amber-500 shadow-[0_0_40px_rgba(245,158,11,0.2)]">
                    <Smartphone size={32} />
                </div>
                <h2 className="text-4xl font-black text-white italic tracking-tighter">الدفع عبر خدمة <span className="text-amber-500">ومض</span></h2>
                <p className="text-gray-500 mt-4 font-medium leading-relaxed">يرجى اتباع الخطوات البسيطة التالية لتفعيل اشتراكك يدوياً في ثوانٍ.</p>
            </header>

            <div className="space-y-8">
                {/* الخطوة 1: التحويل عبر ومض */}
                <div className="bg-white/[0.03] border border-white/5 p-8 rounded-[35px] relative group hover:bg-white/[0.05] transition-all">
                    <span className="absolute -top-4 -right-4 w-10 h-10 bg-amber-500 text-black rounded-full flex items-center justify-center font-black shadow-lg">1</span>
                    <h3 className="text-xl font-black text-white mb-6">حوّل المبلغ المطلوب</h3>
                    <div className="flex flex-col md:flex-row justify-between items-center gap-6 p-6 bg-black/60 rounded-3xl border border-amber-500/20 shadow-inner">
                        <div className="text-right">
                            <p className="text-[10px] font-black text-gray-500 uppercase mb-1">المبلغ المراد تحويله</p>
                            <p className="text-4xl font-black text-[#fbbf24] tabular-nums">{activeInvoice.amount} <span className="text-sm">د.ك</span></p>
                        </div>
                        <div className="text-right">
                            <p className="text-[10px] font-black text-gray-500 uppercase mb-1">رقم الهاتف (ومض / Womda)</p>
                            <div className="flex items-center gap-3">
                                <p className="text-2xl font-black text-white font-mono tracking-tighter">{paymentSettings?.womdaPhoneNumber || '55315661'}</p>
                                <button onClick={() => copyToClipboard(paymentSettings?.womdaPhoneNumber || '55315661')} className="p-2 bg-white/5 rounded-lg text-gray-400 hover:text-white transition-all"><Copy size={16}/></button>
                            </div>
                        </div>
                    </div>
                </div>

                {/* الخطوة 2: التصوير */}
                <div className="bg-white/[0.03] border border-white/5 p-8 rounded-[35px] relative group hover:bg-white/[0.05] transition-all">
                    <span className="absolute -top-4 -right-4 w-10 h-10 bg-amber-500 text-black rounded-full flex items-center justify-center font-black shadow-lg">2</span>
                    <h3 className="text-xl font-black text-white mb-4 flex items-center gap-3">
                         صوّر الفاتورة <Camera size={20} className="text-amber-500"/>
                    </h3>
                    <p className="text-sm text-gray-400 leading-relaxed italic">قم بأخذ "لقطة شاشة" (Screenshot) واضحة تظهر إتمام عملية التحويل بنجاح للمبلغ المحدد.</p>
                </div>

                {/* الخطوة 3: الإرسال للتفعيل */}
                <div className="bg-white/[0.03] border border-white/5 p-8 rounded-[35px] relative group hover:bg-white/[0.05] transition-all">
                    <span className="absolute -top-4 -right-4 w-10 h-10 bg-amber-500 text-black rounded-full flex items-center justify-center font-black shadow-lg">3</span>
                    <h3 className="text-xl font-black text-white mb-6">أرسل الصورة لتفعيل حسابك</h3>
                    <button 
                        onClick={openWhatsApp}
                        className="w-full py-6 bg-[#25D366] text-white rounded-3xl font-black text-sm uppercase tracking-[0.1em] flex items-center justify-center gap-4 hover:scale-[1.02] active:scale-95 transition-all shadow-[0_20px_50px_rgba(37,211,102,0.2)]"
                    >
                        <MessageCircle size={24} fill="currentColor"/> الإرسال عبر WhatsApp
                    </button>
                </div>
            </div>
        </div>
      </div>
    );
  }

  // --- واجهة النتيجة النهائية ---
  if (step === 'RESULT' && activeInvoice) {
    return (
      <div className="max-w-2xl mx-auto py-20 text-center font-['Tajawal'] text-white">
        <div className={`glass-panel p-16 rounded-[70px] border-2 border-green-500/30 relative overflow-hidden bg-black/40`}>
           <div className="text-9xl mb-10">🏆</div>
           <h2 className="text-4xl font-black mb-4 text-white">شكراً لك!</h2>
           <p className="text-gray-400 text-xl mb-10 leading-relaxed">سيتم تفعيل حسابك بمجرد مراجعة فريقنا لعملية الدفع.</p>
           
           <div className="flex gap-4 justify-center">
              <button onClick={() => window.dispatchEvent(new CustomEvent('change-view', { detail: { view: 'dashboard' } }))} className="bg-white text-black px-12 py-5 rounded-[30px] font-black text-xs uppercase tracking-widest hover:scale-105 transition-all shadow-2xl">
                 العودة للرئيسية
              </button>
           </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto py-12 px-6 animate-fadeIn font-['Tajawal'] text-white text-right" dir="rtl">
      <header className="mb-20 text-center">
        <h2 className="text-6xl font-black mb-4 tracking-tighter">باقات <span className="text-[#fbbf24] italic text-glow">التفوق</span></h2>
        <p className="text-gray-500 text-xl font-medium italic">استثمر في مستقبلك العلمي مع أقوى محتوى فيزياء في الكويت.</p>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
        {PRICING_PLANS.map(plan => {
          // السعر الديناميكي من قاعدة البيانات
          const dynamicPrice = plan.tier === 'premium' 
            ? (paymentSettings?.planPrices.premium || plan.price) 
            : (paymentSettings?.planPrices.basic || plan.price);

          return (
            <div key={plan.id} className="glass-panel group p-12 rounded-[60px] border-white/5 hover:border-[#fbbf24]/30 transition-all duration-700 flex flex-col relative overflow-hidden bg-black/20 shadow-2xl">
              <div className="absolute -top-10 -right-10 w-40 h-40 bg-[#fbbf24]/5 rounded-full blur-3xl opacity-0 group-hover:opacity-100 transition-opacity"></div>
              
              <h3 className="text-3xl font-black mb-4">{plan.name}</h3>
              <div className="text-6xl font-black text-[#fbbf24] tracking-tighter mb-10 tabular-nums">
                  {dynamicPrice.toLocaleString()}<span className="text-lg text-gray-500 mr-2">د.ك</span>
              </div>
              
              <ul className="space-y-6 flex-1 text-right border-t border-white/5 pt-10 mb-10">
                 {plan.features.map((f, i) => (
                   <li key={i} className="flex items-center gap-4 text-gray-400 group-hover:text-white transition-colors">
                      <div className="w-5 h-5 rounded-lg bg-emerald-500/10 flex items-center justify-center shrink-0 border border-emerald-500/20">
                          <CheckCircle2 size={12} className="text-emerald-500" />
                      </div>
                      <span className="font-bold text-sm leading-relaxed">{f}</span>
                   </li>
                 ))}
              </ul>

              <button 
                onClick={() => handleInitiate(plan)}
                disabled={isProcessing || user.subscription === plan.tier}
                className={`w-full py-6 rounded-[30px] font-black text-xs uppercase tracking-widest transition-all shadow-2xl flex items-center justify-center gap-3 ${
                  user.subscription === plan.tier 
                    ? 'bg-gray-800 text-gray-500 cursor-default border border-white/5' 
                    : 'bg-[#fbbf24] text-black hover:scale-105 active:scale-95 glow-gold shadow-yellow-500/20'
                }`}
              >
                {isProcessing ? (
                  <>
                    <RefreshCw size={18} className="animate-spin" />
                    جاري التحميل...
                  </>
                ) : user.subscription === plan.tier ? (
                  <>
                    <ShieldCheck size={18} />
                    أنت مشترك بالفعل
                  </>
                ) : (
                  <>
                    <Zap size={18} fill="currentColor" />
                    اشترك الآن
                  </>
                )}
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default BillingCenter;

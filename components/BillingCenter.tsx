
import React, { useState, useEffect } from 'react';
import { User, Invoice, SubscriptionPlan, PaymentSettings } from '../types';
import { dbService } from '../services/db';
import { 
  MessageCircle, 
  Camera, 
  CheckCircle2, 
  Smartphone, 
  ArrowRight, 
  ShieldCheck, 
  Zap, 
  RefreshCw, 
  Copy,
  ExternalLink,
  Lock,
  MessageSquare
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
  const [subscriptionPlans, setSubscriptionPlans] = useState<SubscriptionPlan[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isLoadingPlans, setIsLoadingPlans] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      setIsLoadingPlans(true);
      try {
        const [settings, plans] = await Promise.all([
          dbService.getPaymentSettings(),
          dbService.getSubscriptionPlans()
        ]);
        setPaymentSettings(settings);
        setSubscriptionPlans(plans);
      } catch (e) {
        console.error("Failed to fetch billing data", e);
      } finally {
        setIsLoadingPlans(false);
      }
    };
    fetchData();
  }, []);

  const handleInitiate = async (plan: SubscriptionPlan) => {
    setIsProcessing(true);
    try {
      const dynamicPrice = plan.tier === 'premium' 
        ? (paymentSettings?.planPrices.premium || plan.price) 
        : (paymentSettings?.planPrices.basic || plan.price);

      const invoice = await dbService.initiatePayment(user.uid, plan.id, dynamicPrice);
      setActiveInvoice(invoice);
      
      setTimeout(() => {
        setIsProcessing(false);
        // التوجيه التلقائي بناءً على حالة بوابة الدفع
        if (paymentSettings?.isOnlinePaymentEnabled) {
          setStep('GATEWAY');
        } else {
          setStep('MANUAL_PAY');
        }
      }, 800);
    } catch (e) {
      setIsProcessing(false);
      alert("حدث خطأ أثناء تهيئة عملية الدفع.");
    }
  };

  const openWhatsApp = () => {
    if (!activeInvoice) return;
    const phoneNumber = "965" + (paymentSettings?.womdaPhoneNumber || "55315661");
    const planName = subscriptionPlans.find(p => p.id === activeInvoice.planId)?.name || 'باقة التفوق';
    const message = encodeURIComponent(`مرحباً إدارة فيزياء الكويت،\nأنا الطالب: ${user.name}\nأود تفعيل اشتراكي في: ${planName}\n\nرقم الطلب: ${activeInvoice.trackId}\nلقد قمت بالتحويل عبر ومض، مرفق لكم الإيصال.`);
    window.open(`https://wa.me/${phoneNumber}?text=${message}`, '_blank');
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    alert("تم نسخ الرقم بنجاح!");
  };

  if (isLoadingPlans) {
    return (
        <div className="py-40 text-center animate-pulse flex flex-col items-center">
            <RefreshCw className="w-16 h-16 text-[#fbbf24] animate-spin mb-6" />
            <p className="text-gray-500 font-black uppercase tracking-widest text-xs">جاري جلب الباقات المحدثة...</p>
        </div>
    );
  }

  if (step === 'GATEWAY' && activeInvoice) {
    return (
      <div className="min-h-screen fixed inset-0 z-[200] bg-[#f4f4f4] flex items-center justify-center font-['Tajawal'] text-black p-4">
        <div className="w-full max-w-xl bg-white shadow-2xl rounded-2xl overflow-hidden border border-gray-200 animate-slideUp">
           <header className="bg-gray-800 p-6 flex justify-between items-center text-white">
              <span className="font-black text-lg">بوابة الدفع الآمنة</span>
              <div className="text-right">
                 <p className="text-[10px] font-bold opacity-80 uppercase tracking-widest text-white">SSC PAYMENTS</p>
              </div>
           </header>
           <div className="p-8 space-y-6 text-right" dir="rtl">
              <div className="bg-blue-50 p-6 rounded-xl border border-blue-100 flex justify-between items-center">
                 <div className="text-right">
                    <p className="text-[10px] text-gray-500 font-bold uppercase mb-1">المبلغ الإجمالي</p>
                    <p className="text-3xl font-black text-gray-800 tabular-nums">{activeInvoice.amount} د.ك</p>
                 </div>
                 <div className="text-left text-xs text-gray-400 font-mono">
                    <p>#{activeInvoice.trackId}</p>
                 </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                 <button onClick={() => setStep('RESULT')} className="bg-[#0A2540] text-white py-5 rounded-xl font-black text-sm uppercase tracking-widest hover:bg-black transition-all shadow-xl">تأكيد الدفع</button>
                 <button onClick={() => setStep('PLANS')} className="bg-gray-100 text-gray-600 py-5 rounded-xl font-black text-sm uppercase tracking-widest hover:bg-gray-200 transition-all">إلغاء</button>
              </div>
           </div>
        </div>
      </div>
    );
  }

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
                <h2 className="text-4xl font-black text-white italic tracking-tighter">التفعيل السريع عبر <span className="text-amber-500">ومض</span></h2>
                <p className="text-gray-500 mt-4 font-medium leading-relaxed italic">بوابة الدفع الإلكتروني معطلة حالياً للإصلاح، يرجى التحويل يدوياً للتفعيل الفوري.</p>
            </header>
            <div className="space-y-8">
                <div className="bg-white/[0.03] border border-white/5 p-8 rounded-[35px] relative group hover:bg-white/[0.05] transition-all">
                    <span className="absolute -top-4 -right-4 w-10 h-10 bg-amber-500 text-black rounded-full flex items-center justify-center font-black shadow-lg">1</span>
                    <h3 className="text-xl font-black text-white mb-6">حوّل قيمة الباقة</h3>
                    <div className="flex flex-col md:flex-row justify-between items-center gap-6 p-6 bg-black/60 rounded-3xl border border-amber-500/20 shadow-inner">
                        <div className="text-right">
                            <p className="text-[10px] font-black text-gray-500 uppercase mb-1">المبلغ</p>
                            <p className="text-4xl font-black text-[#fbbf24] tabular-nums">{activeInvoice.amount} <span className="text-sm">د.ك</span></p>
                        </div>
                        <div className="text-right">
                            <p className="text-[10px] font-black text-gray-500 uppercase mb-1">رقم الهاتف (Womda)</p>
                            <div className="flex items-center gap-3">
                                <p className="text-2xl font-black text-white font-mono tracking-tighter">{paymentSettings?.womdaPhoneNumber || '55315661'}</p>
                                <button onClick={() => copyToClipboard(paymentSettings?.womdaPhoneNumber || '55315661')} className="p-2 bg-white/5 rounded-lg text-gray-400 hover:text-white transition-all"><Copy size={16}/></button>
                            </div>
                        </div>
                    </div>
                </div>
                <div className="bg-white/[0.03] border border-white/5 p-8 rounded-[35px] relative group hover:bg-white/[0.05] transition-all">
                    <span className="absolute -top-4 -right-4 w-10 h-10 bg-amber-500 text-black rounded-full flex items-center justify-center font-black shadow-lg">2</span>
                    <h3 className="text-xl font-black text-white mb-6 flex items-center gap-3">أرسل الإيصال عبر واتساب</h3>
                    <button onClick={openWhatsApp} className="w-full py-6 bg-[#25D366] text-white rounded-3xl font-black text-sm uppercase tracking-[0.1em] flex items-center justify-center gap-4 hover:scale-[1.02] active:scale-95 transition-all shadow-[0_20px_50px_rgba(37,211,102,0.2)]">
                        <MessageCircle size={24} fill="currentColor"/> إرسال للإدارة للتفعيل الفوري
                    </button>
                    <p className="text-[10px] text-gray-500 mt-4 text-center">سيتم مراجعة الطلب وتفعيل الحساب خلال 10 دقائق من الإرسال.</p>
                </div>
            </div>
        </div>
      </div>
    );
  }

  if (step === 'RESULT' && activeInvoice) {
    return (
      <div className="max-w-2xl mx-auto py-20 text-center font-['Tajawal'] text-white">
        <div className={`glass-panel p-16 rounded-[70px] border-2 border-green-500/30 relative overflow-hidden bg-black/40`}>
           <div className="text-9xl mb-10">🏆</div>
           <h2 className="text-4xl font-black mb-4 text-white">شكراً لثقتكم!</h2>
           <p className="text-gray-400 text-xl mb-10 leading-relaxed">سيتم تفعيل المزايا المتقدمة في حسابك فور مراجعة العملية.</p>
           <button onClick={() => window.dispatchEvent(new CustomEvent('change-view', { detail: { view: 'dashboard' } }))} className="bg-white text-black px-12 py-5 rounded-[30px] font-black text-xs uppercase tracking-widest hover:scale-105 transition-all shadow-2xl">العودة للوحة التحكم</button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto py-12 px-6 animate-fadeIn font-['Tajawal'] text-white text-right" dir="rtl">
      <header className="mb-20 text-center">
        <h2 className="text-6xl font-black mb-4 tracking-tighter italic">باقات <span className="text-[#fbbf24] text-glow-gold">التفوق العلمي</span></h2>
        <p className="text-gray-500 text-xl font-medium max-w-2xl mx-auto leading-relaxed">استثمر في مستقبلك مع أقوى محتوى تعليمي في الفيزياء والكيمياء.</p>
        
        {!paymentSettings?.isOnlinePaymentEnabled && (
            <div className="mt-8 bg-amber-500/10 border-2 border-amber-500/20 p-4 rounded-3xl inline-flex items-center gap-4 animate-slideUp">
                <div className="w-10 h-10 bg-amber-500 rounded-2xl flex items-center justify-center text-black shadow-lg">
                    <Zap size={20} fill="currentColor" />
                </div>
                <div className="text-right">
                    <p className="text-amber-400 font-black text-sm">خدمة الدفع اليدوي (ومض) نشطة</p>
                    <p className="text-[10px] text-gray-500">سيتم توجيهك للواتساب للتفعيل السريع بعد اختيار الباقة.</p>
                </div>
            </div>
        )}
      </header>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
        {subscriptionPlans.map(plan => {
          const dynamicPrice = plan.tier === 'premium' 
            ? (paymentSettings?.planPrices.premium || plan.price) 
            : (paymentSettings?.planPrices.basic || plan.price);

          return (
            <div key={plan.id} className="glass-panel group p-12 rounded-[60px] border-white/5 hover:border-[#fbbf24]/30 transition-all duration-700 flex flex-col relative overflow-hidden bg-black/20 shadow-2xl">
              <div className="absolute -top-10 -right-10 w-40 h-40 bg-[#fbbf24]/5 rounded-full blur-3xl opacity-0 group-hover:opacity-100 transition-opacity"></div>
              <div className="flex justify-between items-start mb-6">
                <h3 className="text-3xl font-black">{plan.name}</h3>
                {plan.tier === 'premium' && <span className="bg-amber-400 text-black px-3 py-1 rounded-full text-[8px] font-black uppercase tracking-widest">Recommended</span>}
              </div>
              <div className="text-6xl font-black text-[#fbbf24] tracking-tighter mb-10 tabular-nums">
                  {dynamicPrice.toLocaleString()}<span className="text-lg text-gray-500 mr-2">د.ك</span>
              </div>
              <ul className="space-y-5 flex-1 text-right border-t border-white/5 pt-10 mb-10">
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
                  <><ShieldCheck size={18} /> أنت مشترك بالفعل </>
                ) : !paymentSettings?.isOnlinePaymentEnabled ? (
                  <><MessageSquare size={18} /> اشترك عبر واتساب / ومض </>
                ) : (
                  <><Zap size={18} fill="currentColor" /> اشترك الآن فوري </>
                )}
              </button>
            </div>
          );
        })}
      </div>
      
      {/* Floating Support Link */}
      <div className="mt-20 text-center">
          <p className="text-gray-500 text-sm font-bold mb-4">هل تواجه مشكلة في الاشتراك؟</p>
          <button 
            onClick={() => {
                const phoneNumber = "965" + (paymentSettings?.womdaPhoneNumber || "55315661");
                window.open(`https://wa.me/${phoneNumber}?text=مرحباً، أحتاج مساعدة في تفعيل اشتراكي.`, '_blank');
            }}
            className="flex items-center gap-3 bg-[#25D366]/10 text-[#25D366] px-10 py-4 rounded-full font-black text-xs uppercase border border-[#25D366]/30 hover:bg-[#25D366] hover:text-white transition-all mx-auto"
          >
              <MessageCircle size={18}/> تحدث مع الدعم الفني مباشرة
          </button>
      </div>
    </div>
  );
};

export default BillingCenter;


import React, { useState, useEffect } from 'react';
import { User, Invoice, SubscriptionPlan, PaymentSettings } from '../types';
import { dbService } from '../services/db';
import { 
  MessageCircle, 
  CheckCircle2, 
  Smartphone, 
  ArrowRight, 
  ShieldCheck, 
  Zap, 
  RefreshCw, 
  MessageSquare,
  Crown
} from 'lucide-react';

interface BillingCenterProps {
  user: User;
  onUpdateUser: (user: User) => void;
  onViewCertificate?: (invoice: Invoice) => void;
}

const BillingCenter: React.FC<BillingCenterProps> = ({ user, onUpdateUser, onViewCertificate }) => {
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

  const handlePlanAction = async (plan: SubscriptionPlan) => {
    const dynamicPrice = plan.tier === 'premium' 
      ? (paymentSettings?.planPrices.premium || plan.price) 
      : (paymentSettings?.planPrices.basic || plan.price);

    // إذا كانت بوابة الدفع معطلة -> توجيه مباشر لواتساب مع تفاصيل الباقة والسعر
    if (!paymentSettings?.isOnlinePaymentEnabled) {
        const phoneNumber = "965" + (paymentSettings?.womdaPhoneNumber || "55315661");
        const message = encodeURIComponent(
            `مرحباً إدارة المركز السوري للعلوم،\n\nأود الاشتراك في: *${plan.name}*\nالقيمة المطلوب دفعها: *${dynamicPrice} د.ك*\n\nبياناتي:\nالأسم: ${user.name}\nالبريد: ${user.email}\nالصف: ${user.grade}\n\nيرجى تزويدي بتعليمات تحويل "ومض" لتفعيل الحساب.`
        );
        window.open(`https://wa.me/${phoneNumber}?text=${message}`, '_blank');
        return;
    }

    // إذا كانت البوابة مفعلة -> متابعة إجراءات الدفع الإلكتروني التقليدية
    setIsProcessing(true);
    try {
      const invoice = await dbService.initiatePayment(user.uid, plan.id, dynamicPrice);
      // التوجيه لواجهة بوابة الدفع (تم تبسيطها للعرض)
      window.dispatchEvent(new CustomEvent('change-view', { detail: { view: 'payment-gateway', invoice } }));
    } catch (e) {
      alert("حدث خطأ أثناء تهيئة عملية الدفع.");
    } finally {
      setIsProcessing(false);
    }
  };

  if (isLoadingPlans) {
    return (
        <div className="py-40 text-center animate-pulse flex flex-col items-center">
            <RefreshCw className="w-16 h-16 text-[#fbbf24] animate-spin mb-6" />
            <p className="text-gray-500 font-black uppercase tracking-widest text-xs">جاري جلب الباقات المحدثة...</p>
        </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto py-12 px-6 animate-fadeIn font-['Tajawal'] text-white text-right" dir="rtl">
      <header className="mb-20 text-center">
        <h2 className="text-6xl font-black mb-4 tracking-tighter italic">باقات <span className="text-[#fbbf24] text-glow-gold">التفوق العلمي</span></h2>
        <p className="text-gray-500 text-xl font-medium max-w-2xl mx-auto leading-relaxed">استثمر في مستقبلك مع أقوى محتوى تعليمي في الفيزياء والكيمياء.</p>
        
        {!paymentSettings?.isOnlinePaymentEnabled && (
            <div className="mt-8 bg-green-500/10 border-2 border-green-500/20 p-5 rounded-3xl inline-flex items-center gap-4 animate-slideUp">
                <div className="w-12 h-12 bg-green-500 rounded-2xl flex items-center justify-center text-white shadow-lg">
                    <MessageCircle size={24} fill="currentColor" />
                </div>
                <div className="text-right">
                    <p className="text-green-400 font-black text-sm">خدمة الدفع اليدوي (واتساب / ومض) نشطة</p>
                    <p className="text-[10px] text-gray-500 font-bold">اختر الباقة وسيتم توجيهك للمحادثة لتأكيد التحويل فوراً.</p>
                </div>
            </div>
        )}
      </header>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
        {subscriptionPlans.map(plan => {
          const dynamicPrice = plan.tier === 'premium' 
            ? (paymentSettings?.planPrices.premium || plan.price) 
            : (paymentSettings?.planPrices.basic || plan.price);

          const isCurrentPlan = user.subscription === plan.tier;

          return (
            <div key={plan.id} className={`glass-panel group p-12 rounded-[60px] border-2 transition-all duration-700 flex flex-col relative overflow-hidden bg-black/20 shadow-2xl ${isCurrentPlan ? 'border-green-500/40' : 'border-white/5 hover:border-[#fbbf24]/30'}`}>
              <div className="absolute -top-10 -right-10 w-40 h-40 bg-[#fbbf24]/5 rounded-full blur-3xl opacity-0 group-hover:opacity-100 transition-opacity"></div>
              
              <div className="flex justify-between items-start mb-6">
                <h3 className="text-3xl font-black">{plan.name}</h3>
                {plan.tier === 'premium' && !isCurrentPlan && <span className="bg-amber-400 text-black px-3 py-1 rounded-full text-[8px] font-black uppercase tracking-widest">الأكثر طلباً</span>}
                {isCurrentPlan && <span className="bg-green-500 text-white px-3 py-1 rounded-full text-[8px] font-black uppercase tracking-widest">باقتك الحالية</span>}
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
                onClick={() => handlePlanAction(plan)}
                disabled={isProcessing || isCurrentPlan}
                className={`w-full py-6 rounded-[30px] font-black text-xs uppercase tracking-widest transition-all shadow-2xl flex items-center justify-center gap-3 ${
                  isCurrentPlan 
                    ? 'bg-green-500/20 text-green-500 cursor-default border border-green-500/20' 
                    : !paymentSettings?.isOnlinePaymentEnabled 
                        ? 'bg-green-500 text-white hover:scale-105 active:scale-95 shadow-green-500/20' 
                        : 'bg-[#fbbf24] text-black hover:scale-105 active:scale-95 glow-gold shadow-yellow-500/20'
                }`}
              >
                {isProcessing ? (
                  <RefreshCw size={18} className="animate-spin" />
                ) : isCurrentPlan ? (
                  <><ShieldCheck size={18} /> أنت مشترك بالفعل </>
                ) : !paymentSettings?.isOnlinePaymentEnabled ? (
                  <><MessageCircle size={18} fill="currentColor" /> اشترك الآن عبر واتساب </>
                ) : (
                  <><Zap size={18} fill="currentColor" /> تفعيل اشتراك فوري </>
                )}
              </button>
            </div>
          );
        })}
      </div>
      
      <div className="mt-20 p-10 bg-white/[0.02] border border-white/5 rounded-[50px] text-center max-w-2xl mx-auto">
          <p className="text-gray-500 text-sm font-bold mb-6">هل لديك استفسار حول طرق الدفع أو واجهت مشكلة في التحويل؟</p>
          <button 
            onClick={() => {
                const phoneNumber = "965" + (paymentSettings?.womdaPhoneNumber || "55315661");
                window.open(`https://wa.me/${phoneNumber}?text=مرحباً، أحتاج مساعدة بخصوص تفعيل باقتي التعليمية.`, '_blank');
            }}
            className="flex items-center gap-3 bg-white/5 text-white px-10 py-4 rounded-full font-black text-xs uppercase border border-white/10 hover:bg-white hover:text-black transition-all mx-auto"
          >
              <MessageSquare size={18}/> مراسلة الدعم الفني للمنصة
          </button>
      </div>
    </div>
  );
};

export default BillingCenter;

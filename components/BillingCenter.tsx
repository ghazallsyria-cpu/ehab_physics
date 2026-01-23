
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
  Crown,
  FileText,
  Clock,
  ExternalLink,
  ChevronLeft
} from 'lucide-react';
import PaymentCertificate from './PaymentCertificate';

interface BillingCenterProps {
  user: User;
  onUpdateUser: (user: User) => void;
}

const DEFAULT_PLANS: SubscriptionPlan[] = [
  {
    id: 'plan_premium',
    name: 'باقة التفوق (Premium)',
    price: 35,
    tier: 'premium',
    duration: 'term',
    features: ['دخول كامل لجميع الدروس', 'مشاهدة فيديوهات Veo', 'بنك الأسئلة المطور', 'تواصل مباشر مع المعلم']
  },
  {
    id: 'plan_basic',
    name: 'الباقة الأساسية (Basic)',
    price: 0,
    tier: 'free',
    duration: 'monthly',
    features: ['معاينة الوحدة الأولى', 'المساعد الذكي المحدود', 'المقالات العلمية']
  }
];

const BillingCenter: React.FC<BillingCenterProps> = ({ user, onUpdateUser }) => {
  const [paymentSettings, setPaymentSettings] = useState<PaymentSettings | null>(null);
  const [subscriptionPlans, setSubscriptionPlans] = useState<SubscriptionPlan[]>([]);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isLoadingPlans, setIsLoadingPlans] = useState(true);
  const [selectedInvoiceForCert, setSelectedInvoiceForCert] = useState<Invoice | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      setIsLoadingPlans(true);
      try {
        const [settings, plans, invoiceData] = await Promise.all([
          dbService.getPaymentSettings(),
          dbService.getSubscriptionPlans(),
          dbService.getInvoices(user.uid)
        ]);
        setPaymentSettings(settings);
        setSubscriptionPlans(plans.length > 0 ? plans : DEFAULT_PLANS);
        setInvoices(invoiceData.data);
      } catch (e) {
        console.error("Failed to fetch billing data", e);
        setSubscriptionPlans(DEFAULT_PLANS);
      } finally {
        setIsLoadingPlans(false);
      }
    };
    fetchData();
  }, [user.uid]);

  const handlePlanAction = async (plan: SubscriptionPlan) => {
    const dynamicPrice = plan.tier === 'premium' 
      ? (paymentSettings?.planPrices.premium || plan.price) 
      : (paymentSettings?.planPrices.basic || plan.price);

    // توجيه فوري للواتساب مع الرسالة التفصيلية المطلوبة
    if (!paymentSettings?.isOnlinePaymentEnabled || dynamicPrice > 0) {
        const phoneNumber = "965" + (paymentSettings?.womdaPhoneNumber || "55315661");
        
        const message = encodeURIComponent(
            `مرحباً إدارة المركز السوري للعلوم،\n\n` +
            `أود الاشتراك في: *${plan.name}*\n` +
            `القيمة المطلوب دفعها: *${dynamicPrice} د.ك*\n\n` +
            `بيانات الطالب:\n` +
            `- الأسم: ${user.name}\n` +
            `- الصف: ${user.grade}\n` +
            `- البريد: ${user.email}\n\n` +
            `يرجى تزويدي بتعليمات تحويل "ومض" لتفعيل الحساب فوراً.`
        );
        
        window.open(`https://wa.me/${phoneNumber}?text=${message}`, '_blank');
        
        // تسجيل فاتورة "قيد الانتظار" لإظهارها في سجل الطالب
        await dbService.initiatePayment(user.uid, plan.id, dynamicPrice);
        const invoiceData = await dbService.getInvoices(user.uid);
        setInvoices(invoiceData.data);
        return;
    }

    setIsProcessing(true);
    try {
      const invoice = await dbService.initiatePayment(user.uid, plan.id, dynamicPrice);
      window.dispatchEvent(new CustomEvent('change-view', { detail: { view: 'payment-gateway', invoice } }));
    } catch (e) {
      alert("حدث خطأ أثناء تهيئة عملية الدفع.");
    } finally {
      setIsProcessing(false);
    }
  };

  if (selectedInvoiceForCert) {
      return (
          <div className="animate-fadeIn">
              <button onClick={() => setSelectedInvoiceForCert(null)} className="mb-10 flex items-center gap-3 text-gray-500 hover:text-white font-black text-xs uppercase tracking-widest transition-all">
                  <ChevronLeft /> العودة لمركز الاشتراكات
              </button>
              <PaymentCertificate user={user} invoice={selectedInvoiceForCert} />
          </div>
      );
  }

  if (isLoadingPlans) {
    return (
        <div className="py-40 text-center animate-pulse flex flex-col items-center">
            <RefreshCw className="w-16 h-16 text-[#fbbf24] animate-spin mb-6" />
            <p className="text-gray-500 font-black uppercase tracking-widest text-xs">جاري جلب الباقات المتاحة...</p>
        </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto py-12 px-6 animate-fadeIn font-['Tajawal'] text-white text-right" dir="rtl">
      <header className="mb-20 text-center">
        <h2 className="text-6xl font-black mb-4 tracking-tighter italic">مركز <span className="text-[#fbbf24] text-glow-gold">الاشتراكات</span></h2>
        <p className="text-gray-500 text-xl font-medium max-w-2xl mx-auto leading-relaxed">ادفع قيمة الباقة عبر "ومض" وراسلنا لتفعيل حسابك فوراً.</p>
        
        <div className="mt-8 bg-green-500/10 border-2 border-green-500/20 p-5 rounded-3xl inline-flex items-center gap-4 animate-slideUp">
            <div className="w-12 h-12 bg-green-500 rounded-2xl flex items-center justify-center text-white shadow-lg">
                <MessageCircle size={24} fill="currentColor" />
            </div>
            <div className="text-right">
                <p className="text-green-400 font-black text-sm">خدمة التفعيل السريع (واتساب / ومض) متاحة</p>
                <p className="text-[10px] text-gray-500 font-bold">اضغط على الباقة وسيتم إرسال كافة التفاصيل للإدارة تلقائياً.</p>
            </div>
        </div>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
        {/* Plans Column */}
        <div className="lg:col-span-8 space-y-10">
            <h3 className="text-2xl font-black mb-6 flex items-center gap-3">
                <Crown className="text-amber-400" /> الباقات التعليمية
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {subscriptionPlans.map(plan => {
                const dynamicPrice = plan.tier === 'premium' 
                    ? (paymentSettings?.planPrices.premium || plan.price) 
                    : (paymentSettings?.planPrices.basic || plan.price);

                const isCurrentPlan = user.subscription === plan.tier;

                return (
                    <div key={plan.id} className={`glass-panel group p-10 rounded-[50px] border-2 transition-all duration-700 flex flex-col relative overflow-hidden bg-black/20 shadow-2xl ${isCurrentPlan ? 'border-green-500/40' : 'border-white/5 hover:border-[#fbbf24]/30'}`}>
                    <div className="absolute -top-10 -right-10 w-40 h-40 bg-[#fbbf24]/5 rounded-full blur-3xl opacity-0 group-hover:opacity-100 transition-opacity"></div>
                    
                    <div className="flex justify-between items-start mb-6">
                        <h3 className="text-2xl font-black">{plan.name}</h3>
                        {isCurrentPlan && <span className="bg-green-500 text-white px-3 py-1 rounded-full text-[8px] font-black uppercase tracking-widest">نشط</span>}
                    </div>

                    <div className="text-5xl font-black text-[#fbbf24] tracking-tighter mb-10 tabular-nums">
                        {dynamicPrice.toLocaleString()}<span className="text-lg text-gray-500 mr-2">د.ك</span>
                    </div>

                    <ul className="space-y-4 flex-1 text-right border-t border-white/5 pt-8 mb-8">
                        {plan.features.map((f, i) => (
                        <li key={i} className="flex items-center gap-3 text-gray-400 group-hover:text-white transition-colors">
                            <CheckCircle2 size={14} className="text-emerald-500 shrink-0" />
                            <span className="font-bold text-xs leading-relaxed">{f}</span>
                        </li>
                        ))}
                    </ul>

                    <button 
                        onClick={() => handlePlanAction(plan)}
                        disabled={isProcessing || isCurrentPlan}
                        className={`w-full py-5 rounded-[25px] font-black text-xs uppercase tracking-widest transition-all shadow-2xl flex items-center justify-center gap-3 ${
                        isCurrentPlan 
                            ? 'bg-gray-800 text-gray-500 cursor-default border border-white/5' 
                            : 'bg-[#fbbf24] text-black hover:scale-105 active:scale-95 shadow-yellow-500/20'
                        }`}
                    >
                        {isProcessing ? (
                        <RefreshCw size={18} className="animate-spin" />
                        ) : isCurrentPlan ? (
                        <><ShieldCheck size={18} /> باقتك الحالية </>
                        ) : (
                        <><MessageCircle size={18} fill="currentColor" /> اشترك الآن عبر واتساب </>
                        )}
                    </button>
                    </div>
                );
                })}
            </div>
        </div>

        {/* Payment History Column */}
        <div className="lg:col-span-4 space-y-8">
            <div className="glass-panel p-8 rounded-[40px] border-white/5 bg-black/40 min-h-[500px] flex flex-col">
                <h3 className="text-xl font-black text-[#00d2ff] mb-8 border-r-4 border-[#00d2ff] pr-4 flex items-center gap-3">
                    <Clock size={20}/> سجل العمليات
                </h3>
                
                <div className="space-y-4 flex-1">
                    {invoices.length > 0 ? invoices.map(inv => (
                        <div key={inv.id} className="p-5 bg-white/[0.02] border border-white/5 rounded-3xl group hover:border-white/20 transition-all">
                            <div className="flex justify-between items-start mb-4">
                                <span className={`text-[8px] font-black px-3 py-1 rounded-full uppercase tracking-tighter ${inv.status === 'PAID' ? 'bg-green-500/10 text-green-400 border-green-500/20' : 'bg-yellow-500/10 text-yellow-400 border border-yellow-500/20'}`}>
                                    {inv.status === 'PAID' ? 'مدفوع ✓' : 'قيد المراجعة ⌛'}
                                </span>
                                <span className="text-[10px] font-mono text-gray-600">#{inv.trackId}</span>
                            </div>
                            <h4 className="text-sm font-bold text-white mb-1">{inv.planId === 'plan_premium' ? 'باقة التفوق' : 'الاشتراك الأساسي'}</h4>
                            <p className="text-[10px] text-gray-500 mb-6 font-bold tabular-nums">{new Date(inv.date).toLocaleDateString('ar-KW')}</p>
                            
                            <div className="flex justify-between items-center pt-4 border-t border-white/5">
                                <p className="text-lg font-black text-white tabular-nums">{inv.amount} <span className="text-xs text-gray-600">د.ك</span></p>
                                {inv.status === 'PAID' && (
                                    <button 
                                        onClick={() => setSelectedInvoiceForCert(inv)}
                                        className="text-[9px] font-black text-[#fbbf24] uppercase tracking-widest flex items-center gap-2 hover:underline"
                                    >
                                        عرض الإيصال <ExternalLink size={10} />
                                    </button>
                                )}
                            </div>
                        </div>
                    )) : (
                        <div className="flex-1 flex flex-col items-center justify-center opacity-20 text-center px-6">
                            <FileText size={48} className="mb-4" />
                            <p className="font-black text-sm uppercase tracking-widest">لا توجد عمليات سابقة</p>
                        </div>
                    )}
                </div>

                <div className="mt-8 p-6 bg-white/5 rounded-[30px] border border-white/5 text-center">
                    <p className="text-[9px] text-gray-500 leading-relaxed italic">يتم تحديث حالة الدفع فور مراجعة التحويل البنكي من قبل الإدارة.</p>
                </div>
            </div>
        </div>
      </div>
      
      <div className="mt-20 p-10 bg-white/[0.02] border border-white/5 rounded-[50px] text-center max-w-2xl mx-auto">
          <p className="text-gray-500 text-sm font-bold mb-6">هل واجهت مشكلة في تحويل "ومض" أو تأخر تفعيل حسابك؟</p>
          <button 
            onClick={() => {
                const phoneNumber = "965" + (paymentSettings?.womdaPhoneNumber || "55315661");
                window.open(`https://wa.me/${phoneNumber}?text=مرحباً، أود الاستفسار عن حالة اشتراكي المالي.`, '_blank');
            }}
            className="flex items-center gap-3 bg-white/5 text-white px-10 py-4 rounded-full font-black text-xs uppercase border border-white/10 hover:bg-white hover:text-black transition-all mx-auto"
          >
              <MessageSquare size={18}/> التواصل المباشر مع المالية
          </button>
      </div>
    </div>
  );
};

export default BillingCenter;

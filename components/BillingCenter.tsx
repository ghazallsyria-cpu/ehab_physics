
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
  ChevronLeft,
  Printer,
  Calendar,
  Phone
} from 'lucide-react';
import PaymentCertificate from './PaymentCertificate';

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

const BillingCenter: React.FC<{ user: User; onUpdateUser: (user: User) => void }> = ({ user, onUpdateUser }) => {
  const [paymentSettings, setPaymentSettings] = useState<PaymentSettings | null>(null);
  const [subscriptionPlans, setSubscriptionPlans] = useState<SubscriptionPlan[]>([]);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  // Fix: Standardized setter name to match common React patterns and fix reference errors
  const [isLoadingPlans, setLoadingPlans] = useState(true);
  const [selectedInvoiceForCert, setSelectedInvoiceForCert] = useState<Invoice | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [settings, plans] = await Promise.all([
          dbService.getPaymentSettings(),
          dbService.getSubscriptionPlans()
        ]);
        setPaymentSettings(settings);
        setSubscriptionPlans(plans.length > 0 ? plans : DEFAULT_PLANS);
      } catch (e) {
        setSubscriptionPlans(DEFAULT_PLANS);
      } finally {
        // Fix: Use correct setter name to match declaration
        setLoadingPlans(false);
      }
    };
    fetchData();

    // مراقبة لحظية للفواتير
    const unsubscribeInvoices = dbService.subscribeToInvoices(user.uid, (updatedInvoices) => {
        setInvoices(updatedInvoices);
    });

    return () => unsubscribeInvoices();
  }, [user.uid]);

  const handlePlanAction = async (plan: SubscriptionPlan) => {
    const dynamicPrice = plan.tier === 'premium' 
      ? (paymentSettings?.planPrices.premium || plan.price) 
      : (paymentSettings?.planPrices.basic || plan.price);

    if (!paymentSettings?.isOnlinePaymentEnabled || dynamicPrice > 0) {
        const phoneNumber = "965" + (paymentSettings?.womdaPhoneNumber || "55315661");
        
        const message = encodeURIComponent(
            `مرحباً إدارة المركز السوري للعلوم،\n\n` +
            `أود الاشتراك في: *${plan.name}*\n` +
            `القيمة المطلوب دفعها: *${dynamicPrice} د.ك*\n\n` +
            `بيانات الطالب:\n` +
            `- الأسم: ${user.name}\n` +
            `- الصف: ${user.grade}\n` +
            `- رقم الهاتف المسجل: ${user.phone || 'غير مسجل'}\n` +
            `- البريد: ${user.email}\n\n` +
            `يرجى تزويدي بتعليمات تحويل "ومض" لتفعيل الحساب فوراً.`
        );
        
        window.open(`https://wa.me/${phoneNumber}?text=${message}`, '_blank');
        
        // تسجيل فاتورة "قيد الانتظار"
        await dbService.initiatePayment(user.uid, plan.id, dynamicPrice);
        return;
    }

    setIsProcessing(true);
    try {
      await dbService.initiatePayment(user.uid, plan.id, dynamicPrice);
    } catch (e) {
      alert("حدث خطأ أثناء تهيئة عملية الدفع.");
    } finally {
      setIsProcessing(false);
    }
  };

  if (selectedInvoiceForCert) {
      return (
          <div className="animate-fadeIn">
              <button onClick={() => setSelectedInvoiceForCert(null)} className="mb-10 flex items-center gap-4 text-gray-500 hover:text-white font-black text-xs uppercase tracking-[0.3em] transition-all group">
                  <ChevronLeft className="group-hover:-translate-x-2 transition-transform" /> العودة لمركز الاشتراكات
              </button>
              <div className="bg-white/5 p-1 rounded-[60px] border border-white/10 shadow-3xl">
                <PaymentCertificate user={user} invoice={selectedInvoiceForCert} />
              </div>
          </div>
      );
  }

  if (isLoadingPlans) {
    return (
        <div className="py-40 text-center animate-pulse flex flex-col items-center">
            <RefreshCw className="w-16 h-16 text-[#fbbf24] animate-spin mb-6" />
            <p className="text-gray-500 font-black uppercase tracking-widest text-xs">جاري جلب بيانات حسابك المالي...</p>
        </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto py-12 px-6 animate-fadeIn font-['Tajawal'] text-white text-right" dir="rtl">
      <header className="mb-20 text-center relative">
        <div className="absolute top-0 right-1/2 translate-x-1/2 w-64 h-64 bg-[#fbbf24]/5 blur-[100px] rounded-full"></div>
        <h2 className="text-6xl md:text-7xl font-black mb-4 tracking-tighter italic">مركز <span className="text-[#fbbf24] text-glow-gold">الاشتراكات</span></h2>
        <p className="text-gray-500 text-xl font-medium max-w-2xl mx-auto leading-relaxed">ادفع قيمة الباقة عبر "ومض" وراسلنا لتفعيل حسابك وإصدار إيصالك الرسمي فوراً.</p>
        
        <div className="mt-10 bg-emerald-500/10 border-2 border-emerald-500/20 p-6 rounded-[40px] inline-flex items-center gap-6 animate-slideUp">
            <div className="w-16 h-16 bg-emerald-500 rounded-[25px] flex items-center justify-center text-black shadow-lg">
                <Smartphone size={32} />
            </div>
            <div className="text-right">
                <p className="text-emerald-400 font-black text-lg">خدمة "ومض" الكويت متاحة</p>
                <div className="flex items-center gap-3 mt-1">
                    <span className="text-xs text-gray-500 font-bold">رقمك المسجل للتفعيل:</span>
                    <span className="text-sm font-black text-white flex items-center gap-1"><Phone size={12} className="text-emerald-400"/> {user.phone || 'يرجى تحديث رقم الهاتف في البروفايل'}</span>
                </div>
            </div>
        </div>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-start">
        {/* Plans Column */}
        <div className="lg:col-span-8 space-y-12">
            <div className="flex items-center gap-4 mb-8 border-r-4 border-amber-400 pr-6">
                <h3 className="text-3xl font-black">الباقات التعليمية</h3>
                <span className="bg-amber-400/10 text-amber-500 px-4 py-1 rounded-full text-[10px] font-black uppercase tracking-widest border border-amber-400/20">تفعيل فوري</span>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {subscriptionPlans.map(plan => {
                const dynamicPrice = plan.tier === 'premium' 
                    ? (paymentSettings?.planPrices.premium || plan.price) 
                    : (paymentSettings?.planPrices.basic || plan.price);

                const isCurrentPlan = user.subscription === plan.tier;

                return (
                    <div key={plan.id} className={`glass-panel group p-12 rounded-[60px] border-2 transition-all duration-700 flex flex-col relative overflow-hidden bg-black/40 shadow-2xl ${isCurrentPlan ? 'border-emerald-500/40 bg-emerald-500/5' : 'border-white/5 hover:border-[#fbbf24]/30'}`}>
                    <div className="absolute -top-10 -right-10 w-40 h-40 bg-[#fbbf24]/5 rounded-full blur-3xl opacity-0 group-hover:opacity-100 transition-opacity"></div>
                    
                    <div className="flex justify-between items-start mb-8">
                        <h3 className="text-3xl font-black leading-none">{plan.name}</h3>
                        {isCurrentPlan && <span className="bg-emerald-500 text-black px-4 py-1.5 rounded-full text-[9px] font-black uppercase tracking-widest shadow-lg">الباقة النشطة</span>}
                    </div>

                    <div className="text-6xl font-black text-[#fbbf24] tracking-tighter mb-12 tabular-nums">
                        {dynamicPrice.toLocaleString()}<span className="text-lg text-gray-500 mr-2 font-bold uppercase">د.ك</span>
                    </div>

                    <ul className="space-y-5 flex-1 text-right border-t border-white/5 pt-10 mb-10">
                        {plan.features.map((f, i) => (
                        <li key={i} className="flex items-center gap-4 text-gray-400 group-hover:text-white transition-colors">
                            <div className="w-5 h-5 rounded-lg bg-emerald-500/10 flex items-center justify-center border border-emerald-500/20">
                                <CheckCircle2 size={12} className="text-emerald-500 shrink-0" />
                            </div>
                            <span className="font-bold text-sm leading-relaxed">{f}</span>
                        </li>
                        ))}
                    </ul>

                    <button 
                        onClick={() => handlePlanAction(plan)}
                        disabled={isProcessing || isCurrentPlan}
                        className={`w-full py-7 rounded-[35px] font-black text-xs uppercase tracking-[0.2em] transition-all shadow-2xl flex items-center justify-center gap-4 ${
                        isCurrentPlan 
                            ? 'bg-gray-800 text-gray-600 cursor-default border border-white/5 shadow-none' 
                            : 'bg-[#fbbf24] text-black hover:scale-105 active:scale-95 shadow-yellow-500/30'
                        }`}
                    >
                        {isProcessing ? (
                        <RefreshCw size={22} className="animate-spin" />
                        ) : isCurrentPlan ? (
                        <><ShieldCheck size={22} /> تم التفعيل بنجاح </>
                        ) : (
                        <><MessageCircle size={22} fill="currentColor" /> اشترك الآن عبر واتساب </>
                        )}
                    </button>
                    </div>
                );
                })}
            </div>
        </div>

        {/* Payment History Column */}
        <div className="lg:col-span-4">
            <div className="glass-panel p-10 rounded-[50px] border-white/5 bg-[#0a1118]/80 min-h-[600px] flex flex-col shadow-3xl">
                <div className="flex items-center gap-4 mb-12 border-b border-white/5 pb-8">
                    <div className="w-12 h-12 bg-blue-500/10 rounded-2xl flex items-center justify-center text-blue-400 border border-blue-500/20">
                        <Clock size={24} />
                    </div>
                    <div>
                        <h3 className="text-xl font-black text-white italic">سجل العمليات</h3>
                        <p className="text-[9px] text-gray-500 font-bold uppercase tracking-widest mt-1">تتبع حالة التفعيل والوصولات</p>
                    </div>
                </div>
                
                <div className="space-y-6 flex-1 max-h-[500px] overflow-y-auto no-scrollbar pr-1">
                    {invoices.length > 0 ? invoices.map(inv => (
                        <div key={inv.id} className="p-6 bg-white/[0.02] border border-white/5 rounded-[35px] group hover:border-white/20 transition-all shadow-inner">
                            <div className="flex justify-between items-start mb-5">
                                <span className={`text-[8px] font-black px-3 py-1 rounded-full uppercase border ${inv.status === 'PAID' ? 'bg-green-500/10 text-green-400 border-green-500/20' : 'bg-amber-500/10 text-amber-500 border-amber-500/20 animate-pulse'}`}>
                                    {inv.status === 'PAID' ? 'مدفوع ومعتمد ✓' : 'قيد المراجعة ⌛'}
                                </span>
                                <span className="text-[9px] font-mono text-gray-600 font-bold">#{inv.trackId}</span>
                            </div>
                            <h4 className="text-lg font-black text-white mb-1">{inv.planId === 'plan_premium' ? 'باقة التفوق' : 'الاشتراك الأساسي'}</h4>
                            <p className="text-[10px] text-gray-500 mb-8 font-bold tabular-nums flex items-center gap-2">
                                <Calendar className="w-3 h-3" /> {new Date(inv.date).toLocaleDateString('ar-KW', { day: 'numeric', month: 'long', year: 'numeric' })}
                            </p>
                            
                            <div className="flex justify-between items-center pt-5 border-t border-white/5">
                                <p className="text-3xl font-black text-white tabular-nums">{inv.amount} <span className="text-sm text-gray-600 font-bold">د.ك</span></p>
                                {inv.status === 'PAID' && (
                                    <button 
                                        onClick={() => setSelectedInvoiceForCert(inv)}
                                        className="bg-white/5 hover:bg-white text-gray-400 hover:text-black p-3 rounded-2xl transition-all shadow-xl flex items-center gap-2 group/btn"
                                    >
                                        <Printer size={16} className="group-hover/btn:scale-110 transition-transform" />
                                        <span className="text-[9px] font-black uppercase">إيصال رقمي</span>
                                    </button>
                                )}
                            </div>
                        </div>
                    )) : (
                        <div className="flex-1 flex flex-col items-center justify-center opacity-20 text-center px-6">
                            <div className="w-20 h-20 bg-white/5 rounded-full flex items-center justify-center mb-6">
                                <FileText size={48} className="text-gray-500" />
                            </div>
                            <p className="font-black text-sm uppercase tracking-[0.2em] mb-2">لا توجد سجلات</p>
                            <p className="text-[10px] font-medium leading-relaxed">بمجرد طلب الباقة عبر الواتساب، سيظهر طلبك هنا قيد المراجعة.</p>
                        </div>
                    )}
                </div>

                <div className="mt-10 p-6 bg-white/5 rounded-[35px] border border-white/5 text-center">
                    <p className="text-[10px] text-gray-600 leading-relaxed italic font-bold">يتم إصدار الإيصال الرقمي واعتماده فور تسجيل الدفعة من قبل الإدارة المالية للمركز.</p>
                </div>
            </div>
        </div>
      </div>
      
      <div className="mt-24 p-12 bg-white/[0.02] border border-white/5 rounded-[60px] text-center max-w-2xl mx-auto shadow-2xl relative overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-blue-500/20 to-transparent"></div>
          <p className="text-gray-400 text-lg font-bold mb-8">هل واجهت مشكلة في تحويل "ومض" أو تأخر تفعيل حسابك؟</p>
          <button 
            onClick={() => {
                const phoneNumber = "965" + (paymentSettings?.womdaPhoneNumber || "55315661");
                window.open(`https://wa.me/${phoneNumber}?text=مرحباً، أود الاستفسار عن حالة اشتراكي المالي وتفعيله.`, '_blank');
            }}
            className="flex items-center gap-4 bg-white text-black px-12 py-5 rounded-full font-black text-xs uppercase tracking-widest shadow-2xl hover:scale-105 active:scale-95 transition-all mx-auto"
          >
              <MessageSquare size={22}/> التواصل المباشر مع المالية
          </button>
      </div>
    </div>
  );
};

export default BillingCenter;

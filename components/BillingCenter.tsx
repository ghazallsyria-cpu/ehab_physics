
import React, { useState, useEffect } from 'react';
import { User, Invoice, SubscriptionPlan, PaymentSettings } from '../types';
import { dbService } from '../services/db';
import { 
  MessageCircle, 
  CheckCircle2, 
  Smartphone, 
  ShieldCheck, 
  RefreshCw, 
  MessageSquare,
  FileText,
  ChevronLeft,
  Printer,
  Calendar,
  Phone,
  Zap,
  Clock
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
  const [isLoading, setIsLoading] = useState(true);
  const [selectedInvoiceForCert, setSelectedInvoiceForCert] = useState<Invoice | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      try {
        const [settings, plans] = await Promise.all([
          dbService.getPaymentSettings(),
          dbService.getSubscriptionPlans()
        ]);
        setPaymentSettings(settings);
        // إذا لم تكن هناك خطط في DB، استخدم الافتراضية
        setSubscriptionPlans(plans && plans.length > 0 ? plans : DEFAULT_PLANS);
      } catch (e) {
        console.error("Fetch plans failed", e);
        setSubscriptionPlans(DEFAULT_PLANS);
      } finally {
        setIsLoading(false);
      }
    };
    fetchData();

    const unsubscribeInvoices = dbService.subscribeToInvoices(user.uid, (updatedInvoices) => {
        setInvoices(updatedInvoices);
    });

    return () => unsubscribeInvoices();
  }, [user.uid]);

  const handlePlanAction = async (plan: SubscriptionPlan) => {
    const dynamicPrice = plan.tier === 'premium' 
      ? (paymentSettings?.planPrices.premium || plan.price) 
      : (paymentSettings?.planPrices.basic || plan.price);

    if (dynamicPrice > 0) {
        const phoneNumber = "965" + (paymentSettings?.womdaPhoneNumber || "55315661");
        const message = encodeURIComponent(
            `مرحباً إدارة المركز السوري للعلوم،\n\nأود الاشتراك في: *${plan.name}*\nالقيمة: *${dynamicPrice} د.ك*\n\nبياناتي:\n- الأسم: ${user.name}\n- الهاتف: ${user.phone || 'غير مسجل'}\n\nيرجى تزويدي بتعليمات "ومض".`
        );
        window.open(`https://wa.me/${phoneNumber}?text=${message}`, '_blank');
        await dbService.initiatePayment(user.uid, plan.id, dynamicPrice);
        return;
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

  if (isLoading) {
    return (
        <div className="py-40 text-center flex flex-col items-center">
            <RefreshCw className="w-16 h-16 text-[#fbbf24] animate-spin mb-6" />
            <p className="text-gray-500 font-black uppercase tracking-widest text-xs">جاري تحميل بيانات حسابك المالي...</p>
        </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto py-12 px-6 animate-fadeIn font-['Tajawal'] text-white text-right" dir="rtl">
      <header className="mb-20 text-center relative">
        <h2 className="text-5xl md:text-7xl font-black mb-4 tracking-tighter italic">مركز <span className="text-[#fbbf24] text-glow-gold">الاشتراكات</span></h2>
        <p className="text-gray-500 text-xl font-medium max-w-2xl mx-auto leading-relaxed">فعل باقتك التعليمية عبر خدمة "ومض" لفتح كامل المحتوى.</p>
        
        <div className="mt-10 bg-emerald-500/10 border-2 border-emerald-500/20 p-6 rounded-[30px] inline-flex items-center gap-6">
            <div className="w-14 h-14 bg-emerald-500 rounded-2xl flex items-center justify-center text-black shadow-lg">
                <Smartphone size={28} />
            </div>
            <div className="text-right">
                <p className="text-emerald-400 font-black text-lg">تحويل "ومض" متاح</p>
                <p className="text-xs text-gray-500 font-bold mt-1">رقمك المسجل: <span className="text-white">{user.phone || 'يرجى تحديثه في البروفايل'}</span></p>
            </div>
        </div>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-start">
        <div className="lg:col-span-8">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {subscriptionPlans.map(plan => {
                const dynamicPrice = plan.tier === 'premium' 
                    ? (paymentSettings?.planPrices.premium || plan.price) 
                    : (paymentSettings?.planPrices.basic || plan.price);
                const isCurrentPlan = user.subscription === plan.tier;

                return (
                    <div key={plan.id} className={`p-10 rounded-[50px] border-2 transition-all flex flex-col relative overflow-hidden bg-black/40 shadow-2xl ${isCurrentPlan ? 'border-emerald-500/40 bg-emerald-500/5' : 'border-white/5 hover:border-[#fbbf24]/30'}`}>
                        <div className="flex justify-between items-start mb-8">
                            <h3 className="text-2xl font-black">{plan.name}</h3>
                            {isCurrentPlan && <span className="bg-emerald-500 text-black px-3 py-1 rounded-full text-[8px] font-black uppercase tracking-widest shadow-lg">نشطة</span>}
                        </div>
                        <div className="text-5xl font-black text-[#fbbf24] tracking-tighter mb-10 tabular-nums">
                            {dynamicPrice}<span className="text-sm text-gray-500 mr-1 font-bold uppercase">د.ك</span>
                        </div>
                        <ul className="space-y-4 flex-1 text-right border-t border-white/5 pt-8 mb-10">
                            {plan.features.map((f, i) => (
                                <li key={i} className="flex items-center gap-3 text-gray-400 text-sm">
                                    <CheckCircle2 size={14} className="text-emerald-500 shrink-0" />
                                    <span className="font-bold">{f}</span>
                                </li>
                            ))}
                        </ul>
                        <button 
                            onClick={() => handlePlanAction(plan)}
                            disabled={isCurrentPlan}
                            className={`w-full py-6 rounded-[30px] font-black text-xs uppercase tracking-widest transition-all ${isCurrentPlan ? 'bg-gray-800 text-gray-600' : 'bg-[#fbbf24] text-black hover:scale-105 active:scale-95'}`}
                        >
                            {isCurrentPlan ? '✓ باقتك الحالية' : 'اشترك الآن عبر واتساب'}
                        </button>
                    </div>
                );
                })}
            </div>
        </div>

        <div className="lg:col-span-4">
            <div className="glass-panel p-8 rounded-[40px] border-white/5 bg-[#0a1118]/80 flex flex-col shadow-3xl min-h-[500px]">
                <div className="flex items-center gap-3 mb-10 border-b border-white/5 pb-6">
                    <Clock className="text-blue-400" size={20} />
                    <h3 className="text-lg font-black text-white italic">سجل الدفعات</h3>
                </div>
                
                <div className="space-y-4 flex-1">
                    {invoices.length > 0 ? invoices.map(inv => (
                        <div key={inv.id} className="p-5 bg-white/[0.02] border border-white/5 rounded-[30px] group transition-all">
                            <div className="flex justify-between items-center mb-4">
                                <span className={`text-[8px] font-black px-3 py-1 rounded-full uppercase border ${inv.status === 'PAID' ? 'bg-green-500/10 text-green-400 border-green-500/20' : 'bg-amber-500/10 text-amber-500 border-amber-500/20'}`}>
                                    {inv.status === 'PAID' ? 'تم الدفع ✓' : 'قيد المراجعة ⌛'}
                                </span>
                                <span className="text-[9px] font-mono text-gray-600 font-bold">#{inv.trackId}</span>
                            </div>
                            <div className="flex justify-between items-end">
                                <div>
                                    <h4 className="text-md font-black text-white">{inv.planId === 'plan_premium' ? 'باقة التفوق' : 'باقة أساسية'}</h4>
                                    <p className="text-[9px] text-gray-500 font-bold tabular-nums mt-1">{new Date(inv.date).toLocaleDateString('ar-KW')}</p>
                                </div>
                                {inv.status === 'PAID' && (
                                    <button onClick={() => setSelectedInvoiceForCert(inv)} className="p-3 bg-white/5 hover:bg-white text-gray-400 hover:text-black rounded-2xl transition-all shadow-xl">
                                        <Printer size={16} />
                                    </button>
                                )}
                            </div>
                        </div>
                    )) : (
                        <div className="text-center py-20 opacity-20">
                            <FileText size={48} className="mx-auto mb-4" />
                            <p className="text-xs font-black uppercase">لا توجد عمليات</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
      </div>
      
      <div className="mt-20 p-10 bg-white/[0.02] border border-white/5 rounded-[50px] text-center max-w-xl mx-auto shadow-2xl">
          <p className="text-gray-400 text-sm font-bold mb-6">هل واجهت مشكلة في تحويل "ومض"؟</p>
          <button 
            onClick={() => window.open(`https://wa.me/965${paymentSettings?.womdaPhoneNumber || '55315661'}`, '_blank')}
            className="flex items-center gap-3 bg-white text-black px-10 py-4 rounded-full font-black text-xs uppercase transition-all hover:scale-105 active:scale-95 mx-auto"
          >
              <MessageSquare size={18}/> التواصل مع المالية
          </button>
      </div>
    </div>
  );
};

export default BillingCenter;

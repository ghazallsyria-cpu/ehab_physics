
import React, { useState, useEffect } from 'react';
import { User, Invoice, SubscriptionPlan, PaymentSettings } from '../types';
import { dbService } from '../services/db';
import { 
  CheckCircle2, 
  Smartphone, 
  RefreshCw, 
  MessageSquare,
  ChevronLeft,
  Printer,
  Zap,
  Clock,
  ShieldCheck,
  CreditCard,
  AlertTriangle,
  Crown,
  FileText
} from 'lucide-react';
import PaymentCertificate from './PaymentCertificate';

const DEFAULT_PLANS: SubscriptionPlan[] = [
  {
    id: 'plan_premium',
    name: 'باقة التفوق (Premium)',
    price: 35,
    tier: 'premium',
    duration: 'term',
    features: ['دخول كامل لجميع الدروس', 'مشاهدة فيديوهات Veo الذكية', 'بنك الأسئلة المطور 5C', 'تواصل مباشر مع المعلم المعتمد']
  },
  {
    id: 'plan_basic',
    name: 'الباقة الأساسية (Basic)',
    price: 0,
    tier: 'free',
    duration: 'monthly',
    features: ['معاينة الوحدة الأولى مجاناً', 'المساعد الذكي (محدود)', 'المقالات العلمية الأسبوعية']
  }
];

const BillingCenter: React.FC<{ user: User; onUpdateUser: (user: User) => void }> = ({ user, onUpdateUser }) => {
  const [paymentSettings, setPaymentSettings] = useState<PaymentSettings | null>(null);
  const [subscriptionPlans, setSubscriptionPlans] = useState<SubscriptionPlan[]>(DEFAULT_PLANS);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
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
        
        if (settings) setPaymentSettings(settings);
        if (plans && plans.length > 0) setSubscriptionPlans(plans);
      } catch (e) {
        console.error("Fetch failed, keeping defaults", e);
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
            `مرحباً إدارة المركز السوري للعلوم،\n\nأود الاشتراك في: *${plan.name}*\nالقيمة: *${dynamicPrice} د.ك*\n\nبياناتي:\n- الاسم: ${user.name}\n- الهاتف: ${user.phone || 'غير مسجل'}\n\nيرجى تزويدي بتعليمات "ومض".`
        );
        window.open(`https://wa.me/${phoneNumber}?text=${message}`, '_blank');
        await dbService.initiatePayment(user.uid, plan.id, dynamicPrice);
    }
  };

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center h-[60vh] gap-6 text-white font-['Tajawal']" dir="rtl">
        <RefreshCw className="w-12 h-12 text-amber-400 animate-spin" />
        <p className="text-gray-400 font-bold animate-pulse">جاري تحميل بيانات الاشتراك والأسعار...</p>
      </div>
    );
  }

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

  return (
    <div className="max-w-7xl mx-auto py-12 px-6 animate-fadeIn font-['Tajawal'] text-white text-right" dir="rtl">
      <header className="mb-20 text-center relative">
        <div className="absolute top-[-50px] left-1/2 -translate-x-1/2 w-64 h-64 bg-amber-400/5 rounded-full blur-[100px] pointer-events-none"></div>
        <h2 className="text-5xl md:text-7xl font-black mb-4 tracking-tighter italic">بوابة <span className="text-[#fbbf24] text-glow-gold">التميز</span></h2>
        <p className="text-gray-500 text-xl font-medium max-w-2xl mx-auto leading-relaxed">افتح الأقفال العلمية وانطلق في رحلة اكتشاف الفيزياء بلا حدود.</p>
        
        <div className="mt-10 bg-emerald-500/10 border-2 border-emerald-500/20 p-6 rounded-[35px] inline-flex items-center gap-6 shadow-xl backdrop-blur-xl">
            <div className="w-14 h-14 bg-emerald-500 rounded-2xl flex items-center justify-center text-black shadow-[0_0_20px_rgba(16,185,129,0.4)] animate-pulse">
                <Smartphone size={28} />
            </div>
            <div className="text-right">
                <p className="text-emerald-400 font-black text-lg">تحويل "ومض" مفعّل</p>
                <p className="text-xs text-gray-500 font-bold mt-1">خدمة الدفع السريع المعتمدة في الكويت</p>
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
                      <div key={plan.id} className={`p-10 rounded-[55px] border-2 transition-all flex flex-col relative overflow-hidden bg-[#0a1118]/80 shadow-2xl group ${isCurrentPlan ? 'border-emerald-500/40 bg-emerald-500/[0.02]' : 'border-white/5 hover:border-amber-400/40'}`}>
                          {plan.tier === 'premium' && <div className="absolute top-0 right-0 w-32 h-32 bg-amber-400/5 rounded-full blur-[40px] pointer-events-none group-hover:bg-amber-400/10 transition-all"></div>}
                          
                          <div className="flex justify-between items-start mb-8 relative z-10">
                              <div className="flex items-center gap-3">
                                {plan.tier === 'premium' ? <Crown className="text-amber-400" size={24}/> : <ShieldCheck className="text-blue-400" size={24}/>}
                                <h3 className="text-2xl font-black text-white">{plan.name}</h3>
                              </div>
                              {isCurrentPlan && (
                                  <span className="bg-emerald-500 text-black px-4 py-1.5 rounded-full text-[9px] font-black uppercase tracking-widest shadow-lg">نشطة ✓</span>
                              )}
                          </div>

                          <div className="text-6xl font-black text-white tracking-tighter mb-10 tabular-nums relative z-10">
                              <span className="text-[#fbbf24]">{dynamicPrice}</span>
                              <span className="text-sm text-gray-500 mr-2 font-bold uppercase">د.ك</span>
                          </div>

                          <ul className="space-y-4 flex-1 text-right border-t border-white/5 pt-8 mb-12 relative z-10">
                              {plan.features.map((f, i) => (
                                  <li key={i} className="flex items-center gap-3 text-gray-400 text-sm">
                                      <div className="w-5 h-5 rounded-full bg-emerald-500/10 flex items-center justify-center shrink-0">
                                          <CheckCircle2 size={12} className="text-emerald-500" />
                                      </div>
                                      <span className="font-bold">{f}</span>
                                  </li>
                              ))}
                          </ul>

                          <button 
                              onClick={() => handlePlanAction(plan)}
                              disabled={isCurrentPlan}
                              className={`w-full py-6 rounded-[30px] font-black text-sm uppercase tracking-[0.2em] transition-all relative z-10 shadow-2xl ${isCurrentPlan ? 'bg-white/5 text-gray-600 cursor-default border border-white/5' : 'bg-[#fbbf24] text-black hover:scale-105 active:scale-95'}`}
                          >
                              {isCurrentPlan ? 'أنت مشترك في هذه الباقة' : plan.price === 0 ? 'ابدأ الاستكشاف مجاناً' : 'اشترك الآن عبر ومض'}
                          </button>
                      </div>
                  );
                  })}
              </div>

              <div className="mt-12 p-10 bg-white/[0.02] border border-white/5 rounded-[40px] flex items-start gap-8 backdrop-blur-md">
                  <div className="w-16 h-16 bg-amber-400/10 rounded-3xl flex items-center justify-center text-amber-400 shrink-0 border border-amber-400/20 shadow-xl">
                      <AlertTriangle size={32}/>
                  </div>
                  <div>
                      <h4 className="text-white font-black text-lg mb-2">تعليمات تفعيل باقة التفوق</h4>
                      <p className="text-gray-400 text-sm leading-relaxed font-medium italic">
                        بعد الضغط على "اشترك الآن"، سيتم فتح واتساب الإدارة تلقائياً. 
                        يرجى إتمام التحويل عبر تطبيق بنكك باستخدام رقم "ومض" الموضح، ثم إرسال لقطة شاشة للإيصال. 
                        سيقوم الفريق التقني بتفعيل حسابك خلال لحظات من استلام الإيصال.
                      </p>
                  </div>
              </div>
          </div>

          <div className="lg:col-span-4">
              <div className="glass-panel p-8 rounded-[45px] border-white/5 bg-[#0a1118]/90 flex flex-col shadow-3xl min-h-[500px]">
                  <div className="flex items-center justify-between mb-10 border-b border-white/5 pb-6">
                      <div className="flex items-center gap-3">
                          <Clock className="text-blue-400" size={20} />
                          <h3 className="text-lg font-black text-white italic uppercase tracking-widest">تاريخ المدفوعات</h3>
                      </div>
                  </div>
                  
                  <div className="space-y-4 flex-1 overflow-y-auto no-scrollbar pr-1">
                      {invoices.length > 0 ? invoices.map(inv => (
                          <div key={inv.id} className="p-6 bg-white/[0.03] border border-white/5 rounded-[30px] group transition-all hover:bg-white/[0.05] hover:border-blue-500/20">
                              <div className="flex justify-between items-center mb-4">
                                  <span className={`text-[8px] font-black px-3 py-1 rounded-full uppercase border ${inv.status === 'PAID' ? 'bg-green-500/10 text-green-400 border-green-500/20' : 'bg-amber-500/10 text-amber-500 border-amber-500/20'}`}>
                                      {inv.status === 'PAID' ? 'مكتمل ✓' : 'بانتظار التأكيد'}
                                  </span>
                                  <span className="text-[9px] font-mono text-gray-600 font-bold">#{inv.trackId}</span>
                              </div>
                              <div className="flex justify-between items-end">
                                  <div>
                                      <h4 className="text-sm font-black text-white">
                                          {inv.planId === 'plan_premium' ? 'باقة التفوق' : 'الباقة الأساسية'}
                                      </h4>
                                      <p className="text-[9px] text-gray-500 font-bold tabular-nums mt-1">{new Date(inv.date).toLocaleDateString('ar-KW')}</p>
                                  </div>
                                  {inv.status === 'PAID' && (
                                      <button onClick={() => setSelectedInvoiceForCert(inv)} className="p-3 bg-white/5 hover:bg-white text-gray-400 hover:text-black rounded-2xl transition-all shadow-xl group/btn" title="عرض الإيصال الرسمي">
                                          <Printer size={16} />
                                      </button>
                                  )}
                              </div>
                          </div>
                      )) : (
                          <div className="text-center py-24 opacity-20">
                              <FileText size={64} className="mx-auto mb-4" />
                              <p className="text-[10px] font-black uppercase tracking-[0.3em]">لا يوجد سجلات سابقة</p>
                          </div>
                      )}
                  </div>

                  <div className="mt-8 pt-8 border-t border-white/5">
                      <button 
                          onClick={() => window.open(`https://wa.me/965${paymentSettings?.womdaPhoneNumber || '55315661'}`, '_blank')}
                          className="w-full flex items-center justify-center gap-3 bg-white/5 border border-white/10 text-gray-400 hover:text-white py-5 rounded-2xl font-black text-[10px] uppercase tracking-widest transition-all"
                      >
                          <MessageSquare size={16}/> طلب دعم فني مالي
                      </button>
                  </div>
              </div>
          </div>
      </div>
      
      <footer className="mt-24 text-center pb-10 opacity-30">
          <div className="flex justify-center gap-8 mb-4">
              <ShieldCheck size={20}/>
              <Zap size={20}/>
              <Smartphone size={20}/>
              <CreditCard size={20}/>
          </div>
          <p className="text-[10px] font-black uppercase tracking-[0.6em]">Quantum Billing System v2.0 • Syrian Science Center</p>
      </footer>
    </div>
  );
};

export default BillingCenter;

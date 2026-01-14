
import React, { useState } from 'react';
import { User, Invoice, PricingPlan } from '../types';
import { PRICING_PLANS } from '../constants';
import { dbService } from '../services/db';

interface BillingCenterProps {
  user: User;
  onUpdateUser: (user: User) => void;
  onBack: () => void;
  onViewCertificate?: (invoice: Invoice) => void;
}

const BillingCenter: React.FC<BillingCenterProps> = ({ user, onUpdateUser, onBack, onViewCertificate }) => {
  const [step, setStep] = useState<'PLANS' | 'GATEWAY' | 'RESULT'>('PLANS');
  const [activeInvoice, setActiveInvoice] = useState<Invoice | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [finalResult, setFinalResult] = useState<'SUCCESS' | 'FAIL'>('SUCCESS');
  const [failureReason, setFailureReason] = useState<string>('');

  const handleInitiate = async (plan: PricingPlan) => {
    setIsProcessing(true);
    const invoice = await dbService.initiatePayment(user.uid, plan.id, plan.price);
    setActiveInvoice(invoice);
    setTimeout(() => {
      setIsProcessing(false);
      setStep('GATEWAY');
    }, 1200);
  };

  const handlePaymentSubmit = async (success: boolean) => {
    if (!activeInvoice) return;
    setIsProcessing(true);
    
    // محاكاة أسباب مختلفة للفشل إذا لم تنجح العملية
    let reason = '';
    if (!success) {
        const failureReasons = [
            'الرصيد غير كافٍ.',
            'رفض المصرف إتمام العملية.',
            'انتهت مهلة الجلسة (Time-out).',
            'بيانات غير صحيحة.'
        ];
        reason = failureReasons[Math.floor(Math.random() * failureReasons.length)];
    }
    setFailureReason(reason);

    const result = success ? 'SUCCESS' : 'FAIL';
    
    // إتمام الدفع وتحديث البيانات
    const updatedInvoice = await dbService.completePayment(activeInvoice.trackId, result);
    
    setTimeout(async () => {
      setFinalResult(result);
      setIsProcessing(false);
      setStep('RESULT');
      
      if (updatedInvoice) {
        setActiveInvoice(updatedInvoice);
        if (result === 'SUCCESS') {
          const freshUser = await dbService.getUser(user.uid);
          if (freshUser) onUpdateUser(freshUser);
        }
      }
    }, 1500);
  };

  if (step === 'GATEWAY' && activeInvoice) {
    return (
      <div className="min-h-screen fixed inset-0 z-[200] bg-[#f4f4f4] flex items-center justify-center font-['Tajawal'] text-black p-4">
        <div className="w-full max-w-xl bg-white shadow-2xl rounded-2xl overflow-hidden border border-gray-200 animate-slideUp">
           <header className="bg-gray-800 p-6 flex justify-between items-center text-white">
              <span className="font-black text-lg">Syrian Payments (Sandbox)</span>
              <div className="text-right">
                 <p className="text-[10px] font-bold opacity-80 uppercase tracking-widest text-white">Merchant: Syrian Science Center</p>
                 <p className="text-sm font-black text-white">Secure Payment Gateway</p>
              </div>
           </header>

           <div className="p-8 space-y-6">
              <div className="bg-blue-50 p-6 rounded-xl border border-blue-100 flex justify-between items-center">
                 <div className="text-right">
                    <p className="text-[10px] text-gray-500 font-bold uppercase mb-1">Total Amount</p>
                    <p className="text-3xl font-black text-gray-800">{activeInvoice.amount.toLocaleString()} ل.س</p>
                 </div>
                 <div className="text-left text-xs text-gray-500 font-mono">
                    <p>Track ID: {activeInvoice.trackId}</p>
                 </div>
              </div>

              <div className="space-y-4">
                 <label className="block text-xs font-black text-gray-500 uppercase">اختر المصرف</label>
                 <select className="w-full p-4 border border-gray-300 rounded-xl outline-none focus:ring-2 focus:ring-gray-800 transition-all font-bold bg-white">
                    <option>المصرف التجاري السوري</option>
                    <option>بنك بيمو السعودي الفرنسي</option>
                    <option>بنك سوريا الدولي الإسلامي</option>
                 </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                 <button 
                  onClick={() => handlePaymentSubmit(true)} 
                  disabled={isProcessing}
                  className="bg-gray-800 text-white py-5 rounded-xl font-black text-sm uppercase tracking-widest hover:bg-black transition-all flex items-center justify-center gap-4 shadow-xl"
                 >
                   {isProcessing ? 'Processing...' : 'تأكيد الدفع (تجريبي)'}
                 </button>
                 <button 
                  onClick={() => handlePaymentSubmit(false)}
                  disabled={isProcessing}
                  className="bg-gray-100 text-gray-600 py-5 rounded-xl font-black text-sm uppercase tracking-widest hover:bg-gray-200 transition-all"
                 >
                   إلغاء / فشل
                 </button>
              </div>
           </div>
        </div>
      </div>
    );
  }

  if (step === 'RESULT' && activeInvoice) {
    return (
      <div className="max-w-2xl mx-auto py-20 text-center font-['Tajawal'] text-white">
        <div className={`glass-panel p-16 rounded-[70px] border-2 ${finalResult === 'SUCCESS' ? 'border-green-500/30' : 'border-red-500/30'} relative overflow-hidden bg-black/40`}>
           <div className="text-9xl mb-10">{finalResult === 'SUCCESS' ? '🏆' : '⚠️'}</div>
           <h2 className="text-4xl font-black mb-4">{finalResult === 'SUCCESS' ? 'تمت العملية بنجاح!' : 'لم تكتمل عملية الدفع'}</h2>
           
           {finalResult === 'SUCCESS' && (
             <div className="bg-white/5 p-8 rounded-[40px] border border-white/5 text-right space-y-4 mb-10 tabular-nums">
                <div className="flex justify-between items-center text-sm">
                   <span className="text-gray-500">رقم المرجع:</span>
                   <span className="font-bold text-white">{activeInvoice.paymentId}</span>
                </div>
                <div className="flex justify-between items-center text-sm">
                   <span className="text-gray-500">المبلغ المدفوع:</span>
                   <span className="font-black text-[#fbbf24]">{activeInvoice.amount.toLocaleString()} ل.س</span>
                </div>
             </div>
           )}

           {finalResult === 'FAIL' && (
             <div className="bg-red-500/5 p-10 rounded-[40px] border border-red-500/10 text-center space-y-6 mb-10">
                <div>
                    <p className="text-red-400 font-bold mb-2 uppercase text-xs tracking-widest">سبب الرفض من المصدر</p>
                    <p className="text-white font-medium text-lg leading-relaxed">"{failureReason}"</p>
                </div>
                <p className="text-xs text-gray-500 pt-4 border-t border-red-500/10">لا تقلق، لم يتم خصم أي مبلغ من حسابك. يمكنك المحاولة مرة أخرى.</p>
             </div>
           )}

           <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <button onClick={onBack} className="bg-white text-black px-12 py-5 rounded-[30px] font-black text-xs uppercase tracking-widest hover:scale-105 active:scale-95 transition-all shadow-2xl">
                 العودة للرئيسية
              </button>
              
              {finalResult === 'SUCCESS' && onViewCertificate && (
                <button 
                  onClick={() => onViewCertificate(activeInvoice)}
                  className="bg-[#fbbf24] text-black px-12 py-5 rounded-[30px] font-black text-xs uppercase tracking-widest hover:scale-105 active:scale-95 transition-all shadow-2xl"
                >
                  عرض الشهادة الرقمية 📄 
                </button>
              )}

              {finalResult === 'FAIL' && (
                <button 
                  onClick={() => { setStep('PLANS'); setIsProcessing(false); }}
                  className="bg-red-500 text-white px-12 py-5 rounded-[30px] font-black text-xs uppercase tracking-widest hover:bg-red-600 transition-all shadow-2xl shadow-red-500/20"
                >
                  إعادة المحاولة ↺
                </button>
              )}
           </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto py-12 px-6 animate-fadeIn font-['Tajawal'] text-white">
      <header className="mb-20 text-center">
        <h2 className="text-6xl font-black mb-4 tracking-tighter">باقات <span className="text-[#00d2ff] italic text-glow">التفوق</span></h2>
        <p className="text-gray-500 text-xl font-medium">اختر الباقة المناسبة لمرحلتك الدراسية.</p>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
        {PRICING_PLANS.map(plan => (
          <div key={plan.id} className="glass-panel group p-12 rounded-[60px] border-white/5 hover:border-[#00d2ff]/30 transition-all duration-700 flex flex-col relative overflow-hidden bg-black/20">
            <h3 className="text-3xl font-black mb-4">{plan.name}</h3>
            <div className="text-6xl font-black text-[#fbbf24] tracking-tighter mb-10">{plan.price.toLocaleString()}<span className="text-lg text-gray-500 mr-2">ل.س</span></div>
            
            <ul className="space-y-6 flex-1 text-right border-t border-white/5 pt-10 mb-10">
               {plan.features.map((f, i) => (
                 <li key={i} className="flex items-center gap-4 text-gray-400 group-hover:text-white transition-colors">
                    <span className="w-1.5 h-1.5 bg-[#fbbf24] rounded-full shadow-[0_0_10px_#fbbf24]"></span>
                    <span className="font-bold text-sm">{f}</span>
                 </li>
               ))}
            </ul>

            <button 
              onClick={() => handleInitiate(plan)}
              disabled={isProcessing || user.subscription === plan.tier}
              className={`w-full py-6 rounded-[30px] font-black text-xs uppercase tracking-widest transition-all shadow-2xl ${
                user.subscription === plan.tier 
                  ? 'bg-gray-800 text-gray-500 cursor-default' 
                  : 'bg-[#fbbf24] text-black hover:scale-105 active:scale-95 glow-gold'
              }`}
            >
              {isProcessing ? 'جاري الاتصال...' : user.subscription === plan.tier ? 'أنت مشترك بالفعل' : 'اشترك الآن'}
            </button>
          </div>
        ))}
      </div>
    </div>
  );
};

export default BillingCenter;

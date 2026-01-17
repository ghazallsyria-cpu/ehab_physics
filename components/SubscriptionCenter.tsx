
import React, { useState, useEffect } from 'react';
import { User, SubscriptionPlan, PaymentSettings } from '../types';
import { SUBSCRIPTION_PLANS } from '../constants';
import { dbService } from '../services/db';
import { Phone, CheckCircle, AlertTriangle } from 'lucide-react';

interface SubscriptionCenterProps {
  user: User;
  onUpdateUser: (user: User) => void;
}

const SubscriptionCenter: React.FC<SubscriptionCenterProps> = ({ user, onUpdateUser }) => {
  const [paymentSettings, setPaymentSettings] = useState<PaymentSettings | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [activationCode, setActivationCode] = useState('');
  const [activationStatus, setActivationStatus] = useState<{ type: 'success' | 'error', message: string } | null>(null);

  useEffect(() => {
    const fetchSettings = async () => {
      const settings = await dbService.getPaymentSettings();
      setPaymentSettings(settings);
    };
    fetchSettings();
  }, []);

  const handleSubscribe = (plan: SubscriptionPlan) => {
    setIsProcessing(true);
    alert(`محاكاة عملية الاشتراك في: ${plan.name}.\nسيتم تحديث حسابك الآن.`);
    
    setTimeout(() => {
      const updatedUser = { ...user, subscription: 'premium' as 'premium' };
      dbService.saveUser(updatedUser); // Save to DB
      onUpdateUser(updatedUser);
      setIsProcessing(false);
    }, 1500);
  };

  const handleCodeActivation = async () => {
    if (!activationCode.trim()) return;
    setIsProcessing(true);
    setActivationStatus(null);
    const result = await dbService.activateSubscriptionWithCode(activationCode, user.uid);
    if (result.success) {
        setActivationStatus({ type: 'success', message: result.message });
        const updatedUser = { ...user, subscription: 'premium' as 'premium' };
        onUpdateUser(updatedUser);
        setActivationCode('');
    } else {
        setActivationStatus({ type: 'error', message: result.message });
    }
    setIsProcessing(false);
  };

  const renderLoading = () => (
    <div className="py-40 text-center text-gray-500 animate-pulse">
        جاري التحقق من إعدادات الدفع...
    </div>
  );

  const renderManualPayment = () => (
    <div className="max-w-3xl mx-auto text-center glass-panel p-16 rounded-[60px] border-amber-500/20 bg-amber-500/5">
        <Phone className="w-16 h-16 mx-auto mb-8 text-amber-400"/>
        <h3 className="text-3xl font-black text-white mb-4">الدفع الإلكتروني متوقف مؤقتاً</h3>
        <p className="text-gray-400 mb-8 leading-relaxed">للاشتراك في باقاتنا، يرجى التواصل معنا مباشرة للدفع اليدوي والحصول على كود تفعيل فوري.</p>
        <div className="p-8 bg-black/40 rounded-3xl border border-white/10 mb-8 inline-block">
            <p className="text-sm text-gray-500 font-bold mb-2 uppercase tracking-widest">رقم التواصل</p>
            <p className="text-5xl font-black text-[#fbbf24] tracking-wider font-mono">55315661</p>
        </div>
        <p className="text-xs text-gray-600 italic">بعد الدفع، ستحصل على كود يمكنك إدخاله في الخانة أدناه لتفعيل اشتراكك فوراً.</p>
    </div>
  );

  const renderOnlinePayment = () => (
     <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
        {SUBSCRIPTION_PLANS.map(plan => (
          <div key={plan.id} className={`glass-panel group p-12 rounded-[60px] border-white/5 hover:border-[#00d2ff]/30 transition-all duration-700 flex flex-col relative overflow-hidden bg-black/20 ${plan.recommended ? 'border-[#fbbf24]/30' : ''}`}>
            {plan.recommended && <div className="absolute top-6 left-6 bg-[#fbbf24] text-black text-[9px] font-black px-4 py-1 rounded-full uppercase tracking-widest">موصى به</div>}
            <h3 className="text-3xl font-black mb-4">{plan.name}</h3>
            <div className="text-6xl font-black text-[#fbbf24] tracking-tighter mb-10">{plan.price.toLocaleString()}<span className="text-lg text-gray-500 mr-2">د.ك</span></div>
            
            <ul className="space-y-6 flex-1 text-right border-t border-white/5 pt-10 mb-10">
               {plan.features.map((f, i) => (
                 <li key={i} className="flex items-center gap-4 text-gray-400 group-hover:text-white transition-colors">
                    <span className="w-1.5 h-1.5 bg-[#fbbf24] rounded-full shadow-[0_0_10px_#fbbf24]"></span>
                    <span className="font-bold text-sm">{f}</span>
                 </li>
               ))}
            </ul>

            <button 
              onClick={() => handleSubscribe(plan)}
              disabled={isProcessing || user.subscription === 'premium'}
              className={`w-full py-6 rounded-[30px] font-black text-xs uppercase tracking-widest transition-all shadow-2xl ${
                user.subscription === 'premium' ? 'bg-gray-800 text-gray-500 cursor-default' : 'bg-[#fbbf24] text-black hover:scale-105'
              }`}
            >
              {isProcessing ? 'جاري التفعيل...' : user.subscription === 'premium' ? 'أنت مشترك بالفعل' : 'اشترك الآن'}
            </button>
          </div>
        ))}
      </div>
  );


  return (
    <div className="max-w-5xl mx-auto py-12 px-6 animate-fadeIn font-['Tajawal'] text-white">
      <header className="mb-20 text-center">
        <h2 className="text-6xl font-black mb-4 tracking-tighter">باقات <span className="text-[#00d2ff] italic">التفوق</span></h2>
        <p className="text-gray-500 text-xl font-medium">اختر الباقة المناسبة لمرحلتك الدراسية.</p>
      </header>

      {paymentSettings === null ? renderLoading() : paymentSettings.isOnlinePaymentEnabled ? renderOnlinePayment() : renderManualPayment()}
      
      {/* Code Activation Section */}
      <div className="max-w-2xl mx-auto mt-16 glass-panel p-10 rounded-[40px] border-white/10">
         <h4 className="text-xl font-black mb-4 text-center">هل لديك كود تفعيل؟</h4>
         <div className="flex flex-col sm:flex-row gap-4">
             <input 
                type="text"
                value={activationCode}
                onChange={e => setActivationCode(e.target.value)}
                placeholder="أدخل كود الاشتراك هنا..."
                className="flex-1 bg-black/40 border border-white/10 rounded-2xl px-6 py-4 text-white outline-none focus:border-[#fbbf24] transition-all font-mono text-center"
                disabled={isProcessing}
             />
             <button
                onClick={handleCodeActivation}
                disabled={isProcessing || !activationCode.trim()}
                className="bg-white text-black px-10 py-4 rounded-2xl font-black text-xs uppercase tracking-widest hover:scale-105 active:scale-95 transition-all disabled:opacity-50"
             >
                {isProcessing ? 'جاري التحقق...' : 'تفعيل'}
             </button>
         </div>
         {activationStatus && (
            <div className={`mt-4 p-4 rounded-2xl text-xs font-bold text-center flex items-center justify-center gap-2 ${activationStatus.type === 'success' ? 'bg-green-500/10 text-green-400' : 'bg-red-500/10 text-red-400'}`}>
                {activationStatus.type === 'success' ? <CheckCircle size={14}/> : <AlertTriangle size={14}/>}
                {activationStatus.message}
            </div>
         )}
      </div>
    </div>
  );
};

export default SubscriptionCenter;
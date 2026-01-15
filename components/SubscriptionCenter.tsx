import React, { useState } from 'react';
import { User, SubscriptionPlan } from '../types';
import { SUBSCRIPTION_PLANS } from '../constants';

interface SubscriptionCenterProps {
  user: User;
  onUpdateUser: (user: User) => void;
}

const SubscriptionCenter: React.FC<SubscriptionCenterProps> = ({ user, onUpdateUser }) => {
  const [isProcessing, setIsProcessing] = useState(false);

  const handleSubscribe = (plan: SubscriptionPlan) => {
    setIsProcessing(true);
    alert(`محاكاة عملية الاشتراك في: ${plan.name}.\nسيتم تحديث حسابك الآن.`);
    
    // Simulate updating user subscription
    setTimeout(() => {
      const updatedUser = { ...user, subscription: 'premium' as 'premium' };
      onUpdateUser(updatedUser);
      setIsProcessing(false);
    }, 1500);
  };

  return (
    <div className="max-w-5xl mx-auto py-12 px-6 animate-fadeIn font-['Tajawal'] text-white">
      <header className="mb-20 text-center">
        <h2 className="text-6xl font-black mb-4 tracking-tighter">باقات <span className="text-[#00d2ff] italic">التفوق</span></h2>
        <p className="text-gray-500 text-xl font-medium">اختر الباقة المناسبة لمرحلتك الدراسية.</p>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
        {SUBSCRIPTION_PLANS.map(plan => (
          <div key={plan.id} className={`glass-panel group p-12 rounded-[60px] border-white/5 hover:border-[#00d2ff]/30 transition-all duration-700 flex flex-col relative overflow-hidden bg-black/20 ${plan.recommended ? 'border-[#fbbf24]/30' : ''}`}>
            {plan.recommended && <div className="absolute top-6 left-6 bg-[#fbbf24] text-black text-[9px] font-black px-4 py-1 rounded-full uppercase tracking-widest">موصى به</div>}
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
    </div>
  );
};

export default SubscriptionCenter;

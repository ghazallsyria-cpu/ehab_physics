
import React, { useState, useEffect } from 'react';
import { Invoice, PaymentStatus, PaymentSettings, SubscriptionCode, User } from '../types';
import { dbService } from '../services/db';
import { 
  Copy, Plus, Power, PowerOff, RefreshCw, AlertCircle, 
  Search, User as UserIcon, CreditCard, CheckCircle2, 
  X, DollarSign, Send, Zap, GraduationCap 
} from 'lucide-react';

const AdminFinancials: React.FC = () => {
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [stats, setStats] = useState({ totalRevenue: 0, pendingAmount: 0, totalInvoices: 0 });
  const [filter, setFilter] = useState<PaymentStatus | 'ALL'>('ALL');
  const [paymentSettings, setPaymentSettings] = useState<PaymentSettings | null>(null);
  const [codes, setCodes] = useState<SubscriptionCode[]>([]);
  const [message, setMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(null);
  const [isToggling, setIsToggling] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  // حالة الفاتورة اليدوية
  const [showManualModal, setShowManualModal] = useState(false);
  const [manualUserSearch, setManualUserSearch] = useState('');
  const [foundUser, setFoundUser] = useState<User | null>(null);
  const [isSearchingUser, setIsSearchingUser] = useState(false);
  const [manualAmount, setManualAmount] = useState(0);
  const [manualPlan, setManualPlan] = useState('plan_premium');

  useEffect(() => {
    loadFinanceData();
  }, []);

  const loadFinanceData = async () => {
    setIsLoading(true);
    setMessage(null);
    try {
      const invRes = await dbService.getInvoices();
      const invoicesData = invRes.data || [];
      setInvoices(invoicesData);
      
      const totalRevenue = invoicesData.filter(i => i.status === 'PAID').reduce((sum, i) => sum + (i.amount || 0), 0);
      const pendingAmount = invoicesData.filter(i => i.status === 'PENDING').reduce((sum, i) => sum + (i.amount || 0), 0);
      setStats({ totalRevenue, pendingAmount, totalInvoices: invoicesData.length });

      const settings = await dbService.getPaymentSettings();
      setPaymentSettings(settings);
      setManualAmount(settings.planPrices.premium); // القيمة الافتراضية للفاتورة اليدوية

      const unusedCodes = await dbService.getUnusedSubscriptionCodes();
      setCodes(unusedCodes);

    } catch (e) {
      console.error("Failed to load finance data", e);
      setMessage({ text: 'فشل تحميل البيانات المالية.', type: 'error' });
    } finally {
      setIsLoading(false);
    }
  };

  const searchUserForManual = async () => {
    if (!manualUserSearch.trim()) return;
    setIsSearchingUser(true);
    setFoundUser(null);
    try {
      const user = await dbService.getUser(manualUserSearch.trim());
      if (user) {
        setFoundUser(user);
      } else {
        alert("المستخدم غير موجود.");
      }
    } catch (e) {
      alert("خطأ أثناء البحث.");
    } finally {
      setIsSearchingUser(false);
    }
  };

  const handleCreateManualInvoice = async () => {
    if (!foundUser) return;
    setIsLoading(true);
    try {
      await dbService.createManualInvoice(foundUser.uid, manualPlan, manualAmount);
      setMessage({ text: `تم إنشاء الفاتورة اليدوية وتفعيل حساب ${foundUser.name} بنجاح ✅`, type: 'success' });
      setShowManualModal(false);
      setFoundUser(null);
      setManualUserSearch('');
      await loadFinanceData();
    } catch (e) {
      setMessage({ text: 'فشل إنشاء الفاتورة اليدوية.', type: 'error' });
    } finally {
      setIsLoading(false);
      setTimeout(() => setMessage(null), 4000);
    }
  };

  const handleTogglePaymentGateway = async () => {
    if (paymentSettings) {
        setIsToggling(true);
        try {
            const newState = !paymentSettings.isOnlinePaymentEnabled;
            const updatedSettings = { ...paymentSettings, isOnlinePaymentEnabled: newState };
            await dbService.savePaymentSettings(updatedSettings);
            setPaymentSettings(updatedSettings);
            setMessage({ text: 'تم تحديث حالة بوابة الدفع بنجاح.', type: 'success' });
        } catch (e) {
            setMessage({ text: 'فشل تحديث حالة البوابة.', type: 'error' });
        } finally {
            setIsToggling(false);
        }
    }
  };

  return (
    <div className="space-y-10 animate-fadeIn font-['Tajawal'] text-right pb-20" dir="rtl">
      <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <div>
            <h2 className="text-4xl font-black text-white italic tracking-tighter uppercase">الإدارة <span className="text-[#fbbf24]">المالية</span></h2>
            <p className="text-gray-500 mt-2">مراقبة الفواتير، الاشتراكات، وتسجيل دفعات "ومض" اليدوية.</p>
        </div>
        <div className="flex gap-4">
            <button 
                onClick={() => setShowManualModal(true)} 
                className="bg-[#00d2ff] text-black px-8 py-4 rounded-2xl font-black text-xs uppercase tracking-widest shadow-lg hover:scale-105 transition-all flex items-center gap-2"
            >
                <Plus size={18} /> تسجيل دفعة يدوية (ومض)
            </button>
            <button onClick={loadFinanceData} disabled={isLoading} className="bg-white/5 border border-white/10 px-6 py-4 rounded-2xl text-xs font-bold text-gray-400 hover:text-white transition-all flex items-center gap-3">
                <RefreshCw size={16} className={isLoading ? 'animate-spin' : ''} />
            </button>
        </div>
      </header>

      {message && (
        <div className={`p-5 rounded-3xl text-sm font-bold flex items-center gap-3 border animate-slideUp ${message.type === 'success' ? 'bg-green-500/10 text-green-400 border-green-500/20' : 'bg-red-500/10 text-red-400 border-red-500/20'}`}>
            <AlertCircle size={18} />
            {message.text}
        </div>
      )}
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {[
          { l: 'إجمالي المحصل', v: `${stats.totalRevenue.toLocaleString()} د.ك`, c: 'text-green-500', i: '💰' },
          { l: 'عمليات بالانتظار', v: `${stats.pendingAmount.toLocaleString()} د.ك`, c: 'text-yellow-500', i: '⏳' },
          { l: 'عدد المعاملات', v: stats.totalInvoices, c: 'text-[#00d2ff]', i: '🧾' }
        ].map((s, idx) => (
          <div key={idx} className="glass-panel p-10 rounded-[50px] border-white/5 relative overflow-hidden bg-gradient-to-br from-white/[0.02] to-transparent">
             <div className="text-3xl mb-6">{s.i}</div>
             <p className="text-[10px] font-black text-gray-500 uppercase tracking-widest mb-2">{s.l}</p>
             <h3 className={`text-4xl font-black ${s.c} tracking-tighter tabular-nums`}>{s.v}</h3>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        <div className="lg:col-span-8 glass-panel rounded-[50px] border-white/5 overflow-hidden flex flex-col min-h-[600px] shadow-2xl">
            <div className="p-8 border-b border-white/5 flex flex-col md:flex-row justify-between items-center bg-white/5 gap-6">
                <h4 className="text-lg font-black uppercase tracking-widest">سجل المعاملات المالية</h4>
                <div className="flex gap-2 bg-black/40 p-1.5 rounded-2xl border border-white/10">
                    {(['ALL', 'PAID', 'PENDING'] as const).map(f => (
                        <button key={f} onClick={() => setFilter(f)} className={`px-5 py-2 rounded-xl text-[10px] font-black uppercase transition-all ${filter === f ? 'bg-[#fbbf24] text-black shadow-lg' : 'text-gray-500 hover:text-white'}`}>
                            {f === 'ALL' ? 'الكل' : f}
                        </button>
                    ))}
                </div>
            </div>
            
            <div className="flex-1 overflow-x-auto no-scrollbar">
                <table className="w-full text-right">
                    <thead className="bg-white/5 text-[9px] font-black text-gray-500 uppercase tracking-widest">
                        <tr>
                            <th className="px-8 py-6">المرجع / Track ID</th>
                            <th className="px-8 py-6">الطالب</th>
                            <th className="px-8 py-6">المبلغ</th>
                            <th className="px-8 py-6">التاريخ</th>
                            <th className="px-8 py-6">الحالة</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-white/5">
                        {invoices.filter(i => filter === 'ALL' || i.status === filter).map(inv => (
                            <tr key={inv.id} className="hover:bg-white/[0.02] transition-all text-sm group">
                                <td className="px-8 py-6 font-mono text-xs opacity-50 group-hover:opacity-100 transition-opacity">#{inv.trackId}</td>
                                <td className="px-8 py-6 font-bold">{inv.userName}</td>
                                <td className="px-8 py-6 font-black text-[#00d2ff]">{inv.amount} د.ك</td>
                                <td className="px-8 py-6 text-[10px] font-mono opacity-40">{new Date(inv.date).toLocaleDateString('ar-KW')}</td>
                                <td className="px-8 py-6">
                                    <span className={`px-4 py-1.5 rounded-xl text-[9px] font-black uppercase border ${inv.status === 'PAID' ? 'bg-green-500/10 text-green-400 border-green-500/20' : 'bg-yellow-500/10 text-yellow-500 border border-yellow-500/20'}`}>
                                        {inv.status}
                                    </span>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
                {invoices.length === 0 && !isLoading && (
                    <div className="flex flex-col items-center justify-center py-40 opacity-20">
                        <AlertCircle size={64} className="mb-6" />
                        <p className="font-black text-2xl uppercase tracking-[0.2em]">لا توجد فواتير مسجلة</p>
                    </div>
                )}
            </div>
        </div>

        <div className="lg:col-span-4 space-y-8">
            {/* حالة البوابة */}
            <div className="glass-panel p-8 rounded-[40px] border-white/5 bg-gradient-to-br from-white/[0.02] to-transparent relative overflow-hidden group">
                <div className="absolute top-0 left-0 w-full h-1 bg-[#fbbf24] opacity-20 group-hover:opacity-100 transition-opacity"></div>
                <div className="flex justify-between items-center mb-6">
                    <div>
                        <h4 className="text-lg font-black uppercase tracking-widest">بوابة الدفع</h4>
                        <p className="text-[10px] text-gray-500 mt-1 font-bold">K-Net / Visa Gateway</p>
                    </div>
                    <button onClick={handleTogglePaymentGateway} disabled={isToggling} className={`p-4 rounded-2xl transition-all shadow-xl ${paymentSettings?.isOnlinePaymentEnabled ? 'bg-green-500 text-black' : 'bg-red-500 text-white'}`}>
                        {paymentSettings?.isOnlinePaymentEnabled ? <Power size={20}/> : <PowerOff size={20}/>}
                    </button>
                </div>
                <p className="text-xs text-gray-400 leading-relaxed italic border-t border-white/5 pt-4">"عند تعطيل البوابة، سيتم توجيه الطلاب تلقائياً لتعليمات دفع ومض."</p>
            </div>

            {/* أكواد التفعيل */}
            <div className="glass-panel p-8 rounded-[40px] border-white/5 bg-[#0a1118]/80">
                <div className="flex justify-between items-center mb-8 border-b border-white/5 pb-4">
                    <h4 className="text-lg font-black uppercase tracking-widest flex items-center gap-3"><Zap size={18} className="text-amber-400"/> أكواد التفعيل</h4>
                    <button onClick={() => { dbService.createSubscriptionCode('premium'); loadFinanceData(); }} disabled={isGenerating} className="p-3 bg-white/5 text-[#fbbf24] rounded-xl hover:bg-[#fbbf24] hover:text-black transition-all">
                        <Plus size={20}/>
                    </button>
                </div>
                <div className="space-y-3 max-h-64 overflow-y-auto no-scrollbar pr-1">
                    {codes.map(c => (
                        <div key={c.id} className="p-4 bg-black/40 border border-white/5 rounded-2xl flex justify-between items-center group hover:border-[#fbbf24]/30 transition-all">
                            <span className="font-mono text-sm text-gray-300 font-black tracking-tighter">{c.code}</span>
                            <button onClick={() => { navigator.clipboard.writeText(c.code); setMessage({text:'تم النسخ!', type:'success'}); }} className="p-2 text-gray-600 hover:text-[#fbbf24] opacity-0 group-hover:opacity-100 transition-all">
                                <Copy size={14}/>
                            </button>
                        </div>
                    ))}
                    {codes.length === 0 && <p className="text-center text-[10px] text-gray-600 py-10 font-bold uppercase tracking-widest">لا توجد أكواد متاحة</p>}
                </div>
            </div>
        </div>
      </div>

      {/* مودال الفاتورة اليدوية (تسجيل دفع ومض) */}
      {showManualModal && (
        <div className="fixed inset-0 z-[300] bg-black/95 backdrop-blur-xl flex items-center justify-center p-6 animate-fadeIn">
            <div className="bg-[#0a1118] border border-white/10 w-full max-w-xl rounded-[60px] p-12 relative shadow-3xl overflow-hidden border-2">
                <button onClick={() => { setShowManualModal(false); setFoundUser(null); }} className="absolute top-8 left-8 text-gray-500 hover:text-white p-3 bg-white/5 rounded-full">
                    <X size={24}/>
                </button>
                
                <header className="mb-10 text-center">
                    <div className="w-20 h-20 bg-[#00d2ff] text-black rounded-[30px] flex items-center justify-center text-3xl mx-auto mb-6 shadow-2xl">
                        <DollarSign size={40}/>
                    </div>
                    <h3 className="text-3xl font-black text-white italic">تسجيل فاتورة <span className="text-[#00d2ff]">يدوية</span></h3>
                    <p className="text-gray-500 text-sm mt-2 font-medium">استخدم هذه الواجهة لتفعيل اشتراك طالب حول مبالغ عبر "ومض".</p>
                </header>

                <div className="space-y-8">
                    {/* البحث عن الطالب */}
                    <div className="space-y-4">
                        <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest mr-4">البحث عن حساب الطالب</label>
                        <div className="flex gap-3">
                            <div className="relative flex-1">
                                <Search className="absolute top-1/2 right-6 -translate-y-1/2 text-gray-500" size={18}/>
                                <input 
                                    type="text" 
                                    value={manualUserSearch} 
                                    onChange={e => setManualUserSearch(e.target.value)}
                                    placeholder="ادخل البريد الإلكتروني أو الاسم..." 
                                    className="w-full bg-black/40 border border-white/10 rounded-[25px] pr-16 pl-6 py-5 text-white outline-none focus:border-[#00d2ff] font-bold shadow-inner"
                                />
                            </div>
                            <button onClick={searchUserForManual} disabled={isSearchingUser} className="bg-white text-black px-6 rounded-[25px] font-black hover:bg-[#00d2ff] transition-all">
                                {isSearchingUser ? <RefreshCw className="animate-spin"/> : 'بحث'}
                            </button>
                        </div>
                    </div>

                    {foundUser ? (
                        <div className="bg-white/[0.03] border-2 border-[#00d2ff]/30 p-8 rounded-[40px] animate-slideUp">
                            <div className="flex items-center gap-6 mb-8">
                                <div className="w-16 h-16 rounded-2xl bg-[#00d2ff]/10 border border-[#00d2ff]/30 flex items-center justify-center text-3xl">🎓</div>
                                <div className="text-right">
                                    <h4 className="text-xl font-black text-white">{foundUser.name}</h4>
                                    <p className="text-xs text-gray-500 font-mono italic">{foundUser.email}</p>
                                    <span className="text-[8px] bg-white/5 px-2 py-1 rounded-full text-[#fbbf24] mt-2 inline-block border border-white/5 uppercase">الصف {foundUser.grade}</span>
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-6 pt-6 border-t border-white/5">
                                <div className="space-y-2">
                                    <label className="text-[9px] font-black text-gray-500 uppercase tracking-widest mr-2">المبلغ المدفوع (د.ك)</label>
                                    <input 
                                        type="number" 
                                        value={manualAmount}
                                        onChange={e => setManualAmount(Number(e.target.value))}
                                        className="w-full bg-black/60 border border-white/10 rounded-2xl px-6 py-4 text-white outline-none focus:border-[#00d2ff] font-black text-2xl tabular-nums"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[9px] font-black text-gray-500 uppercase tracking-widest mr-2">نوع الباقة</label>
                                    <select 
                                        value={manualPlan}
                                        onChange={e => setManualPlan(e.target.value)}
                                        className="w-full bg-black/60 border border-white/10 rounded-2xl px-6 py-4 text-white outline-none focus:border-[#00d2ff] font-bold text-sm"
                                    >
                                        <option value="plan_premium">باقة التفوق (Premium)</option>
                                        <option value="plan_basic">الباقة الأساسية (Basic)</option>
                                    </select>
                                </div>
                            </div>

                            <button 
                                onClick={handleCreateManualInvoice}
                                disabled={isLoading}
                                className="w-full mt-10 py-6 bg-[#fbbf24] text-black rounded-[30px] font-black text-sm uppercase tracking-widest shadow-2xl hover:scale-[1.02] active:scale-95 transition-all flex items-center justify-center gap-4"
                            >
                                {isLoading ? <RefreshCw className="animate-spin"/> : <Zap fill="currentColor"/>} تفعيل الاشتراك يدوياً
                            </button>
                        </div>
                    ) : (
                        <div className="py-20 text-center border-2 border-dashed border-white/5 rounded-[40px] opacity-30">
                            <UserIcon size={48} className="mx-auto mb-4" />
                            <p className="font-bold text-sm uppercase tracking-widest">ابحث عن طالب لربط الدفعة</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
      )}
    </div>
  );
};

export default AdminFinancials;

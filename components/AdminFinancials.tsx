import React, { useState, useEffect } from 'react';
import { Invoice, PaymentStatus, PaymentSettings, SubscriptionCode } from '../types';
import { dbService } from '../services/db';
import { Copy, Plus, Power, PowerOff, RefreshCw } from 'lucide-react';

const AdminFinancials: React.FC = () => {
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [stats, setStats] = useState({ totalRevenue: 0, pendingAmount: 0, totalInvoices: 0 });
  const [filter, setFilter] = useState<PaymentStatus | 'ALL'>('ALL');
  const [paymentSettings, setPaymentSettings] = useState<PaymentSettings | null>(null);
  const [codes, setCodes] = useState<SubscriptionCode[]>([]);
  const [message, setMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(null);
  const [isToggling, setIsToggling] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);

  useEffect(() => {
    loadFinanceData();
  }, []);

  const loadFinanceData = async () => {
    try {
      const invRes = await dbService.getInvoices();
      if (invRes && invRes.data) {
        const invoicesData = invRes.data;
        setInvoices(invoicesData);
        const totalRevenue = invoicesData.filter(i => i.status === 'PAID').reduce((sum, i) => sum + i.amount, 0);
        const pendingAmount = invoicesData.filter(i => i.status === 'PENDING').reduce((sum, i) => sum + i.amount, 0);
        setStats({ totalRevenue, pendingAmount, totalInvoices: invoicesData.length });
      }

      const settings = await dbService.getPaymentSettings();
      setPaymentSettings(settings);

      const unusedCodes = await dbService.getUnusedSubscriptionCodes();
      setCodes(unusedCodes);

    } catch (e) {
      console.error("Failed to load finance data", e);
      setMessage({ text: 'فشل تحميل البيانات المالية.', type: 'error' });
    }
  };

  const handleUpdateStatus = async (id: string, status: PaymentStatus) => {
    await dbService.updateInvoiceStatus(id, status);
    loadFinanceData();
  };

  const handleTogglePaymentGateway = async () => {
    if (paymentSettings) {
        setIsToggling(true);
        try {
            const newState = !paymentSettings.isOnlinePaymentEnabled;
            await dbService.setPaymentSettings(newState);
            setPaymentSettings({ isOnlinePaymentEnabled: newState });
        } finally {
            setIsToggling(false);
        }
    }
  };

  const handleGenerateCode = async () => {
    setIsGenerating(true);
    try {
        await dbService.createSubscriptionCode('premium');
        await loadFinanceData();
        setMessage({ text: 'تم إنشاء كود جديد بنجاح.', type: 'success' });
    } finally {
        setIsGenerating(false);
        setTimeout(() => setMessage(null), 4000);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setMessage({ text: 'تم نسخ الكود!', type: 'success' });
    setTimeout(() => setMessage(null), 2000);
  };

  return (
    <div className="space-y-12 animate-fadeIn font-['Tajawal']" dir="rtl">
      <header className="mb-10 text-right">
        <h2 className="text-4xl font-black text-white italic">الخزينة <span className="text-[#fbbf24]">المركزية</span></h2>
        <p className="text-gray-500 font-medium">مراقبة الاشتراكات والمدفوعات (ل.س).</p>
      </header>

      {/* Payment Gateway Control */}
      <div className="glass-panel p-8 rounded-[40px] border-white/5 flex flex-col sm:flex-row justify-between items-center gap-6">
        <div className="text-right">
            <h4 className="text-xl font-black text-white">بوابة الدفع الإلكتروني</h4>
            <p className="text-sm text-gray-500 mt-1">تفعيل أو إيقاف استلام المدفوعات عبر المنصة.</p>
        </div>
        <button
            onClick={handleTogglePaymentGateway}
            disabled={isToggling}
            className={`px-8 py-5 rounded-2xl font-black text-xs uppercase tracking-widest flex items-center gap-3 transition-all ${paymentSettings?.isOnlinePaymentEnabled ? 'bg-green-500/20 text-green-400 border border-green-500/30' : 'bg-red-500/20 text-red-400 border border-red-500/30'}`}
        >
            {isToggling ? <RefreshCw className="animate-spin" size={16}/> : paymentSettings?.isOnlinePaymentEnabled ? <Power size={16}/> : <PowerOff size={16}/>}
            {paymentSettings?.isOnlinePaymentEnabled ? 'البوابة مفعلة' : 'البوابة متوقفة'}
        </button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {[
          { l: 'إجمالي الدخل المحصل', v: `${stats.totalRevenue.toLocaleString()} ل.س`, c: 'text-green-500', i: '💰' },
          { l: 'مبالغ قيد الانتظار', v: `${stats.pendingAmount.toLocaleString()} ل.س`, c: 'text-yellow-500', i: '⏳' },
          { l: 'إجمالي الفواتير', v: stats.totalInvoices, c: 'text-[#00d2ff]', i: '🧾' }
        ].map((s, idx) => (
          <div key={idx} className="glass-panel p-10 rounded-[50px] border-white/5 relative overflow-hidden group">
             <div className="text-3xl mb-6 group-hover:scale-110 transition-transform">{s.i}</div>
             <p className="text-[10px] font-black text-gray-500 uppercase tracking-widest mb-2">{s.l}</p>
             <h3 className={`text-3xl font-black ${s.c} tracking-tighter tabular-nums`}>{s.v}</h3>
          </div>
        ))}
      </div>

      {/* Invoices Table */}
      <div className="glass-panel rounded-[50px] border-white/5 overflow-hidden">
        <div className="p-8 border-b border-white/5 flex justify-between items-center bg-white/5">
           <h4 className="text-lg font-black uppercase tracking-widest">سجل المعاملات المالية</h4>
           <div className="flex gap-2">
              {(['ALL', 'PAID', 'PENDING'] as const).map(f => (
                <button 
                  key={f}
                  onClick={() => setFilter(f as any)}
                  className={`px-4 py-2 rounded-xl text-[8px] font-black uppercase transition-all ${filter === f ? 'bg-white text-black' : 'text-gray-500 hover:text-white'}`}
                >
                  {f === 'ALL' ? 'الكل' : f}
                </button>
              ))}
           </div>
        </div>
        <table className="w-full text-right">
          <thead className="bg-white/5 text-[9px] font-black text-gray-500 uppercase tracking-widest">
            <tr>
              <th className="px-10 py-6">الرقم</th>
              <th className="px-10 py-6">الطالب</th>
              <th className="px-10 py-6">المبلغ</th>
              <th className="px-10 py-6">الحالة</th>
              <th className="px-10 py-6">التاريخ</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/5">
            {invoices.filter(i => filter === 'ALL' || i.status === filter).map(inv => (
              <tr key={inv.id} className="hover:bg-white/5 transition-all text-xs">
                <td className="px-10 py-6 font-mono text-gray-500">#{inv.id.substring(0, 6)}</td>
                <td className="px-10 py-6 font-bold">{inv.userName}</td>
                <td className="px-10 py-6 font-black text-[#00d2ff]">{inv.amount.toLocaleString()} ل.س</td>
                <td className="px-10 py-6">
                  <span className={`px-3 py-1 rounded-full text-[8px] font-black uppercase ${
                    inv.status === 'PAID' ? 'bg-green-500/10 text-green-500' : 'bg-yellow-500/10 text-yellow-500'
                  }`}>
                    {inv.status}
                  </span>
                </td>
                <td className="px-10 py-6 text-gray-600">{new Date(inv.date).toLocaleDateString('ar-SY')}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default AdminFinancials;
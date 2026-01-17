import React, { useState, useEffect } from 'react';
import { Invoice, PaymentStatus, PaymentSettings, SubscriptionCode } from '../types';
import { dbService } from '../services/db';
import { Copy, Plus, Power, PowerOff, RefreshCw, AlertCircle } from 'lucide-react';

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

      const unusedCodes = await dbService.getUnusedSubscriptionCodes();
      setCodes(unusedCodes);

    } catch (e) {
      console.error("Failed to load finance data", e);
      setMessage({ text: 'فشل تحميل البيانات المالية. يرجى التأكد من اتصال قاعدة البيانات.', type: 'error' });
    } finally {
      setIsLoading(false);
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
            setMessage({ text: 'تم تحديث حالة بوابة الدفع بنجاح.', type: 'success' });
        } catch (e) {
            setMessage({ text: 'فشل تحديث حالة البوابة.', type: 'error' });
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
    } catch (e) {
        setMessage({ text: 'فشل في إنشاء كود.', type: 'error' });
    } finally {
        setIsGenerating(false);
    }
  };

  return (
    <div className="space-y-10 animate-fadeIn font-['Tajawal'] text-right" dir="rtl">
      <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <div>
            <h2 className="text-4xl font-black text-white italic tracking-tighter uppercase">الإدارة <span className="text-[#fbbf24]">المالية</span></h2>
            <p className="text-gray-500 mt-2">مراقبة الفواتير، الاشتراكات، وإدارة بوابات الدفع.</p>
        </div>
        <button onClick={loadFinanceData} disabled={isLoading} className="bg-white/5 border border-white/10 px-6 py-3 rounded-2xl text-xs font-bold text-gray-400 hover:text-white transition-all flex items-center gap-3">
            <RefreshCw size={16} className={isLoading ? 'animate-spin' : ''} />
            تحديث البيانات
        </button>
      </header>

      {message && (
        <div className={`p-4 rounded-2xl text-sm font-bold flex items-center gap-3 border ${message.type === 'success' ? 'bg-green-500/10 text-green-400 border-green-500/20' : 'bg-red-500/10 text-red-400 border-red-500/20'}`}>
            <AlertCircle size={18} />
            {message.text}
        </div>
      )}
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {[
          { l: 'إجمالي المحصل', v: `${stats.totalRevenue.toLocaleString()} د.ك`, c: 'text-green-500', i: '💰' },
          { l: 'بالانتظار', v: `${stats.pendingAmount.toLocaleString()} د.ك`, c: 'text-yellow-500', i: '⏳' },
          { l: 'عدد العمليات', v: stats.totalInvoices, c: 'text-[#00d2ff]', i: '🧾' }
        ].map((s, idx) => (
          <div key={idx} className="glass-panel p-10 rounded-[50px] border-white/5 relative overflow-hidden bg-gradient-to-br from-white/[0.02] to-transparent">
             <div className="text-3xl mb-6">{s.i}</div>
             <p className="text-[10px] font-black text-gray-500 uppercase tracking-widest mb-2">{s.l}</p>
             <h3 className={`text-4xl font-black ${s.c} tracking-tighter tabular-nums`}>{s.v}</h3>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        <div className="lg:col-span-8 glass-panel rounded-[50px] border-white/5 overflow-hidden flex flex-col min-h-[500px]">
            <div className="p-8 border-b border-white/5 flex justify-between items-center bg-white/5">
                <h4 className="text-lg font-black uppercase tracking-widest">سجل المعاملات</h4>
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
                            <th className="px-8 py-6">الفاتورة</th>
                            <th className="px-8 py-6">الطالب</th>
                            <th className="px-8 py-6">المبلغ</th>
                            <th className="px-8 py-6">الحالة</th>
                            <th className="px-8 py-6">الإجراء</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-white/5">
                        {invoices.filter(i => filter === 'ALL' || i.status === filter).map(inv => (
                            <tr key={inv.id} className="hover:bg-white/[0.02] transition-all text-sm">
                                <td className="px-8 py-6 font-mono opacity-50">#{inv.id.substring(0, 6)}</td>
                                <td className="px-8 py-6 font-bold">{inv.userName}</td>
                                <td className="px-8 py-6 font-black text-[#00d2ff]">{inv.amount} د.ك</td>
                                <td className="px-8 py-6">
                                    <span className={`px-3 py-1 rounded-lg text-[9px] font-black uppercase ${inv.status === 'PAID' ? 'bg-green-500/10 text-green-500 border border-green-500/20' : 'bg-yellow-500/10 text-yellow-500 border border-yellow-500/20'}`}>
                                        {inv.status}
                                    </span>
                                </td>
                                <td className="px-8 py-6">
                                    <button onClick={() => handleUpdateStatus(inv.id, 'PAID')} className="p-2 bg-green-500/10 text-green-500 rounded-lg hover:bg-green-500 hover:text-black transition-all">✓</button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
                {invoices.length === 0 && !isLoading && (
                    <div className="flex flex-col items-center justify-center py-32 opacity-20">
                        <AlertCircle size={48} className="mb-4" />
                        <p className="font-black uppercase tracking-[0.2em]">لا توجد فواتير مسجلة</p>
                    </div>
                )}
            </div>
        </div>

        <div className="lg:col-span-4 space-y-8">
            <div className="glass-panel p-8 rounded-[40px] border-white/5 bg-gradient-to-br from-white/[0.02] to-transparent">
                <div className="flex justify-between items-center mb-6">
                    <h4 className="text-lg font-black uppercase tracking-widest">بوابة الدفع</h4>
                    <button onClick={handleTogglePaymentGateway} disabled={isToggling} className={`p-3 rounded-2xl transition-all ${paymentSettings?.isOnlinePaymentEnabled ? 'bg-green-500/20 text-green-500' : 'bg-red-500/20 text-red-500'}`}>
                        {paymentSettings?.isOnlinePaymentEnabled ? <Power size={20}/> : <PowerOff size={20}/>}
                    </button>
                </div>
                <p className="text-xs text-gray-500 leading-relaxed">عند إيقاف البوابة، سيتم توجيه الطلاب للدفع اليدوي عبر رقم التواصل المعتمد.</p>
            </div>

            <div className="glass-panel p-8 rounded-[40px] border-white/5">
                <div className="flex justify-between items-center mb-6">
                    <h4 className="text-lg font-black uppercase tracking-widest">أكواد التفعيل</h4>
                    <button onClick={handleGenerateCode} disabled={isGenerating} className="p-3 bg-[#fbbf24] text-black rounded-2xl shadow-lg hover:scale-110 active:scale-90 transition-all">
                        <Plus size={20}/>
                    </button>
                </div>
                <div className="space-y-3 max-h-64 overflow-y-auto no-scrollbar pr-1">
                    {codes.map(c => (
                        <div key={c.id} className="p-4 bg-black/40 border border-white/5 rounded-2xl flex justify-between items-center group">
                            <span className="font-mono text-sm text-gray-300">{c.code}</span>
                            <button onClick={() => { navigator.clipboard.writeText(c.code); setMessage({text:'تم النسخ!', type:'success'}); }} className="p-2 text-gray-600 hover:text-[#fbbf24] opacity-0 group-hover:opacity-100 transition-all">
                                <Copy size={14}/>
                            </button>
                        </div>
                    ))}
                    {codes.length === 0 && <p className="text-center text-xs text-gray-600 py-4 italic">لا توجد أكواد غير مستخدمة</p>}
                </div>
            </div>
        </div>
      </div>
    </div>
  );
};

export default AdminFinancials;
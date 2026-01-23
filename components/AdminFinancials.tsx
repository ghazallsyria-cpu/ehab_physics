
import React, { useState, useEffect } from 'react';
import { Invoice, PaymentStatus, PaymentSettings, User } from '../types';
import { dbService } from '../services/db';
import { 
  Plus, RefreshCw, AlertCircle, Search, User as UserIcon, 
  X, Banknote, Zap, FileText, CheckCircle2, ShieldCheck,
  DollarSign
} from 'lucide-react';

const AdminFinancials: React.FC = () => {
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [stats, setStats] = useState({ totalRevenue: 0, pendingAmount: 0, totalInvoices: 0 });
  const [filter, setFilter] = useState<PaymentStatus | 'ALL'>('ALL');
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(null);

  // حالة الفاتورة اليدوية
  const [showManualModal, setShowManualModal] = useState(false);
  const [manualSearch, setManualSearch] = useState('');
  const [foundUser, setFoundUser] = useState<User | null>(null);
  const [manualAmount, setManualAmount] = useState(35);
  const [manualPlan, setManualPlan] = useState('plan_premium');

  useEffect(() => { loadData(); }, []);

  const loadData = async () => {
    setIsLoading(true);
    try {
      const { data } = await dbService.getInvoices();
      setInvoices(data);
      const paid = data.filter(i => i.status === 'PAID').reduce((s, i) => s + (i.amount || 0), 0);
      const pending = data.filter(i => i.status === 'PENDING').reduce((s, i) => s + (i.amount || 0), 0);
      setStats({ totalRevenue: paid, pendingAmount: pending, totalInvoices: data.length });
    } catch (e) { setMessage({ text: 'فشل تحميل البيانات المالية', type: 'error' }); }
    finally { setIsLoading(false); }
  };

  const searchUser = async () => {
    if (!manualSearch.trim()) return;
    const user = await dbService.getUser(manualSearch.trim());
    if (user) setFoundUser(user);
    else alert("المستخدم غير موجود");
  };

  const handleCreateManualInvoice = async () => {
    if (!foundUser) return;
    setIsLoading(true);
    try {
      await dbService.createManualInvoice(foundUser.uid, manualPlan, manualAmount);
      setMessage({ text: `تم تفعيل حساب ${foundUser.name} بنجاح ✅`, type: 'success' });
      setShowManualModal(false);
      setFoundUser(null);
      setManualSearch('');
      await loadData();
    } catch (e) { setMessage({ text: 'فشل إنشاء الفاتورة اليدوية', type: 'error' }); }
    finally { setIsLoading(false); }
  };

  return (
    <div className="space-y-10 animate-fadeIn font-['Tajawal'] text-right pb-20" dir="rtl">
      <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <div>
            <h2 className="text-4xl font-black text-white italic tracking-tighter uppercase">الإدارة <span className="text-[#fbbf24]">المالية</span></h2>
            <p className="text-gray-500 mt-2 italic font-bold">توثيق الدفعات اليدوية (ومض) وجدولة الميزانية.</p>
        </div>
        <div className="flex gap-4">
            <button onClick={() => setShowManualModal(true)} className="bg-[#00d2ff] text-black px-8 py-4 rounded-2xl font-black text-xs uppercase tracking-widest shadow-lg hover:scale-105 transition-all flex items-center gap-2">
                <Plus size={18} /> تسجيل دفعة "ومض"
            </button>
            <button onClick={loadData} disabled={isLoading} className="bg-white/5 border border-white/10 px-6 py-4 rounded-2xl text-gray-400 hover:text-white transition-all">
                <RefreshCw size={16} className={isLoading ? 'animate-spin' : ''} />
            </button>
        </div>
      </header>

      {message && (
        <div className={`p-5 rounded-3xl text-sm font-bold flex items-center gap-3 border animate-slideUp ${message.type === 'success' ? 'bg-green-500/10 text-green-400 border-green-500/20' : 'bg-red-500/10 text-red-400 border-red-500/20'}`}>
            <AlertCircle size={18} /> {message.text}
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {[
          { l: 'إجمالي المحصل', v: `${stats.totalRevenue} د.ك`, c: 'text-green-500', i: '💰' },
          { l: 'تحويلات قيد التدقيق', v: `${stats.pendingAmount} د.ك`, c: 'text-yellow-500', i: '⏳' },
          { l: 'عدد المعاملات', v: stats.totalInvoices, c: 'text-[#00d2ff]', i: '🧾' }
        ].map((s, idx) => (
          <div key={idx} className="glass-panel p-10 rounded-[50px] border-white/5 bg-gradient-to-br from-white/[0.02] to-transparent shadow-xl">
             <div className="text-3xl mb-6">{s.i}</div>
             <p className="text-[10px] font-black text-gray-500 uppercase tracking-widest mb-2">{s.l}</p>
             <h3 className={`text-4xl font-black ${s.c} tracking-tighter tabular-nums`}>{s.v}</h3>
          </div>
        ))}
      </div>

      <div className="glass-panel rounded-[50px] border-white/5 overflow-hidden shadow-2xl">
          <div className="p-8 border-b border-white/5 flex justify-between items-center bg-white/5">
              <h4 className="text-lg font-black uppercase tracking-widest">سجل العمليات المالية</h4>
              <div className="flex gap-2">
                {['ALL', 'PAID', 'PENDING'].map(f => (
                    <button key={f} onClick={() => setFilter(f as any)} className={`px-5 py-2 rounded-xl text-[10px] font-black transition-all ${filter === f ? 'bg-[#fbbf24] text-black shadow-lg' : 'text-gray-500 hover:text-white'}`}>
                        {f === 'ALL' ? 'الكل' : f}
                    </button>
                ))}
              </div>
          </div>
          <table className="w-full text-right">
              <thead className="bg-white/5 text-[9px] font-black text-gray-500 uppercase tracking-widest">
                  <tr>
                      <th className="px-8 py-6">المرجع / Track ID</th>
                      <th className="px-8 py-6">اسم الطالب</th>
                      <th className="px-8 py-6">المبلغ</th>
                      <th className="px-8 py-6">النوع</th>
                      <th className="px-8 py-6">الحالة</th>
                  </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                  {invoices.filter(i => filter === 'ALL' || i.status === filter).map(inv => (
                      <tr key={inv.id} className="hover:bg-white/[0.02] transition-colors">
                          <td className="px-8 py-6 font-mono text-xs opacity-50 group-hover:opacity-100 transition-opacity">#{inv.trackId}</td>
                          <td className="px-8 py-6 font-bold">{inv.userName}</td>
                          <td className="px-8 py-6 font-black text-[#00d2ff]">{inv.amount} د.ك</td>
                          <td className="px-8 py-6">
                              <span className={`text-[8px] font-black px-2 py-0.5 rounded uppercase ${inv.authCode === 'ADMIN_MANUAL' ? 'bg-blue-500/20 text-blue-400' : 'bg-green-500/20 text-green-400'}`}>
                                  {inv.authCode === 'ADMIN_MANUAL' ? 'يدوي (ومض)' : 'بوابة دفع'}
                              </span>
                          </td>
                          <td className="px-8 py-6">
                              <span className={`px-4 py-1.5 rounded-xl text-[9px] font-black uppercase ${inv.status === 'PAID' ? 'bg-green-500/10 text-green-400 border border-green-500/20' : 'bg-yellow-500/10 text-yellow-500'}`}>
                                  {inv.status}
                              </span>
                          </td>
                      </tr>
                  ))}
              </tbody>
          </table>
          {invoices.length === 0 && <div className="py-40 text-center opacity-20 italic">لا توجد سجلات مالية بعد.</div>}
      </div>

      {showManualModal && (
        <div className="fixed inset-0 z-[300] bg-black/95 backdrop-blur-xl flex items-center justify-center p-6 animate-fadeIn">
            <div className="bg-[#0a1118] border border-white/10 w-full max-w-xl rounded-[60px] p-12 relative shadow-3xl overflow-hidden border-2">
                <button onClick={() => { setShowManualModal(false); setFoundUser(null); }} className="absolute top-8 left-8 text-gray-500 hover:text-white p-3 bg-white/5 rounded-full"><X size={24}/></button>
                <header className="mb-10 text-center">
                    <div className="w-20 h-20 bg-[#00d2ff] text-black rounded-[30px] flex items-center justify-center text-3xl mx-auto mb-6 shadow-2xl"><DollarSign size={40}/></div>
                    <h3 className="text-3xl font-black text-white italic">تسجيل فاتورة <span className="text-[#00d2ff]">يدوية</span></h3>
                    <p className="text-gray-500 text-sm mt-2 font-medium">تسجيل تحويل "ومض" وتفعيل حساب الطالب رسمياً.</p>
                </header>

                <div className="space-y-8">
                    <div className="space-y-4">
                        <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest mr-4">البحث عن الطالب لربط الدفعة</label>
                        <div className="flex gap-3">
                            <input type="text" value={manualSearch} onChange={e => setManualSearch(e.target.value)} placeholder="البريد الإلكتروني للطالب..." className="flex-1 bg-black/40 border border-white/10 rounded-[25px] px-8 py-5 text-white outline-none focus:border-[#00d2ff] font-bold shadow-inner" />
                            <button onClick={searchUser} className="bg-white text-black px-6 rounded-[25px] font-black hover:bg-[#00d2ff] transition-all">بحث</button>
                        </div>
                    </div>

                    {foundUser && (
                        <div className="bg-white/[0.03] border-2 border-[#00d2ff]/30 p-8 rounded-[40px] animate-slideUp">
                            <div className="flex items-center gap-6 mb-8">
                                <div className="w-16 h-16 rounded-2xl bg-[#00d2ff]/10 flex items-center justify-center text-3xl shadow-lg">🎓</div>
                                <div className="text-right">
                                    <h4 className="text-xl font-black text-white">{foundUser.name}</h4>
                                    <p className="text-xs text-gray-500 font-mono italic">{foundUser.email}</p>
                                    <span className="text-[8px] bg-[#fbbf24]/10 px-2 py-1 rounded-full text-[#fbbf24] mt-2 inline-block border border-[#fbbf24]/20 font-black uppercase">الصف {foundUser.grade}</span>
                                </div>
                            </div>
                            <div className="grid grid-cols-2 gap-6 pt-6 border-t border-white/5">
                                <div className="space-y-2">
                                    <label className="text-[9px] font-black text-gray-500 uppercase tracking-widest mr-2">المبلغ (د.ك)</label>
                                    <input type="number" value={manualAmount} onChange={e => setManualAmount(Number(e.target.value))} className="w-full bg-black/60 border border-white/10 rounded-2xl px-6 py-4 text-white outline-none focus:border-[#00d2ff] font-black text-2xl" />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[9px] font-black text-gray-500 uppercase tracking-widest mr-2">نوع الباقة</label>
                                    <select value={manualPlan} onChange={e => setManualPlan(e.target.value)} className="w-full bg-black/60 border border-white/10 rounded-2xl px-6 py-4 text-white outline-none">
                                        <option value="plan_premium">باقة التفوق (Premium)</option>
                                        <option value="plan_basic">الباقة الأساسية (Basic)</option>
                                    </select>
                                </div>
                            </div>
                            <button onClick={handleCreateManualInvoice} disabled={isLoading} className="w-full mt-10 py-6 bg-[#fbbf24] text-black rounded-[30px] font-black text-sm uppercase tracking-widest shadow-2xl hover:scale-[1.02] active:scale-95 transition-all flex items-center justify-center gap-4">
                                {isLoading ? <RefreshCw className="animate-spin"/> : <Zap fill="currentColor"/>} تفعيل الحساب فوراً
                            </button>
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

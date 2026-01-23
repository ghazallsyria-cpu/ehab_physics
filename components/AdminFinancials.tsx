
import React, { useState, useEffect } from 'react';
import { Invoice, PaymentStatus, PaymentSettings, User } from '../types';
import { dbService } from '../services/db';
import { 
  Plus, RefreshCw, AlertCircle, Search, User as UserIcon, 
  X, Banknote, Zap, FileText, CheckCircle2, ShieldCheck,
  DollarSign, Mail, Phone, Calendar
} from 'lucide-react';

const AdminFinancials: React.FC = () => {
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [stats, setStats] = useState({ totalRevenue: 0, pendingAmount: 0, totalInvoices: 0 });
  const [filter, setFilter] = useState<PaymentStatus | 'ALL'>('ALL');
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(null);

  // حالة نافذة "ومض"
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

  const searchUser = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!manualSearch.trim()) return;
    
    setIsLoading(true);
    const user = await dbService.getUser(manualSearch.trim());
    if (user) {
        setFoundUser(user);
    } else {
        alert("عذراً، لم يتم العثور على طالب بهذا البريد الإلكتروني.");
    }
    setIsLoading(false);
  };

  const handleCreateManualInvoice = async () => {
    if (!foundUser) return;
    setIsLoading(true);
    try {
      await dbService.createManualInvoice(foundUser.uid, manualPlan, manualAmount);
      setMessage({ text: `تم تفعيل حساب الطالب "${foundUser.name}" بنجاح وإرسال إشعار له ✅`, type: 'success' });
      setShowManualModal(false);
      setFoundUser(null);
      setManualSearch('');
      await loadData();
    } catch (e) { setMessage({ text: 'فشل تفعيل الاشتراك اليدوي.', type: 'error' }); }
    finally { setIsLoading(false); }
  };

  return (
    <div className="space-y-10 animate-fadeIn font-['Tajawal'] text-right pb-20" dir="rtl">
      <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <div>
            <h2 className="text-4xl font-black text-white italic tracking-tighter uppercase">الإدارة <span className="text-emerald-500">المالية</span></h2>
            <p className="text-gray-500 mt-2 font-bold italic">توثيق دفعات "ومض" وتفعيل حسابات المتميزين.</p>
        </div>
        <div className="flex gap-4">
            <button 
                onClick={() => setShowManualModal(true)} 
                className="bg-emerald-500 text-black px-10 py-5 rounded-[25px] font-black text-xs uppercase tracking-widest shadow-[0_15px_40px_rgba(16,185,129,0.2)] hover:scale-105 active:scale-95 transition-all flex items-center gap-3"
            >
                <DollarSign size={20} /> تسجيل تحويل "ومض"
            </button>
            <button onClick={loadData} disabled={isLoading} className="bg-white/5 border border-white/10 px-6 py-5 rounded-[25px] text-gray-400 hover:text-white transition-all">
                <RefreshCw size={18} className={isLoading ? 'animate-spin' : ''} />
            </button>
        </div>
      </header>

      {message && (
        <div className={`p-6 rounded-[30px] text-sm font-bold flex items-center gap-4 border animate-slideUp ${message.type === 'success' ? 'bg-green-500/10 text-green-400 border-green-500/20' : 'bg-red-500/10 text-red-400 border-red-500/20'}`}>
            {message.type === 'success' ? <CheckCircle2 size={24}/> : <AlertCircle size={24}/>}
            {message.text}
        </div>
      )}

      {/* Stats Dashboard */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {[
          { l: 'المبيعات المعتمدة', v: `${stats.totalRevenue} د.ك`, c: 'text-emerald-400', i: <Banknote size={32}/> },
          { l: 'طلبات قيد المراجعة', v: `${stats.pendingAmount} د.ك`, c: 'text-amber-400', i: <RefreshCw size={32}/> },
          { l: 'إجمالي الحركات', v: stats.totalInvoices, c: 'text-blue-400', i: <FileText size={32}/> }
        ].map((s, idx) => (
          <div key={idx} className="glass-panel p-10 rounded-[50px] border-white/5 bg-gradient-to-br from-white/[0.02] to-transparent shadow-xl relative overflow-hidden group">
             <div className="absolute -top-4 -left-4 opacity-5 group-hover:opacity-10 transition-opacity transform group-hover:scale-110">{s.i}</div>
             <p className="text-[10px] font-black text-gray-500 uppercase tracking-widest mb-3">{s.l}</p>
             <h3 className={`text-5xl font-black ${s.c} tracking-tighter tabular-nums`}>{s.v}</h3>
          </div>
        ))}
      </div>

      {/* Transaction Log */}
      <div className="glass-panel rounded-[50px] border-white/5 overflow-hidden shadow-2xl bg-black/20">
          <div className="p-8 border-b border-white/5 flex flex-col md:flex-row justify-between items-center gap-6 bg-white/[0.02]">
              <div className="flex items-center gap-4">
                  <h4 className="text-xl font-black uppercase tracking-widest text-white">سجل العمليات</h4>
                  <div className="flex gap-2 bg-black/40 p-1.5 rounded-2xl border border-white/5">
                    {['ALL', 'PAID', 'PENDING'].map(f => (
                        <button key={f} onClick={() => setFilter(f as any)} className={`px-5 py-2 rounded-xl text-[9px] font-black transition-all ${filter === f ? 'bg-white text-black shadow-lg' : 'text-gray-500 hover:text-white'}`}>
                            {f === 'ALL' ? 'الكل' : f}
                        </button>
                    ))}
                  </div>
              </div>
              <div className="bg-white/5 px-4 py-2 rounded-xl border border-white/10">
                  <p className="text-[9px] font-black text-gray-500 uppercase tracking-tighter">إجمالي المسجل في السحابة</p>
                  <p className="text-sm font-bold text-white tabular-nums">{invoices.length} معاملة</p>
              </div>
          </div>
          <div className="overflow-x-auto">
              <table className="w-full text-right">
                  <thead className="bg-white/5 text-[9px] font-black text-gray-600 uppercase tracking-widest border-b border-white/5">
                      <tr>
                          <th className="px-8 py-6">المرجع / Track ID</th>
                          <th className="px-8 py-6">اسم الطالب</th>
                          <th className="px-8 py-6">المبلغ</th>
                          <th className="px-8 py-6">النوع</th>
                          <th className="px-8 py-6">الحالة</th>
                          <th className="px-8 py-6">التاريخ</th>
                      </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5">
                      {invoices.filter(i => filter === 'ALL' || i.status === filter).map(inv => (
                          <tr key={inv.id} className="hover:bg-white/[0.02] transition-colors group">
                              <td className="px-8 py-6 font-mono text-xs opacity-50 group-hover:opacity-100 transition-opacity">#{inv.trackId}</td>
                              <td className="px-8 py-6">
                                  <div className="flex items-center gap-3">
                                      <div className="w-8 h-8 rounded-lg bg-white/5 flex items-center justify-center text-gray-500 font-black text-xs">{inv.userName.charAt(0)}</div>
                                      <span className="font-bold text-white">{inv.userName}</span>
                                  </div>
                              </td>
                              <td className="px-8 py-6 font-black text-emerald-400 tabular-nums">{inv.amount} د.ك</td>
                              <td className="px-8 py-6">
                                  <span className={`text-[8px] font-black px-3 py-1 rounded-full uppercase border ${inv.authCode === 'ADMIN_MANUAL' ? 'bg-blue-500/10 text-blue-400 border-blue-500/20' : 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'}`}>
                                      {inv.authCode === 'ADMIN_MANUAL' ? 'يدوي (ومض)' : 'بوابة دفع'}
                                  </span>
                              </td>
                              <td className="px-8 py-6">
                                  <div className="flex items-center gap-2">
                                      <div className={`w-1.5 h-1.5 rounded-full ${inv.status === 'PAID' ? 'bg-green-500' : 'bg-amber-500 animate-pulse'}`}></div>
                                      <span className={`text-[9px] font-black uppercase ${inv.status === 'PAID' ? 'text-green-400' : 'text-amber-500'}`}>{inv.status}</span>
                                  </div>
                              </td>
                              <td className="px-8 py-6 text-[10px] text-gray-500 font-bold tabular-nums">{new Date(inv.date).toLocaleDateString('ar-KW')}</td>
                          </tr>
                      ))}
                  </tbody>
              </table>
          </div>
          {invoices.length === 0 && !isLoading && <div className="py-40 text-center opacity-20 italic">لا توجد سجلات مالية بعد.</div>}
      </div>

      {/* Modal - Womda Manual Registration */}
      {showManualModal && (
        <div className="fixed inset-0 z-[300] bg-black/95 backdrop-blur-xl flex items-center justify-center p-6 animate-fadeIn">
            <div className="bg-[#0a1118] border border-white/10 w-full max-w-xl rounded-[60px] p-12 relative shadow-3xl overflow-hidden border-2">
                <button onClick={() => { setShowManualModal(false); setFoundUser(null); }} className="absolute top-8 left-8 text-gray-500 hover:text-white p-3 bg-white/5 rounded-full"><X size={24}/></button>
                
                <header className="mb-12 text-center">
                    <div className="w-24 h-24 bg-emerald-500 text-black rounded-[35px] flex items-center justify-center text-3xl mx-auto mb-6 shadow-[0_20px_50px_rgba(16,185,129,0.3)]">
                        <DollarSign size={48}/>
                    </div>
                    <h3 className="text-4xl font-black text-white italic tracking-tighter">تسجيل دفعة <span className="text-emerald-400">ومض</span></h3>
                    <p className="text-gray-500 text-sm mt-3 font-medium">قم بربط التحويل اليدوي بحساب الطالب لتفعيله فوراً.</p>
                </header>

                <div className="space-y-10">
                    <form onSubmit={searchUser} className="space-y-4">
                        <label className="text-[10px] font-black text-gray-500 uppercase tracking-[0.3em] mr-4">البحث عن الطالب بالبريد الإلكتروني</label>
                        <div className="flex gap-4">
                            <div className="relative flex-1">
                                <Mail className="absolute top-1/2 right-6 -translate-y-1/2 text-gray-600" size={20}/>
                                <input 
                                    type="email" 
                                    value={manualSearch} 
                                    onChange={e => setManualSearch(e.target.value)} 
                                    placeholder="student@example.com" 
                                    className="w-full bg-black/40 border border-white/10 rounded-[25px] pr-16 pl-8 py-5 text-white outline-none focus:border-emerald-500 font-bold shadow-inner text-left ltr" 
                                />
                            </div>
                            <button type="submit" className="bg-white text-black px-10 rounded-[25px] font-black hover:bg-emerald-400 transition-all shadow-xl">بحث</button>
                        </div>
                    </form>

                    {foundUser ? (
                        <div className="bg-white/[0.03] border-2 border-emerald-500/30 p-10 rounded-[50px] animate-slideUp relative overflow-hidden">
                            <div className="absolute top-0 right-0 p-4 opacity-5 pointer-events-none rotate-12"><ShieldCheck size={120}/></div>
                            
                            <div className="flex items-center gap-8 mb-10 relative z-10">
                                <div className="w-20 h-20 rounded-[30px] bg-emerald-500/10 flex items-center justify-center text-4xl shadow-lg border border-emerald-500/20">🎓</div>
                                <div className="text-right flex-1">
                                    <h4 className="text-2xl font-black text-white">{foundUser.name}</h4>
                                    <div className="flex gap-4 mt-2">
                                        <span className="text-[10px] text-emerald-400 font-mono italic">{foundUser.email}</span>
                                        <span className="text-[9px] bg-white/5 px-2 py-0.5 rounded-lg text-gray-500 font-black">الصف {foundUser.grade}</span>
                                    </div>
                                </div>
                            </div>
                            
                            <div className="grid grid-cols-2 gap-8 pt-8 border-t border-white/5 relative z-10">
                                <div className="space-y-3">
                                    <label className="text-[9px] font-black text-gray-500 uppercase tracking-widest mr-2">المبلغ المستلم (د.ك)</label>
                                    <input 
                                        type="number" 
                                        value={manualAmount} 
                                        onChange={e => setManualAmount(Number(e.target.value))} 
                                        className="w-full bg-black/60 border border-white/10 rounded-2xl px-8 py-5 text-white outline-none focus:border-emerald-400 font-black text-3xl tabular-nums shadow-inner" 
                                    />
                                </div>
                                <div className="space-y-3">
                                    <label className="text-[9px] font-black text-gray-500 uppercase tracking-widest mr-2">نوع تفعيل الباقة</label>
                                    <select 
                                        value={manualPlan} 
                                        onChange={e => setManualPlan(e.target.value)} 
                                        className="w-full h-[68px] bg-black/60 border border-white/10 rounded-2xl px-6 text-white outline-none font-bold"
                                    >
                                        <option value="plan_premium">باقة التفوق (Premium)</option>
                                        <option value="plan_basic">الباقة الأساسية (Free)</option>
                                    </select>
                                </div>
                            </div>
                            
                            <button 
                                onClick={handleCreateManualInvoice} 
                                disabled={isLoading} 
                                className="w-full mt-12 py-7 bg-[#fbbf24] text-black rounded-[30px] font-black text-sm uppercase tracking-[0.3em] shadow-[0_20px_50px_rgba(251,191,36,0.3)] hover:scale-[1.02] active:scale-95 transition-all flex items-center justify-center gap-5"
                            >
                                {isLoading ? <RefreshCw className="animate-spin" size={20}/> : <Zap size={20} fill="currentColor"/>} تفعيل الحساب فوراً
                            </button>
                            <p className="text-[10px] text-gray-600 text-center mt-6 italic">عند الضغط، سيتم ترقية حساب الطالب وإرسال إشعار ترحيبي له.</p>
                        </div>
                    ) : (
                        <div className="py-20 text-center opacity-30 border-2 border-dashed border-white/5 rounded-[40px]">
                            <Search size={48} className="mx-auto mb-4 text-gray-600" />
                            <p className="font-bold text-sm">أدخل بريد الطالب لعرض بياناته والبدء بالتفعيل</p>
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

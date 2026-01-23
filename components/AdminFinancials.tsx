
import React, { useState, useEffect, useRef } from 'react';
import { Invoice, PaymentStatus, User } from '../types';
import { dbService } from '../services/db';
import { 
  Plus, RefreshCw, AlertCircle, Search, 
  X, Banknote, Zap, FileText, CheckCircle2,
  DollarSign, Mail, TrendingUp, Calendar, Clock, Trash2, MessageCircle, Phone
} from 'lucide-react';
import anime from 'animejs';

const AdminFinancials: React.FC = () => {
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [stats, setStats] = useState({ daily: 0, monthly: 0, yearly: 0, total: 0, pending: 0 });
  const [filter, setFilter] = useState<PaymentStatus | 'ALL'>('ALL');
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(null);

  // مراجع للأنيميشن
  const dailyRef = useRef<HTMLHeadingElement>(null);
  const monthlyRef = useRef<HTMLHeadingElement>(null);
  const yearlyRef = useRef<HTMLHeadingElement>(null);

  useEffect(() => { loadData(); }, []);

  const animateNumbers = (targetStats: typeof stats) => {
    const obj = { d: 0, m: 0, y: 0 };
    anime({
      targets: obj,
      d: targetStats.daily,
      m: targetStats.monthly,
      y: targetStats.yearly,
      round: 1,
      easing: 'easeOutExpo',
      duration: 2000,
      update: () => {
        if (dailyRef.current) dailyRef.current.innerText = `${obj.d} د.ك`;
        if (monthlyRef.current) monthlyRef.current.innerText = `${obj.m} د.ك`;
        if (yearlyRef.current) yearlyRef.current.innerText = `${obj.y} د.ك`;
      }
    });
  };

  const loadData = async () => {
    setIsLoading(true);
    try {
      const { data } = await dbService.getInvoices();
      const advanced = await dbService.getAdvancedFinancialStats();
      setInvoices(data);
      setStats(advanced);
      animateNumbers(advanced);
    } catch (e) { setMessage({ text: 'فشل تحميل البيانات المالية', type: 'error' }); }
    finally { setIsLoading(false); }
  };

  const handleDeleteInvoice = async (invoiceId: string) => {
    if (!window.confirm('⚠️ تحذير: هل أنت متأكد من حذف هذا السجل المالي نهائياً؟ لا يمكن التراجع عن هذه الخطوة.')) return;
    
    setIsLoading(true);
    try {
      await dbService.deleteInvoice(invoiceId);
      setMessage({ text: 'تم حذف السجل المالي بنجاح ✓', type: 'success' });
      await loadData(); // إعادة تحميل البيانات لتحديث العدادات والجداول
    } catch (e) {
      setMessage({ text: 'فشل حذف السجل.', type: 'error' });
    } finally {
      setIsLoading(false);
      setTimeout(() => setMessage(null), 3000);
    }
  };

  // حالة نافذة "ومض"
  const [showManualModal, setShowManualModal] = useState(false);
  const [manualSearch, setManualSearch] = useState('');
  const [foundUser, setFoundUser] = useState<User | null>(null);
  const [manualAmount, setManualAmount] = useState(35);
  const [manualPlan, setManualPlan] = useState('plan_premium');
  const [successInvoice, setSuccessInvoice] = useState<Invoice | null>(null);

  const searchUser = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!manualSearch.trim()) return;
    setIsLoading(true);
    setFoundUser(null);
    try {
        const user = await dbService.getUser(manualSearch.trim()); // يبحث بالرقم أو الإيميل آلياً الآن
        if (user) {
            setFoundUser(user);
        } else {
            alert("عذراً، لم يتم العثور على طالب بهذا الرقم أو البريد الإلكتروني.");
        }
    } catch (e) {
        console.error(e);
    } finally {
        setIsLoading(false);
    }
  };

  const handleCreateManualInvoice = async () => {
    if (!foundUser) return;
    setIsLoading(true);
    try {
      const invoice = await dbService.createManualInvoice(foundUser.uid, manualPlan, manualAmount);
      setSuccessInvoice(invoice);
      setMessage({ text: `تم تفعيل حساب الطالب "${foundUser.name}" بنجاح وإرسال إشعار داخلي ✅`, type: 'success' });
      await loadData();
    } catch (e) { setMessage({ text: 'فشل تفعيل الاشتراك اليدوي.', type: 'error' }); }
    finally { setIsLoading(false); }
  };

  const notifyStudentWhatsApp = () => {
    if (!foundUser || !successInvoice) return;
    
    const text = encodeURIComponent(
        `مرحباً ${foundUser.name}،\n\n` +
        `يسر إدارة *المركز السوري للعلوم* إبلاغك بأنه تم اعتماد دفعتك بقيمة *${successInvoice.amount} د.ك* بنجاح.\n\n` +
        `✅ حالة الاشتراك: *مفعل (Premium)*\n` +
        `🔢 رقم المرجع: ${successInvoice.trackId}\n\n` +
        `يمكنك الآن الدخول للمنصة ومشاهدة إيصالك الرسمي في "مركز الاشتراكات" لضمان حقوقك.\n\n` +
        `نتمنى لك رحلة تعليمية ممتعة!`
    );
    
    window.open(`https://wa.me/${foundUser.phone || ''}?text=${text}`, '_blank');
  };

  return (
    <div className="space-y-10 animate-fadeIn font-['Tajawal'] text-right pb-20" dir="rtl">
      <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <div>
            <h2 className="text-4xl font-black text-white italic tracking-tighter uppercase">الإدارة <span className="text-emerald-500">المالية</span></h2>
            <p className="text-gray-500 mt-2 font-bold italic">مراقبة النمو المالي وتحصيل دفعات "ومض".</p>
        </div>
        <div className="flex gap-4">
            <button onClick={() => { setShowManualModal(true); setSuccessInvoice(null); setManualSearch(''); setFoundUser(null); }} className="bg-emerald-500 text-black px-10 py-5 rounded-[25px] font-black text-xs uppercase tracking-widest shadow-xl hover:scale-105 active:scale-95 transition-all flex items-center gap-3">
                <DollarSign size={20} /> تسجيل دفعة "ومض"
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

      {/* KPI Dashboard */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {[
          { l: 'المبيعات اليومية', r: dailyRef, c: 'text-blue-400', i: <Clock />, d: 'خلال 24 ساعة الماضية' },
          { l: 'التحصيل الشهري', r: monthlyRef, c: 'text-amber-400', i: <Calendar />, d: `شهر ${new Date().getMonth() + 1} الحالي` },
          { l: 'الإيراد السنوي', r: yearlyRef, c: 'text-emerald-400', i: <TrendingUp />, d: `عام ${new Date().getFullYear()}` }
        ].map((s, idx) => (
          <div key={idx} className="glass-panel p-10 rounded-[50px] border-white/5 bg-gradient-to-br from-white/[0.02] to-transparent shadow-xl relative overflow-hidden group">
             <div className="absolute -top-4 -left-4 opacity-5 group-hover:opacity-10 transition-opacity transform group-hover:scale-110 text-white">{s.i}</div>
             <p className="text-[10px] font-black text-gray-500 uppercase tracking-[0.2em] mb-3">{s.l}</p>
             <h3 ref={s.r} className={`text-5xl font-black ${s.c} tracking-tighter tabular-nums`}>0 د.ك</h3>
             <p className="text-[9px] text-gray-600 mt-4 font-bold italic">{s.d}</p>
          </div>
        ))}
      </div>

      {/* Transaction Log */}
      <div className="glass-panel rounded-[50px] border-white/5 overflow-hidden shadow-2xl bg-black/20">
          <div className="p-8 border-b border-white/5 flex flex-col md:flex-row justify-between items-center gap-6 bg-white/[0.02]">
              <div className="flex items-center gap-4">
                  <h4 className="text-xl font-black uppercase tracking-widest text-white">سجل العمليات المعتمدة</h4>
                  <div className="flex gap-2 bg-black/40 p-1.5 rounded-2xl border border-white/5">
                    {['ALL', 'PAID', 'PENDING'].map(f => (
                        <button key={f} onClick={() => setFilter(f as any)} className={`px-5 py-2 rounded-xl text-[9px] font-black transition-all ${filter === f ? 'bg-white text-black shadow-lg' : 'text-gray-500 hover:text-white'}`}>
                            {f === 'ALL' ? 'الكل' : f}
                        </button>
                    ))}
                  </div>
              </div>
          </div>
          <div className="overflow-x-auto">
              <table className="w-full text-right">
                  <thead className="bg-white/5 text-[9px] font-black text-gray-600 uppercase tracking-widest border-b border-white/5">
                      <tr>
                          <th className="px-8 py-6">المرجع / Track ID</th>
                          <th className="px-8 py-6">الطالب</th>
                          <th className="px-8 py-6">المبلغ</th>
                          <th className="px-8 py-6">التاريخ</th>
                          <th className="px-8 py-6">الحالة</th>
                          <th className="px-8 py-6 text-center">الإجراءات</th>
                      </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5">
                      {invoices.filter(i => filter === 'ALL' || i.status === filter).map(inv => (
                          <tr key={inv.id} className="hover:bg-white/[0.02] transition-colors group">
                              <td className="px-8 py-6 font-mono text-xs opacity-50">#{inv.trackId}</td>
                              <td className="px-8 py-6">
                                  <div className="flex items-center gap-3">
                                      <div className="w-8 h-8 rounded-lg bg-white/5 flex items-center justify-center text-gray-500 font-black text-xs">{inv.userName.charAt(0)}</div>
                                      <span className="font-bold text-white text-sm">{inv.userName}</span>
                                  </div>
                              </td>
                              <td className="px-8 py-6 font-black text-emerald-400 tabular-nums">{inv.amount} د.ك</td>
                              <td className="px-8 py-6 text-[10px] text-gray-500 font-bold tabular-nums">{new Date(inv.date).toLocaleDateString('ar-KW')}</td>
                              <td className="px-8 py-6">
                                  <span className={`text-[9px] font-black uppercase ${inv.status === 'PAID' ? 'text-green-400' : 'text-amber-500'}`}>{inv.status}</span>
                              </td>
                              <td className="px-8 py-6 text-center">
                                  <button 
                                    onClick={() => handleDeleteInvoice(inv.id)} 
                                    className="p-3 bg-red-500/10 text-red-500 rounded-xl hover:bg-red-500 hover:text-white transition-all opacity-0 group-hover:opacity-100"
                                    title="حذف الفاتورة"
                                  >
                                      <Trash2 size={16} />
                                  </button>
                              </td>
                          </tr>
                      ))}
                  </tbody>
              </table>
          </div>
      </div>

      {/* Manual Modal - Womda */}
      {showManualModal && (
        <div className="fixed inset-0 z-[300] bg-black/95 backdrop-blur-xl flex items-center justify-center p-6 animate-fadeIn">
            <div className="bg-[#0a1118] border border-white/10 w-full max-w-xl rounded-[60px] p-12 relative shadow-3xl overflow-hidden border-2">
                <button onClick={() => { setShowManualModal(false); setFoundUser(null); setSuccessInvoice(null); }} className="absolute top-8 left-8 text-gray-500 hover:text-white p-3 bg-white/5 rounded-full"><X size={24}/></button>
                
                {!successInvoice ? (
                    <>
                        <header className="mb-12 text-center">
                            <div className="w-24 h-24 bg-emerald-500 text-black rounded-[35px] flex items-center justify-center text-3xl mx-auto mb-6 shadow-2xl">
                                <DollarSign size={48}/>
                            </div>
                            <h3 className="text-4xl font-black text-white italic tracking-tighter">تسجيل دفعة <span className="text-emerald-400">ومض</span></h3>
                            <p className="text-gray-500 text-sm mt-3 font-medium">البحث عن الطالب برقم الموبايل لتفعيل الحساب.</p>
                        </header>

                        <div className="space-y-10">
                            <form onSubmit={searchUser} className="space-y-4">
                                <label className="text-[10px] font-black text-gray-500 uppercase tracking-[0.3em] mr-4 text-right block w-full">رقم الموبايل (مثلاً: 553XXXXX)</label>
                                <div className="flex gap-4">
                                    <div className="flex-1 relative">
                                        <Phone className="absolute top-1/2 right-6 -translate-y-1/2 text-gray-500" size={18} />
                                        <input 
                                            type="text" 
                                            value={manualSearch} 
                                            onChange={e => setManualSearch(e.target.value)} 
                                            placeholder="965XXXXXXXX" 
                                            className="w-full bg-black/40 border border-white/10 rounded-[25px] pr-16 pl-6 py-5 text-white outline-none focus:border-emerald-500 font-black text-2xl tabular-nums ltr text-left" 
                                        />
                                    </div>
                                    <button type="submit" className="bg-white text-black px-10 rounded-[25px] font-black hover:bg-emerald-400 transition-all">بحث</button>
                                </div>
                            </form>

                            {foundUser && (
                                <div className="bg-white/[0.03] border-2 border-emerald-500/30 p-10 rounded-[50px] animate-slideUp">
                                    <div className="flex items-center gap-8 mb-10">
                                        <div className="w-20 h-20 rounded-[30px] bg-emerald-500/10 flex items-center justify-center text-4xl shadow-lg border border-emerald-500/20">🎓</div>
                                        <div className="text-right flex-1">
                                            <h4 className="text-2xl font-black text-white">{foundUser.name}</h4>
                                            <div className="flex flex-col gap-1 mt-1">
                                                <span className="text-[10px] text-gray-400 font-mono flex items-center gap-2"><Phone size={10}/> {foundUser.phone}</span>
                                                <span className="text-[10px] text-gray-400 font-mono flex items-center gap-2"><Mail size={10}/> {foundUser.email}</span>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="grid grid-cols-2 gap-8 border-t border-white/5 pt-8">
                                        <div className="space-y-3">
                                            <label className="text-[9px] font-black text-gray-500 uppercase tracking-widest">المبلغ (د.ك)</label>
                                            <input type="number" value={manualAmount} onChange={e => setManualAmount(Number(e.target.value))} className="w-full bg-black/60 border border-white/10 rounded-2xl px-6 py-4 text-white font-black text-2xl outline-none" />
                                        </div>
                                        <div className="space-y-3">
                                            <label className="text-[9px] font-black text-gray-500 uppercase tracking-widest">نوع الباقة</label>
                                            <select value={manualPlan} onChange={e => setManualPlan(e.target.value)} className="w-full h-[66px] bg-black/60 border border-white/10 rounded-2xl px-6 text-white outline-none font-bold">
                                                <option value="plan_premium">باقة التفوق</option>
                                                <option value="plan_basic">الأساسية</option>
                                            </select>
                                        </div>
                                    </div>
                                    <button onClick={handleCreateManualInvoice} disabled={isLoading} className="w-full mt-10 py-6 bg-emerald-500 text-black rounded-[30px] font-black text-sm uppercase tracking-widest shadow-2xl hover:scale-[1.02] active:scale-95 transition-all">تنشيط الاشتراك الآن</button>
                                </div>
                            )}
                        </div>
                    </>
                ) : (
                    <div className="text-center py-10 animate-slideUp">
                        <div className="w-24 h-24 bg-green-500 text-black rounded-full flex items-center justify-center text-5xl mx-auto mb-8 shadow-2xl animate-bounce">✓</div>
                        <h3 className="text-4xl font-black text-white mb-4">تم التفعيل بنجاح!</h3>
                        <p className="text-gray-400 text-lg mb-12">تم تحديث حساب الطالب وإصدار فاتورته الرقمية.</p>
                        
                        <div className="space-y-4">
                            <button 
                                onClick={notifyStudentWhatsApp}
                                className="w-full py-6 bg-[#25D366] text-white rounded-[30px] font-black text-sm uppercase tracking-widest shadow-xl flex items-center justify-center gap-3 hover:scale-105 transition-all"
                            >
                                <MessageCircle size={24} fill="currentColor" /> إرسال الإيصال عبر واتساب
                            </button>
                            <button 
                                onClick={() => { setShowManualModal(false); setFoundUser(null); setSuccessInvoice(null); }}
                                className="w-full py-5 text-gray-500 font-black text-xs uppercase tracking-widest hover:text-white transition-all"
                            >
                                إغلاق النافذة
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </div>
      )}
    </div>
  );
};

export default AdminFinancials;

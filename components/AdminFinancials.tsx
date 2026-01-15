import React, { useState, useEffect } from 'react';
import { Invoice, PaymentStatus, CloudLog } from '../types';
import { dbService } from '../services/db';

const AdminFinancials: React.FC = () => {
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [stats, setStats] = useState({ totalRevenue: 0, pendingAmount: 0, totalInvoices: 0 });
  const [filter, setFilter] = useState<PaymentStatus | 'ALL'>('ALL');

  useEffect(() => {
    loadFinance();
  }, []);

  const loadFinance = async () => {
    try {
      const invRes = await dbService.getInvoices();
      // FIX: The method 'getFinancialStats' does not exist. Financial statistics are now calculated manually from the fetched invoices.
      if (invRes && invRes.data) {
        const invoicesData = invRes.data;
        setInvoices(invoicesData);

        const totalRevenue = invoicesData
          .filter(i => i.status === 'PAID')
          .reduce((sum, i) => sum + i.amount, 0);
        const pendingAmount = invoicesData
          .filter(i => i.status === 'PENDING')
          .reduce((sum, i) => sum + i.amount, 0);
        const totalInvoices = invoicesData.length;
        setStats({ totalRevenue, pendingAmount, totalInvoices });
      }
    } catch (e) {
      console.error("Failed to load finance data", e);
    }
  };

  const handleUpdateStatus = async (id: string, status: PaymentStatus) => {
    await dbService.updateInvoiceStatus(id, status);
    loadFinance();
  };

  return (
    <div className="space-y-12 animate-fadeIn">
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {[
          { l: 'إجمالي الدخل المحصل', v: `${stats.totalRevenue.toLocaleString()} ل.س`, c: 'text-green-500', i: '💰' },
          { l: 'مدفوعات قيد التحصيل', v: `${stats.pendingAmount.toLocaleString()} ل.س`, c: 'text-yellow-500', i: '⏳' },
          { l: 'عدد الفواتير المصدرة', v: stats.totalInvoices, c: 'text-[#00d2ff]', i: '🧾' }
        ].map((s, idx) => (
          <div key={idx} className="glass-panel p-10 rounded-[50px] border-white/5 relative overflow-hidden">
             <div className="text-3xl mb-6">{s.i}</div>
             <p className="text-[10px] font-black text-gray-500 uppercase tracking-widest mb-2">{s.l}</p>
             <h3 className={`text-4xl font-black ${s.c} tracking-tighter tabular-nums`}>{s.v}</h3>
          </div>
        ))}
      </div>

      {/* Invoices Table */}
      <div className="glass-panel rounded-[50px] border-white/5 overflow-hidden">
        <div className="p-8 border-b border-white/5 flex justify-between items-center bg-white/5">
           <h4 className="text-lg font-black uppercase tracking-widest">سجل المعاملات المالية</h4>
           <div className="flex gap-2">
              {(['ALL', 'PAID', 'PENDING', 'OVERDUE'] as const).map(f => (
                <button 
                  key={f}
                  onClick={() => setFilter(f)}
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
              <th className="px-10 py-6">رقم الفاتورة</th>
              <th className="px-10 py-6">الطالب</th>
              <th className="px-10 py-6">القيمة</th>
              <th className="px-10 py-6">التاريخ</th>
              <th className="px-10 py-6">الحالة</th>
              <th className="px-10 py-6">الإجراءات</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/5">
            {invoices.filter(i => filter === 'ALL' || i.status === filter).map(inv => (
              <tr key={inv.id} className="hover:bg-white/5 transition-all text-xs">
                <td className="px-10 py-6 font-bold tabular-nums">#{inv.id}</td>
                <td className="px-10 py-6 font-bold">{inv.userName}</td>
                <td className="px-10 py-6 font-black text-[#00d2ff]">{inv.amount.toLocaleString()} ل.س</td>
                <td className="px-10 py-6 text-gray-500">{inv.date}</td>
                <td className="px-10 py-6">
                  <span className={`px-3 py-1 rounded-full text-[8px] font-black uppercase ${
                    inv.status === 'PAID' ? 'bg-green-500/10 text-green-500' : 
                    inv.status === 'PENDING' ? 'bg-yellow-500/10 text-yellow-500' : 'bg-red-500/10 text-red-500'
                  }`}>
                    {inv.status}
                  </span>
                </td>
                <td className="px-10 py-6">
                   <div className="flex gap-4">
                      <button onClick={() => handleUpdateStatus(inv.id, 'PAID')} className="text-green-500 hover:scale-110 transition-transform">✓</button>
                      <button onClick={() => handleUpdateStatus(inv.id, 'CANCELLED')} className="text-red-500 hover:scale-110 transition-transform">✕</button>
                      <button onClick={() => window.print()} className="text-gray-500 hover:text-white">🖨️</button>
                   </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {invoices.length === 0 && <div className="p-20 text-center text-gray-500 font-black uppercase tracking-widest">لا توجد سجلات مالية</div>}
      </div>
    </div>
  );
};

export default AdminFinancials;

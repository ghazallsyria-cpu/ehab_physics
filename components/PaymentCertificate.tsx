
import React from 'react';
import { Invoice, User } from '../types';
import QRCode from 'react-qr-code';

interface PaymentCertificateProps {
  user: User;
  invoice: Invoice;
  onBack: () => void;
}

const PaymentCertificate: React.FC<PaymentCertificateProps> = ({ user, invoice, onBack }) => {
  const printCertificate = () => {
    window.print();
  };

  // Generate verification data for QR Code
  const qrData = JSON.stringify({
    ref: invoice.paymentId,
    track: invoice.trackId,
    student: user.name,
    amount: invoice.amount,
    date: invoice.date
  });

  return (
    <div className="max-w-4xl mx-auto py-12 px-6 animate-fadeIn font-['Tajawal'] text-white print:bg-white print:text-black">
      <button 
        onClick={onBack} 
        className="mb-10 text-[10px] font-black text-gray-500 hover:text-[#fbbf24] uppercase tracking-[0.4em] transition-all flex items-center gap-4 print:hidden"
      >
        ← العودة للوحة التحكم
      </button>

      <div className="glass-panel p-12 md:p-20 rounded-[60px] border-white/10 relative overflow-hidden bg-white/[0.02] shadow-[0_50px_100px_rgba(0,0,0,0.4)] print:border-black print:shadow-none print:bg-white print:p-10">
        {/* Certificate Watermark */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-[180px] font-black text-white/[0.02] -rotate-12 pointer-events-none select-none print:hidden">
          SYRIA
        </div>

        <header className="flex flex-col md:flex-row justify-between items-center mb-16 gap-10 border-b border-white/10 pb-12 print:border-black">
           <div className="text-center md:text-right">
              <div className="w-20 h-20 bg-[#fbbf24] rounded-3xl flex items-center justify-center text-4xl shadow-2xl mb-6 mx-auto md:mx-0 print:border print:border-black">⚛️</div>
              <h1 className="text-3xl font-black tracking-tighter">المركز <span className="text-[#fbbf24] print:text-black">السوري</span> للعلوم</h1>
              <p className="text-[10px] font-black text-gray-500 uppercase tracking-widest mt-2">إيصال دفع رقمي معتمد</p>
           </div>
           <div className="text-center md:text-left space-y-2">
              <p className="text-xs font-black uppercase text-gray-500">Track ID</p>
              <p className="text-xl font-mono font-black text-[#fbbf24] print:text-black">{invoice.trackId}</p>
              <p className="text-[10px] text-gray-600 tabular-nums">{new Date(invoice.date).toLocaleString('ar-KW')}</p>
           </div>
        </header>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-16 mb-16">
           <div className="space-y-10">
              <div className="space-y-2">
                 <label className="text-[9px] font-black text-gray-500 uppercase tracking-[0.3em]">اسم الطالب المستفيد</label>
                 <p className="text-2xl font-black">{user.name}</p>
              </div>
              <div className="space-y-2">
                 <label className="text-[9px] font-black text-gray-500 uppercase tracking-[0.3em]">نوع الاشتراك المفعّل</label>
                 <p className="text-2xl font-black text-[#00d2ff] print:text-black uppercase italic">{invoice.planId === 'p2' ? 'University' : 'Premium'} ⚡</p>
              </div>
              <div className="space-y-2">
                 <label className="text-[9px] font-black text-gray-500 uppercase tracking-[0.3em]">طريقة الدفع</label>
                 <p className="text-lg font-bold">بوابة الدفع الإلكتروني (Sandbox)</p>
              </div>
           </div>

           <div className="flex flex-col items-center justify-center bg-black/40 p-10 rounded-[50px] border border-white/5 print:bg-white print:border-black">
              <div className="bg-white p-4 rounded-[30px] shadow-2xl mb-6 print:p-2 w-[160px] h-[160px] flex items-center justify-center border-4 border-black/10">
                 <QRCode
                    value={qrData}
                    size={256}
                    style={{ height: "auto", maxWidth: "100%", width: "100%" }}
                 />
              </div>
              <p className="text-[10px] font-black text-gray-500 uppercase tracking-widest text-center">كود التحقق الرقمي</p>
           </div>
        </div>

        <div className="bg-white/[0.03] p-10 rounded-[40px] border border-white/5 flex flex-col md:flex-row justify-between items-center gap-8 print:border-black print:bg-white">
           <div className="text-center md:text-right">
              <p className="text-[10px] font-black text-gray-500 uppercase tracking-widest mb-1">المبلغ الإجمالي المدفوع</p>
              <h3 className="text-5xl font-black text-[#fbbf24] print:text-black">{invoice.amount.toLocaleString()} <span className="text-xl">د.ك</span></h3>
           </div>
           <div className="text-center md:text-left space-y-1">
              <p className="text-[9px] font-black text-green-500 uppercase tracking-widest bg-green-500/10 px-4 py-1 rounded-full mb-3 inline-block">PAID / مكتمل</p>
              <p className="text-[10px] font-bold text-gray-500">Auth Code: {invoice.authCode}</p>
              <p className="text-[10px] font-bold text-gray-500">Ref: {invoice.paymentId}</p>
           </div>
        </div>

        <footer className="mt-16 pt-8 border-t border-white/5 flex justify-between items-center print:border-black">
           <p className="text-[9px] font-bold text-gray-600 max-w-xs leading-relaxed italic">يُعتبر هذا المستند إثباتاً رسمياً لعملية الدفع والاشتراك في منصة المركز السوري للعلوم. جميع المعاملات تخضع لسياسة الخصوصية وشروط الاستخدام.</p>
           <div className="text-right print:hidden">
              <button 
                onClick={printCertificate}
                className="bg-white/5 hover:bg-white hover:text-black px-8 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all"
              >
                طباعة / تحميل PDF
              </button>
           </div>
        </footer>
      </div>
      
      <p className="mt-10 text-center text-gray-600 text-[10px] font-black uppercase tracking-[0.6em] print:hidden">Official Digital Receipt • Phase 6 Ready</p>
    </div>
  );
};

export default PaymentCertificate;
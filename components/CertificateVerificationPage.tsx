import React, { useState } from 'react';
import { CheckCircle2, Search, XCircle, ShieldCheck } from 'lucide-react';
import { dbService } from '../services/db';

const CertificateVerificationPage: React.FC = () => {
  const [trackId, setTrackId] = useState('');
  const [result, setResult] = useState<'valid' | 'invalid' | null>(null);
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  const handleVerify = async () => {
      if(!trackId.trim()) return;
      setLoading(true);
      setResult(null);
      try {
          const { data: invoices } = await dbService.getInvoices();
          const found = invoices.find(inv => inv.trackId.toUpperCase() === trackId.toUpperCase() && inv.status === 'PAID');
          
          if (found) {
              setResult('valid');
              setData(found);
          } else {
              setResult('invalid');
              setData(null);
          }
      } catch (e) {
          console.error("Verification failed", e);
          setResult('invalid');
      } finally {
          setLoading(false);
      }
  };

  return (
    <div className="min-h-screen bg-[#000] flex flex-col items-center justify-center p-6 font-['Tajawal'] text-white relative overflow-hidden" dir="rtl">
        {/* Background Effects */}
        <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-blue-900/20 via-[#000] to-[#000]"></div>
        <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-5"></div>

        <div className="w-full max-w-lg glass-panel p-12 rounded-[60px] border border-white/10 text-center relative z-10 shadow-2xl backdrop-blur-xl">
            <div className="w-20 h-20 bg-blue-600 rounded-[30px] flex items-center justify-center mx-auto mb-8 shadow-[0_0_40px_rgba(37,99,235,0.4)]">
                <ShieldCheck size={40} className="text-white" />
            </div>
            
            <h2 className="text-4xl font-black mb-2 tracking-tighter">نظام التحقق <span className="text-blue-500">المركزي</span></h2>
            <p className="text-gray-500 text-sm mb-10 font-medium">أدخل رقم التتبع (Track ID) الموجود على الشهادة للتأكد من صحتها.</p>
            
            <div className="relative mb-8">
                <input 
                    type="text" 
                    value={trackId}
                    onChange={e => setTrackId(e.target.value)}
                    placeholder="CERT-XXXX-XXXX..."
                    className="w-full bg-black/40 border-2 border-white/10 rounded-2xl px-6 py-5 text-center text-xl font-mono font-black uppercase outline-none focus:border-blue-500 transition-all placeholder:text-gray-700"
                />
            </div>
            
            <button 
                onClick={handleVerify} 
                disabled={loading || !trackId}
                className="w-full bg-blue-600 text-white py-5 rounded-2xl font-black text-sm uppercase tracking-[0.2em] hover:scale-105 active:scale-95 transition-all disabled:opacity-50 shadow-xl"
            >
                {loading ? 'جاري الفحص في قاعدة البيانات...' : 'تحقق من الوثيقة'}
            </button>

            {result === 'valid' && data && (
                <div className="mt-10 p-8 bg-green-500/10 border border-green-500/30 rounded-[40px] animate-slideUp">
                    <div className="w-16 h-16 bg-green-500 rounded-full flex items-center justify-center mx-auto mb-4 shadow-[0_0_20px_rgba(34,197,94,0.4)]">
                        <CheckCircle2 className="w-8 h-8 text-white" />
                    </div>
                    <h3 className="text-2xl font-black text-green-400 mb-6 tracking-tighter">وثيقة رسمية معتمدة</h3>
                    <div className="space-y-3 text-right">
                        <div className="flex justify-between border-b border-white/5 pb-2">
                            <span className="text-gray-400 text-xs font-bold">اسم الطالب</span>
                            <span className="font-black text-white">{data.userName}</span>
                        </div>
                        <div className="flex justify-between border-b border-white/5 pb-2">
                            <span className="text-gray-400 text-xs font-bold">تاريخ الإصدار</span>
                            <span className="font-mono text-white text-xs">{new Date(data.date).toLocaleDateString('en-GB')}</span>
                        </div>
                        <div className="flex justify-between pt-2">
                            <span className="text-gray-400 text-xs font-bold">الحالة</span>
                            <span className="bg-green-500 text-black text-[9px] font-black px-3 py-1 rounded-full uppercase">Active</span>
                        </div>
                    </div>
                </div>
            )}

            {result === 'invalid' && (
                <div className="mt-10 p-8 bg-red-500/10 border border-red-500/30 rounded-[40px] animate-slideUp">
                    <div className="w-16 h-16 bg-red-500 rounded-full flex items-center justify-center mx-auto mb-4 shadow-[0_0_20px_rgba(239,68,68,0.4)]">
                        <XCircle className="w-8 h-8 text-white" />
                    </div>
                    <h3 className="text-2xl font-black text-red-400 mb-2 tracking-tighter">وثيقة غير موجودة</h3>
                    <p className="text-gray-400 text-sm leading-relaxed">رقم التتبع المدخل غير موجود في سجلاتنا الرسمية. يرجى التأكد من الرقم أو التواصل مع الإدارة.</p>
                </div>
            )}
        </div>
        
        <footer className="absolute bottom-6 text-gray-700 text-[10px] font-black uppercase tracking-[0.3em]">
            Syrian Science Center • Official Verification Node
        </footer>
    </div>
  );
};

export default CertificateVerificationPage;
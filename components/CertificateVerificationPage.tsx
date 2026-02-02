import React, { useState } from 'react';
import { CheckCircle2, Search, XCircle } from 'lucide-react';
import { dbService } from '../services/db';

const CertificateVerificationPage: React.FC = () => {
  const [trackId, setTrackId] = useState('');
  const [result, setResult] = useState<'valid' | 'invalid' | null>(null);
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  const handleVerify = async () => {
      setLoading(true);
      const { data: invoices } = await dbService.getInvoices();
      const found = invoices.find(inv => inv.trackId === trackId && inv.status === 'PAID');
      
      if (found) {
          setResult('valid');
          setData(found);
      } else {
          setResult('invalid');
          setData(null);
      }
      setLoading(false);
  };

  return (
    <div className="min-h-screen bg-[#0A2540] flex items-center justify-center p-6 font-['Tajawal'] text-white" dir="rtl">
        <div className="w-full max-w-lg glass-panel p-10 rounded-[50px] border border-white/10 text-center">
            <h2 className="text-3xl font-black mb-8">التحقق من الوثائق</h2>
            
            <div className="relative mb-8">
                <input 
                    type="text" 
                    value={trackId}
                    onChange={e => setTrackId(e.target.value)}
                    placeholder="أدخل رقم التتبع (Track ID)..."
                    className="w-full bg-black/40 border-2 border-white/10 rounded-2xl px-6 py-4 text-center text-xl font-mono uppercase outline-none focus:border-[#fbbf24]"
                />
            </div>
            
            <button 
                onClick={handleVerify} 
                disabled={loading || !trackId}
                className="w-full bg-[#fbbf24] text-black py-4 rounded-2xl font-black text-lg hover:scale-105 transition-all disabled:opacity-50"
            >
                {loading ? 'جاري الفحص...' : 'تحقق الآن'}
            </button>

            {result === 'valid' && data && (
                <div className="mt-8 p-6 bg-green-500/10 border border-green-500/30 rounded-3xl animate-slideUp">
                    <CheckCircle2 className="w-12 h-12 text-green-500 mx-auto mb-4" />
                    <h3 className="text-xl font-bold text-green-400 mb-2">وثيقة معتمدة</h3>
                    <p className="text-gray-300">الطالب: <span className="font-bold text-white">{data.userName}</span></p>
                    <p className="text-gray-300">تاريخ الإصدار: {new Date(data.date).toLocaleDateString()}</p>
                </div>
            )}

            {result === 'invalid' && (
                <div className="mt-8 p-6 bg-red-500/10 border border-red-500/30 rounded-3xl animate-slideUp">
                    <XCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
                    <h3 className="text-xl font-bold text-red-400">وثيقة غير صحيحة</h3>
                    <p className="text-gray-400 text-sm">رقم التتبع المدخل غير موجود في سجلاتنا الرسمية.</p>
                </div>
            )}
        </div>
    </div>
  );
};

export default CertificateVerificationPage;
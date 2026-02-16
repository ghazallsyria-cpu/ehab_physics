import React, { useState, useEffect } from 'react';
import { useAuth } from './ProtectedRoute';
import { dbService } from '../services/db';
import { Invoice } from '../types';
import PaymentCertificate from './PaymentCertificate';
import { Loader2, AlertCircle } from 'lucide-react';

const CertificateViewer: React.FC = () => {
  const { user } = useAuth();
  const [latestInvoice, setLatestInvoice] = useState<Invoice | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    const load = async () => {
        setIsLoading(true);
        try {
            const { data } = await dbService.getInvoices();
            // Get user's latest paid invoice to act as a certificate source
            const userInvoices = data.filter(i => i.userId === user.uid && i.status === 'PAID').sort((a,b) => new Date(b.date).getTime() - new Date(a.date).getTime());
            setLatestInvoice(userInvoices[0] || null);
        } catch (e) {
            console.error("Failed to load certificate", e);
        } finally {
            setIsLoading(false);
        }
    };
    load();
  }, [user]);

  if (isLoading) return <div className="h-screen flex items-center justify-center bg-[#0A2540]"><Loader2 className="animate-spin text-white w-10 h-10" /></div>;

  if (!latestInvoice || !user) {
      return (
          <div className="h-screen flex flex-col items-center justify-center bg-[#0A2540] text-white font-['Tajawal'] text-center px-4">
              <div className="w-20 h-20 bg-white/5 rounded-full flex items-center justify-center mb-6">
                  <AlertCircle size={40} className="text-gray-500" />
              </div>
              <h2 className="text-3xl font-black mb-4">لا توجد شهادات متاحة</h2>
              <p className="text-gray-400 text-lg max-w-md">لم يتم العثور على اشتراك فعال أو شهادات معتمدة مرتبطة بحسابك حالياً.</p>
          </div>
      );
  }

  return (
    <div className="min-h-screen bg-[#0A2540] p-6 flex justify-center">
        <div className="w-full max-w-5xl">
            <PaymentCertificate user={user} invoice={latestInvoice} />
        </div>
    </div>
  );
};

export default CertificateViewer;
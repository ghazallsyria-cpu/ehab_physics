import React, { useState, useEffect } from 'react';
import { useAuth } from './ProtectedRoute';
import { dbService } from '../services/db';
import { Invoice } from '../types';
import PaymentCertificate from './PaymentCertificate';
import { Loader2 } from 'lucide-react';

const CertificateViewer: React.FC = () => {
  const { user } = useAuth();
  const [latestInvoice, setLatestInvoice] = useState<Invoice | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    const load = async () => {
        setIsLoading(true);
        const { data } = await dbService.getInvoices();
        // Get user's latest paid invoice
        const userInvoices = data.filter(i => i.userId === user.uid && i.status === 'PAID').sort((a,b) => new Date(b.date).getTime() - new Date(a.date).getTime());
        setLatestInvoice(userInvoices[0] || null);
        setIsLoading(false);
    };
    load();
  }, [user]);

  if (isLoading) return <div className="h-screen flex items-center justify-center bg-[#0A2540]"><Loader2 className="animate-spin text-white" /></div>;

  if (!latestInvoice || !user) {
      return (
          <div className="h-screen flex flex-col items-center justify-center bg-[#0A2540] text-white font-['Tajawal']">
              <h2 className="text-2xl font-black mb-4">لا توجد شهادات متاحة</h2>
              <p className="text-gray-400">لم يتم العثور على اشتراك فعال مرتبط بحسابك.</p>
          </div>
      );
  }

  return (
    <div className="min-h-screen bg-[#0A2540] p-4">
        <PaymentCertificate user={user} invoice={latestInvoice} />
    </div>
  );
};

export default CertificateViewer;
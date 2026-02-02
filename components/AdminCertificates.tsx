import React, { useState, useEffect } from 'react';
import { User, Invoice } from '../types';
import { dbService } from '../services/db';
import { Search, Award, Printer, CheckCircle, RefreshCw } from 'lucide-react';
import PaymentCertificate from './PaymentCertificate';

const AdminCertificates: React.FC = () => {
  const [students, setStudents] = useState<User[]>([]);
  const [search, setSearch] = useState('');
  const [selectedStudent, setSelectedStudent] = useState<User | null>(null);
  const [mockInvoice, setMockInvoice] = useState<Invoice | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      setIsLoading(true);
      dbService.subscribeToUsers((data) => {
          setStudents(data);
          setIsLoading(false);
      }, 'student');
    };
    load();
  }, []);

  const handleSelect = (user: User) => {
      setSelectedStudent(user);
      // Create a mock invoice for certificate generation
      setMockInvoice({
          id: `cert_${Date.now()}`,
          userId: user.uid,
          userName: user.name,
          planId: user.subscription === 'premium' ? 'plan_premium' : 'plan_basic',
          amount: 0,
          date: new Date().toISOString(),
          status: 'PAID',
          trackId: `CERT-${user.uid.substring(0,6).toUpperCase()}`,
          authCode: 'ADMIN-GRANT'
      });
  };

  const filtered = students.filter(s => s.name.includes(search) || s.email.includes(search));

  if (selectedStudent && mockInvoice) {
      return (
          <div className="animate-fadeIn">
              <button onClick={() => setSelectedStudent(null)} className="mb-6 text-white underline">عودة للقائمة</button>
              <PaymentCertificate user={selectedStudent} invoice={mockInvoice} />
          </div>
      )
  }

  return (
    <div className="max-w-6xl mx-auto py-8 text-right font-['Tajawal']" dir="rtl">
      <header className="mb-12">
          <h2 className="text-4xl font-black text-white italic">إصدار <span className="text-[#fbbf24]">الشهادات</span></h2>
          <p className="text-gray-500 mt-2">طباعة شهادات تقدير أو إثباتات اشتراك للطلاب.</p>
      </header>

      <div className="glass-panel p-8 rounded-[40px] border-white/5 bg-black/40">
          <div className="flex gap-4 mb-8">
              <div className="flex-1 relative">
                  <Search className="absolute top-1/2 right-6 -translate-y-1/2 text-gray-500"/>
                  <input type="text" placeholder="بحث عن طالب..." value={search} onChange={e => setSearch(e.target.value)} className="w-full bg-white/5 border border-white/10 rounded-2xl pr-14 pl-4 py-4 text-white outline-none focus:border-[#fbbf24]"/>
              </div>
          </div>

          <div className="space-y-3">
              {isLoading ? <div className="text-center py-20"><RefreshCw className="animate-spin text-[#fbbf24] mx-auto"/></div> : 
               filtered.map(student => (
                  <div key={student.uid} className="flex items-center justify-between p-4 bg-white/[0.02] border border-white/5 rounded-2xl hover:bg-white/5 transition-all">
                      <div className="flex items-center gap-4">
                          <div className="w-10 h-10 bg-[#fbbf24]/10 rounded-full flex items-center justify-center text-[#fbbf24] font-bold">
                              {student.name.charAt(0)}
                          </div>
                          <div>
                              <h4 className="font-bold text-white">{student.name}</h4>
                              <p className="text-xs text-gray-500">{student.email}</p>
                          </div>
                      </div>
                      <button onClick={() => handleSelect(student)} className="bg-white/10 hover:bg-[#fbbf24] hover:text-black text-white px-6 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2">
                          <Printer size={14}/> إصدار شهادة
                      </button>
                  </div>
              ))}
          </div>
      </div>
    </div>
  );
};

export default AdminCertificates;
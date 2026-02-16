import React, { useState, useEffect } from 'react';
import { User, Invoice } from '../types';
import { dbService } from '../services/db';
import { Search, Award, Printer, CheckCircle, RefreshCw, FileCheck } from 'lucide-react';
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
      // Create a mock invoice object to reuse the PaymentCertificate component logic
      // In a real scenario, this would create a 'Certificate' record in DB
      setMockInvoice({
          id: `cert_${Date.now()}`,
          userId: user.uid,
          userName: user.name,
          planId: user.subscription === 'premium' ? 'plan_premium' : 'plan_basic',
          amount: 0, // Zero for certificates
          date: new Date().toISOString(),
          status: 'PAID',
          trackId: `CERT-${user.uid.substring(0,6).toUpperCase()}-${Date.now().toString().slice(-4)}`,
          authCode: 'ADMIN-ISSUED'
      });
  };

  const filtered = students.filter(s => s.name.toLowerCase().includes(search.toLowerCase()) || s.email.toLowerCase().includes(search.toLowerCase()));

  if (selectedStudent && mockInvoice) {
      return (
          <div className="animate-fadeIn p-6">
              <button onClick={() => setSelectedStudent(null)} className="mb-6 text-gray-400 hover:text-white underline font-bold text-sm">← العودة لقائمة الطلاب</button>
              <div className="bg-white/5 border border-white/10 rounded-[40px] overflow-hidden">
                  <PaymentCertificate user={selectedStudent} invoice={mockInvoice} />
              </div>
          </div>
      )
  }

  return (
    <div className="max-w-6xl mx-auto py-8 text-right font-['Tajawal']" dir="rtl">
      <header className="mb-12 border-r-4 border-[#fbbf24] pr-8">
          <h2 className="text-4xl font-black text-white italic tracking-tighter uppercase">إصدار <span className="text-[#fbbf24]">الشهادات</span></h2>
          <p className="text-gray-500 mt-2 font-medium">طباعة شهادات تقدير أو إثباتات اشتراك رسمية للطلاب.</p>
      </header>

      <div className="glass-panel p-10 rounded-[50px] border-white/5 bg-black/40 shadow-2xl">
          <div className="flex gap-4 mb-8">
              <div className="flex-1 relative">
                  <Search className="absolute top-1/2 right-6 -translate-y-1/2 text-gray-500" size={20}/>
                  <input type="text" placeholder="بحث عن طالب (الاسم أو البريد)..." value={search} onChange={e => setSearch(e.target.value)} className="w-full bg-white/5 border border-white/10 rounded-[25px] pr-14 pl-6 py-5 text-white outline-none focus:border-[#fbbf24] font-bold text-lg transition-all"/>
              </div>
          </div>

          <div className="space-y-3 max-h-[600px] overflow-y-auto no-scrollbar pr-2">
              {isLoading ? <div className="text-center py-20"><RefreshCw className="animate-spin text-[#fbbf24] mx-auto w-10 h-10"/></div> : 
               filtered.length > 0 ? filtered.map(student => (
                  <div key={student.uid} className="flex items-center justify-between p-5 bg-white/[0.02] border border-white/5 rounded-[30px] hover:bg-white/5 transition-all group">
                      <div className="flex items-center gap-6">
                          <div className="w-12 h-12 bg-[#fbbf24]/10 rounded-2xl flex items-center justify-center text-[#fbbf24] font-black text-xl border border-[#fbbf24]/20">
                              {student.name.charAt(0)}
                          </div>
                          <div>
                              <h4 className="font-bold text-white text-lg">{student.name}</h4>
                              <p className="text-xs text-gray-500 font-mono">{student.email}</p>
                          </div>
                      </div>
                      <button onClick={() => handleSelect(student)} className="bg-[#fbbf24] text-black px-8 py-3 rounded-2xl text-xs font-black uppercase tracking-widest hover:scale-105 transition-all flex items-center gap-2 shadow-lg">
                          <FileCheck size={16}/> إصدار شهادة
                      </button>
                  </div>
              )) : (
                  <div className="text-center py-20 opacity-30">
                      <p className="text-xl font-bold text-gray-500">لا توجد نتائج مطابقة</p>
                  </div>
              )}
          </div>
      </div>
    </div>
  );
};

export default AdminCertificates;
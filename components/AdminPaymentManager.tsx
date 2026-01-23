
import React, { useState, useEffect } from 'react';
import { PaymentSettings, InvoiceSettings, AppBranding } from '../types';
import { dbService } from '../services/db';
// Added missing import to fix "Cannot find name 'QRCode'" error
import QRCode from 'react-qr-code';
import { 
    Save, RefreshCw, AlertCircle, Smartphone, Banknote, 
    Power, PowerOff, ShieldCheck, Zap, Palette, Layout, 
    Type, FileText, CheckCircle2, Eye, PenTool, Image as ImageIcon
} from 'lucide-react';
import PaymentCertificate from './PaymentCertificate';

const AdminPaymentManager: React.FC = () => {
    const [settings, setSettings] = useState<PaymentSettings | null>(null);
    const [invoiceSettings, setInvoiceSettings] = useState<InvoiceSettings | null>(null);
    const [branding, setBranding] = useState<AppBranding | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);
    const [activeTab, setActiveTab] = useState<'GENERAL' | 'INVOICE_DESIGN'>('GENERAL');
    const [message, setMessage] = useState<{text: string, type: 'success' | 'error'} | null>(null);

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        setIsLoading(true);
        try {
            const [payData, invData, brandData] = await Promise.all([
                dbService.getPaymentSettings(),
                dbService.getInvoiceSettings(),
                dbService.getAppBranding()
            ]);
            setSettings(payData);
            setInvoiceSettings(invData);
            setBranding(brandData);
        } catch (e) {
            console.error(e);
            setMessage({ text: 'خطأ في جلب الإعدادات.', type: 'error' });
        } finally {
            setIsLoading(false);
        }
    };

    const handleSave = async () => {
        if (!settings || !invoiceSettings || !branding) return;
        setIsSaving(true);
        try {
            await Promise.all([
                dbService.savePaymentSettings(settings),
                dbService.saveInvoiceSettings(invoiceSettings),
                dbService.saveAppBranding(branding)
            ]);
            setMessage({ text: 'تم حفظ كافة الإعدادات وتصميم الإيصالات بنجاح ✅', type: 'success' });
            window.dispatchEvent(new CustomEvent('finance-updated'));
        } catch (e) {
            setMessage({ text: 'فشل الحفظ.', type: 'error' });
        } finally {
            setIsSaving(false);
            setTimeout(() => setMessage(null), 3000);
        }
    };

    if (isLoading) {
        return (
            <div className="py-40 text-center flex flex-col items-center">
                <RefreshCw className="w-12 h-12 text-[#fbbf24] animate-spin mb-6" />
                <p className="text-gray-500 font-bold uppercase tracking-widest">جاري تحميل النظام المالي والمصمم...</p>
            </div>
        );
    }

    const mockInvoice = {
        id: 'DEMO',
        userId: 'USER_ID',
        userName: 'اسم الطالب (مثال)',
        planId: 'plan_premium',
        amount: settings?.planPrices.premium || 35,
        date: new Date().toISOString(),
        status: 'PAID' as any,
        trackId: 'DEMO-TRK-777',
        paymentId: 'PAY-12345',
        authCode: 'AUTH-OK'
    };

    const mockUser = {
        uid: 'DEMO',
        name: 'طالب تجريبي',
        email: 'demo@ssc.edu.sy',
        role: 'student' as any,
        grade: '12' as any,
        subscription: 'premium' as any,
        createdAt: '',
        progress: { completedLessonIds: [], points: 100 }
    };

    return (
        <div className="max-w-7xl mx-auto py-8 animate-fadeIn font-['Tajawal'] text-right pb-32" dir="rtl">
            <header className="mb-12 flex flex-col md:flex-row justify-between items-center gap-6">
                <div>
                    <h2 className="text-5xl font-black text-white italic tracking-tighter uppercase leading-none">
                        إدارة <span className="text-emerald-500">المالية والمستندات</span>
                    </h2>
                    <p className="text-gray-500 mt-4 font-bold uppercase tracking-widest text-[10px]">تعديل الأسعار، بوابة الدفع، وتصميم الإيصالات الرقمية.</p>
                </div>
                <div className="flex gap-4">
                    <button onClick={loadData} className="p-4 bg-white/5 border border-white/10 rounded-2xl text-gray-500 hover:text-white transition-all"><RefreshCw size={20} className={isLoading ? 'animate-spin' : ''} /></button>
                    <button onClick={handleSave} disabled={isSaving} className="bg-emerald-500 text-black px-12 py-4 rounded-3xl font-black text-xs uppercase tracking-widest shadow-2xl hover:scale-105 active:scale-95 transition-all flex items-center justify-center gap-3">
                        {isSaving ? <RefreshCw className="animate-spin" /> : <Save size={18} />} حفظ التغييرات
                    </button>
                </div>
            </header>

            {message && (
                <div className={`mb-10 p-6 rounded-[35px] text-sm font-bold flex items-center gap-4 border animate-slideUp ${message.type === 'success' ? 'bg-green-500/10 text-green-400 border-green-500/20' : 'bg-red-500/10 text-red-400 border-red-500/20'}`}>
                    <CheckCircle2 size={24} /> {message.text}
                </div>
            )}

            <div className="flex bg-black/40 p-2 rounded-[30px] border border-white/5 max-w-lg mb-12">
                <button onClick={() => setActiveTab('GENERAL')} className={`flex-1 py-4 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all flex items-center justify-center gap-3 ${activeTab === 'GENERAL' ? 'bg-white text-black shadow-xl' : 'text-gray-500 hover:text-white'}`}>
                    <Smartphone size={16}/> بوابة الدفع والأسعار
                </button>
                <button onClick={() => setActiveTab('INVOICE_DESIGN')} className={`flex-1 py-4 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all flex items-center justify-center gap-3 ${activeTab === 'INVOICE_DESIGN' ? 'bg-white text-black shadow-xl' : 'text-gray-500 hover:text-white'}`}>
                    <Palette size={16}/> مصمم الإيصالات الرقمية
                </button>
            </div>

            {activeTab === 'GENERAL' ? (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
                    <div className="space-y-10">
                        {/* بوابة الدفع */}
                        <div className="glass-panel p-10 rounded-[50px] border-white/5 bg-black/40 shadow-xl">
                            <div className="flex justify-between items-center mb-8">
                                <div className="flex items-center gap-4">
                                    <div className={`p-4 rounded-2xl ${settings?.isOnlinePaymentEnabled ? 'bg-emerald-500/20 text-emerald-400' : 'bg-red-500/20 text-red-400'}`}>
                                        {settings?.isOnlinePaymentEnabled ? <Power size={24}/> : <PowerOff size={24}/>}
                                    </div>
                                    <h3 className="text-xl font-black text-white">بوابة الدفع</h3>
                                </div>
                                <button 
                                    onClick={() => setSettings({...settings!, isOnlinePaymentEnabled: !settings?.isOnlinePaymentEnabled})}
                                    className={`px-8 py-2 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all ${settings?.isOnlinePaymentEnabled ? 'bg-emerald-500 text-black' : 'bg-red-500 text-white'}`}
                                >
                                    {settings?.isOnlinePaymentEnabled ? 'مفعلة' : 'معطلة'}
                                </button>
                            </div>
                            <p className="text-xs text-gray-500 italic">عند التعطيل، سيتم تحويل الطلاب للواتساب للسداد عبر "ومض".</p>
                        </div>

                        {/* رقم ومض */}
                        <div className="glass-panel p-10 rounded-[50px] border-white/5 bg-black/40">
                            <h3 className="text-xl font-black text-white mb-8 flex items-center gap-3"><Smartphone size={20} className="text-blue-400"/> رقم تحويل ومض</h3>
                            <input 
                                type="text" 
                                value={settings?.womdaPhoneNumber || ''} 
                                onChange={e => setSettings({...settings!, womdaPhoneNumber: e.target.value})}
                                className="w-full bg-black/60 border border-white/10 rounded-2xl px-6 py-4 text-white font-black text-2xl tabular-nums ltr text-left outline-none focus:border-emerald-500"
                                placeholder="965XXXXXXXX"
                            />
                        </div>
                    </div>

                    {/* تسعير الباقات */}
                    <div className="glass-panel p-10 rounded-[50px] border-white/5 bg-black/40 flex flex-col justify-center">
                        <h3 className="text-xl font-black text-white mb-10 flex items-center gap-3"><Zap size={24} className="text-amber-400"/> تسعير الباقات التعليمية</h3>
                        <div className="space-y-8">
                            <div className="flex flex-col gap-4">
                                <label className="text-[10px] font-black text-gray-500 uppercase tracking-[0.3em] mr-4">سعر باقة التفوق (Premium)</label>
                                <div className="relative">
                                    <input type="number" value={settings?.planPrices.premium || 0} onChange={e => setSettings({...settings!, planPrices: {...settings!.planPrices, premium: Number(e.target.value)}})} className="w-full bg-black/60 border border-white/10 rounded-3xl px-8 py-6 text-white font-black text-4xl tabular-nums outline-none focus:border-amber-400" />
                                    <span className="absolute left-8 top-1/2 -translate-y-1/2 text-gray-600 font-bold text-lg">د.ك</span>
                                </div>
                            </div>
                            <div className="flex flex-col gap-4">
                                <label className="text-[10px] font-black text-gray-500 uppercase tracking-[0.3em] mr-4">سعر الباقة الأساسية (Basic)</label>
                                <div className="relative">
                                    <input type="number" value={settings?.planPrices.basic || 0} onChange={e => setSettings({...settings!, planPrices: {...settings!.planPrices, basic: Number(e.target.value)}})} className="w-full bg-black/60 border border-white/10 rounded-3xl px-8 py-6 text-white font-black text-4xl tabular-nums outline-none focus:border-white/20" />
                                    <span className="absolute left-8 top-1/2 -translate-y-1/2 text-gray-600 font-bold text-lg">د.ك</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            ) : (
                <div className="grid grid-cols-1 xl:grid-cols-12 gap-10 items-start">
                    {/* أدوات التحكم في التصميم */}
                    <div className="xl:col-span-4 space-y-8">
                        <div className="glass-panel p-8 rounded-[40px] border-white/5 bg-[#0a1118] space-y-8">
                            <h4 className="text-sm font-black text-emerald-500 uppercase tracking-[0.2em] flex items-center gap-3">
                                <PenTool size={16}/> أدوات التخصيص
                            </h4>
                            
                            <div className="space-y-6">
                                {/* الشعار */}
                                <div>
                                    <label className="text-[9px] font-black text-gray-600 uppercase tracking-widest block mb-2">رابط شعار المركز</label>
                                    <input type="text" value={branding?.logoUrl || ''} onChange={e => setBranding({...branding!, logoUrl: e.target.value})} className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-[10px] text-white font-mono" />
                                </div>
                                
                                {/* اللون الأساسي */}
                                <div>
                                    <label className="text-[9px] font-black text-gray-600 uppercase tracking-widest block mb-2">لون الإيصال (Accent)</label>
                                    <div className="flex gap-4">
                                        <input type="color" value={invoiceSettings?.accentColor || '#fbbf24'} onChange={e => setInvoiceSettings({...invoiceSettings!, accentColor: e.target.value})} className="w-16 h-12 rounded-xl bg-black/40 border border-white/10 cursor-pointer p-1" />
                                        <input type="text" value={invoiceSettings?.accentColor || ''} onChange={e => setInvoiceSettings({...invoiceSettings!, accentColor: e.target.value})} className="flex-1 bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-xs text-white font-mono" />
                                    </div>
                                </div>

                                {/* نصوص الفاتورة */}
                                <div>
                                    <label className="text-[9px] font-black text-gray-600 uppercase tracking-widest block mb-2">ترويسة المستند</label>
                                    <input type="text" value={invoiceSettings?.headerText || ''} onChange={e => setInvoiceSettings({...invoiceSettings!, headerText: e.target.value})} className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-xs text-white" />
                                </div>
                                
                                <div>
                                    <label className="text-[9px] font-black text-gray-600 uppercase tracking-widest block mb-2">نص التذييل (قانوني)</label>
                                    <textarea value={invoiceSettings?.footerText || ''} onChange={e => setInvoiceSettings({...invoiceSettings!, footerText: e.target.value})} className="w-full h-32 bg-black/40 border border-white/10 rounded-xl p-4 text-[10px] text-gray-400 leading-relaxed" />
                                </div>

                                {/* التوقيع */}
                                <div className="pt-4 border-t border-white/5 space-y-4">
                                    <div className="flex justify-between items-center">
                                        <span className="text-[10px] font-black text-white uppercase">إظهار التوقيع الرقمي</span>
                                        <button onClick={() => setInvoiceSettings({...invoiceSettings!, showSignature: !invoiceSettings?.showSignature})} className={`w-12 h-6 rounded-full p-1 transition-all ${invoiceSettings?.showSignature ? 'bg-emerald-500' : 'bg-gray-700'}`}>
                                            <div className={`w-4 h-4 bg-white rounded-full transition-transform ${invoiceSettings?.showSignature ? 'translate-x-6' : 'translate-x-0'}`} />
                                        </button>
                                    </div>
                                    {invoiceSettings?.showSignature && (
                                        <input type="text" value={invoiceSettings?.signatureName || ''} onChange={e => setInvoiceSettings({...invoiceSettings!, signatureName: e.target.value})} className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-xs text-white" placeholder="اسم الموقع..." />
                                    )}
                                </div>

                                {/* العلامة المائية */}
                                <div className="pt-4 border-t border-white/5 space-y-4">
                                    <div className="flex justify-between items-center">
                                        <span className="text-[10px] font-black text-white uppercase">العلامة المائية الخلفية</span>
                                        <button onClick={() => setInvoiceSettings({...invoiceSettings!, showWatermark: !invoiceSettings?.showWatermark})} className={`w-12 h-6 rounded-full p-1 transition-all ${invoiceSettings?.showWatermark ? 'bg-emerald-500' : 'bg-gray-700'}`}>
                                            <div className={`w-4 h-4 bg-white rounded-full transition-transform ${invoiceSettings?.showWatermark ? 'translate-x-6' : 'translate-x-0'}`} />
                                        </button>
                                    </div>
                                    {invoiceSettings?.showWatermark && (
                                        <input type="text" value={invoiceSettings?.watermarkText || ''} onChange={e => setInvoiceSettings({...invoiceSettings!, watermarkText: e.target.value})} className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-[10px] text-white font-mono" />
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* المعاينة الحية */}
                    <div className="xl:col-span-8 sticky top-6">
                        <div className="mb-6 flex items-center justify-between px-6">
                            <h4 className="text-sm font-black text-blue-400 uppercase tracking-widest flex items-center gap-3">
                                <Eye size={18}/> معاينة الفاتورة الحية
                            </h4>
                            <span className="text-[8px] font-black text-gray-600 uppercase tracking-widest bg-white/5 px-3 py-1 rounded-full border border-white/10">هكذا ستظهر للطالب</span>
                        </div>
                        
                        <div className="glass-panel p-2 rounded-[50px] border-white/10 bg-black/60 shadow-3xl overflow-hidden pointer-events-none origin-top scale-[0.85] -mt-16">
                             {/* هنا نستخدم المكون الأصلي للإيصال مع إرسال الإعدادات المحلية للمعاينة */}
                             <div className="print:bg-white bg-transparent">
                                 <div className="max-w-4xl mx-auto py-12 px-6 animate-fadeIn font-['Tajawal'] text-white">
                                    <div className="p-12 md:p-20 rounded-[60px] border-white/10 relative overflow-hidden bg-white/[0.02] shadow-none border-2">
                                        {invoiceSettings?.showWatermark && (
                                            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-[180px] font-black text-white/[0.02] -rotate-12 pointer-events-none select-none">
                                            {invoiceSettings.watermarkText}
                                            </div>
                                        )}
                                        <header className="flex flex-col md:flex-row justify-between items-center mb-16 gap-10 border-b border-white/10 pb-12">
                                        <div className="text-center md:text-right">
                                            <div className="w-20 h-20 bg-white/5 rounded-3xl flex items-center justify-center p-2 shadow-2xl mb-6 mx-auto md:mx-0 overflow-hidden">
                                                <img src={branding?.logoUrl} className="w-full h-full object-contain" alt="Logo" />
                                            </div>
                                            <h1 className="text-3xl font-black tracking-tighter" style={{ color: invoiceSettings?.accentColor }}>{branding?.appName}</h1>
                                            <p className="text-[10px] font-black text-gray-500 uppercase tracking-widest mt-2">{invoiceSettings?.headerText}</p>
                                        </div>
                                        <div className="text-center md:text-left space-y-2">
                                            <p className="text-xs font-black uppercase text-gray-500">Track ID</p>
                                            <p className="text-xl font-mono font-black tabular-nums" style={{ color: invoiceSettings?.accentColor }}>DEMO-TRK-777</p>
                                            <p className="text-[10px] text-gray-600 tabular-nums">{new Date().toLocaleString('ar-KW')}</p>
                                        </div>
                                        </header>
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-16 mb-16">
                                            <div className="space-y-10">
                                                <div className="space-y-2">
                                                    <label className="text-[9px] font-black text-gray-500 uppercase tracking-[0.3em]">اسم الطالب</label>
                                                    <p className="text-2xl font-black">طالب تجريبي / Demo User</p>
                                                </div>
                                                <div className="space-y-2">
                                                    <label className="text-[9px] font-black text-gray-500 uppercase tracking-[0.3em]">نوع الاشتراك</label>
                                                    <p className="text-2xl font-black uppercase italic" style={{ color: invoiceSettings?.accentColor }}>Premium / التفوق ⚡</p>
                                                </div>
                                            </div>
                                            <div className="flex flex-col items-center justify-center bg-black/40 p-10 rounded-[50px] border border-white/5">
                                                <div className="bg-white p-4 rounded-[30px] shadow-2xl mb-6 w-[160px] h-[160px] flex items-center justify-center border-4 border-black/10">
                                                    <QRCode value="DEMO" size={120} />
                                                </div>
                                                <p className="text-[10px] font-black text-gray-500 uppercase tracking-widest text-center">كود التحقق الرقمي</p>
                                            </div>
                                        </div>
                                        <div className="bg-white/[0.03] p-10 rounded-[40px] border border-white/5 flex justify-between items-center">
                                            <div className="text-right">
                                                <p className="text-[10px] font-black text-gray-500 uppercase tracking-widest mb-1">المبلغ المدفوع</p>
                                                <h3 className="text-5xl font-black tabular-nums" style={{ color: invoiceSettings?.accentColor }}>35 <span className="text-xl">د.ك</span></h3>
                                            </div>
                                            <div className="text-left">
                                                <p className="text-[9px] font-black text-green-500 uppercase tracking-widest bg-green-500/10 px-4 py-1 rounded-full mb-3 inline-block">APPROVED ✓</p>
                                            </div>
                                        </div>
                                        <footer className="mt-16 pt-8 border-t border-white/5 flex flex-col md:flex-row justify-between items-end gap-10">
                                            <p className="text-[9px] font-bold text-gray-600 max-w-sm leading-relaxed italic">
                                                {invoiceSettings?.footerText}
                                            </p>
                                            {invoiceSettings?.showSignature && (
                                                <div className="text-center min-w-[150px]">
                                                    <div className="w-24 h-12 border-b-2 border-dashed border-gray-700 mx-auto mb-2 opacity-50"></div>
                                                    <p className="text-xs font-black text-white">{invoiceSettings.signatureName}</p>
                                                </div>
                                            )}
                                        </footer>
                                    </div>
                                 </div>
                             </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default AdminPaymentManager;

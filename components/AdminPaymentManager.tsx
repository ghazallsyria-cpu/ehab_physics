
import React, { useState, useEffect } from 'react';
import { PaymentSettings, InvoiceSettings, AppBranding } from '../types';
import { dbService } from '../services/db';
import QRCode from 'react-qr-code';
import { 
    Save, RefreshCw, AlertCircle, Smartphone, Banknote, 
    Power, PowerOff, ShieldCheck, Zap, Palette, Layout, 
    Type, FileText, CheckCircle2, Eye, PenTool, Image as ImageIcon
} from 'lucide-react';

const AdminPaymentManager: React.FC = () => {
    // 🛡️ تهيئة الحالة بقيم افتراضية لمنع انهيار الصفحة (Blank Page Fix)
    const [settings, setSettings] = useState<PaymentSettings>({
        isOnlinePaymentEnabled: false,
        womdaPhoneNumber: '55315661',
        planPrices: { premium: 35, basic: 0 }
    });
    
    const [invoiceSettings, setInvoiceSettings] = useState<InvoiceSettings>({
        headerText: 'إيصال دفع رقمي معتمد',
        footerText: 'إثبات رسمي من المركز السوري للعلوم.',
        accentColor: '#fbbf24',
        showSignature: true,
        signatureName: 'إدارة المركز',
        showWatermark: true,
        watermarkText: 'SSC KUWAIT'
    });

    const [branding, setBranding] = useState<AppBranding>({
        appName: 'المركز السوري للعلوم',
        logoUrl: 'https://spxlxypbosipfwbijbjk.supabase.co/storage/v1/object/public/assets/1769130153314_IMG_2848.png'
    });

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
            // جلب البيانات بشكل منفصل لضمان عدم توقف الصفحة في حال فقدان مستند واحد
            const payData = await dbService.getPaymentSettings();
            if (payData) setSettings(payData);

            const invData = await dbService.getInvoiceSettings();
            if (invData) setInvoiceSettings(invData);

            const brandData = await dbService.getAppBranding();
            if (brandData) setBranding(brandData);
            
        } catch (e) {
            console.error("Payment Manager Load Error:", e);
            setMessage({ text: 'تم تحميل الإعدادات الافتراضية (تعذر الوصول للسحابة حالياً).', type: 'error' });
        } finally {
            setIsLoading(false);
        }
    };

    const handleSave = async () => {
        setIsSaving(true);
        try {
            await Promise.all([
                dbService.savePaymentSettings(settings),
                dbService.saveInvoiceSettings(invoiceSettings),
                dbService.saveAppBranding(branding)
            ]);
            setMessage({ text: 'تم حفظ كافة الإعدادات وتصميم الإيصالات بنجاح ✅', type: 'success' });
        } catch (e) {
            setMessage({ text: 'فشل حفظ الإعدادات في السحابة.', type: 'error' });
        } finally {
            setIsSaving(false);
            setTimeout(() => setMessage(null), 3000);
        }
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
                    <button onClick={loadData} className="p-4 bg-white/5 border border-white/10 rounded-2xl text-gray-400 hover:text-white transition-all"><RefreshCw size={20} className={isLoading ? 'animate-spin' : ''} /></button>
                    <button onClick={handleSave} disabled={isSaving} className="bg-emerald-500 text-black px-12 py-4 rounded-3xl font-black text-xs uppercase tracking-widest shadow-2xl hover:scale-105 active:scale-95 transition-all flex items-center justify-center gap-3">
                        {isSaving ? <RefreshCw className="animate-spin" /> : <Save size={18} />} حفظ التغييرات
                    </button>
                </div>
            </header>

            {isLoading && (
                <div className="mb-8 p-4 bg-blue-500/10 text-blue-400 rounded-2xl text-[10px] font-black text-center animate-pulse border border-blue-500/20">
                    جاري مزامنة أحدث الإعدادات من السحابة...
                </div>
            )}

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
                        <div className="glass-panel p-10 rounded-[50px] border-white/5 bg-black/40 shadow-xl">
                            <div className="flex justify-between items-center mb-8">
                                <div className="flex items-center gap-4">
                                    <div className={`p-4 rounded-2xl ${settings.isOnlinePaymentEnabled ? 'bg-emerald-500/20 text-emerald-400' : 'bg-red-500/20 text-red-400'}`}>
                                        {settings.isOnlinePaymentEnabled ? <Power size={24}/> : <PowerOff size={24}/>}
                                    </div>
                                    <h3 className="text-xl font-black text-white">بوابة الدفع</h3>
                                </div>
                                <button 
                                    onClick={() => setSettings({...settings, isOnlinePaymentEnabled: !settings.isOnlinePaymentEnabled})}
                                    className={`px-8 py-2 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all ${settings.isOnlinePaymentEnabled ? 'bg-emerald-500 text-black' : 'bg-red-500 text-white'}`}
                                >
                                    {settings.isOnlinePaymentEnabled ? 'مفعلة' : 'معطلة'}
                                </button>
                            </div>
                        </div>

                        <div className="glass-panel p-10 rounded-[50px] border-white/5 bg-black/40">
                            <h3 className="text-xl font-black text-white mb-8 flex items-center gap-3"><Smartphone size={20} className="text-blue-400"/> رقم تحويل ومض</h3>
                            <input 
                                type="text" 
                                value={settings.womdaPhoneNumber} 
                                onChange={e => setSettings({...settings, womdaPhoneNumber: e.target.value})}
                                className="w-full bg-black/60 border border-white/10 rounded-2xl px-6 py-4 text-white font-black text-2xl tabular-nums ltr text-left outline-none focus:border-emerald-500"
                                placeholder="965XXXXXXXX"
                            />
                        </div>
                    </div>

                    <div className="glass-panel p-10 rounded-[50px] border-white/5 bg-black/40 flex flex-col justify-center">
                        <h3 className="text-xl font-black text-white mb-10 flex items-center gap-3"><Zap size={24} className="text-amber-400"/> تسعير الباقات التعليمية</h3>
                        <div className="space-y-8">
                            <div className="flex flex-col gap-4">
                                <label className="text-[10px] font-black text-gray-500 uppercase tracking-[0.3em] mr-4">سعر باقة التفوق (Premium)</label>
                                <div className="relative">
                                    <input type="number" value={settings.planPrices.premium} onChange={e => setSettings({...settings, planPrices: {...settings.planPrices, premium: Number(e.target.value)}})} className="w-full bg-black/60 border border-white/10 rounded-3xl px-8 py-6 text-white font-black text-4xl tabular-nums outline-none focus:border-amber-400" />
                                    <span className="absolute left-8 top-1/2 -translate-y-1/2 text-gray-600 font-bold text-lg">د.ك</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            ) : (
                <div className="grid grid-cols-1 xl:grid-cols-12 gap-10 items-start">
                    <div className="xl:col-span-4 space-y-8">
                        <div className="glass-panel p-8 rounded-[40px] border-white/5 bg-[#0a1118] space-y-8">
                            <h4 className="text-sm font-black text-emerald-500 uppercase tracking-[0.2em] flex items-center gap-3">
                                <PenTool size={16}/> أدوات التخصيص
                            </h4>
                            <div className="space-y-6">
                                <div>
                                    <label className="text-[9px] font-black text-gray-600 uppercase tracking-widest block mb-2">ترويسة المستند</label>
                                    <input type="text" value={invoiceSettings.headerText} onChange={e => setInvoiceSettings({...invoiceSettings, headerText: e.target.value})} className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-xs text-white" />
                                </div>
                                <div>
                                    <label className="text-[9px] font-black text-gray-600 uppercase tracking-widest block mb-2">لون الإيصال</label>
                                    <input type="color" value={invoiceSettings.accentColor} onChange={e => setInvoiceSettings({...invoiceSettings, accentColor: e.target.value})} className="w-full h-12 rounded-xl bg-black/40 border border-white/10 cursor-pointer p-1" />
                                </div>
                                <div>
                                    <label className="text-[9px] font-black text-gray-600 uppercase tracking-widest block mb-2">العلامة المائية</label>
                                    <input type="text" value={invoiceSettings.watermarkText} onChange={e => setInvoiceSettings({...invoiceSettings, watermarkText: e.target.value})} className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-xs text-white font-mono" />
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="xl:col-span-8 sticky top-6">
                        <div className="mb-6 flex items-center justify-between px-6">
                            <h4 className="text-sm font-black text-blue-400 uppercase tracking-widest flex items-center gap-3">
                                <Eye size={18}/> معاينة الفاتورة الحية
                            </h4>
                        </div>
                        
                        <div className="glass-panel p-4 rounded-[50px] border-white/10 bg-white/5 shadow-3xl overflow-hidden pointer-events-none origin-top scale-[0.9]">
                             <div className="p-12 md:p-20 rounded-[60px] border-white/10 relative overflow-hidden bg-white text-black min-h-[600px]">
                                {invoiceSettings.showWatermark && (
                                    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-[120px] font-black text-black/[0.05] -rotate-12 pointer-events-none select-none">
                                    {invoiceSettings.watermarkText}
                                    </div>
                                )}
                                <header className="flex justify-between items-center mb-16 border-b border-black/10 pb-12">
                                    <div className="text-right">
                                        <div className="w-16 h-16 bg-black/5 rounded-2xl flex items-center justify-center p-2 mb-4 overflow-hidden">
                                            {branding.logoUrl ? <img src={branding.logoUrl} className="w-full h-full object-contain" alt="Logo" /> : <ImageIcon size={24}/>}
                                        </div>
                                        <h1 className="text-2xl font-black" style={{ color: invoiceSettings.accentColor }}>{branding.appName}</h1>
                                        <p className="text-[8px] font-black text-gray-400 uppercase tracking-widest mt-1">{invoiceSettings.headerText}</p>
                                    </div>
                                    <div className="text-left space-y-1">
                                        <p className="text-[10px] font-mono font-black" style={{ color: invoiceSettings.accentColor }}>REF: SSC-DEMO-777</p>
                                        <p className="text-[8px] text-gray-400">{new Date().toLocaleDateString('ar-KW')}</p>
                                    </div>
                                </header>
                                <div className="grid grid-cols-2 gap-10 mb-16">
                                    <div className="space-y-6">
                                        <div className="space-y-1">
                                            <label className="text-[8px] font-black text-gray-400 uppercase">اسم الطالب</label>
                                            <p className="text-xl font-black">طالب تجريبي</p>
                                        </div>
                                        <div className="space-y-1">
                                            <label className="text-[8px] font-black text-gray-400 uppercase">نوع الاشتراك</label>
                                            <p className="text-xl font-black uppercase" style={{ color: invoiceSettings.accentColor }}>Premium ⚡</p>
                                        </div>
                                    </div>
                                    <div className="flex flex-col items-center justify-center bg-black/5 p-8 rounded-[40px]">
                                        <div className="bg-white p-2 rounded-2xl shadow-xl w-32 h-32 flex items-center justify-center border-2 border-black/5">
                                            <QRCode value="DEMO" size={100} />
                                        </div>
                                        <p className="text-[8px] font-black text-gray-400 uppercase mt-4">VERIFIED DOCUMENT</p>
                                    </div>
                                </div>
                                <div className="bg-black/5 p-8 rounded-[40px] flex justify-between items-center">
                                    <div className="text-right">
                                        <p className="text-[8px] font-black text-gray-400 uppercase">المبلغ المدفوع</p>
                                        <h3 className="text-4xl font-black" style={{ color: invoiceSettings.accentColor }}>{settings.planPrices.premium} <span className="text-sm">د.ك</span></h3>
                                    </div>
                                    <p className="text-[10px] font-black text-green-600 bg-green-500/10 px-4 py-2 rounded-full border border-green-500/20">PAID ✓</p>
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

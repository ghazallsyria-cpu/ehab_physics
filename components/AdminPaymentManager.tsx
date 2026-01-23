
import React, { useState, useEffect } from 'react';
import { PaymentSettings } from '../types';
import { dbService } from '../services/db';
import { Save, RefreshCw, AlertCircle, Smartphone, Banknote, Power, PowerOff, ShieldCheck, Zap } from 'lucide-react';

const AdminPaymentManager: React.FC = () => {
    const [settings, setSettings] = useState<PaymentSettings | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);
    const [message, setMessage] = useState<{text: string, type: 'success' | 'error'} | null>(null);

    useEffect(() => {
        loadSettings();
    }, []);

    const loadSettings = async () => {
        setIsLoading(true);
        try {
            const data = await dbService.getPaymentSettings();
            setSettings(data);
        } catch (e) {
            console.error(e);
        } finally {
            setIsLoading(false);
        }
    };

    const handleSave = async () => {
        if (!settings) return;
        setIsSaving(true);
        try {
            await dbService.savePaymentSettings(settings);
            setMessage({ text: 'تم حفظ الإعدادات المالية بنجاح. سيتم تحديث الأسعار ورقم ومض في الصفحة الرئيسية فوراً ✅', type: 'success' });
            // تحديث محلي فوري للمنصة
            window.dispatchEvent(new CustomEvent('finance-updated', { detail: settings }));
        } catch (e) {
            setMessage({ text: 'فشل الحفظ.', type: 'error' });
        } finally {
            setIsSaving(false);
            setTimeout(() => setMessage(null), 3000);
        }
    };

    if (isLoading) {
        return (
            <div className="py-40 text-center">
                <RefreshCw className="w-12 h-12 text-[#fbbf24] animate-spin mx-auto mb-6" />
                <p className="text-gray-500 font-bold uppercase tracking-widest">جاري تحميل النظام المالي...</p>
            </div>
        );
    }

    return (
        <div className="max-w-4xl mx-auto py-8 animate-fadeIn font-['Tajawal'] text-right" dir="rtl">
            <header className="mb-12 border-r-4 border-emerald-500 pr-8">
                <h2 className="text-4xl font-black text-white flex items-center gap-4 italic uppercase tracking-tighter">
                    <Banknote className="text-emerald-500" size={32} /> إعدادات <span className="text-emerald-500">الدفع والاشتراكات</span>
                </h2>
                <p className="text-gray-500 mt-2 font-medium">تحكم في أسعار الباقات، رقم خدمة ومض، وحالة بوابة الدفع الإلكتروني.</p>
            </header>

            {message && <div className={`mb-8 p-5 rounded-3xl text-sm font-bold border flex items-center gap-3 animate-slideUp ${message.type === 'success' ? 'bg-green-500/10 text-green-400 border-green-500/20' : 'bg-red-500/10 text-red-400 border-red-500/20'}`}> {message.text} </div>}

            <div className="grid grid-cols-1 gap-10">
                {/* 1. حالة بوابة الدفع */}
                <div className="glass-panel p-10 rounded-[50px] border-white/5 bg-black/40">
                    <div className="flex justify-between items-center mb-8">
                        <div className="flex items-center gap-4">
                            <div className={`p-4 rounded-2xl ${settings?.isOnlinePaymentEnabled ? 'bg-emerald-500/20 text-emerald-400' : 'bg-red-500/20 text-red-400'}`}>
                                {settings?.isOnlinePaymentEnabled ? <Power size={24}/> : <PowerOff size={24}/>}
                            </div>
                            <div>
                                <h3 className="text-xl font-black text-white">بوابة الدفع الإلكتروني</h3>
                                <p className="text-xs text-gray-500 mt-1">تفعيل أو إيقاف السداد التلقائي عبر K-Net/Visa.</p>
                            </div>
                        </div>
                        <button 
                            onClick={() => setSettings({...settings!, isOnlinePaymentEnabled: !settings?.isOnlinePaymentEnabled})}
                            className={`px-10 py-3 rounded-2xl font-black text-xs uppercase tracking-widest transition-all ${settings?.isOnlinePaymentEnabled ? 'bg-emerald-500 text-black' : 'bg-red-500 text-white'}`}
                        >
                            {settings?.isOnlinePaymentEnabled ? 'نشطة الآن' : 'معطلة حالياً'}
                        </button>
                    </div>
                    {!settings?.isOnlinePaymentEnabled && (
                        <div className="bg-amber-400/10 border border-amber-400/20 p-4 rounded-2xl flex items-center gap-3">
                            <AlertCircle className="text-amber-400 shrink-0" size={18} />
                            <p className="text-xs text-amber-400 font-bold">تنبيه: سيتم توجيه جميع الطلاب للدفع اليدوي (ومض) والواتساب بدلاً من البطاقات البنكية.</p>
                        </div>
                    )}
                </div>

                {/* 2. رقم ومض */}
                <div className="glass-panel p-10 rounded-[50px] border-white/5 bg-black/40">
                    <div className="flex items-center gap-4 mb-8">
                        <Smartphone className="text-[#00d2ff]" />
                        <h3 className="text-xl font-black text-white">إعدادات خدمة ومض (Womda)</h3>
                    </div>
                    <div className="space-y-2">
                        <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest mr-4">رقم الهاتف لاستقبال التحويلات</label>
                        <input 
                            type="text" 
                            value={settings?.womdaPhoneNumber || ''} 
                            onChange={e => setSettings({...settings!, womdaPhoneNumber: e.target.value})}
                            className="w-full bg-black/40 border border-white/10 rounded-[25px] px-8 py-5 text-white outline-none focus:border-[#00d2ff] font-bold text-xl tabular-nums ltr text-left"
                            placeholder="965XXXXXXXX"
                        />
                        <p className="text-[10px] text-gray-600 mt-2 italic mr-4">* سيظهر هذا الرقم للطالب في واجهة الدفع اليدوي وفي الصفحة الرئيسية فوراً.</p>
                    </div>
                </div>

                {/* 3. أسعار الباقات */}
                <div className="glass-panel p-10 rounded-[50px] border-white/5 bg-black/40">
                    <div className="flex items-center gap-4 mb-8">
                        <Zap className="text-[#fbbf24]" />
                        <h3 className="text-xl font-black text-white">تسعير الباقات التعليمية</h3>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        <div className="space-y-3">
                            <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest mr-4">سعر باقة التفوق (Premium)</label>
                            <div className="relative">
                                <input 
                                    type="number" 
                                    value={settings?.planPrices.premium || 0} 
                                    onChange={e => setSettings({...settings!, planPrices: {...settings!.planPrices, premium: Number(e.target.value)}})}
                                    className="w-full bg-black/40 border border-white/10 rounded-[25px] px-8 py-5 text-white outline-none focus:border-[#fbbf24] font-black text-2xl tabular-nums"
                                />
                                <span className="absolute left-6 top-1/2 -translate-y-1/2 text-gray-500 font-bold">د.ك</span>
                            </div>
                        </div>
                        <div className="space-y-3">
                            <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest mr-4">سعر الباقة الأساسية (Basic)</label>
                            <div className="relative opacity-50">
                                <input 
                                    type="number" 
                                    readOnly
                                    value={settings?.planPrices.basic || 0} 
                                    className="w-full bg-black/40 border border-white/10 rounded-[25px] px-8 py-5 text-white outline-none font-black text-2xl tabular-nums cursor-not-allowed"
                                />
                                <span className="absolute left-6 top-1/2 -translate-y-1/2 text-gray-500 font-bold">د.ك</span>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="flex justify-end">
                    <button 
                        onClick={handleSave} 
                        disabled={isSaving}
                        className="bg-emerald-500 text-black px-16 py-6 rounded-[30px] font-black text-sm uppercase tracking-widest shadow-2xl hover:scale-105 active:scale-95 transition-all flex items-center gap-4"
                    >
                        {isSaving ? <RefreshCw className="animate-spin" /> : <Save />} حفظ الإعدادات وتحديث الموقع
                    </button>
                </div>
            </div>
        </div>
    );
};

export default AdminPaymentManager;

import React, { useState, useEffect, useRef } from 'react';
import { Asset } from '../types';
import { dbService } from '../services/db';
import { UploadCloud, FileText, Copy, CopyCheck, Trash2, RefreshCw, Library, AlertCircle, ExternalLink, Settings } from 'lucide-react';

const AdminAssetManager: React.FC = () => {
    const [assets, setAssets] = useState<Asset[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isUploading, setIsUploading] = useState(false);
    const [message, setMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(null);
    const [copiedUrl, setCopiedUrl] = useState<string | null>(null);
    const [storageRulesError, setStorageRulesError] = useState<string | null>(null);
    const [copiedRules, setCopiedRules] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const storageRules = `rules_version = '2';
service firebase.storage {
  match /b/{bucket}/o {
    // Allow read and write access to all files
    match /{allPaths=**} {
      allow read, write: if true;
    }
  }
}`;

    useEffect(() => {
        loadAssets();
    }, []);

    const loadAssets = async () => {
        setIsLoading(true);
        setMessage(null);
        setStorageRulesError(null);
        try {
            const data = await dbService.listAssets();
            setAssets(data.sort((a, b) => b.name.localeCompare(a.name)));
        } catch (e: any) {
            console.error(e);
            if (e.message === 'STORAGE_PERMISSION_DENIED') {
                setStorageRulesError('STORAGE_PERMISSION_DENIED');
            } else {
                setMessage({ text: 'فشل تحميل مكتبة الوسائط.', type: 'error' });
            }
        } finally {
            setIsLoading(false);
        }
    };

    const handleFileUpload = async (files: FileList | null) => {
        if (!files || files.length === 0) return;
        setIsUploading(true);
        setMessage(null);
        setStorageRulesError(null);
        try {
            await Promise.all(Array.from(files).map(file => dbService.uploadAsset(file)));
            setMessage({ text: `تم رفع ${files.length} ملف بنجاح.`, type: 'success' });
            await loadAssets();
        } catch (e: any) {
            if (e.message === 'STORAGE_PERMISSION_DENIED') {
                setStorageRulesError('STORAGE_PERMISSION_DENIED');
            } else {
                setMessage({ text: 'حدث خطأ أثناء الرفع.', type: 'error' });
            }
        } finally {
            setIsUploading(false);
            setTimeout(() => setMessage(null), 3000);
        }
    };
    
    const handleDelete = async (asset: Asset) => {
        if (!window.confirm(`هل أنت متأكد من حذف الملف "${asset.name}"؟`)) return;
        
        try {
            await dbService.deleteAsset(asset.name);
            setMessage({ text: 'تم حذف الملف.', type: 'success' });
            await loadAssets();
        } catch(e) {
             console.error("Delete failed", e);
             setMessage({ text: 'فشل حذف الملف.', type: 'error' });
        }
        setTimeout(() => setMessage(null), 3000);
    };

    const handleCopy = (url: string) => {
        navigator.clipboard.writeText(url);
        setCopiedUrl(url);
        setTimeout(() => setCopiedUrl(null), 2000);
    };
    
    const handleCopyRules = () => {
        navigator.clipboard.writeText(storageRules);
        setCopiedRules(true);
        setTimeout(() => setCopiedRules(false), 2000);
    };

    const formatBytes = (bytes: number, decimals = 2) => {
      if (bytes === 0) return '0 Bytes';
      const k = 1024;
      const dm = decimals < 0 ? 0 : decimals;
      const sizes = ['Bytes', 'KB', 'MB', 'GB'];
      const i = Math.floor(Math.log(bytes) / Math.log(k));
      return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
    }

    return (
        <div className="max-w-7xl mx-auto py-8 animate-fadeIn font-['Tajawal'] text-right" dir="rtl">
            <header className="flex flex-col md:flex-row justify-between items-center gap-6 mb-8">
                <h2 className="text-3xl font-black text-white flex items-center gap-4"><Library /> مكتبة الوسائط</h2>
                <button onClick={loadAssets} className="p-4 bg-white/5 rounded-2xl text-white hover:bg-white/10 transition-all border border-white/10"><RefreshCw size={20} className={isLoading ? 'animate-spin' : ''} /></button>
            </header>

            {message && <div className={`mb-6 p-4 rounded-2xl text-xs font-bold flex items-center gap-3 border ${message.type === 'success' ? 'bg-green-500/10 text-green-400 border-green-500/20' : 'bg-red-500/10 text-red-400 border-red-500/20'}`}> <AlertCircle size={16}/> {message.text} </div>}
            
            {storageRulesError && (
                <div className="glass-panel p-10 rounded-[40px] border-red-500/20 bg-red-500/5 animate-slideUp mb-8">
                    <div className="flex items-start gap-6">
                        <div className="w-14 h-14 rounded-2xl bg-red-500/10 flex items-center justify-center text-red-500 shrink-0">
                            <AlertCircle size={32} />
                        </div>
                        <div className="flex-1">
                            <h4 className="text-xl font-black text-red-400 mb-2 uppercase tracking-widest">فشل الوصول إلى مخزن الوسائط</h4>
                            <p className="text-gray-300 leading-relaxed font-bold italic mb-6">"Firebase Storage: User does not have permission to list objects."</p>
                            
                            <div className="bg-black/40 rounded-3xl p-8 border border-white/5 mb-8">
                                <h5 className="text-amber-400 font-black text-sm mb-4 flex items-center gap-2">
                                    <Settings size={16}/> حل مشكلة الصلاحيات في Firebase Storage:
                                </h5>
                                <ol className="text-xs text-gray-400 space-y-4 list-decimal list-inside leading-relaxed">
                                    <li>اذهب إلى <a href={`https://console.firebase.google.com/project/${process.env.VITE_FIREBASE_PROJECT_ID}/storage/rules`} target="_blank" rel="noreferrer" className="text-blue-400 underline inline-flex items-center gap-1">صفحة قواعد التخزين (Storage Rules) <ExternalLink size={10}/></a> في مشروعك على Firebase.</li>
                                    <li>انسخ الكود أدناه بالكامل.</li>
                                    <li>استبدل القواعد الموجودة بهذا الكود ثم اضغط على **Publish**.</li>
                                </ol>
                                
                                <div className="mt-6 relative group">
                                    <pre className="bg-black/60 p-5 rounded-xl text-[10px] font-mono text-emerald-400 overflow-x-auto ltr text-left border border-white/10">
                                        {storageRules}
                                    </pre>
                                    <button 
                                        onClick={handleCopyRules}
                                        className="absolute top-4 left-4 p-2 bg-white/10 hover:bg-white/20 rounded-lg text-white transition-all flex items-center gap-2 text-[10px] font-bold"
                                    >
                                        {copiedRules ? <><CopyCheck size={12}/> تم النسخ</> : <><Copy size={12}/> نسخ الكود</>}
                                    </button>
                                </div>
                            </div>

                            <div className="flex justify-end gap-3">
                                <button onClick={loadAssets} className="bg-red-500 text-white px-8 py-3 rounded-xl font-black text-[10px] uppercase tracking-widest hover:bg-red-600 transition-all shadow-lg">
                                    إعادة اختبار الاتصال
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}


            <div className="glass-panel p-8 rounded-[40px] border-white/5 mb-8">
                <label htmlFor="file-upload" className="flex flex-col items-center justify-center w-full h-48 border-2 border-dashed border-white/10 rounded-[30px] cursor-pointer bg-black/40 hover:bg-black/60 transition-all">
                    <div className="flex flex-col items-center justify-center pt-5 pb-6">
                        {isUploading ? (
                            <>
                                <RefreshCw className="w-10 h-10 mb-3 text-[#fbbf24] animate-spin" />
                                <p className="mb-2 text-sm font-bold text-[#fbbf24]">جاري الرفع...</p>
                            </>
                        ) : (
                            <>
                                <UploadCloud className="w-10 h-10 mb-3 text-gray-500"/>
                                <p className="mb-2 text-sm font-bold text-gray-400">اسحب وأفلت الملفات هنا أو اضغط للرفع</p>
                                <p className="text-xs text-gray-600">صور، فيديوهات، PDF، ملفات صوتية</p>
                            </>
                        )}
                    </div>
                    <input id="file-upload" type="file" multiple className="hidden" onChange={e => handleFileUpload(e.target.files)} />
                </label>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-6">
                {isLoading && !storageRulesError && Array.from({ length: 6 }).map((_, i) => (
                    <div key={i} className="aspect-square bg-white/5 rounded-3xl animate-pulse"></div>
                ))}
                {assets.map(asset => (
                    <div key={asset.name} className="relative group aspect-square bg-black/40 rounded-3xl overflow-hidden border border-white/5 shadow-lg">
                        {asset.type.startsWith('image/') ? (
                            <img src={asset.url} alt={asset.name} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" />
                        ) : (
                            <div className="w-full h-full flex flex-col items-center justify-center text-gray-500 p-4">
                                <FileText size={48} />
                                <p className="text-xs font-bold mt-2 text-center break-all">{asset.name.split('_').pop()}</p>
                            </div>
                        )}
                        <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent flex flex-col justify-end p-4 opacity-0 group-hover:opacity-100 transition-opacity">
                            <p className="text-xs font-bold text-white truncate">{asset.name.split('_').pop()}</p>
                            <p className="text-[10px] text-gray-400 font-mono">{formatBytes(asset.size)}</p>
                            <div className="flex gap-2 mt-3">
                                <button onClick={() => handleCopy(asset.url)} className="flex-1 p-2 bg-white/10 backdrop-blur-md rounded-lg text-white hover:bg-white hover:text-black transition-all flex items-center justify-center gap-1.5">
                                    {copiedUrl === asset.url ? <CopyCheck size={14}/> : <Copy size={14}/>}
                                    <span className="text-[9px] font-bold">{copiedUrl === asset.url ? 'تم!' : 'نسخ'}</span>
                                </button>
                                <button onClick={() => handleDelete(asset)} className="p-2 bg-red-500/20 backdrop-blur-md rounded-lg text-red-400 hover:bg-red-500 hover:text-white transition-all">
                                    <Trash2 size={14} />
                                </button>
                            </div>
                        </div>
                    </div>
                ))}
            </div>
             {assets.length === 0 && !isLoading && !storageRulesError && <div className="text-center py-20 opacity-30 text-gray-500">لا توجد ملفات مرفوعة.</div>}
        </div>
    );
};

export default AdminAssetManager;

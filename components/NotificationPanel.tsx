
import React, { useState, useEffect } from 'react';
import { User, AppNotification } from '../types';
import { dbService } from '../services/db';
import { Bell, CheckCheck } from 'lucide-react';

interface NotificationPanelProps {
  user: User;
  onClose: () => void;
}

const NotificationPanel: React.FC<NotificationPanelProps> = ({ user, onClose }) => {
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchNotifications = async () => {
      setIsLoading(true);
      // In a real app, this would be: const data = await dbService.getNotifications(user.uid);
      const mockNotes: AppNotification[] = [
        { id: 'n1', userId: user.uid, title: "إنجاز جديد!", message: "لقد أكملت تحدي 'ماراثون الكهرومغناطيسية'. +250 نقطة!", timestamp: new Date(Date.now() - 1000 * 60 * 5).toISOString(), isRead: false, type: 'success', category: 'academic' },
        { id: 'n2', userId: user.uid, title: "جلسة مباشرة قادمة", message: "تبدأ جلسة 'مراجعة الميكانيكا' خلال ساعة.", timestamp: new Date(Date.now() - 1000 * 60 * 60 * 2).toISOString(), isRead: false, type: 'info', category: 'general' },
        { id: 'n3', userId: user.uid, title: "توصية ذكية", message: "يقترح المساعد الذكي مراجعة درس 'قانون فاراداي'.", timestamp: new Date(Date.now() - 1000 * 60 * 60 * 24).toISOString(), isRead: true, type: 'info', category: 'academic' }
      ];
      setNotifications(mockNotes.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()));
      setIsLoading(false);
    };
    fetchNotifications();
  }, [user.uid]);

  const getIconForType = (type: AppNotification['type']) => {
    switch(type) {
      case 'success': return <span className="text-green-500">🏆</span>;
      case 'warning': return <span className="text-yellow-500">⚠️</span>;
      default: return <span className="text-sky-500">🔔</span>;
    }
  };

  return (
    <div className="fixed inset-0 z-[100] bg-black/60 backdrop-blur-sm" onClick={onClose}>
      <div 
        className="absolute top-24 right-4 md:right-10 w-[95%] max-w-md h-auto max-h-[70vh] flex flex-col glass-panel rounded-[40px] border-white/10 shadow-2xl animate-slideUp overflow-hidden"
        onClick={e => e.stopPropagation()}
      >
        <header className="p-6 border-b border-white/5 flex justify-between items-center bg-white/[0.03]">
          <h3 className="font-black text-white flex items-center gap-3"><Bell size={18}/> مركز الإشعارات</h3>
          <button className="text-[10px] font-bold text-gray-400 hover:text-white flex items-center gap-1.5"><CheckCheck size={12}/> وضع علامة مقروء للكل</button>
        </header>
        <div className="flex-1 overflow-y-auto no-scrollbar p-4 space-y-3">
          {isLoading ? <div className="p-10 text-center text-gray-500">جاري التحميل...</div> :
           notifications.map(note => (
            <div key={note.id} className={`p-4 rounded-2xl flex gap-4 transition-all ${note.isRead ? 'opacity-50' : 'bg-sky-500/5'}`}>
              <div className="w-8 h-8 rounded-full bg-black/40 flex items-center justify-center text-lg shrink-0">{getIconForType(note.type)}</div>
              <div>
                <p className={`font-bold text-sm ${note.isRead ? 'text-gray-400' : 'text-white'}`}>{note.title}</p>
                <p className="text-xs text-gray-400">{note.message}</p>
              </div>
            </div>
           ))
          }
           {notifications.length === 0 && !isLoading && <div className="p-10 text-center text-gray-500 italic">لا توجد إشعارات جديدة.</div>}
        </div>
      </div>
    </div>
  );
};

export default NotificationPanel;

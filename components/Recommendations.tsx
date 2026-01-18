
import React, { useState, useEffect } from 'react';
import { User, AIRecommendation } from '../types';
import { dbService } from '../services/db';
import { AlertTriangle, BookOpen, Brain, MessageSquare, Target } from 'lucide-react';

const Recommendations: React.FC<{ user: User }> = ({ user }) => {
  const [recommendations, setRecommendations] = useState<AIRecommendation[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchRecs = async () => {
      if (!user) {
        setIsLoading(false);
        return;
      }
      setIsLoading(true);
      const data = await dbService.getAIRecommendations(user);
      setRecommendations(data);
      setIsLoading(false);
    };
    fetchRecs();
  }, [user]);

  const getUrgencyStyles = (urgency: 'high' | 'medium' | 'low') => {
    switch (urgency) {
      case 'high': return { text: 'text-red-400', border: 'border-red-500/30', bg: 'bg-red-500/10' };
      case 'medium': return { text: 'text-yellow-400', border: 'border-yellow-500/30', bg: 'bg-yellow-500/10' };
      default: return { text: 'text-sky-400', border: 'border-sky-500/30', bg: 'bg-sky-500/10' };
    }
  };
  
  const getIconForType = (type: AIRecommendation['type']) => {
    switch(type) {
      case 'lesson': return <BookOpen />;
      case 'quiz': return <Target />;
      case 'challenge': return <AlertTriangle />;
      case 'discussion': return <MessageSquare />;
      default: return <Brain />;
    }
  };

  return (
    <div className="max-w-4xl mx-auto py-12 animate-fadeIn font-['Tajawal'] text-right" dir="rtl">
      <header className="mb-12 border-r-4 border-purple-500 pr-8">
        <h2 className="text-5xl font-black mb-4 tracking-tighter">مسار <span className="text-purple-400">التعلم</span> الذكي</h2>
        <p className="text-gray-500 text-xl font-medium">توصيات مخصصة من المساعد الذكي لتسريع تقدمك.</p>
      </header>

      {isLoading ? (
        <div className="text-center py-20 text-purple-400 animate-pulse">جاري تحليل ملفك الأكاديمي...</div>
      ) : (
        <div className="space-y-8">
          {recommendations.map(rec => {
            const styles = getUrgencyStyles(rec.urgency);
            return (
              <div key={rec.id} className={`glass-panel p-10 rounded-[40px] border ${styles.border} ${styles.bg} flex gap-8 items-start hover:border-purple-400/50 transition-all group animate-slideUp`}>
                <div className={`w-16 h-16 rounded-3xl flex items-center justify-center text-2xl shrink-0 ${styles.bg} border-2 ${styles.border} ${styles.text}`}>
                  {getIconForType(rec.type)}
                </div>
                <div className="flex-1">
                  <div className="flex justify-between items-center mb-3">
                    <h3 className="text-2xl font-black text-white">{rec.title}</h3>
                    <span className={`px-4 py-1 rounded-full text-xs font-bold border ${styles.text} ${styles.border} ${styles.bg}`}>{rec.urgency}</span>
                  </div>
                  <p className="text-gray-400 text-sm italic mb-6">"سبب التوصية: {rec.reason}"</p>
                  <button className="bg-white/10 text-white font-bold text-xs px-6 py-3 rounded-xl border border-white/10 group-hover:bg-purple-500 transition-all">
                    اذهب الآن
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default Recommendations;

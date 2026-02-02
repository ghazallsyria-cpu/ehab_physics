import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { InteractiveLesson, InteractiveLessonCategory } from '../types';
import { dbService } from '../services/db';
import { RefreshCw, Zap, Star, Filter, ArrowLeft, Layers } from 'lucide-react';

const InteractiveLessons: React.FC = () => {
  const navigate = useNavigate();
  const [lessons, setLessons] = useState<InteractiveLesson[]>([]);
  const [categories, setCategories] = useState<InteractiveLessonCategory[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeCategory, setActiveCategory] = useState<string>('all');

  useEffect(() => {
    const loadData = async () => {
      setIsLoading(true);
      try {
        const [lessonsData, categoriesData] = await Promise.all([
          dbService.getInteractiveLessons(),
          dbService.getInteractiveLessonCategories()
        ]);
        setLessons(lessonsData);
        setCategories(categoriesData);
      } catch (error) {
        console.error("Failed to load interactive lessons:", error);
      } finally {
        setIsLoading(false);
      }
    };
    loadData();
  }, []);

  const filteredLessons = activeCategory === 'all'
    ? lessons
    : lessons.filter(lesson => lesson.category_id === activeCategory);

  const getCategoryColor = (categoryId?: string) => {
    const category = categories.find(c => c.id === categoryId);
    return category?.color || '#fbbf24'; // default gold
  };

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center h-[50vh] gap-4">
        <RefreshCw className="w-12 h-12 text-amber-400 animate-spin" />
        <p className="text-gray-500 font-bold uppercase tracking-widest">تحميل الدروس التفاعلية...</p>
      </div>
    );
  }

  return (
    <div className="animate-fadeIn space-y-12 pb-20">
      <header className="text-center space-y-4">
        <div className="inline-block p-4 bg-purple-500/10 rounded-3xl border border-purple-500/20 shadow-lg">
          <Zap size={40} className="text-purple-400" />
        </div>
        <h1 className="text-5xl font-black text-white italic tracking-tighter">الرحلات <span className="text-purple-400">التفاعلية</span></h1>
        <p className="text-gray-400 text-lg max-w-2xl mx-auto">
          انغمس في تجارب تعليمية مصممة خصيصاً لتجعل الفيزياء أكثر متعة وفهماً.
        </p>
      </header>

      {/* Category Filters */}
      <div className="flex items-center justify-center gap-3 flex-wrap bg-black/20 p-3 rounded-full border border-white/10 max-w-2xl mx-auto">
        <button
          onClick={() => setActiveCategory('all')}
          className={`px-6 py-2 rounded-full text-xs font-black transition-all ${activeCategory === 'all' ? 'bg-white text-black' : 'bg-transparent text-gray-400 hover:bg-white/10 hover:text-white'}`}
        >
          الكل
        </button>
        {categories.map(cat => (
          <button
            key={cat.id}
            onClick={() => setActiveCategory(cat.id)}
            className={`px-6 py-2 rounded-full text-xs font-black transition-all ${activeCategory === cat.id ? 'bg-white text-black' : 'bg-transparent text-gray-400 hover:bg-white/10 hover:text-white'}`}
          >
            {cat.name}
          </button>
        ))}
      </div>

      {/* Lessons Grid */}
      {filteredLessons.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {filteredLessons.map((lesson, idx) => (
            <div
              key={lesson.id}
              className="glass-panel group rounded-[50px] border-2 border-white/5 bg-gradient-to-br from-white/[0.03] to-transparent hover:border-purple-500/30 transition-all duration-500 flex flex-col relative overflow-hidden shadow-2xl animate-slideUp"
              style={{ animationDelay: `${idx * 50}ms` }}
            >
              <div className="h-48 rounded-t-[48px] overflow-hidden relative">
                <img src={lesson.thumbnail_url || 'https://images.unsplash.com/photo-1614726353900-961288277a55?auto=format&fit=crop&w=800&q=80'} alt={lesson.title} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" />
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent"></div>
                <div className="absolute bottom-4 right-4 flex items-center gap-2">
                    <div className="bg-black/50 backdrop-blur-md px-3 py-1 rounded-full text-xs font-bold text-white border border-white/10 flex items-center gap-1">
                        <Star size={12} className="text-yellow-400" fill="currentColor" /> {lesson.total_points || 100} نقطة
                    </div>
                </div>
              </div>
              <div className="p-8 flex-1 flex flex-col">
                <h2 className="text-2xl font-black text-white mb-3 group-hover:text-purple-400 transition-colors">{lesson.title}</h2>
                <p className="text-gray-400 text-sm leading-relaxed flex-1 mb-6 line-clamp-3">{lesson.description}</p>
                <div className="flex justify-between items-center mt-auto pt-6 border-t border-white/10">
                    <span className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">{lesson.estimated_duration_minutes || 15} دقيقة</span>
                    <button
                        onClick={() => navigate(`/interactive/${lesson.id}`)}
                        className="bg-purple-500 text-white px-8 py-3 rounded-full font-black text-[10px] uppercase tracking-widest hover:scale-105 transition-all shadow-lg shadow-purple-500/20"
                    >
                        ابدأ الرحلة
                    </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-20 opacity-50 border-2 border-dashed border-white/10 rounded-[50px]">
          <Layers size={48} className="mx-auto text-gray-600 mb-4" />
          <p className="font-bold">لا توجد دروس تفاعلية في هذا التصنيف حالياً.</p>
        </div>
      )}
    </div>
  );
};

export default InteractiveLessons;

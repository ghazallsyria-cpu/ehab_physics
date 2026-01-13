
import React, { useState, useEffect } from 'react';

interface Todo {
  id: string;
  text: string;
  completed: boolean;
  category: 'Study' | 'Exam' | 'Lab' | 'Review';
}

const TodoList: React.FC = () => {
  const [todos, setTodos] = useState<Todo[]>([]);
  const [input, setInput] = useState('');
  const [category, setCategory] = useState<Todo['category']>('Study');

  useEffect(() => {
    const saved = localStorage.getItem('physi_todos');
    if (saved) setTodos(JSON.parse(saved));
    else {
      // Default initial tasks
      setTodos([
        { id: '1', text: 'مراجعة قوانين نيوتن للحركة', completed: false, category: 'Study' },
        { id: '2', text: 'إتمام تجربة مختبر قانون أوم', completed: true, category: 'Lab' },
        { id: '3', text: 'حل اختبار تجريبي للفصل الأول', completed: false, category: 'Exam' }
      ]);
    }
  }, []);

  useEffect(() => {
    localStorage.setItem('physi_todos', JSON.stringify(todos));
  }, [todos]);

  const addTodo = (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim()) return;
    const newTodo: Todo = {
      id: Date.now().toString(),
      text: input,
      completed: false,
      category
    };
    setTodos([newTodo, ...todos]);
    setInput('');
  };

  const toggleTodo = (id: string) => {
    setTodos(todos.map(t => t.id === id ? { ...t, completed: !t.completed } : t));
  };

  const deleteTodo = (id: string) => {
    setTodos(todos.filter(t => t.id !== id));
  };

  const getCategoryColor = (cat: Todo['category']) => {
    switch (cat) {
      case 'Study': return 'text-blue-400 bg-blue-400/10 border-blue-400/20';
      case 'Exam': return 'text-red-400 bg-red-400/10 border-red-400/20';
      case 'Lab': return 'text-green-400 bg-green-400/10 border-green-400/20';
      case 'Review': return 'text-purple-400 bg-purple-400/10 border-purple-400/20';
    }
  };

  return (
    <div className="max-w-4xl mx-auto py-12 px-6 animate-fadeIn font-['Tajawal'] text-white">
      <header className="mb-12">
        <h2 className="text-5xl font-black mb-4 tracking-tighter">قائمة <span className="text-[#00d2ff] text-glow italic">الأهداف الذكية</span></h2>
        <p className="text-gray-500 text-lg">نظّم رحلتك المعرفية وحقّق أهدافك الفيزيائية خطوة بخطوة.</p>
      </header>

      <div className="glass-panel p-10 rounded-[60px] border-white/5 bg-gradient-to-br from-white/[0.02] to-transparent mb-12">
        <form onSubmit={addTodo} className="space-y-6">
          <div className="flex flex-col md:flex-row gap-4">
            <input 
              type="text" 
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="اكتب هدفاً جديداً (مثلاً: حل 10 مسائل مقذوفات)"
              className="flex-1 bg-white/5 border border-white/10 rounded-[24px] px-8 py-4 outline-none focus:border-[#00d2ff] transition-all font-bold"
            />
            <select 
              value={category}
              onChange={(e) => setCategory(e.target.value as any)}
              className="bg-white/5 border border-white/10 rounded-[24px] px-6 py-4 outline-none focus:border-[#00d2ff] font-black text-xs uppercase"
            >
              <option value="Study">دراسة 📚</option>
              <option value="Exam">اختبار 📝</option>
              <option value="Lab">مختبر 🧪</option>
              <option value="Review">مراجعة 🔄</option>
            </select>
            <button type="submit" className="bg-[#00d2ff] text-black px-10 py-4 rounded-[24px] font-black text-xs uppercase tracking-widest hover:scale-105 transition-all shadow-xl shadow-[#00d2ff]/20">
              إضافة هدف
            </button>
          </div>
        </form>

        <div className="mt-12 space-y-4">
          {todos.length > 0 ? todos.map(todo => (
            <div 
              key={todo.id} 
              className={`flex items-center justify-between p-6 rounded-[32px] border transition-all group ${todo.completed ? 'bg-white/[0.02] border-white/5 opacity-50' : 'bg-white/5 border-white/10 hover:border-[#00d2ff]/30'}`}
            >
              <div className="flex items-center gap-6">
                <button 
                  onClick={() => toggleTodo(todo.id)}
                  className={`w-8 h-8 rounded-xl border-2 flex items-center justify-center transition-all ${todo.completed ? 'bg-green-500 border-green-500' : 'border-white/20 hover:border-[#00d2ff]'}`}
                >
                  {todo.completed && <span className="text-black font-black text-xs">✓</span>}
                </button>
                <div className="text-right">
                  <p className={`text-lg font-bold transition-all ${todo.completed ? 'line-through text-gray-600' : 'text-white'}`}>{todo.text}</p>
                  <span className={`inline-block mt-2 px-3 py-1 rounded-lg text-[8px] font-black uppercase tracking-widest border ${getCategoryColor(todo.category)}`}>
                    {todo.category}
                  </span>
                </div>
              </div>
              <button 
                onClick={() => deleteTodo(todo.id)}
                className="w-10 h-10 rounded-xl bg-red-500/10 text-red-500 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all hover:bg-red-500 hover:text-white"
              >
                ✕
              </button>
            </div>
          )) : (
            <div className="py-20 text-center opacity-30 flex flex-col items-center">
               <span className="text-6xl mb-6">🎯</span>
               <p className="font-black text-sm uppercase tracking-[0.4em]">لا توجد أهداف نشطة حالياً</p>
            </div>
          )}
        </div>
      </div>

      <div className="p-8 bg-purple-500/5 rounded-[40px] border border-purple-500/20 flex items-center gap-8">
         <div className="w-16 h-16 bg-purple-500/20 rounded-3xl flex items-center justify-center text-3xl">💡</div>
         <div>
            <h4 className="text-lg font-black text-purple-400 mb-1">نصيحة كوانتومية</h4>
            <p className="text-sm text-gray-400 italic">"تقسيم الأهداف الكبيرة إلى مهام صغيرة يقلل من طاقة التنشيط اللازمة للبدء بالدراسة."</p>
         </div>
      </div>
    </div>
  );
};

export default TodoList;

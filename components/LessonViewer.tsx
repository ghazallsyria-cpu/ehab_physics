
import React, { useState, useEffect, useRef } from 'react';
import { PhysicsTopic, User } from '../types';
import { dbService } from '../services/db';
import { INITIAL_EXPERIMENTS } from '../constants';
import katex from 'katex';

// Interactive Components
import SimulationCenter from './SimulationCenter';
import VirtualLab from './VirtualLab';
import WorkInteractive from './WorkInteractive';
import EnergyPendulum from './EnergyPendulum';
import WorkInfographic from './WorkInfographic';


// Placeholder for components mentioned in constants.tsx but not provided in the file list
const PlaceholderComponent: React.FC<{ name: string }> = ({ name }) => (
    <div className="p-8 bg-black/40 rounded-3xl border border-dashed border-white/10 text-center">
        <p className="font-bold text-gray-500">Interactive Component Placeholder</p>
        <p className="text-sm font-mono text-gray-600">{name}</p>
    </div>
);

// Launcher for full-screen components like VirtualLab
const LaunchVRLabButton: React.FC = () => {
    const launch = () => {
        // App.tsx listens for this event to change view
        window.dispatchEvent(new CustomEvent('change-view', { 
            detail: { view: 'virtual-lab' } 
        }));
    };
    return (
        <div className="p-8 bg-black/40 rounded-3xl border border-[#7000ff]/30 text-center space-y-4">
            <span className="text-4xl">🧪</span>
            <h4 className="text-lg font-bold text-white">مختبر الواقع الافتراضي</h4>
            <p className="text-xs text-gray-500">هذه التجربة تتطلب الدخول في وضع ملء الشاشة.</p>
            <button onClick={launch} className="w-full bg-[#7000ff] text-white py-3 rounded-xl font-bold text-xs uppercase">
                الدخول للمختبر
            </button>
        </div>
    );
};


// --- Constants & Maps ---
const COMPONENT_MAP: Record<string, React.FC<any>> = {
  'SimulationCenter': SimulationCenter,
  'VRLab': LaunchVRLabButton,
  'WorkInteractive': WorkInteractive,
  'EnergyPendulum': EnergyPendulum,
  'WorkInfographic': WorkInfographic,
  'SimulationPlaceholder_UniformMotion': () => <PlaceholderComponent name="UniformMotion" />,
  'SimulationPlaceholder_FreeFall': () => <PlaceholderComponent name="FreeFall" />,
  'InteractiveGraphingTool': () => <PlaceholderComponent name="GraphingTool" />,
};

// --- Main Component ---

interface LessonViewerProps {
  user: User | null;
  topic: PhysicsTopic;
  onBack: () => void;
  onComplete: (lessonId: string) => void;
}

const LessonViewer: React.FC<LessonViewerProps> = ({ user, topic, onBack, onComplete }) => {
  const [activeLessonIndex, setActiveLessonIndex] = useState(0);
  const [notes, setNotes] = useState('');
  const [isSavingNote, setIsSavingNote] = useState(false);

  const activeLesson = topic.lessonDetails ? topic.lessonDetails[activeLessonIndex] : null;

  useEffect(() => {
    if (user && activeLesson) {
      dbService.getLessonNote(user.uid, activeLesson.id).then(setNotes);
    }
  }, [user, activeLesson]);


  const handleNoteSave = async () => {
    if (user && activeLesson) {
      setIsSavingNote(true);
      await dbService.saveLessonNote(user.uid, activeLesson.id, notes);
      setTimeout(() => setIsSavingNote(false), 1000);
    }
  };
  
  const renderDynamicContent = (content: string) => {
    const rawParts = content.split(/(\[COMPONENT:.*?\]|###.*?\n|---)/g);
    
    const elements: React.ReactNode[] = [];
    let currentProse: string[] = [];

    const flushProse = () => {
      if (currentProse.length > 0) {
        const proseHtml = currentProse.join('')
          .replace(/(\$\$[\s\S]*?\$\$)/g, (match) => {
            try { return katex.renderToString(match.slice(2, -2), { displayMode: true, throwOnError: false }); }
            catch (e) { return `<pre class="text-red-400">${match}</pre>`; }
          })
          .replace(/(\$.*?\$)/g, (match) => {
            try { return katex.renderToString(match.slice(1, -1), { displayMode: false, throwOnError: false }); }
            catch (e) { return `<code class="text-red-400">${match}</code>`; }
          });

        elements.push(<div key={`prose-${elements.length}`} className="prose prose-invert prose-lg max-w-none text-gray-300 leading-loose mb-8 text-2xl" dangerouslySetInnerHTML={{ __html: proseHtml }} />);
        currentProse = [];
      }
    };

    rawParts.forEach((part, index) => {
      if (!part || part.trim() === '') return;

      if (part.startsWith('###')) {
        flushProse();
        elements.push(<h3 key={index} className="text-4xl font-black text-white mt-16 mb-8 tracking-tighter border-r-4 border-[#00d2ff] pr-6">{part.replace('###', '').trim()}</h3>);
      } else if (part.startsWith('---')) {
        flushProse();
        elements.push(<hr key={index} className="my-12 border-white/5" />);
      } else if (part.startsWith('[COMPONENT:')) {
        flushProse();
        const componentName = part.replace('[COMPONENT:', '').replace(']', '').trim();
        const InteractiveComponent = COMPONENT_MAP[componentName];
        
        if (InteractiveComponent) {
          elements.push(
            <div key={index} className="my-16 animate-fadeIn">
              <div className="relative group">
                <div className="absolute -inset-2 bg-gradient-to-r from-[#00d2ff]/20 to-[#fbbf24]/20 rounded-[55px] blur-xl opacity-0 group-hover:opacity-100 transition-opacity duration-700"></div>
                <InteractiveComponent />
              </div>
            </div>
          );
        } else {
            currentProse.push(`<div class="p-4 bg-red-900/50 border border-red-500 rounded-xl">Error: Component <code>${componentName}</code> not found.</div>`);
        }
      } else {
        currentProse.push(part);
      }
    });

    flushProse();
    return <>{elements}</>;
  };

  if (!activeLesson) {
    return (
        <div className="text-center p-20 text-white">
            <h2 className="text-2xl font-bold">خطأ</h2>
            <p>لم يتم العثور على الدرس المطلوب.</p>
            <button onClick={onBack} className="mt-4 text-[#fbbf24]">العودة للخريطة</button>
        </div>
    );
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
        {/* Main Content */}
        <div className="lg:col-span-8 space-y-8 animate-fadeIn">
            <div className="glass-panel p-10 md:p-16 rounded-[60px] border-white/5 bg-black/40">
                <h2 className="text-4xl md:text-5xl font-black text-white mb-4 tracking-tighter">{activeLesson.title}</h2>
                <div className="flex items-center gap-4 mb-10">
                    <span className="px-4 py-1 bg-[#00d2ff]/10 text-[#00d2ff] rounded-full text-[10px] font-bold border border-[#00d2ff]/20">{activeLesson.type}</span>
                    {activeLesson.bookReference && <span className="text-xs text-gray-500 font-bold">{activeLesson.bookReference}</span>}
                </div>
                <div>{renderDynamicContent(activeLesson.content)}</div>
            </div>
        </div>

        {/* Sidebar */}
        <div className="lg:col-span-4 space-y-6 animate-slideUp">
            <div className="glass-panel p-8 rounded-[40px] border-white/5 sticky top-28">
                <h3 className="text-xl font-black mb-4">ملاحظاتي الخاصة 📝</h3>
                <textarea
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder="اكتب ملاحظاتك هنا..."
                    className="w-full h-48 bg-white/5 border border-white/10 rounded-2xl p-4 text-sm outline-none focus:border-[#fbbf24] no-scrollbar"
                />
                <button
                    onClick={handleNoteSave}
                    className="w-full mt-4 bg-[#fbbf24] text-black py-3 rounded-xl font-bold text-xs uppercase"
                >
                    {isSavingNote ? 'جاري الحفظ...' : 'حفظ الملاحظات'}
                </button>
            </div>
            <div className="glass-panel p-8 rounded-[40px] border-white/5">
                <h3 className="text-xl font-black mb-4">التنقل بين الدروس</h3>
                <div className="space-y-2">
                    {topic.lessonDetails?.map((lesson, index) => (
                        <button
                            key={lesson.id}
                            onClick={() => setActiveLessonIndex(index)}
                            className={`w-full text-right p-4 rounded-xl transition-all ${activeLessonIndex === index ? 'bg-[#00d2ff] text-black' : 'bg-white/5 text-gray-300 hover:bg-white/10'}`}
                        >
                            <span className="font-bold text-sm">{index + 1}. {lesson.title}</span>
                        </button>
                    ))}
                </div>
            </div>
            <button onClick={onBack} className="w-full text-center py-3 text-gray-500 font-bold text-sm hover:text-white transition-colors">← العودة للخريطة</button>
        </div>
    </div>
  );
};

export default LessonViewer;

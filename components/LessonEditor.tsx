
import React, { useState } from 'react';
import { Lesson, ContentBlock, ContentBlockType } from '../types';
import { Book, Image, Video, FileText, Trash2, ArrowUp, ArrowDown, Type, Save, X, Youtube } from 'lucide-react';

interface LessonEditorProps {
  lessonData: Partial<Lesson>;
  unitId: string;
  onSave: (lesson: Lesson, unitId: string) => void;
  onCancel: () => void;
}

const LessonEditor: React.FC<LessonEditorProps> = ({ lessonData, unitId, onSave, onCancel }) => {
  const [lesson, setLesson] = useState<Partial<Lesson>>(lessonData);

  const updateField = (field: keyof Lesson, value: any) => {
    setLesson(prev => ({ ...prev, [field]: value }));
  };

  const updateBlock = (index: number, updatedBlock: ContentBlock) => {
    const newContent = [...(lesson.content || [])];
    newContent[index] = updatedBlock;
    updateField('content', newContent);
  };
  
  const addBlock = (type: ContentBlockType) => {
    const newBlock: ContentBlock = { type, content: '' };
    updateField('content', [...(lesson.content || []), newBlock]);
  };
  
  const removeBlock = (index: number) => {
    updateField('content', (lesson.content || []).filter((_, i) => i !== index));
  };
  
  const moveBlock = (index: number, direction: 'up' | 'down') => {
    const content = [...(lesson.content || [])];
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= content.length) return;
    [content[index], content[targetIndex]] = [content[targetIndex], content[index]];
    updateField('content', content);
  };
  
  const handleSaveClick = () => {
    // Basic validation
    if (!lesson.title?.trim() || !lesson.content || lesson.content.length === 0) {
      alert("يرجى ملء عنوان الدرس وإضافة محتوى واحد على الأقل.");
      return;
    }
    onSave(lesson as Lesson, unitId);
  };

  return (
    <div className="max-w-5xl mx-auto py-12 animate-fadeIn font-['Tajawal'] text-white">
      <div className="flex justify-between items-center mb-10">
        <h2 className="text-3xl font-black">{lessonData.id?.startsWith('new_') ? 'إضافة درس جديد' : 'تعديل الدرس'}</h2>
        <div className="flex gap-4">
            <button onClick={onCancel} className="flex items-center gap-2 px-6 py-3 bg-white/5 text-white rounded-lg text-xs font-bold border border-white/10"><X size={14}/> إلغاء</button>
            <button onClick={handleSaveClick} className="flex items-center gap-2 px-6 py-3 bg-green-500 text-black rounded-lg text-xs font-bold border border-green-500/20"><Save size={14}/> حفظ الدرس</button>
        </div>
      </div>

      <div className="glass-panel p-10 rounded-[40px] border border-white/5 space-y-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <input type="text" placeholder="عنوان الدرس" value={lesson.title || ''} onChange={e => updateField('title', e.target.value)} className="md:col-span-2 w-full bg-black/40 border border-white/10 rounded-lg px-4 py-3 text-white outline-none focus:border-[#fbbf24]"/>
          <select value={lesson.type || 'THEORY'} onChange={e => updateField('type', e.target.value)} className="w-full bg-black/40 border border-white/10 rounded-lg px-4 py-3 text-white outline-none focus:border-[#fbbf24]">
            <option value="THEORY">شرح نظري</option>
            <option value="EXAMPLE">مثال محلول</option>
            <option value="EXERCISE">تمرين</option>
          </select>
        </div>

        {/* Content Blocks */}
        <div className="space-y-6 pt-8 border-t border-white/10">
          <h3 className="font-bold text-gray-400">محتوى الدرس:</h3>
          {(lesson.content || []).map((block, index) => (
            <div key={index} className="p-6 bg-black/20 rounded-2xl border border-white/10 flex gap-4">
              <div className="flex flex-col gap-2">
                <button onClick={() => moveBlock(index, 'up')} disabled={index === 0} className="p-1 bg-white/5 rounded disabled:opacity-20"><ArrowUp size={14}/></button>
                <button onClick={() => moveBlock(index, 'down')} disabled={index === lesson.content!.length - 1} className="p-1 bg-white/5 rounded disabled:opacity-20"><ArrowDown size={14}/></button>
                <button onClick={() => removeBlock(index)} className="p-1 bg-red-500/10 text-red-400 rounded mt-auto"><Trash2 size={14}/></button>
              </div>
              <div className="flex-1 space-y-3">
                <label className="text-xs font-bold text-gray-500 capitalize flex items-center gap-2">
                    {block.type === 'text' && <Type size={12}/>}
                    {block.type === 'image' && <Image size={12}/>}
                    {block.type === 'video' && <Video size={12}/>}
                    {block.type === 'youtube' && <Youtube size={12}/>}
                    {block.type === 'pdf' && <FileText size={12}/>}
                    {block.type} Content
                </label>
                {block.type === 'text' ? (
                  <textarea value={block.content} onChange={e => updateBlock(index, {...block, content: e.target.value})} placeholder="اكتب الشرح هنا (يدعم Markdown والمعادلات)..." className="w-full h-32 bg-black/40 border border-white/10 rounded-lg p-3 text-white outline-none focus:border-white/20"/>
                ) : (
                  <input 
                    type="text" 
                    value={block.content} 
                    onChange={e => updateBlock(index, {...block, content: e.target.value})} 
                    placeholder={block.type === 'youtube' ? 'أدخل رابط فيديو يوتيوب الكامل...' : `أدخل رابط ${block.type}...`} 
                    className="w-full bg-black/40 border border-white/10 rounded-lg p-3 text-white outline-none focus:border-white/20"
                  />
                )}
                <input type="text" value={block.caption || ''} onChange={e => updateBlock(index, {...block, caption: e.target.value})} placeholder="تعليق توضيحي (اختياري)..." className="w-full bg-black/40 border border-white/10 rounded-lg p-3 text-white text-sm outline-none focus:border-white/20"/>
              </div>
            </div>
          ))}
        </div>
        
        {/* Add Block Buttons */}
        <div className="flex flex-wrap gap-4 pt-6 border-t border-white/10">
            <button onClick={() => addBlock('text')} className="flex items-center gap-2 text-xs font-bold px-4 py-2 bg-white/5 rounded-lg border border-white/10"><Type size={14}/> إضافة نص</button>
            <button onClick={() => addBlock('image')} className="flex items-center gap-2 text-xs font-bold px-4 py-2 bg-white/5 rounded-lg border border-white/10"><Image size={14}/> إضافة صورة</button>
            <button onClick={() => addBlock('video')} className="flex items-center gap-2 text-xs font-bold px-4 py-2 bg-white/5 rounded-lg border border-white/10"><Video size={14}/> إضافة فيديو (عام)</button>
            <button onClick={() => addBlock('youtube')} className="flex items-center gap-2 text-xs font-bold px-4 py-2 bg-red-500/10 text-red-400 rounded-lg border border-red-500/20"><Youtube size={14}/> إضافة فيديو يوتيوب</button>
            <button onClick={() => addBlock('pdf')} className="flex items-center gap-2 text-xs font-bold px-4 py-2 bg-white/5 rounded-lg border border-white/10"><FileText size={14}/> إضافة PDF</button>
        </div>
      </div>
    </div>
  );
};

export default LessonEditor;

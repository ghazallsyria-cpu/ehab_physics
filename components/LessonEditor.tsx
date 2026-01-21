import React, { useState } from 'react';
import { Lesson, ContentBlock, ContentBlockType } from '../types';
import { Book, Image, Video, FileText, Trash2, ArrowUp, ArrowDown, Type, Save, X, Youtube, FileAudio, CheckCircle, AlertTriangle } from 'lucide-react';
import YouTubePlayer from './YouTubePlayer';
import { dbService } from '../services/db';

interface LessonEditorProps {
  lessonData: Partial<Lesson>;
  unitId: string;
  grade: '10' | '11' | '12';
  subject: 'Physics' | 'Chemistry';
  onSave: (lesson: Lesson, unitId: string, grade: '10' | '11' | '12', subject: 'Physics' | 'Chemistry') => void;
  onCancel: () => void;
}

const extractYoutubeId = (url: string): string | null => {
    if (!url) {
        return null;
    }
    const regExp = /^.*(?:(?:youtu\.be\/|v\/|vi\/|u\/\w\/|embed\/|shorts\/)|(?:(?:watch)?\v(?:i)?=|\&v(?:i)?=))([^#\&\?]{11}).*/;
    const match = url.match(regExp);

    return (match && match[1]) ? match[1] : null;
};

const LessonEditor: React.FC<LessonEditorProps> = ({ lessonData, unitId, grade, subject, onSave, onCancel }) => {
  const [lesson, setLesson] = useState<Partial<Lesson>>(lessonData);
  const [uploadingIndex, setUploadingIndex] = useState<number | null>(null);
  const [showUrlInputFor, setShowUrlInputFor] = useState<Record<number, boolean>>({});


  const updateField = (field: keyof Lesson, value: any) => {
    setLesson(prev => ({ ...prev, [field]: value }));
  };

  const updateBlock = (index: number, updatedBlock: ContentBlock) => {
    const newContent = [...(lesson.content || [])];
    newContent[index] = updatedBlock;
    updateField('content', newContent);
  };
  
  const handleFileUpload = async (index: number, file: File) => {
    if (!file) return;
    setUploadingIndex(index);
    try {
      const asset = await dbService.uploadAsset(file);
      updateBlock(index, { ...(lesson.content?.[index] as ContentBlock), content: asset.url });
    } catch (error) {
      console.error("Upload failed", error);
      alert("فشل رفع الملف. يرجى المحاولة مرة أخرى.");
    } finally {
      setUploadingIndex(null);
    }
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
    onSave(lesson as Lesson, unitId, grade, subject);
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
                    {block.type === 'audio' && <FileAudio size={12}/>}
                    {block.type} Content
                </label>
                {block.type === 'text' ? (
                  <textarea value={block.content} onChange={e => updateBlock(index, {...block, content: e.target.value})} placeholder="اكتب الشرح هنا (يدعم Markdown والمعادلات)..." className="w-full h-32 bg-black/40 border border-white/10 rounded-lg p-3 text-white outline-none focus:border-white/20"/>
                ) : (block.type === 'image' || block.type === 'video' || block.type === 'pdf' || block.type === 'audio') ? (
                  <div className="bg-black/20 p-4 rounded-lg border border-white/5">
                    {(() => {
                      const isUploaded = block.content && (block.content.includes('supabase.co') || block.content.includes('firebasestorage.googleapis.com'));
                      const isExternalUrl = block.content && (block.content.startsWith('http') || block.content.startsWith('https')) && !isUploaded;

                      if (isUploaded) {
                        return (
                          <div className="space-y-3">
                            <div className="flex items-center gap-2 text-green-400 text-xs font-bold p-2 bg-green-500/10 rounded-md border border-green-500/20">
                              <CheckCircle size={14}/>
                              <span>تم تخزين الملف في مستودع الموقع لضمان بقائه.</span>
                            </div>
                            <input type="text" value={block.content} readOnly className="w-full bg-black/40 border border-white/10 rounded-lg p-3 text-white/50 text-sm font-mono"/>
                            <button onClick={() => updateBlock(index, { ...block, content: '' })} className="text-red-500 text-xs font-bold hover:underline">إزالة واستبدال</button>
                          </div>
                        );
                      }

                      if (isExternalUrl) {
                        return (
                          <div className="space-y-3">
                            <div className="flex items-center gap-2 text-yellow-400 text-xs font-bold p-2 bg-yellow-500/10 rounded-md border border-yellow-500/20">
                              <AlertTriangle size={14}/>
                              <span>تحذير: قد يتوقف هذا الرابط الخارجي عن العمل مستقبلاً. يوصى برفع الملف مباشرة.</span>
                            </div>
                            <input type="text" value={block.content} onChange={e => updateBlock(index, { ...block, content: e.target.value })} className="w-full bg-black/40 border border-white/10 rounded-lg p-3 text-white text-sm"/>
                            <button onClick={() => updateBlock(index, { ...block, content: '' })} className="text-red-500 text-xs font-bold hover:underline">إزالة واستبدال</button>
                          </div>
                        );
                      }
                      
                      if (showUrlInputFor[index]) {
                        return (
                          <div className="animate-fadeIn">
                            <input
                              type="text"
                              placeholder="ألصق الرابط الخارجي هنا..."
                              onBlur={(e) => {
                                if (e.target.value) updateBlock(index, { ...block, content: e.target.value });
                                setShowUrlInputFor(prev => ({ ...prev, [index]: false }));
                              }}
                              autoFocus
                              className="w-full bg-black/40 border border-white/10 rounded-lg p-3 text-white text-sm"
                            />
                          </div>
                        );
                      }

                      return (
                        <div className="flex gap-4">
                          <label className="flex-1 block text-center py-6 bg-blue-500/10 text-blue-400 text-sm font-bold rounded-lg cursor-pointer hover:bg-blue-500/20 border-2 border-blue-500/30">
                            {uploadingIndex === index ? 'جاري الرفع...' : `📂 رفع ملف (موصى به)`}
                            <input 
                              type="file" 
                              accept={
                                  block.type === 'image' ? 'image/*' :
                                  block.type === 'video' ? 'video/*' :
                                  block.type === 'pdf' ? 'application/pdf' :
                                  'audio/*'
                              }
                              className="hidden" 
                              onChange={(e) => e.target.files && handleFileUpload(index, e.target.files[0])}
                              disabled={uploadingIndex !== null}
                            />
                          </label>
                          <button 
                            onClick={() => setShowUrlInputFor(prev => ({ ...prev, [index]: true }))}
                            className="flex-1 py-6 bg-white/5 text-gray-400 text-sm font-bold rounded-lg border-2 border-dashed border-white/20 hover:border-white/40"
                          >
                            🔗 استخدام رابط خارجي
                          </button>
                        </div>
                      );
                    })()}
                  </div>
                ) : (
                  <input 
                    type="text" 
                    value={block.content} 
                    onChange={e => updateBlock(index, {...block, content: e.target.value})} 
                    placeholder="أدخل رابط يوتيوب الكامل..." 
                    className="w-full bg-black/40 border border-white/10 rounded-lg p-3 text-white outline-none focus:border-white/20"
                  />
                )}
                <input type="text" value={block.caption || ''} onChange={e => updateBlock(index, {...block, caption: e.target.value})} placeholder="تعليق توضيحي (اختياري)..." className="w-full bg-black/40 border border-white/10 rounded-lg p-3 text-white text-sm outline-none focus:border-white/20"/>

                {/* Instant Preview Section */}
                {(block.type === 'image' || block.type === 'video' || block.type === 'youtube') && block.content && (
                  <div className="mt-4 pt-4 border-t border-white/10">
                    <label className="text-[9px] font-bold text-gray-500 uppercase tracking-widest">معاينة فورية</label>
                    <div className="mt-2 bg-black/20 p-2 rounded-lg aspect-video flex items-center justify-center border border-white/5">
                      {block.type === 'image' && (
                        <img 
                          src={block.content} 
                          alt="معاينة" 
                          className="max-w-full max-h-full object-contain rounded-md"
                          onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
                          onLoad={(e) => { (e.target as HTMLImageElement).style.display = 'block'; }}
                        />
                      )}
                      {block.type === 'video' && (
                        <video 
                          key={block.content}
                          controls 
                          src={block.content} 
                          className="w-full h-full rounded-md"
                        />
                      )}
                      {block.type === 'youtube' && (() => {
                        const videoId = extractYoutubeId(block.content);
                        return videoId ? (
                          <YouTubePlayer videoId={videoId} />
                        ) : (
                          <p className="text-xs text-red-400">رابط يوتيوب غير صالح للمعاينة. يرجى استخدام الرابط الكامل للفيديو.</p>
                        );
                      })()}
                    </div>
                  </div>
                )}
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
            <button onClick={() => addBlock('audio')} className="flex items-center gap-2 text-xs font-bold px-4 py-2 bg-purple-500/10 text-purple-400 rounded-lg border border-purple-500/20"><FileAudio size={14}/> إضافة صوت</button>
        </div>
      </div>
    </div>
  );
};

export default LessonEditor;
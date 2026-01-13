
import { GoogleGenAI, Type } from "@google/genai";
import { AISolverResult, User, QuizAttempt, Question, SubjectType } from "../types";

const getAI = () => new GoogleGenAI({ apiKey: process.env.API_KEY });

/**
 * المساعد الذكي - محرك التوصيات
 */
export const getEducationalRecommendation = async (studentContext: any, history: any[], topic: string) => {
  const ai = getAI();
  const response = await ai.models.generateContent({
    model: "gemini-3-pro-preview",
    contents: `تحليل أداء الطالب: ${studentContext.name}. 
    التاريخ الأكاديمي المحدود (آخر 3 محاولات): ${JSON.stringify(history)}. 
    الموضوع الحالي: ${topic}`,
    config: {
      systemInstruction: `أنت مستشار أكاديمي في منصة رافد. 
      القواعد المنطقية:
      1. قدم توصيات تربوية مبنية على البيانات.
      2. لا تعطِ إجابات مباشرة بل تلميحات.
      3. مخرجاتك ستخزن في سجل الـ Insights.`,
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          insight: { type: Type.STRING },
          needRemediation: { type: Type.BOOLEAN },
          suggestedLessonId: { type: Type.STRING },
          reassuranceMsg: { type: Type.STRING }
        }
      }
    }
  });
  return JSON.parse(response.text || '{}');
};

export const getAdvancedPhysicsInsight = async (userMsg: string, grade: string, fatigueIndex: number = 0) => {
  const ai = getAI();
  const response = await ai.models.generateContent({
    model: "gemini-3-pro-preview",
    contents: userMsg,
    config: {
      systemInstruction: `أنت المساعد الذكي في أكاديمية رافد. 
      تحدث بلغة العلم الراقية والداعمة. 
      استخدم KaTeX للمعادلات دائماً.`,
      thinkingConfig: { thinkingBudget: 15000 }
    }
  });
  return { text: response.text || "", thinking: "" };
};

export const solvePhysicsProblem = async (input: string): Promise<AISolverResult> => {
  const ai = getAI();
  const response = await ai.models.generateContent({
    model: "gemini-3-pro-preview",
    contents: `حل هذه المسألة الفيزيائية بالتفصيل: ${input}`,
    config: {
      systemInstruction: "أنت خبير فيزياء متخصص. استخدم g=10 m/s^2 و KaTeX. قدم حلاً بروتوكولياً مقسماً لخطوات.",
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          law: { type: Type.STRING },
          steps: { type: Type.ARRAY, items: { type: Type.STRING } },
          finalResult: { type: Type.STRING },
          explanation: { type: Type.STRING }
        }
      }
    }
  });
  return JSON.parse(response.text || '{}') as AISolverResult;
};

export const getPhysicsExplanation = async (prompt: string, grade: string) => {
  const ai = getAI();
  const response = await ai.models.generateContent({
    model: "gemini-3-flash-preview",
    contents: `اشرح لصف ${grade}: ${prompt}`,
    config: { systemInstruction: "أنت معلم فيزياء ملهم تبسط المفاهيم المعقدة." }
  });
  return response.text;
};

export const extractBankQuestionsAdvanced = async (rawInput: string, grade: string, subject: SubjectType, unit: string) => {
  const ai = getAI();
  const response = await ai.models.generateContent({
    model: "gemini-3-pro-preview",
    contents: `حول هذا النص إلى بنك أسئلة مهيكل لصف ${grade} مادة ${subject} وحدة ${unit}: ${rawInput}`,
    config: {
      systemInstruction: `أنت خبير رقمنة المناهج. حول النصوص إلى JSON دقيق مع خطوات حل مبرمجة.`,
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          questions: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                question_text: { type: Type.STRING },
                question_latex: { type: Type.STRING },
                category: { type: Type.STRING },
                type: { type: Type.STRING },
                difficulty: { type: Type.STRING },
                correct_answer: { type: Type.STRING },
                solution: { type: Type.STRING },
                steps_array: { type: Type.ARRAY, items: { type: Type.STRING } },
                common_errors: { type: Type.ARRAY, items: { type: Type.STRING } },
                choices: {
                  type: Type.ARRAY,
                  items: { type: Type.OBJECT, properties: { key: { type: Type.STRING }, text: { type: Type.STRING } } }
                }
              }
            }
          }
        }
      }
    }
  });
  return JSON.parse(response.text || '{"questions": []}');
};

/**
 * دالة الرقمنة البصرية (Multimodal Digitization)
 * تستقبل صورة (من ملف Word/PPT/PDF) وتستخرج منها الأسئلة
 */
export const digitizeExamPaper = async (base64Image: string, grade: string, subject: string) => {
  const ai = getAI();
  const imagePart = {
    inlineData: {
      mimeType: 'image/jpeg',
      data: base64Image.split(',')[1] // إزالة الـ header
    }
  };

  const response = await ai.models.generateContent({
    model: "gemini-3-flash-preview",
    contents: {
      parts: [
        imagePart,
        { text: `قم بتحليل صورة ورقة الاختبار هذه لمادة ${subject} صف ${grade}. استخرج جميع الأسئلة وحولها إلى هيكل بيانات JSON. إذا كان السؤال يحتوي على رسم بياني أو صورة توضيحية، اجعل الحقل 'hasDiagram' يساوي true. قم بتوليد حل نموذجي مفصل.` }
      ]
    },
    config: {
      systemInstruction: "أنت نظام OCR ذكي متخصص في رقمنة الاختبارات الأكاديمية. الدقة في المعادلات الرياضية (LaTeX) أولوية قصوى.",
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          questions: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                question_text: { type: Type.STRING },
                question_latex: { type: Type.STRING, description: "المعادلات الرياضية بصيغة LaTeX إن وجدت" },
                type: { type: Type.STRING, enum: ["mcq", "descriptive"] },
                difficulty: { type: Type.STRING, enum: ["Easy", "Medium", "Hard"] },
                correct_answer: { type: Type.STRING },
                solution: { type: Type.STRING },
                hasDiagram: { type: Type.BOOLEAN, description: "هل يعتمد السؤال على صورة/رسم في الورقة الأصلية؟" },
                choices: {
                  type: Type.ARRAY,
                  items: { type: Type.OBJECT, properties: { key: { type: Type.STRING }, text: { type: Type.STRING } } }
                }
              }
            }
          }
        }
      }
    }
  });

  return JSON.parse(response.text || '{"questions": []}');
};

export const generatePhysicsVisualization = async (prompt: string) => {
  const ai = getAI();
  let operation = await ai.models.generateVideos({
    model: 'veo-3.1-fast-generate-preview',
    prompt: `Educational physics visualization: ${prompt}. Scientific focus.`,
    config: { numberOfVideos: 1, aspectRatio: '16:9' }
  });
  while (!operation.done) {
    await new Promise(resolve => setTimeout(resolve, 10000));
    operation = await ai.operations.getVideosOperation({operation: operation});
  }
  const downloadLink = operation.response?.generatedVideos?.[0]?.video?.uri;
  return `${downloadLink}&key=${process.env.API_KEY}`;
};

/**
 * تحليل الأداء الأكاديمي الشامل بناءً على تاريخ المحاولات
 */
export const getPerformanceAnalysis = async (user: User, attempts: QuizAttempt[]) => {
  const ai = getAI();
  const response = await ai.models.generateContent({
    model: "gemini-3-pro-preview",
    contents: `تحليل أداء الطالب ${user.name} بناءً على المحاولات التالية: ${JSON.stringify(attempts)}`,
    config: {
      systemInstruction: "أنت خبير تحليل بيانات تعليمية متخصص في الفيزياء. قدم تقريراً تحليلياً مفصلاً باللغة العربية حول نقاط القوة والضعف وتوصيات مخصصة للتحسين بناءً على الأداء.",
    }
  });
  return response.text || "لا يمكن استخلاص تحليل في الوقت الحالي.";
};

/**
 * فحص جودة ومصداقية السؤال للرقمنة
 */
export const verifyQuestionQuality = async (question: Question) => {
  const ai = getAI();
  const response = await ai.models.generateContent({
    model: "gemini-3-pro-preview",
    contents: `فحص جودة السؤال: ${JSON.stringify(question)}`,
    config: {
      systemInstruction: "أنت مدقق جودة تعليمي صارم. افحص السؤال من حيث الدقة العلمية الفيزيائية، الوضوح، وصحة الإجابة النموذجية المرفقة. أعد النتيجة حصراً بتنسيق JSON يوضح الصلاحية والتعليق.",
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          valid: { type: Type.BOOLEAN },
          feedback: { type: Type.STRING }
        },
        required: ["valid", "feedback"]
      }
    }
  });
  try {
    return JSON.parse(response.text || '{"valid": false, "feedback": "خطأ في تحليل الاستجابة"}');
  } catch (e) {
    return { valid: false, feedback: "فشل فك تشفير استجابة الذكاء الاصطناعي." };
  }
};

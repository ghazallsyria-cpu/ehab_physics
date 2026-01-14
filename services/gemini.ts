
import { GoogleGenAI, Type } from "@google/genai";
import { AISolverResult, User, QuizAttempt, Question, SubjectType } from "../types";

// Helper to safely get the AI instance
const getAI = () => {
  const apiKey = process.env.API_KEY;
  if (!apiKey) {
    console.error("CRITICAL: API Key is missing. Please check Vercel Environment Variables (API_KEY).");
    // Return a dummy instance that will likely fail gracefully or be caught by try-catch blocks
    // This is safer than throwing immediately which might crash the UI
  }
  return new GoogleGenAI({ apiKey: apiKey || 'dummy-key' });
};

/**
 * المساعد الذكي - محرك التوصيات
 */
export const getEducationalRecommendation = async (studentContext: any, history: any[], topic: string) => {
  try {
    const ai = getAI();
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: `تحليل أداء الطالب: ${studentContext.name}. 
      التاريخ الأكاديمي المحدود (آخر 3 محاولات): ${JSON.stringify(history)}. 
      الموضوع الحالي: ${topic}`,
      config: {
        systemInstruction: `أنت مستشار أكاديمي في منصة المركز السوري للعلوم. 
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
  } catch (e) {
    console.error("AI Error (Recommendation):", e);
    return { insight: "النظام في وضع الصيانة.", reassuranceMsg: "واصل العمل الجيد!" };
  }
};

export const getAdvancedPhysicsInsight = async (userMsg: string, grade: string, fatigueIndex: number = 0) => {
  try {
    const ai = getAI();
    const response = await ai.models.generateContent({
      model: "gemini-3-pro-preview",
      contents: userMsg,
      config: {
        systemInstruction: `أنت المساعد الذكي في المركز السوري للعلوم. 
        تحدث بلغة العلم الراقية والداعمة. 
        استخدم صيغة LaTeX للمعادلات الرياضية، مثلاً $E=mc^2$ للمعادلات المضمنة و $$F=ma$$ للكتل المنفصلة.`,
        thinkingConfig: { thinkingBudget: 1024 } 
      }
    });
    return { text: response.text || "", thinking: "" };
  } catch (e: any) {
    console.error("Chat Error:", e);
    let errorMsg = "عذراً، خدمة الذكاء الاصطناعي غير متاحة حالياً.";
    if (e.message?.includes('API_KEY')) errorMsg += " (يرجى التحقق من مفتاح API)";
    return { text: errorMsg, thinking: "" };
  }
};

export const solvePhysicsProblem = async (input: string): Promise<AISolverResult> => {
  try {
    const ai = getAI();
    const response = await ai.models.generateContent({
      model: "gemini-3-pro-preview",
      contents: `حل هذه المسألة الفيزيائية بالتفصيل: ${input}`,
      config: {
        systemInstruction: "أنت خبير فيزياء متخصص. استخدم g=10 m/s^2. قدم حلاً بروتوكولياً مقسماً لخطوات. اعرض المعادلات بصيغة LaTeX داخل حقول JSON النصية.",
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
  } catch (e) {
    return { law: "", steps: [], finalResult: "", explanation: "تعذر معالجة المسألة حالياً. يرجى المحاولة لاحقاً." };
  }
};

export const getPhysicsExplanation = async (prompt: string, grade: string) => {
  try {
    const ai = getAI();
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: `اشرح لصف ${grade}: ${prompt}`,
      config: { systemInstruction: "أنت معلم فيزياء ملهم تبسط المفاهيم المعقدة." }
    });
    return response.text || "";
  } catch (e) {
    console.error(e);
    return "";
  }
};

// FIX: Added missing function `generatePhysicsVisualization`.
/**
 * Generates a video visualization of a physics concept using Veo.
 */
export const generatePhysicsVisualization = async (prompt: string): Promise<string> => {
  const ai = getAI();
  let operation = await ai.models.generateVideos({
    model: 'veo-3.1-fast-generate-preview',
    prompt: `Cinematic, high-quality, 4k resolution, slow motion visualization of a physics concept: ${prompt}`,
    config: {
      numberOfVideos: 1,
      resolution: '720p', // Use 720p for faster generation in a demo context
      aspectRatio: '16:9'
    }
  });

  while (!operation.done) {
    await new Promise(resolve => setTimeout(resolve, 5000)); // Check every 5 seconds
    operation = await ai.operations.getVideosOperation({ operation: operation });
  }

  const downloadLink = operation.response?.generatedVideos?.[0]?.video?.uri;
  if (downloadLink) {
    // The key must be appended to the URI to access the video
    return `${downloadLink}&key=${process.env.API_KEY}`;
  } else {
    const error = operation.error || { message: "Video generation failed to produce a URI." };
    throw new Error(error.message);
  }
};


// FIX: Added missing function `getPerformanceAnalysis`.
/**
 * Analyzes student performance based on quiz attempts.
 */
export const getPerformanceAnalysis = async (user: User, attempts: QuizAttempt[]): Promise<string> => {
  const ai = getAI();
  const prompt = `
    Analyze the performance of student ${user.name} based on their recent quiz attempts.
    User profile: ${JSON.stringify({ name: user.name, grade: user.grade })}
    Quiz attempts: ${JSON.stringify(attempts)}
    
    Provide a concise, encouraging, and analytical summary in Arabic.
    Focus on:
    1. Overall performance trend.
    2. Strengths (topics where they scored high).
    3. Weaknesses (topics where they scored low).
    4. Actionable advice for improvement.
    
    Structure your response clearly with markdown.
  `;
  const response = await ai.models.generateContent({
    model: 'gemini-3-flash-preview',
    contents: prompt,
    config: {
      systemInstruction: 'أنت مستشار أكاديمي خبير في منصة المركز السوري للعلوم. مهمتك هي تحليل أداء الطلاب وتقديم رؤى قابلة للتنفيذ باللغة العربية.'
    }
  });
  return response.text || "تعذر إنشاء تحليل في الوقت الحالي.";
};

// FIX: Added missing function `extractBankQuestionsAdvanced`.
/**
 * Extracts structured questions from raw text.
 */
export const extractBankQuestionsAdvanced = async (text: string, grade: string, subject: SubjectType, unit: string): Promise<{ questions: Question[] }> => {
  const ai = getAI();
  const response = await ai.models.generateContent({
    model: 'gemini-3-pro-preview',
    contents: `
      Extract all questions from the following text.
      For each question, provide all required fields.
      
      Text to analyze:
      ---
      ${text}
      ---
    `,
    config: {
      systemInstruction: `You are an expert system for digitizing educational content for the Syrian curriculum. Your output must be a valid JSON object. The grade is ${grade}, subject is ${subject}, and unit is ${unit}.`,
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
                type: { type: Type.STRING, description: "'mcq' or 'descriptive'" },
                difficulty: { type: Type.STRING, description: "'Easy', 'Medium', or 'Hard'" },
                correct_answer: { type: Type.STRING },
                solution: { type: Type.STRING },
                score: { type: Type.NUMBER },
                choices: {
                  type: Type.ARRAY,
                  items: {
                    type: Type.OBJECT,
                    properties: { key: { type: Type.STRING }, text: { type: Type.STRING } }
                  }
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

// FIX: Added missing function `digitizeExamPaper`.
/**
 * Extracts structured questions from an image of an exam paper.
 */
export const digitizeExamPaper = async (imageBase64: string, grade: string, subject: SubjectType): Promise<{ questions: Question[] }> => {
  const ai = getAI();
  const imagePart = {
    inlineData: {
      mimeType: imageBase64.startsWith('data:image/png') ? 'image/png' : 'image/jpeg',
      data: imageBase64.split(',')[1],
    },
  };

  const textPart = {
    text: `Using OCR, extract all questions from this exam paper image. For each question, provide all required fields.`,
  };

  const response = await ai.models.generateContent({
    model: 'gemini-3-pro-preview',
    contents: { parts: [imagePart, textPart] },
    config: {
      systemInstruction: `You are an expert system for digitizing educational content from images. Your output must be a valid JSON object. The grade is ${grade}, subject is ${subject}.`,
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
                type: { type: Type.STRING },
                difficulty: { type: Type.STRING },
                correct_answer: { type: Type.STRING },
                solution: { type: Type.STRING },
                score: { type: Type.NUMBER },
                choices: {
                  type: Type.ARRAY,
                  items: {
                    type: Type.OBJECT,
                    properties: { key: { type: Type.STRING }, text: { type: Type.STRING } }
                  }
                },
                hasDiagram: { type: Type.BOOLEAN }
              }
            }
          }
        }
      }
    }
  });
  return JSON.parse(response.text || '{"questions": []}');
};

// FIX: Added missing function `verifyQuestionQuality`.
/**
 * Verifies the quality and correctness of a single question.
 */
export const verifyQuestionQuality = async (question: Question): Promise<{ valid: boolean, feedback: string }> => {
  const ai = getAI();
  const response = await ai.models.generateContent({
    model: 'gemini-3-flash-preview',
    contents: `
      Analyze this physics question for quality based on Syrian curriculum standards.
      Question: ${JSON.stringify(question)}
      
      Check for:
      1. Clarity and lack of ambiguity.
      2. Scientific correctness of the question and solution.
      3. Relevance to the specified grade and unit.
      
      If it's a good question, set valid to true and provide positive feedback.
      If there are issues, set valid to false and provide specific, constructive feedback.
    `,
    config: {
      systemInstruction: `You are an AI quality assurance agent for educational content. Your output must be a valid JSON object.`,
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          valid: { type: Type.BOOLEAN },
          feedback: { type: Type.STRING }
        }
      }
    }
  });
  return JSON.parse(response.text || '{"valid": false, "feedback": "AI analysis failed."}');
};

import { Curriculum, Quiz, Question, Answer, SubscriptionPlan, Challenge, LeaderboardEntry, StudyGoal, Article, StudyGroup, PhysicsExperiment, PhysicsEquation } from './types';

// --- 1. Educational Content Data ---
export const CURRICULUM_DATA: Curriculum[] = [
  {
    grade: '12',
    subject: 'Physics',
    title: "منهج الفيزياء السوري - الثالث الثانوي العلمي",
    description: "تغطية شاملة للكتاب المدرسي السوري، الحركة الاهتزازية، النواس، والفيزياء الحديثة.",
    icon: '⚛️',
    units: [
      {
        id: 'u12-1',
        title: 'الوحدة 1: الاهتزازات والأمواج',
        description: 'دراسة الحركة التوافقية البسيطة والنواس المرن والنواس الثقلي.',
        lessons: [
          { 
            id: 'l12-1-1', 
            title: 'النواس المرن (دراسة تحريكية)', 
            type: 'THEORY', 
            duration: '25 د', 
            content: [{
              type: 'text',
              content: 'يخضع المركز العطالي لكتلة معلقة بنابض لقوة إرجاع شدتها تتناسب طرداً مع الاستطالة.\n$$ F = -kx $$'
            }],
            bookReference: 'ص. 12' 
          },
        ]
      }
    ]
  },
  {
    grade: '11',
    subject: 'Physics',
    title: "منهج الفيزياء - الثاني الثانوي العلمي",
    description: "أساسيات التحريك والكهرباء وفق المنهج السوري المطور.",
    icon: '⚡',
    units: []
  },
  {
    grade: '10',
    subject: 'Physics',
    title: "منهج الفيزياء - الأول الثانوي العلمي",
    description: "مدخل إلى الميكانيكا والقياس.",
    icon: '📏',
    units: []
  }
];

export const PHYSICS_TOPICS = CURRICULUM_DATA;

// --- 3. Financial System Data (Syrian Localization) ---
export const SUBSCRIPTION_PLANS: SubscriptionPlan[] = [
  {
    id: 'plan_premium',
    name: 'باقة التميز (Premium)',
    price: 150000,
    duration: 'term',
    features: ['الوصول لكافة وحدات الكتاب', 'حلول أسئلة الدورات السابقة', 'مساعد المعلم الذكي 🤖', 'مختبرات افتراضية متقدمة'],
    recommended: true,
  },
  {
    id: 'plan_basic',
    name: 'الباقة الأساسية',
    price: 60000,
    duration: 'monthly',
    features: ['شرح الوحدة الأولى والثانية', 'بنك أسئلة محدود', 'دعم فني عبر المنتدى'],
  }
];

export const PRICING_PLANS = SUBSCRIPTION_PLANS;

// ... (بقية البيانات تبقى كما هي مع تغيير المسميات للبيئة السورية عند الضرورة)
export const ANSWERS_DB: Answer[] = [
    { id: 'ans-1-1', text: 'زيادة ثابت الصلابة' }, { id: 'ans-1-2', text: 'تقليل الكتلة' }, { id: 'ans-1-3', text: 'إطالة النابض' },
];

export const QUESTIONS_DB: Question[] = [
    { 
      id: 'q-1', 
      question_text: 'ما الذي يحدد دور النواس المرن؟', 
      type: 'mcq', 
      choices: [
        { key: 'أ', text: 'الكتلة وثابت الصلابة' },
        { key: 'ب', text: 'طول النابض فقط' },
        { key: 'ج', text: 'سعة الاهتزاز' }
      ],
      correct_answer: 'أ',
      isVerified: true,
      difficulty: 'Medium',
      unit: 'الاهتزازات',
      grade: '12',
      category: 'النواس المرن',
      solution: 'الدور الخاص للنواس المرن يعطى بالعلاقة $$T_0 = 2\pi \sqrt{\frac{m}{k}}$$ وهو يتعلق بالكتلة m وثابت الصلابة k.',
      answers: [],
      correctAnswerId: 'ans-1-1',
      text: 'ما الذي يحدد دور النواس المرن؟', 
    }
];

export const QUIZZES_DB: Quiz[] = [
  { id: 'quiz-1', title: 'اختبار تجريبي في النواس المرن', unitId: 'u12-1', questionIds: ['q-1'] }
];

export const CHALLENGES_DB: Challenge[] = [
  { id: 'ch-1', title: 'تحدي النواس السريع', description: 'حل 5 مسائل نواسات في أقل من 3 دقائق.', type: 'quiz', reward: 500, isCompleted: false }
];

export const LEADERBOARD_DATA: LeaderboardEntry[] = [
  { rank: 1, name: 'باسل محمود', points: 9200, isCurrentUser: false },
  { rank: 2, name: 'نور الشام', points: 8800, isCurrentUser: false },
  { rank: 3, name: 'أنت', points: 7500, isCurrentUser: true },
];

export const STUDY_GOALS_DB: StudyGoal[] = [
  { id: 'goal-1', title: 'إتمام بحث الاهتزازات', participantCount: 340, progress: 45 },
];

export const MOCK_ARTICLES: Article[] = [
    { id: 'art-1', category: 'الفيزياء الكونية', title: 'الثقوب السوداء في المنهج المطور', summary: 'كيف نتخيل انحناء الزمكان؟', imageUrl: 'https://images.unsplash.com/photo-1462331940025-496dfbfc7564?q=80&w=2022&auto=format&fit=crop', readTime: '10 دقائق', content: 'المحتوى التعليمي السوري يركز حالياً على تبسيط مفاهيم النسبية...' },
];

export const MOCK_STUDY_GROUPS: StudyGroup[] = [
    { id: 'sg-1', name: 'نخبة دمشق', level: '12', membersCount: 12, activeChallenge: 'مراجعة الميكانيكا' },
];

export const INITIAL_EXPERIMENTS: PhysicsExperiment[] = [
    { id: 'exp-ohm', title: 'مختبر قانون أوم', description: 'تحكم في المقاومة وشاهد تغير التيار.', thumbnail: '', isFutureLab: false, parameters: [{id: 'voltage', name: 'الجهد', min: 1, max: 20, step: 0.5, defaultValue: 5, unit: 'V'}, {id: 'resistance', name: 'المقاومة', min: 1, max: 100, step: 1, defaultValue: 10, unit: 'Ω'}] },
];

export const MOCK_EQUATIONS: PhysicsEquation[] = [
    { id: 'eq-1', category: 'التحريك', title: 'دور النواس المرن', latex: 'T_0 = 2\\pi \\sqrt{\\frac{m}{k}}', variables: { T_0: 'الدور الخاص', m: 'الكتلة', k: 'ثابت الصلابة' } },
];
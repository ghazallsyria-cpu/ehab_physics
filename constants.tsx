import { Curriculum, Quiz, Question, Answer, SubscriptionPlan, Challenge, LeaderboardEntry, StudyGoal, Article, StudyGroup, PhysicsExperiment, PhysicsEquation } from './types';

// --- 1. Educational Content Data ---
export const CURRICULUM_DATA: Curriculum[] = [
  {
    grade: '12',
    subject: 'Physics',
    title: "منهج الفيزياء - الصف الثاني عشر",
    description: "منهج الفيزياء المتقدم للفرع العلمي، يغطي الكهرومغناطيسية والفيزياء الحديثة والنووية.",
    icon: '⚛️',
    units: [
      {
        id: 'u12-1',
        title: 'الوحدة 1: الكهرومغناطيسية',
        description: 'الحث، المحولات، والموجات الكهرومغناطيسية.',
        lessons: [
          { 
            id: 'l12-1-1', 
            title: 'قانون فاراداي للحث', 
            type: 'THEORY', 
            duration: '15 د', 
            content: [{
              type: 'text',
              content: 'تتولد قوة دافعة كهربائية حثية ($ε$) عند تغير التدفق المغناطيسي ($Φ_B$).\n$$ \\varepsilon = -N \\frac{\\Delta \\Phi_B}{\\Delta t} $$'
            }],
            bookReference: 'ص. 78' 
          },
          { 
            id: 'l12-1-2', 
            title: 'مثال على المحولات', 
            type: 'EXAMPLE', 
            duration: '10 د', 
            content: [{
              type: 'text',
              content: 'محول كهربائي مثالي عدد لفات ابتدائية 100 وثانوية 500. إذا كان جهد الدخل 220V، احسب جهد الخرج.'
            }]
          },
        ]
      },
      {
        id: 'u12-2',
        title: 'الوحدة 2: الفيزياء الحديثة',
        description: 'النسبية الخاصة، الكم، والتأثير الكهروضوئي.',
        lessons: [
          { 
            id: 'l12-2-1', 
            title: 'مقدمة في النسبية الخاصة', 
            type: 'THEORY', 
            duration: '20 د', 
            content: [{
              type: 'text',
              content: 'مبدأي أينشتاين، تمدد الزمن وتقلص الطول.'
            }],
            bookReference: 'ص. 150' 
          },
          { 
            id: 'l12-2-2', 
            title: 'الطبيعة الكمومية للضوء', 
            type: 'THEORY', 
            duration: '18 د', 
            content: [{
              type: 'text',
              content: 'مفهوم تكميم الطاقة. طاقة الفوتون: $$ E = hf $$'
            }]
          },
        ]
      }
    ]
  },
   {
    grade: '12',
    subject: 'Chemistry',
    title: "منهج الكيمياء - الصف الثاني عشر",
    description: "منهج الكيمياء المتقدم للفرع العلمي، يغطي الكيمياء العضوية والتحليلية والكيمياء الحيوية.",
    icon: '🧪',
    units: [
      {
        id: 'u12-chem-1',
        title: 'الوحدة 1: الكيمياء العضوية',
        description: 'الهيدروكربونات، الكحولات، والألدهيدات.',
        lessons: [
          { 
            id: 'l12-chem-1-1', 
            title: 'تسمية الألكانات', 
            type: 'THEORY', 
            duration: '25 د', 
            content: [{
              type: 'text',
              content: 'تعتمد تسمية الألكانات على عدد ذرات الكربون في أطول سلسلة مستمرة. مثال: الميثان ($CH_4$)، الإيثان ($C_2H_6$).'
            }],
            bookReference: 'ص. 95' 
          },
        ]
      },
      {
        id: 'u12-chem-2',
        title: 'الوحدة 2: الكيمياء التحليلية',
        description: 'المعايرة، التحليل الحجمي، والتحليل الوزني.',
        lessons: [
          { 
            id: 'l12-chem-2-1', 
            title: 'مبدأ المعايرة (Titration)', 
            type: 'THEORY', 
            duration: '20 د', 
            content: [{
              type: 'text',
              content: 'المعايرة هي تقنية مخبرية تستخدم لتحديد تركيز محلول غير معروف (المحلل) باستخدام محلول آخر معروف التركيز (الكاشف القياسي).\n$$ M_1V_1 = M_2V_2 $$'
            }],
            bookReference: 'ص. 180' 
          },
        ]
      }
    ]
  },
  {
    grade: '11',
    subject: 'Physics',
    title: "منهج الفيزياء - الصف الحادي عشر",
    description: "أساسيات الميكانيكا الكلاسيكية والكهرباء.",
    icon: '⚡',
    units: []
  },
  {
    grade: '10',
    subject: 'Physics',
    title: "منهج الفيزياء - الصف العاشر",
    description: "مقدمة في الفيزياء، القياس، والمتجهات.",
    icon: '📏',
    units: []
  }
];

export const PHYSICS_TOPICS = CURRICULUM_DATA;


// --- 2. Exams System Data ---
export const ANSWERS_DB: Answer[] = [
    { id: 'ans-1-1', text: 'زيادة عدد اللفات' }, { id: 'ans-1-2', text: 'تقليل شدة المجال المغناطيسي' }, { id: 'ans-1-3', text: 'إبطاء حركة المغناطيس' },
    { id: 'ans-2-1', text: 'تمدد الزمن' }, { id: 'ans-2-2', text: 'تقلص الطول' }, { id: 'ans-2-3', text: 'ثبات سرعة الضوء في الفراغ' },
    { id: 'ans-3-1', text: '10 جول' }, { id: 'ans-3-2', text: '25 جول' }, { id: 'ans-3-3', text: '50 جول' },
];

// FIX: Use `choices` and `correctChoiceId` to match the `Question` type definition.
export const QUESTIONS_DB: Question[] = [
    { 
      id: 'q-1', 
      text: 'أي من التالي يزيد من القوة الدافعة الحثية المتولدة في ملف؟', 
      type: 'mcq', 
      choices: ANSWERS_DB.slice(0, 3),
      correctChoiceId: 'ans-1-1',
      isVerified: true,
      difficulty: 'Easy',
      unit: 'الكهرومغناطيسية',
      grade: '12',
      category: 'الحث',
      subject: 'Physics',
      score: 1,
      solution: 'وفقاً لقانون فاراداي، القوة الدافعة الحثية تتناسب طرداً مع عدد اللفات (N) ومعدل تغير التدفق المغناطيسي. زيادة عدد اللفات تزيد من القوة الدافعة الحثية.',
      steps_array: [
        'نستدعي قانون فاراداي للحث: $$\\varepsilon = -N \\frac{\\Delta \\Phi_B}{\\Delta t}$$',
        'نلاحظ أن القوة الدافعة $$\\varepsilon$$ تتناسب طرداً مع عدد اللفات N.',
        'لذلك، زيادة عدد اللفات تؤدي إلى زيادة القوة الدافعة الحثية.'
      ],
      common_errors: [
        'الخلط بين شدة المجال ومعدل تغير التدفق.',
        'الاعتقاد بأن إبطاء الحركة يزيد من زمن التغير وبالتالي يزيد القوة (العكس هو الصحيح).'
      ],
    },
    { 
      id: 'q-2', 
      text: 'ما هو أحد مبادئ أينشتاين في النظرية النسبية الخاصة؟', 
      type: 'mcq', 
      choices: ANSWERS_DB.slice(3, 6),
      correctChoiceId: 'ans-2-3',
      isVerified: false,
      difficulty: 'Medium',
      unit: 'الفيزياء الحديثة',
      grade: '12',
      category: 'النسبية',
      subject: 'Physics',
      score: 1,
      solution: 'ينص المبدأ الثاني للنسبية الخاصة على أن سرعة الضوء في الفراغ لها نفس القيمة لجميع المراقبين بغض النظر عن حركتهم.',
    },
    { 
      id: 'q-3-11', 
      text: 'جسم كتلته 2kg يتحرك بسرعة 5m/s. ما هي طاقته الحركية؟', 
      type: 'mcq', 
      choices: ANSWERS_DB.slice(6, 9),
      correctChoiceId: 'ans-3-2',
      isVerified: true,
      difficulty: 'Easy',
      unit: 'الميكانيكا',
      grade: '11',
      category: 'الطاقة',
      subject: 'Physics',
      score: 1,
      solution: 'الطاقة الحركية (KE) تحسب من العلاقة $$K = \\frac{1}{2}mv^2$$. بالتعويض، نجد أن $$K = \\frac{1}{2} \\times 2 \\times 5^2 = 25$$ جول.',
      common_errors: ['نسيان تربيع السرعة.'],
    },
    { 
      id: 'q-4-10', 
      text: 'ما هي وحدة قياس القوة في النظام الدولي للوحدات (SI)؟', 
      type: 'short_answer', 
      choices: [], // Short answer has no predefined answers
      modelAnswer: 'النيوتن', // For short answer, this might be the string to match
      isVerified: true,
      difficulty: 'Easy',
      unit: 'القياس',
      grade: '10',
      category: 'أساسيات',
      subject: 'Physics',
      score: 1,
      solution: 'وحدة قياس القوة هي النيوتن (N)، وتكريماً للعالم إسحاق نيوتن.',
    },
    {
      id: 'q-10-1',
      text: 'ما هي الوحدة الأساسية لقياس الطول في النظام الدولي (SI)?',
      type: 'mcq',
      choices: [
          { id: 'ans-10-1-1', text: 'السنتيمتر' },
          { id: 'ans-10-1-2', text: 'المتر' },
          { id: 'ans-10-1-3', text: 'الكيلومتر' },
      ],
      correctChoiceId: 'ans-10-1-2',
      score: 2,
      grade: '10',
      subject: 'Physics',
      unit: 'القياس',
      difficulty: 'Easy',
      isVerified: true,
    },
    {
        id: 'q-10-2',
        text: 'عرّف الكمية المتجهة مع ذكر مثال واحد.',
        type: 'short_answer',
        modelAnswer: 'الكمية المتجهة هي كمية فيزيائية لها مقدار واتجاه. مثال: السرعة, القوة, الإزاحة.',
        score: 3,
        grade: '10',
        subject: 'Physics',
        unit: 'المتجهات',
        difficulty: 'Medium',
        isVerified: true,
    },
    {
        id: 'q-10-3',
        text: 'ارسم مخطط الجسم الحر لكرة معلقة بحبل في حالة سكون, موضحاً عليه جميع القوى المؤثرة.',
        type: 'file_upload',
        score: 5,
        grade: '10',
        subject: 'Physics',
        unit: 'القوى',
        difficulty: 'Medium',
        isVerified: true,
    }
];

// FIX: Removed `unitId` as it's not a property of the `Quiz` type.
export const QUIZZES_DB: Quiz[] = [
  { id: 'quiz-1', title: 'اختبار سريع في الحث الكهرومغناطيسي', grade: '12', subject: 'Physics', questionIds: ['q-1'], duration: 5, totalScore: 1 },
  { id: 'quiz-2', title: 'اختبار مبادئ الفيزياء الحديثة', grade: '12', subject: 'Physics', questionIds: ['q-2'], duration: 5, totalScore: 1 },
  { 
    id: 'quiz-3-10', 
    title: 'اختبار تأسيسي في أساسيات الفيزياء', 
    description: 'اختبار يغطي الوحدات والمتجهات والقوى للصف العاشر.',
    grade: '10', 
    subject: 'Physics', 
    questionIds: ['q-10-1', 'q-10-2', 'q-10-3', 'q-4-10'], 
    duration: 20, 
    totalScore: 11,
    maxAttempts: 2, 
    isPremium: false 
  }
];

// --- 3. Financial System Data ---
export const SUBSCRIPTION_PLANS: SubscriptionPlan[] = [
  {
    id: 'plan_premium',
    name: 'باقة التفوق (Premium)',
    price: 35000,
    duration: 'term',
    features: ['الوصول لجميع الدروس والفيديوهات', 'بنك الأسئلة الشامل', 'المساعد الذكي (AI Tutor)', 'اختبارات تجريبية غير محدودة', 'شهادات إنجاز رقمية'],
    recommended: true,
    tier: 'premium'
  },
  {
    id: 'plan_basic',
    name: 'الباقة الأساسية',
    price: 15000,
    duration: 'monthly',
    features: ['الوصول لدروس الوحدة الأولى فقط', 'اختبارات محدودة', 'دعم فني عبر المنتدى'],
    tier: 'free'
  }
];

export const PRICING_PLANS = SUBSCRIPTION_PLANS;

// --- 4. Gamification ---
export const CHALLENGES_DB: Challenge[] = [
  { id: 'ch-1', title: 'ماراثون الكهرومغناطيسية', description: 'أجب على 10 أسئلة متتالية بأسرع وقت ممكن.', type: 'quiz', reward: 250, isCompleted: false },
  { id: 'ch-2', title: 'سباق النسبية', description: 'أكمل درس "النسبية الخاصة" في أقل من 15 دقيقة.', type: 'speed_run', reward: 150, isCompleted: true }
];

export const LEADERBOARD_DATA: LeaderboardEntry[] = [
  { rank: 1, name: 'محمد الأحمد', points: 8500, isCurrentUser: false },
  { rank: 2, name: 'فاطمة الزهراء', points: 7800, isCurrentUser: false },
  { rank: 3, name: 'أنت', points: 7500, isCurrentUser: true },
  { rank: 4, name: 'علي مصطفى', points: 7100, isCurrentUser: false },
];

// --- 5. Social Learning ---
export const STUDY_GOALS_DB: StudyGoal[] = [
  { id: 'goal-1', title: 'إتقان الوحدة الأولى (الكهرومغناطيسية)', participantCount: 125, progress: 65 },
  { id: 'goal-2', title: 'حل 100 مسألة فيزياء حديثة', participantCount: 88, progress: 40 }
];

// --- 6. New Mock Data ---

export const MOCK_ARTICLES: Article[] = [
    { id: 'art-1', category: 'الفيزياء الفلكية', title: 'أسرار الثقوب السوداء', summary: 'استكشاف كيف تتحدى الثقوب السوداء فهمنا للزمان والمكان.', imageUrl: 'https://images.unsplash.com/photo-1534796636912-3b95b3ab5986?q=80&w=2071&auto=format&fit=crop', readTime: '12 دقيقة', content: '### مقدمة\nالثقوب السوداء هي مناطق في الزمكان تتميز بجاذبية قوية جدًا بحيث لا يمكن لأي شيء، حتى الضوء، الهروب منها. تتشكل من بقايا النجوم الضخمة التي انهارت تحت تأثير جاذبيتها الخاصة.\n\n$$ R_s = \\frac{2GM}{c^2} $$\n\nيمثل $R_s$ نصف قطر شفارتزشيلد، وهو نصف القطر الذي يجب أن ينضغط إليه أي جسم ليصبح ثقبًا أسود.' },
];

export const MOCK_STUDY_GROUPS: StudyGroup[] = [
    { id: 'sg-1', name: 'خلية نيوتن', level: '12', membersCount: 8, activeChallenge: 'حل 20 مسألة في الحركة' },
    { id: 'sg-2', name: 'فريق أينشتاين', level: '11', membersCount: 5, activeChallenge: 'مراجعة الوحدة الثانية' },
];

export const INITIAL_EXPERIMENTS: PhysicsExperiment[] = [
    { id: 'exp-ohm', title: 'مختبر قانون أوم', description: 'تحكم في الجهد والمقاومة ولاحظ تأثيرها على التيار الكهربائي.', thumbnail: '', isFutureLab: false, parameters: [{id: 'voltage', name: 'الجهد', min: 1, max: 20, step: 0.5, defaultValue: 5, unit: 'V'}, {id: 'resistance', name: 'المقاومة', min: 1, max: 100, step: 1, defaultValue: 10, unit: 'Ω'}] },
    { id: 'exp-fusion', title: 'محاكاة الاندماج النووي', description: 'تحكم في درجة الحرارة والضغط لتحقيق الاندماج النووي المستدام.', thumbnail: 'https://images.unsplash.com/photo-1634733591032-3a5e889b6a6c?q=80&w=2070&auto=format&fit=crop', isFutureLab: true, parameters: [{id: 'temp', name: 'الحرارة', min: 10, max: 200, step: 5, defaultValue: 100, unit: 'MK'}, {id: 'pressure', name: 'الضغط', min: 1, max: 50, step: 1, defaultValue: 20, unit: 'GPa'}] },
];

export const MOCK_EQUATIONS: PhysicsEquation[] = [
    { id: 'eq-1', category: 'الميكانيكا', title: 'قانون نيوتن الثاني', latex: 'F = ma', variables: { F: 'القوة', m: 'الكتلة', a: 'التسارع' }, solveFor: 'a' },
    { id: 'eq-2', category: 'الطاقة', title: 'الطاقة الحركية', latex: 'K = \\frac{1}{2}mv^2', variables: { K: 'الطاقة الحركية', m: 'الكتلة', v: 'السرعة' } },
];
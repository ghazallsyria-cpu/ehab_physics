
import { Curriculum, Quiz, Question, SubscriptionPlan, EducationalResource, Article, StudyGroup, PhysicsExperiment, PhysicsEquation } from './types';

// كافة البيانات تم نقلها لقاعدة البيانات Firestore
export const CURRICULUM_DATA: Curriculum[] = [];
export const PHYSICS_TOPICS = CURRICULUM_DATA;
export const ANSWERS_DB: any[] = [];
export const QUESTIONS_DB: Question[] = [];
export const QUIZZES_DB: Quiz[] = [];
export const MOCK_RESOURCES: EducationalResource[] = [];
export const MOCK_ARTICLES: Article[] = [];
export const MOCK_STUDY_GROUPS: StudyGroup[] = [];
export const INITIAL_EXPERIMENTS: PhysicsExperiment[] = [];
export const MOCK_EQUATIONS: PhysicsEquation[] = [];

export const SUBSCRIPTION_PLANS: SubscriptionPlan[] = [
  {
    id: 'plan_premium',
    name: 'باقة التفوق (Premium)',
    price: 35,
    duration: 'term',
    features: ['وصول كامل للمنهج', 'بنك الأسئلة الذكي', 'المختبرات المتقدمة', 'شهادات معتمدة'],
    recommended: true,
    tier: 'premium'
  },
  {
    id: 'plan_basic',
    name: 'الباقة الأساسية',
    price: 15,
    duration: 'monthly',
    features: ['دروس الوحدة الأولى', 'اختبارات محدودة'],
    tier: 'free'
  }
];

export const PRICING_PLANS = SUBSCRIPTION_PLANS;

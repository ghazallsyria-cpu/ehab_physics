
export type UserRole = 'student' | 'teacher' | 'admin' | 'parent';
export type ViewState = 'landing' | 'dashboard' | 'lessons' | 'exams' | 'certificates' | 'billing' | 'physics-journey' | 'course-content' | 'exam-center' | 'course-catalog' | 'question-bank' | 'bank-digitizer' | 'progress-report' | 'live-sessions' | 'performance-analysis' | 'study-groups' | 'todo-list' | 'parent-portal' | 'subscription-plans' | 'beta-feedback' | 'behavioral-insights' | 'audit-center' | 'payment-result' | 'privacy-policy' | 'payment-certificate' | 'teacher-join' | 'university-bridge' | 'library' | 'ai-chat' | 'physics-veo' | 'physics-solver' | 'equation-solver' | 'physics-game' | 'ar-lab' | 'future-labs' | 'virtual-lab' | 'scientific-articles' | 'physics-image-gen' | 'teachers' | 'forum';

export type SubjectType = 'Physics' | 'Math' | 'Chemistry' | 'English';
export type BranchType = 'Scientific' | 'Literary' | 'Foundation';
export type PaymentStatus = 'PAID' | 'PENDING' | 'CANCELLED' | 'FAILED' | 'OVERDUE';
export type Term = 'TERM_1' | 'TERM_2';
export type LessonType = 'THEORY' | 'EXAMPLE' | 'EXERCISE' | 'QUIZ';

export interface StudentProgress {
  completedLessonIds: string[];
  quizScores: Record<string, number>;
  totalStudyHours: number;
  currentFatigue: number;
  strengths?: string[];
  weaknesses?: string[];
  lastActivity?: string;
}

export interface User {
  uid: string;
  name: string;
  email: string;
  phone?: string;
  role: UserRole;
  grade: string;
  status: 'active' | 'suspended' | 'beta' | 'banned'; // Added banned
  createdAt: string;
  photoURL?: string;
  linkedStudentUids?: string[]; // للآباء
  parentUid?: string; // للطلاب
  progress: StudentProgress;
  points?: number;
  stage?: string;
  educationalLevel?: EducationalLevel;
  subscription: 'free' | 'monthly' | 'term' | 'yearly' | 'premium' | 'university';
  subscriptionExpiry?: string;
  completedLessonIds: string[]; 
  weeklyReports?: WeeklyReport[];
  school?: string; // Added school
  adminNotes?: string; // Added admin notes
}

export type TeacherPermission = 'create_content' | 'reply_messages' | 'view_analytics' | 'manage_exams';

export interface TeacherProfile {
  id: string;
  name: string;
  specialization: string;
  bio: string;
  avatar: string; // Emoji fallback
  photoUrl?: string; // Real photo
  yearsExperience: number;
  grades: string[]; // ['10', '11', '12', 'uni']
  status: 'active' | 'suspended'; // تجميد/تنشيط
  jobTitle?: string; // اللقب الوظيفي
  permissions: TeacherPermission[]; // الصلاحيات
}

export interface TeacherMessage {
  id: string;
  studentId: string;
  studentName: string;
  teacherId: string;
  teacherName: string;
  content: string;
  timestamp: string;
  isRedacted: boolean; // Flag if system redacted phone numbers
}

export interface Review {
  id: string;
  teacherId: string;
  studentName: string;
  rating: number; // 1-5
  comment: string;
  timestamp: string;
}

export interface Testimonial {
  id: string;
  name: string;
  role: string;
  content: string;
  avatar: string;
  rating: number;
}

export interface AppNotification {
  id: string;
  title: string;
  message: string;
  type: 'success' | 'warning' | 'info' | 'error';
  timestamp: string;
  isRead: boolean;
  category: 'academic' | 'billing' | 'system';
}

export interface QuizAttempt { 
  id?: string; 
  userId: string; 
  quizId: string; 
  score: number; 
  maxScore: number; 
  timestamp: string; 
  timeSpent: number;
  attemptNumber: number;
  guessingDetected: boolean;
  remedialSuggested?: boolean;
}

export interface WeeklyReport { 
  week: string; 
  completedUnits: number; 
  hoursSpent: number; 
  scoreAverage: number; 
  improvementAreas: string[]; 
  parentNote?: string;
}

export enum EducationalLevel { SECONDARY = 'secondary', UNIVERSITY = 'university' }
export interface Message { role: 'user' | 'assistant'; content: string; timestamp: Date; thinking?: string; }

export interface Question {
  id: string;
  grade: string;
  subject: string;
  unit: string;
  question_text: string;
  type: 'mcq' | 'descriptive';
  difficulty: 'Easy' | 'Medium' | 'Hard';
  correct_answer: string;
  solution: string;
  score: number;
  choices?: { key: string; text: string }[];
  question_latex?: string;
  category?: string;
  steps_array?: string[];
  common_errors?: string[];
  branch?: BranchType;
  imageUrl?: string;
  hasDiagram?: boolean;
}

export interface Quiz {
  id: string;
  title: string;
  lessonId: string;
  duration: number;
  totalScore: number;
  maxAttempts: number;
  isPremium: boolean;
  minTimeRequired: number;
}

export interface Invoice { 
  id: string; 
  userId: string; 
  userName?: string; 
  amount: number; 
  status: PaymentStatus; 
  date: string; 
  trackId: string;
  planId: string;
  paymentId?: string;
  authCode?: string;
  bankName?: string;
}

export interface MiniQuiz {
  id: string;
  question: string;
  options: string[];
  correctIndex: number;
  explanation: string;
}

export interface Lesson {
  id: string;
  title: string;
  type: LessonType;
  videoUrl?: string;
  content: string;
  duration?: string;
  quiz?: MiniQuiz[];
  bookReference?: string; // e.g., "Student Book p.45"
}

export interface Unit {
  id: string;
  title: string;
  description?: string;
  lessons: Lesson[];
}

export interface PhysicsTopic {
  id: string;
  title: string;
  grade: string;
  icon: string;
  term: Term;
  units: Unit[]; // Changed from flat lessonDetails to nested Units
  description?: string;
  duration?: string;
  // Legacy support optional
  lessons?: number;
  lessonDetails?: Lesson[]; 
}

export interface PricingPlan {
  id: string;
  name: string;
  price: number;
  features: string[];
  tier: 'free' | 'monthly' | 'term' | 'yearly' | 'premium' | 'university';
  discount?: string;
  recommended?: boolean;
}

export interface Article {
  id: string;
  title: string;
  summary: string;
  content: string;
  imageUrl: string;
  category: string;
  readTime: string;
}

export interface PhysicsEquation {
  id: string;
  title: string;
  latex: string;
  variables: Record<string, string>;
  category: string;
  solveFor?: string;
}

export interface AISolverResult {
  law: string;
  steps: string[];
  finalResult: string;
  explanation: string;
}

export interface BetaConfig {
  isActive: boolean;
  invitationCode: string;
  studentLimit: number;
}

export interface AnalyticsSummary {
  totalStudents: number;
  activeNow: number;
  averageScore: number;
  revenueThisMonth: number;
  betaMetrics: {
    invitationsUsed: number;
    avgAiLatency: number;
    errorRate: number;
    completionRate: number;
    dau: number;
    aiCalls: number;
  };
  conceptualHotspots: { topic: string; failureRate: number }[];
}

export interface RemedialTrigger {
  id: string;
  reason: string;
  suggestedLessonId: string;
}

export interface CloudLog {
  id: string;
  timestamp: string;
  level: 'info' | 'warn' | 'error';
  message: string;
}

export interface ForumPost {
  id: string;
  authorEmail: string;
  authorName: string;
  title: string;
  content: string;
  tags: string[];
  timestamp: string;
  upvotes: number;
  replies?: ForumReply[];
}

export interface ForumReply {
  id: string;
  authorEmail: string;
  authorName: string;
  content: string;
  role: UserRole;
  timestamp: string;
  upvotes: number;
}

export interface LiveSession {
  id: string;
  title: string;
  teacherName: string;
  startTime: string;
  status: 'live' | 'upcoming';
  topic: string;
}

export interface PredictiveInsight {
  topicId: string;
  topicTitle: string;
  probabilityOfDifficulty: number;
  reasoning: string;
  suggestedPrep: string;
}

export interface ExperimentParameter {
  id: string;
  name: string;
  min: number;
  max: number;
  step: number;
  defaultValue: number;
  unit: string;
}

export interface PhysicsExperiment {
  id: string;
  title: string;
  description: string;
  thumbnail: string;
  parameters: ExperimentParameter[];
  isFutureLab?: boolean;
}

export interface SavedExperiment {
  id: string;
  experimentId: string;
  experimentTitle: string;
  timestamp: string;
  params: Record<string, number>;
  result: number;
}

export interface StudyGroup {
  id: string;
  name: string;
  level: string;
  membersCount: number;
  activeChallenge: string;
}

export interface EducationalResource {
  id: string;
  title: string;
  type: 'summary' | 'exam' | 'worksheet' | 'book';
  grade: '10' | '11' | '12' | 'uni';
  term: '1' | '2';
  year: string;
  size: string;
  url?: string;
  uploadDate: string;
  downloadCount: number;
}
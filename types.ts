
export type UserRole = 'student' | 'teacher' | 'admin' | 'parent';
export type ViewState = 'landing' | 'auth' | 'dashboard' | 'curriculum' | 'quiz_center' | 'discussions' | 'subscription' | 'lesson' | 'quiz_player' | 'privacy-policy' | 'ai-chat' | 'recommendations' | 'virtual-lab' | 'live-sessions' | 'reports' | 'help-center' | 'admin-curriculum' | 'admin-students' | 'admin-teachers' | 'admin-financials' | 'quiz-performance' | 'admin-settings' | 'journey-map' | 'payment-certificate' | 'admin-live-sessions' | 'admin-quizzes' | 'attempt_review' | 'admin-content' | 'admin-assets' | 'admin-parents' | 'admin-videos' | 'admin-quiz-attempts' | 'admin-certificates' | 'admin-reviews' | 'admin-pricing' | 'admin-subscriptions' | 'admin-payments-log' | 'admin-payment-settings' | 'admin-email-notifications' | 'admin-internal-messages' | 'admin-forums' | 'admin-forum-posts' | 'admin-security-fix' | 'verify-certificate' | 'resources-center' | 'admin-managers' | 'admin-payment-manager' | 'admin-labs' | 'admin-recommendations';

export interface MaintenanceSettings {
    isMaintenanceActive: boolean;
    expectedReturnTime: string; // ISO String
    maintenanceMessage: string;
    showCountdown: boolean;
    allowTeachers: boolean;
}

export interface AppBranding {
    logoUrl: string;
    appName: string;
    primaryColor?: string;
}

export interface User {
  uid: string;
  name: string;
  email: string;
  phone?: string; 
  gender?: 'male' | 'female';
  role: UserRole;
  grade: '10' | '11' | '12' | 'uni';
  subscription: 'free' | 'premium';
  createdAt: string;
  progress: {
    completedLessonIds: string[];
    points: number;
    achievements?: string[];
    strengths?: string[];
    weaknesses?: string[];
    lastActivity?: string;
  };
  status?: 'active' | 'suspended';
  jobTitle?: string;
  photoURL?: string;
  avatar?: string;
  specialization?: string;
  gradesTaught?: string[];
  yearsExperience?: number;
  bio?: string;
  lastSeen?: string;
  activityLog?: Record<string, number>;
  linkedStudentUids?: string[];
  permissions?: TeacherPermission[];
  weeklyReports?: WeeklyReport[];
}

export type TeacherPermission = 'create_content' | 'reply_messages' | 'view_analytics' | 'manage_exams';

export interface WeeklyReport {
    week: string;
    completedUnits: number;
    hoursSpent: number;
    scoreAverage: number;
    improvementAreas: string[];
    parentNote?: string;
}

export interface Invoice {
    id: string;
    userId: string;
    userName: string;
    planId: string;
    amount: number;
    date: string;
    status: PaymentStatus;
    trackId: string;
    paymentId?: string;
    authCode?: string;
}

export type PaymentStatus = 'PENDING' | 'PAID' | 'FAIL';

export interface SubscriptionPlan {
  id: string;
  name: string;
  price: number;
  duration: 'monthly' | 'term' | 'yearly';
  features: string[];
  recommended?: boolean;
  tier: 'free' | 'premium';
}

export interface ContentBlock {
  type: ContentBlockType;
  content: string; 
  caption?: string;
}

export type ContentBlockType = 'text' | 'image' | 'video' | 'pdf' | 'youtube' | 'audio' | 'html';

export interface Unit {
  id: string;
  title: string;
  description: string;
  lessons: Lesson[];
}

export interface Lesson {
  id: string;
  title: string;
  content: ContentBlock[];
  type: 'THEORY' | 'EXAMPLE' | 'EXERCISE';
  duration: string;
  bookReference?: string;
  aiGeneratedData?: AILessonSchema; // ربط مع المخطط الذكي
}

// --- AI Lesson Schema (Strict Academic Constraints) ---
export interface AILessonSchema {
  lesson_metadata: {
    grade: string;
    subject: string;
    lesson_title: string;
    unit: string;
    source_page_id?: string;
    status: 'draft' | 'approved' | 'locked';
    version: number;
  };
  learning_objectives: string[];
  content_blocks: AIContentBlock[];
  formulae?: { formula_text: string; variables: string[] }[];
  student_interaction_tracking?: any;
}

export interface AIContentBlock {
  block_id: string;
  block_type: 'intro' | 'simulation' | 'discovery' | 'challenge' | 'assessment' | 'note';
  locked_after_approval: boolean;
  linked_concept: string;
  ui_component: {
    component_category: 'visual' | 'input' | 'interactive';
    react_component?: string;
    allowed_variables?: string[];
    fixed_assumptions?: string[];
  };
  student_actions?: string[];
  feedback_logic?: {
    on_correct: string;
    on_incorrect: string;
  };
  textContent?: string; // For mapping to legacy ContentBlock
}
// -----------------------------------------------------

export interface Curriculum {
  id?: string; 
  grade: '10' | '11' | '12';
  subject: SubjectType;
  title: string;
  description: string;
  icon: string;
  units: Unit[];
  duration?: string;
}

export interface InvoiceSettings {
    headerText: string;
    footerText: string;
    accentColor: string;
    showSignature: boolean;
    signatureName: string;
    showWatermark: boolean;
    watermarkText: string;
}

export interface LoggingSettings {
    logStudentProgress: boolean;
    saveAllQuizAttempts: boolean;
    logAIChatHistory: boolean;
    archiveTeacherMessages: boolean;
    forumAccessTier: 'free' | 'premium';
}

export interface ForumSection {
    id: string;
    title: string;
    description: string;
    forums: Forum[];
    order: number;
}

export interface Forum {
    id: string;
    title: string;
    description: string;
    icon: string;
    imageUrl?: string;
    order: number;
    moderatorUid?: string;
    moderatorName?: string;
}

export interface ForumPost {
    id: string;
    authorUid: string;
    authorEmail: string;
    authorName: string;
    title: string;
    content: string;
    tags: string[];
    timestamp: string;
    upvotes: number;
    isPinned?: boolean;
    replies?: ForumReply[];
    isEscalated?: boolean; 
}

export interface ForumReply {
    id: string;
    authorUid: string;
    authorEmail: string;
    authorName: string;
    content: string;
    role: UserRole;
    timestamp: string;
    upvotes: number;
}

export interface EducationalResource {
    id: string;
    grade: '10' | '11' | '12' | 'uni';
    type: 'summary' | 'exam' | 'worksheet' | 'book';
    title: string;
    size: string;
    year: number;
    term: '1' | '2';
    downloadCount: number;
    url: string;
}

export interface AppNotification {
    id: string;
    userId: string;
    title: string;
    message: string;
    timestamp: string;
    isRead: boolean;
    type?: 'success' | 'warning' | 'info';
    category: 'academic' | 'general';
}

export interface PaymentSettings {
    isOnlinePaymentEnabled: boolean;
    womdaPhoneNumber: string;
    planPrices: {
        premium: number;
        basic: number;
    };
}

export type QuestionType = 'mcq' | 'short_answer' | 'essay' | 'file_upload';
export type SubjectType = 'Physics' | 'Chemistry' | 'Math' | 'English';
export type BranchType = 'Scientific' | 'Literary';

export interface Question {
  id: string;
  text: string;
  type: QuestionType;
  choices?: { id: string; text: string; key?: string }[];
  answers?: { id: string; text: string; key?: string }[]; // Added optional answers property
  correctChoiceId?: string;
  solution?: string;
  difficulty: 'Easy' | 'Medium' | 'Hard';
  subject: SubjectType;
  grade: '10' | '11' | '12' | 'uni';
  unit?: string;
  category?: string;
  score: number;
  isVerified?: boolean;
  question_latex?: string;
  hasDiagram?: boolean;
  modelAnswer?: string;
  imageUrl?: string;
  common_errors?: string[];
  steps_array?: string[];
}

export interface Quiz {
  id: string;
  title: string;
  description?: string;
  grade: '10' | '11' | '12' | 'uni';
  subject: SubjectType;
  category: string;
  questionIds: string[];
  duration: number; 
  totalScore: number;
  isPremium: boolean;
  maxAttempts?: number;
}

export interface StudentQuizAttempt {
  id: string;
  studentId: string;
  studentName: string;
  quizId: string;
  score: number;
  totalQuestions: number;
  maxScore: number;
  completedAt: string;
  answers: Record<string, any>;
  timeSpent: number; 
  attemptNumber: number;
  status: 'pending-review' | 'manually-graded' | 'auto-graded';
  manualGrades?: Record<string, { awardedScore: number; feedback?: string }>;
}

export interface AISolverResult {
  law: string;
  steps: string[];
  finalResult: string;
  explanation: string;
}

export interface PredictiveInsight {
  topicId: string;
  topicTitle: string;
  probabilityOfDifficulty: number;
  reasoning: string;
  suggestedPrep: string;
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

export interface StudyGroup {
  id: string;
  name: string;
  level: string;
  membersCount: number;
  activeChallenge: string;
}

export interface PhysicsExperiment {
  id: string;
  title: string;
  description: string;
  thumbnail: string;
  grade: string;
  isFutureLab?: boolean;
  type: 'CUSTOM_HTML' | 'INTEGRATED';
  customHtml?: string;
  parameters?: {
    id: string;
    name: string;
    min: number;
    max: number;
    step: number;
    defaultValue: number;
    unit: string;
  }[];
}

export interface PhysicsEquation {
  id: string;
  title: string;
  latex: string;
  variables: Record<string, string>;
  category: string;
  solveFor?: string;
}

export interface SavedExperiment {
  id: string;
  experimentId: string;
  experimentTitle: string;
  timestamp: string;
  params: Record<string, number>;
  result: number;
}

export interface Todo {
  id: string;
  text: string;
  completed: boolean;
  category: 'Study' | 'Exam' | 'Lab' | 'Review' | 'Homework';
  createdAt: number;
  dueDate?: string;
}

export interface TeacherMessage {
  id: string;
  studentId: string;
  studentName: string;
  teacherId: string;
  teacherName: string;
  content: string;
  timestamp: string;
  isRedacted: boolean;
}

export interface Review {
  id: string;
  teacherId: string;
  studentName: string;
  rating: number;
  comment: string;
  timestamp: string;
}

export type ContentPlacement = 'TOP_BANNER' | 'GRID_CARD' | 'SIDEBAR_WIDGET' | 'MODAL_POPUP';

export interface HomePageContent {
  id: string;
  title: string;
  content: string;
  type: 'news' | 'alert' | 'announcement' | 'image' | 'carousel';
  placement: ContentPlacement; 
  priority: 'normal' | 'high';
  imageUrl?: string;
  ctaText?: string;
  ctaLink?: string;
  createdAt: string;
}

export interface Asset {
  name: string;
  url: string;
  type: string;
  size: number;
}

export interface SubscriptionCode {
  id: string;
  code: string;
  status: 'active' | 'used' | 'expired';
  tier: 'premium';
}

export interface NotificationSettings {
  pushForLiveSessions: boolean;
  pushForGradedQuizzes: boolean;
  pushForAdminAlerts: boolean;
}

export interface AIRecommendation {
  id: string;
  title: string;
  reason: string;
  type: 'lesson' | 'quiz' | 'challenge' | 'discussion';
  targetId: string;
  urgency: 'high' | 'medium' | 'low';
  targetGrade?: string;
  targetUserEmail?: string;
  createdAt: string;
}

export interface LiveSession {
  id: string;
  title: string;
  teacherName: string;
  startTime: string;
  status: 'upcoming' | 'live';
  topic: string;
  platform: 'zoom' | 'youtube' | 'other';
  streamUrl: string;
  meetingId?: string;
  passcode?: string;
  targetGrades?: string[];
  isPremium: boolean;
}

export interface Message {
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  thinking?: string | null;
}

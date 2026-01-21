
export type UserRole = 'student' | 'teacher' | 'admin' | 'parent';
export type ViewState = 'landing' | 'dashboard' | 'curriculum' | 'quiz_center' | 'discussions' | 'subscription' | 'lesson' | 'quiz_player' | 'privacy-policy' | 'ai-chat' | 'recommendations' | 'virtual-lab' | 'live-sessions' | 'reports' | 'help-center' | 'admin-curriculum' | 'admin-students' | 'admin-teachers' | 'admin-financials' | 'quiz-performance' | 'admin-settings' | 'journey-map' | 'payment-certificate' | 'admin-live-sessions' | 'admin-quizzes' | 'attempt_review' | 'admin-content' | 'admin-assets' | 'admin-parents' | 'admin-videos' | 'admin-quiz-attempts' | 'admin-certificates' | 'admin-reviews' | 'admin-pricing' | 'admin-subscriptions' | 'admin-payments-log' | 'admin-payment-settings' | 'admin-email-notifications' | 'admin-internal-messages' | 'admin-forums' | 'verify-certificate';

// --- 0. AI & Chat ---
export interface Message {
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  thinking?: string;
}

export interface AISolverResult {
  law: string;
  steps: string[];
  finalResult: string;
  explanation: string;
}

export interface AIRecommendation {
  id: string;
  title: string;
  reason: string;
  type: 'lesson' | 'quiz' | 'challenge' | 'discussion';
  targetId: string; 
  urgency: 'high' | 'medium' | 'low';
}

export interface PredictiveInsight {
    topicId: string;
    topicTitle: string;
    probabilityOfDifficulty: number;
    reasoning: string;
    suggestedPrep: string;
}

// --- 1. Educational Content ---
export type ContentBlockType = 'text' | 'image' | 'video' | 'pdf' | 'youtube' | 'audio';
export type SubjectType = 'Physics' | 'Chemistry' | 'Math' | 'English';
export type BranchType = 'Scientific' | 'Literary';

export interface ContentBlock {
  type: ContentBlockType;
  content: string; 
  caption?: string;
}

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
}

export interface Curriculum {
  id?: string; 
  grade: '10' | '11' | '12';
  subject: 'Physics' | 'Chemistry';
  title: string;
  description: string;
  icon: string;
  units: Unit[];
  duration?: string;
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

export interface Article {
  id: string;
  category: string;
  title: string;
  summary: string;
  imageUrl: string;
  readTime: string;
  content: string;
}

// --- 2. Exams System ---
export interface Answer {
  id: string;
  text: string;
  key?: string; // For A, B, C style keys
}

export type QuestionType = 'mcq' | 'short_answer' | 'essay' | 'file_upload';
export type QuestionDifficulty = 'Easy' | 'Medium' | 'Hard';

export interface Question {
  id: string;
  text: string;
  question_text?: string; // for gemini backward compatibility
  type: QuestionType;
  choices?: Answer[];
  answers?: Answer[]; // for backward compatibility
  correctChoiceId?: string;
  correct_answer?: string; // for gemini
  modelAnswer?: string;
  score: number;
  grade: '10' | '11' | '12' | 'uni';
  subject: SubjectType;
  unit: string;
  difficulty: QuestionDifficulty;
  isVerified: boolean;
  solution?: string;
  steps_array?: string[];
  common_errors?: string[];
  category?: string;
  imageUrl?: string;
  question_latex?: string;
  hasDiagram?: boolean;
}

export interface Quiz {
  id: string;
  title: string;
  description?: string;
  category?: string;
  grade: '10' | '11' | '12' | 'uni';
  subject: SubjectType;
  questionIds: string[];
  duration: number; // in minutes
  totalScore: number;
  maxAttempts?: number;
  isPremium?: boolean;
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
    answers: Record<string, any>; // questionId -> answerId or text
    timeSpent: number; // in seconds
    attemptNumber: number;
    status: 'pending-review' | 'manually-graded' | 'auto-graded';
    manualGrades?: Record<string, { awardedScore: number; feedback?: string }>;
}
export type QuizAttempt = StudentQuizAttempt; // Alias for compatibility


// --- 3. User & System Management ---

export type TeacherPermission = 'create_content' | 'reply_messages' | 'view_analytics' | 'manage_exams';

export interface WeeklyReport {
    week: string;
    completedUnits: number;
    hoursSpent: number;
    scoreAverage: number;
    improvementAreas: string[];
    parentNote?: string;
}

export interface User {
  uid: string;
  name: string;
  email: string;
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
  jobTitle?: string; // For admin/teacher
  photoURL?: string;
  avatar?: string;
  specialization?: string;
  gradesTaught?: string[];
  yearsExperience?: number;
  bio?: string;
  lastSeen?: string;
  activityLog?: Record<string, number>; // date -> minutes
  linkedStudentUids?: string[]; // for parents
  permissions?: TeacherPermission[]; // for teachers
  weeklyReports?: WeeklyReport[];
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

export interface Todo {
    id: string;
    text: string;
    completed: boolean;
    category: 'Study' | 'Homework' | 'Exam' | 'Lab' | 'Review';
    createdAt: number; // timestamp
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

export interface HomePageContent {
    id: string;
    type: 'news' | 'alert' | 'announcement' | 'image' | 'carousel';
    priority: 'normal' | 'high';
    title: string;
    content: string;
    createdAt: string;
    imageUrl?: string;
    ctaText?: string;
    ctaLink?: ViewState;
}

export interface Asset {
    name: string;
    url: string;
    type: string;
    size: number;
}


// --- 4. Financial System ---

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

export interface PaymentSettings {
    isOnlinePaymentEnabled: boolean;
}

export interface SubscriptionCode {
    id: string;
    code: string;
    planId: string;
    isUsed: boolean;
    createdAt: string;
    activatedAt: string | null;
    userId: string | null;
}


// --- 5. Community & Social ---

export interface Forum {
    id: string;
    title: string;
    description: string;
    icon: string; // emoji
    order: number;
}

export interface ForumSection {
    id: string;
    title: string;
    description: string;
    forums: Forum[];
    order: number;
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

export interface StudyGroup {
    id: string;
    name: string;
    level: '10' | '11' | '12';
    membersCount: number;
    activeChallenge: string;
}

// --- 6. Advanced Features (Labs, Sessions) ---

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
    isFutureLab: boolean;
    parameters: ExperimentParameter[];
}

export interface SavedExperiment {
    id: string;
    experimentId: string;
    experimentTitle: string;
    timestamp: string;
    params: Record<string, number>;
    result: number;
}

export interface PhysicsEquation {
    id: string;
    category: string;
    title: string;
    latex: string;
    variables: Record<string, string>;
    solveFor?: string;
}

export interface LiveSession {
    id: string;
    title: string;
    teacherName: string;
    startTime: string;
    status: 'upcoming' | 'live' | 'ended';
    topic: string;
    platform: 'zoom' | 'youtube' | 'other';
    streamUrl: string;
    meetingId?: string;
    passcode?: string;
    targetGrades?: ('10' | '11' | '12' | 'uni')[];
    isPremium?: boolean;
}

// --- 7. Certificates ---
export interface Certificate {
  id: string;
  studentUid: string;
  studentName: string;
  courseTitle: string;
  completionDate: string;
  issuedBy: string;
  templateId: string;
}

export interface CertificateTemplate {
    id: string;
    name: string;
    backgroundImageUrl: string;
    signatureImageUrl: string;
    primaryColor: string;
    isDefault: boolean;
}


// --- 8. Admin & System ---
export interface LoggingSettings {
    logStudentProgress: boolean;
    saveAllQuizAttempts: boolean;
    logAIChatHistory: boolean;
    archiveTeacherMessages: boolean;
}

export interface NotificationSettings {
  pushForLiveSessions: boolean;
  pushForGradedQuizzes: boolean;
  pushForAdminAlerts: boolean;
}



export type UserRole = 'student' | 'teacher' | 'admin' | 'parent';
export type ViewState = 'landing' | 'dashboard' | 'curriculum' | 'quiz_center' | 'discussions' | 'subscription' | 'lesson' | 'quiz_player' | 'privacy-policy' | 'ai-chat' | 'gamification' | 'recommendations' | 'virtual-lab' | 'live-sessions' | 'reports' | 'help-center' | 'admin-curriculum' | 'admin-students' | 'admin-teachers' | 'admin-questions' | 'admin-financials' | 'quiz-performance' | 'admin-settings' | 'journey-map' | 'payment-certificate';

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
  targetId: string; // ID of the lesson, quiz, etc.
  urgency: 'high' | 'medium' | 'low';
}

// --- 1. Educational Content ---
export type ContentBlockType = 'text' | 'image' | 'video' | 'pdf' | 'youtube' | 'audio';

export interface ContentBlock {
  type: ContentBlockType;
  content: string; // Markdown text, URL for image/video/pdf
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
  id?: string; // Added for journey map
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

// --- 2. Exams System ---
export interface Quiz {
  id: string;
  title: string;
  unitId: string;
  questionIds: string[];
  duration?: number;
  totalScore?: number;
  maxAttempts?: number;
  isPremium?: boolean;
  minTimeRequired?: number;
}

export type QuestionType = 'mcq' | 'short_answer' | 'essay';
export type QuestionDifficulty = 'Easy' | 'Medium' | 'Hard';
export type SubjectType = 'Physics' | 'Math' | 'Chemistry' | 'English';
export type BranchType = 'Scientific' | 'Literary';

export interface Question {
  id:string;
  text: string;
  type: QuestionType;
  answers: Answer[];
  correctAnswerId: string;
  // Properties for ExamCenter/QuestionBank
  score?: number;
  unit?: string;
  grade?: string;
  question_latex?: string;
  steps_array?: string[];
  common_errors?: string[];
  isVerified?: boolean;
  difficulty?: QuestionDifficulty;
  category?: string;
  subject?: SubjectType;
  branch?: BranchType;
  hasDiagram?: boolean;
  imageUrl?: string;
  solution?: string;
}

export interface Answer {
  id: string;
  text: string;
}

export interface StudentQuizAttempt {
  id: string;
  studentId: string;
  quizId: string;
  score: number;
  totalQuestions: number;
  completedAt: string;
  answers: Record<string, string>; // { questionId: selectedAnswerId }
  maxScore?: number;
  timeSpent?: number;
  attemptNumber?: number;
  guessingDetected?: boolean;
  timestamp?: string;
}

export type QuizAttempt = StudentQuizAttempt;

// --- 3. Financial System ---
export type PaymentStatus = 'PAID' | 'PENDING' | 'OVERDUE' | 'CANCELLED' | 'FAIL';

export interface SubscriptionPlan {
  id: string;
  name: string;
  price: number;
  duration: 'monthly' | 'term' | 'yearly';
  features: string[];
  recommended?: boolean;
  tier?: 'free' | 'premium';
}

export type PricingPlan = SubscriptionPlan;

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
  userId: string | null;
  createdAt: string;
  activatedAt: string | null;
}


// --- 4. User & Progress ---
export type EducationalLevel = 'SECONDARY' | 'UNIVERSITY';

export interface UserProgress {
  completedLessonIds: string[];
  achievements?: string[];
  points: number;
  lastActivity?: string;
  quizScores?: Record<string, number>;
  totalStudyHours?: number;
  currentFatigue?: number;
  strengths?: string[];
  weaknesses?: string[];
}

export type TeacherPermission = 'create_content' | 'reply_messages' | 'view_analytics' | 'manage_exams';

export interface User {
  uid: string;
  name: string;
  email: string;
  role: UserRole;
  grade: '10' | '11' | '12' | 'uni';
  subscription: 'free' | 'premium' | 'monthly' | 'term' | 'yearly';
  createdAt: string;
  progress: UserProgress;
  // Added properties
  status?: 'active' | 'suspended' | 'banned';
  phone?: string;
  school?: string;
  educationalLevel?: EducationalLevel;
  points?: number; // Used directly on user in some places
  completedLessonIds?: string[]; // ditto
  adminNotes?: string;
  subscriptionExpiry?: string;
  // Teacher properties
  specialization?: string;
  yearsExperience?: number;
  bio?: string;
  avatar?: string;
  photoURL?: string;
  gradesTaught?: string[];
  permissions?: TeacherPermission[];
  jobTitle?: string;
  // Parent properties
  linkedStudentUids?: string[];
  // For reports
  weeklyReports?: WeeklyReport[];
}


export interface WeeklyReport {
    week: string;
    completedUnits: number;
    hoursSpent: number;
    scoreAverage: number;
    improvementAreas: string[];
    parentNote?: string;
}

export interface PredictiveInsight {
    topicId: string;
    topicTitle: string;
    probabilityOfDifficulty: number;
    reasoning: string;
    suggestedPrep: string;
}

// --- 5. Interaction & Social ---
export interface Discussion {
  id: string;
  title: string;
  content: string;
  authorName: string;
  timestamp: string;
  comments: Comment[];
  upvotes: number;
}

export interface Comment {
  id: string;
  authorName: string;
  content: string;
  timestamp: string;
}

export interface StudyGoal {
  id: string;
  title: string;
  participantCount: number;
  progress: number;
}

// --- 6. Gamification ---
export interface Challenge {
  id: string;
  title: string;
  description: string;
  type: 'quiz' | 'speed_run';
  reward: number; // XP points
  isCompleted: boolean;
}

export interface LeaderboardEntry {
  rank: number;
  name: string;
  points: number;
  isCurrentUser: boolean;
}

// --- 7. Other ---
export interface AppNotification {
  id: string;
  userId: string;
  message: string;
  timestamp: string;
  isRead: boolean;
  title?: string;
  type?: 'success' | 'info' | 'warning';
  category?: 'academic' | 'general';
}

// --- 8. Labs & Simulations (NEW) ---
export interface PhysicsExperiment {
  id: string;
  title: string;
  description: string;
  thumbnail: string;
  isFutureLab: boolean;
  parameters: {
      id: string;
      name: string;
      min: number;
      max: number;
      step: number;
      defaultValue: number;
      unit: string;
  }[];
}

export interface SavedExperiment {
  id: string;
  experimentId: string;
  experimentTitle: string;
  timestamp: string;
  params: Record<string, number>;
  result: number;
}

// --- 9. Forum & Community (NEW) ---
export interface ForumPost {
  id: string;
  authorEmail: string;
  authorName: string;
  title: string;
  content: string;
  tags: string[];
  timestamp: string;
  upvotes?: number;
  replies?: ForumReply[];
}

export interface ForumReply {
  id: string;
  authorEmail: string;
  authorName: string;
  content: string;
  role: UserRole;
  timestamp: string;
  upvotes?: number;
}

// --- 10. Live Sessions (NEW) ---
export interface LiveSession {
  id: string;
  title: string;
  teacherName: string;
  startTime: string;
  status: 'live' | 'upcoming';
  topic: string;
  zoomLink?: string;
}

// --- 11. Advanced Content (NEW) ---
export interface Article {
  id: string;
  category: string;
  title: string;
  summary: string;
  imageUrl: string;
  readTime: string;
  content: string;
}

export interface PhysicsEquation {
  id: string;
  category: string;
  title: string;
  latex: string;
  variables: Record<string, string>;
  solveFor?: string;
}


// --- 12. More Social (NEW) ---
export interface StudyGroup {
    id: string;
    name: string;
    level: '10' | '11' | '12';
    membersCount: number;
    activeChallenge: string;
}

// --- 13. Todo List (NEW) ---
export interface Todo {
    id: string;
    text: string;
    completed: boolean;
    category: 'Study' | 'Exam' | 'Lab' | 'Review' | 'Homework';
    createdAt: number;
    dueDate?: string;
}

// --- 14. Teacher/Review System (NEW) ---
export interface Review {
    id: string;
    teacherId: string;
    studentName: string;
    rating: number;
    comment: string;
    timestamp: string;
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

// --- 15. Admin (NEW) ---
export type CloudLog = any;

export interface LoggingSettings {
  logStudentProgress: boolean;
  saveAllQuizAttempts: boolean;
  logAIChatHistory: boolean;
  archiveTeacherMessages: boolean;
}

import { User, Curriculum, Quiz, Question, Answer, StudentQuizAttempt, Discussion, Comment, AIRecommendation, Challenge, LeaderboardEntry, StudyGoal, EducationalResource, Invoice, PaymentStatus, ForumPost, ForumReply, Review, TeacherMessage, Todo, AppNotification, WeeklyReport, UserProgress, Lesson, Unit } from "../types";
import { CURRICULUM_DATA, QUIZZES_DB, QUESTIONS_DB, ANSWERS_DB, CHALLENGES_DB, LEADERBOARD_DATA, STUDY_GOALS_DB } from '../constants';
import { db, auth } from "./firebase";
import { doc, getDoc, setDoc, getDocs, collection, deleteDoc } from "firebase/firestore";

class SyrianScienceCenterDB {
  private static instance: SyrianScienceCenterDB;
  private storageKey = "ssc_db_v2";
  
  public static getInstance(): SyrianScienceCenterDB {
    if (!SyrianScienceCenterDB.instance) SyrianScienceCenterDB.instance = new SyrianScienceCenterDB();
    return SyrianScienceCenterDB.instance;
  }

  private get useCloud(): boolean {
    return !!db && !!auth && !!auth.currentUser;
  }

  private getLocalData() {
    try {
      const raw = localStorage.getItem(this.storageKey);
      if (!raw) return this.getDefaultData();
      const data = JSON.parse(raw);
      // Ensure all default keys exist
      return { ...this.getDefaultData(), ...data };
    } catch (e) {
      return this.getDefaultData();
    }
  }

  private saveLocalData(data: any) {
    localStorage.setItem(this.storageKey, JSON.stringify(data));
  }

  private getDefaultData() {
    return { 
      users: {
        'student_demo': { uid: 'student_demo', email: 'student@ssc.test', name: 'طالب تجريبي', role: 'student', grade: '12', subscription: 'free', createdAt: new Date().toISOString(), progress: { completedLessonIds: [], achievements: [], points: 7500, quizScores: {} } },
        'admin_demo': { uid: 'admin_demo', email: 'admin@ssc.test', name: 'مدير المنصة', role: 'admin', grade: '12', subscription: 'premium', createdAt: new Date().toISOString(), progress: { completedLessonIds: [], achievements: [], points: 999 } },
        'teacher_demo': { uid: 'teacher_demo', email: 'teacher@ssc.test', name: 'معلم تجريبي', role: 'teacher', grade: '12', subscription: 'premium', createdAt: new Date().toISOString(), progress: { completedLessonIds: [], achievements: [], points: 0 }, specialization: 'فيزياء', yearsExperience: 10, bio: 'مدرس فيزياء بخبرة طويلة.', avatar: '👨‍🏫', gradesTaught: ['12'], permissions: ['create_content', 'reply_messages'] },
      },
      curriculum: CURRICULUM_DATA,
      quizzes: QUIZZES_DB,
      questions: QUESTIONS_DB,
      answers: ANSWERS_DB,
      attempts: [],
      discussions: [
        { id: 'd1', title: 'سؤال حول قانون فاراداي', content: 'لم أفهم كيف يؤثر عدد اللفات على القوة الدافعة الحثية؟', authorName: 'أحمد', timestamp: new Date().toISOString(), comments: [], upvotes: 5 }
      ],
      challenges: CHALLENGES_DB,
      leaderboard: LEADERBOARD_DATA,
      studyGoals: STUDY_GOALS_DB,
      resources: [],
      invoices: [],
      notifications: {},
      forumPosts: [],
      reviews: [],
      teacherMessages: [],
      todos: {},
    };
  }

  // --- User Management ---
  async getUser(identifier: string): Promise<User | null> {
    const data = this.getLocalData();
    return data.users[identifier] || Object.values(data.users).find((u: any) => u.email === identifier) || null;
  }

  async saveUser(user: User): Promise<void> {
    const data = this.getLocalData();
    data.users[user.uid] = user;
    this.saveLocalData(data);
  }

  async deleteUser(userId: string): Promise<void> {
    const data = this.getLocalData();
    delete data.users[userId];
    this.saveLocalData(data);
  }

  async getAllStudents(): Promise<User[]> {
    const data = this.getLocalData();
    // FIX: Cast return type to User[] to satisfy Promise<User[]>
    return Object.values(data.users).filter((u: any) => u.role === 'student') as User[];
  }

  async getTeachers(): Promise<User[]> {
    const data = this.getLocalData();
    // FIX: Cast return type to User[] to satisfy Promise<User[]>
    return Object.values(data.users).filter((u: any) => u.role === 'teacher') as User[];
  }

  // --- Curriculum ---
  getCurriculum(): Curriculum[] {
    return this.getLocalData().curriculum;
  }

  async saveLesson(unitId: string, lesson: Lesson): Promise<void> {
    const data = this.getLocalData();
    const curriculum: Curriculum[] = data.curriculum;
    for (const topic of curriculum) {
      const unit = topic.units.find(u => u.id === unitId);
      if (unit) {
        const lessonIndex = unit.lessons.findIndex(l => l.id === lesson.id);
        if (lessonIndex > -1) {
          // Update existing lesson
          unit.lessons[lessonIndex] = lesson;
        } else {
          // Add new lesson
          unit.lessons.push(lesson);
        }
        break;
      }
    }
    this.saveLocalData(data);
  }

  async deleteLesson(unitId: string, lessonId: string): Promise<void> {
    const data = this.getLocalData();
    const curriculum: Curriculum[] = data.curriculum;
    for (const topic of curriculum) {
        const unit = topic.units.find(u => u.id === unitId);
        if (unit) {
            unit.lessons = unit.lessons.filter(l => l.id !== lessonId);
            break;
        }
    }
    this.saveLocalData(data);
  }
  
  toggleLessonComplete(userId: string, lessonId: string) {
    const data = this.getLocalData();
    const user = data.users[userId];
    if (!user) return;
    
    if(!user.progress.completedLessonIds) user.progress.completedLessonIds = [];
    const completed = user.progress.completedLessonIds;
    if (completed.includes(lessonId)) {
        user.progress.completedLessonIds = completed.filter((id: string) => id !== lessonId);
    } else {
        completed.push(lessonId);
        user.progress.points = (user.progress.points || 0) + 10;
    }
    this.saveLocalData(data);
  }

  // --- Quizzes ---
  getQuizzes(): Quiz[] {
    return this.getLocalData().quizzes;
  }

  getQuestionsForQuiz(quizId: string): Question[] {
    const data = this.getLocalData();
    const quiz = data.quizzes.find((q: Quiz) => q.id === quizId);
    if (!quiz) return [];
    return data.questions.filter((q: Question) => quiz.questionIds.includes(q.id));
  }
  
  async getAllQuestions(): Promise<Question[]> {
      return this.getLocalData().questions;
  }

  async saveQuestion(question: Partial<Question>): Promise<void> {
      const data = this.getLocalData();
      data.questions.push({ ...question, id: `q_${Date.now()}` });
      this.saveLocalData(data);
  }

  saveAttempt(attempt: StudentQuizAttempt) {
    const data = this.getLocalData();
    data.attempts.push(attempt);
    const user = data.users[attempt.studentId];
    if (user) {
        user.progress.points = (user.progress.points || 0) + attempt.score * 5;
        if (!user.progress.quizScores) {
            user.progress.quizScores = {};
        }
        // Save the highest score for the quiz
        const existingScore = user.progress.quizScores[attempt.quizId] || 0;
        if (attempt.score > existingScore) {
            user.progress.quizScores[attempt.quizId] = attempt.score;
        }
    }
    this.saveLocalData(data);
  }

  async getUserAttempts(userId: string, quizId?: string): Promise<StudentQuizAttempt[]> {
    const data = this.getLocalData();
    let userAttempts = (data.attempts || []).filter((a: StudentQuizAttempt) => a.studentId === userId);
    if (quizId) {
      userAttempts = userAttempts.filter((a: StudentQuizAttempt) => a.quizId === quizId);
    }
    return userAttempts;
  }
  
  // --- Discussions / Forum ---
  getDiscussions(): Discussion[] {
    return this.getLocalData().discussions;
  }

  async getForumPosts(): Promise<ForumPost[]> {
      return this.getLocalData().forumPosts;
  }
  async createForumPost(post: Omit<ForumPost, 'id'>): Promise<void> {
      const data = this.getLocalData();
      data.forumPosts.push({ ...post, id: `post_${Date.now()}`, upvotes: 0, replies: [] });
      this.saveLocalData(data);
  }
  async addForumReply(postId: string, reply: Omit<ForumReply, 'id' | 'upvotes'>): Promise<void> {
      const data = this.getLocalData();
      const post = data.forumPosts.find((p: ForumPost) => p.id === postId);
      if (post) {
          if (!post.replies) post.replies = [];
          post.replies.push({ ...reply, id: `rep_${Date.now()}`, upvotes: 0 });
          this.saveLocalData(data);
      }
  }
  async upvotePost(postId: string): Promise<void> {
      const data = this.getLocalData();
      const post = data.forumPosts.find((p: ForumPost) => p.id === postId);
      if (post) {
          post.upvotes = (post.upvotes || 0) + 1;
          this.saveLocalData(data);
      }
  }
  async upvoteReply(postId: string, replyId: string): Promise<void> {
      const data = this.getLocalData();
      const post = data.forumPosts.find((p: ForumPost) => p.id === postId);
      if (post && post.replies) {
          const reply = post.replies.find(r => r.id === replyId);
          if (reply) {
              reply.upvotes = (reply.upvotes || 0) + 1;
              this.saveLocalData(data);
          }
      }
  }

  // --- Gamification ---
  getChallenges(): Challenge[] {
    return this.getLocalData().challenges;
  }

  getLeaderboard(): LeaderboardEntry[] {
    return this.getLocalData().leaderboard;
  }

  // --- Social Learning ---
  getStudyGoals(): StudyGoal[] {
    return this.getLocalData().studyGoals;
  }
  
  // --- AI Recommendations ---
  async getAIRecommendations(user: User): Promise<AIRecommendation[]> {
    // Mocked recommendations. In a real app, this would involve a call to Gemini.
    const allRecommendations: AIRecommendation[] = [
      { id: 'rec-1', title: 'مراجعة قانون فاراداي', reason: 'لاحظنا أنك تواجه صعوبة في مسائل الحث الكهرومغناطيسي.', type: 'lesson', targetId: 'l12-1-1', urgency: 'high' },
      { id: 'rec-2', title: 'تحدي جديد: ماراثون الكهرومغناطيسية', reason: 'بناءً على تفوقك في الوحدة الأولى، نعتقد أنك جاهز لهذا التحدي.', type: 'challenge', targetId: 'ch-1', urgency: 'medium' },
      { id: 'rec-3', title: 'شارك في النقاش', reason: 'سؤال تم طرحه يتعلق بموضوع درسته مؤخراً. قد تتمكن من المساعدة!', type: 'discussion', targetId: 'd1', urgency: 'low' },
      { id: 'rec-4', title: 'اختبر نفسك في الفيزياء الحديثة', reason: 'يبدو أنك مستعد لاختبار معلوماتك في هذا المجال المتقدم.', type: 'quiz', targetId: 'quiz-2', urgency: 'medium' },
      { id: 'rec-5', title: 'تعمق في النسبية الخاصة', reason: 'نوصي بهذا الدرس لتوسيع فهمك لمفاهيم أينشتاين.', type: 'lesson', targetId: 'l12-2-1', urgency: 'low' },
    ];
    
    // Filter out recommendations for content the user has already completed.
    const completedLessonIds = user.progress.completedLessonIds || [];
    const attemptedQuizIds = Object.keys(user.progress.quizScores || {});
    // Challenges are stored in `achievements` upon completion.
    const completedChallengeIds = user.progress.achievements || [];

    const filteredRecommendations = allRecommendations.filter(rec => {
      switch (rec.type) {
        case 'lesson':
          return !completedLessonIds.includes(rec.targetId);
        case 'quiz':
          return !attemptedQuizIds.includes(rec.targetId);
        case 'challenge':
          return !completedChallengeIds.includes(rec.targetId);
        case 'discussion':
          return true; // Discussions can always be recommended
        default:
          return true;
      }
    });

    return Promise.resolve(filteredRecommendations);
  }

  // --- Resources ---
  async getResources(): Promise<EducationalResource[]> {
      return this.getLocalData().resources;
  }

  // --- Financial ---
  async initiatePayment(userId: string, planId: string, amount: number): Promise<Invoice> {
      const data = this.getLocalData();
      const user = data.users[userId];
      const invoice: Invoice = {
          id: `inv_${Date.now()}`,
          userId,
          userName: user?.name || 'N/A',
          planId,
          amount,
          date: new Date().toISOString(),
          status: 'PENDING',
          trackId: `track_${Math.random().toString(36).substr(2, 9)}`,
      };
      data.invoices.push(invoice);
      this.saveLocalData(data);
      return invoice;
  }
  async completePayment(trackId: string, result: 'SUCCESS' | 'FAIL'): Promise<Invoice | null> {
      const data = this.getLocalData();
      const invoice = data.invoices.find((inv: Invoice) => inv.trackId === trackId);
      if (invoice) {
          invoice.status = result === 'SUCCESS' ? 'PAID' : 'FAIL';
          if (result === 'SUCCESS') {
              invoice.paymentId = `pay_${Date.now()}`;
              invoice.authCode = Math.random().toString(36).substr(2, 6).toUpperCase();
              const user = data.users[invoice.userId];
              if (user) user.subscription = 'premium';
          }
          this.saveLocalData(data);
          return invoice;
      }
      return null;
  }
  async getInvoices(): Promise<{ data: Invoice[] }> {
      return { data: this.getLocalData().invoices };
  }
  async getFinancialStats(): Promise<{ totalRevenue: number, pendingAmount: number, totalInvoices: number }> {
      const invoices = this.getLocalData().invoices;
      return {
          totalRevenue: invoices.filter((i: Invoice) => i.status === 'PAID').reduce((sum: number, i: Invoice) => sum + i.amount, 0),
          pendingAmount: invoices.filter((i: Invoice) => i.status === 'PENDING').reduce((sum: number, i: Invoice) => sum + i.amount, 0),
          totalInvoices: invoices.length,
      };
  }
  async updateInvoiceStatus(id: string, status: PaymentStatus): Promise<void> {
      const data = this.getLocalData();
      const invoice = data.invoices.find((i: Invoice) => i.id === id);
      if (invoice) {
          invoice.status = status;
          this.saveLocalData(data);
      }
  }

  // --- Notifications ---
  async addNotification(userId: string, notification: AppNotification): Promise<void> {
      const data = this.getLocalData();
      if (!data.notifications[userId]) data.notifications[userId] = [];
      data.notifications[userId].push(notification);
      this.saveLocalData(data);
  }
  async getNotifications(userId: string): Promise<AppNotification[]> {
      const data = this.getLocalData();
      return data.notifications[userId] || [];
  }

  // --- Parent Portal ---
  async getStudentProgressForParent(studentUid: string): Promise<{ user: User | null, report: WeeklyReport | null }> {
      const user = await this.getUser(studentUid);
      // Mock report
      const report: WeeklyReport = { week: 'Current', scoreAverage: 85, hoursSpent: 8.5, completedUnits: 2, improvementAreas: [], parentNote: "أداء ممتاز هذا الأسبوع، نلاحظ تحسناً في مهارات حل المسائل." };
      return { user, report };
  }

  // --- Teacher System ---
  async getTeacherReviews(teacherId: string): Promise<Review[]> {
      const data = this.getLocalData();
      return (data.reviews || []).filter((r: Review) => r.teacherId === teacherId);
  }
  async addReview(review: Review): Promise<void> {
      const data = this.getLocalData();
      if (!data.reviews) data.reviews = [];
      data.reviews.push(review);
      this.saveLocalData(data);
  }
  // FIX: Implemented saveTeacherMessage and getAllTeacherMessages
  async saveTeacherMessage(message: TeacherMessage): Promise<void> {
    const data = this.getLocalData();
    if (!data.teacherMessages) {
        data.teacherMessages = [];
    }
    data.teacherMessages.push(message);
    this.saveLocalData(data);
  }
  async getAllTeacherMessages(teacherId: string): Promise<TeacherMessage[]> {
    const data = this.getLocalData();
    return (data.teacherMessages || []).filter((m: TeacherMessage) => m.teacherId === teacherId);
  }

  // FIX: Added missing Todo list methods
  async getTodos(userId: string): Promise<Todo[]> {
    const data = this.getLocalData();
    return data.todos[userId] || [];
  }

  async saveTodo(userId: string, todoData: Omit<Todo, 'id'>): Promise<string> {
    const data = this.getLocalData();
    if (!data.todos[userId]) {
        data.todos[userId] = [];
    }
    const newId = `todo_${Date.now()}`;
    const newTodo: Todo = { ...todoData, id: newId };
    data.todos[userId].unshift(newTodo);
    this.saveLocalData(data);
    return newId;
  }

  async updateTodo(userId: string, todoId: string, updates: Partial<Todo>): Promise<void> {
    const data = this.getLocalData();
    if (data.todos[userId]) {
        const todoIndex = data.todos[userId].findIndex((t: Todo) => t.id === todoId);
        if (todoIndex > -1) {
            data.todos[userId][todoIndex] = { ...data.todos[userId][todoIndex], ...updates };
            this.saveLocalData(data);
        }
    }
  }

  async deleteTodo(userId: string, todoId: string): Promise<void> {
    const data = this.getLocalData();
    if (data.todos[userId]) {
        data.todos[userId] = data.todos[userId].filter((t: Todo) => t.id !== todoId);
        this.saveLocalData(data);
    }
  }
}

// FIX: Export the singleton instance of the DB service
export const dbService = SyrianScienceCenterDB.getInstance();

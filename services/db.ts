
import { db, auth } from './firebase'; 
import { supabase } from './supabase';
import { 
  collection, doc, getDoc, getDocs, setDoc, updateDoc, deleteDoc, 
  query, where, onSnapshot, orderBy, Timestamp, addDoc, limit, increment,
  documentId, writeBatch
} from 'firebase/firestore';
import { 
  User, Curriculum, Quiz, Question, StudentQuizAttempt, 
  AppNotification, Todo, TeacherMessage, Review, 
  HomePageContent, Asset, SubscriptionCode, ForumSection, 
  ForumPost, ForumReply, WeeklyReport, LoggingSettings, 
  NotificationSettings, PaymentSettings, Invoice, AIRecommendation,
  Unit, Lesson, LiveSession, EducationalResource, PaymentStatus, UserRole,
  AppBranding, Article, PhysicsExperiment, PhysicsEquation, StudyGroup,
  SubscriptionPlan, InvoiceSettings
} from '../types';

class DBService {
  private checkDb() {
    if (!db) throw new Error("Firestore is not initialized. Check your API keys in .env");
  }

  private cleanData(data: any) {
    const clean = { ...data };
    Object.keys(clean).forEach(key => (clean[key] === undefined || clean[key] === null) && delete clean[key]);
    return clean;
  }

  // --- Connection & Health ---
  async checkConnection() {
    try {
      this.checkDb();
      await getDocs(query(collection(db!, 'settings'), limit(1)));
      return { alive: true };
    } catch (e: any) {
      return { alive: false, error: e.message };
    }
  }

  async checkSupabaseConnection() {
    try {
      const { data, error } = await supabase.storage.listBuckets();
      if (error) throw error;
      return { alive: true };
    } catch (e: any) {
      return { alive: false, error: e.message };
    }
  }

  // --- Users & Roles ---
  subscribeToUser(uid: string, callback: (user: User | null) => void) {
    this.checkDb();
    return onSnapshot(doc(db!, 'users', uid), (snap) => {
      if (snap.exists()) callback(snap.data() as User);
      else callback(null);
    });
  }

  subscribeToUsers(callback: (users: User[]) => void, role: UserRole) {
    this.checkDb();
    const q = query(collection(db!, 'users'), where('role', '==', role));
    return onSnapshot(q, (snap) => {
      callback(snap.docs.map(d => ({ ...d.data(), uid: d.id } as User)));
    });
  }

  async getStudentGradeStats() {
    this.checkDb();
    try {
        const q = query(collection(db!, 'users'), where('role', '==', 'student'));
        const snap = await getDocs(q);
        const students = snap.docs.map(d => d.data() as User);
        
        return {
          grade10: students.filter(s => s.grade === '10').length,
          grade11: students.filter(s => s.grade === '11').length,
          grade12: students.filter(s => s.grade === '12').length,
          uni: students.filter(s => s.grade === 'uni').length,
          total: students.length
        };
    } catch (error) {
        return { grade10: 0, grade11: 0, grade12: 0, uni: 0, total: 0 };
    }
  }

  // --- Financials & Subscriptions ---
  async getSubscriptionPlans(): Promise<SubscriptionPlan[]> {
    this.checkDb();
    try {
        const snap = await getDocs(collection(db!, 'subscriptionPlans'));
        return snap.docs.map(d => ({ ...d.data(), id: d.id } as SubscriptionPlan));
    } catch (e) { return []; }
  }

  async getPaymentSettings(): Promise<PaymentSettings> {
    this.checkDb();
    try {
        const snap = await getDoc(doc(db!, 'settings', 'payment'));
        if (snap.exists()) return snap.data() as PaymentSettings;
    } catch (e) {}
    return {
        isOnlinePaymentEnabled: false,
        womdaPhoneNumber: '55315661',
        planPrices: { premium: 35, basic: 0 }
    };
  }

  async getInvoiceSettings(): Promise<InvoiceSettings> {
    this.checkDb();
    try {
        const snap = await getDoc(doc(db!, 'settings', 'invoice_design'));
        if (snap.exists()) return snap.data() as InvoiceSettings;
    } catch (e) {}
    return {
        headerText: 'إيصال دفع رقمي معتمد',
        footerText: 'يُعتبر هذا المستند إثباتاً رسمياً لعملية الدفع والاشتراك في منصة المركز السوري للعلوم.',
        accentColor: '#fbbf24',
        showSignature: true,
        signatureName: 'إدارة المركز السوري للعلوم',
        showWatermark: true,
        watermarkText: 'SSC KUWAIT'
    };
  }

  async getAppBranding(): Promise<AppBranding> {
    this.checkDb();
    try {
        const snap = await getDoc(doc(db!, 'settings', 'branding'));
        if (snap.exists()) return snap.data() as AppBranding;
    } catch (e) {}
    return { 
      logoUrl: 'https://spxlxypbosipfwbijbjk.supabase.co/storage/v1/object/public/assets/1769130153314_IMG_2848.png', 
      appName: 'المركز السوري للعلوم' 
    };
  }

  // Fix: Added subscribeToInvoices
  subscribeToInvoices(uid: string, callback: (invoices: Invoice[]) => void) {
    this.checkDb();
    const q = query(collection(db!, 'invoices'), where('userId', '==', uid), orderBy('date', 'desc'));
    return onSnapshot(q, (snap) => {
      callback(snap.docs.map(d => ({ ...d.data(), id: d.id } as Invoice)));
    });
  }

  // Fix: Added initiatePayment
  async initiatePayment(userId: string, planId: string, amount: number) {
    this.checkDb();
    const invoice: Omit<Invoice, 'id'> = {
      userId,
      userName: (await this.getUser(userId))?.name || 'Student',
      planId,
      amount,
      date: new Date().toISOString(),
      status: 'PENDING',
      trackId: 'TRK-' + Math.random().toString(36).substring(7).toUpperCase()
    };
    await addDoc(collection(db!, 'invoices'), this.cleanData(invoice));
  }

  async getCurriculum(): Promise<Curriculum[]> {
    this.checkDb();
    const snap = await getDocs(collection(db!, 'curriculum'));
    return snap.docs.map(d => ({ ...d.data(), id: d.id } as Curriculum));
  }

  async saveUser(user: User) {
    this.checkDb();
    await setDoc(doc(db!, 'users', user.uid), this.cleanData(user), { merge: true });
  }

  async getUser(uidOrEmail: string): Promise<User | null> {
    this.checkDb();
    try {
        let snap = await getDoc(doc(db!, 'users', uidOrEmail));
        if (snap.exists()) return snap.data() as User;
        const qEmail = query(collection(db!, 'users'), where('email', '==', uidOrEmail), limit(1));
        const querySnapEmail = await getDocs(qEmail);
        if (!querySnapEmail.empty) return querySnapEmail.docs[0].data() as User;
    } catch (e) {}
    return null;
  }

  async savePaymentSettings(settings: PaymentSettings) {
    this.checkDb();
    await setDoc(doc(db!, 'settings', 'payment'), this.cleanData(settings));
  }

  async saveInvoiceSettings(settings: InvoiceSettings) {
    this.checkDb();
    await setDoc(doc(db!, 'settings', 'invoice_design'), this.cleanData(settings));
  }

  async saveAppBranding(branding: AppBranding) {
    this.checkDb();
    await setDoc(doc(db!, 'settings', 'branding'), this.cleanData(branding));
  }

  async getQuizzes(): Promise<Quiz[]> {
    this.checkDb();
    const snap = await getDocs(collection(db!, 'quizzes'));
    return snap.docs.map(d => ({ ...d.data(), id: d.id } as Quiz));
  }

  async getAllQuestions(): Promise<Question[]> {
    this.checkDb();
    const snap = await getDocs(collection(db!, 'questions'));
    return snap.docs.map(d => ({ ...d.data(), id: d.id } as Question));
  }

  async getInvoices(): Promise<{ data: Invoice[] }> {
    this.checkDb();
    const snap = await getDocs(query(collection(db!, 'invoices'), orderBy('date', 'desc')));
    return { data: snap.docs.map(d => ({ ...d.data(), id: d.id } as Invoice)) };
  }

  async getAdvancedFinancialStats() {
    const { data: invoices } = await this.getInvoices();
    const paid = invoices.filter(i => i.status === 'PAID');
    const now = new Date();
    const today = now.toISOString().split('T')[0];
    const month = today.substring(0, 7);
    const year = today.substring(0, 4);

    return {
      daily: paid.filter(i => i.date.startsWith(today)).reduce((s, i) => s + i.amount, 0),
      monthly: paid.filter(i => i.date.startsWith(month)).reduce((s, i) => s + i.amount, 0),
      yearly: paid.filter(i => i.date.startsWith(year)).reduce((s, i) => s + i.amount, 0),
      total: paid.reduce((s, i) => s + i.amount, 0),
      pending: invoices.filter(i => i.status === 'PENDING').length
    };
  }

  async deleteInvoice(id: string) {
    this.checkDb();
    await deleteDoc(doc(db!, 'invoices', id));
  }

  async createManualInvoice(userId: string, planId: string, amount: number): Promise<Invoice> {
    this.checkDb();
    const user = await this.getUser(userId);
    const invoice: Omit<Invoice, 'id'> = {
      userId, userName: user?.name || 'Student', planId, amount, date: new Date().toISOString(), status: 'PAID',
      trackId: 'MANUAL-' + Math.random().toString(36).substring(7).toUpperCase()
    };
    const docRef = await addDoc(collection(db!, 'invoices'), invoice);
    if (user) {
        await this.updateStudentSubscription(userId, planId === 'plan_premium' ? 'premium' : 'free', amount);
    }
    return { ...invoice, id: docRef.id };
  }

  async updateStudentSubscription(uid: string, tier: 'free' | 'premium', amount: number) {
    this.checkDb();
    await updateDoc(doc(db!, 'users', uid), { subscription: tier });
  }

  // --- Forum ---
  async getForumSections(): Promise<ForumSection[]> {
    this.checkDb();
    const snap = await getDocs(query(collection(db!, 'forumSections'), orderBy('order')));
    return snap.docs.map(d => ({ ...d.data(), id: d.id } as ForumSection));
  }

  async getForumPosts(forumId?: string): Promise<ForumPost[]> {
    this.checkDb();
    let q = query(collection(db!, 'forumPosts'), orderBy('timestamp', 'desc'));
    if (forumId) q = query(q, where('tags', 'array-contains', forumId));
    const snap = await getDocs(q);
    return snap.docs.map(d => ({ ...d.data(), id: d.id } as ForumPost));
  }

  // Fix: Added createForumPost
  async createForumPost(post: Omit<ForumPost, 'id'>) {
    this.checkDb();
    await addDoc(collection(db!, 'forumPosts'), this.cleanData(post));
  }

  // Fix: Added addForumReply
  async addForumReply(postId: string, reply: Omit<ForumReply, 'id' | 'timestamp' | 'upvotes'>) {
    this.checkDb();
    const fullReply = {
      ...reply,
      id: 'rep_' + Date.now(),
      timestamp: new Date().toISOString(),
      upvotes: 0
    };
    const postRef = doc(db!, 'forumPosts', postId);
    const snap = await getDoc(postRef);
    if (snap.exists()) {
      const data = snap.data() as ForumPost;
      const replies = data.replies || [];
      replies.push(fullReply);
      await updateDoc(postRef, { replies });
    }
  }

  // Fix: Added initializeForumSystem
  async initializeForumSystem() {
    this.checkDb();
    const sections = [
      { title: 'القسم العام', description: 'نقاشات عامة حول العلوم والفيزياء.', order: 0, forums: [
        { id: 'general-discussions', title: 'نقاشات مفتوحة', description: 'تحدث مع زملائك في أي موضوع علمي.', icon: '🌍', order: 0 }
      ]}
    ];
    for (const sec of sections) {
       await addDoc(collection(db!, 'forumSections'), sec);
    }
  }

  // Fix: Added saveForumSections
  async saveForumSections(sections: ForumSection[]) {
    this.checkDb();
    const batch = writeBatch(db!);
    const existing = await getDocs(collection(db!, 'forumSections'));
    existing.forEach(d => batch.delete(d.ref));
    
    sections.forEach(sec => {
      const newRef = doc(collection(db!, 'forumSections'));
      batch.set(newRef, this.cleanData(sec));
    });
    await batch.commit();
  }

  // Fix: Added updateForumPost
  async updateForumPost(postId: string, updates: Partial<ForumPost>) {
    this.checkDb();
    await updateDoc(doc(db!, 'forumPosts', postId), this.cleanData(updates));
  }

  // Fix: Added deleteForumPost
  async deleteForumPost(postId: string) {
    this.checkDb();
    await deleteDoc(doc(db!, 'forumPosts', postId));
  }

  async getLoggingSettings(): Promise<LoggingSettings> {
    this.checkDb();
    const snap = await getDoc(doc(db!, 'settings', 'logging'));
    if (snap.exists()) return snap.data() as LoggingSettings;
    return { logStudentProgress: true, saveAllQuizAttempts: true, logAIChatHistory: true, archiveTeacherMessages: true, forumAccessTier: 'free' };
  }

  async saveLoggingSettings(settings: LoggingSettings) {
    this.checkDb();
    await setDoc(doc(db!, 'settings', 'logging'), this.cleanData(settings));
  }

  async getNotificationSettings(): Promise<NotificationSettings> {
    this.checkDb();
    const snap = await getDoc(doc(db!, 'settings', 'notifications'));
    if (snap.exists()) return snap.data() as NotificationSettings;
    return { pushForLiveSessions: true, pushForGradedQuizzes: true, pushForAdminAlerts: true };
  }

  // Fix: Added saveNotificationSettings
  async saveNotificationSettings(settings: NotificationSettings) {
    this.checkDb();
    await setDoc(doc(db!, 'settings', 'notifications'), this.cleanData(settings));
  }

  async getTeachers(): Promise<User[]> {
    this.checkDb();
    const q = query(collection(db!, 'users'), where('role', '==', 'teacher'));
    const snap = await getDocs(q);
    return snap.docs.map(d => ({ ...d.data(), uid: d.id } as User));
  }

  async getLiveSessions(): Promise<LiveSession[]> {
    this.checkDb();
    const snap = await getDocs(collection(db!, 'liveSessions'));
    return snap.docs.map(d => ({ ...d.data(), id: d.id } as LiveSession));
  }

  // Fix: Added subscribeToLiveSessions
  subscribeToLiveSessions(callback: (sessions: LiveSession[]) => void) {
    this.checkDb();
    return onSnapshot(collection(db!, 'liveSessions'), (snap) => {
      callback(snap.docs.map(d => ({ ...d.data(), id: d.id } as LiveSession)));
    });
  }

  // Fix: Added saveLiveSession
  async saveLiveSession(session: Partial<LiveSession>) {
    this.checkDb();
    if (session.id) {
      await setDoc(doc(db!, 'liveSessions', session.id), this.cleanData(session), { merge: true });
    } else {
      await addDoc(collection(db!, 'liveSessions'), this.cleanData(session));
    }
  }

  // Fix: Added deleteLiveSession
  async deleteLiveSession(id: string) {
    this.checkDb();
    await deleteDoc(doc(db!, 'liveSessions', id));
  }

  async getResources(): Promise<EducationalResource[]> {
    this.checkDb();
    const snap = await getDocs(collection(db!, 'resources'));
    return snap.docs.map(d => ({ ...d.data(), id: d.id } as EducationalResource));
  }

  async getArticles(): Promise<Article[]> {
    this.checkDb();
    const snap = await getDocs(collection(db!, 'articles'));
    return snap.docs.map(d => ({ ...d.data(), id: d.id } as Article));
  }

  async getExperiments(): Promise<PhysicsExperiment[]> {
    this.checkDb();
    const snap = await getDocs(collection(db!, 'experiments'));
    return snap.docs.map(d => ({ ...d.data(), id: d.id } as PhysicsExperiment));
  }

  async getEquations(): Promise<PhysicsEquation[]> {
    this.checkDb();
    const snap = await getDocs(collection(db!, 'equations'));
    return snap.docs.map(d => ({ ...d.data(), id: d.id } as PhysicsEquation));
  }

  async getStudyGroups(): Promise<StudyGroup[]> {
    this.checkDb();
    const snap = await getDocs(collection(db!, 'studyGroups'));
    return snap.docs.map(d => ({ ...d.data(), id: d.id } as StudyGroup));
  }

  // --- Todos ---
  async getTodos(uid: string): Promise<Todo[]> {
    this.checkDb();
    const q = query(collection(db!, 'users', uid, 'todos'), orderBy('createdAt', 'desc'));
    const snap = await getDocs(q);
    return snap.docs.map(d => ({ ...d.data(), id: d.id } as Todo));
  }

  // Fix: Added saveTodo
  async saveTodo(uid: string, todo: Omit<Todo, 'id'>): Promise<string> {
    this.checkDb();
    const docRef = await addDoc(collection(db!, 'users', uid, 'todos'), this.cleanData(todo));
    return docRef.id;
  }

  // Fix: Added updateTodo
  async updateTodo(uid: string, todoId: string, updates: Partial<Todo>) {
    this.checkDb();
    await updateDoc(doc(db!, 'users', uid, 'todos', todoId), this.cleanData(updates));
  }

  // Fix: Added deleteTodo
  async deleteTodo(uid: string, todoId: string) {
    this.checkDb();
    await deleteDoc(doc(db!, 'users', uid, 'todos', todoId));
  }

  async getAIRecommendations(user: User): Promise<AIRecommendation[]> {
    return [
        { id: 'rec1', title: 'تحسين فهم المتجهات', reason: 'لقد واجهت صعوبة في الاختبار الأخير للمتجهات.', type: 'lesson', targetId: 'lesson-vectors', urgency: 'high' },
        { id: 'rec2', title: 'تحدي قوانين نيوتن', reason: 'أنت متفوق في هذا القسم، جرب هذا التحدي!', type: 'challenge', targetId: 'quiz-newton-adv', urgency: 'medium' }
    ];
  }

  async listAssets(): Promise<Asset[]> {
    const { data, error } = await supabase.storage.from('assets').list();
    if (error) throw error;
    return data.map(item => ({
        name: item.name,
        url: supabase.storage.from('assets').getPublicUrl(item.name).data.publicUrl,
        type: item.metadata?.mimetype || 'application/octet-stream',
        size: item.metadata?.size || 0
    }));
  }

  async uploadAsset(file: File): Promise<Asset> {
    const name = `${Date.now()}_${file.name}`;
    const { data, error } = await supabase.storage.from('assets').upload(name, file);
    if (error) throw error;
    const { data: { publicUrl } } = supabase.storage.from('assets').getPublicUrl(name);
    return { name, url: publicUrl, type: file.type, size: file.size };
  }

  async deleteAsset(name: string) {
    const { error } = await supabase.storage.from('assets').remove([name]);
    if (error) throw error;
  }

  async getHomePageContent(): Promise<HomePageContent[]> {
    this.checkDb();
    const snap = await getDocs(collection(db!, 'homePageContent'));
    return snap.docs.map(d => ({ ...d.data(), id: d.id } as HomePageContent));
  }

  // Fix: Added saveHomePageContent
  async saveHomePageContent(content: Partial<HomePageContent>) {
    this.checkDb();
    if (content.id) {
        await setDoc(doc(db!, 'homePageContent', content.id), this.cleanData(content), { merge: true });
    } else {
        await addDoc(collection(db!, 'homePageContent'), this.cleanData(content));
    }
  }

  // Fix: Added deleteHomePageContent
  async deleteHomePageContent(id: string) {
    this.checkDb();
    await deleteDoc(doc(db!, 'homePageContent', id));
  }

  // --- Additional Methods for UI fixes ---
  // Fix: Added getUserAttempts
  async getUserAttempts(uid: string, quizId?: string): Promise<StudentQuizAttempt[]> {
    this.checkDb();
    let q = query(collection(db!, 'quizAttempts'), where('studentId', '==', uid));
    if (quizId) q = query(q, where('quizId', '==', quizId));
    const snap = await getDocs(q);
    return snap.docs.map(d => ({ ...d.data(), id: d.id } as StudentQuizAttempt));
  }

  // Fix: Added getAttemptsForQuiz
  async getAttemptsForQuiz(quizId: string): Promise<StudentQuizAttempt[]> {
    this.checkDb();
    const q = query(collection(db!, 'quizAttempts'), where('quizId', '==', quizId), orderBy('completedAt', 'desc'));
    const snap = await getDocs(q);
    return snap.docs.map(d => ({ ...d.data(), id: d.id } as StudentQuizAttempt));
  }

  // Fix: Added updateAttempt
  async updateAttempt(attempt: StudentQuizAttempt) {
    this.checkDb();
    await updateDoc(doc(db!, 'quizAttempts', attempt.id), this.cleanData(attempt));
  }

  // Fix: Added saveAttempt
  async saveAttempt(attempt: StudentQuizAttempt) {
    this.checkDb();
    await setDoc(doc(db!, 'quizAttempts', attempt.id), this.cleanData(attempt));
    if (attempt.score > 0) {
      await updateDoc(doc(db!, 'users', attempt.studentId), {
        'progress.points': increment(attempt.score)
      });
    }
  }

  // Fix: Added getQuizById
  async getQuizById(id: string): Promise<Quiz | null> {
    this.checkDb();
    const snap = await getDoc(doc(db!, 'quizzes', id));
    return snap.exists() ? ({ ...snap.data(), id: snap.id } as Quiz) : null;
  }

  // Fix: Added saveQuiz
  async saveQuiz(quiz: Quiz) {
    this.checkDb();
    await setDoc(doc(db!, 'quizzes', quiz.id), this.cleanData(quiz), { merge: true });
  }

  // Fix: Added deleteQuiz
  async deleteQuiz(id: string) {
    this.checkDb();
    await deleteDoc(doc(db!, 'quizzes', id));
  }

  // Fix: Added getQuestionsForQuiz
  async getQuestionsForQuiz(quizId: string): Promise<Question[]> {
    this.checkDb();
    const quiz = await this.getQuizById(quizId);
    if (!quiz || !quiz.questionIds.length) return [];
    const q = query(collection(db!, 'questions'), where(documentId(), 'in', quiz.questionIds));
    const snap = await getDocs(q);
    return snap.docs.map(d => ({ ...d.data(), id: d.id } as Question));
  }

  // Fix: Added saveQuestion
  async saveQuestion(question: Question): Promise<string> {
    this.checkDb();
    const docRef = await addDoc(collection(db!, 'questions'), this.cleanData(question));
    return docRef.id;
  }

  // Fix: Added updateQuestion
  async updateQuestion(id: string, updates: Partial<Question>) {
    this.checkDb();
    await updateDoc(doc(db!, 'questions', id), this.cleanData(updates));
  }

  // Fix: Added subscribeToNotifications
  subscribeToNotifications(uid: string, callback: (notifications: AppNotification[]) => void) {
    this.checkDb();
    const q = query(collection(db!, 'notifications'), where('userId', '==', uid), orderBy('timestamp', 'desc'), limit(50));
    return onSnapshot(q, (snap) => {
      callback(snap.docs.map(d => ({ ...d.data(), id: d.id } as AppNotification)));
    });
  }

  // Fix: Added createNotification
  async createNotification(notification: Omit<AppNotification, 'id'>) {
    this.checkDb();
    await addDoc(collection(db!, 'notifications'), this.cleanData(notification));
  }

  // Fix: Added getNotifications
  async getNotifications(uid: string): Promise<AppNotification[]> {
    this.checkDb();
    const q = query(collection(db!, 'notifications'), where('userId', '==', uid), orderBy('timestamp', 'desc'));
    const snap = await getDocs(q);
    return snap.docs.map(d => ({ ...d.data(), id: d.id } as AppNotification));
  }

  // Fix: Added markNotificationsAsRead
  async markNotificationsAsRead(uid: string) {
    this.checkDb();
    const q = query(collection(db!, 'notifications'), where('userId', '==', uid), where('isRead', '==', false));
    const snap = await getDocs(q);
    const batch = writeBatch(db!);
    snap.forEach(d => batch.update(d.ref, { isRead: true }));
    await batch.commit();
  }

  // Fix: Added toggleLessonComplete
  async toggleLessonComplete(uid: string, lessonId: string) {
    this.checkDb();
    const userRef = doc(db!, 'users', uid);
    const snap = await getDoc(userRef);
    if (!snap.exists()) return;
    const user = snap.data() as User;
    const completed = user.progress.completedLessonIds || [];
    const index = completed.indexOf(lessonId);
    if (index > -1) completed.splice(index, 1); else completed.push(lessonId);
    await updateDoc(userRef, { 
      'progress.completedLessonIds': completed,
      'progress.points': index > -1 ? increment(-10) : increment(10)
    });
  }

  // Fix: Added saveLesson
  async saveLesson(curriculumId: string, unitId: string, lesson: Lesson) {
    this.checkDb();
    const curRef = doc(db!, 'curriculum', curriculumId);
    const snap = await getDoc(curRef);
    if (!snap.exists()) throw new Error("Curriculum not found");
    const data = snap.data() as Curriculum;
    const uIdx = data.units.findIndex(u => u.id === unitId);
    if (uIdx === -1) throw new Error("Unit not found");
    const lessons = data.units[uIdx].lessons || [];
    const lIdx = lessons.findIndex(l => l.id === lesson.id);
    if (lIdx > -1) lessons[lIdx] = lesson; else lessons.push(lesson);
    data.units[uIdx].lessons = lessons;
    await updateDoc(curRef, { units: data.units });
  }

  // Fix: Added saveUnit
  async saveUnit(curriculumId: string, unit: Unit, grade: string, subject: string) {
    this.checkDb();
    const curRef = doc(db!, 'curriculum', curriculumId);
    const snap = await getDoc(curRef);
    if (!snap.exists()) {
      await setDoc(curRef, { grade, subject, title: `منهج ${subject}`, description: '', icon: '📚', units: [unit] });
      return;
    }
    const data = snap.data() as Curriculum;
    const uIdx = data.units.findIndex(u => u.id === unit.id);
    if (uIdx > -1) data.units[uIdx] = unit; else data.units.push(unit);
    await updateDoc(curRef, { units: data.units });
  }

  // Fix: Added updateUnitsOrder
  async updateUnitsOrder(curriculumId: string, units: Unit[]) {
    this.checkDb();
    await updateDoc(doc(db!, 'curriculum', curriculumId), { units });
  }

  // Fix: Added deleteUnit
  async deleteUnit(curriculumId: string, unitId: string) {
    this.checkDb();
    const curRef = doc(db!, 'curriculum', curriculumId);
    const snap = await getDoc(curRef);
    if (!snap.exists()) return;
    const data = snap.data() as Curriculum;
    data.units = data.units.filter(u => u.id !== unitId);
    await updateDoc(curRef, { units: data.units });
  }

  // Fix: Added deleteLesson
  async deleteLesson(curriculumId: string, unitId: string, lessonId: string) {
    this.checkDb();
    const curRef = doc(db!, 'curriculum', curriculumId);
    const snap = await getDoc(curRef);
    if (!snap.exists()) return;
    const data = snap.data() as Curriculum;
    const uIdx = data.units.findIndex(u => u.id === unitId);
    if (uIdx > -1) {
      data.units[uIdx].lessons = data.units[uIdx].lessons.filter(l => l.id !== lessonId);
      await updateDoc(curRef, { units: data.units });
    }
  }

  // Fix: Added getStudentProgressForParent
  async getStudentProgressForParent(uid: string) {
      this.checkDb();
      const user = await this.getUser(uid);
      const reports = user?.weeklyReports || [];
      const latestReport = reports.length > 0 ? reports[reports.length - 1] : null;
      return { user, report: latestReport };
  }

  // Fix: Added getTeacherReviews
  async getTeacherReviews(teacherId: string): Promise<Review[]> {
    this.checkDb();
    const q = query(collection(db!, 'reviews'), where('teacherId', '==', teacherId), orderBy('timestamp', 'desc'));
    const snap = await getDocs(q);
    return snap.docs.map(d => ({ ...d.data(), id: d.id } as Review));
  }

  // Fix: Added addReview
  async addReview(review: Review) {
    this.checkDb();
    await addDoc(collection(db!, 'reviews'), this.cleanData(review));
  }

  // Fix: Added saveTeacherMessage
  async saveTeacherMessage(message: TeacherMessage) {
    this.checkDb();
    await addDoc(collection(db!, 'teacherMessages'), this.cleanData(message));
  }

  // Fix: Added getAllTeacherMessages
  async getAllTeacherMessages(teacherId: string): Promise<TeacherMessage[]> {
    this.checkDb();
    const q = query(collection(db!, 'teacherMessages'), where('teacherId', '==', teacherId), orderBy('timestamp', 'desc'));
    const snap = await getDocs(q);
    return snap.docs.map(d => ({ ...d.data(), id: d.id } as TeacherMessage));
  }

  // Fix: Added deleteUser
  async deleteUser(uid: string) {
    this.checkDb();
    await deleteDoc(doc(db!, 'users', uid));
  }

  // Fix: Added getAdmins
  async getAdmins(): Promise<User[]> {
    this.checkDb();
    const q = query(collection(db!, 'users'), where('role', '==', 'admin'));
    const snap = await getDocs(q);
    return snap.docs.map(d => ({ ...d.data(), uid: d.id } as User));
  }

  // Fix: Added updateUserRole
  async updateUserRole(uid: string, role: UserRole) {
    this.checkDb();
    await updateDoc(doc(db!, 'users', uid), { role });
  }
}

export const dbService = new DBService();

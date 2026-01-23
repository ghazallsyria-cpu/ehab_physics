
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
  SubscriptionPlan, InvoiceSettings, MaintenanceSettings
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

  // --- Maintenance Mode ---
  async getMaintenanceSettings(): Promise<MaintenanceSettings> {
    this.checkDb();
    try {
        const snap = await getDoc(doc(db!, 'settings', 'maintenance'));
        if (snap.exists()) return snap.data() as MaintenanceSettings;
    } catch (e) {
        console.warn("Maintenance settings fetch failed", e);
    }
    return {
        isMaintenanceActive: false,
        expectedReturnTime: new Date(Date.now() + 86400000).toISOString(),
        maintenanceMessage: "نقوم حالياً بتطوير المنصة لتقديم تجربة تعليمية أفضل.",
        showCountdown: true,
        allowTeachers: false
    };
  }

  async saveMaintenanceSettings(settings: MaintenanceSettings) {
    this.checkDb();
    await setDoc(doc(db!, 'settings', 'maintenance'), this.cleanData(settings));
  }

  subscribeToMaintenance(callback: (settings: MaintenanceSettings) => void, onError?: (err: any) => void) {
    this.checkDb();
    return onSnapshot(doc(db!, 'settings', 'maintenance'), (snap) => {
        if (snap.exists()) {
            callback(snap.data() as MaintenanceSettings);
        } else {
            callback({
                isMaintenanceActive: false,
                expectedReturnTime: new Date().toISOString(),
                maintenanceMessage: "النظام تحت الصيانة حالياً.",
                showCountdown: false,
                allowTeachers: true
            });
        }
    }, (error) => {
        console.error("Maintenance subscription error:", error);
        if (onError) onError(error);
        callback({ isMaintenanceActive: false, expectedReturnTime: '', maintenanceMessage: '', showCountdown: false, allowTeachers: true });
    });
  }

  // --- User Services ---
  async getUser(identifier: string): Promise<User | null> {
    this.checkDb();
    if (!identifier) return null;
    
    try {
        const snap = await getDoc(doc(db!, 'users', identifier));
        if (snap.exists()) return snap.data() as User;

        const qEmail = query(collection(db!, 'users'), where('email', '==', identifier), limit(1));
        const snapEmail = await getDocs(qEmail);
        if (!snapEmail.empty) return snapEmail.docs[0].data() as User;

        const cleanPhone = identifier.replace(/\s+/g, '').replace('+965', '').replace('965', '');
        const qPhone = query(collection(db!, 'users'), where('phone', 'in', [identifier, cleanPhone, `965${cleanPhone}`]), limit(1));
        const snapPhone = await getDocs(qPhone);
        if (!snapPhone.empty) return snapPhone.docs[0].data() as User;

    } catch (e) {
        console.error("Search User Error:", e);
    }
    return null;
  }

  subscribeToUser(uid: string, callback: (user: User | null) => void, onError?: (err: any) => void) {
    this.checkDb();
    return onSnapshot(doc(db!, 'users', uid), (snap) => {
      if (snap.exists()) callback(snap.data() as User);
      else callback(null);
    }, (err) => {
        console.error("User subscription error:", err);
        if (onError) onError(err);
        else callback(null);
    });
  }

  subscribeToUsers(callback: (users: User[]) => void, role: UserRole) {
    this.checkDb();
    const q = query(collection(db!, 'users'), where('role', '==', role));
    return onSnapshot(q, (snap) => {
      callback(snap.docs.map(d => ({ ...d.data(), uid: d.id } as User)));
    }, (err) => {
      console.error("Users subscription error:", err);
      callback([]);
    });
  }

  async saveUser(user: User) {
    this.checkDb();
    await setDoc(doc(db!, 'users', user.uid), this.cleanData(user), { merge: true });
  }

  // --- Dashboard Stats ---
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

  // --- Curriculum & Content ---
  async getCurriculum(): Promise<Curriculum[]> {
    this.checkDb();
    const snap = await getDocs(collection(db!, 'curriculum'));
    return snap.docs.map(d => ({ ...d.data(), id: d.id } as Curriculum));
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

  async saveAppBranding(branding: AppBranding) {
    this.checkDb();
    await setDoc(doc(db!, 'settings', 'branding'), this.cleanData(branding));
  }

  async getHomePageContent(): Promise<HomePageContent[]> {
    this.checkDb();
    const snap = await getDocs(query(collection(db!, 'homePageContent'), orderBy('createdAt', 'desc')));
    return snap.docs.map(d => ({ ...d.data(), id: d.id } as HomePageContent));
  }

  async saveHomePageContent(content: Partial<HomePageContent>) {
    this.checkDb();
    if (content.id) {
        await setDoc(doc(db!, 'homePageContent', content.id), this.cleanData(content), { merge: true });
    } else {
        await addDoc(collection(db!, 'homePageContent'), this.cleanData(content));
    }
  }

  async deleteHomePageContent(id: string) {
    this.checkDb();
    await deleteDoc(doc(db!, 'homePageContent', id));
  }

  // --- Payments & Financials ---
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

  async savePaymentSettings(settings: PaymentSettings) {
    this.checkDb();
    await setDoc(doc(db!, 'settings', 'payment'), this.cleanData(settings));
  }

  async getSubscriptionPlans(): Promise<SubscriptionPlan[]> {
    this.checkDb();
    const DEFAULT_PLANS: SubscriptionPlan[] = [
        { id: 'plan_premium', name: 'باقة التفوق (Premium)', price: 35, tier: 'premium', duration: 'term', features: ['دخول كامل لجميع الدروس', 'مشاهدة فيديوهات Veo', 'بنك الأسئلة المطور', 'تواصل مباشر مع المعلم'] },
        { id: 'plan_basic', name: 'الباقة الأساسية (Basic)', price: 0, tier: 'free', duration: 'monthly', features: ['معاينة الوحدة الأولى', 'المساعد الذكي المحدود'] }
    ];

    try {
        const snap = await getDocs(collection(db!, 'subscriptionPlans'));
        if (snap.empty) return DEFAULT_PLANS;
        return snap.docs.map(d => ({ ...d.data(), id: d.id } as SubscriptionPlan));
    } catch (e) { return DEFAULT_PLANS; }
  }

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

  subscribeToInvoices(uid: string, callback: (invoices: Invoice[]) => void) {
    this.checkDb();
    const q = query(collection(db!, 'invoices'), where('userId', '==', uid));
    return onSnapshot(q, (snap) => {
      const list = snap.docs.map(d => ({ ...d.data(), id: d.id } as Invoice));
      list.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
      callback(list);
    });
  }

  async updateStudentSubscription(uid: string, tier: 'free' | 'premium', amount: number) {
    this.checkDb();
    await updateDoc(doc(db!, 'users', uid), { subscription: tier });
  }

  // --- Exams & Quizzes ---
  async getQuizzes(): Promise<Quiz[]> {
    this.checkDb();
    const snap = await getDocs(collection(db!, 'quizzes'));
    return snap.docs.map(d => ({ ...d.data(), id: d.id } as Quiz));
  }

  async getQuizById(id: string): Promise<Quiz | null> {
    this.checkDb();
    const snap = await getDoc(doc(db!, 'quizzes', id));
    return snap.exists() ? ({ ...snap.data(), id: snap.id } as Quiz) : null;
  }

  async getQuestionsForQuiz(quizId: string): Promise<Question[]> {
    this.checkDb();
    const quiz = await this.getQuizById(quizId);
    if (!quiz || !quiz.questionIds.length) return [];
    const q = query(collection(db!, 'questions'), where(documentId(), 'in', quiz.questionIds));
    const snap = await getDocs(q);
    return snap.docs.map(d => ({ ...d.data(), id: d.id } as Question));
  }

  async getAllQuestions(): Promise<Question[]> {
    this.checkDb();
    const snap = await getDocs(collection(db!, 'questions'));
    return snap.docs.map(d => ({ ...d.data(), id: d.id } as Question));
  }

  async saveAttempt(attempt: StudentQuizAttempt) {
    this.checkDb();
    await setDoc(doc(db!, 'attempts', attempt.id), this.cleanData(attempt));
  }

  async getUserAttempts(uid: string, quizId?: string): Promise<StudentQuizAttempt[]> {
    this.checkDb();
    let q = query(collection(db!, 'attempts'), where('studentId', '==', uid));
    if (quizId) q = query(q, where('quizId', '==', quizId));
    const snap = await getDocs(q);
    return snap.docs.map(d => ({ ...d.data(), id: d.id } as StudentQuizAttempt));
  }

  // --- Forums ---
  async getForumSections(): Promise<ForumSection[]> {
    this.checkDb();
    const snap = await getDocs(query(collection(db!, 'forumSections'), orderBy('order')));
    return snap.docs.map(d => ({ ...d.data(), id: d.id } as ForumSection));
  }

  async getForumPosts(forumId?: string): Promise<ForumPost[]> {
    this.checkDb();
    const postsRef = collection(db!, 'forumPosts');
    let q = forumId ? query(postsRef, where('tags', 'array-contains', forumId)) : query(postsRef, limit(100));
    const snap = await getDocs(q);
    return snap.docs.map(d => ({ ...d.data(), id: d.id } as ForumPost));
  }

  async createForumPost(post: Omit<ForumPost, 'id'>) {
    this.checkDb();
    await addDoc(collection(db!, 'forumPosts'), this.cleanData(post));
  }

  // --- Notifications ---
  subscribeToNotifications(uid: string, callback: (notifications: AppNotification[]) => void) {
    this.checkDb();
    const q = query(collection(db!, 'notifications'), where('userId', '==', uid), orderBy('timestamp', 'desc'), limit(50));
    return onSnapshot(q, (snap) => {
      callback(snap.docs.map(d => ({ ...d.data(), id: d.id } as AppNotification)));
    }, (err) => {
        console.error("Notifications subscription error:", err);
    });
  }

  async getNotifications(uid: string): Promise<AppNotification[]> {
    this.checkDb();
    const q = query(collection(db!, 'notifications'), where('userId', '==', uid), orderBy('timestamp', 'desc'), limit(50));
    const snap = await getDocs(q);
    return snap.docs.map(d => ({ ...d.data(), id: d.id } as AppNotification));
  }

  async createNotification(notification: Omit<AppNotification, 'id'>) {
    this.checkDb();
    await addDoc(collection(db!, 'notifications'), this.cleanData(notification));
  }

  // --- Health Checks ---
  async checkConnection() {
    try { this.checkDb(); await getDocs(query(collection(db!, 'settings'), limit(1))); return { alive: true }; }
    catch (e: any) { return { alive: false, error: e.message }; }
  }

  async checkSupabaseConnection() {
    try { const { data, error } = await supabase.storage.listBuckets(); if (error) throw error; return { alive: true }; }
    catch (e: any) { return { alive: false, error: e.message }; }
  }

  // --- Storage ---
  async uploadAsset(file: File): Promise<Asset> {
    const name = `${Date.now()}_${file.name}`;
    const { error } = await supabase.storage.from('assets').upload(name, file);
    if (error) throw error;
    const publicUrl = supabase.storage.from('assets').getPublicUrl(name).data.publicUrl;
    return { name, url: publicUrl, type: file.type, size: file.size };
  }

  async listAssets(): Promise<Asset[]> {
    const { data, error } = await supabase.storage.from('assets').list();
    if (error) throw error;
    return data.map(item => ({
      name: item.name,
      url: supabase.storage.from('assets').getPublicUrl(item.name).data.publicUrl,
      type: item.metadata?.mimetype || 'unknown',
      size: item.metadata?.size || 0
    }));
  }

  async deleteAsset(name: string) {
    await supabase.storage.from('assets').remove([name]);
  }
  
  // --- Admin Logic ---
  async getAdmins(): Promise<User[]> {
    this.checkDb();
    const q = query(collection(db!, 'users'), where('role', '==', 'admin'));
    const snap = await getDocs(q);
    return snap.docs.map(d => ({ ...d.data(), uid: d.id } as User));
  }
  
  async getTeachers(): Promise<User[]> {
    this.checkDb();
    const q = query(collection(db!, 'users'), where('role', '==', 'teacher'));
    const snap = await getDocs(q);
    return snap.docs.map(d => ({ ...d.data(), uid: d.id } as User));
  }

  async getLoggingSettings(): Promise<LoggingSettings> {
    this.checkDb();
    try {
        const snap = await getDoc(doc(db!, 'settings', 'logging'));
        if (snap.exists()) return snap.data() as LoggingSettings;
    } catch (e) {}
    return { logStudentProgress: true, saveAllQuizAttempts: true, logAIChatHistory: true, archiveTeacherMessages: true, forumAccessTier: 'free' };
  }

  async saveLoggingSettings(settings: LoggingSettings) {
    this.checkDb();
    await setDoc(doc(db!, 'settings', 'logging'), this.cleanData(settings));
  }

  async getNotificationSettings(): Promise<NotificationSettings> {
    this.checkDb();
    try {
        const snap = await getDoc(doc(db!, 'settings', 'notifications'));
        if (snap.exists()) return snap.data() as NotificationSettings;
    } catch (e) {}
    return { pushForLiveSessions: true, pushForGradedQuizzes: true, pushForAdminAlerts: true };
  }

  async saveNotificationSettings(settings: NotificationSettings) {
    this.checkDb();
    await setDoc(doc(db!, 'settings', 'notifications'), this.cleanData(settings));
  }

  async getInvoiceSettings(): Promise<InvoiceSettings> {
    this.checkDb();
    try {
        const snap = await getDoc(doc(db!, 'settings', 'invoice_design'));
        if (snap.exists()) return snap.data() as InvoiceSettings;
    } catch (e) {}
    return { headerText: 'إيصال دفع رقمي معتمد', footerText: 'إثبات رسمي من المركز السوري للعلوم.', accentColor: '#fbbf24', showSignature: true, signatureName: 'إدارة المركز', showWatermark: true, watermarkText: 'SSC KUWAIT' };
  }

  async saveInvoiceSettings(settings: InvoiceSettings) {
    this.checkDb();
    await setDoc(doc(db!, 'settings', 'invoice_design'), this.cleanData(settings));
  }

  async getLiveSessions(): Promise<LiveSession[]> {
    this.checkDb();
    const snap = await getDocs(collection(db!, 'liveSessions'));
    return snap.docs.map(d => ({ ...d.data(), id: d.id } as LiveSession));
  }
  
  subscribeToLiveSessions(callback: (sessions: LiveSession[]) => void) {
    this.checkDb();
    return onSnapshot(collection(db!, 'liveSessions'), (snap) => {
      callback(snap.docs.map(d => ({ ...d.data(), id: d.id } as LiveSession)));
    });
  }

  async saveLiveSession(session: Partial<LiveSession>) {
    this.checkDb();
    if (session.id) {
        await setDoc(doc(db!, 'liveSessions', session.id), this.cleanData(session), { merge: true });
    } else {
        await addDoc(collection(db!, 'liveSessions'), this.cleanData(session));
    }
  }

  async deleteLiveSession(id: string) {
    this.checkDb();
    await deleteDoc(doc(db!, 'liveSessions', id));
  }
  
  async getResources(): Promise<EducationalResource[]> {
    this.checkDb();
    const snap = await getDocs(collection(db!, 'resources'));
    return snap.docs.map(d => ({ ...d.data(), id: d.id } as EducationalResource));
  }

  // --- Dynamic Experiments CRUD ---
  async getExperiments(grade?: string): Promise<PhysicsExperiment[]> {
    this.checkDb();
    let q = query(collection(db!, 'experiments'));
    if (grade) q = query(q, where('grade', '==', grade));
    const snap = await getDocs(q);
    return snap.docs.map(d => ({ ...d.data(), id: d.id } as PhysicsExperiment));
  }

  async saveExperiment(exp: Partial<PhysicsExperiment>) {
      this.checkDb();
      if (exp.id) {
          await setDoc(doc(db!, 'experiments', exp.id), this.cleanData(exp), { merge: true });
      } else {
          await addDoc(collection(db!, 'experiments'), this.cleanData(exp));
      }
  }

  async deleteExperiment(id: string) {
      this.checkDb();
      await deleteDoc(doc(db!, 'experiments', id));
  }

  async getEquations(): Promise<PhysicsEquation[]> {
    this.checkDb();
    const snap = await getDocs(collection(db!, 'equations'));
    return snap.docs.map(d => ({ ...d.data(), id: d.id } as PhysicsEquation));
  }

  async getArticles(): Promise<Article[]> {
    this.checkDb();
    const snap = await getDocs(collection(db!, 'articles'));
    return snap.docs.map(d => ({ ...d.data(), id: d.id } as Article));
  }

  async getStudyGroups(): Promise<StudyGroup[]> {
    this.checkDb();
    const snap = await getDocs(collection(db!, 'studyGroups'));
    return snap.docs.map(d => ({ ...d.data(), id: d.id } as StudyGroup));
  }

  async getTodos(uid: string): Promise<Todo[]> {
    this.checkDb();
    const q = query(collection(db!, 'users', uid, 'todos'), orderBy('createdAt', 'desc'));
    const snap = await getDocs(q);
    return snap.docs.map(d => ({ ...d.data(), id: d.id } as Todo));
  }

  // --- Dynamic Recommendations CRUD ---
  async getAIRecommendations(user: User): Promise<AIRecommendation[]> {
    this.checkDb();
    // جلب التوصيات الموجهة لهذا الصف أو لهذا المستخدم تحديداً بالبريد
    const q = query(
        collection(db!, 'recommendations'), 
        where('targetGrade', 'in', [user.grade, 'all']),
        orderBy('createdAt', 'desc')
    );
    const snap = await getDocs(q);
    let recs = snap.docs.map(d => ({ ...d.data(), id: d.id } as AIRecommendation));
    
    // فلترة إضافية للموجهة لشخص بعينه إذا وجد الحقل
    return recs.filter(r => !r.targetUserEmail || r.targetUserEmail === user.email);
  }

  async saveRecommendation(rec: Partial<AIRecommendation>) {
      this.checkDb();
      await addDoc(collection(db!, 'recommendations'), {
          ...this.cleanData(rec),
          createdAt: new Date().toISOString()
      });
  }

  async deleteRecommendation(id: string) {
      this.checkDb();
      await deleteDoc(doc(db!, 'recommendations', id));
  }
  
  async getAdvancedFinancialStats() {
    const snap = await getDocs(collection(db!, 'invoices'));
    const invoices = snap.docs.map(d => d.data() as Invoice);
    const paid = invoices.filter(i => i.status === 'PAID');
    return {
      daily: paid.filter(i => i.date.startsWith(new Date().toISOString().split('T')[0])).reduce((s, i) => s + i.amount, 0),
      monthly: paid.filter(i => i.date.startsWith(new Date().toISOString().substring(0, 7))).reduce((s, i) => s + i.amount, 0),
      yearly: paid.filter(i => i.date.startsWith(new Date().getFullYear().toString())).reduce((s, i) => s + i.amount, 0),
      total: paid.reduce((s, i) => s + i.amount, 0),
      pending: invoices.filter(i => i.status === 'PENDING').length
    };
  }

  async getAttemptsForQuiz(quizId: string): Promise<StudentQuizAttempt[]> {
    this.checkDb();
    const q = query(collection(db!, 'attempts'), where('quizId', '==', quizId));
    const snap = await getDocs(q);
    return snap.docs.map(d => ({ ...d.data(), id: d.id } as StudentQuizAttempt));
  }

  async updateAttempt(attempt: StudentQuizAttempt) {
    this.checkDb();
    await updateDoc(doc(db!, 'attempts', attempt.id), this.cleanData(attempt));
  }

  async deleteInvoice(id: string) {
    this.checkDb();
    await deleteDoc(doc(db!, 'invoices', id));
  }

  async getInvoices(): Promise<{ data: Invoice[] }> {
    this.checkDb();
    const snap = await getDocs(query(collection(db!, 'invoices'), orderBy('date', 'desc')));
    return { data: snap.docs.map(d => ({ ...d.data(), id: d.id } as Invoice)) };
  }

  async createManualInvoice(userId: string, planId: string, amount: number): Promise<Invoice> {
    this.checkDb();
    const user = await this.getUser(userId);
    const invoice: Omit<Invoice, 'id'> = {
      userId, userName: user?.name || 'Student', planId, amount, date: new Date().toISOString(), status: 'PAID',
      trackId: 'MANUAL-' + Math.random().toString(36).substring(7).toUpperCase()
    };
    const docRef = await addDoc(collection(db!, 'invoices'), invoice);
    await this.updateStudentSubscription(userId, 'premium', amount);
    return { ...invoice, id: docRef.id };
  }

  async updateUserRole(uid: string, role: UserRole) {
    this.checkDb();
    await updateDoc(doc(db!, 'users', uid), { role });
  }

  async deleteUser(uid: string) {
    this.checkDb();
    await deleteDoc(doc(db!, 'users', uid));
  }

  async deleteQuiz(id: string) {
    this.checkDb();
    await deleteDoc(doc(db!, 'quizzes', id));
  }

  async saveQuiz(quiz: Quiz) {
    this.checkDb();
    await setDoc(doc(db!, 'quizzes', quiz.id), this.cleanData(quiz), { merge: true });
  }

  async saveQuestion(question: Question): Promise<string> {
    this.checkDb();
    const docRef = await addDoc(collection(db!, 'questions'), this.cleanData(question));
    return docRef.id;
  }

  async updateQuestion(id: string, updates: Partial<Question>) {
    this.checkDb();
    await updateDoc(doc(db!, 'questions', id), this.cleanData(updates));
  }

  async markNotificationsAsRead(uid: string) {
    this.checkDb();
    const q = query(collection(db!, 'notifications'), where('userId', '==', uid), where('isRead', '==', false));
    const snap = await getDocs(q);
    const batch = writeBatch(db!);
    snap.forEach(d => batch.update(d.ref, { isRead: true }));
    await batch.commit();
  }

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

  async updateUnitsOrder(curriculumId: string, units: Unit[]) {
    this.checkDb();
    await updateDoc(doc(db!, 'curriculum', curriculumId), { units });
  }

  async deleteUnit(curriculumId: string, unitId: string) {
    this.checkDb();
    const curRef = doc(db!, 'curriculum', curriculumId);
    const snap = await getDoc(curRef);
    if (!snap.exists()) return;
    const data = snap.data() as Curriculum;
    data.units = data.units.filter(u => u.id !== unitId);
    await updateDoc(curRef, { units: data.units });
  }

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

  async getStudentProgressForParent(uid: string) {
    const user = await this.getUser(uid);
    return { user, report: user?.weeklyReports?.[0] || null };
  }

  async getTeacherReviews(teacherId: string): Promise<Review[]> {
    this.checkDb();
    const q = query(collection(db!, 'reviews'), where('teacherId', '==', teacherId), orderBy('timestamp', 'desc'));
    const snap = await getDocs(q);
    return snap.docs.map(d => ({ ...d.data(), id: d.id } as Review));
  }

  async addReview(review: Review) {
    this.checkDb();
    await addDoc(collection(db!, 'reviews'), this.cleanData(review));
  }

  async saveTeacherMessage(message: TeacherMessage) {
    this.checkDb();
    await addDoc(collection(db!, 'teacherMessages'), this.cleanData(message));
  }

  async getAllTeacherMessages(teacherId: string): Promise<TeacherMessage[]> {
    this.checkDb();
    const q = query(collection(db!, 'teacherMessages'), where('teacherId', '==', teacherId), orderBy('timestamp', 'desc'));
    const snap = await getDocs(q);
    return snap.docs.map(d => ({ ...d.data(), id: d.id } as TeacherMessage));
  }

  async initializeForumSystem() {
    this.checkDb();
    const sections = [
      { title: 'القسم العام', description: 'نقاشات عامة حول العلوم والفيزياء.', order: 0, forums: [
        { id: 'general-discussions', title: 'نقاشات مفتوحة', description: 'تحدث مع زملائك في أي موضوع علمي.', icon: '🌍', order: 0 }
      ]}
    ];
    for (const sec of sections) await addDoc(collection(db!, 'forumSections'), sec);
  }

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

  async updateForumPost(postId: string, updates: Partial<ForumPost>) {
    this.checkDb();
    await updateDoc(doc(db!, 'forumPosts', postId), this.cleanData(updates));
  }

  async deleteForumPost(postId: string) {
    this.checkDb();
    await deleteDoc(doc(db!, 'forumPosts', postId));
  }

  async addForumReply(postId: string, reply: Omit<ForumReply, 'id' | 'timestamp' | 'upvotes'>) {
    this.checkDb();
    const postRef = doc(db!, 'forumPosts', postId);
    const snap = await getDoc(postRef);
    if (snap.exists()) {
      const data = snap.data() as ForumPost;
      const replies = data.replies || [];
      replies.push({ ...reply, id: `rep_${Date.now()}`, timestamp: new Date().toISOString(), upvotes: 0 });
      await updateDoc(postRef, { replies });
    }
  }

  async saveTodo(uid: string, todo: Omit<Todo, 'id'>): Promise<string> {
    this.checkDb();
    const docRef = await addDoc(collection(db!, 'users', uid, 'todos'), this.cleanData(todo));
    return docRef.id;
  }

  async updateTodo(uid: string, todoId: string, updates: Partial<Todo>) {
    this.checkDb();
    await updateDoc(doc(db!, 'users', uid, 'todos', todoId), this.cleanData(updates));
  }

  async deleteTodo(uid: string, todoId: string) {
    this.checkDb();
    await deleteDoc(doc(db!, 'users', uid, 'todos', todoId));
  }
}

export const dbService = new DBService();


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

  // --- 📊 إحصائيات لحظية (V14 - Real-time Stats) ---
  subscribeToGlobalStats(callback: (stats: any) => void) {
    this.checkDb();
    // مراقبة مجموعة المستخدمين بالكامل
    return onSnapshot(collection(db!, 'users'), (snap) => {
        const allUsers = snap.docs.map(d => d.data() as User);
        const students = allUsers.filter(u => u.role === 'student');
        const teachers = allUsers.filter(u => u.role === 'teacher');
        
        callback({
            totalStudents: students.length,
            maleStudents: students.filter(s => s.gender === 'male').length,
            femaleStudents: students.filter(s => s.gender === 'female').length,
            totalTeachers: teachers.length,
            total: students.length + teachers.length
        });
    });
  }

  async getGlobalStats() {
    this.checkDb();
    try {
        const usersSnap = await getDocs(collection(db!, 'users'));
        const allUsers = usersSnap.docs.map(d => d.data() as User);
        const students = allUsers.filter(u => u.role === 'student');
        return {
            totalStudents: students.length,
            maleStudents: students.filter(s => s.gender === 'male').length,
            femaleStudents: students.filter(s => s.gender === 'female').length,
            totalTeachers: allUsers.filter(u => u.role === 'teacher').length,
            total: allUsers.length
        };
    } catch (e) { return { totalStudents: 0, maleStudents: 0, femaleStudents: 0, totalTeachers: 0, total: 0 }; }
  }

  // --- 🛠️ وضع الصيانة ---
  async getMaintenanceSettings(): Promise<MaintenanceSettings> {
    this.checkDb();
    const defaults: MaintenanceSettings = { isMaintenanceActive: false, expectedReturnTime: new Date(Date.now() + 3600000).toISOString(), maintenanceMessage: "يتم حالياً تطوير المنصة لتحسين تجربة الطالب.", showCountdown: false, allowTeachers: true };
    try {
        const snap = await getDoc(doc(db!, 'settings', 'maintenance'));
        if (snap.exists()) return { ...defaults, ...snap.data() } as MaintenanceSettings;
    } catch (e) {}
    return defaults;
  }

  async saveMaintenanceSettings(settings: MaintenanceSettings) {
    this.checkDb();
    await setDoc(doc(db!, 'settings', 'maintenance'), this.cleanData(settings), { merge: true });
  }

  subscribeToMaintenance(callback: (settings: MaintenanceSettings) => void) {
    this.checkDb();
    const defaults: MaintenanceSettings = { isMaintenanceActive: false, expectedReturnTime: '', maintenanceMessage: '', showCountdown: false, allowTeachers: true };
    return onSnapshot(doc(db!, 'settings', 'maintenance'), (snap) => {
        if (snap.exists()) {
            callback({ ...defaults, ...snap.data() } as MaintenanceSettings);
        } else {
            callback(defaults);
        }
    });
  }

  // --- 👤 خدمات المستخدمين ---
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
    } catch (e) {}
    return null;
  }

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

  async saveUser(user: User) {
    this.checkDb();
    await setDoc(doc(db!, 'users', user.uid), this.cleanData(user), { merge: true });
  }

  // --- 💰 الإعدادات المالية (Robust Merge V12.1) ---
  async getPaymentSettings(): Promise<PaymentSettings> {
    this.checkDb();
    const defaults: PaymentSettings = { isOnlinePaymentEnabled: false, womdaPhoneNumber: '55315661', planPrices: { premium: 35, basic: 0 } };
    try {
        const snap = await getDoc(doc(db!, 'settings', 'payment'));
        if (snap.exists()) {
            const data = snap.data();
            return {
                ...defaults,
                ...data,
                planPrices: { ...defaults.planPrices, ...(data.planPrices || {}) }
            } as PaymentSettings;
        }
    } catch (e) {}
    return defaults;
  }

  async savePaymentSettings(settings: PaymentSettings) {
    this.checkDb();
    await setDoc(doc(db!, 'settings', 'payment'), this.cleanData(settings), { merge: true });
  }

  async getInvoiceSettings(): Promise<InvoiceSettings> {
    this.checkDb();
    const defaults: InvoiceSettings = { headerText: 'إيصال دفع رقمي معتمد', footerText: 'إثبات رسمي من المركز السوري للعلوم.', accentColor: '#fbbf24', showSignature: true, signatureName: 'إدارة المركز', showWatermark: true, watermarkText: 'SSC KUWAIT' };
    try {
        const snap = await getDoc(doc(db!, 'settings', 'invoice_design'));
        if (snap.exists()) return { ...defaults, ...snap.data() } as InvoiceSettings;
    } catch (e) {}
    return defaults;
  }

  async saveInvoiceSettings(settings: InvoiceSettings) {
    this.checkDb();
    await setDoc(doc(db!, 'settings', 'invoice_design'), this.cleanData(settings), { merge: true });
  }

  async getAppBranding(): Promise<AppBranding> {
    this.checkDb();
    const defaults = { logoUrl: 'https://spxlxypbosipfwbijbjk.supabase.co/storage/v1/object/public/assets/1769130153314_IMG_2848.png', appName: 'المركز السوري للعلوم' };
    try {
        const snap = await getDoc(doc(db!, 'settings', 'branding'));
        if (snap.exists()) return { ...defaults, ...snap.data() } as AppBranding;
    } catch (e) {}
    return defaults;
  }

  async saveAppBranding(branding: AppBranding) {
    this.checkDb();
    await setDoc(doc(db!, 'settings', 'branding'), this.cleanData(branding), { merge: true });
  }

  // --- 📚 المناهج والمحتوى ---
  async getCurriculum(): Promise<Curriculum[]> {
    this.checkDb();
    const snap = await getDocs(collection(db!, 'curriculum'));
    return snap.docs.map(d => ({ ...d.data(), id: d.id } as Curriculum));
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

  // --- 🧾 الفواتير والعمليات المالية ---
  async getInvoices(): Promise<{ data: Invoice[] }> {
    this.checkDb();
    const snap = await getDocs(query(collection(db!, 'invoices'), orderBy('date', 'desc')));
    return { data: snap.docs.map(d => ({ ...d.data(), id: d.id } as Invoice)) };
  }

  async getAdvancedFinancialStats() {
    this.checkDb();
    const snap = await getDocs(collection(db!, 'invoices'));
    const invoices = snap.docs.map(d => d.data() as Invoice);
    const paid = invoices.filter(i => i.status === 'PAID');
    const now = new Date();
    return {
      daily: paid.filter(i => i.date.startsWith(now.toISOString().split('T')[0])).reduce((s, i) => s + i.amount, 0),
      monthly: paid.filter(i => i.date.startsWith(now.toISOString().substring(0, 7))).reduce((s, i) => s + i.amount, 0),
      yearly: paid.filter(i => i.date.startsWith(now.getFullYear().toString())).reduce((s, i) => s + i.amount, 0),
      total: paid.reduce((s, i) => s + i.amount, 0),
      pending: invoices.filter(i => i.status === 'PENDING').length
    };
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

  async createManualInvoice(userId: string, planId: string, amount: number): Promise<Invoice> {
    this.checkDb();
    const user = await this.getUser(userId);
    const invoice: Omit<Invoice, 'id'> = {
      userId, 
      userName: user?.name || 'Student', 
      planId, 
      amount, 
      date: new Date().toISOString(), 
      status: 'PAID',
      trackId: 'MANUAL-' + Math.random().toString(36).substring(7).toUpperCase(),
      authCode: 'APPROVED-BY-ADMIN'
    };
    const docRef = await addDoc(collection(db!, 'invoices'), this.cleanData(invoice));
    await this.updateStudentSubscription(userId, 'premium', amount);
    return { ...invoice, id: docRef.id };
  }

  async deleteInvoice(id: string) {
    this.checkDb();
    await deleteDoc(doc(db!, 'invoices', id));
  }

  // --- ❓ الاختبارات وبنك الأسئلة ---
  async getQuizzes(): Promise<Quiz[]> { this.checkDb(); const snap = await getDocs(collection(db!, 'quizzes')); return snap.docs.map(d => ({ ...d.data(), id: d.id } as Quiz)); }
  async getQuizById(id: string): Promise<Quiz | null> { this.checkDb(); const snap = await getDoc(doc(db!, 'quizzes', id)); return snap.exists() ? ({ ...snap.data(), id: snap.id } as Quiz) : null; }
  async getQuestionsForQuiz(quizId: string): Promise<Question[]> { this.checkDb(); const quiz = await this.getQuizById(quizId); if (!quiz || !quiz.questionIds.length) return []; const q = query(collection(db!, 'questions'), where(documentId(), 'in', quiz.questionIds)); const snap = await getDocs(q); return snap.docs.map(d => ({ ...d.data(), id: d.id } as Question)); }
  async getAllQuestions(): Promise<Question[]> { this.checkDb(); const snap = await getDocs(collection(db!, 'questions')); return snap.docs.map(d => ({ ...d.data(), id: d.id } as Question)); }
  async saveAttempt(attempt: StudentQuizAttempt) { this.checkDb(); await setDoc(doc(db!, 'attempts', attempt.id), this.cleanData(attempt)); }
  async getUserAttempts(uid: string, quizId?: string): Promise<StudentQuizAttempt[]> { this.checkDb(); let q = query(collection(db!, 'attempts'), where('studentId', '==', uid)); if (quizId) q = query(q, where('quizId', '==', quizId)); const snap = await getDocs(q); return snap.docs.map(d => ({ ...d.data(), id: d.id } as StudentQuizAttempt)); }
  async getAttemptsForQuiz(quizId: string): Promise<StudentQuizAttempt[]> { this.checkDb(); const q = query(collection(db!, 'attempts'), where('quizId', '==', quizId)); const snap = await getDocs(q); return snap.docs.map(d => ({ ...d.data(), id: d.id } as StudentQuizAttempt)); }
  async updateAttempt(attempt: StudentQuizAttempt) { this.checkDb(); await setDoc(doc(db!, 'attempts', attempt.id), this.cleanData(attempt), { merge: true }); }
  async saveQuiz(quiz: Quiz) { this.checkDb(); await setDoc(doc(db!, 'quizzes', quiz.id), this.cleanData(quiz), { merge: true }); }
  async deleteQuiz(id: string) { this.checkDb(); await deleteDoc(doc(db!, 'quizzes', id)); }
  async saveQuestion(question: Question): Promise<string> { this.checkDb(); const docRef = await addDoc(collection(db!, 'questions'), this.cleanData(question)); return docRef.id; }
  async updateQuestion(id: string, updates: Partial<Question>) { this.checkDb(); await updateDoc(doc(db!, 'questions', id), this.cleanData(updates)); }

  // --- 🖼️ خدمات الملفات ---
  async uploadAsset(file: File): Promise<Asset> { const name = `${Date.now()}_${file.name}`; const { error } = await supabase.storage.from('assets').upload(name, file); if (error) throw error; const publicUrl = supabase.storage.from('assets').getPublicUrl(name).data.publicUrl; return { name, url: publicUrl, type: file.type, size: file.size }; }
  async listAssets(): Promise<Asset[]> { const { data, error } = await supabase.storage.from('assets').list(); if (error) throw error; return data.map(item => ({ name: item.name, url: supabase.storage.from('assets').getPublicUrl(item.name).data.publicUrl, type: item.metadata?.mimetype || 'unknown', size: item.metadata?.size || 0 })); }
  async deleteAsset(name: string) { await supabase.storage.from('assets').remove([name]); }

  // --- 🔔 الإشعارات ---
  subscribeToNotifications(uid: string, callback: (notifications: AppNotification[]) => void) { this.checkDb(); const q = query(collection(db!, 'notifications'), where('userId', '==', uid), orderBy('timestamp', 'desc'), limit(50)); return onSnapshot(q, (snap) => callback(snap.docs.map(d => ({ ...d.data(), id: d.id } as AppNotification)))); }
  // Fix: Added missing getNotifications method required by ParentPortal to fetch historical notifications
  async getNotifications(uid: string): Promise<AppNotification[]> { this.checkDb(); const q = query(collection(db!, 'notifications'), where('userId', '==', uid), orderBy('timestamp', 'desc'), limit(50)); const snap = await getDocs(q); return snap.docs.map(d => ({ ...d.data(), id: d.id } as AppNotification)); }
  async createNotification(notification: Omit<AppNotification, 'id'>) { this.checkDb(); await addDoc(collection(db!, 'notifications'), this.cleanData(notification)); }
  async markNotificationsAsRead(uid: string) { this.checkDb(); const q = query(collection(db!, 'notifications'), where('userId', '==', uid), where('isRead', '==', false)); const snap = await getDocs(q); const batch = writeBatch(db!); snap.forEach(d => batch.update(d.ref, { isRead: true })); await batch.commit(); }

  // --- 💬 المنتديات والرسائل ---
  async getForumSections(): Promise<ForumSection[]> { this.checkDb(); const snap = await getDocs(query(collection(db!, 'forumSections'), orderBy('order'))); return snap.docs.map(d => ({ ...d.data(), id: d.id } as ForumSection)); }
  async getForumPosts(forumId?: string): Promise<ForumPost[]> { this.checkDb(); const postsRef = collection(db!, 'forumPosts'); let q = forumId ? query(postsRef, where('tags', 'array-contains', forumId)) : query(postsRef, limit(100)); const snap = await getDocs(q); return snap.docs.map(d => ({ ...d.data(), id: d.id } as ForumPost)); }
  async createForumPost(post: Omit<ForumPost, 'id'>) { this.checkDb(); await addDoc(collection(db!, 'forumPosts'), this.cleanData(post)); }
  async addForumReply(postId: string, reply: Omit<ForumReply, 'id' | 'timestamp' | 'upvotes'>) { this.checkDb(); const postRef = doc(db!, 'forumPosts', postId); const snap = await getDoc(postRef); if (snap.exists()) { const data = snap.data() as ForumPost; const replies = data.replies || []; replies.push({ ...reply, id: `rep_${Date.now()}`, timestamp: new Date().toISOString(), upvotes: 0 }); await updateDoc(postRef, { replies }); } }
  async saveForumSections(sections: ForumSection[]) { this.checkDb(); const batch = writeBatch(db!); const existing = await getDocs(collection(db!, 'forumSections')); existing.forEach(d => batch.delete(d.ref)); sections.forEach(sec => { const newRef = doc(collection(db!, 'forumSections')); batch.set(newRef, this.cleanData(sec)); }); await batch.commit(); }
  async updateForumPost(postId: string, updates: Partial<ForumPost>) { this.checkDb(); await updateDoc(doc(db!, 'forumPosts', postId), this.cleanData(updates)); }
  async deleteForumPost(postId: string) { this.checkDb(); await deleteDoc(doc(db!, 'forumPosts', postId)); }
  async initializeForumSystem() { this.checkDb(); const sections = [ { title: 'القسم العام', description: 'نقاشات عامة حول العلوم والفيزياء.', order: 0, forums: [ { id: 'general-discussions', title: 'نقاشات مفتوحة', description: 'تحدث مع زملائك في أي موضوع علمي.', icon: '🌍', order: 0 } ]} ]; for (const sec of sections) await addDoc(collection(db!, 'forumSections'), sec); }

  // --- 🎥 الحصص المباشرة والمختبرات ---
  async getLiveSessions(): Promise<LiveSession[]> { this.checkDb(); const snap = await getDocs(collection(db!, 'liveSessions')); return snap.docs.map(d => ({ ...d.data(), id: d.id } as LiveSession)); }
  subscribeToLiveSessions(callback: (sessions: LiveSession[]) => void) { this.checkDb(); return onSnapshot(collection(db!, 'liveSessions'), (snap) => callback(snap.docs.map(d => ({ ...d.data(), id: d.id } as LiveSession)))); }
  async saveLiveSession(session: Partial<LiveSession>) { this.checkDb(); if (session.id) { await setDoc(doc(db!, 'liveSessions', session.id), this.cleanData(session), { merge: true }); } else { await addDoc(collection(db!, 'liveSessions'), this.cleanData(session)); } }
  async deleteLiveSession(id: string) { this.checkDb(); await deleteDoc(doc(db!, 'liveSessions', id)); }
  async getExperiments(grade?: string): Promise<PhysicsExperiment[]> { this.checkDb(); let q = query(collection(db!, 'experiments')); if (grade) q = query(q, where('grade', '==', grade)); const snap = await getDocs(q); return snap.docs.map(d => ({ ...d.data(), id: d.id } as PhysicsExperiment)); }
  async saveExperiment(exp: Partial<PhysicsExperiment>) { this.checkDb(); if (exp.id) { await setDoc(doc(db!, 'experiments', exp.id), this.cleanData(exp), { merge: true }); } else { await addDoc(collection(db!, 'experiments'), this.cleanData(exp)); } }
  async deleteExperiment(id: string) { this.checkDb(); await deleteDoc(doc(db!, 'experiments', id)); }
  async getResources(): Promise<EducationalResource[]> { this.checkDb(); const snap = await getDocs(collection(db!, 'resources')); return snap.docs.map(d => ({ ...d.data(), id: d.id } as EducationalResource)); }
  async getEquations(): Promise<PhysicsEquation[]> { this.checkDb(); const snap = await getDocs(collection(db!, 'equations')); return snap.docs.map(d => ({ ...d.data(), id: d.id } as PhysicsEquation)); }
  async getArticles(): Promise<Article[]> { this.checkDb(); const snap = await getDocs(collection(db!, 'articles')); return snap.docs.map(d => ({ ...d.data(), id: d.id } as Article)); }
  async getStudyGroups(): Promise<StudyGroup[]> { this.checkDb(); const snap = await getDocs(collection(db!, 'studyGroups')); return snap.docs.map(d => ({ ...d.data(), id: d.id } as StudyGroup)); }

  // --- 🧠 خدمات المعلم والطلاب ---
  async getTeachers(): Promise<User[]> { this.checkDb(); const q = query(collection(db!, 'users'), where('role', '==', 'teacher')); const snap = await getDocs(q); return snap.docs.map(d => ({ ...d.data(), uid: d.id } as User)); }
  async getAdmins(): Promise<User[]> { this.checkDb(); const q = query(collection(db!, 'users'), where('role', '==', 'admin')); const snap = await getDocs(q); return snap.docs.map(d => ({ ...d.data(), uid: d.id } as User)); }
  async updateUserRole(uid: string, role: UserRole) { this.checkDb(); await updateDoc(doc(db!, 'users', uid), { role }); }
  async deleteUser(uid: string) { this.checkDb(); await deleteDoc(doc(db!, 'users', uid)); }
  async getTeacherReviews(teacherId: string): Promise<Review[]> { this.checkDb(); const q = query(collection(db!, 'reviews'), where('teacherId', '==', teacherId), orderBy('timestamp', 'desc')); const snap = await getDocs(q); return snap.docs.map(d => ({ ...d.data(), id: d.id } as Review)); }
  async addReview(review: Review) { this.checkDb(); await addDoc(collection(db!, 'reviews'), this.cleanData(review)); }
  async saveTeacherMessage(message: TeacherMessage) { this.checkDb(); await addDoc(collection(db!, 'teacherMessages'), this.cleanData(message)); }
  async getAllTeacherMessages(teacherId: string): Promise<TeacherMessage[]> { this.checkDb(); const q = query(collection(db!, 'teacherMessages'), where('teacherId', '==', teacherId), orderBy('timestamp', 'desc')); const snap = await getDocs(q); return snap.docs.map(d => ({ ...d.data(), id: d.id } as TeacherMessage)); }

  // --- 📓 المهام والتوصيات ---
  async getTodos(uid: string): Promise<Todo[]> { this.checkDb(); const q = query(collection(db!, 'users', uid, 'todos'), orderBy('createdAt', 'desc')); const snap = await getDocs(q); return snap.docs.map(d => ({ ...d.data(), id: d.id } as Todo)); }
  async saveTodo(uid: string, todo: Omit<Todo, 'id'>): Promise<string> { this.checkDb(); const docRef = await addDoc(collection(db!, 'users', uid, 'todos'), this.cleanData(todo)); return docRef.id; }
  async updateTodo(uid: string, todoId: string, updates: Partial<Todo>) { this.checkDb(); await updateDoc(doc(db!, 'users', uid, 'todos', todoId), this.cleanData(updates)); }
  async deleteTodo(uid: string, todoId: string) { this.checkDb(); await deleteDoc(doc(db!, 'users', uid, 'todos', todoId)); }
  async getAIRecommendations(user: User): Promise<AIRecommendation[]> { this.checkDb(); const q = query(collection(db!, 'recommendations'), where('targetGrade', 'in', [user.grade, 'all']), orderBy('createdAt', 'desc')); const snap = await getDocs(q); let recs = snap.docs.map(d => ({ ...d.data(), id: d.id } as AIRecommendation)); return recs.filter(r => !r.targetUserEmail || r.targetUserEmail === user.email); }
  async saveRecommendation(rec: Partial<AIRecommendation>) { this.checkDb(); await addDoc(collection(db!, 'recommendations'), { ...this.cleanData(rec), createdAt: new Date().toISOString() }); }
  async deleteRecommendation(id: string) { this.checkDb(); await deleteDoc(doc(db!, 'recommendations', id)); }

  // --- ⚙️ الإعدادات العامة ---
  async getLoggingSettings(): Promise<LoggingSettings> { this.checkDb(); const defaults: LoggingSettings = { logStudentProgress: true, saveAllQuizAttempts: true, logAIChatHistory: true, archiveTeacherMessages: true, forumAccessTier: 'free' }; try { const snap = await getDoc(doc(db!, 'settings', 'logging')); if (snap.exists()) return { ...defaults, ...snap.data() } as LoggingSettings; } catch (e) {} return defaults; }
  async saveLoggingSettings(settings: LoggingSettings) { this.checkDb(); await setDoc(doc(db!, 'settings', 'logging'), this.cleanData(settings), { merge: true }); }
  async getNotificationSettings(): Promise<NotificationSettings> { this.checkDb(); const defaults: NotificationSettings = { pushForLiveSessions: true, pushForGradedQuizzes: true, pushForAdminAlerts: true }; try { const snap = await getDoc(doc(db!, 'settings', 'notifications')); if (snap.exists()) return { ...defaults, ...snap.data() } as NotificationSettings; } catch (e) {} return defaults; }
  async saveNotificationSettings(settings: NotificationSettings) { this.checkDb(); await setDoc(doc(db!, 'settings', 'notifications'), this.cleanData(settings), { merge: true }); }

  // --- 🛠️ إدارة المنهج ---
  async saveLesson(curriculumId: string, unitId: string, lesson: Lesson) { this.checkDb(); const curRef = doc(db!, 'curriculum', curriculumId); const snap = await getDoc(curRef); if (!snap.exists()) throw new Error("Curriculum not found"); const data = snap.data() as Curriculum; const uIdx = data.units.findIndex(u => u.id === unitId); if (uIdx === -1) throw new Error("Unit not found"); const lessons = data.units[uIdx].lessons || []; const lIdx = lessons.findIndex(l => l.id === lesson.id); if (lIdx > -1) lessons[lIdx] = lesson; else lessons.push(lesson); data.units[uIdx].lessons = lessons; await updateDoc(curRef, { units: data.units }); }
  async saveUnit(curriculumId: string, unit: Unit, grade: string, subject: string) { this.checkDb(); const curRef = doc(db!, 'curriculum', curriculumId); const snap = await getDoc(curRef); if (!snap.exists()) { await setDoc(curRef, { grade, subject, title: `منهج ${subject}`, description: '', icon: '📚', units: [unit] }); return; } const data = snap.data() as Curriculum; const uIdx = data.units.findIndex(u => u.id === unit.id); if (uIdx > -1) data.units[uIdx] = unit; else data.units.push(unit); await updateDoc(curRef, { units: data.units }); }
  async updateUnitsOrder(curriculumId: string, units: Unit[]) { this.checkDb(); await updateDoc(doc(db!, 'curriculum', curriculumId), { units }); }
  async deleteUnit(curriculumId: string, unitId: string) { this.checkDb(); const curRef = doc(db!, 'curriculum', curriculumId); const snap = await getDoc(curRef); if (!snap.exists()) return; const data = snap.data() as Curriculum; data.units = data.units.filter(u => u.id !== unitId); await updateDoc(curRef, { units: data.units }); }
  async deleteLesson(curriculumId: string, unitId: string, lessonId: string) { this.checkDb(); const curRef = doc(db!, 'curriculum', curriculumId); const snap = await getDoc(curRef); if (!snap.exists()) return; const data = snap.data() as Curriculum; const uIdx = data.units.findIndex(u => u.id === unitId); if (uIdx > -1) { data.units[uIdx].lessons = data.units[uIdx].lessons.filter(l => l.id !== lessonId); await updateDoc(curRef, { units: data.units }); } }
  async toggleLessonComplete(uid: string, lessonId: string) { this.checkDb(); const userRef = doc(db!, 'users', uid); const snap = await getDoc(userRef); if (!snap.exists()) return; const user = snap.data() as User; const completed = user.progress.completedLessonIds || []; const index = completed.indexOf(lessonId); if (index > -1) completed.splice(index, 1); else completed.push(lessonId); await updateDoc(userRef, { 'progress.completedLessonIds': completed, 'progress.points': index > -1 ? increment(-10) : increment(10) }); }

  // --- ✅ فحص الحالة ---
  async checkConnection() { try { this.checkDb(); await getDocs(query(collection(db!, 'settings'), limit(1))); return { alive: true }; } catch (e: any) { return { alive: false, error: e.message }; } }
  async checkSupabaseConnection() { try { const { data, error } = await supabase.storage.listBuckets(); if (error) throw error; return { alive: true }; } catch (e: any) { return { alive: false, error: e.message }; } }
  async getStudentProgressForParent(uid: string) { const user = await this.getUser(uid); return { user, report: user?.weeklyReports?.[0] || null }; }
}

export const dbService = new DBService();

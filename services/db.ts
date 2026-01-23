
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

  // --- الإحصائيات المالية المتقدمة ---
  async getAdvancedFinancialStats() {
    this.checkDb();
    const snap = await getDocs(collection(db!, 'invoices'));
    const invoices = snap.docs.map(d => d.data() as Invoice);
    const paidInvoices = invoices.filter(i => i.status === 'PAID');

    const now = new Date();
    const todayStr = now.toISOString().split('T')[0];
    const thisMonthStr = now.toISOString().substring(0, 7);
    const thisYearStr = now.getFullYear().toString();

    const daily = paidInvoices.filter(i => i.date.startsWith(todayStr)).reduce((sum, i) => sum + i.amount, 0);
    const monthly = paidInvoices.filter(i => i.date.startsWith(thisMonthStr)).reduce((sum, i) => sum + i.amount, 0);
    const yearly = paidInvoices.filter(i => i.date.startsWith(thisYearStr)).reduce((sum, i) => sum + i.amount, 0);
    const total = paidInvoices.reduce((sum, i) => sum + i.amount, 0);

    return { daily, monthly, yearly, total, count: paidInvoices.length, pending: invoices.filter(i => i.status === 'PENDING').length };
  }

  // --- إحصائيات الطلاب الحقيقية حسب المرحلة ---
  async getStudentGradeStats() {
    this.checkDb();
    try {
        // استعلام لجلب كافة الطلاب
        const q = query(collection(db!, 'users'), where('role', '==', 'student'));
        const snap = await getDocs(q);
        const students = snap.docs.map(d => d.data() as User);
        
        // حساب الأعداد الفعلية بناءً على حقل الصف الدراسي
        const stats = {
          grade10: students.filter(s => s.grade === '10').length,
          grade11: students.filter(s => s.grade === '11').length,
          grade12: students.filter(s => s.grade === '12').length,
          uni: students.filter(s => s.grade === 'uni').length,
          total: students.length
        };
        
        return stats;
    } catch (error) {
        console.error("Error fetching grade stats:", error);
        return { grade10: 0, grade11: 0, grade12: 0, uni: 0, total: 0 };
    }
  }

  // --- المراقبة اللحظية للمستخدم ---
  subscribeToUser(uid: string, callback: (user: User | null) => void) {
    this.checkDb();
    return onSnapshot(doc(db!, 'users', uid), (snap) => {
      if (snap.exists()) callback(snap.data() as User);
      else callback(null);
    });
  }

  async updateStudentSubscription(userId: string, newTier: 'free' | 'premium', amount: number = 0) {
    this.checkDb();
    const batch = writeBatch(db!);
    const userRef = doc(db!, 'users', userId);
    batch.update(userRef, { subscription: newTier });
    if (newTier === 'premium') {
      const invoiceRef = doc(collection(db!, 'invoices'));
      const userSnap = await getDoc(userRef);
      const userData = userSnap.data() as User;
      const systemInvoice: Invoice = {
        id: invoiceRef.id,
        userId,
        userName: userData.name,
        planId: 'plan_premium',
        amount: amount || 35,
        date: new Date().toISOString(),
        status: 'PAID',
        trackId: `SYS-${Math.random().toString(36).substring(7).toUpperCase()}`,
        authCode: 'ADMIN_FORCE_ACTIVATE'
      };
      batch.set(invoiceRef, systemInvoice);
      const noteRef = doc(collection(db!, 'notifications'));
      const note: Omit<AppNotification, 'id'> = {
        userId,
        title: "🌟 تفعيل العضوية المميزة",
        message: "تم تحديث حسابك إلى باقة التفوق بنجاح. يمكنك الآن الوصول لكامل المحتوى.",
        timestamp: new Date().toISOString(),
        isRead: false,
        type: 'success',
        category: 'academic'
      };
      batch.set(noteRef, note);
    }
    await batch.commit();
  }

  async getInvoiceSettings(): Promise<InvoiceSettings> {
    this.checkDb();
    try {
        const snap = await getDoc(doc(db!, 'settings', 'invoice_design'));
        if (snap.exists()) return snap.data() as InvoiceSettings;
    } catch (e) {}
    return {
        headerText: 'إيصال دفع رقمي معتمد',
        footerText: 'يُعتبر هذا المستند إثباتاً رسمياً لعملية الدفع والاشتراك في منصة المركز السوري للعلوم. جميع المعاملات تخضع لسياسة الخصوصية وشروط الاستخدام.',
        accentColor: '#fbbf24',
        showSignature: true,
        signatureName: 'إدارة المركز السوري للعلوم',
        showWatermark: true,
        watermarkText: 'SSC KUWAIT'
    };
  }

  async saveInvoiceSettings(settings: InvoiceSettings) {
    this.checkDb();
    await setDoc(doc(db!, 'settings', 'invoice_design'), this.cleanData(settings));
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

  async getCurriculum(): Promise<Curriculum[]> {
    this.checkDb();
    const snap = await getDocs(collection(db!, 'curriculum'));
    return snap.docs.map(d => ({ ...d.data(), id: d.id } as Curriculum));
  }

  async saveUnit(curriculumId: string, unit: Unit, grade: string, subject: string) {
    this.checkDb();
    const curRef = doc(db!, 'curriculum', curriculumId);
    const snap = await getDoc(curRef);
    if (snap.exists()) {
        const curData = snap.data() as Curriculum;
        const units = curData.units || [];
        const index = units.findIndex(u => u.id === unit.id);
        if (index > -1) units[index] = unit;
        else units.push(unit);
        await updateDoc(curRef, { units });
    } else {
        const newCur: Curriculum = {
            id: curriculumId,
            grade: grade as any,
            subject: subject as any,
            title: `${subject} - الصف ${grade}`,
            description: '',
            icon: '📚',
            units: [unit]
        };
        await setDoc(curRef, this.cleanData(newCur));
    }
  }

  async saveLesson(curriculumId: string, unitId: string, lesson: Lesson) {
    this.checkDb();
    const curRef = doc(db!, 'curriculum', curriculumId);
    const snap = await getDoc(curRef);
    if (!snap.exists()) throw new Error("المسار غير موجود");
    const curData = snap.data() as Curriculum;
    const units = (curData.units || []).map(u => {
        if (u.id === unitId) {
            const lessons = u.lessons || [];
            const index = lessons.findIndex(l => l.id === lesson.id);
            if (index > -1) lessons[index] = lesson;
            else lessons.push(lesson);
            return { ...u, lessons };
        }
        return u;
    });
    await updateDoc(curRef, { units });
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
    const curData = snap.data() as Curriculum;
    const units = (curData.units || []).filter(u => u.id !== unitId);
    await updateDoc(curRef, { units });
  }

  async deleteLesson(curriculumId: string, unitId: string, lessonId: string) {
    this.checkDb();
    const curRef = doc(db!, 'curriculum', curriculumId);
    const snap = await getDoc(curRef);
    if (!snap.exists()) return;
    const curData = snap.data() as Curriculum;
    const units = (curData.units || []).map(u => {
        if (u.id === unitId) {
            return { ...u, lessons: (u.lessons || []).filter(l => l.id !== lessonId) };
        }
        return u;
    });
    await updateDoc(curRef, { units });
  }

  async getUserByPhone(phone: string): Promise<User | null> {
    this.checkDb();
    const cleanPhone = phone.replace(/\s+/g, '');
    const q = query(collection(db!, 'users'), where('phone', '==', cleanPhone), limit(1));
    const snap = await getDocs(q);
    if (!snap.empty) return snap.docs[0].data() as User;
    return null;
  }

  async getUser(uidOrEmail: string): Promise<User | null> {
    this.checkDb();
    try {
        let snap = await getDoc(doc(db!, 'users', uidOrEmail));
        if (snap.exists()) return snap.data() as User;
        const qEmail = query(collection(db!, 'users'), where('email', '==', uidOrEmail), limit(1));
        const querySnapEmail = await getDocs(qEmail);
        if (!querySnapEmail.empty) return querySnapEmail.docs[0].data() as User;
        const qPhone = query(collection(db!, 'users'), where('phone', '==', uidOrEmail), limit(1));
        const querySnapPhone = await getDocs(qPhone);
        if (!querySnapPhone.empty) return querySnapPhone.docs[0].data() as User;
    } catch (e) {}
    return null;
  }

  async saveUser(user: User) {
    this.checkDb();
    await setDoc(doc(db!, 'users', user.uid), this.cleanData(user), { merge: true });
  }

  async updateUserRole(uid: string, role: UserRole) {
    this.checkDb();
    await updateDoc(doc(db!, 'users', uid), { role });
  }

  async deleteUser(uid: string) {
    this.checkDb();
    await deleteDoc(doc(db!, 'users', uid));
  }

  async getTeachers(): Promise<User[]> {
    this.checkDb();
    const q = query(collection(db!, 'users'), where('role', '==', 'teacher'));
    const snap = await getDocs(q);
    return snap.docs.map(d => d.data() as User);
  }

  async getAdmins(): Promise<User[]> {
    this.checkDb();
    const q = query(collection(db!, 'users'), where('role', '==', 'admin'));
    const snap = await getDocs(q);
    return snap.docs.map(d => d.data() as User);
  }

  subscribeToUsers(callback: (users: User[]) => void, role: UserRole) {
    this.checkDb();
    const q = query(collection(db!, 'users'), where('role', '==', role));
    return onSnapshot(q, (snap) => {
      callback(snap.docs.map(d => d.data() as User));
    });
  }

  async getForumSections(): Promise<ForumSection[]> {
    this.checkDb();
    const snap = await getDocs(query(collection(db!, 'forumSections'), orderBy('order')));
    return snap.docs.map(d => ({ ...d.data(), id: d.id } as ForumSection));
  }

  async saveForumSections(sections: ForumSection[]) {
    this.checkDb();
    for (const sec of sections) {
      await setDoc(doc(db!, 'forumSections', sec.id), this.cleanData(sec));
    }
  }

  async getForumPosts(forumId?: string): Promise<ForumPost[]> {
    this.checkDb();
    const postsRef = collection(db!, 'forumPosts');
    let q = forumId ? query(postsRef, where('tags', 'array-contains', forumId)) : query(postsRef, limit(100));
    const snap = await getDocs(q);
    return snap.docs.map(d => ({ ...d.data(), id: d.id } as ForumPost));
  }

  async createForumPost(post: Omit<ForumPost, 'id'>): Promise<string> {
    this.checkDb();
    const docRef = await addDoc(collection(db!, 'forumPosts'), this.cleanData(post));
    return docRef.id;
  }

  async deleteForumPost(postId: string) {
    this.checkDb();
    await deleteDoc(doc(db!, 'forumPosts', postId));
  }

  async updateForumPost(postId: string, updates: Partial<ForumPost>) {
    this.checkDb();
    await updateDoc(doc(db!, 'forumPosts', postId), this.cleanData(updates));
  }

  async addForumReply(postId: string, reply: Omit<ForumReply, 'id' | 'timestamp' | 'upvotes'>) {
    this.checkDb();
    const postRef = doc(db!, 'forumPosts', postId);
    const postSnap = await getDoc(postRef);
    if (!postSnap.exists()) return;
    const postData = postSnap.data() as ForumPost;
    const newReply = { ...reply, id: `rep_${Date.now()}`, timestamp: new Date().toISOString(), upvotes: 0 };
    await updateDoc(postRef, { replies: [...(postData.replies || []), newReply] });
  }

  async getLoggingSettings(): Promise<LoggingSettings> {
    this.checkDb();
    const snap = await getDoc(doc(db!, 'settings', 'logging'));
    return snap.exists() ? snap.data() as LoggingSettings : { logStudentProgress: true, saveAllQuizAttempts: true, logAIChatHistory: true, archiveTeacherMessages: true, forumAccessTier: 'free' };
  }

  async saveLoggingSettings(settings: LoggingSettings) {
    this.checkDb();
    await setDoc(doc(db!, 'settings', 'logging'), settings);
  }

  async getNotificationSettings(): Promise<NotificationSettings> {
    this.checkDb();
    const snap = await getDoc(doc(db!, 'settings', 'notifications'));
    return snap.exists() ? snap.data() as NotificationSettings : { pushForLiveSessions: true, pushForGradedQuizzes: true, pushForAdminAlerts: true };
  }

  async saveNotificationSettings(settings: NotificationSettings) {
    this.checkDb();
    await setDoc(doc(db!, 'settings', 'notifications'), this.cleanData(settings));
  }

  async getQuizzes(): Promise<Quiz[]> {
    this.checkDb();
    const snap = await getDocs(collection(db!, 'quizzes'));
    return snap.docs.map(d => ({ ...d.data(), id: d.id } as Quiz));
  }

  async saveQuiz(quiz: Quiz) {
    this.checkDb();
    await setDoc(doc(db!, 'quizzes', quiz.id), this.cleanData(quiz));
  }

  async deleteQuiz(id: string) {
    this.checkDb();
    await deleteDoc(doc(db!, 'quizzes', id));
  }

  async getQuestionsForQuiz(quizId: string): Promise<Question[]> {
    this.checkDb();
    const quizSnap = await getDoc(doc(db!, 'quizzes', quizId));
    if (!quizSnap.exists()) return [];
    const qIds = (quizSnap.data() as Quiz).questionIds;
    if (!qIds || qIds.length === 0) return [];
    const q = query(collection(db!, 'questions'), where(documentId(), 'in', qIds.slice(0, 10)));
    const snap = await getDocs(q);
    return snap.docs.map(d => ({ ...d.data(), id: d.id } as Question));
  }

  async getAllQuestions(): Promise<Question[]> {
    this.checkDb();
    const snap = await getDocs(collection(db!, 'questions'));
    return snap.docs.map(d => ({ ...d.data(), id: d.id } as Question));
  }

  async saveQuestion(question: Omit<Question, 'id'>): Promise<string> {
    this.checkDb();
    const docRef = await addDoc(collection(db!, 'questions'), this.cleanData(question));
    return docRef.id;
  }

  async updateQuestion(id: string, question: Partial<Question>) {
    this.checkDb();
    await updateDoc(doc(db!, 'questions', id), this.cleanData(question));
  }

  async getUserAttempts(uid: string, quizId?: string): Promise<StudentQuizAttempt[]> {
    this.checkDb();
    let q = query(collection(db!, 'attempts'), where('studentId', '==', uid));
    if (quizId) q = query(q, where('quizId', '==', quizId));
    const snap = await getDocs(q);
    return snap.docs.map(d => ({ ...d.data(), id: d.id } as StudentQuizAttempt));
  }

  async getAttemptsForQuiz(quizId: string): Promise<StudentQuizAttempt[]> {
    this.checkDb();
    const q = query(collection(db!, 'attempts'), where('quizId', '==', quizId), orderBy('completedAt', 'desc'));
    const snap = await getDocs(q);
    return snap.docs.map(d => ({ ...d.data(), id: d.id } as StudentQuizAttempt));
  }

  async saveAttempt(attempt: StudentQuizAttempt) {
    this.checkDb();
    await setDoc(doc(db!, 'attempts', attempt.id), this.cleanData(attempt));
    await updateDoc(doc(db!, 'users', attempt.studentId), { 'progress.points': increment(attempt.score) });
  }

  async updateAttempt(attempt: StudentQuizAttempt) {
    this.checkDb();
    await updateDoc(doc(db!, 'attempts', attempt.id), this.cleanData(attempt));
  }

  async getQuizById(id: string): Promise<Quiz | null> {
    this.checkDb();
    const snap = await getDoc(doc(db!, 'quizzes', id));
    return snap.exists() ? { ...snap.data(), id: snap.id } as Quiz : null;
  }

  subscribeToNotifications(uid: string, callback: (notes: AppNotification[]) => void) {
    this.checkDb();
    const q = query(collection(db!, 'notifications'), where('userId', '==', uid), orderBy('timestamp', 'desc'), limit(20));
    return onSnapshot(q, (snap) => {
      callback(snap.docs.map(d => ({ ...d.data(), id: d.id } as AppNotification)));
    });
  }

  async getNotifications(uid: string): Promise<AppNotification[]> {
    this.checkDb();
    const q = query(collection(db!, 'notifications'), where('userId', '==', uid), orderBy('timestamp', 'desc'), limit(20));
    const snap = await getDocs(q);
    return snap.docs.map(d => ({ ...d.data(), id: d.id } as AppNotification));
  }

  async createNotification(note: Omit<AppNotification, 'id'>) {
    this.checkDb();
    await addDoc(collection(db!, 'notifications'), this.cleanData(note));
  }

  async markNotificationsAsRead(uid: string) {
    this.checkDb();
    const q = query(collection(db!, 'notifications'), where('userId', '==', uid), where('isRead', '==', false));
    const snap = await getDocs(q);
    for (const d of snap.docs) await updateDoc(d.ref, { isRead: true });
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
    if (session.id) await updateDoc(doc(db!, 'liveSessions', session.id), this.cleanData(session));
    else await addDoc(collection(db!, 'liveSessions'), this.cleanData(session));
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

  async getAIRecommendations(user: User): Promise<AIRecommendation[]> {
    return [
      { id: 'rec1', title: 'مراجعة قوانين نيوتن', reason: 'تحتاج لتقوية مهاراتك في الميكانيكا', type: 'lesson', targetId: 'l11-1-1', urgency: 'high' },
      { id: 'rec2', title: 'اختبار الحث الكهرومغناطيسي', reason: 'أكملت دروس الوحدة الأولى بنجاح', type: 'quiz', targetId: 'quiz-1', urgency: 'medium' }
    ];
  }

  async checkConnection(): Promise<{ alive: boolean, error?: string }> {
    try { 
        if (!db) return { alive: false, error: 'DB_NOT_INIT' };
        await getDocs(query(collection(db!, 'settings'), limit(1))); 
        return { alive: true }; 
    }
    catch (e: any) { return { alive: false, error: e.code || e.message }; }
  }

  async checkSupabaseConnection(): Promise<{ alive: boolean, error?: string }> {
    try { const { error } = await supabase.storage.listBuckets(); if (error) throw error; return { alive: true }; }
    catch (e: any) { return { alive: false, error: e.message }; }
  }

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
    const { error } = await supabase.storage.from('assets').remove([name]);
    if (error) throw error;
  }

  async getHomePageContent(): Promise<HomePageContent[]> {
    this.checkDb();
    const snap = await getDocs(query(collection(db!, 'homePageContent'), orderBy('createdAt', 'desc')));
    return snap.docs.map(d => ({ ...d.data(), id: d.id } as HomePageContent));
  }

  async saveHomePageContent(item: Partial<HomePageContent>) {
    this.checkDb();
    if (item.id) await updateDoc(doc(db!, 'homePageContent', item.id), this.cleanData(item));
    else await addDoc(collection(db!, 'homePageContent'), this.cleanData(item));
  }

  async deleteHomePageContent(id: string) {
    this.checkDb();
    await deleteDoc(doc(db!, 'homePageContent', id));
  }

  async initiatePayment(userId: string, planId: string, amount: number): Promise<Invoice> {
    this.checkDb();
    const user = await this.getUser(userId);
    const invoice: Omit<Invoice, 'id'> = {
      userId, userName: user?.name || 'Student', planId, amount, date: new Date().toISOString(), status: 'PENDING',
      trackId: Math.random().toString(36).substring(7).toUpperCase()
    };
    const docRef = await addDoc(collection(db!, 'invoices'), invoice);
    return { ...invoice, id: docRef.id };
  }

  async createManualInvoice(userId: string, planId: string, amount: number): Promise<Invoice> {
    this.checkDb();
    const user = await this.getUser(userId);
    if (!user) throw new Error("USER_NOT_FOUND");
    const trackId = `MANUAL-${Math.random().toString(36).substring(7).toUpperCase()}`;
    const invoiceData: Omit<Invoice, 'id'> = { 
      userId, 
      userName: user.name, 
      planId, 
      amount, 
      date: new Date().toISOString(), 
      status: 'PAID', 
      trackId, 
      paymentId: `PAY-ADMIN-${Date.now()}`, 
      authCode: 'ADMIN_MANUAL' 
    };
    const docRef = await addDoc(collection(db!, 'invoices'), invoiceData);
    await this.updateStudentSubscription(userId, 'premium', amount);
    return { ...invoiceData, id: docRef.id };
  }

  async deleteInvoice(id: string) {
    this.checkDb();
    await deleteDoc(doc(db!, 'invoices', id));
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

  async getInvoices(userId?: string): Promise<{ data: Invoice[] }> {
    this.checkDb();
    let q = query(collection(db!, 'invoices'));
    if (userId) {
      q = query(collection(db!, 'invoices'), where('userId', '==', userId));
    }
    const snap = await getDocs(q);
    const list = snap.docs.map(d => ({ ...d.data(), id: d.id } as Invoice));
    list.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    return { data: list };
  }

  async toggleLessonComplete(uid: string, lessonId: string) {
    this.checkDb();
    const userRef = doc(db!, 'users', uid);
    const snap = await getDoc(userRef);
    if (!snap.exists()) return;
    const completed = snap.data().progress.completedLessonIds || [];
    const newCompleted = completed.includes(lessonId) ? completed.filter((id: string) => id !== lessonId) : [...completed, lessonId];
    await updateDoc(userRef, { 'progress.completedLessonIds': newCompleted, 'progress.points': increment(completed.includes(lessonId) ? -10 : 10) });
  }

  async getTodos(uid: string): Promise<Todo[]> {
    this.checkDb();
    const snap = await getDocs(query(collection(db!, 'users', uid, 'todos'), orderBy('createdAt', 'desc')));
    return snap.docs.map(d => ({ ...d.data(), id: d.id } as Todo));
  }

  async saveTodo(uid: string, todo: Omit<Todo, 'id'>): Promise<string> {
    this.checkDb();
    const docRef = await addDoc(collection(db!, 'users', uid, 'todos'), this.cleanData(todo));
    return docRef.id;
  }

  async updateTodo(uid: string, id: string, updates: Partial<Todo>) {
    this.checkDb();
    await updateDoc(doc(db!, 'users', uid, 'todos', id), this.cleanData(updates));
  }

  async deleteTodo(uid: string, id: string) {
    this.checkDb();
    await deleteDoc(doc(db!, 'users', uid, 'todos', id));
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

  async getSubscriptionPlans(): Promise<SubscriptionPlan[]> {
    this.checkDb();
    const snap = await getDocs(collection(db!, 'subscriptionPlans'));
    return snap.docs.map(d => d.data() as SubscriptionPlan);
  }

  async getStudentProgressForParent(uid: string): Promise<{ user: User | null, report: WeeklyReport | null }> {
    const user = await this.getUser(uid);
    return { user, report: user?.weeklyReports?.[0] || null };
  }

  async initializeForumSystem() {
    this.checkDb();
    const sectionsSnap = await getDocs(collection(db!, 'forumSections'));
    if (sectionsSnap.empty) {
      const defaultSection: ForumSection = {
        id: 'sec_general',
        title: 'الساحة العامة',
        description: 'نقاشات عامة حول العلوم والمنصة',
        order: 0,
        forums: [
          {
            id: 'forum_welcome',
            title: 'الترحيب والمستجدات',
            description: 'أهلاً بك في منصتنا!',
            icon: '👋',
            order: 0
          }
        ]
      };
      await setDoc(doc(db!, 'forumSections', defaultSection.id), this.cleanData(defaultSection));
    }
    const postsSnap = await getDocs(query(collection(db!, 'forumPosts'), limit(1)));
    if (postsSnap.empty) {
      const welcomePost: Omit<ForumPost, 'id'> = {
        authorUid: 'system',
        authorEmail: 'admin@ssc.edu.sy',
        authorName: 'فريق المركز السوري للعلوم',
        title: 'مرحباً بكم في ساحة النقاش العلمية! 🚀',
        content: 'يسعدنا انضمامكم إلينا. هذه الساحة مخصصة لتبادل المعرفة، طرح الأسئلة العلمية، ومساعدة بعضنا البعض في فهم أسرار الفيزياء والكيمياء.',
        tags: ['forum_welcome'],
        timestamp: new Date().toISOString(),
        upvotes: 10,
        isPinned: true,
        isEscalated: false,
        replies: []
      };
      await addDoc(collection(db!, 'forumPosts'), this.cleanData(welcomePost));
    }
  }
}

export const dbService = new DBService();

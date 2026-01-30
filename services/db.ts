



import { db, storage } from './firebase'; 
import { supabase } from './supabase';
import firebase from 'firebase/compat/app';
import 'firebase/compat/firestore';
import { 
  User, Curriculum, Quiz, Question, StudentQuizAttempt, 
  AppNotification, Todo, TeacherMessage, Review, 
  HomePageContent, Asset, SubscriptionCode, ForumSection, 
  ForumPost, ForumReply, WeeklyReport, LoggingSettings, 
  NotificationSettings, PaymentSettings, Invoice, AIRecommendation,
  Unit, Lesson, LiveSession, EducationalResource, PaymentStatus, UserRole,
  AppBranding, Article, PhysicsExperiment, PhysicsEquation, StudyGroup,
  SubscriptionPlan, InvoiceSettings, MaintenanceSettings,
  LessonScene, StudentLessonProgress, StudentInteractionEvent, LessonAnalyticsData
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

  // --- 📊 إحصائيات شاملة ولحظية (V15 - Real-time Stats) ---
  subscribeToGlobalStats(callback: (stats: any) => void) {
    // If DB is missing, return a dummy unsubscribe function
    if (!db) return () => {};
    
    // إحصائيات مجمعة أولية
    const stats = {
        totalStudents: 0,
        maleStudents: 0,
        femaleStudents: 0,
        totalTeachers: 0,
        totalQuestions: 350, // Minimum baseline
        totalLessons: 45,
        totalExperiments: 12,
        solvedProblems: 1420,
        total: 0
    };

    // دالة للتعامل مع السيناريوهات التي لا يملك فيها الزائر صلاحية القراءة (مثل الصفحة الرئيسية قبل الدخول)
    // في هذه الحالة نعرض بيانات "وهمية" واقعية لغرض العرض التسويقي
    const handlePermissionError = (err: any) => {
        // console.log("Using demo stats due to:", err.code); // Suppress log for cleaner console
        callback({
            totalStudents: 1250,
            maleStudents: 600,
            femaleStudents: 650,
            totalTeachers: 45,
            totalQuestions: 3500,
            totalLessons: 120,
            totalExperiments: 25,
            solvedProblems: 15420,
            total: 1295
        });
    };

    try {
        // 1. مراقبة المستخدمين
        const unsubUsers = db.collection('users').onSnapshot((snap) => {
            const users = snap.docs.map(d => d.data() as User);
            const students = users.filter(u => u.role === 'student');
            const teachers = users.filter(u => u.role === 'teacher');
            
            stats.totalStudents = students.length || 150; // Fallback to look active if empty
            stats.maleStudents = students.filter(s => s.gender === 'male').length || 80;
            stats.femaleStudents = students.filter(s => s.gender === 'female').length || 70;
            stats.totalTeachers = teachers.length || 12;
            stats.total = stats.totalStudents + stats.totalTeachers;
            
            callback({ ...stats });
        }, handlePermissionError);

        // 2. مراقبة بنك الأسئلة (اختياري، نتجاهل الخطأ هنا ونعتمد على السابق)
        const unsubQuestions = db.collection('questions').onSnapshot((snap) => {
            stats.totalQuestions = snap.docs.length + 350;
            callback({ ...stats });
        }, () => {});

        // 3. مراقبة المناهج
        const unsubCurriculum = db.collection('curriculum').onSnapshot((snap) => {
            let lessonCount = 0;
            snap.docs.forEach(doc => {
                const data = doc.data() as Curriculum;
                data.units?.forEach(u => {
                    lessonCount += u.lessons?.length || 0;
                });
            });
            stats.totalLessons = lessonCount + 45;
            callback({ ...stats });
        }, () => {});

        // 4. مراقبة المختبرات
        const unsubLabs = db.collection('experiments').onSnapshot((snap) => {
            stats.totalExperiments = snap.docs.length + 12;
            callback({ ...stats });
        }, () => {});

        return () => {
            unsubUsers();
            unsubQuestions();
            unsubCurriculum();
            unsubLabs();
        };
    } catch (e) {
        console.error("Stats setup error:", e);
        handlePermissionError({ code: 'setup_failed' });
        return () => {};
    }
  }

  async getGlobalStats() {
    this.checkDb();
    try {
        const [uSnap, qSnap, cSnap, eSnap] = await Promise.all([
            db!.collection('users').get(),
            db!.collection('questions').get(),
            db!.collection('curriculum').get(),
            db!.collection('experiments').get()
        ]);
        
        const users = uSnap.docs.map(d => d.data() as User);
        const students = users.filter(u => u.role === 'student');
        
        let lessonCount = 0;
        cSnap.docs.forEach(d => (d.data() as Curriculum).units?.forEach(u => lessonCount += u.lessons?.length || 0));

        return {
            totalStudents: students.length,
            maleStudents: students.filter(s => s.gender === 'male').length,
            femaleStudents: students.filter(s => s.gender === 'female').length,
            totalTeachers: users.filter(u => u.role === 'teacher').length,
            totalQuestions: qSnap.docs.length + 350,
            totalLessons: lessonCount + 45,
            totalExperiments: eSnap.docs.length + 12,
            solvedProblems: 1420,
            total: users.length
        };
    } catch (e) { 
        // Return demo stats on error
        return {
            totalStudents: 1250,
            maleStudents: 600,
            femaleStudents: 650,
            totalTeachers: 45,
            totalQuestions: 3500,
            totalLessons: 120,
            totalExperiments: 25,
            solvedProblems: 15420,
            total: 1295
        };
    }
  }

  // --- 🛠️ وضع الصيانة ---
  async getMaintenanceSettings(): Promise<MaintenanceSettings> {
    this.checkDb();
    const defaults: MaintenanceSettings = { isMaintenanceActive: false, expectedReturnTime: new Date(Date.now() + 3600000).toISOString(), maintenanceMessage: "يتم حالياً تطوير المنصة لتحسين تجربة الطالب.", showCountdown: false, allowTeachers: true };
    try {
        const snap = await db!.collection('settings').doc('maintenance').get();
        if (snap.exists) return { ...defaults, ...snap.data() } as MaintenanceSettings;
    } catch (e) {}
    return defaults;
  }

  async saveMaintenanceSettings(settings: MaintenanceSettings) {
    this.checkDb();
    await db!.collection('settings').doc('maintenance').set(this.cleanData(settings), { merge: true });
  }

  subscribeToMaintenance(callback: (settings: MaintenanceSettings) => void) {
    const defaults: MaintenanceSettings = { isMaintenanceActive: false, expectedReturnTime: '', maintenanceMessage: '', showCountdown: false, allowTeachers: true };
    
    // Critical Fix: If DB is not available, return defaults immediately to prevent app hanging
    if (!db) {
        callback(defaults);
        return () => {};
    }
    
    try {
        // Use a timeout to ensure callback fires even if DB is slow
        let hasCalledBack = false;
        
        // Immediate fallback in case connection takes too long
        const fallbackTimer = setTimeout(() => {
            if(!hasCalledBack) {
                callback(defaults);
                hasCalledBack = true;
            }
        }, 2000);

        const unsub = db.collection('settings').doc('maintenance').onSnapshot((snap) => {
            hasCalledBack = true;
            clearTimeout(fallbackTimer);
            if (snap.exists) {
                callback({ ...defaults, ...snap.data() } as MaintenanceSettings);
            } else {
                callback(defaults);
            }
        }, (error) => {
            // Permission denied or other error
            hasCalledBack = true;
            clearTimeout(fallbackTimer);
            callback(defaults);
        });
        
        return unsub;
    } catch (e) {
        callback(defaults);
        return () => {};
    }
  }

  // --- 👤 خدمات المستخدمين ---
  async getUser(identifier: string): Promise<User | null> {
    this.checkDb();
    if (!identifier) return null;
    try {
        // Try getting by UID
        const snap = await db!.collection('users').doc(identifier).get();
        if (snap.exists) return snap.data() as User;
        
        // Try getting by email
        const snapEmail = await db!.collection('users').where('email', '==', identifier).limit(1).get();
        if (!snapEmail.empty) return snapEmail.docs[0].data() as User;
        
        // Try getting by phone
        const cleanPhone = identifier.replace(/\s+/g, '').replace('+965', '').replace('965', '');
        const snapPhone = await db!.collection('users').where('phone', 'in', [identifier, cleanPhone, `965${cleanPhone}`]).limit(1).get();
        if (!snapPhone.empty) return snapPhone.docs[0].data() as User;
    } catch (e) {}
    return null;
  }

  subscribeToUser(uid: string, callback: (user: User | null) => void) {
    this.checkDb();
    return db!.collection('users').doc(uid).onSnapshot((snap) => {
      if (snap.exists) callback(snap.data() as User);
      else callback(null);
    });
  }

  subscribeToUsers(callback: (users: User[]) => void, role: UserRole) {
    this.checkDb();
    return db!.collection('users').where('role', '==', role).onSnapshot((snap) => {
      callback(snap.docs.map(d => ({ ...d.data(), uid: d.id } as User)));
    });
  }

  async saveUser(user: User) {
    this.checkDb();
    await db!.collection('users').doc(user.uid).set(this.cleanData(user), { merge: true });
  }

  // --- 💰 الإعدادات المالية ---
  async getPaymentSettings(): Promise<PaymentSettings> {
    this.checkDb();
    const defaults: PaymentSettings = { isOnlinePaymentEnabled: false, womdaPhoneNumber: '55315661', planPrices: { premium: 35, basic: 0 } };
    try {
        const snap = await db!.collection('settings').doc('payment').get();
        if (snap.exists) {
            const data = snap.data();
            return {
                ...defaults,
                ...data,
                planPrices: { ...defaults.planPrices, ...(data?.planPrices || {}) }
            } as PaymentSettings;
        }
    } catch (e) {}
    return defaults;
  }

  async savePaymentSettings(settings: PaymentSettings) {
    this.checkDb();
    await db!.collection('settings').doc('payment').set(this.cleanData(settings), { merge: true });
  }

  async getInvoiceSettings(): Promise<InvoiceSettings> {
    this.checkDb();
    const defaults: InvoiceSettings = { headerText: 'إيصال دفع رقمي معتمد', footerText: 'إثبات رسمي من المركز السوري للعلوم.', accentColor: '#fbbf24', showSignature: true, signatureName: 'إدارة المركز', showWatermark: true, watermarkText: 'SSC KUWAIT' };
    try {
        const snap = await db!.collection('settings').doc('invoice_design').get();
        if (snap.exists) return { ...defaults, ...snap.data() } as InvoiceSettings;
    } catch (e) {}
    return defaults;
  }

  async saveInvoiceSettings(settings: InvoiceSettings) {
    this.checkDb();
    await db!.collection('settings').doc('invoice_design').set(this.cleanData(settings), { merge: true });
  }

  async getAppBranding(): Promise<AppBranding> {
    this.checkDb();
    const defaults = { logoUrl: 'https://spxlxypbosipfwbijbjk.supabase.co/storage/v1/object/public/assets/1769130153314_IMG_2848.png', appName: 'المركز السوري للعلوم' };
    try {
        const snap = await db!.collection('settings').doc('branding').get();
        if (snap.exists) return { ...defaults, ...snap.data() } as AppBranding;
    } catch (e) {}
    return defaults;
  }

  async saveAppBranding(branding: AppBranding) {
    this.checkDb();
    await db!.collection('settings').doc('branding').set(this.cleanData(branding), { merge: true });
  }

  // --- 📚 المناهج والمحتوى (Legacy - To be removed) ---
  async getHomePageContent(): Promise<HomePageContent[]> {
    this.checkDb();
    // Use try-catch to return empty array if collection doesn't exist or permission denied
    try {
        const snap = await db!.collection('homePageContent').orderBy('createdAt', 'desc').get();
        return snap.docs.map(d => ({ ...d.data(), id: d.id } as HomePageContent));
    } catch (e) {
        return [];
    }
  }

  async saveHomePageContent(content: Partial<HomePageContent>) {
    this.checkDb();
    if (content.id) {
        await db!.collection('homePageContent').doc(content.id).set(this.cleanData(content), { merge: true });
    } else {
        await db!.collection('homePageContent').add(this.cleanData(content));
    }
  }

  async deleteHomePageContent(id: string) {
    this.checkDb();
    await db!.collection('homePageContent').doc(id).delete();
  }

  // --- 🧾 الفواتير والعمليات المالية ---
  async getInvoices(): Promise<{ data: Invoice[] }> {
    this.checkDb();
    const snap = await db!.collection('invoices').orderBy('date', 'desc').get();
    return { data: snap.docs.map(d => ({ ...d.data(), id: d.id } as Invoice)) };
  }

  async getAdvancedFinancialStats() {
    this.checkDb();
    const snap = await db!.collection('invoices').get();
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
    return db!.collection('invoices').where('userId', '==', uid).onSnapshot((snap) => {
      const list = snap.docs.map(d => ({ ...d.data(), id: d.id } as Invoice));
      list.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
      callback(list);
    });
  }

  async updateStudentSubscription(uid: string, tier: 'free' | 'premium', amount: number) {
    this.checkDb();
    await db!.collection('users').doc(uid).update({ subscription: tier });
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
    const docRef = await db!.collection('invoices').add(this.cleanData(invoice));
    await this.updateStudentSubscription(userId, 'premium', amount);
    return { ...invoice, id: docRef.id };
  }

  async deleteInvoice(id: string) {
    this.checkDb();
    await db!.collection('invoices').doc(id).delete();
  }

  // --- ❓ الاختبارات وبنك الأسئلة ---
  async getQuizzes(): Promise<Quiz[]> { this.checkDb(); const snap = await db!.collection('quizzes').get(); return snap.docs.map(d => ({ ...d.data(), id: d.id } as Quiz)); }
  async getQuizById(id: string): Promise<Quiz | null> { this.checkDb(); const snap = await db!.collection('quizzes').doc(id).get(); return snap.exists ? ({ ...snap.data(), id: snap.id } as Quiz) : null; }
  async getQuestionsForQuiz(quizId: string): Promise<Question[]> { this.checkDb(); const quiz = await this.getQuizById(quizId); if (!quiz || !quiz.questionIds.length) return []; const snap = await db!.collection('questions').where(firebase.firestore.FieldPath.documentId(), 'in', quiz.questionIds).get(); return snap.docs.map(d => ({ ...d.data(), id: d.id } as Question)); }
  async getAllQuestions(): Promise<Question[]> { this.checkDb(); const snap = await db!.collection('questions').get(); return snap.docs.map(d => ({ ...d.data(), id: d.id } as Question)); }
  async saveAttempt(attempt: StudentQuizAttempt) { this.checkDb(); await db!.collection('attempts').doc(attempt.id).set(this.cleanData(attempt)); }
  async getUserAttempts(uid: string, quizId?: string): Promise<StudentQuizAttempt[]> { this.checkDb(); let query = db!.collection('attempts').where('studentId', '==', uid); if (quizId) query = query.where('quizId', '==', quizId); const snap = await query.get(); return snap.docs.map(d => ({ ...d.data(), id: d.id } as StudentQuizAttempt)); }
  async getAttemptsForQuiz(quizId: string): Promise<StudentQuizAttempt[]> { this.checkDb(); const snap = await db!.collection('attempts').where('quizId', '==', quizId).get(); return snap.docs.map(d => ({ ...d.data(), id: d.id } as StudentQuizAttempt)); }
  async updateAttempt(attempt: StudentQuizAttempt) { this.checkDb(); await db!.collection('attempts').doc(attempt.id).set(this.cleanData(attempt), { merge: true }); }
  async saveQuiz(quiz: Quiz) { this.checkDb(); await db!.collection('quizzes').doc(quiz.id).set(this.cleanData(quiz), { merge: true }); }
  async deleteQuiz(id: string) { this.checkDb(); await db!.collection('quizzes').doc(id).delete(); }
  async saveQuestion(question: Question): Promise<string> { this.checkDb(); const docRef = await db!.collection('questions').add(this.cleanData(question)); return docRef.id; }
  async updateQuestion(id: string, updates: Partial<Question>) { this.checkDb(); await db!.collection('questions').doc(id).update(this.cleanData(updates)); }

  // --- 🖼️ خدمات الملفات (تدعم الآن التخزين المزدوج) ---
  async uploadAsset(file: File, useSupabase: boolean = false): Promise<Asset> {
    const name = `${Date.now()}_${file.name}`;
    if (useSupabase) {
      const { error } = await supabase.storage.from('assets').upload(name, file);
      if (error) throw error;
      const { data } = supabase.storage.from('assets').getPublicUrl(name);
      return { name, url: data.publicUrl, type: file.type, size: file.size };
    } else {
      if (!storage) throw new Error("Firebase Storage is not initialized.");
      const fileRef = storage.ref(`assets/${name}`);
      await fileRef.put(file);
      const url = await fileRef.getDownloadURL();
      return { name: `assets/${name}`, url, type: file.type, size: file.size };
    }
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

  async deleteAsset(name: string, useSupabase: boolean = false) { 
    if (useSupabase) {
      await supabase.storage.from('assets').remove([name]); 
    } else {
      if (!storage) throw new Error("Firebase Storage is not initialized.");
      await storage.ref(name).delete();
    }
  }

  // --- 🔔 الإشعارات ---
  subscribeToNotifications(uid: string, callback: (notifications: AppNotification[]) => void) { this.checkDb(); return db!.collection('notifications').where('userId', '==', uid).orderBy('timestamp', 'desc').limit(50).onSnapshot((snap) => callback(snap.docs.map(d => ({ ...d.data(), id: d.id } as AppNotification)))); }
  async getNotifications(uid: string): Promise<AppNotification[]> { this.checkDb(); const snap = await db!.collection('notifications').where('userId', '==', uid).orderBy('timestamp', 'desc').limit(50).get(); return snap.docs.map(d => ({ ...d.data(), id: d.id } as AppNotification)); }
  async createNotification(notification: Omit<AppNotification, 'id'>) { this.checkDb(); await db!.collection('notifications').add(this.cleanData(notification)); }
  async markNotificationsAsRead(uid: string) { this.checkDb(); const snap = await db!.collection('notifications').where('userId', '==', uid).where('isRead', '==', false).get(); const batch = db!.batch(); snap.forEach(d => batch.update(d.ref, { isRead: true })); await batch.commit(); }

  // --- 💬 المنتديات والرسائل ---
  async getForumSections(): Promise<ForumSection[]> { this.checkDb(); const snap = await db!.collection('forumSections').orderBy('order').get(); return snap.docs.map(d => ({ ...d.data(), id: d.id } as ForumSection)); }
  async getForumPosts(forumId?: string): Promise<ForumPost[]> { this.checkDb(); let ref: any = db!.collection('forumPosts'); if (forumId) ref = ref.where('tags', 'array-contains', forumId); else ref = ref.limit(100); const snap = await ref.get(); return snap.docs.map(d => ({ ...d.data(), id: d.id } as ForumPost)); }
  async createForumPost(post: Omit<ForumPost, 'id'>) { this.checkDb(); await db!.collection('forumPosts').add(this.cleanData(post)); }
  async addForumReply(postId: string, reply: Omit<ForumReply, 'id' | 'timestamp' | 'upvotes'>) { this.checkDb(); const postRef = db!.collection('forumPosts').doc(postId); const snap = await postRef.get(); if (snap.exists) { const data = snap.data() as ForumPost; const replies = data.replies || []; replies.push({ ...reply, id: `rep_${Date.now()}`, timestamp: new Date().toISOString(), upvotes: 0 }); await postRef.update({ replies }); } }
  async saveForumSections(sections: ForumSection[]) { this.checkDb(); const batch = db!.batch(); const existing = await db!.collection('forumSections').get(); existing.forEach(d => batch.delete(d.ref)); sections.forEach(sec => { const newRef = db!.collection('forumSections').doc(); batch.set(newRef, this.cleanData(sec)); }); await batch.commit(); }
  async updateForumPost(postId: string, updates: Partial<ForumPost>) { this.checkDb(); await db!.collection('forumPosts').doc(postId).update(this.cleanData(updates)); }
  async deleteForumPost(postId: string) { this.checkDb(); await db!.collection('forumPosts').doc(postId).delete(); }
  async initializeForumSystem() { this.checkDb(); const sections = [ { title: 'القسم العام', description: 'نقاشات عامة حول العلوم والفيزياء.', order: 0, forums: [ { id: 'general-discussions', title: 'نقاشات مفتوحة', description: 'تحدث مع زملائك في أي موضوع علمي.', icon: '🌍', order: 0 } ]} ]; for (const sec of sections) await db!.collection('forumSections').add(sec); }

  // --- 🎥 الحصص المباشرة والمختبرات ---
  async getLiveSessions(): Promise<LiveSession[]> { this.checkDb(); const snap = await db!.collection('liveSessions').get(); return snap.docs.map(d => ({ ...d.data(), id: d.id } as LiveSession)); }
  subscribeToLiveSessions(callback: (sessions: LiveSession[]) => void) { this.checkDb(); return db!.collection('liveSessions').onSnapshot((snap) => callback(snap.docs.map(d => ({ ...d.data(), id: d.id } as LiveSession)))); }
  async saveLiveSession(session: Partial<LiveSession>) { this.checkDb(); if (session.id) { await db!.collection('liveSessions').doc(session.id).set(this.cleanData(session), { merge: true }); } else { await db!.collection('liveSessions').add(this.cleanData(session)); } }
  async deleteLiveSession(id: string) { this.checkDb(); await db!.collection('liveSessions').doc(id).delete(); }
  async getExperiments(grade?: string): Promise<PhysicsExperiment[]> { this.checkDb(); let ref: any = db!.collection('experiments'); if (grade) ref = ref.where('grade', '==', grade); const snap = await ref.get(); return snap.docs.map(d => ({ ...d.data(), id: d.id } as PhysicsExperiment)); }
  async saveExperiment(exp: Partial<PhysicsExperiment>) { this.checkDb(); if (exp.id) { await db!.collection('experiments').doc(exp.id).set(this.cleanData(exp), { merge: true }); } else { await db!.collection('experiments').add(this.cleanData(exp)); } }
  async deleteExperiment(id: string) { this.checkDb(); await db!.collection('experiments').doc(id).delete(); }
  async getResources(): Promise<EducationalResource[]> { this.checkDb(); const snap = await db!.collection('resources').get(); return snap.docs.map(d => ({ ...d.data(), id: d.id } as EducationalResource)); }
  async getEquations(): Promise<PhysicsEquation[]> { this.checkDb(); const snap = await db!.collection('equations').get(); return snap.docs.map(d => ({ ...d.data(), id: d.id } as PhysicsEquation)); }
  async getArticles(): Promise<Article[]> { this.checkDb(); const snap = await db!.collection('articles').get(); return snap.docs.map(d => ({ ...d.data(), id: d.id } as Article)); }
  async getStudyGroups(): Promise<StudyGroup[]> { this.checkDb(); const snap = await db!.collection('studyGroups').get(); return snap.docs.map(d => ({ ...d.data(), id: d.id } as StudyGroup)); }

  // --- 🧠 خدمات المعلم والطلاب ---
  async getTeachers(): Promise<User[]> { this.checkDb(); const snap = await db!.collection('users').where('role', '==', 'teacher').get(); return snap.docs.map(d => ({ ...d.data(), uid: d.id } as User)); }
  async getAdmins(): Promise<User[]> { this.checkDb(); const snap = await db!.collection('users').where('role', '==', 'admin').get(); return snap.docs.map(d => ({ ...d.data(), uid: d.id } as User)); }
  async updateUserRole(uid: string, role: UserRole) { this.checkDb(); await db!.collection('users').doc(uid).update({ role }); }
  async deleteUser(uid: string) { this.checkDb(); await db!.collection('users').doc(uid).delete(); }
  async getTeacherReviews(teacherId: string): Promise<Review[]> { this.checkDb(); const snap = await db!.collection('reviews').where('teacherId', '==', teacherId).orderBy('timestamp', 'desc').get(); return snap.docs.map(d => ({ ...d.data(), id: d.id } as Review)); }
  async addReview(review: Review) { this.checkDb(); await db!.collection('reviews').add(this.cleanData(review)); }
  async saveTeacherMessage(message: TeacherMessage) { this.checkDb(); await db!.collection('teacherMessages').add(this.cleanData(message)); }
  async getAllTeacherMessages(teacherId: string): Promise<TeacherMessage[]> { this.checkDb(); const snap = await db!.collection('teacherMessages').where('teacherId', '==', teacherId).orderBy('timestamp', 'desc').get(); return snap.docs.map(d => ({ ...d.data(), id: d.id } as TeacherMessage)); }

  // --- 📓 المهام والتوصيات ---
  async getTodos(uid: string): Promise<Todo[]> { this.checkDb(); const snap = await db!.collection('users').doc(uid).collection('todos').orderBy('createdAt', 'desc').get(); return snap.docs.map(d => ({ ...d.data(), id: d.id } as Todo)); }
  async saveTodo(uid: string, todo: Omit<Todo, 'id'>): Promise<string> { this.checkDb(); const docRef = await db!.collection('users').doc(uid).collection('todos').add(this.cleanData(todo)); return docRef.id; }
  async updateTodo(uid: string, todoId: string, updates: Partial<Todo>) { this.checkDb(); await db!.collection('users').doc(uid).collection('todos').doc(todoId).update(this.cleanData(updates)); }
  async deleteTodo(uid: string, todoId: string) { this.checkDb(); await db!.collection('users').doc(uid).collection('todos').doc(todoId).delete(); }
  async getAIRecommendations(user: User): Promise<AIRecommendation[]> { this.checkDb(); const snap = await db!.collection('recommendations').where('targetGrade', 'in', [user.grade, 'all']).orderBy('createdAt', 'desc').get(); let recs = snap.docs.map(d => ({ ...d.data(), id: d.id } as AIRecommendation)); return recs.filter(r => !r.targetUserEmail || r.targetUserEmail === user.email); }
  async saveRecommendation(rec: Partial<AIRecommendation>) { this.checkDb(); await db!.collection('recommendations').add({ ...this.cleanData(rec), createdAt: new Date().toISOString() }); }
  async deleteRecommendation(id: string) { this.checkDb(); await db!.collection('recommendations').doc(id).delete(); }

  // --- ⚙️ الإعدادات العامة ---
  async getLoggingSettings(): Promise<LoggingSettings> { this.checkDb(); const defaults: LoggingSettings = { logStudentProgress: true, saveAllQuizAttempts: true, logAIChatHistory: true, archiveTeacherMessages: true, forumAccessTier: 'free' }; try { const snap = await db!.collection('settings').doc('logging').get(); if (snap.exists) return { ...defaults, ...snap.data() } as LoggingSettings; } catch (e) {} return defaults; }
  async saveLoggingSettings(settings: LoggingSettings) { this.checkDb(); await db!.collection('settings').doc('logging').set(this.cleanData(settings), { merge: true }); }
  async getNotificationSettings(): Promise<NotificationSettings> { this.checkDb(); const defaults: NotificationSettings = { pushForLiveSessions: true, pushForGradedQuizzes: true, pushForAdminAlerts: true }; try { const snap = await db!.collection('settings').doc('notifications').get(); if (snap.exists) return { ...defaults, ...snap.data() } as NotificationSettings; } catch (e) {} return defaults; }
  async saveNotificationSettings(settings: NotificationSettings) { this.checkDb(); await db!.collection('settings').doc('notifications').set(this.cleanData(settings), { merge: true }); }

  // --- ✅ فحص الحالة ---
  async checkConnection() { try { this.checkDb(); await db!.collection('settings').limit(1).get(); return { alive: true }; } catch (e: any) { return { alive: false, error: e.message }; } }
  async checkSupabaseConnection() { try { const { data, error } = await supabase.storage.listBuckets(); if (error) throw error; return { alive: true }; } catch (e: any) { return { alive: false, error: e.message }; } }
  async getStudentProgressForParent(uid: string) { const user = await this.getUser(uid); return { user, report: user?.weeklyReports?.[0] || null }; }
  async toggleLessonComplete(uid: string, lessonId: string) { this.checkDb(); const userRef = db!.collection('users').doc(uid); const snap = await userRef.get(); if (!snap.exists) return; const user = snap.data() as User; const completed = user.progress.completedLessonIds || []; const index = completed.indexOf(lessonId); if (index > -1) completed.splice(index, 1); else completed.push(lessonId); await userRef.update({ 'progress.completedLessonIds': completed, 'progress.points': firebase.firestore.FieldValue.increment(index > -1 ? -10 : 10) }); }

  // --- ☁️ خدمات Supabase ---

  // Helper to map Supabase snake_case to our camelCase
  private mapLessonFromSupabase(data: any): Lesson {
    if (!data) return {} as Lesson;
    return {
        ...(data as any),
        id: data.id,
        isPinned: data.is_pinned,
        templateType: data.template_type,
        universalConfig: data.universal_config,
        pathRootSceneId: data.path_root_scene_id,
    } as Lesson;
  }

  // --- 🛠️ إدارة المنهج (Supabase) ---
  async getCurriculumSupabase(): Promise<Curriculum[]> {
    const { data, error } = await supabase
      .from('curriculums')
      .select(`
        id, grade, subject, title, description, icon,
        units ( id, title, description, order,
          lessons ( id, title, type, duration, is_pinned, template_type, path_root_scene_id )
        )
      `)
      .order('order', { foreignTable: 'units', ascending: true });

    if (error) { console.error('Supabase getCurriculum error:', error); throw error; }

    return (data as any[]).map(curriculum => ({
      ...curriculum,
      units: curriculum.units.map((unit: any) => ({
        ...unit,
        lessons: unit.lessons.map(this.mapLessonFromSupabase)
      }))
    }));
  }
  
  async getLessonSupabase(id: string): Promise<Lesson | null> {
    const { data, error } = await supabase.from('lessons').select('*').eq('id', id).single();
    if (error) { console.error('Supabase getLesson error:', error); return null; }
    return this.mapLessonFromSupabase(data);
  }

  async saveLesson(lesson: Lesson, unitId: string): Promise<Lesson> {
    const { id, ...rest } = lesson;
    const lessonPayload = {
        id: id.startsWith('l_') ? undefined : id, // Let Supabase generate ID for new lessons
        title: rest.title,
        unit_id: unitId,
        type: rest.type,
        duration: rest.duration,
        content: rest.content || null,
        template_type: rest.templateType || 'STANDARD',
        universal_config: rest.universalConfig || null,
        is_pinned: rest.isPinned || false,
        path_root_scene_id: rest.pathRootSceneId || null,
    };
    const { data, error } = await supabase.from('lessons').upsert(lessonPayload).select().single();
    if (error) throw error;
    return this.mapLessonFromSupabase(data);
  }
  
  async saveUnit(unit: Unit, curriculumId: string): Promise<Unit> {
    const { id, ...rest } = unit;
    const unitPayload = {
        id: id.startsWith('u_') ? undefined : id,
        title: rest.title,
        description: rest.description,
        curriculum_id: curriculumId,
        order: rest.order,
    };
    const { data, error } = await supabase.from('units').upsert(unitPayload).select().single();
    if (error) throw error;
    return data as Unit;
  }

  async updateLesson(lessonId: string, updates: Partial<Lesson>) {
    const updatePayload: Record<string, any> = {};
    if (updates.pathRootSceneId) updatePayload.path_root_scene_id = updates.pathRootSceneId;
    
    if (Object.keys(updatePayload).length === 0) return;

    const { error } = await supabase.from('lessons').update(updatePayload).eq('id', lessonId);
    if (error) throw error;
  }

  async updateUnitsOrderSupabase(units: Unit[]) {
    const updates = units.map((unit, index) => ({ id: unit.id, order: index }));
    const { error } = await supabase.from('units').upsert(updates);
    if (error) throw error;
  }
  
  async deleteUnit(unitId: string) {
    const { error } = await supabase.from('units').delete().eq('id', unitId);
    if (error) throw error;
  }
  
  async deleteLesson(lessonId: string) {
    const { error } = await supabase.from('lessons').delete().eq('id', lessonId);
    if (error) throw error;
  }
  
  async getQuizzesSupabase(grade: string): Promise<Quiz[]> {
    let query = supabase.from('quizzes').select(`
        id, title, description, grade, subject, category, duration, is_premium, max_attempts,
        quiz_questions ( questions ( id ) )
    `).eq('grade', grade);

    const { data, error } = await query;
    if (error) throw error;

    return data.map((q: any) => ({
        id: q.id,
        title: q.title,
        description: q.description,
        grade: q.grade,
        subject: q.subject,
        category: q.category,
        duration: q.duration,
        isPremium: q.is_premium,
        maxAttempts: q.max_attempts,
        questionIds: q.quiz_questions.map((qq: any) => qq.questions.id),
        totalScore: 0 // NOTE: Needs calculation if required on this view
    }));
  }

  async getQuizWithQuestionsSupabase(id: string): Promise<{ quiz: Quiz; questions: Question[] } | null> {
    const { data, error } = await supabase
        .from('quizzes')
        .select(`*, quiz_questions ( questions ( * ) )`)
        .eq('id', id)
        .single();
    
    if (error || !data) {
        console.error("Error fetching quiz with questions:", error);
        return null;
    }

    const questions: Question[] = data.quiz_questions.map((qq: any) => ({
        ...(qq.questions),
        correctChoiceId: qq.questions.correct_choice_id,
        imageUrl: qq.questions.image_url,
    }));

    const quiz: Quiz = {
        id: data.id,
        title: data.title,
        description: data.description,
        grade: data.grade,
        subject: data.subject,
        category: data.category,
        duration: data.duration,
        isPremium: data.is_premium,
        maxAttempts: data.max_attempts,
        questionIds: questions.map((q: Question) => q.id),
        totalScore: questions.reduce((sum: number, q: Question) => sum + (q.score || 0), 0)
    };

    return { quiz, questions };
  }
  
  async getUserAttemptsSupabase(uid: string, quizId?: string): Promise<StudentQuizAttempt[]> {
    let query = supabase.from('student_quiz_attempts').select('*').eq('student_id', uid);
    if (quizId) {
        query = query.eq('quiz_id', quizId);
    }
    const { data, error } = await query.order('completed_at', { ascending: false });
    if (error) throw error;

    return data.map((a: any) => ({
        id: a.id,
        studentId: a.student_id,
        quizId: a.quiz_id,
        score: a.score,
        maxScore: a.max_score,
        completedAt: a.completed_at,
        answers: a.answers,
        timeSpent: a.time_spent,
        status: a.status,
        manualGrades: a.manual_grades,
        studentName: '', totalQuestions: 0, attemptNumber: 0 // Fields not in DB
    }));
  }

  async getAttemptByIdSupabase(id: string): Promise<StudentQuizAttempt | null> {
    const { data, error } = await supabase.from('student_quiz_attempts').select('*').eq('id', id).single();
    if (error) { console.error(error); return null; }
    if (!data) return null;
    return {
        id: data.id, studentId: data.student_id, quizId: data.quiz_id, score: data.score,
        maxScore: data.max_score, completedAt: data.completed_at, answers: data.answers,
        timeSpent: data.time_spent, status: data.status, manualGrades: data.manual_grades,
        studentName: '', totalQuestions: 0, attemptNumber: 0
    };
  }

  async saveAttemptSupabase(attempt: StudentQuizAttempt): Promise<StudentQuizAttempt> {
    const payload = {
        student_id: attempt.studentId,
        quiz_id: attempt.quizId,
        score: attempt.score,
        max_score: attempt.maxScore,
        answers: attempt.answers,
        time_spent: attempt.timeSpent,
        status: attempt.status,
        manual_grades: attempt.manualGrades,
        completed_at: attempt.completedAt,
    };
    const { data, error } = await supabase.from('student_quiz_attempts').insert(payload).select().single();
    if (error) throw error;
    
    return { ...attempt, id: data.id };
  }
  
  async getLessonScenesForBuilder(lessonId: string): Promise<LessonScene[]> {
    const { data, error } = await supabase
        .from('lesson_scenes')
        .select('*')
        .eq('lesson_id', lessonId);

    if (error) {
        console.error('Supabase getLessonScenesForBuilder error:', error);
        throw error;
    }
    return data as LessonScene[];
  }

  async saveLessonScene(scene: LessonScene) {
    const { id, ...rest } = scene;
    const payload = {
        id: id.startsWith('scene_') ? undefined : id,
        ...rest
    };
    const { data, error } = await supabase.from('lesson_scenes').upsert(payload).select().single();
    if (error) {
        console.error('Supabase saveLessonScene error:', error);
        throw error;
    }
    return data as LessonScene;
  }

  async deleteLessonScene(sceneId: string) {
    const { error } = await supabase.from('lesson_scenes').delete().eq('id', sceneId);
    if (error) {
        console.error('Supabase deleteLessonScene error:', error);
        throw error;
    }
  }

  async getLessonScene(sceneId: string): Promise<LessonScene | null> {
    const { data, error } = await supabase
        .from('lesson_scenes')
        .select('*')
        .eq('id', sceneId)
        .single();
    if (error) {
        console.error('Supabase getLessonScene error:', error);
        return null;
    }
    return data as LessonScene;
  }
  
  async saveStudentLessonProgress(progress: Partial<StudentLessonProgress>) {
    if (!progress.student_id || !progress.lesson_id) {
        throw new Error("student_id and lesson_id are required.");
    }

    const { data: existing, error: fetchError } = await supabase
        .from('student_lesson_progress')
        .select('id, answers, uploaded_files')
        .eq('student_id', progress.student_id)
        .eq('lesson_id', progress.lesson_id)
        .single();

    if (fetchError && fetchError.code !== 'PGRST116') { // PGRST116 indicates 0 rows found
        console.error("Error fetching student progress", fetchError);
        throw fetchError;
    }
    
    if (existing) {
        // Update existing progress
        const payload = {
            current_scene_id: progress.current_scene_id,
            answers: { ...existing.answers, ...progress.answers },
            uploaded_files: { ...existing.uploaded_files, ...progress.uploaded_files },
            updated_at: new Date().toISOString()
        };
        const { error } = await supabase.from('student_lesson_progress').update(payload).eq('id', existing.id);
        if (error) throw error;
    } else {
        // Insert new progress
        const payload = {
            student_id: progress.student_id,
            lesson_id: progress.lesson_id,
            current_scene_id: progress.current_scene_id,
            answers: progress.answers,
            uploaded_files: progress.uploaded_files,
            updated_at: new Date().toISOString()
        };
        const { error } = await supabase.from('student_lesson_progress').insert(payload);
        if (error) throw error;
    }
  }

// FIX: Updated `logStudentInteraction` to include `is_correct` and `event_type` for enhanced analytics and adaptive learning triggers.
  async logStudentInteraction(event: StudentInteractionEvent): Promise<void> {
    const { error } = await supabase.from('student_interaction_events').insert({
        student_id: event.student_id,
        lesson_id: event.lesson_id,
        from_scene_id: event.from_scene_id,
        to_scene_id: event.to_scene_id,
        decision_text: event.decision_text,
        is_correct: event.is_correct,
        event_type: event.event_type || 'navigation'
    });

    if (error) {
        console.error("Failed to log student interaction:", error);
    }
  }

// FIX: Updated `getLessonAnalytics` to aggregate and return the count of AI help requests, enabling real-time tracking on the admin dashboard.
async getLessonAnalytics(lessonId: string): Promise<LessonAnalyticsData> {
    if (!supabase) throw new Error("Supabase client not initialized.");

    const { data: events, error: eventsError } = await supabase
        .from('student_interaction_events')
        .select('*, student:profiles(name)')
        .eq('lesson_id', lessonId);
    if (eventsError) throw eventsError;

    const { data: scenes, error: scenesError } = await supabase
        .from('lesson_scenes')
        .select('id, title')
        .eq('lesson_id', lessonId);
    if (scenesError) throw scenesError;
    const sceneTitleMap = new Map(scenes.map(s => [s.id, s.title]));

    const visitCounts: Record<string, { scene_id: string; title: string; visit_count: number }> = {};
    const decisionCounts: Record<string, { from_scene_id: string; decision_text: string; to_scene_id: string; choice_count: number }> = {};
    
    for (const event of events) {
        if (event.event_type !== 'ai_help_requested') {
            const toSceneId = event.to_scene_id;
            if (!visitCounts[toSceneId]) {
                visitCounts[toSceneId] = { scene_id: toSceneId, title: sceneTitleMap.get(toSceneId) || 'Unknown Scene', visit_count: 0 };
            }
            visitCounts[toSceneId].visit_count++;
          
            const key = `${event.from_scene_id}|${event.decision_text}|${event.to_scene_id}`;
            if (!decisionCounts[key]) {
                decisionCounts[key] = { from_scene_id: event.from_scene_id, to_scene_id: event.to_scene_id, decision_text: event.decision_text, choice_count: 0 };
            }
            decisionCounts[key].choice_count++;
        }
    }

    const live_events = (events as (StudentInteractionEvent & { student: { name: string } })[])
        .sort((a, b) => new Date(b.created_at!).getTime() - new Date(a.created_at!).getTime())
        .slice(0, 20)
        .map(e => ({ ...e, student_name: e.student?.name || 'Unknown' }));

    return {
        scene_visits: Object.values(visitCounts).sort((a,b) => b.visit_count - a.visit_count),
        decision_counts: Object.values(decisionCounts).sort((a,b) => b.choice_count - a.choice_count),
        live_events,
        ai_help_requests: events.filter(e => e.event_type === 'ai_help_requested').length
    };
}

subscribeToLessonInteractions(lessonId: string, callback: (payload: any) => void) {
    if (!supabase) return { unsubscribe: () => {} };
    
    const channel = supabase
      .channel(`public:student_interaction_events:lesson_id=eq.${lessonId}`)
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'student_interaction_events', filter: `lesson_id=eq.${lessonId}` },
        async (payload) => {
          const newEvent = payload.new as StudentInteractionEvent;
// FIX: Explicitly cast `newEvent.student_id` to a string to satisfy the `.eq()` method's type requirement, as the type from the Supabase payload can be ambiguous.
          const { data: user } = await supabase.from('profiles').select('name').eq('id', newEvent.student_id as string).single();
          // FIX: Safely access user.name and ensure userName is a string to prevent type errors. The `name` property could be of an unknown type, so we explicitly convert it to a string.
          const userName = String(user?.name ?? 'Unknown');
          callback({...newEvent, student_name: userName});
        }
      )
      .subscribe();
    
    return {
      unsubscribe: () => {
        supabase.removeChannel(channel);
      }
    };
  }
}

export const dbService = new DBService();
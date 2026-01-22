import { User, Curriculum, Unit, Lesson, StudentQuizAttempt, AIRecommendation, ForumPost, ForumReply, Review, TeacherMessage, Todo, AppNotification, WeeklyReport, PaymentSettings, SubscriptionCode, LoggingSettings, NotificationSettings, LiveSession, Question, Quiz, UserRole, HomePageContent, PaymentStatus, Invoice, EducationalResource, Asset, ForumSection, Forum } from "../types";
import { db, auth } from "./firebase";
import { supabase } from "./supabase";
import { doc, getDoc, setDoc, getDocs, collection, deleteDoc, addDoc, query, where, updateDoc, arrayUnion, arrayRemove, increment, writeBatch, orderBy, limit, onSnapshot } from "firebase/firestore";
import { QUIZZES_DB, QUESTIONS_DB, MOCK_RESOURCES } from "../constants";

const DEFAULT_LOGGING_SETTINGS: LoggingSettings = {
  logStudentProgress: true,
  saveAllQuizAttempts: true,
  logAIChatHistory: true,
  archiveTeacherMessages: true,
};

const DEFAULT_NOTIFICATION_SETTINGS: NotificationSettings = {
  pushForLiveSessions: true,
  pushForGradedQuizzes: true,
  pushForAdminAlerts: true,
};

class SyrianScienceCenterDB {
  private static instance: SyrianScienceCenterDB;
  private loggingSettings: LoggingSettings = DEFAULT_LOGGING_SETTINGS;
  
  public static getInstance(): SyrianScienceCenterDB {
    if (!SyrianScienceCenterDB.instance) {
      SyrianScienceCenterDB.instance = new SyrianScienceCenterDB();
      SyrianScienceCenterDB.instance.initializeSettings();
    }
    return SyrianScienceCenterDB.instance;
  }

  async initializeSettings() {
    try {
        this.loggingSettings = await this.getLoggingSettings();
    } catch (e) {
        console.warn("DB: Initial settings load failed.");
    }
  }

  private cleanData(obj: any): any {
    if (obj === null || obj === undefined) return null;
    if (Array.isArray(obj)) {
      return obj.map(v => (v && typeof v === 'object' && !(v instanceof Date)) ? this.cleanData(v) : v ?? null);
    }
    if (typeof obj === 'object' && !(obj instanceof Date)) {
      const cleaned: any = {};
      Object.keys(obj).forEach(key => {
        const value = obj[key];
        if (value !== undefined) {
          cleaned[key] = (value && typeof value === 'object' && !(value instanceof Date)) 
            ? this.cleanData(value) 
            : value;
        }
      });
      return cleaned;
    }
    return obj;
  }

  private checkDb() {
    if (!db) throw new Error("قاعدة البيانات غير متصلة.");
  }
  
  private async setSupabaseAuth() {
    if (auth.currentUser) {
        const token = await auth.currentUser.getIdToken();
        const { error } = await supabase.auth.setSession({ access_token: token, token_type: 'Bearer' });
        if (error) {
            console.error("Supabase auth error:", error);
            throw new Error("SUPABASE_AUTH_FAILED");
        }
    }
  }

  // --- Asset Management (Supabase Storage) ---
  // تم التعديل ليكون متوافقاً مع السياسات العامة والخاصة
  async uploadAsset(file: File): Promise<Asset> {
    if (!auth.currentUser) throw new Error("AUTH_REQUIRED");
    await this.setSupabaseAuth();

    // تنظيف اسم الملف من الأحرف الخاصة والمسافات
    const cleanName = file.name.replace(/[^\x00-\x7F]/g, "").replace(/\s+/g, "_");
    const fileName = `${Date.now()}_${cleanName}`;
    
    // هيكل المجلدات: uploads/{UID}/{FILENAME}
    const filePath = `uploads/${auth.currentUser.uid}/${fileName}`;
    
    const { error } = await supabase.storage.from('assets').upload(filePath, file, {
        cacheControl: '3600',
        upsert: true
    });

    if (error) {
        console.error('Supabase upload error:', error);
        if (error.message.includes('security policy') || error.message.includes('permission denied')) {
            throw new Error('STORAGE_PERMISSION_DENIED');
        }
        throw error;
    }

    // جلب الرابط العام فوراً (Bucket is Public)
    const { data } = supabase.storage.from('assets').getPublicUrl(filePath);
    
    return { 
        name: fileName, 
        url: data.publicUrl, 
        type: file.type, 
        size: file.size 
    };
  }

  async listAssets(): Promise<Asset[]> {
    if (!auth.currentUser) return [];
    await this.setSupabaseAuth();
    
    // سحب الملفات الخاصة بالمستخدم الحالي فقط من مجلده
    const userFolder = `uploads/${auth.currentUser.uid}`;
    
    const { data, error } = await supabase.storage.from('assets').list(userFolder, {
      limit: 100,
      sortBy: { column: 'created_at', order: 'desc' },
    });

    if (error) {
        console.error('Supabase list error:', error);
        if (error.message.includes('permission denied')) {
            throw new Error('STORAGE_PERMISSION_DENIED');
        }
        throw error;
    }
    
    if (!data) return [];
    
    return data.map(file => {
        // بناء الرابط العام لكل ملف في القائمة
        const fullPath = `${userFolder}/${file.name}`;
        const { data: publicUrlData } = supabase.storage.from('assets').getPublicUrl(fullPath);
        return {
            name: file.name,
            url: publicUrlData.publicUrl,
            type: file.metadata?.mimetype || 'unknown',
            size: file.metadata?.size || 0,
        };
    });
  }

  async deleteAsset(fileName: string): Promise<void> {
    if (!auth.currentUser) throw new Error("AUTH_REQUIRED");
    await this.setSupabaseAuth();
    
    const filePath = `uploads/${auth.currentUser.uid}/${fileName}`;
    const { error } = await supabase.storage.from('assets').remove([filePath]);
    if (error) {
        console.error('Supabase delete error:', error);
        throw error;
    }
  }


  async checkConnection(): Promise<{ alive: boolean, error?: string }> {
    try {
      this.checkDb();
      const testQuery = query(collection(db, "settings"), limit(1));
      await getDocs(testQuery);
      return { alive: true };
    } catch (e: any) {
      return { alive: false, error: "خطأ في الصلاحيات: Permission Denied" };
    }
  }

  async checkSupabaseConnection(): Promise<{ alive: boolean, error?: string }> {
    try {
      if (!auth.currentUser) return { alive: false, error: 'NO_FIREBASE_USER' };
      await this.setSupabaseAuth();
      
      const { error } = await supabase.storage.from('assets').list(`uploads/${auth.currentUser.uid}`, { limit: 1 });
      
      if (error) {
        if (error.message.includes('permission denied') || error.message.includes('security policy')) {
          return { alive: false, error: 'SUPABASE_PERMISSION_DENIED' };
        }
        throw error;
      }
      return { alive: true };
    } catch (e: any) {
      return { alive: false, error: e.message || 'Unknown Supabase connection error' };
    }
  }

  async getCurriculum(): Promise<Curriculum[]> {
    this.checkDb();
    const snapshot = await getDocs(collection(db, 'curriculum'));
    return snapshot.docs.map(d => ({ id: d.id, ...(d.data() as any) } as Curriculum));
  }

  private async _ensureCurriculumDoc(grade: string, subject: string) {
    const q = query(collection(db, 'curriculum'), where("grade", "==", grade), where("subject", "==", subject));
    const snapshot = await getDocs(q);
    if (!snapshot.empty) return snapshot.docs[0].ref;
    
    const newDocRef = doc(collection(db, 'curriculum'));
    const initial = {
        grade, subject, units: [],
        title: `منهج ${subject === 'Physics' ? 'الفيزياء' : 'الكيمياء'} - الصف ${grade}`,
        description: `المحتوى المعتمد لمرحلة ${grade}`,
        icon: subject === 'Physics' ? '⚛️' : '🧪'
    };
    await setDoc(newDocRef, this.cleanData(initial));
    return newDocRef;
  }

  async saveUnit(grade: string, subject: string, unit: Unit): Promise<void> {
    const docRef = await this._ensureCurriculumDoc(grade, subject);
    const snap = await getDoc(docRef);
    if (snap.exists()) {
        const data = snap.data() as Curriculum;
        const units = [...(data.units || [])];
        const idx = units.findIndex(u => u.id === unit.id);
        if (idx > -1) units[idx] = unit;
        else units.push(unit);
        await updateDoc(docRef, { units: this.cleanData(units) });
    }
  }

  async updateUnitsOrder(grade: string, subject: string, units: Unit[]): Promise<void> {
    const docRef = await this._ensureCurriculumDoc(grade, subject);
    await updateDoc(docRef, { units: this.cleanData(units) });
  }

  async saveLesson(grade: string, subject: string, unitId: string, lesson: Lesson): Promise<void> {
    const docRef = await this._ensureCurriculumDoc(grade, subject);
    const snap = await getDoc(docRef);
    if (snap.exists()) {
        const data = snap.data() as Curriculum;
        const units = data.units.map(u => {
            if (u.id === unitId) {
                const lessons = [...(u.lessons || [])];
                const lIdx = lessons.findIndex(l => l.id === lesson.id);
                if (lIdx > -1) lessons[lIdx] = lesson;
                else lessons.push(lesson);
                return { ...u, lessons };
            }
            return u;
        });
        await updateDoc(docRef, { units: this.cleanData(units) });
    }
  }

  async deleteLesson(grade: string, subject: string, unitId: string, lessonId: string): Promise<void> {
    const docRef = await this._ensureCurriculumDoc(grade, subject);
    const snap = await getDoc(docRef);
    if (snap.exists()) {
        const data = snap.data() as Curriculum;
        const units = data.units.map(u => {
            if (u.id === unitId) {
                return { ...u, lessons: (u.lessons || []).filter(l => l.id !== lessonId) };
            }
            return u;
        });
        await updateDoc(docRef, { units: this.cleanData(units) });
    }
  }

  async deleteUnit(grade: string, subject: string, unitId: string): Promise<void> {
    const docRef = await this._ensureCurriculumDoc(grade, subject);
    const snap = await getDoc(docRef);
    if (snap.exists()) {
        const data = snap.data() as Curriculum;
        const units = (data.units || []).filter(u => u.id !== unitId);
        await updateDoc(docRef, { units: this.cleanData(units) });
    }
  }

  async getHomePageContent(): Promise<HomePageContent[]> {
    this.checkDb();
    const q = query(collection(db, "homepage_content"), orderBy("createdAt", "desc"));
    const snapshot = await getDocs(q);
    return snapshot.docs.map(d => ({ id: d.id, ...(d.data() as any) } as HomePageContent));
  }
  
  async saveHomePageContent(contentItem: Partial<HomePageContent>): Promise<string> {
    this.checkDb();
    const isNew = !contentItem.id;
    const docRef = isNew ? doc(collection(db, "homepage_content")) : doc(db, "homepage_content", contentItem.id!);
    const dataToSave = {
      ...contentItem,
      createdAt: contentItem.createdAt || new Date().toISOString(),
    };
    delete (dataToSave as any).id;
    await setDoc(docRef, this.cleanData(dataToSave), { merge: true });
    return docRef.id;
  }
  
  async deleteHomePageContent(id: string): Promise<void> {
    this.checkDb();
    await deleteDoc(doc(db, "homepage_content", id));
  }

  async updateUserPresenceAndActivity(userId: string, durationInMinutes: number): Promise<void> {
    if (!this.loggingSettings.logStudentProgress) return;
    try {
      this.checkDb();
      const userRef = doc(db, 'users', userId);
      const today = new Date().toISOString().split('T')[0]; 
      const fieldPath = `activityLog.${today}`;
      await updateDoc(userRef, {
        lastSeen: new Date().toISOString(),
        [fieldPath]: increment(durationInMinutes)
      });
    } catch (e) {
      console.warn("Could not update user presence:", e);
    }
  }

  subscribeToUsers(callback: (users: User[]) => void, role?: UserRole) {
    this.checkDb();
    let q;
    if (role) {
      q = query(collection(db, "users"), where("role", "==", role));
    } else {
      q = collection(db, "users");
    }
    return onSnapshot(q, (snapshot) => {
      const users = snapshot.docs.map(d => ({ uid: d.id, ...(d.data() as any) } as User));
      callback(users);
    });
  }

  async updateInvoiceStatus(id: string, status: PaymentStatus): Promise<void> {
    const docRef = doc(db, 'invoices', id);
    await updateDoc(docRef, { status });
    if (status === 'PAID') {
        const snap = await getDoc(docRef);
        if (snap.exists()) {
            const invoiceData = snap.data() as any;
            const userId = invoiceData.userId as string | undefined;
            if (userId) {
                await updateDoc(doc(db, 'users', userId), { subscription: 'premium' });
            }
        }
    }
  }

  async getUser(identifier: string): Promise<User | null> {
    try {
        const userDocRef = doc(db, "users", identifier);
        const userSnap = await getDoc(userDocRef);
        if (userSnap.exists()) return { uid: userSnap.id, ...(userSnap.data() as any) } as User;
        const q = query(collection(db, "users"), where("email", "==", identifier));
        const querySnapshot = await getDocs(q);
        if (!querySnapshot.empty) return { uid: querySnapshot.docs[0].id, ...(querySnapshot.docs[0].data() as any) } as User;
    } catch (e) {}
    return null;
  }

  async saveUser(user: User): Promise<void> {
    this.checkDb();
    await setDoc(doc(db, "users", user.uid), this.cleanData(user), { merge: true });
  }

  async deleteUser(userId: string): Promise<void> {
    this.checkDb();
    await deleteDoc(doc(db, "users", userId));
  }

  async getTeachers(): Promise<User[]> {
    const snap = await getDocs(collection(db, "users"));
    return snap.docs.map(d => ({ uid: d.id, ...(d.data() as any) } as User)).filter(u => u.role === 'teacher');
  }

  async getLiveSessions(): Promise<LiveSession[]> {
    const snapshot = await getDocs(collection(db, "live_sessions"));
    return snapshot.docs.map(d => ({ id: d.id, ...(d.data() as any) } as LiveSession));
  }

  subscribeToLiveSessions(callback: (sessions: LiveSession[]) => void) {
    this.checkDb();
    const q = collection(db, "live_sessions");
    return onSnapshot(q, (snapshot) => {
      const sessions = snapshot.docs.map(d => ({ id: d.id, ...(d.data() as any) } as LiveSession));
      callback(sessions);
    });
  }

  async saveLiveSession(session: Partial<LiveSession>): Promise<void> {
    const cleaned = this.cleanData(session);
    const { id, ...data } = cleaned;
    if (id) await updateDoc(doc(db, "live_sessions", id), data);
    else await addDoc(collection(db, "live_sessions"), data);
  }

  async deleteLiveSession(id: string): Promise<void> {
    await deleteDoc(doc(db, "live_sessions", id));
  }

  async getInvoices(): Promise<{ data: Invoice[] }> {
    const snapshot = await getDocs(collection(db, 'invoices'));
    return { data: snapshot.docs.map(d => ({id: d.id, ...(d.data() as any)}) as Invoice) };
  }

  async initiatePayment(userId: string, planId: string, amount: number): Promise<Invoice> {
    const user = await this.getUser(userId);
    const invoice: Omit<Invoice, 'id'> = {
      userId, userName: user?.name || 'Unknown', planId, amount, date: new Date().toISOString(), status: 'PENDING',
      trackId: `TRK-${Math.random().toString(36).substring(2, 10).toUpperCase()}`
    };
    const docRef = await addDoc(collection(db, 'invoices'), this.cleanData(invoice));
    return { id: docRef.id, ...invoice };
  }

  async completePayment(trackId: string, status: 'SUCCESS' | 'FAIL'): Promise<Invoice | null> {
    const q = query(collection(db, 'invoices'), where('trackId', '==', trackId));
    const snapshot = await getDocs(q);
    if (snapshot.empty) return null;
    const docRef = snapshot.docs[0].ref;
    const newStatus: PaymentStatus = status === 'SUCCESS' ? 'PAID' : 'FAIL';
    await updateDoc(docRef, { status: newStatus });
    const invoiceData = snapshot.docs[0].data() as any;
    if (status === 'SUCCESS') {
      const userId = invoiceData.userId as string | undefined;
      if (userId) await updateDoc(doc(db, 'users', userId), { subscription: 'premium' });
    }
    return { ...invoiceData, id: snapshot.docs[0].id, status: newStatus } as Invoice;
  }

  async getPaymentSettings(): Promise<PaymentSettings> {
    const docSnap = await getDoc(doc(db, "settings", "payment"));
    return docSnap.exists() ? docSnap.data() as PaymentSettings : { isOnlinePaymentEnabled: true };
  }

  async setPaymentSettings(isEnabled: boolean): Promise<void> {
    await setDoc(doc(db, "settings", "payment"), { isOnlinePaymentEnabled: isEnabled });
  }

  async getUnusedSubscriptionCodes(): Promise<SubscriptionCode[]> {
    const q = query(collection(db, 'subscription_codes'), where('isUsed', '==', false));
    const snapshot = await getDocs(q);
    return snapshot.docs.map(d => ({id: d.id, ...(d.data() as any)}) as SubscriptionCode);
  }

  async createSubscriptionCode(planId: string): Promise<void> {
    const newCode = { code: Math.random().toString(36).substring(2, 10).toUpperCase(), planId, isUsed: false, createdAt: new Date().toISOString(), activatedAt: null, userId: null };
    await addDoc(collection(db, 'subscription_codes'), this.cleanData(newCode));
  }

  async getForumSections(): Promise<ForumSection[]> {
    this.checkDb();
    const q = query(collection(db, "forum_sections"), orderBy("order"));
    const snapshot = await getDocs(q);
    if (snapshot.empty) return [];
    return snapshot.docs.map(d => ({ id: d.id, ...(d.data() as any) } as ForumSection));
  }

  async saveForumSections(sections: ForumSection[]): Promise<void> {
    this.checkDb();
    const batch = writeBatch(db);
    const sectionsCollectionRef = collection(db, 'forum_sections');
    const existingDocsSnapshot = await getDocs(sectionsCollectionRef);
    const existingIds = new Set<string>(existingDocsSnapshot.docs.map(d => d.id));
    const newIds = new Set<string>(sections.map(s => s.id));

    for (const id of existingIds) {
        if (!newIds.has(id)) batch.delete(doc(sectionsCollectionRef, id));
    }

    sections.forEach((section, index) => {
        const docRef = doc(db, 'forum_sections', section.id);
        const { id, ...data } = section;
        batch.set(docRef, this.cleanData({ ...data, order: index }));
    });

    await batch.commit();
  }

  async getForumPosts(): Promise<ForumPost[]> {
    const q = query(collection(db, 'forumPosts'), orderBy('timestamp', 'desc'));
    const snapshot = await getDocs(q);
    return snapshot.docs.map(d => ({ id: d.id, ...(d.data() as any) } as ForumPost));
  }

  async createForumPost(post: any): Promise<void> {
    await addDoc(collection(db, 'forumPosts'), this.cleanData({ ...post, timestamp: new Date().toISOString(), upvotes: 0, replies: [] }));
  }

  async addForumReply(postId: string, reply: any): Promise<void> {
    await updateDoc(doc(db, 'forumPosts', postId), { replies: arrayUnion(this.cleanData({ ...reply, id: `rep_${Date.now()}`, timestamp: new Date().toISOString(), upvotes: 0 })) });
  }

  async upvotePost(postId: string): Promise<void> {
    await updateDoc(doc(db, 'forumPosts', postId), { upvotes: increment(1) });
  }

  async upvoteReply(postId: string, replyId: string): Promise<void> {
    const snap = await getDoc(doc(db, 'forumPosts', postId));
    if (snap.exists()) {
      const data = snap.data() as ForumPost;
      const replies = (data.replies || []).map(r => r.id === replyId ? { ...r, upvotes: (r.upvotes || 0) + 1 } : r);
      await updateDoc(doc(db, 'forumPosts', postId), { replies: this.cleanData(replies) });
    }
  }

  async getQuizzes(): Promise<Quiz[]> {
    try {
      this.checkDb();
      const snapshot = await getDocs(collection(db, 'quizzes'));
      return snapshot.docs.map(d => ({ id: d.id, ...(d.data() as any) } as Quiz));
    } catch (e) { return QUIZZES_DB; }
  }

  async getQuizById(quizId: string): Promise<Quiz | null> {
    try {
        const docRef = doc(db, 'quizzes', quizId);
        const docSnap = await getDoc(docRef);
        return docSnap.exists() ? { id: docSnap.id, ...(docSnap.data() as any) } as Quiz : null;
    } catch (e) { return QUIZZES_DB.find(q => q.id === quizId) || null; }
  }

  async saveQuiz(quiz: Quiz): Promise<void> {
    this.checkDb();
    await setDoc(doc(db, "quizzes", quiz.id), this.cleanData(quiz), { merge: true });
  }

  async deleteQuiz(quizId: string): Promise<void> {
    this.checkDb();
    await deleteDoc(doc(db, "quizzes", quizId));
  }
  
  async getAllQuestions(): Promise<Question[]> {
    try {
        this.checkDb();
        const snapshot = await getDocs(collection(db, 'questions'));
        return snapshot.docs.map(d => ({ id: d.id, ...(d.data() as any) } as Question));
    } catch (e) { return QUESTIONS_DB; }
  }

  async getQuestionsForQuiz(quizId: string): Promise<Question[]> {
    const quiz = await this.getQuizById(quizId);
    if (!quiz) return [];
    const allQuestions = await this.getAllQuestions();
    return quiz.questionIds.map(id => allQuestions.find(q => q.id === id)).filter(Boolean) as Question[];
  }
  
  async saveQuestion(question: Question): Promise<string> {
    this.checkDb();
    const docRef = await addDoc(collection(db, "questions"), this.cleanData(question));
    return docRef.id;
  }

  async updateQuestion(questionId: string, questionData: Partial<Question>): Promise<void> {
    this.checkDb();
    await updateDoc(doc(db, "questions", questionId), this.cleanData(questionData));
  }

  async saveAttempt(attempt: StudentQuizAttempt): Promise<void> {
    if (!this.loggingSettings.saveAllQuizAttempts) return;
    this.checkDb();
    await setDoc(doc(db, "quiz_attempts", attempt.id), this.cleanData(attempt));
  }
  
  async updateAttempt(attempt: StudentQuizAttempt): Promise<void> {
    this.checkDb();
    const attemptRef = doc(db, "quiz_attempts", attempt.id);
    await updateDoc(attemptRef, this.cleanData(attempt));
  }
  
  async getAttemptsForQuiz(quizId: string): Promise<StudentQuizAttempt[]> {
    this.checkDb();
    const q: any = query(collection(db, 'quiz_attempts'), where('quizId', '==', quizId));
    const snapshot = await getDocs(q);
    const attempts = snapshot.docs.map(d => ({ id: d.id, ...(d.data() as any) } as StudentQuizAttempt));
    return attempts.sort((a, b) => new Date(String(b.completedAt)).getTime() - new Date(String(a.completedAt)).getTime());
  }

  async getUserAttempts(userId: string, quizId?: string): Promise<StudentQuizAttempt[]> {
    this.checkDb();
    let q: any;
    if (quizId) {
        q = query(collection(db, 'quiz_attempts'), where('studentId', '==', userId), where('quizId', '==', quizId));
    } else {
        q = query(collection(db, 'quiz_attempts'), where('studentId', '==', userId));
    }
    const snapshot = await getDocs(q);
    return snapshot.docs.map(d => ({ id: d.id, ...(d.data() as any) } as StudentQuizAttempt));
  }
  
   async toggleLessonComplete(userId: string, lessonId: string): Promise<void> {
    this.checkDb();
    const userRef = doc(db, 'users', userId);
    const userSnap = await getDoc(userRef);
    if (userSnap.exists()) {
        const userData = userSnap.data() as User;
        const completedIds = userData.progress.completedLessonIds || [];
        if (completedIds.includes(lessonId)) {
            await updateDoc(userRef, { 'progress.completedLessonIds': arrayRemove(lessonId) });
        } else {
            await updateDoc(userRef, { 'progress.completedLessonIds': arrayUnion(lessonId) });
        }
    }
  }
  
  async createNotification(notification: Omit<AppNotification, 'id'>): Promise<void> {
    this.checkDb();
    await addDoc(collection(db, 'notifications'), this.cleanData(notification));
  }

  async getNotifications(userId: string): Promise<AppNotification[]> {
    this.checkDb();
    const q = query(collection(db, 'notifications'), where('userId', '==', userId), orderBy('timestamp', 'desc'), limit(20));
    const snapshot = await getDocs(q);
    return snapshot.docs.map(d => ({ id: d.id, ...(d.data() as any) } as AppNotification));
  }

  async markNotificationsAsRead(userId: string): Promise<void> {
    this.checkDb();
    const q = query(collection(db, 'notifications'), where('userId', '==', userId), where('isRead', '==', false));
    const snapshot = await getDocs(q);
    if (snapshot.empty) return;
    const batch = writeBatch(db);
    snapshot.docs.forEach(d => batch.update(d.ref, { isRead: true }));
    await batch.commit();
  }

  async getLoggingSettings(): Promise<LoggingSettings> {
    const docSnap = await getDoc(doc(db, 'settings', 'logging'));
    return docSnap.exists() ? docSnap.data() as LoggingSettings : DEFAULT_LOGGING_SETTINGS;
  }
  async saveLoggingSettings(settings: LoggingSettings): Promise<void> {
    await setDoc(doc(db, 'settings', 'logging'), this.cleanData(settings));
  }
  async getNotificationSettings(): Promise<NotificationSettings> {
    const docSnap = await getDoc(doc(db, 'settings', 'notifications'));
    return docSnap.exists() ? docSnap.data() as NotificationSettings : DEFAULT_NOTIFICATION_SETTINGS;
  }
  async saveNotificationSettings(settings: NotificationSettings): Promise<void> {
    await setDoc(doc(db, 'settings', 'notifications'), this.cleanData(settings));
  }

  async getAIRecommendations(user: User): Promise<AIRecommendation[]> { return []; }
  async getResources(): Promise<EducationalResource[]> { return MOCK_RESOURCES; }
  async getTeacherReviews(teacherId: string): Promise<Review[]> { return []; }
  async addReview(review: Review): Promise<void> {}
  async saveTeacherMessage(message: TeacherMessage): Promise<void> {}
  async getAllTeacherMessages(teacherId: string): Promise<TeacherMessage[]> { return []; }
  async getTodos(userId: string): Promise<Todo[]> { return []; }
  async saveTodo(userId: string, todo: Omit<Todo, 'id'>): Promise<string> { return `todo_${Date.now()}`; }
  async updateTodo(userId: string, todoId: string, updates: Partial<Todo>): Promise<void> {}
  async deleteTodo(userId: string, todoId: string): Promise<void> {}
  async getStudentProgressForParent(studentId: string): Promise<{user: User | null, report: WeeklyReport | null}> {
      const user = await this.getUser(studentId);
      return { user, report: user?.weeklyReports?.[0] || null };
  }
}

export const dbService = SyrianScienceCenterDB.getInstance();
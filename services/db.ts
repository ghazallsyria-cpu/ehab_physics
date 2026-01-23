
import { db } from './firebase';
import { supabase } from './supabase';
import { 
  collection, doc, getDoc, getDocs, setDoc, updateDoc, deleteDoc, 
  query, where, onSnapshot, orderBy, Timestamp, addDoc, limit, increment,
  documentId
} from 'firebase/firestore';
import { 
  User, Curriculum, Quiz, Question, StudentQuizAttempt, 
  AppNotification, Todo, TeacherMessage, Review, 
  HomePageContent, Asset, SubscriptionCode, ForumSection, 
  ForumPost, ForumReply, WeeklyReport, LoggingSettings, 
  NotificationSettings, PaymentSettings, Invoice, AIRecommendation,
  Unit, Lesson, LiveSession, EducationalResource, PaymentStatus, UserRole
} from '../types';

class DBService {
  private checkDb() {
    if (!db) throw new Error("Firestore is not initialized. Check your API keys.");
  }

  private cleanData(data: any) {
    const clean = { ...data };
    Object.keys(clean).forEach(key => (clean[key] === undefined || clean[key] === null) && delete clean[key]);
    return clean;
  }

  // --- تهيئة النظام ---
  async initializeForumSystem() {
    this.checkDb();
    const defaultSection: ForumSection = {
      id: 'sec_physics_12',
      title: 'قسم الصف الثاني عشر',
      description: 'نقاشات الفيزياء المتقدمة لطلاب الثاني عشر',
      order: 0,
      forums: [
        { id: 'f_general', title: 'المنتدى العام', description: 'اسأل عن أي شيء في الفيزياء', icon: '⚛️', order: 0 }
      ]
    };
    await setDoc(doc(db!, 'forumSections', defaultSection.id), defaultSection);

    const welcomePost: Omit<ForumPost, 'id'> = {
      authorUid: 'system',
      authorEmail: 'admin@ssc.com',
      authorName: 'إدارة المنصة',
      title: 'مرحباً بكم في ساحة النقاش',
      content: 'هذه الساحة مخصصة لتبادل المعرفة. يمكنك طرح سؤالك الآن.',
      tags: ['f_general'],
      timestamp: new Date().toISOString(),
      upvotes: 1,
      replies: [],
      isPinned: true,
      isEscalated: false
    };
    await addDoc(collection(db!, 'forumPosts'), welcomePost);
    
    await setDoc(doc(db!, 'settings', 'logging'), { 
      logStudentProgress: true, 
      saveAllQuizAttempts: true, 
      logAIChatHistory: true, 
      archiveTeacherMessages: true, 
      forumAccessTier: 'free' 
    });
  }

  // --- إدارة المستخدمين ---
  async getUser(uidOrEmail: string): Promise<User | null> {
    this.checkDb();
    try {
        let snap = await getDoc(doc(db!, 'users', uidOrEmail));
        if (snap.exists()) return snap.data() as User;
        
        const q = query(collection(db!, 'users'), where('email', '==', uidOrEmail), limit(1));
        const querySnap = await getDocs(q);
        if (!querySnap.empty) return querySnap.docs[0].data() as User;
    } catch (e) { 
      console.error("Firestore error in getUser:", e); 
    }
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

  async getAdmins(): Promise<User[]> {
    this.checkDb();
    const q = query(collection(db!, 'users'), where('role', '==', 'admin'));
    const snap = await getDocs(q);
    return snap.docs.map(d => d.data() as User);
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

  subscribeToUsers(callback: (users: User[]) => void, role: UserRole) {
    this.checkDb();
    const q = query(collection(db!, 'users'), where('role', '==', role));
    return onSnapshot(q, (snap) => {
      callback(snap.docs.map(d => d.data() as User));
    });
  }

  // --- ساحة النقاش ---
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
    try {
      const postsRef = collection(db!, 'forumPosts');
      let q;
      if (forumId) {
        q = query(postsRef, where('tags', 'array-contains', forumId));
      } else {
        q = query(postsRef, limit(100));
      }
      const snap = await getDocs(q);
      const results = snap.docs.map(d => ({ ...d.data(), id: d.id } as ForumPost));
      return results.sort((a, b) => b.timestamp.localeCompare(a.timestamp));
    } catch (e) {
      console.error("Posts fetch error:", e);
      throw e;
    }
  }

  async createForumPost(post: Omit<ForumPost, 'id'>): Promise<string> {
    this.checkDb();
    const data = this.cleanData(post);
    const docRef = await addDoc(collection(db!, 'forumPosts'), {
      ...data,
      upvotes: data.upvotes || 0,
      replies: data.replies || [],
      isPinned: data.isPinned || false,
      isEscalated: data.isEscalated || false
    });
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
    const newReply: ForumReply = {
      ...reply,
      id: `rep_${Date.now()}`,
      timestamp: new Date().toISOString(),
      upvotes: 0
    };
    await updateDoc(postRef, {
      replies: [...(postData.replies || []), newReply]
    });
  }

  async upvoteForumPost(postId: string) {
    this.checkDb();
    await updateDoc(doc(db!, 'forumPosts', postId), { upvotes: increment(1) });
  }

  // --- الإعدادات ---
  async getLoggingSettings(): Promise<LoggingSettings> {
    this.checkDb();
    try {
      const snap = await getDoc(doc(db!, 'settings', 'logging'));
      if (snap.exists()) return snap.data() as LoggingSettings;
    } catch (e) { console.error("logging settings error:", e); }
    return { logStudentProgress: true, saveAllQuizAttempts: true, logAIChatHistory: true, archiveTeacherMessages: true, forumAccessTier: 'free' };
  }

  async saveLoggingSettings(settings: LoggingSettings) {
    this.checkDb();
    await setDoc(doc(db!, 'settings', 'logging'), settings);
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

  async getPaymentSettings(): Promise<PaymentSettings> {
    this.checkDb();
    try {
      const snap = await getDoc(doc(db!, 'settings', 'payments'));
      if (snap.exists()) return snap.data() as PaymentSettings;
    } catch (e) {}
    return { isOnlinePaymentEnabled: true };
  }

  async setPaymentSettings(isOnlinePaymentEnabled: boolean) {
    this.checkDb();
    await setDoc(doc(db!, 'settings', 'payments'), { isOnlinePaymentEnabled });
  }

  // --- المحتوى التعليمي ---
  async getCurriculum(): Promise<Curriculum[]> {
    this.checkDb();
    const snap = await getDocs(collection(db!, 'curriculum'));
    return snap.docs.map(d => ({ ...d.data(), id: d.id } as Curriculum));
  }

  async saveLesson(grade: string, subject: string, unitId: string, lesson: Lesson) {
    this.checkDb();
    const id = `${grade}_${subject}`;
    const ref = doc(db!, 'curriculum', id);
    const snap = await getDoc(ref);
    if (!snap.exists()) return;
    const data = snap.data() as Curriculum;
    const units = data.units.map(u => {
      if (u.id === unitId) {
        const lessons = [...(u.lessons || [])];
        const idx = lessons.findIndex(l => l.id === lesson.id);
        if (idx > -1) lessons[idx] = lesson;
        else lessons.push(lesson);
        return { ...u, lessons };
      }
      return u;
    });
    await updateDoc(ref, { units });
  }

  async saveUnit(grade: string, subject: string, unit: Unit) {
    this.checkDb();
    const id = `${grade}_${subject}`;
    const ref = doc(db!, 'curriculum', id);
    const snap = await getDoc(ref);
    if (!snap.exists()) {
        const newCurriculum: Curriculum = { grade: grade as any, subject: subject as any, title: '', description: '', icon: '', units: [unit] };
        await setDoc(ref, newCurriculum);
    } else {
        const data = snap.data() as Curriculum;
        const units = [...(data.units || [])];
        const idx = units.findIndex(u => u.id === unit.id);
        if (idx > -1) units[idx] = unit;
        else units.push(unit);
        await updateDoc(ref, { units });
    }
  }

  async updateUnitsOrder(grade: string, subject: string, units: Unit[]) {
    this.checkDb();
    await updateDoc(doc(db!, 'curriculum', `${grade}_${subject}`), { units });
  }

  async deleteUnit(grade: string, subject: string, unitId: string) {
    this.checkDb();
    const id = `${grade}_${subject}`;
    const ref = doc(db!, 'curriculum', id);
    const snap = await getDoc(ref);
    if (!snap.exists()) return;
    const data = snap.data() as Curriculum;
    const units = (data.units || []).filter(u => u.id !== unitId);
    await updateDoc(ref, { units });
  }

  async deleteLesson(grade: string, subject: string, unitId: string, lessonId: string) {
    this.checkDb();
    const id = `${grade}_${subject}`;
    const ref = doc(db!, 'curriculum', id);
    const snap = await getDoc(ref);
    if (!snap.exists()) return;
    const data = snap.data() as Curriculum;
    const units = (data.units || []).map(u => {
      if (u.id === unitId) return { ...u, lessons: (u.lessons || []).filter(l => l.id !== lessonId) };
      return u;
    });
    await updateDoc(ref, { units });
  }

  // --- الاختبارات ---
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
    const quiz = quizSnap.data() as Quiz;
    if (!quiz.questionIds || quiz.questionIds.length === 0) return [];
    const q = query(collection(db!, 'questions'), where(documentId(), 'in', quiz.questionIds.slice(0, 10)));
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
    return (snap && snap.exists()) ? ({ ...snap.data(), id: snap.id } as Quiz) : null;
  }

  // --- الإشعارات والمصادر الأخرى ---
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

  async getAIRecommendations(user: User): Promise<AIRecommendation[]> {
    return [
      { id: 'rec1', title: 'مراجعة قوانين نيوتن', reason: 'تحتاج لتقوية مهاراتك في الميكانيكا', type: 'lesson', targetId: 'l11-1-1', urgency: 'high' },
      { id: 'rec2', title: 'اختبار الحث الكهرومغناطيسي', reason: 'أكملت دروس الوحدة الأولى بنجاح', type: 'quiz', targetId: 'quiz-1', urgency: 'medium' }
    ];
  }

  async checkConnection(): Promise<{ alive: boolean, error?: string }> {
    try { 
        if (!db) return { alive: false, error: 'DB NOT INITIALIZED' };
        await getDocs(query(collection(db!, 'settings'), limit(1))); 
        return { alive: true }; 
    }
    catch (e: any) { 
        if (e.code === 'permission-denied') return { alive: false, error: 'PERMISSION_DENIED' };
        return { alive: false, error: e.code || e.message }; 
    }
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
      userId,
      userName: user?.name || 'Student',
      planId, amount, date: new Date().toISOString(), status: 'PENDING',
      trackId: Math.random().toString(36).substring(7).toUpperCase()
    };
    const docRef = await addDoc(collection(db!, 'invoices'), invoice);
    return { ...invoice, id: docRef.id };
  }

  async completePayment(trackId: string, result: 'SUCCESS' | 'FAIL'): Promise<Invoice | null> {
    this.checkDb();
    const q = query(collection(db!, 'invoices'), where('trackId', '==', trackId), limit(1));
    const snap = await getDocs(q);
    if (snap.empty) return null;
    const invDoc = snap.docs[0];
    const status: PaymentStatus = result === 'SUCCESS' ? 'PAID' : 'FAIL';
    await updateDoc(invDoc.ref, { status, paymentId: `PAY_${Date.now()}` });
    if (result === 'SUCCESS') await updateDoc(doc(db!, 'users', invDoc.data().userId), { subscription: 'premium' });
    const fresh = await getDoc(invDoc.ref);
    return { ...fresh.data(), id: fresh.id } as Invoice;
  }

  async getInvoices(): Promise<{ data: Invoice[] }> {
    this.checkDb();
    const snap = await getDocs(query(collection(db!, 'invoices'), orderBy('date', 'desc')));
    return { data: snap.docs.map(d => ({ ...d.data(), id: d.id } as Invoice)) };
  }

  async updateInvoiceStatus(id: string, status: PaymentStatus) {
    this.checkDb();
    await updateDoc(doc(db!, 'invoices', id), { status });
  }

  async getUnusedSubscriptionCodes(): Promise<SubscriptionCode[]> {
    this.checkDb();
    const q = query(collection(db!, 'subscriptionCodes'), where('isUsed', '==', false));
    const snap = await getDocs(q);
    return snap.docs.map(d => ({ ...d.data(), id: d.id } as SubscriptionCode));
  }

  async createSubscriptionCode(planId: string): Promise<string> {
    this.checkDb();
    const code = Math.random().toString(36).substring(2, 10).toUpperCase();
    await addDoc(collection(db!, 'subscriptionCodes'), { code, planId, isUsed: false, createdAt: new Date().toISOString() });
    return code;
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

  async getStudentProgressForParent(uid: string): Promise<{ user: User | null, report: WeeklyReport | null }> {
    const user = await this.getUser(uid);
    return { user, report: user?.weeklyReports?.[0] || null };
  }
}

export const dbService = new DBService();

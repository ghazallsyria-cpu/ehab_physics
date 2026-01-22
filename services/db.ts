
import { db } from './firebase';
import { supabase } from './supabase';
import { 
  collection, doc, getDoc, getDocs, setDoc, updateDoc, deleteDoc, 
  query, where, onSnapshot, orderBy, Timestamp, addDoc, limit, increment
} from 'firebase/firestore';
import { 
  User, Curriculum, Quiz, Question, StudentQuizAttempt, 
  AppNotification, Todo, TeacherMessage, Review, 
  HomePageContent, Asset, SubscriptionCode, ForumSection, 
  ForumPost, ForumReply, WeeklyReport, LoggingSettings, 
  NotificationSettings, PaymentSettings, Invoice, AIRecommendation,
  Unit, Lesson, LiveSession
} from '../types';
import { MOCK_RESOURCES } from '../constants';

class DBService {
  private checkDb() {
    if (!db) throw new Error("Firestore is not initialized");
  }

  private cleanData(data: any) {
    const clean = { ...data };
    Object.keys(clean).forEach(key => clean[key] === undefined && delete clean[key]);
    return clean;
  }

  async checkConnection(): Promise<{ alive: boolean, error?: string }> {
    try {
      this.checkDb();
      await getDocs(query(collection(db, 'settings'), limit(1)));
      return { alive: true };
    } catch (e: any) {
      return { alive: false, error: e.code || e.message };
    }
  }

  async checkSupabaseConnection(): Promise<{ alive: boolean, error?: string }> {
    try {
      const { data, error } = await supabase.storage.listBuckets();
      if (error) throw error;
      return { alive: true };
    } catch (e: any) {
      return { alive: false, error: e.message };
    }
  }

  async getLoggingSettings(): Promise<LoggingSettings> {
    this.checkDb();
    const snap = await getDoc(doc(db, 'settings', 'logging'));
    if (snap.exists()) {
        const data = snap.data();
        return {
            logStudentProgress: data.logStudentProgress ?? true,
            saveAllQuizAttempts: data.saveAllQuizAttempts ?? true,
            logAIChatHistory: data.logAIChatHistory ?? true,
            archiveTeacherMessages: data.archiveTeacherMessages ?? true,
            forumAccessTier: data.forumAccessTier ?? 'free'
        };
    }
    return { 
      logStudentProgress: true, 
      saveAllQuizAttempts: true, 
      logAIChatHistory: true, 
      archiveTeacherMessages: true,
      forumAccessTier: 'free' 
    };
  }

  async saveLoggingSettings(settings: LoggingSettings) {
    this.checkDb();
    await setDoc(doc(db, 'settings', 'logging'), settings);
  }

  async getNotificationSettings(): Promise<NotificationSettings> {
    this.checkDb();
    const snap = await getDoc(doc(db, 'settings', 'notifications'));
    return snap.exists() ? snap.data() as NotificationSettings : { pushForLiveSessions: true, pushForGradedQuizzes: true, pushForAdminAlerts: true };
  }

  async saveNotificationSettings(settings: NotificationSettings) {
    this.checkDb();
    await setDoc(doc(db, 'settings', 'notifications'), settings);
  }

  async getPaymentSettings(): Promise<PaymentSettings> {
    this.checkDb();
    const snap = await getDoc(doc(db, 'settings', 'payments'));
    return snap.exists() ? snap.data() as PaymentSettings : { isOnlinePaymentEnabled: true };
  }

  async setPaymentSettings(enabled: boolean) {
    this.checkDb();
    await setDoc(doc(db, 'settings', 'payments'), { isOnlinePaymentEnabled: enabled });
  }

  async getUser(uidOrEmail: string): Promise<User | null> {
    this.checkDb();
    let snap = await getDoc(doc(db, 'users', uidOrEmail));
    if (snap.exists()) return snap.data() as User;
    
    const q = query(collection(db, 'users'), where('email', '==', uidOrEmail), limit(1));
    const querySnap = await getDocs(q);
    if (!querySnap.empty) return querySnap.docs[0].data() as User;
    
    return null;
  }

  async saveUser(user: User) {
    this.checkDb();
    await setDoc(doc(db, 'users', user.uid), this.cleanData(user));
  }

  async deleteUser(uid: string) {
    this.checkDb();
    await deleteDoc(doc(db, 'users', uid));
  }

  async getTeachers(): Promise<User[]> {
    this.checkDb();
    const q = query(collection(db, 'users'), where('role', '==', 'teacher'));
    const snap = await getDocs(q);
    return snap.docs.map(d => d.data() as User);
  }

  subscribeToUsers(callback: (users: User[]) => void, role: 'student' | 'teacher') {
    this.checkDb();
    const q = query(collection(db, 'users'), where('role', '==', role));
    return onSnapshot(q, (snap) => {
      callback(snap.docs.map(d => d.data() as User));
    });
  }

  async getCurriculum(): Promise<Curriculum[]> {
    this.checkDb();
    const snap = await getDocs(collection(db, 'curriculum'));
    return snap.docs.map(d => d.data() as Curriculum);
  }

  async saveUnit(grade: string, subject: string, unit: Unit) {
    this.checkDb();
    const id = `${grade}_${subject}`;
    const ref = doc(db, 'curriculum', id);
    const snap = await getDoc(ref);
    if (snap.exists()) {
      const data = snap.data() as Curriculum;
      const units = [...data.units];
      const idx = units.findIndex(u => u.id === unit.id);
      if (idx > -1) units[idx] = unit;
      else units.push(unit);
      await updateDoc(ref, { units });
    } else {
      await setDoc(ref, { grade, subject, units: [unit], title: `${subject} - Grade ${grade}`, icon: '📚' });
    }
  }

  async deleteUnit(grade: string, subject: string, unitId: string) {
    this.checkDb();
    const id = `${grade}_${subject}`;
    const ref = doc(db, 'curriculum', id);
    const snap = await getDoc(ref);
    if (snap.exists()) {
      const data = snap.data() as Curriculum;
      const units = data.units.filter(u => u.id !== unitId);
      await updateDoc(ref, { units });
    }
  }

  async saveLesson(grade: string, subject: string, unitId: string, lesson: Lesson) {
    this.checkDb();
    const id = `${grade}_${subject}`;
    const ref = doc(db, 'curriculum', id);
    const snap = await getDoc(ref);
    if (snap.exists()) {
      const data = snap.data() as Curriculum;
      const units = data.units.map(u => {
        if (u.id === unitId) {
          const lessons = [...u.lessons];
          const idx = lessons.findIndex(l => l.id === lesson.id);
          if (idx > -1) lessons[idx] = lesson;
          else lessons.push(lesson);
          return { ...u, lessons };
        }
        return u;
      });
      await updateDoc(ref, { units });
    }
  }

  async deleteLesson(grade: string, subject: string, unitId: string, lessonId: string) {
    this.checkDb();
    const id = `${grade}_${subject}`;
    const ref = doc(db, 'curriculum', id);
    const snap = await getDoc(ref);
    if (snap.exists()) {
      const data = snap.data() as Curriculum;
      const units = data.units.map(u => {
        if (u.id === unitId) {
          return { ...u, lessons: u.lessons.filter(l => l.id !== lessonId) };
        }
        return u;
      });
      await updateDoc(ref, { units });
    }
  }

  async updateUnitsOrder(grade: string, subject: string, units: Unit[]) {
    this.checkDb();
    const id = `${grade}_${subject}`;
    await updateDoc(doc(db, 'curriculum', id), { units });
  }

  async toggleLessonComplete(uid: string, lessonId: string) {
    this.checkDb();
    const ref = doc(db, 'users', uid);
    const snap = await getDoc(ref);
    if (snap.exists()) {
      const user = snap.data() as User;
      const completed = user.progress.completedLessonIds || [];
      const newCompleted = completed.includes(lessonId) 
        ? completed.filter(id => id !== lessonId) 
        : [...completed, lessonId];
      
      const points = completed.includes(lessonId) ? user.progress.points : user.progress.points + 10;
      await updateDoc(ref, { 
        'progress.completedLessonIds': newCompleted,
        'progress.points': points
      });
    }
  }

  async getQuizzes(): Promise<Quiz[]> {
    this.checkDb();
    const snap = await getDocs(collection(db, 'quizzes'));
    return snap.docs.map(d => ({ ...d.data(), id: d.id } as Quiz));
  }

  async getQuizById(id: string): Promise<Quiz | null> {
    this.checkDb();
    const snap = await getDoc(doc(db, 'quizzes', id));
    return snap.exists() ? { ...snap.data(), id: snap.id } as Quiz : null;
  }

  async saveQuiz(quiz: Quiz) {
    this.checkDb();
    const { id, ...data } = quiz;
    await setDoc(doc(db, 'quizzes', id), this.cleanData(data));
  }

  async deleteQuiz(id: string) {
    this.checkDb();
    await deleteDoc(doc(db, 'quizzes', id));
  }

  async getQuestionsForQuiz(quizId: string): Promise<Question[]> {
    this.checkDb();
    const quizSnap = await getDoc(doc(db, 'quizzes', quizId));
    if (!quizSnap.exists()) return [];
    const quiz = quizSnap.data() as Quiz;
    const questions: Question[] = [];
    for (const qId of quiz.questionIds) {
      const qSnap = await getDoc(doc(db, 'questions', qId));
      if (qSnap.exists()) questions.push({ ...qSnap.data(), id: qSnap.id } as Question);
    }
    return questions;
  }

  async getAllQuestions(): Promise<Question[]> {
    this.checkDb();
    const snap = await getDocs(collection(db, 'questions'));
    return snap.docs.map(d => ({ ...d.data(), id: d.id } as Question));
  }

  async saveQuestion(q: Question): Promise<string> {
    this.checkDb();
    const { id, ...data } = q;
    if (id && !id.startsWith('temp-')) {
      await setDoc(doc(db, 'questions', id), this.cleanData(data));
      return id;
    } else {
      const res = await addDoc(collection(db, 'questions'), this.cleanData(data));
      return res.id;
    }
  }

  async updateQuestion(id: string, q: Question) {
    this.checkDb();
    await setDoc(doc(db, 'questions', id), this.cleanData(q));
  }

  async saveAttempt(attempt: StudentQuizAttempt) {
    this.checkDb();
    await setDoc(doc(db, 'attempts', attempt.id), this.cleanData(attempt));
    if (attempt.score > 0) {
       await updateDoc(doc(db, 'users', attempt.studentId), {
         'progress.points': increment(attempt.score)
       });
    }
  }

  async updateAttempt(attempt: StudentQuizAttempt) {
    this.checkDb();
    await setDoc(doc(db, 'attempts', attempt.id), this.cleanData(attempt));
  }

  async getUserAttempts(uid: string, quizId?: string): Promise<StudentQuizAttempt[]> {
    this.checkDb();
    let q = query(collection(db, 'attempts'), where('studentId', '==', uid));
    if (quizId) q = query(q, where('quizId', '==', quizId));
    const snap = await getDocs(q);
    return snap.docs.map(d => d.data() as StudentQuizAttempt);
  }

  async getAttemptsForQuiz(quizId: string): Promise<StudentQuizAttempt[]> {
    this.checkDb();
    const q = query(collection(db, 'attempts'), where('quizId', '==', quizId));
    const snap = await getDocs(q);
    return snap.docs.map(d => d.data() as StudentQuizAttempt);
  }

  async getForumSections(): Promise<ForumSection[]> {
    this.checkDb();
    const snap = await getDocs(query(collection(db, 'forumSections'), orderBy('order')));
    return snap.docs.map(d => d.data() as ForumSection);
  }

  async saveForumSections(sections: ForumSection[]) {
    this.checkDb();
    for (const sec of sections) {
      await setDoc(doc(db, 'forumSections', sec.id), this.cleanData(sec));
    }
  }

  async getForumPosts(forumId?: string): Promise<ForumPost[]> {
    this.checkDb();
    try {
        let q;
        if (forumId) {
            q = query(collection(db, 'forumPosts'), where('tags', 'array-contains', forumId), orderBy('timestamp', 'desc'));
        } else {
            q = query(collection(db, 'forumPosts'), orderBy('timestamp', 'desc'));
        }
        const snap = await getDocs(q);
        return snap.docs.map(d => ({ ...d.data(), id: d.id } as ForumPost));
    } catch (e: any) {
        console.warn("Fallback to manual filter for ForumPosts:", e.message);
        const allSnap = await getDocs(collection(db, 'forumPosts'));
        let all = allSnap.docs.map(d => ({ ...d.data(), id: d.id } as ForumPost));
        if (forumId) {
            all = all.filter(p => p.tags && p.tags.includes(forumId));
        }
        return all.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
    }
  }

  async createForumPost(post: Omit<ForumPost, 'id' | 'timestamp' | 'upvotes' | 'replies'>): Promise<string> {
    this.checkDb();
    const docRef = await addDoc(collection(db, 'forumPosts'), {
      ...this.cleanData(post),
      timestamp: new Date().toISOString(),
      upvotes: 0,
      replies: []
    });
    return docRef.id;
  }

  async addForumReply(postId: string, reply: Omit<ForumReply, 'id' | 'timestamp' | 'upvotes'>) {
    this.checkDb();
    const ref = doc(db, 'forumPosts', postId);
    const snap = await getDoc(ref);
    if (snap.exists()) {
      const data = snap.data() as ForumPost;
      const newReply: ForumReply = {
        ...reply,
        id: `rep_${Date.now()}`,
        timestamp: new Date().toISOString(),
        upvotes: 0
      };
      await updateDoc(ref, {
        replies: [...(data.replies || []), newReply]
      });
    }
  }

  async updateForumPost(postId: string, updates: Partial<ForumPost>) {
    this.checkDb();
    await updateDoc(doc(db, 'forumPosts', postId), this.cleanData(updates));
  }

  async deleteForumPost(postId: string) {
    this.checkDb();
    await deleteDoc(doc(db, 'forumPosts', postId));
  }

  async upvoteForumPost(postId: string) {
    this.checkDb();
    await updateDoc(doc(db, 'forumPosts', postId), {
      upvotes: increment(1)
    });
  }

  async getNotifications(uid: string): Promise<AppNotification[]> {
    this.checkDb();
    const q = query(collection(db, 'notifications'), where('userId', '==', uid), orderBy('timestamp', 'desc'));
    const snap = await getDocs(q);
    return snap.docs.map(d => ({ ...d.data(), id: d.id } as AppNotification));
  }

  async createNotification(note: Omit<AppNotification, 'id'>) {
    this.checkDb();
    await addDoc(collection(db, 'notifications'), this.cleanData(note));
  }

  async markNotificationsAsRead(uid: string) {
    this.checkDb();
    const q = query(collection(db, 'notifications'), where('userId', '==', uid), where('isRead', '==', false));
    const snap = await getDocs(q);
    for (const d of snap.docs) {
      await updateDoc(d.ref, { isRead: true });
    }
  }

  async getLiveSessions(): Promise<LiveSession[]> {
    this.checkDb();
    const snap = await getDocs(collection(db, 'liveSessions'));
    return snap.docs.map(d => ({ ...d.data(), id: d.id } as LiveSession));
  }

  subscribeToLiveSessions(callback: (sessions: LiveSession[]) => void) {
    this.checkDb();
    return onSnapshot(collection(db, 'liveSessions'), (snap) => {
      callback(snap.docs.map(d => ({ ...d.data(), id: d.id } as LiveSession)));
    });
  }

  async saveLiveSession(session: Partial<LiveSession>) {
    this.checkDb();
    if (session.id) {
      await setDoc(doc(db, 'liveSessions', session.id), this.cleanData(session));
    } else {
      await addDoc(collection(db, 'liveSessions'), this.cleanData(session));
    }
  }

  async deleteLiveSession(id: string) {
    this.checkDb();
    await deleteDoc(doc(db, 'liveSessions', id));
  }

  async uploadAsset(file: File): Promise<Asset> {
    const name = `${Date.now()}_${file.name}`;
    const { data, error } = await supabase.storage.from('assets').upload(name, file);
    if (error) throw error;
    
    const { data: { publicUrl } } = supabase.storage.from('assets').getPublicUrl(name);
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

  async getInvoices(): Promise<{ data: Invoice[] }> {
    this.checkDb();
    const snap = await getDocs(collection(db, 'invoices'));
    return { data: snap.docs.map(d => ({ ...d.data(), id: d.id } as Invoice)) };
  }

  async initiatePayment(userId: string, planId: string, amount: number): Promise<Invoice> {
    this.checkDb();
    const user = await this.getUser(userId);
    const invoice: Omit<Invoice, 'id'> = {
      userId,
      userName: user?.name || 'Unknown',
      planId,
      amount,
      date: new Date().toISOString(),
      status: 'PENDING',
      trackId: `TRK_${Date.now()}`
    };
    const res = await addDoc(collection(db, 'invoices'), invoice);
    return { ...invoice, id: res.id };
  }

  async completePayment(trackId: string, status: 'SUCCESS' | 'FAIL'): Promise<Invoice | null> {
    this.checkDb();
    const q = query(collection(db, 'invoices'), where('trackId', '==', trackId), limit(1));
    const snap = await getDocs(q);
    if (!snap.empty) {
      const d = snap.docs[0];
      const invoice = d.data() as Invoice;
      const updatedStatus = status === 'SUCCESS' ? 'PAID' : 'FAIL';
      await updateDoc(d.ref, { 
        status: updatedStatus,
        paymentId: `PAY_${Date.now()}`,
        authCode: `AUTH_${Math.floor(Math.random() * 1000000)}`
      });
      
      if (updatedStatus === 'PAID') {
        await updateDoc(doc(db, 'users', invoice.userId), { subscription: 'premium' });
      }
      
      const freshSnap = await getDoc(d.ref);
      return { ...freshSnap.data(), id: freshSnap.id } as Invoice;
    }
    return null;
  }

  async updateInvoiceStatus(id: string, status: 'PAID' | 'PENDING' | 'FAIL') {
    this.checkDb();
    await updateDoc(doc(db, 'invoices', id), { status });
  }

  async createSubscriptionCode(planId: string) {
    this.checkDb();
    const code = Math.random().toString(36).substring(2, 10).toUpperCase();
    await addDoc(collection(db, 'subscriptionCodes'), {
      code, planId, isUsed: false, createdAt: new Date().toISOString(), activatedAt: null, userId: null
    });
  }

  async getUnusedSubscriptionCodes(): Promise<SubscriptionCode[]> {
    this.checkDb();
    const q = query(collection(db, 'subscriptionCodes'), where('isUsed', '==', false));
    const snap = await getDocs(q);
    return snap.docs.map(d => ({ ...d.data(), id: d.id } as SubscriptionCode));
  }

  async getAIRecommendations(user: User): Promise<AIRecommendation[]> {
    return [
      { id: 'rec1', title: 'مراجعة قانون فاراداي', reason: 'لقد أخطأت في السؤال المتعلق بالحث مرتين.', type: 'lesson', targetId: 'l12-1-1', urgency: 'high' },
      { id: 'rec2', title: 'تحدي الفيزياء الحديثة', reason: 'مستواك متقدم جداً في الميكانيكا، جرب هذا التحدي.', type: 'challenge', targetId: 'quiz-2', urgency: 'medium' }
    ];
  }

  async getStudentProgressForParent(uid: string): Promise<{ user: User | null, report: WeeklyReport | null }> {
    const user = await this.getUser(uid);
    const report = user?.weeklyReports?.[0] || null;
    return { user, report };
  }

  async getTodos(uid: string): Promise<Todo[]> {
    this.checkDb();
    const q = query(collection(db, 'users', uid, 'todos'), orderBy('createdAt', 'desc'));
    const snap = await getDocs(q);
    return snap.docs.map(d => ({ ...d.data(), id: d.id } as Todo));
  }

  async saveTodo(uid: string, todo: Omit<Todo, 'id'>): Promise<string> {
    this.checkDb();
    const res = await addDoc(collection(db, 'users', uid, 'todos'), todo);
    return res.id;
  }

  async updateTodo(uid: string, id: string, updates: Partial<Todo>) {
    this.checkDb();
    await updateDoc(doc(db, 'users', uid, 'todos', id), updates);
  }

  async deleteTodo(uid: string, id: string) {
    this.checkDb();
    await deleteDoc(doc(db, 'users', uid, 'todos', id));
  }

  async getResources(): Promise<Asset[]> {
    return MOCK_RESOURCES as any;
  }

  async getHomePageContent(): Promise<HomePageContent[]> {
    this.checkDb();
    const snap = await getDocs(query(collection(db, 'homePageContent'), orderBy('createdAt', 'desc')));
    return snap.docs.map(d => ({ ...d.data(), id: d.id } as HomePageContent));
  }

  async saveHomePageContent(item: Partial<HomePageContent>) {
    this.checkDb();
    if (item.id) {
      await setDoc(doc(db, 'homePageContent', item.id), this.cleanData(item));
    } else {
      await addDoc(collection(db, 'homePageContent'), { ...this.cleanData(item), createdAt: new Date().toISOString() });
    }
  }

  async deleteHomePageContent(id: string) {
    this.checkDb();
    await deleteDoc(doc(db, 'homePageContent', id));
  }

  async getTeacherReviews(teacherId: string): Promise<Review[]> {
    this.checkDb();
    const q = query(collection(db, 'reviews'), where('teacherId', '==', teacherId), orderBy('timestamp', 'desc'));
    const snap = await getDocs(q);
    return snap.docs.map(d => ({ ...d.data(), id: d.id } as Review));
  }

  async addReview(review: Review) {
    this.checkDb();
    await addDoc(collection(db, 'reviews'), this.cleanData(review));
  }

  async saveTeacherMessage(msg: TeacherMessage) {
    this.checkDb();
    await setDoc(doc(db, 'teacherMessages', msg.id), this.cleanData(msg));
  }

  async getAllTeacherMessages(teacherId: string): Promise<TeacherMessage[]> {
    this.checkDb();
    const q = query(collection(db, 'teacherMessages'), where('teacherId', '==', teacherId), orderBy('timestamp', 'desc'));
    const snap = await getDocs(q);
    return snap.docs.map(d => d.data() as TeacherMessage);
  }
}

export const dbService = new DBService();

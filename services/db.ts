
import { User, Curriculum, Unit, Lesson, StudentQuizAttempt, AIRecommendation, Challenge, LeaderboardEntry, StudyGoal, EducationalResource, Invoice, PaymentStatus, ForumPost, ForumReply, Review, TeacherMessage, Todo, AppNotification, WeeklyReport, PaymentSettings, SubscriptionCode, LoggingSettings, LiveSession, Question, Quiz } from "../types";
import { db } from "./firebase";
import { doc, getDoc, setDoc, getDocs, collection, deleteDoc, addDoc, query, where, updateDoc, arrayUnion, arrayRemove, increment, writeBatch, orderBy, limit, onSnapshot } from "firebase/firestore";
import { QUIZZES_DB, QUESTIONS_DB, CHALLENGES_DB, LEADERBOARD_DATA, STUDY_GOALS_DB } from "../constants";

const DEFAULT_LOGGING_SETTINGS: LoggingSettings = {
  logStudentProgress: true,
  saveAllQuizAttempts: true,
  logAIChatHistory: true,
  archiveTeacherMessages: true,
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

  async getCurriculum(): Promise<Curriculum[]> {
    this.checkDb();
    const snapshot = await getDocs(collection(db, 'curriculum'));
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }) as Curriculum);
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

  // --- Financial & Other methods ---
  async updateInvoiceStatus(id: string, status: PaymentStatus): Promise<void> {
    const docRef = doc(db, 'invoices', id);
    await updateDoc(docRef, { status });
    if (status === 'PAID') {
        const snap = await getDoc(docRef);
        if (snap.exists()) {
            await updateDoc(doc(db, 'users', snap.data().userId), { subscription: 'premium' });
        }
    }
  }

  async getUser(identifier: string): Promise<User | null> {
    try {
        const userDocRef = doc(db, "users", identifier);
        const userSnap = await getDoc(userDocRef);
        if (userSnap.exists()) return { uid: userSnap.id, ...userSnap.data() } as User;
        const q = query(collection(db, "users"), where("email", "==", identifier));
        const querySnapshot = await getDocs(q);
        if (!querySnapshot.empty) return { uid: querySnapshot.docs[0].id, ...querySnapshot.docs[0].data() } as User;
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
    return snap.docs.map(doc => ({ uid: doc.id, ...doc.data() }) as User).filter(u => u.role === 'teacher');
  }

  async getAllStudents(): Promise<User[]> {
    const snap = await getDocs(collection(db, "users"));
    return snap.docs.map(doc => ({ uid: doc.id, ...doc.data() }) as User).filter(u => u.role === 'student');
  }

  async getLiveSessions(): Promise<LiveSession[]> {
    const snapshot = await getDocs(collection(db, "live_sessions"));
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }) as LiveSession);
  }

  subscribeToLiveSessions(callback: (sessions: LiveSession[]) => void) {
    this.checkDb();
    const q = collection(db, "live_sessions");
    return onSnapshot(q, (snapshot) => {
      const sessions = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as LiveSession));
      callback(sessions);
    }, (error) => {
      console.error("Live Sessions Subscription Error:", error);
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
    return { data: snapshot.docs.map(d => ({id: d.id, ...d.data()}) as Invoice) };
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
    const updateData = { status: status === 'SUCCESS' ? 'PAID' : 'FAIL' };
    await updateDoc(docRef, updateData);
    if (status === 'SUCCESS') await updateDoc(doc(db, 'users', snapshot.docs[0].data().userId), { subscription: 'premium' });
    return { ...snapshot.docs[0].data(), id: snapshot.docs[0].id, ...updateData } as Invoice;
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
    return snapshot.docs.map(d => ({id: d.id, ...d.data()}) as SubscriptionCode);
  }

  async createSubscriptionCode(planId: string): Promise<void> {
    const newCode = { code: Math.random().toString(36).substring(2, 10).toUpperCase(), planId, isUsed: false, createdAt: new Date().toISOString(), activatedAt: null, userId: null };
    await addDoc(collection(db, 'subscription_codes'), this.cleanData(newCode));
  }

  async getForumPosts(): Promise<ForumPost[]> {
    const q = query(collection(db, 'forumPosts'), orderBy('timestamp', 'desc'));
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }) as ForumPost);
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
      const replies = data.replies?.map(r => r.id === replyId ? { ...r, upvotes: (r.upvotes || 0) + 1 } : r);
      await updateDoc(doc(db, 'forumPosts', postId), { replies });
    }
  }

  async getLoggingSettings(): Promise<LoggingSettings> {
    const docSnap = await getDoc(doc(db, "settings", "data_logging"));
    return docSnap.exists() ? { ...DEFAULT_LOGGING_SETTINGS, ...docSnap.data() } as LoggingSettings : DEFAULT_LOGGING_SETTINGS;
  }

  async saveLoggingSettings(settings: LoggingSettings): Promise<void> {
    await setDoc(doc(db, "settings", "data_logging"), this.cleanData(settings), { merge: true });
  }

  async toggleLessonComplete(userId: string, lessonId: string) {
    const userRef = doc(db, 'users', userId);
    const userSnap = await getDoc(userRef);
    if (!userSnap.exists()) return;
    const completed = userSnap.data().progress?.completedLessonIds || [];
    if (completed.includes(lessonId)) await updateDoc(userRef, { 'progress.completedLessonIds': arrayRemove(lessonId) });
    else await updateDoc(userRef, { 'progress.completedLessonIds': arrayUnion(lessonId), 'progress.points': increment(10) });
  }

  async getAllQuestions(): Promise<Question[]> {
    try { const snapshot = await getDocs(collection(db, 'questions')); return snapshot.docs.map(d => ({id: d.id, ...d.data()}) as Question); }
    catch (e) { return QUESTIONS_DB; }
  }

  async saveQuestion(question: Partial<Question>): Promise<void> {
    await addDoc(collection(db, 'questions'), this.cleanData(question));
  }

  getQuizzes(): Quiz[] { return QUIZZES_DB; }
  getQuestionsForQuiz(quizId: string): Question[] {
    const quiz = QUIZZES_DB.find(q => q.id === quizId);
    return quiz ? QUESTIONS_DB.filter(q => quiz.questionIds.includes(q.id)) : [];
  }

  async saveAttempt(attempt: StudentQuizAttempt) {
    const batch = writeBatch(db);
    const userRef = doc(db, 'users', attempt.studentId);
    batch.update(userRef, { 'progress.points': increment(attempt.score * 5) });
    const attemptRef = doc(collection(db, 'attempts'));
    batch.set(attemptRef, this.cleanData(attempt));
    await batch.commit();
  }

  async getUserAttempts(userId: string, quizId?: string): Promise<StudentQuizAttempt[]> {
    let q = query(collection(db, "attempts"), where("studentId", "==", userId));
    if(quizId) q = query(q, where("quizId", "==", quizId));
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => doc.data() as StudentQuizAttempt);
  }

  async getChallenges(): Promise<Challenge[]> {
    const snapshot = await getDocs(collection(db, 'challenges'));
    return snapshot.docs.length > 0 ? snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }) as Challenge) : CHALLENGES_DB;
  }

  async getStudyGoals(): Promise<StudyGoal[]> {
    const snapshot = await getDocs(collection(db, 'study_goals'));
    return snapshot.docs.length > 0 ? snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }) as StudyGoal) : STUDY_GOALS_DB;
  }

  async getLeaderboard(): Promise<LeaderboardEntry[]> {
    try {
        const q = query(collection(db, 'users'), where('role', '==', 'student'), orderBy('progress.points', 'desc'), limit(10));
        const snapshot = await getDocs(q);
        return snapshot.docs.map((doc, index) => ({ rank: index + 1, name: doc.data().name, points: doc.data().progress.points, isCurrentUser: false }));
    } catch (e) { return LEADERBOARD_DATA; }
  }

  async getAIRecommendations(user: User): Promise<AIRecommendation[]> {
    return [{ id: 'rec-1', title: 'مراجعة قانون فاراداي', reason: 'لاحظنا بعض الصعوبة في الاختبار الأخير.', type: 'lesson', targetId: 'l12-1-1', urgency: 'high' }];
  }

  async getNotifications(userId: string): Promise<AppNotification[]> {
    const q = query(collection(db, 'notifications'), where('userId', '==', userId));
    const snap = await getDocs(q);
    return snap.docs.map(d => ({ id: d.id, ...d.data() }) as AppNotification);
  }

  async addNotification(userId: string, notification: any): Promise<void> {
    await addDoc(collection(db, 'notifications'), this.cleanData({ ...notification, isRead: false, timestamp: new Date().toISOString() }));
  }

  async getTeacherReviews(teacherId: string): Promise<Review[]> {
    const q = query(collection(db, 'reviews'), where('teacherId', '==', teacherId));
    const snap = await getDocs(q);
    return snap.docs.map(d => ({ id: d.id, ...d.data() }) as Review);
  }

  async addReview(review: Review): Promise<void> {
    const { id, ...data } = review;
    await addDoc(collection(db, 'reviews'), this.cleanData(data));
  }

  async saveTeacherMessage(message: any): Promise<void> {
    await addDoc(collection(db, 'teacherMessages'), this.cleanData(message));
  }

  async getAllTeacherMessages(teacherId: string): Promise<TeacherMessage[]> {
    const q = query(collection(db, 'teacherMessages'), where('teacherId', '==', teacherId));
    const snapshot = await getDocs(q);
    return snapshot.docs.map(d => ({id: d.id, ...d.data()}) as TeacherMessage);
  }

  async getTodos(userId: string): Promise<Todo[]> {
    const snapshot = await getDocs(collection(db, 'users', userId, 'todos'));
    return snapshot.docs.map(d => ({id: d.id, ...d.data()}) as Todo);
  }

  async saveTodo(userId: string, todoData: any): Promise<string> {
    const docRef = await addDoc(collection(db, 'users', userId, 'todos'), this.cleanData(todoData));
    return docRef.id;
  }

  async updateTodo(userId: string, todoId: string, data: any): Promise<void> {
    await updateDoc(doc(db, 'users', userId, 'todos', todoId), this.cleanData(data));
  }

  async deleteTodo(userId: string, todoId: string): Promise<void> {
    await deleteDoc(doc(db, "users", userId, "todos", todoId));
  }

  async getStudentProgressForParent(studentUid: string): Promise<{ user: User, report: WeeklyReport }> {
    const user = await this.getUser(studentUid);
    if (!user) throw new Error("الطالب غير موجود");
    return { user, report: user.weeklyReports?.[0] || { week: 'الحالي', completedUnits: 0, hoursSpent: 0, scoreAverage: 0, improvementAreas: [] } };
  }

  async getResources(): Promise<EducationalResource[]> {
    const snapshot = await getDocs(collection(db, 'resources'));
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }) as EducationalResource);
  }
}

export const dbService = SyrianScienceCenterDB.getInstance();

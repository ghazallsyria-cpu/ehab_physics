
import { User, Curriculum, Quiz, Question, StudentQuizAttempt, AIRecommendation, Challenge, LeaderboardEntry, StudyGoal, EducationalResource, Invoice, PaymentStatus, ForumPost, ForumReply, Review, TeacherMessage, Todo, AppNotification, WeeklyReport, Lesson, Unit, PaymentSettings, SubscriptionCode, LoggingSettings, LiveSession } from "../types";
import { db } from "./firebase";
import { doc, getDoc, setDoc, getDocs, collection, deleteDoc, addDoc, query, where, updateDoc, arrayUnion, arrayRemove, increment, documentId, writeBatch, orderBy, limit } from "firebase/firestore";
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
        console.warn("DB: Initial settings load failed, using defaults.");
    }
  }

  // Deep recursive cleaner to remove any 'undefined' which crashes Firestore
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
    if (!db) throw new Error("قاعدة البيانات غير متصلة. يرجى التحقق من اتصال الإنترنت أو مفتاح API.");
  }

  // --- Health Check ---
  async checkConnection(): Promise<boolean> {
    try {
      this.checkDb();
      const testRef = doc(db, "settings", "health_check");
      await getDoc(testRef);
      return true;
    } catch (e) {
      return false;
    }
  }

  // --- Settings ---
  async getLoggingSettings(): Promise<LoggingSettings> {
    try {
        const docRef = doc(db, "settings", "data_logging");
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
            return { ...DEFAULT_LOGGING_SETTINGS, ...docSnap.data() };
        }
    } catch (e) {}
    return DEFAULT_LOGGING_SETTINGS;
  }

  async saveLoggingSettings(settings: LoggingSettings): Promise<void> {
    const docRef = doc(db, "settings", "data_logging");
    await setDoc(docRef, this.cleanData(settings), { merge: true });
  }


  // --- User Management ---
  async getUser(identifier: string): Promise<User | null> {
    this.checkDb();
    try {
        const userDocRef = doc(db, "users", identifier);
        const userSnap = await getDoc(userDocRef);
        if (userSnap.exists()) {
            return { uid: userSnap.id, ...userSnap.data() } as User;
        }
        const q = query(collection(db, "users"), where("email", "==", identifier));
        const querySnapshot = await getDocs(q);
        if (!querySnapshot.empty) {
            const userDoc = querySnapshot.docs[0];
            return { uid: userDoc.id, ...userDoc.data() } as User;
        }
    } catch (e: any) {
        throw new Error(`فشل جلب بيانات المستخدم: ${e.message}`);
    }
    return null;
  }

  async saveUser(user: User): Promise<void> {
    this.checkDb();
    try {
        const cleanedUser = this.cleanData(user);
        const userDocRef = doc(db, "users", user.uid);
        await setDoc(userDocRef, cleanedUser, { merge: true });
    } catch (e: any) {
        throw new Error(`فشل حفظ في Firestore: ${e.message}`);
    }
  }

  async deleteUser(userId: string): Promise<void> {
    this.checkDb();
    try {
        await deleteDoc(doc(db, "users", userId));
    } catch (e: any) {
        throw new Error(`فشل حذف المستخدم: ${e.message}`);
    }
  }

  async getAllStudents(): Promise<User[]> {
    this.checkDb();
    try {
        const allSnap = await getDocs(collection(db, "users"));
        return allSnap.docs
            .map(doc => ({ uid: doc.id, ...doc.data() }) as User)
            .filter(u => u.role === 'student');
    } catch (e: any) {
        throw new Error(`فشل جلب قائمة الطلاب: ${e.message}`);
    }
  }

  async getTeachers(): Promise<User[]> {
    this.checkDb();
    try {
        const allSnap = await getDocs(collection(db, "users"));
        return allSnap.docs
            .map(doc => ({ uid: doc.id, ...doc.data() }) as User)
            .filter(u => u.role === 'teacher');
    } catch (e: any) {
        throw new Error(`فشل جلب قائمة المعلمين: ${e.message}`);
    }
  }

  // --- Live Sessions ---
  async getLiveSessions(): Promise<LiveSession[]> {
    this.checkDb();
    try {
        const snapshot = await getDocs(collection(db, "live_sessions"));
        return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }) as LiveSession);
    } catch (e: any) {
        throw new Error(`فشل جلب الجلسات المباشرة: ${e.message}`);
    }
  }

  async saveLiveSession(session: Partial<LiveSession>): Promise<void> {
    this.checkDb();
    try {
        const cleaned = this.cleanData(session);
        const { id, ...data } = cleaned;
        if (id) {
            await updateDoc(doc(db, "live_sessions", id), data);
        } else {
            await addDoc(collection(db, "live_sessions"), data);
        }
    } catch (e: any) {
        throw new Error(`فشل حفظ الجلسة: ${e.message}`);
    }
  }

  async deleteLiveSession(id: string): Promise<void> {
    this.checkDb();
    try {
        await deleteDoc(doc(db, "live_sessions", id));
    } catch (e: any) {
        throw new Error(`فشل حذف الجلسة: ${e.message}`);
    }
  }

  // --- Curriculum ---
  private async _ensureCurriculumDoc(grade: string, subject: string) {
    this.checkDb();
    const q = query(collection(db, 'curriculum'), where("grade", "==", grade), where("subject", "==", subject));
    const snapshot = await getDocs(q);
    
    if (!snapshot.empty) {
        return snapshot.docs[0].ref;
    }
    
    const newDocRef = doc(collection(db, 'curriculum'));
    const initialData: Curriculum = {
        grade: grade as any,
        subject: subject as any,
        title: subject === 'Physics' ? `منهج الفيزياء - الصف ${grade}` : `منهج الكيمياء - الصف ${grade}`,
        description: `المحتوى الدراسي المعتمد لمادة ${subject} لطلاب الصف ${grade}`,
        icon: subject === 'Physics' ? '⚛️' : '🧪',
        units: []
    };
    await setDoc(newDocRef, this.cleanData(initialData));
    return newDocRef;
  }

  async getCurriculum(): Promise<Curriculum[]> {
    this.checkDb();
    try {
        const snapshot = await getDocs(collection(db, 'curriculum'));
        return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }) as Curriculum);
    } catch (e: any) {
        throw new Error(`فشل جلب المناهج: ${e.message}`);
    }
  }

  async saveUnit(grade: '10' | '11' | '12', subject: 'Physics' | 'Chemistry', unit: Unit): Promise<void> {
    this.checkDb();
    const docRef = await this._ensureCurriculumDoc(grade, subject);
    if (!docRef) return;

    const curriculumSnap = await getDoc(docRef);
    if (curriculumSnap.exists()) {
        const curriculumData = curriculumSnap.data() as Curriculum;
        const units = Array.isArray(curriculumData.units) ? [...curriculumData.units] : [];
        const unitIndex = units.findIndex(u => u.id === unit.id);

        if (unitIndex > -1) {
            units[unitIndex] = unit;
        } else {
            units.push(unit);
        }
        await updateDoc(docRef, { units: this.cleanData(units) });
    }
  }
  
  async deleteUnit(grade: '10' | '11' | '12', subject: 'Physics' | 'Chemistry', unitId: string): Promise<void> {
    this.checkDb();
    const q = query(collection(db, 'curriculum'), where("grade", "==", grade), where("subject", "==", subject));
    const snapshot = await getDocs(q);
    if (snapshot.empty) return;

    const docRef = snapshot.docs[0].ref;
    const curriculumSnap = await getDoc(docRef);
    if (curriculumSnap.exists()) {
        const curriculumData = curriculumSnap.data() as Curriculum;
        const updatedUnits = (curriculumData.units || []).filter(u => u.id !== unitId);
        await updateDoc(docRef, { units: this.cleanData(updatedUnits) });
    }
  }

  async saveLesson(grade: '10' | '11' | '12', subject: 'Physics' | 'Chemistry', unitId: string, lesson: Lesson): Promise<void> {
    this.checkDb();
    const docRef = await this._ensureCurriculumDoc(grade, subject);
    if (!docRef) return;

    const curriculumSnap = await getDoc(docRef);
    if (curriculumSnap.exists()) {
        const curriculumData = curriculumSnap.data() as Curriculum;
        const units = Array.isArray(curriculumData.units) ? curriculumData.units : [];
        const unit = units.find(u => u.id === unitId);
        if (unit) {
            if (!unit.lessons) unit.lessons = [];
            const lessonIndex = unit.lessons.findIndex(l => l.id === lesson.id);
            if (lessonIndex > -1) {
                unit.lessons[lessonIndex] = lesson;
            } else {
                unit.lessons.push(lesson);
            }
            await updateDoc(docRef, { units: this.cleanData(units) });
        }
    }
  }

  async deleteLesson(grade: '10' | '11' | '12', subject: 'Physics' | 'Chemistry', unitId: string, lessonId: string): Promise<void> {
    this.checkDb();
    const q = query(collection(db, 'curriculum'), where("grade", "==", grade), where("subject", "==", subject));
    const snapshot = await getDocs(q);
    if (snapshot.empty) return;

    const docRef = snapshot.docs[0].ref;
    const curriculumSnap = await getDoc(docRef);
    if (curriculumSnap.exists()) {
        const curriculumData = curriculumSnap.data() as Curriculum;
        const unit = curriculumData.units.find(u => u.id === unitId);
        if (unit) {
            unit.lessons = (unit.lessons || []).filter(l => l.id !== lessonId);
            await updateDoc(docRef, { units: this.cleanData(curriculumData.units) });
        }
    }
  }

  // --- Resources ---
  async getResources(): Promise<EducationalResource[]> {
    this.checkDb();
    try {
        const snapshot = await getDocs(collection(db, 'resources'));
        return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }) as EducationalResource);
    } catch (e: any) {
        throw new Error(`فشل جلب الموارد التعليمية: ${e.message}`);
    }
  }

  // --- Financials ---
  async getInvoices(): Promise<{ data: Invoice[] }> {
    this.checkDb();
    try {
        const snapshot = await getDocs(collection(db, 'invoices'));
        return { data: snapshot.docs.map(d => ({id: d.id, ...d.data()}) as Invoice) };
    } catch (e: any) {
        throw new Error(`فشل جلب الفواتير: ${e.message}`);
    }
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
      trackId: `TRK-${Math.random().toString(36).substring(2, 10).toUpperCase()}`
    };
    const docRef = await addDoc(collection(db, 'invoices'), this.cleanData(invoice));
    return { id: docRef.id, ...invoice };
  }

  async completePayment(trackId: string, status: 'SUCCESS' | 'FAIL'): Promise<Invoice | null> {
    this.checkDb();
    const q = query(collection(db, 'invoices'), where('trackId', '==', trackId));
    const snapshot = await getDocs(q);
    if (snapshot.empty) return null;
    
    const docRef = snapshot.docs[0].ref;
    const data = snapshot.docs[0].data() as Invoice;
    
    const updateData: Partial<Invoice> = {
        status: status === 'SUCCESS' ? 'PAID' : 'FAIL',
        paymentId: status === 'SUCCESS' ? `PAY-${Math.random().toString(36).substring(2, 8).toUpperCase()}` : undefined,
        authCode: status === 'SUCCESS' ? Math.floor(100000 + Math.random() * 900000).toString() : undefined
    };
    
    await updateDoc(docRef, this.cleanData(updateData));
    
    if (status === 'SUCCESS') {
        const userRef = doc(db, 'users', data.userId);
        await updateDoc(userRef, { subscription: 'premium' }); 
    }
    
    return { ...data, id: snapshot.docs[0].id, ...updateData };
  }

  async updateInvoiceStatus(id: string, status: PaymentStatus): Promise<void> {
      this.checkDb();
      await updateDoc(doc(db, 'invoices', id), { status });
  }

  async getPaymentSettings(): Promise<PaymentSettings> {
    this.checkDb();
    try {
        const docRef = doc(db, "settings", "payment");
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) return docSnap.data() as PaymentSettings;
    } catch (e) {}
    return { isOnlinePaymentEnabled: true };
  }

  async setPaymentSettings(isEnabled: boolean): Promise<void> {
    this.checkDb();
    const docRef = doc(db, "settings", "payment");
    await setDoc(docRef, { isOnlinePaymentEnabled: isEnabled });
  }

  async getUnusedSubscriptionCodes(): Promise<SubscriptionCode[]> {
    this.checkDb();
    const q = query(collection(db, 'subscription_codes'), where('isUsed', '==', false));
    const snapshot = await getDocs(q);
    return snapshot.docs.map(d => ({id: d.id, ...d.data()}) as SubscriptionCode);
  }

  async createSubscriptionCode(planId: string): Promise<void> {
    this.checkDb();
    const code = Math.random().toString(36).substring(2, 10).toUpperCase();
    const newCode: Omit<SubscriptionCode, 'id'> = {
        code,
        planId,
        isUsed: false,
        userId: null,
        createdAt: new Date().toISOString(),
        activatedAt: null
    };
    await addDoc(collection(db, 'subscription_codes'), this.cleanData(newCode));
  }

  // --- Forum ---
  async getForumPosts(): Promise<ForumPost[]> {
    this.checkDb();
    try {
        const q = query(collection(db, 'forumPosts'), orderBy('timestamp', 'desc'));
        const snapshot = await getDocs(q);
        return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }) as ForumPost);
    } catch (e: any) {
        throw new Error(`فشل جلب منشورات المنتدى: ${e.message}`);
    }
  }

  async createForumPost(post: Omit<ForumPost, 'id' | 'timestamp' | 'upvotes' | 'replies'>): Promise<void> {
    this.checkDb();
    const newPost: Omit<ForumPost, 'id'> = {
      ...post,
      timestamp: new Date().toISOString(),
      upvotes: 0,
      replies: []
    };
    await addDoc(collection(db, 'forumPosts'), this.cleanData(newPost));
  }

  async addForumReply(postId: string, reply: Omit<ForumReply, 'id' | 'timestamp' | 'upvotes'>): Promise<void> {
    this.checkDb();
    const postRef = doc(db, 'forumPosts', postId);
    const newReply: ForumReply = {
      ...reply,
      id: `rep_${Date.now()}`,
      timestamp: new Date().toISOString(),
      upvotes: 0
    };
    await updateDoc(postRef, {
      replies: arrayUnion(this.cleanData(newReply))
    });
  }

  async upvotePost(postId: string): Promise<void> {
    this.checkDb();
    await updateDoc(doc(db, 'forumPosts', postId), { upvotes: increment(1) });
  }

  async upvoteReply(postId: string, replyId: string): Promise<void> {
    this.checkDb();
    const postRef = doc(db, 'forumPosts', postId);
    const snap = await getDoc(postRef);
    if (snap.exists()) {
      const data = snap.data() as ForumPost;
      const replies = data.replies?.map(r => 
        r.id === replyId ? { ...r, upvotes: (r.upvotes || 0) + 1 } : r
      ) || [];
      await updateDoc(postRef, { replies: this.cleanData(replies) });
    }
  }

  // --- Content Helpers ---
  async toggleLessonComplete(userId: string, lessonId: string) {
    this.checkDb();
    if (!this.loggingSettings.logStudentProgress) return;
    const userRef = doc(db, 'users', userId);
    const userSnap = await getDoc(userRef);
    if (!userSnap.exists()) return;
    const completed = userSnap.data().progress?.completedLessonIds || [];
    if (completed.includes(lessonId)) {
        await updateDoc(userRef, { 'progress.completedLessonIds': arrayRemove(lessonId) });
    } else {
        await updateDoc(userRef, { 'progress.completedLessonIds': arrayUnion(lessonId), 'progress.points': increment(10) });
    }
  }

  async getAllQuestions(): Promise<Question[]> {
      this.checkDb();
      try {
        const snapshot = await getDocs(collection(db, 'questions'));
        return snapshot.docs.map(d => ({id: d.id, ...d.data()}) as Question);
      } catch (e) {
        return QUESTIONS_DB; // Fallback to mock if db is empty/error
      }
  }

  async saveQuestion(question: Partial<Question>): Promise<void> {
      this.checkDb();
      await addDoc(collection(db, 'questions'), this.cleanData(question));
  }

  // --- Quizzes and Attempts ---
  getQuizzes(): Quiz[] {
    return QUIZZES_DB;
  }

  getQuestionsForQuiz(quizId: string): Question[] {
    const quiz = QUIZZES_DB.find(q => q.id === quizId);
    if (!quiz) return [];
    return QUESTIONS_DB.filter(q => quiz.questionIds.includes(q.id));
  }

  async saveAttempt(attempt: StudentQuizAttempt) {
    this.checkDb();
    const batch = writeBatch(db);
    const userRef = doc(db, 'users', attempt.studentId);
    
    batch.update(userRef, { 'progress.points': increment(attempt.score * 5) });

    const userSnap = await getDoc(userRef);
    const existingScore = userSnap.data()?.progress?.quizScores?.[attempt.quizId] || 0;

    if (this.loggingSettings.saveAllQuizAttempts || attempt.score > existingScore) {
        const attemptRef = doc(collection(db, 'attempts'));
        batch.set(attemptRef, this.cleanData(attempt));
    }
    
    if (attempt.score > existingScore) {
        batch.update(userRef, { [`progress.quizScores.${attempt.quizId}`]: attempt.score });
    }

    await batch.commit();
  }

  async getUserAttempts(userId: string, quizId?: string): Promise<StudentQuizAttempt[]> {
    this.checkDb();
    let q = query(collection(db, "attempts"), where("studentId", "==", userId));
    if(quizId) q = query(q, where("quizId", "==", quizId));
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => doc.data() as StudentQuizAttempt);
  }

  // --- Gamification ---
  async getChallenges(): Promise<Challenge[]> {
    this.checkDb();
    try {
        const snapshot = await getDocs(collection(db, 'challenges'));
        return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }) as Challenge);
    } catch (e) { return CHALLENGES_DB; }
  }

  async getStudyGoals(): Promise<StudyGoal[]> {
    this.checkDb();
    try {
        const snapshot = await getDocs(collection(db, 'study_goals'));
        return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }) as StudyGoal);
    } catch (e) {
        return STUDY_GOALS_DB;
    }
  }

  async getLeaderboard(): Promise<LeaderboardEntry[]> {
    this.checkDb();
    try {
        const q = query(collection(db, 'users'), where('role', '==', 'student'), orderBy('progress.points', 'desc'), limit(10));
        const snapshot = await getDocs(q);
        return snapshot.docs.map((doc, index) => {
            const user = doc.data() as User;
            return { rank: index + 1, name: user.name, points: user.progress.points, isCurrentUser: false };
        });
    } catch (e) {
        return LEADERBOARD_DATA;
    }
  }

  async getAIRecommendations(user: User): Promise<AIRecommendation[]> {
    return [
      { id: 'rec-1', title: 'مراجعة قانون فاراداي', reason: 'لاحظنا أنك تواجه صعوبة في مسائل الحث.', type: 'lesson', targetId: 'l12-1-1', urgency: 'high' }
    ];
  }

  // --- Notifications ---
  async getNotifications(userId: string): Promise<AppNotification[]> {
    this.checkDb();
    const q = query(collection(db, 'notifications'), where('userId', '==', userId));
    const snap = await getDocs(q);
    return snap.docs.map(d => ({ id: d.id, ...d.data() }) as AppNotification);
  }

  async addNotification(userId: string, notification: Omit<AppNotification, 'id' | 'isRead' | 'timestamp'>): Promise<void> {
    this.checkDb();
    const newNotification = { ...notification, isRead: false, timestamp: new Date().toISOString() };
    await addDoc(collection(db, 'notifications'), this.cleanData(newNotification));
  }

  // --- Subscription Codes ---
  async activateSubscriptionWithCode(code: string, userId: string): Promise<{success: boolean, message: string}> {
    this.checkDb();
    const q = query(collection(db, 'subscription_codes'), where('code', '==', code));
    const snapshot = await getDocs(q);
    if (snapshot.empty) return { success: false, message: 'الكود غير صحيح.' };
    const codeDoc = snapshot.docs[0];
    const codeData = codeDoc.data() as SubscriptionCode;
    if (codeData.isUsed) return { success: false, message: 'هذا الكود تم استخدامه مسبقاً.' };
    const batch = writeBatch(db);
    batch.update(doc(db, 'users', userId), { subscription: 'premium' });
    batch.update(codeDoc.ref, { isUsed: true, userId: userId, activatedAt: new Date().toISOString() });
    await batch.commit();
    return { success: true, message: 'تم تفعيل الاشتراك بنجاح!' };
  }

  // --- Teacher Support ---
  async getTeacherReviews(teacherId: string): Promise<Review[]> {
    this.checkDb();
    const q = query(collection(db, 'reviews'), where('teacherId', '==', teacherId));
    const snap = await getDocs(q);
    return snap.docs.map(d => ({ id: d.id, ...d.data() }) as Review);
  }

  async addReview(review: Review): Promise<void> {
    this.checkDb();
    const { id, ...data } = review;
    await addDoc(collection(db, 'reviews'), this.cleanData(data));
  }

  async saveTeacherMessage(message: Omit<TeacherMessage, 'id'>): Promise<void> {
    this.checkDb();
    if(!this.loggingSettings.archiveTeacherMessages) return;
    await addDoc(collection(db, 'teacherMessages'), this.cleanData(message));
  }

  async getAllTeacherMessages(teacherId: string): Promise<TeacherMessage[]> {
    this.checkDb();
    const q = query(collection(db, 'teacherMessages'), where('teacherId', '==', teacherId));
    const snapshot = await getDocs(q);
    return snapshot.docs.map(d => ({id: d.id, ...d.data()}) as TeacherMessage);
  }

  // --- Todo Management ---
  async getTodos(userId: string): Promise<Todo[]> {
    this.checkDb();
    const snapshot = await getDocs(collection(db, 'users', userId, 'todos'));
    return snapshot.docs.map(d => ({id: d.id, ...d.data()}) as Todo);
  }

  async saveTodo(userId: string, todoData: Omit<Todo, 'id'>): Promise<string> {
    this.checkDb();
    const docRef = await addDoc(collection(db, 'users', userId, 'todos'), this.cleanData(todoData));
    return docRef.id;
  }

  async updateTodo(userId: string, todoId: string, data: Partial<Todo>): Promise<void> {
    this.checkDb();
    await updateDoc(doc(db, 'users', userId, 'todos', todoId), this.cleanData(data));
  }

  async deleteTodo(userId: string, todoId: string): Promise<void> {
    this.checkDb();
    await deleteDoc(doc(db, "users", userId, "todos", todoId));
  }

  async getStudentProgressForParent(studentUid: string): Promise<{ user: User, report: WeeklyReport }> {
    this.checkDb();
    const user = await this.getUser(studentUid);
    if (!user) throw new Error("الطالب غير موجود");
    const report = user.weeklyReports?.[0] || {
        week: 'الأسبوع الحالي', completedUnits: 0, hoursSpent: 0, scoreAverage: 0, improvementAreas: [], parentNote: 'لا يوجد تقرير متاح لهذا الأسبوع.'
    };
    return { user, report };
  }
}

export const dbService = SyrianScienceCenterDB.getInstance();

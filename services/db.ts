import { User, Curriculum, Quiz, Question, StudentQuizAttempt, AIRecommendation, Challenge, LeaderboardEntry, StudyGoal, EducationalResource, Invoice, PaymentStatus, ForumPost, ForumReply, Review, TeacherMessage, Todo, AppNotification, WeeklyReport, Lesson, Unit, PaymentSettings, SubscriptionCode, LoggingSettings } from "../types";
import { db } from "./firebase";
import { doc, getDoc, setDoc, getDocs, collection, deleteDoc, addDoc, query, where, updateDoc, arrayUnion, arrayRemove, increment, documentId, writeBatch, orderBy, limit } from "firebase/firestore";
import { QUIZZES_DB, QUESTIONS_DB } from "../constants";

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
    this.loggingSettings = await this.getLoggingSettings();
  }

  // --- Settings ---
  async getLoggingSettings(): Promise<LoggingSettings> {
    if (!db) return DEFAULT_LOGGING_SETTINGS;
    try {
        const docRef = doc(db, "settings", "data_logging");
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
            return { ...DEFAULT_LOGGING_SETTINGS, ...docSnap.data() };
        }
    } catch (e) { console.error("DB: Error getting logging settings", e); }
    return DEFAULT_LOGGING_SETTINGS;
  }

  async saveLoggingSettings(settings: LoggingSettings): Promise<void> {
    if (!db) return;
    this.loggingSettings = settings; // Update instance cache immediately
    const docRef = doc(db, "settings", "data_logging");
    await setDoc(docRef, settings, { merge: true });
  }


  // --- User Management ---
  async getUser(identifier: string): Promise<User | null> {
    if (!db) return null;
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
    } catch (e) {
        console.error("DB: Error getting user", e);
    }
    return null;
  }

  async saveUser(user: User): Promise<void> {
    if (!db) return;
    const userDocRef = doc(db, "users", user.uid);
    await setDoc(userDocRef, user, { merge: true });
  }

  async deleteUser(userId: string): Promise<void> {
    if (!db) return;
    await deleteDoc(doc(db, "users", userId));
  }

  async getAllStudents(): Promise<User[]> {
    if (!db) return [];
    try {
        const allSnap = await getDocs(collection(db, "users"));
        return allSnap.docs
            .map(doc => ({ uid: doc.id, ...doc.data() }) as User)
            .filter(u => u.role === 'student');
    } catch (e) {
        console.error("DB: Error fetching all users for student filter", e);
        return []; // Return empty array on any failure
    }
  }

  async getTeachers(): Promise<User[]> {
    if (!db) return [];
    try {
        const allSnap = await getDocs(collection(db, "users"));
        return allSnap.docs
            .map(doc => ({ uid: doc.id, ...doc.data() }) as User)
            .filter(u => u.role === 'teacher');
    } catch (e) {
        console.error("DB: Error fetching all users for teacher filter", e);
        return []; // Return empty array on any failure
    }
  }

  // --- Curriculum ---
  private async _ensureCurriculumDoc(grade: string, subject: string) {
    if (!db) return null;
    const q = query(collection(db, 'curriculum'), where("grade", "==", grade), where("subject", "==", subject));
    const snapshot = await getDocs(q);
    
    if (!snapshot.empty) {
        return snapshot.docs[0].ref;
    }
    
    // If not exists, create a new doc for this grade/subject
    const newDocRef = doc(collection(db, 'curriculum'));
    const initialData: Curriculum = {
        grade: grade as any,
        subject: subject as any,
        title: subject === 'Physics' ? `منهج الفيزياء - الصف ${grade}` : `منهج الكيمياء - الصف ${grade}`,
        description: `المحتوى الدراسي المعتمد لمادة ${subject} لطلاب الصف ${grade}`,
        icon: subject === 'Physics' ? '⚛️' : '🧪',
        units: []
    };
    await setDoc(newDocRef, initialData);
    return newDocRef;
  }

  async getCurriculum(): Promise<Curriculum[]> {
    if (!db) return [];
    const snapshot = await getDocs(collection(db, 'curriculum'));
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }) as Curriculum);
  }

  async saveUnit(grade: '10' | '11' | '12', subject: 'Physics' | 'Chemistry', unit: Unit): Promise<void> {
    if (!db) return;
    const docRef = await this._ensureCurriculumDoc(grade, subject);
    if (!docRef) return;

    const curriculumSnap = await getDoc(docRef);
    if (curriculumSnap.exists()) {
        const curriculumData = curriculumSnap.data() as Curriculum;
        // Make sure we are working with an array. Create a shallow copy for modification.
        const units = Array.isArray(curriculumData.units) ? [...curriculumData.units] : [];
        const unitIndex = units.findIndex(u => u.id === unit.id);

        if (unitIndex > -1) {
            // Update existing unit
            units[unitIndex] = unit;
        } else {
            // Add new unit
            units.push(unit);
        }
        await updateDoc(docRef, { units: units });
    }
  }
  
  async deleteUnit(grade: '10' | '11' | '12', subject: 'Physics' | 'Chemistry', unitId: string): Promise<void> {
    if (!db) return;
    const q = query(collection(db, 'curriculum'), where("grade", "==", grade), where("subject", "==", subject));
    const snapshot = await getDocs(q);
    if (snapshot.empty) return;

    const docRef = snapshot.docs[0].ref;
    const curriculumSnap = await getDoc(docRef);
    if (curriculumSnap.exists()) {
        const curriculumData = curriculumSnap.data() as Curriculum;
        const updatedUnits = (curriculumData.units || []).filter(u => u.id !== unitId);
        await updateDoc(docRef, { units: updatedUnits });
    }
  }

  async saveLesson(grade: '10' | '11' | '12', subject: 'Physics' | 'Chemistry', unitId: string, lesson: Lesson): Promise<void> {
    if (!db) return;
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
            await updateDoc(docRef, { units: units });
        }
    }
  }

  async deleteLesson(grade: '10' | '11' | '12', subject: 'Physics' | 'Chemistry', unitId: string, lessonId: string): Promise<void> {
    if (!db) return;
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
            await updateDoc(docRef, { units: curriculumData.units });
        }
    }
  }

  // --- Resources ---
  async getResources(): Promise<EducationalResource[]> {
    if (!db) return [];
    try {
        const snapshot = await getDocs(collection(db, 'resources'));
        return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }) as EducationalResource);
    } catch (e) {
        console.error("DB: Error fetching resources", e);
        return [];
    }
  }

  // --- Financials ---
  async getInvoices(): Promise<{ data: Invoice[] }> {
    if(!db) return { data: [] };
    try {
        const snapshot = await getDocs(collection(db, 'invoices'));
        return { data: snapshot.docs.map(d => ({id: d.id, ...d.data()}) as Invoice) };
    } catch (e) {
        console.error("DB: Error fetching invoices", e);
        return { data: [] };
    }
  }

  async initiatePayment(userId: string, planId: string, amount: number): Promise<Invoice> {
    if (!db) throw new Error("DB not initialized");
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
    const docRef = await addDoc(collection(db, 'invoices'), invoice);
    return { id: docRef.id, ...invoice };
  }

  async completePayment(trackId: string, status: 'SUCCESS' | 'FAIL'): Promise<Invoice | null> {
    if (!db) return null;
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
    
    await updateDoc(docRef, updateData);
    
    if (status === 'SUCCESS') {
        const userRef = doc(db, 'users', data.userId);
        await updateDoc(userRef, { subscription: 'premium' }); 
    }
    
    return { ...data, id: snapshot.docs[0].id, ...updateData };
  }

  async updateInvoiceStatus(id: string, status: PaymentStatus): Promise<void> {
      if(!db) return;
      await updateDoc(doc(db, 'invoices', id), { status });
  }

  async getPaymentSettings(): Promise<PaymentSettings> {
    if (!db) return { isOnlinePaymentEnabled: true };
    try {
        const docRef = doc(db, "settings", "payment");
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) return docSnap.data() as PaymentSettings;
    } catch (e) {}
    return { isOnlinePaymentEnabled: true };
  }

  async setPaymentSettings(isEnabled: boolean): Promise<void> {
    if (!db) return;
    const docRef = doc(db, "settings", "payment");
    await setDoc(docRef, { isOnlinePaymentEnabled: isEnabled });
  }

  // --- Forum ---
  async createForumPost(post: Omit<ForumPost, 'id' | 'timestamp' | 'upvotes' | 'replies'>): Promise<void> {
    if (!db) return;
    const newPost: Omit<ForumPost, 'id'> = {
      ...post,
      timestamp: new Date().toISOString(),
      upvotes: 0,
      replies: []
    };
    await addDoc(collection(db, 'forumPosts'), newPost);
  }

  async addForumReply(postId: string, reply: Omit<ForumReply, 'id' | 'timestamp' | 'upvotes'>): Promise<void> {
    if (!db) return;
    const postRef = doc(db, 'forumPosts', postId);
    const newReply: ForumReply = {
      ...reply,
      id: `rep_${Date.now()}`,
      timestamp: new Date().toISOString(),
      upvotes: 0
    };
    await updateDoc(postRef, {
      replies: arrayUnion(newReply)
    });
  }

  async upvotePost(postId: string): Promise<void> {
    if (!db) return;
    await updateDoc(doc(db, 'forumPosts', postId), { upvotes: increment(1) });
  }

  async upvoteReply(postId: string, replyId: string): Promise<void> {
    if (!db) return;
    const postRef = doc(db, 'forumPosts', postId);
    const snap = await getDoc(postRef);
    if (snap.exists()) {
      const data = snap.data() as ForumPost;
      const replies = data.replies?.map(r => 
        r.id === replyId ? { ...r, upvotes: (r.upvotes || 0) + 1 } : r
      ) || [];
      await updateDoc(postRef, { replies });
    }
  }

  // --- Content Helpers ---
  async toggleLessonComplete(userId: string, lessonId: string) {
    if (!db || !this.loggingSettings.logStudentProgress) return;
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
      if (!db) return QUESTIONS_DB;
      const snapshot = await getDocs(collection(db, 'questions'));
      return snapshot.docs.map(d => ({id: d.id, ...d.data()}) as Question);
  }

  async saveQuestion(question: Partial<Question>): Promise<void> {
      if (!db) return;
      await addDoc(collection(db, 'questions'), question);
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
    if (!db) return;
    const batch = writeBatch(db);
    const userRef = doc(db, 'users', attempt.studentId);
    
    // Always grant points for the attempt.
    batch.update(userRef, { 'progress.points': increment(attempt.score * 5) });

    const userSnap = await getDoc(userRef);
    const existingScore = userSnap.data()?.progress?.quizScores?.[attempt.quizId] || 0;

    // Save the full attempt record ONLY if the setting is enabled OR it's a new high score.
    if (this.loggingSettings.saveAllQuizAttempts || attempt.score > existingScore) {
        const attemptRef = doc(collection(db, 'attempts'));
        batch.set(attemptRef, attempt);
    }
    
    // Always update the high score if it's better.
    if (attempt.score > existingScore) {
        batch.update(userRef, { [`progress.quizScores.${attempt.quizId}`]: attempt.score });
    }

    await batch.commit();
  }

  async getUserAttempts(userId: string, quizId?: string): Promise<StudentQuizAttempt[]> {
    if (!db) return [];
    let q = query(collection(db, "attempts"), where("studentId", "==", userId));
    if(quizId) q = query(q, where("quizId", "==", quizId));
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => doc.data() as StudentQuizAttempt);
  }

  // --- Gamification ---
  async getChallenges(): Promise<Challenge[]> {
    if (!db) return [];
    const snapshot = await getDocs(collection(db, 'challenges'));
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }) as Challenge);
  }

  async getLeaderboard(): Promise<LeaderboardEntry[]> {
    if (!db) return [];
    try {
        const q = query(collection(db, 'users'), where('role', '==', 'student'), orderBy('progress.points', 'desc'), limit(10));
        const snapshot = await getDocs(q);
        return snapshot.docs.map((doc, index) => {
            const user = doc.data() as User;
            return { rank: index + 1, name: user.name, points: user.progress.points, isCurrentUser: false };
        });
    } catch (e) {
        return [];
    }
  }

  async getStudyGoals(): Promise<StudyGoal[]> {
    if (!db) return [];
    const snapshot = await getDocs(collection(db, 'studyGoals'));
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }) as StudyGoal);
  }
  
  async getAIRecommendations(user: User): Promise<AIRecommendation[]> {
    return [
      { id: 'rec-1', title: 'مراجعة قانون فاراداي', reason: 'لاحظنا أنك تواجه صعوبة في مسائل الحث.', type: 'lesson', targetId: 'l12-1-1', urgency: 'high' }
    ];
  }

  // --- Parent Portal ---
  async getStudentProgressForParent(studentUid: string): Promise<{ user: User, report: WeeklyReport | null }> {
    const user = await this.getUser(studentUid);
    if (!user) throw new Error("Student not found");
    const report = user.weeklyReports?.[0] || null;
    return { user, report };
  }

  // --- Notifications ---
  async getNotifications(userId: string): Promise<AppNotification[]> {
    if (!db) return [];
    const q = query(collection(db, 'notifications'), where('userId', '==', userId));
    const snap = await getDocs(q);
    return snap.docs.map(d => ({ id: d.id, ...d.data() }) as AppNotification);
  }

  // FIX: The `timestamp` is generated here, so the input `notification` object doesn't need to provide it.
  // The type has been updated from Omit<..., 'id' | 'isRead'> to Omit<..., 'id' | 'isRead' | 'timestamp'>.
  async addNotification(userId: string, notification: Omit<AppNotification, 'id' | 'isRead' | 'timestamp'>): Promise<void> {
    if (!db) return;
    const newNotification = { ...notification, isRead: false, timestamp: new Date().toISOString() };
    await addDoc(collection(db, 'notifications'), newNotification);
  }

  // --- Subscription Codes ---
  async createSubscriptionCode(planId: string = 'premium'): Promise<SubscriptionCode> {
    if (!db) throw new Error("Database not connected");
    const code = `SSC-${Math.random().toString(36).substring(2, 10).toUpperCase()}`;
    const newCode: Omit<SubscriptionCode, 'id'> = {
        code, planId, isUsed: false, userId: null,
        createdAt: new Date().toISOString(), activatedAt: null,
    };
    const docRef = await addDoc(collection(db, 'subscription_codes'), newCode);
    return { id: docRef.id, ...newCode };
  }
  
  async getUnusedSubscriptionCodes(): Promise<SubscriptionCode[]> {
    if (!db) return [];
    const q = query(collection(db, 'subscription_codes'), where('isUsed', '==', false), limit(50));
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }) as SubscriptionCode);
  }

  async activateSubscriptionWithCode(code: string, userId: string): Promise<{success: boolean, message: string}> {
    if (!db) return { success: false, message: 'Database error.' };
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

  async getForumPosts(): Promise<ForumPost[]> {
    if (!db) return [];
    const snapshot = await getDocs(collection(db, 'forumPosts'));
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }) as ForumPost);
  }

  // --- Teacher Support ---
  async getTeacherReviews(teacherId: string): Promise<Review[]> {
    if (!db) return [];
    const q = query(collection(db, 'reviews'), where('teacherId', '==', teacherId));
    const snap = await getDocs(q);
    return snap.docs.map(d => ({ id: d.id, ...d.data() }) as Review);
  }

  async addReview(review: Review): Promise<void> {
    if (!db) return;
    const { id, ...data } = review;
    await addDoc(collection(db, 'reviews'), data);
  }

  async saveTeacherMessage(message: Omit<TeacherMessage, 'id'>): Promise<void> {
    if(!db || !this.loggingSettings.archiveTeacherMessages) return;
    await addDoc(collection(db, 'teacherMessages'), message);
  }

  async getAllTeacherMessages(teacherId: string): Promise<TeacherMessage[]> {
    if(!db) return [];
    const q = query(collection(db, 'teacherMessages'), where('teacherId', '==', teacherId));
    const snapshot = await getDocs(q);
    return snapshot.docs.map(d => ({id: d.id, ...d.data()}) as TeacherMessage);
  }

  // --- Todo Management ---
  async getTodos(userId: string): Promise<Todo[]> {
    if(!db) return [];
    const snapshot = await getDocs(collection(db, 'users', userId, 'todos'));
    return snapshot.docs.map(d => ({id: d.id, ...d.data()}) as Todo);
  }

  async saveTodo(userId: string, todoData: Omit<Todo, 'id'>): Promise<string> {
    if(!db) return '';
    const docRef = await addDoc(collection(db, 'users', userId, 'todos'), todoData);
    return docRef.id;
  }

  async updateTodo(userId: string, todoId: string, data: Partial<Todo>): Promise<void> {
    if (!db) return;
    await updateDoc(doc(db, 'users', userId, 'todos', todoId), data);
  }

  async deleteTodo(userId: string, todoId: string): Promise<void> {
    if (!db) return;
    await deleteDoc(doc(db, 'users', userId, 'todos', todoId));
  }
}

export const dbService = SyrianScienceCenterDB.getInstance();
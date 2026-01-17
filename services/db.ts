import { User, Curriculum, Quiz, Question, StudentQuizAttempt, AIRecommendation, Challenge, LeaderboardEntry, StudyGoal, EducationalResource, Invoice, PaymentStatus, ForumPost, ForumReply, Review, TeacherMessage, Todo, AppNotification, WeeklyReport, Lesson, Unit, PaymentSettings, SubscriptionCode } from "../types";
import { db } from "./firebase";
import { doc, getDoc, setDoc, getDocs, collection, deleteDoc, addDoc, query, where, updateDoc, arrayUnion, arrayRemove, increment, documentId, writeBatch, orderBy, limit } from "firebase/firestore";

class SyrianScienceCenterDB {
  private static instance: SyrianScienceCenterDB;
  
  public static getInstance(): SyrianScienceCenterDB {
    if (!SyrianScienceCenterDB.instance) SyrianScienceCenterDB.instance = new SyrianScienceCenterDB();
    return SyrianScienceCenterDB.instance;
  }

  // --- User Management ---
  async getUser(identifier: string): Promise<User | null> {
    if (!db) return null;
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
    const q = query(collection(db, "users"), where("role", "==", "student"));
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({ uid: doc.id, ...doc.data() }) as User);
  }

  async getTeachers(): Promise<User[]> {
    if (!db) return [];
    const q = query(collection(db, "users"), where("role", "==", "teacher"));
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({ uid: doc.id, ...doc.data() }) as User);
  }

  // --- Curriculum ---
  private async _getCurriculumDocRef(grade: '10' | '11' | '12', subject: 'Physics' | 'Chemistry') {
    if (!db) return null;
    const q = query(collection(db, 'curriculum'), where("grade", "==", grade), where("subject", "==", subject));
    const snapshot = await getDocs(q);
    if (!snapshot.empty) {
        return snapshot.docs[0].ref;
    }
    return null;
  }

  async getCurriculum(): Promise<Curriculum[]> {
    if (!db) return [];
    const snapshot = await getDocs(collection(db, 'curriculum'));
    return snapshot.docs.map(doc => ({ ...doc.data(), id: doc.id }) as Curriculum);
  }

  async saveUnit(grade: '10' | '11' | '12', subject: 'Physics' | 'Chemistry', unit: Unit): Promise<void> {
    if (!db) return;
    const docRef = await this._getCurriculumDocRef(grade, subject);
    if (!docRef) {
        console.error(`Curriculum for grade ${grade} and subject ${subject} not found.`);
        return;
    }

    const curriculumSnap = await getDoc(docRef);
    if (curriculumSnap.exists()) {
        const curriculumData = curriculumSnap.data() as Curriculum;
        const units = curriculumData.units || [];
        const unitIndex = units.findIndex(u => u.id === unit.id);

        if (unitIndex > -1) {
            units[unitIndex] = unit;
        } else {
            units.push(unit);
        }
        await updateDoc(docRef, { units });
    }
  }
  
  async deleteUnit(grade: '10' | '11' | '12', subject: 'Physics' | 'Chemistry', unitId: string): Promise<void> {
    if (!db) return;
    const docRef = await this._getCurriculumDocRef(grade, subject);
    if (!docRef) {
        console.error(`Curriculum for grade ${grade} and subject ${subject} not found.`);
        return;
    }

    const curriculumSnap = await getDoc(docRef);
    if (curriculumSnap.exists()) {
        const curriculumData = curriculumSnap.data() as Curriculum;
        const updatedUnits = (curriculumData.units || []).filter(u => u.id !== unitId);
        await updateDoc(docRef, { units: updatedUnits });
    }
  }

  async saveLesson(grade: '10' | '11' | '12', subject: 'Physics' | 'Chemistry', unitId: string, lesson: Lesson): Promise<void> {
    if (!db) return;
    const docRef = await this._getCurriculumDocRef(grade, subject);
    if (!docRef) {
        console.error(`Curriculum for grade ${grade} and subject ${subject} not found.`);
        return;
    }

    const curriculumSnap = await getDoc(docRef);
    if (curriculumSnap.exists()) {
        const curriculumData = curriculumSnap.data() as Curriculum;
        const unit = curriculumData.units.find(u => u.id === unitId);
        if (unit) {
            const lessonIndex = unit.lessons.findIndex(l => l.id === lesson.id);
            if (lessonIndex > -1) {
                unit.lessons[lessonIndex] = lesson;
            } else {
                unit.lessons.push(lesson);
            }
            await setDoc(docRef, curriculumData);
        }
    }
  }

  async deleteLesson(grade: '10' | '11' | '12', subject: 'Physics' | 'Chemistry', unitId: string, lessonId: string): Promise<void> {
    if (!db) return;
    const docRef = await this._getCurriculumDocRef(grade, subject);
    if (!docRef) {
        console.error(`Curriculum for grade ${grade} and subject ${subject} not found.`);
        return;
    }

    const curriculumSnap = await getDoc(docRef);
    if (curriculumSnap.exists()) {
        const curriculumData = curriculumSnap.data() as Curriculum;
        const unit = curriculumData.units.find(u => u.id === unitId);
        if (unit) {
            unit.lessons = unit.lessons.filter(l => l.id !== lessonId);
            await setDoc(docRef, curriculumData);
        }
    }
  }
  
  async toggleLessonComplete(userId: string, lessonId: string) {
    if (!db) return;
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

  // --- Quizzes ---
  async getQuizzes(): Promise<Quiz[]> {
    if (!db) return [];
    const snapshot = await getDocs(collection(db, 'quizzes'));
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }) as Quiz);
  }

  async getQuestionsForQuiz(quizId: string): Promise<Question[]> {
    if (!db) return [];
    const quizSnap = await getDoc(doc(db, 'quizzes', quizId));
    if (!quizSnap.exists()) return [];
    const questionIds = quizSnap.data().questionIds as string[];
    if (!questionIds || questionIds.length === 0) return [];

    const q = query(collection(db, 'questions'), where(documentId(), 'in', questionIds));
    const questionsSnapshot = await getDocs(q);
    return questionsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }) as Question);
  }
  
  async getAllQuestions(): Promise<Question[]> {
      if (!db) return [];
      const snapshot = await getDocs(collection(db, 'questions'));
      return snapshot.docs.map(d => ({id: d.id, ...d.data()}) as Question);
  }

  async saveQuestion(question: Partial<Question>): Promise<void> {
      if (!db) return;
      await addDoc(collection(db, 'questions'), question);
  }

  async saveAttempt(attempt: StudentQuizAttempt) {
    if (!db) return;
    const batch = writeBatch(db);
    const attemptRef = doc(collection(db, 'attempts'));
    batch.set(attemptRef, attempt);

    const userRef = doc(db, 'users', attempt.studentId);
    const userSnap = await getDoc(userRef);
    if (userSnap.exists()) {
        const user = userSnap.data() as User;
        batch.update(userRef, { 'progress.points': increment(attempt.score * 5) });
        const existingScore = user.progress.quizScores?.[attempt.quizId] || 0;
        if (attempt.score > existingScore) {
            batch.update(userRef, { [`progress.quizScores.${attempt.quizId}`]: attempt.score });
        }
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
  
  // --- Discussions / Forum ---
  async getForumPosts(): Promise<ForumPost[]> {
      if (!db) return [];
      const q = query(collection(db, 'forumPosts'), orderBy('timestamp', 'desc'));
      const snapshot = await getDocs(q);
      return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }) as ForumPost);
  }

  async createForumPost(post: Omit<ForumPost, 'id' | 'timestamp'>): Promise<void> {
      if (!db) return;
      const postWithDefaults = { ...post, upvotes: 0, replies: [], timestamp: new Date().toISOString() };
      await addDoc(collection(db, 'forumPosts'), postWithDefaults);
  }

  async addForumReply(postId: string, reply: Omit<ForumReply, 'id' | 'upvotes' | 'timestamp'>): Promise<void> {
      if (!db) return;
      const postRef = doc(db, 'forumPosts', postId);
      const newReply: Omit<ForumReply, 'id'> = { ...reply, upvotes: 0, timestamp: new Date().toISOString() };
      await updateDoc(postRef, { replies: arrayUnion(newReply) });
  }

  async upvotePost(postId: string): Promise<void> {
      if (!db) return;
      await updateDoc(doc(db, 'forumPosts', postId), { upvotes: increment(1) });
  }

  async upvoteReply(postId: string, replyId: string): Promise<void> {
      if (!db) return;
      const postRef = doc(db, 'forumPosts', postId);
      const postSnap = await getDoc(postRef);
      if (postSnap.exists()) {
          const post = postSnap.data() as ForumPost;
          const updatedReplies = (post.replies || []).map(r => 
              r.id === replyId ? { ...r, upvotes: (r.upvotes || 0) + 1 } : r
          );
          await updateDoc(postRef, { replies: updatedReplies });
      }
  }

  // --- Gamification ---
  async getChallenges(): Promise<Challenge[]> {
    if (!db) return [];
    const snapshot = await getDocs(collection(db, 'challenges'));
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }) as Challenge);
  }

  async getLeaderboard(): Promise<LeaderboardEntry[]> {
    if (!db) return [];
    const q = query(collection(db, 'users'), where('role', '==', 'student'), orderBy('progress.points', 'desc'), where('progress.points', '>', 0));
    const snapshot = await getDocs(q);
    return snapshot.docs.map((doc, index) => {
        const user = doc.data() as User;
        return {
            rank: index + 1,
            name: user.name,
            points: user.progress.points,
            isCurrentUser: false // This needs to be set in the component
        };
    });
  }

  // --- Social Learning ---
  async getStudyGoals(): Promise<StudyGoal[]> {
    if (!db) return [];
    const snapshot = await getDocs(collection(db, 'studyGoals'));
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }) as StudyGoal);
  }
  
  // --- AI Recommendations (Logic is local, but depends on live user data) ---
  async getAIRecommendations(user: User): Promise<AIRecommendation[]> {
    const allRecommendations: AIRecommendation[] = [
      { id: 'rec-1', title: 'مراجعة قانون فاراداي', reason: 'لاحظنا أنك تواجه صعوبة في مسائل الحث الكهرومغناطيسي.', type: 'lesson', targetId: 'l12-1-1', urgency: 'high' },
      { id: 'rec-2', title: 'تحدي جديد: ماراثون الكهرومغناطيسية', reason: 'بناءً على تفوقك في الوحدة الأولى، نعتقد أنك جاهز لهذا التحدي.', type: 'challenge', targetId: 'ch-1', urgency: 'medium' },
      { id: 'rec-3', title: 'شارك في النقاش', reason: 'سؤال تم طرحه يتعلق بموضوع درسته مؤخراً. قد تتمكن من المساعدة!', type: 'discussion', targetId: 'd1', urgency: 'low' },
      { id: 'rec-4', title: 'اختبر نفسك في الفيزياء الحديثة', reason: 'يبدو أنك مستعد لاختبار معلوماتك في هذا المجال المتقدم.', type: 'quiz', targetId: 'quiz-2', urgency: 'medium' },
      { id: 'rec-5', title: 'تعمق في النسبية الخاصة', reason: 'نوصي بهذا الدرس لتوسيع فهمك لمفاهيم أينشتاين.', type: 'lesson', targetId: 'l12-2-1', urgency: 'low' },
    ];
    
    const completedLessonIds = user.progress.completedLessonIds || [];
    const attemptedQuizIds = Object.keys(user.progress.quizScores || {});
    const completedChallengeIds = user.progress.achievements || [];

    return allRecommendations.filter(rec => {
      switch (rec.type) {
        case 'lesson': return !completedLessonIds.includes(rec.targetId);
        case 'quiz': return !attemptedQuizIds.includes(rec.targetId);
        case 'challenge': return !completedChallengeIds.includes(rec.targetId);
        default: return true;
      }
    });
  }

  // --- Resources, Financials, Notifications, etc. ---
  async getResources(): Promise<EducationalResource[]> {
      if(!db) return [];
      const snapshot = await getDocs(collection(db, 'resources'));
      return snapshot.docs.map(d => ({id: d.id, ...d.data()}) as EducationalResource);
  }
  async initiatePayment(userId: string, planId: string, amount: number): Promise<Invoice> {
      const user = await this.getUser(userId);
      const invoiceData = {
          userId, userName: user?.name || 'N/A', planId, amount,
          date: new Date().toISOString(), status: 'PENDING' as PaymentStatus,
          trackId: `track_${Math.random().toString(36).substr(2, 9)}`,
      };
      const docRef = await addDoc(collection(db, 'invoices'), invoiceData);
      return { ...invoiceData, id: docRef.id };
  }
  async completePayment(trackId: string, result: 'SUCCESS' | 'FAIL'): Promise<Invoice | null> {
      const q = query(collection(db, 'invoices'), where('trackId', '==', trackId));
      const snapshot = await getDocs(q);
      if(snapshot.empty) return null;

      const invoiceDoc = snapshot.docs[0];
      const status = result === 'SUCCESS' ? 'PAID' : 'FAIL';
      const paymentId = result === 'SUCCESS' ? `pay_${Date.now()}` : undefined;
      
      await updateDoc(invoiceDoc.ref, { status, paymentId });
      
      if(result === 'SUCCESS') {
          const userId = invoiceDoc.data().userId;
          await updateDoc(doc(db, 'users', userId), { subscription: 'premium' });
      }
      return { ...invoiceDoc.data(), id: invoiceDoc.id, status, paymentId } as Invoice;
  }
  async getInvoices(): Promise<{ data: Invoice[] }> {
      if(!db) return { data: [] };
      const snapshot = await getDocs(collection(db, 'invoices'));
      return { data: snapshot.docs.map(d => ({id: d.id, ...d.data()}) as Invoice) };
  }
  async updateInvoiceStatus(id: string, status: PaymentStatus): Promise<void> {
      if(!db) return;
      await updateDoc(doc(db, 'invoices', id), { status });
  }

  // --- Payment Settings & Codes ---
  async getPaymentSettings(): Promise<PaymentSettings> {
    if (!db) return { isOnlinePaymentEnabled: true };
    const docRef = doc(db, "settings", "payment");
    const docSnap = await getDoc(docRef);
    if (docSnap.exists()) {
        return docSnap.data() as PaymentSettings;
    }
    // Default to enabled if not set
    return { isOnlinePaymentEnabled: true };
  }

  async setPaymentSettings(isEnabled: boolean): Promise<void> {
    if (!db) return;
    const docRef = doc(db, "settings", "payment");
    await setDoc(docRef, { isOnlinePaymentEnabled: isEnabled });
  }

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
    const q = query(collection(db, 'subscription_codes'), where('isUsed', '==', false), limit(20));
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }) as SubscriptionCode);
  }

  async activateSubscriptionWithCode(code: string, userId: string): Promise<{success: boolean, message: string}> {
    if (!db) return { success: false, message: 'Database error.' };
    
    const q = query(collection(db, 'subscription_codes'), where('code', '==', code));
    const snapshot = await getDocs(q);
    
    if (snapshot.empty) {
        return { success: false, message: 'الكود غير صحيح.' };
    }
    
    const codeDoc = snapshot.docs[0];
    const codeData = codeDoc.data() as SubscriptionCode;

    if (codeData.isUsed) {
        return { success: false, message: 'هذا الكود تم استخدامه مسبقاً.' };
    }

    const batch = writeBatch(db);
    
    // Update user subscription
    const userRef = doc(db, 'users', userId);
    batch.update(userRef, { subscription: 'premium' });

    // Mark code as used
    batch.update(codeDoc.ref, {
        isUsed: true,
        userId: userId,
        activatedAt: new Date().toISOString()
    });

    try {
        await batch.commit();
        return { success: true, message: 'تم تفعيل الاشتراك بنجاح!' };
    } catch (e) {
        return { success: false, message: 'حدث خطأ أثناء تفعيل الكود.' };
    }
  }

  // --- Other Services ---
  async addNotification(userId: string, notification: Omit<AppNotification, 'id'>): Promise<void> {
      if(!db) return;
      await addDoc(collection(db, 'users', userId, 'notifications'), notification);
  }
  async getNotifications(userId: string): Promise<AppNotification[]> {
      if(!db) return [];
      const snapshot = await getDocs(collection(db, 'users', userId, 'notifications'));
      return snapshot.docs.map(d => ({id: d.id, ...d.data()}) as AppNotification);
  }

  async getStudentProgressForParent(studentUid: string): Promise<{ user: User | null, report: WeeklyReport | null }> {
      const user = await this.getUser(studentUid);
      const report: WeeklyReport = { week: 'Current', scoreAverage: 85, hoursSpent: 8.5, completedUnits: 2, improvementAreas: [], parentNote: "أداء ممتاز هذا الأسبوع، نلاحظ تحسناً في مهارات حل المسائل." };
      return { user, report };
  }

  async getTeacherReviews(teacherId: string): Promise<Review[]> {
      if(!db) return [];
      const q = query(collection(db, 'reviews'), where('teacherId', '==', teacherId));
      const snapshot = await getDocs(q);
      return snapshot.docs.map(d => ({id: d.id, ...d.data()}) as Review);
  }
  async addReview(review: Omit<Review, 'id'>): Promise<void> {
      if(!db) return;
      await addDoc(collection(db, 'reviews'), review);
  }
  async saveTeacherMessage(message: Omit<TeacherMessage, 'id'>): Promise<void> {
    if(!db) return;
    await addDoc(collection(db, 'teacherMessages'), message);
  }
  async getAllTeacherMessages(teacherId: string): Promise<TeacherMessage[]> {
    if(!db) return [];
    const q = query(collection(db, 'teacherMessages'), where('teacherId', '==', teacherId));
    const snapshot = await getDocs(q);
    return snapshot.docs.map(d => ({id: d.id, ...d.data()}) as TeacherMessage);
  }

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
  async updateTodo(userId: string, todoId: string, updates: Partial<Todo>): Promise<void> {
    if(!db) return;
    await updateDoc(doc(db, 'users', userId, 'todos', todoId), updates);
  }
  async deleteTodo(userId: string, todoId: string): Promise<void> {
    if(!db) return;
    await deleteDoc(doc(db, 'users', userId, 'todos', todoId));
  }
}

export const dbService = SyrianScienceCenterDB.getInstance();
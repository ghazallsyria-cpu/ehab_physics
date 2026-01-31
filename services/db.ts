import { db, storage, firebase } from './firebase';
import {
  User, Curriculum, Quiz, Question, StudentQuizAttempt,
  AppNotification, Todo, TeacherMessage, Review,
  HomePageContent, Asset, ForumSection,
  ForumPost, ForumReply, LoggingSettings,
  NotificationSettings, PaymentSettings, Invoice, AIRecommendation,
  Unit, Lesson, LiveSession, EducationalResource, UserRole,
  AppBranding, InvoiceSettings, MaintenanceSettings,
  LessonScene, StudentLessonProgress, StudentInteractionEvent, LessonAnalyticsData,
  BrochureSettings, WeeklyReport
} from '../types';


class DBService {
  private cleanData(data: any) {
    const clean = { ...data };
    Object.keys(clean).forEach(key => (clean[key] === undefined) && delete clean[key]);
    return clean;
  }

  // --- 👤 User Services ---
  async getUser(identifier: string): Promise<User | null> {
    if (!db) {
        console.error("Firestore DB is not initialized.");
        return null;
    }
    try {
      if (identifier.includes('@')) {
          const snap = await db.collection('users').where('email', '==', identifier).limit(1).get();
          if (!snap.empty) {
              return { uid: snap.docs[0].id, ...snap.docs[0].data() } as User;
          }
          return null;
      } else {
          const snap = await db.collection('users').doc(identifier).get();
          return snap.exists ? { uid: snap.id, ...snap.data() } as User : null;
      }
    } catch (e) {
      console.error("Firebase getUser failed:", e);
      return null;
    }
  }
  
  async saveUser(user: User): Promise<void> {
    if (!db) return;
    try {
      const cleanedUser = this.cleanData(user);
      await db.collection('users').doc(user.uid).set(cleanedUser, { merge: true });
    } catch (e) {
        console.error("Failed to save user:", e);
        throw e;
    }
  }
  
  subscribeToUser(uid: string, callback: (user: User | null) => void): () => void {
      if (!db) return () => {};
      return db.collection('users').doc(uid).onSnapshot(snap => {
          callback(snap.exists ? { uid: snap.id, ...snap.data() } as User : null);
      }, (error) => {
          console.error("Subscribe user error:", error);
      });
  }

  // --- 📚 Curriculum, Units, Lessons ---
  async getCurriculum(): Promise<Curriculum[]> {
    if(!db) {
        console.error("DB not initialized in getCurriculum");
        return [];
    }
    try {
        const snap = await db.collection('curriculum').get();
        return snap.docs.map(d => ({ id: d.id, ...d.data() } as Curriculum));
    } catch (e) {
        console.error("Failed to get curriculum:", e);
        return [];
    }
  }

  async getLesson(id: string): Promise<Lesson | null> {
     if (!db) return null;
     try {
         const snap = await db.collection('lessons').doc(id).get();
         return snap.exists ? { id: snap.id, ...snap.data() } as Lesson : null;
     } catch (e) {
         console.error("Failed to get lesson:", e);
         return null;
     }
  }
  
  async saveLesson(lesson: Lesson, unitId: string): Promise<Lesson> {
      if (!db) throw new Error("DB not connected");

      // Save to flat 'lessons' collection for direct lookup
      await db.collection('lessons').doc(lesson.id).set(lesson, { merge: true });
      
      // Update the nested lesson array within the unit document
      try {
          const curriculums = await this.getCurriculum();
          let updated = false;
          
          for (const curriculum of curriculums) {
              const unit = curriculum.units.find(u => u.id === unitId);
              if (unit) {
                  const lessonIndex = unit.lessons.findIndex(l => l.id === lesson.id);
                  if (lessonIndex > -1) {
                      unit.lessons[lessonIndex] = lesson;
                  } else {
                      unit.lessons.push(lesson);
                  }
                  await db.collection('curriculum').doc(curriculum.id).update({ units: curriculum.units });
                  updated = true;
                  break;
              }
          }
          
          if (!updated) {
              console.warn("Unit ID not found in curriculum structure. Lesson saved to 'lessons' collection only.");
          }
      } catch (e) {
          console.error("Failed to update unit structure:", e);
          // Don't throw, as the lesson was saved to the main collection
      }
      return lesson;
  }

  // --- ❓ Quizzes, Questions, Attempts ---
  async getQuizzes(grade?: string): Promise<Quiz[]> {
      if (!db) return [];
      try {
          let query: firebase.firestore.Query = db.collection('quizzes');
          if (grade && grade !== 'all') query = query.where('grade', '==', grade);
          const snap = await query.get();
          return snap.docs.map(d => ({ id: d.id, ...d.data() } as Quiz));
      } catch (e) {
          console.error("Failed to get quizzes:", e);
          return [];
      }
  }

  async getQuizWithQuestions(id: string): Promise<{ quiz: Quiz; questions: Question[] } | null> {
      if (!db) return null;
      try {
          const quizSnap = await db.collection('quizzes').doc(id).get();
          if (!quizSnap.exists) return null;
          const quiz = { id: quizSnap.id, ...quizSnap.data() } as Quiz;
          if (!quiz.questionIds || quiz.questionIds.length === 0) return { quiz, questions: [] };
          
          // Firestore 'in' query is limited to 10 items. Chunking needed for production.
          const questionsSnap = await db.collection('questions').where(firebase.firestore.FieldPath.documentId(), 'in', quiz.questionIds.slice(0, 10)).get();
          const questions = questionsSnap.docs.map(d => ({ id: d.id, ...d.data() } as Question));
          return { quiz, questions };
      } catch (e) {
          console.error("Failed to get quiz details:", e);
          return null;
      }
  }
  
  async getLessonScenesForBuilder(lessonId: string): Promise<LessonScene[]> {
      if (!db) return [];
      try {
          const snap = await db.collection('lesson_scenes').where('lesson_id', '==', lessonId).get();
          return snap.docs.map(d => d.data() as LessonScene);
      } catch (e) {
          console.error(e);
          return [];
      }
  }
  
  async saveLessonScene(scene: LessonScene): Promise<LessonScene> {
      if (!db) throw new Error("DB not connected");
      await db.collection('lesson_scenes').doc(scene.id).set(scene, { merge: true });
      return scene;
  }

  async logStudentInteraction(event: StudentInteractionEvent): Promise<void> {
    if (!db) return;
    try {
        await db.collection('student_interaction_events').add(event);
    } catch (e) { console.error("Log interaction failed", e); }
  }

  subscribeToLessonInteractions(lessonId: string, callback: (payload: any) => void): { unsubscribe: () => void } {
      if (!db) return { unsubscribe: () => {} };
      
      const unsubscribe = db.collection('student_interaction_events')
          .where('lesson_id', '==', lessonId)
          .onSnapshot(async (snapshot) => {
              for (const change of snapshot.docChanges()) {
                  if (change.type === 'added') {
                      const newEvent = change.doc.data() as StudentInteractionEvent;
                      const user = await this.getUser(newEvent.student_id as string);
                      callback({ ...newEvent, studentName: user?.name || 'Unknown' });
                  }
              }
          }, err => console.error("Subscribe analytics error", err));
      return { unsubscribe };
  }

  private mapToInvoice(doc: firebase.firestore.DocumentSnapshot): Invoice {
    const data = doc.data() || {};
    return {
        id: doc.id,
        userId: data.userId || '',
        userName: data.userName || 'Unknown',
        planId: data.planId || 'N/A',
        amount: Number(data.amount || 0),
        date: data.date || new Date().toISOString(),
        status: data.status || 'PENDING',
        trackId: data.trackId || 'N/A',
        authCode: data.authCode || 'N/A',
        paymentId: data.paymentId
    };
  }
  
  async getAdvancedFinancialStats(): Promise<{ daily: number, monthly: number, yearly: number, total: number, pending: number }> {
    if (!db) return { daily: 0, monthly: 0, yearly: 0, total: 0, pending: 0 };
    try {
        const snap = await db.collection('invoices').get();
        const invoices = snap.docs.map(this.mapToInvoice);
        
        const now = new Date();
        const today = now.toISOString().split('T')[0];
        const thisMonth = now.toISOString().substring(0, 7);
        const thisYear = now.getFullYear();

        let daily = 0, monthly = 0, yearly = 0, total = 0, pending = 0;

        invoices.forEach(inv => {
            if (inv.status === 'PAID') {
                const invDate = new Date(inv.date);
                total += inv.amount;
                if (inv.date.startsWith(today)) daily += inv.amount;
                if (inv.date.startsWith(thisMonth)) monthly += inv.amount;
                if (invDate.getFullYear() === thisYear) yearly += inv.amount;
            } else if (inv.status === 'PENDING') {
                pending++;
            }
        });
        return { daily, monthly, yearly, total, pending };
    } catch (e) {
        console.error(e);
        return { daily: 0, monthly: 0, yearly: 0, total: 0, pending: 0 };
    }
  }

  subscribeToUsers(callback: (users: User[]) => void, role: UserRole): () => void {
      if (!db) return () => {};
      return db.collection('users').where('role', '==', role).onSnapshot(snap => {
          callback(snap.docs.map(d => ({ uid: d.id, ...d.data() } as User)));
      });
  }

  async getStudentProgressForParent(uid: string): Promise<{ user: User | null, report: WeeklyReport | null }> {
      if (!db) return { user: null, report: null };
      const user = await this.getUser(uid);
      const report = user?.weeklyReports?.[0] || null;
      return { user, report };
  }

  async getNotifications(uid: string): Promise<AppNotification[]> {
      if(!db) return [];
      const snap = await db.collection('notifications').where('userId', '==', uid).orderBy('timestamp', 'desc').limit(20).get();
      return snap.docs.map(d => ({ ...d.data(), id: d.id } as AppNotification));
  }

  async getMaintenanceSettings(): Promise<MaintenanceSettings | null> {
      if (!db) return null;
      try {
          const snap = await db.collection('settings').doc('maintenance').get();
          return snap.exists ? snap.data() as MaintenanceSettings : null;
      } catch (e) { return null; }
  }
  
  async saveMaintenanceSettings(settings: MaintenanceSettings) {
      if (!db) return;
      await db.collection('settings').doc('maintenance').set(settings, { merge: true });
  }

  subscribeToMaintenance(callback: (settings: MaintenanceSettings | null) => void): () => void {
      if (!db) return () => {};
      return db.collection('settings').doc('maintenance').onSnapshot(snap => {
          callback(snap.exists ? snap.data() as MaintenanceSettings : null);
      });
  }
  
  async getGlobalStats() {
      if(!db) return {};
      try {
          const snap = await db.collection('stats').doc('global').get();
          return snap.exists ? snap.data() : {};
      } catch (e) { return {}; }
  }
  
  subscribeToGlobalStats(callback: (stats: any) => void): () => void {
      if(!db) return () => {};
      return db.collection('stats').doc('global').onSnapshot(snap => {
          callback(snap.exists ? snap.data() : {});
      }, e => console.error("Stats subscription error", e));
  }
  
  async getPaymentSettings(): Promise<PaymentSettings | null> {
      if(!db) return null;
      try {
          const snap = await db.collection('settings').doc('payment').get();
          return snap.exists ? snap.data() as PaymentSettings : null;
      } catch (e) { return null; }
  }
  
  async savePaymentSettings(settings: PaymentSettings) {
      if(!db) return;
      await db.collection('settings').doc('payment').set(settings, { merge: true });
  }

  async getInvoiceSettings(): Promise<InvoiceSettings | null> {
      if(!db) return null;
      const snap = await db.collection('settings').doc('invoice').get();
      return snap.exists ? snap.data() as InvoiceSettings : null;
  }
  
  async saveInvoiceSettings(settings: InvoiceSettings) {
      if(!db) return;
      await db.collection('settings').doc('invoice').set(settings, { merge: true });
  }

  async getAppBranding(): Promise<AppBranding | null> {
      if(!db) return null;
      const snap = await db.collection('settings').doc('branding').get();
      return snap.exists ? snap.data() as AppBranding : null;
  }
  
  async saveAppBranding(branding: AppBranding) {
      if(!db) return;
      await db.collection('settings').doc('branding').set(branding, { merge: true });
  }
  
  async getHomePageContent(): Promise<HomePageContent[]> {
      if(!db) return [];
      try {
          const snap = await db.collection('homePageContent').orderBy('createdAt', 'desc').get();
          return snap.docs.map(d => ({ ...d.data(), id: d.id } as HomePageContent));
      } catch (e) {
          console.error("Failed to load home content", e);
          return [];
      }
  }

  async saveHomePageContent(content: Partial<HomePageContent>) {
      if(!db) return;
      if (content.id) {
          await db.collection('homePageContent').doc(content.id).set(content, { merge: true });
      } else {
          await db.collection('homePageContent').add({ ...content, createdAt: new Date().toISOString() });
      }
  }
  
  async deleteHomePageContent(id: string) {
      if(!db) return;
      await db.collection('homePageContent').doc(id).delete();
  }
  
  async getInvoices(): Promise<{data: Invoice[]}> {
      if(!db) return {data: []};
      const snap = await db.collection('invoices').orderBy('date', 'desc').get();
      return { data: snap.docs.map(this.mapToInvoice) };
  }
  
  subscribeToInvoices(uid: string, callback: (invoices: Invoice[]) => void) {
      if(!db) return () => {};
      return db.collection('invoices').where('userId', '==', uid).orderBy('date', 'desc').onSnapshot(snap => {
          callback(snap.docs.map(this.mapToInvoice));
      });
  }

  async updateStudentSubscription(uid: string, tier: 'free' | 'premium', amount: number) {
      if(!db) return;
      // This would normally be a Cloud Function for security
      const userRef = db.collection('users').doc(uid);
      await userRef.update({ subscription: tier });
      await db.collection('invoices').add({
          userId: uid,
          userName: (await userRef.get()).data()?.name || 'Unknown',
          planId: `plan_${tier}`,
          amount,
          date: new Date().toISOString(),
          status: 'PAID',
          trackId: `MANUAL_${Date.now()}`,
          authCode: 'ADMIN'
      });
  }
  
  async createManualInvoice(userId: string, planId: string, amount: number): Promise<Invoice> {
    if(!db) throw new Error("DB not connected");
    const user = await this.getUser(userId);
    if (!user) throw new Error("User not found");
    const newInvoice: Omit<Invoice, 'id'> = {
        userId,
        userName: user.name,
        planId,
        amount,
        date: new Date().toISOString(),
        status: 'PAID',
        trackId: `MANUAL_${Date.now()}`,
        authCode: 'ADMIN_ENTRY'
    };
    const docRef = await db.collection('invoices').add(newInvoice);
    await db.collection('users').doc(userId).update({ subscription: 'premium' });
    return { ...newInvoice, id: docRef.id };
  }
  
  async deleteInvoice(id: string) {
      if(!db) return;
      await db.collection('invoices').doc(id).delete();
  }
  
  async getQuizById(id: string): Promise<Quiz | null> {
      if(!db) return null;
      const snap = await db.collection('quizzes').doc(id).get();
      return snap.exists ? { ...snap.data(), id: snap.id } as Quiz : null;
  }
  
  async getAllQuestions(): Promise<Question[]> {
      if(!db) return [];
      const snap = await db.collection('questions').get();
      return snap.docs.map(d => ({...d.data(), id: d.id} as Question));
  }
  
  async saveAttempt(attempt: StudentQuizAttempt): Promise<StudentQuizAttempt> {
      if(!db) throw new Error("DB not connected");
      const docRef = await db.collection('attempts').add(attempt);
      return { ...attempt, id: docRef.id };
  }
  
  async getUserAttempts(uid: string, quizId?: string): Promise<StudentQuizAttempt[]> {
      if(!db) return [];
      let query: firebase.firestore.Query = db.collection('attempts').where('studentId', '==', uid);
      if (quizId) query = query.where('quizId', '==', quizId);
      const snap = await query.orderBy('completedAt', 'desc').get();
      return snap.docs.map(d => ({...d.data(), id: d.id} as StudentQuizAttempt));
  }

  async getAttemptsForQuiz(quizId: string): Promise<StudentQuizAttempt[]> {
      if(!db) return [];
      const snap = await db.collection('attempts').where('quizId', '==', quizId).orderBy('completedAt', 'desc').get();
      return snap.docs.map(d => ({...d.data(), id: d.id} as StudentQuizAttempt));
  }
  
  async updateAttempt(attemptId: string, updates: Partial<StudentQuizAttempt>): Promise<void> {
      if(!db) return;
      await db.collection('attempts').doc(attemptId).set(updates, { merge: true });
  }

  async getAttemptById(id: string): Promise<StudentQuizAttempt | null> {
    if (!db) return null;
    const snap = await db.collection('attempts').doc(id).get();
    return snap.exists ? { ...snap.data(), id: snap.id } as StudentQuizAttempt : null;
  }
  
  async saveQuiz(quiz: Quiz): Promise<Quiz> {
      if(!db) throw new Error("DB not connected");
      await db.collection('quizzes').doc(quiz.id).set(quiz, { merge: true });
      return quiz;
  }
  
  async deleteQuiz(id: string) {
      if(!db) return;
      await db.collection('quizzes').doc(id).delete();
  }
  
  async saveQuestion(question: Partial<Question>): Promise<Question> {
      if(!db) throw new Error("DB not connected");
      const docRef = question.id ? db.collection('questions').doc(question.id) : db.collection('questions').doc();
      await docRef.set(question, { merge: true });
      return { ...question, id: docRef.id } as Question;
  }

  async deleteQuestion(questionId: string) {
      if(!db) return;
      await db.collection('questions').doc(questionId).delete();
  }
  
  async uploadAsset(file: File): Promise<Asset> {
    if (!storage) throw new Error("Firebase Storage not available");
    const ref = storage.ref(`assets/${Date.now()}_${file.name}`);
    const snapshot = await ref.put(file);
    const url = await snapshot.ref.getDownloadURL();
    return { name: ref.name, url, type: file.type, size: file.size };
  }

  async listAssets(): Promise<Asset[]> {
    if (!storage) return [];
    try {
        const listRef = storage.ref('assets');
        const res = await listRef.listAll();
        const assets: Asset[] = [];
        for (const itemRef of res.items) {
            const [metadata, url] = await Promise.all([
                itemRef.getMetadata(),
                itemRef.getDownloadURL()
            ]);
            assets.push({
                name: itemRef.name,
                url: url,
                type: metadata.contentType || 'unknown',
                size: metadata.size || 0
            });
        }
        return assets;
    } catch (e) {
        console.error("List assets failed:", e);
        return [];
    }
  }

  async deleteAsset(name: string) {
      if (!storage) return;
      await storage.ref(`assets/${name}`).delete();
  }
  
  subscribeToNotifications(uid: string, callback: (notifications: AppNotification[]) => void) {
      if(!db) return () => {};
      return db.collection('notifications').where('userId', '==', uid).orderBy('timestamp', 'desc').limit(20)
        .onSnapshot(snap => {
            callback(snap.docs.map(d => ({ ...d.data(), id: d.id } as AppNotification)));
        });
  }
  
  async createNotification(notification: Omit<AppNotification, 'id'>) {
      if(!db) return;
      await db.collection('notifications').add(notification);
  }

  async markNotificationsAsRead(uid: string) {
      if(!db) return;
      const snap = await db.collection('notifications').where('userId', '==', uid).where('isRead', '==', false).get();
      const batch = db.batch();
      snap.docs.forEach(doc => batch.update(doc.ref, { isRead: true }));
      await batch.commit();
  }
  
  async getForumSections(): Promise<ForumSection[]> {
      if(!db) return [];
      const snap = await db.collection('forumSections').orderBy('order', 'asc').get();
      return snap.docs.map(d => ({...d.data(), id: d.id} as ForumSection));
  }

  async getForumPosts(forumId?: string): Promise<ForumPost[]> {
      if(!db) return [];
      let query: firebase.firestore.Query = db.collection('forumPosts');
      if (forumId) {
          query = query.where('tags', 'array-contains', forumId);
      }
      const snap = await query.orderBy('timestamp', 'desc').get();
      return snap.docs.map(d => ({...d.data(), id: d.id} as ForumPost));
  }
  
  async createForumPost(post: Omit<ForumPost, 'id'>) {
      if(!db) return;
      await db.collection('forumPosts').add(post);
  }
  
  async addForumReply(postId: string, reply: Omit<ForumReply, 'id' | 'timestamp' | 'upvotes'>) {
      if(!db) return;
      const fullReply = {
          ...reply,
          id: `reply_${Date.now()}`,
          timestamp: new Date().toISOString(),
          upvotes: 0
      };
      await db.collection('forumPosts').doc(postId).update({
          replies: firebase.firestore.FieldValue.arrayUnion(fullReply)
      });
  }
  
  async saveForumSections(sections: ForumSection[]) {
      if(!db) return;
      const batch = db.batch();
      sections.forEach(sec => {
          const ref = db.collection('forumSections').doc(sec.id);
          batch.set(this.cleanData(sec));
      });
      await batch.commit();
  }
  
  async updateForumPost(postId: string, updates: Partial<ForumPost>) {
      if(!db) return;
      await db.collection('forumPosts').doc(postId).update(updates);
  }
  
  async deleteForumPost(postId: string) {
      if(!db) return;
      await db.collection('forumPosts').doc(postId).delete();
  }
  
  async initializeForumSystem() {
      if(!db) return;
      const batch = db.batch();
      
      const sectionsRef = db.collection('forumSections').doc('general_physics');
      batch.set(sectionsRef, { id: 'general_physics', title: 'الفيزياء العامة', description: 'نقاشات حول المنهج', order: 0, forums: [{ id: 'grade_12', title: 'الصف الثاني عشر', description: 'أسئلة ونقاشات الصف 12', icon: '🎓', order: 0 }] });
      
      const postRef = db.collection('forumPosts').doc();
      batch.set(postRef, { authorUid: 'system', authorName: 'الإدارة', title: 'مرحباً بكم في ساحة النقاش!', content: 'هنا يمكنكم طرح الأسئلة والتفاعل مع زملائكم.', tags: ['grade_12'], upvotes: 1, replies: [], timestamp: new Date().toISOString(), isPinned: true });
      
      await batch.commit();
  }
  
  async getLiveSessions(): Promise<LiveSession[]> {
      if(!db) return [];
      const snap = await db.collection('liveSessions').orderBy('startTime', 'asc').get();
      return snap.docs.map(d => ({...d.data(), id: d.id} as LiveSession));
  }

  subscribeToLiveSessions(callback: (sessions: LiveSession[]) => void) {
      if(!db) return () => {};
      return db.collection('liveSessions').orderBy('startTime', 'asc').onSnapshot(snap => {
          callback(snap.docs.map(d => ({...d.data(), id: d.id} as LiveSession)));
      });
  }
  
  async saveLiveSession(session: Partial<LiveSession>) {
      if(!db) return;
      if (session.id) {
          await db.collection('liveSessions').doc(session.id).set(session, { merge: true });
      } else {
          await db.collection('liveSessions').add(session);
      }
  }

  async deleteLiveSession(id: string) {
      if(!db) return;
      await db.collection('liveSessions').doc(id).delete();
  }
  
  async getExperiments(grade?: string): Promise<any[]> {
      if(!db) return [];
      let query: firebase.firestore.Query = db.collection('experiments');
      if (grade) query = query.where('grade', '==', grade);
      const snap = await query.get();
      return snap.docs.map(d => ({...d.data(), id: d.id}));
  }
  
  async saveExperiment(exp: Partial<any>) {
      if(!db) return;
      if (exp.id) await db.collection('experiments').doc(exp.id).set(exp, { merge: true });
      else await db.collection('experiments').add(exp);
  }
  
  async deleteExperiment(id: string) {
      if(!db) return;
      await db.collection('experiments').doc(id).delete();
  }
  
  async getResources(): Promise<EducationalResource[]> { return []; }
  async getEquations(): Promise<any[]> { return []; }
  async getArticles(): Promise<any[]> { return []; }
  async getStudyGroups(): Promise<any[]> { return []; }

  async getTeachers(): Promise<User[]> {
      if(!db) return [];
      const snap = await db.collection('users').where('role', '==', 'teacher').get();
      return snap.docs.map(d => d.data() as User);
  }
  
  async getAdmins(): Promise<User[]> {
      if(!db) return [];
      const snap = await db.collection('users').where('role', '==', 'admin').get();
      return snap.docs.map(d => d.data() as User);
  }

  async updateUserRole(uid: string, role: UserRole) {
      if(!db) return;
      await db.collection('users').doc(uid).update({ role });
  }

  async deleteUser(uid: string) {
      if(!db) return;
      await db.collection('users').doc(uid).delete();
  }
  
  async getTeacherReviews(teacherId: string): Promise<Review[]> {
      if(!db) return [];
      const snap = await db.collection('reviews').where('teacherId', '==', teacherId).get();
      return snap.docs.map(d => ({...d.data(), id: d.id} as Review));
  }
  
  async addReview(review: Review) {
      if(!db) return;
      await db.collection('reviews').doc(review.id).set(review);
  }
  
  async saveTeacherMessage(message: TeacherMessage) {
      if(!db) return;
      await db.collection('teacherMessages').add(message);
  }
  
  async getAllTeacherMessages(teacherId: string): Promise<TeacherMessage[]> {
      if(!db) return [];
      const snap = await db.collection('teacherMessages').where('teacherId', '==', teacherId).get();
      return snap.docs.map(d => ({...d.data(), id: d.id} as TeacherMessage));
  }

  async getTodos(uid: string): Promise<Todo[]> {
      if(!db) return [];
      const snap = await db.collection('users').doc(uid).collection('todos').orderBy('createdAt', 'desc').get();
      return snap.docs.map(d => ({ ...d.data(), id: d.id } as Todo));
  }

  async saveTodo(uid: string, todo: Omit<Todo, 'id'>): Promise<string> {
      if(!db) return "";
      const docRef = await db.collection('users').doc(uid).collection('todos').add(todo);
      return docRef.id;
  }
  
  async updateTodo(uid: string, todoId: string, updates: Partial<Todo>) {
      if(!db) return;
      await db.collection('users').doc(uid).collection('todos').doc(todoId).update(updates);
  }
  
  async deleteTodo(uid: string, todoId: string) {
      if(!db) return;
      await db.collection('users').doc(uid).collection('todos').doc(todoId).delete();
  }
  
  async getAIRecommendations(user: User): Promise<AIRecommendation[]> {
      if(!db) return [];
      const snap = await db.collection('recommendations')
        .where('targetGrade', 'in', ['all', user.grade])
        .get();
      return snap.docs.map(d => ({...d.data(), id: d.id} as AIRecommendation));
  }
  
  async saveRecommendation(rec: Partial<AIRecommendation>) {
      if(!db) return;
      if (rec.id) await db.collection('recommendations').doc(rec.id).set(rec, { merge: true });
      else await db.collection('recommendations').add({ ...rec, createdAt: new Date().toISOString() });
  }

  async deleteRecommendation(id: string) {
      if(!db) return;
      await db.collection('recommendations').doc(id).delete();
  }
  
  async getLoggingSettings(): Promise<LoggingSettings> {
      if(!db) return {} as LoggingSettings;
      const snap = await db.collection('settings').doc('logging').get();
      return snap.data() as LoggingSettings;
  }
  
  async saveLoggingSettings(settings: LoggingSettings) {
      if(!db) return;
      await db.collection('settings').doc('logging').set(settings, { merge: true });
  }

  async getNotificationSettings(): Promise<NotificationSettings> {
      if(!db) return {} as NotificationSettings;
      const snap = await db.collection('settings').doc('notifications').get();
      return snap.data() as NotificationSettings;
  }
  
  async saveNotificationSettings(settings: NotificationSettings) {
      if(!db) return;
      await db.collection('settings').doc('notifications').set(settings, { merge: true });
  }
  
  async getBrochureSettings(): Promise<BrochureSettings> {
      if(!db) return {} as BrochureSettings;
      try {
          const snap = await db.collection('settings').doc('brochure').get();
          return snap.data() as BrochureSettings;
      } catch (e) {
          return {} as BrochureSettings;
      }
  }

  async saveBrochureSettings(settings: BrochureSettings) {
      if(!db) return;
      await db.collection('settings').doc('brochure').set(settings, { merge: true });
  }

  async checkConnection() {
      if (!db) return { alive: false, error: 'Firebase not initialized' };
      try {
          await db.collection('_health').doc('check').get();
          return { alive: true };
      } catch (e: any) {
          console.error("DB Check Failed:", e);
          return { alive: false, error: e.message };
      }
  }

  async toggleLessonComplete(uid: string, lessonId: string) {
      if(!db) return;
      const userRef = db.collection('users').doc(uid);
      const doc = await userRef.get();
      if (!doc.exists) return;
      const userData = doc.data() as User;
      const completed = userData.progress?.completedLessonIds || [];
      const points = userData.progress?.points || 0;

      if (completed.includes(lessonId)) {
          await userRef.update({
              'progress.completedLessonIds': firebase.firestore.FieldValue.arrayRemove(lessonId),
              'progress.points': firebase.firestore.FieldValue.increment(-10)
          });
      } else {
          await userRef.update({
              'progress.completedLessonIds': firebase.firestore.FieldValue.arrayUnion(lessonId),
              'progress.points': firebase.firestore.FieldValue.increment(10)
          });
      }
  }
  
  async deleteUnit(unitId: string) { if (!db) return; /* Complex: Needs to delete all sub-lessons */ }
  async deleteLesson(lessonId: string) { if (!db) return; /* Complex: Needs to update parent unit */ }
  async updateLesson(lessonId: string, updates: Partial<Lesson>) { if (!db) return; /* Complex: Needs to update parent unit */ }
  async saveUnit(unit: Unit, curriculumId: string): Promise<Unit> { 
      if (!db) throw new Error("DB offline"); 
      // Ensure the curriculum exists first (simple check)
      const currRef = db.collection('curriculum').doc(curriculumId);
      const currSnap = await currRef.get();
      if (!currSnap.exists) {
          // Auto-create curriculum doc if missing to allow unit creation
          await currRef.set({
              id: curriculumId,
              grade: '12', // Defaults
              subject: 'Physics',
              title: 'المنهج الافتراضي',
              description: 'تم الإنشاء تلقائياً',
              icon: '📚',
              units: []
          });
      }
      
      const currentData = (await currRef.get()).data() as Curriculum;
      const units = currentData.units || [];
      const existingIdx = units.findIndex(u => u.id === unit.id);
      
      if (existingIdx > -1) {
          units[existingIdx] = unit;
      } else {
          units.push(unit);
      }
      
      await currRef.update({ units });
      return unit; 
  }
  
  async getLessonAnalytics(lessonId: string): Promise<LessonAnalyticsData> {
    if (!db) return { scene_visits: [], decision_counts: [], live_events: [], ai_help_requests: 0 };
    try {
        const eventsSnap = await db.collection('student_interaction_events').where('lesson_id', '==', lessonId).get();
        const events = eventsSnap.docs.map(d => ({ ...d.data(), id: d.id } as StudentInteractionEvent));
        
        const sceneVisits: Record<string, number> = {};
        const decisionCounts: Record<string, number> = {};
        let aiRequests = 0;

        events.forEach(e => {
            if(e.to_scene_id) { sceneVisits[e.to_scene_id] = (sceneVisits[e.to_scene_id] || 0) + 1; }
            if(e.from_scene_id && e.decision_text) {
                const key = `${e.from_scene_id}__${e.decision_text}__${e.to_scene_id}`;
                decisionCounts[key] = (decisionCounts[key] || 0) + 1;
            }
            if(e.event_type === 'ai_help_requested') { aiRequests++; }
        });
        
        const scene_visits = Object.entries(sceneVisits).map(([scene_id, visit_count]) => ({ scene_id, title: `Scene ${scene_id.substring(0,4)}`, visit_count }));
        const decision_counts = Object.entries(decisionCounts).map(([key, choice_count]) => {
            const [from, text, to] = key.split('__');
            return { from_scene_id: from, decision_text: text, to_scene_id: to, choice_count };
        });

        return { scene_visits, decision_counts, live_events: [], ai_help_requests: aiRequests };
    } catch(e) {
        console.error("Analytics Error", e);
        return { scene_visits: [], decision_counts: [], live_events: [], ai_help_requests: 0 };
    }
  }

  async saveStudentLessonProgress(progress: Partial<StudentLessonProgress>) {
      if(!db) return;
      await db.collection('student_lesson_progress').doc(`${progress.student_id}_${progress.lesson_id}`).set(progress, { merge: true });
  }

  async getLessonScene(sceneId: string): Promise<LessonScene | null> { 
      if (!db) return null;
      try {
          const snap = await db.collection('lesson_scenes').doc(sceneId).get();
          return snap.exists ? snap.data() as LessonScene : null;
      } catch (e) { return null; }
  }
  async deleteLessonScene(sceneId: string) { if(!db) return; await db.collection('lesson_scenes').doc(sceneId).delete(); }
  
  async updateUnitsOrderSupabase(units: Unit[]) { /* Placeholder */ }
}

export const dbService = new DBService();
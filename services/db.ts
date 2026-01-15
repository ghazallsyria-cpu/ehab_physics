
import { User, Invoice, QuizAttempt, AppNotification, WeeklyReport, EducationalResource, TeacherProfile, Review, TeacherMessage, EducationalLevel, ForumPost, ForumReply } from "../types";
import { PHYSICS_TOPICS } from "../constants";
import { db, auth } from "./firebase";
import { 
  collection, 
  doc, 
  getDoc, 
  setDoc, 
  getDocs, 
  updateDoc, 
  deleteDoc, 
  query, 
  where, 
  orderBy, 
  limit, 
  addDoc 
} from "firebase/firestore";

class SyrianScienceCenterDB {
  private static instance: SyrianScienceCenterDB;
  private storageKey = "ssc_ops_db_v1";
  
  public static getInstance(): SyrianScienceCenterDB {
    if (!SyrianScienceCenterDB.instance) SyrianScienceCenterDB.instance = new SyrianScienceCenterDB();
    return SyrianScienceCenterDB.instance;
  }

  /**
   * Determines whether to use Cloud (Firebase) or Local Storage.
   * - Returns TRUE only if Firebase is initialized AND a user is authenticated via Firebase Auth.
   * - This ensures 'Demo' users (who are not auth'd in Firebase) use Local Storage, preventing permission errors.
   */
  private get useCloud(): boolean {
    return !!db && !!auth && !!auth.currentUser;
  }

  // --- Local Storage Helpers (Fallback) ---
  private getLocalData() {
    try {
      const raw = localStorage.getItem(this.storageKey);
      if (!raw) return this.getDefaultData();
      return JSON.parse(raw);
    } catch (e) {
      return this.getDefaultData();
    }
  }

  private saveLocalData(data: any) {
    localStorage.setItem(this.storageKey, JSON.stringify(data));
  }

  private getDefaultData() {
    // البيانات الافتراضية للوضع المحلي (Demo Mode)
    return { 
      users: {
        'admin_demo': {
            uid: 'admin_demo',
            email: 'admin@ssc.test',
            name: 'مدير المنصة',
            role: 'admin',
            grade: '12',
            stage: 'secondary',
            educationalLevel: EducationalLevel.SECONDARY,
            status: 'active',
            subscription: 'premium',
            points: 9999,
            createdAt: new Date().toISOString(),
            completedLessonIds: [],
            progress: { completedLessonIds: [], quizScores: {}, totalStudyHours: 0, currentFatigue: 0 }
        },
        'beta002': {
            uid: 'beta002',
            email: 'student.beta@ssc.test',
            name: 'طالب تجريبي (Beta)',
            role: 'student',
            grade: '12',
            stage: 'secondary',
            educationalLevel: EducationalLevel.SECONDARY,
            status: 'active',
            subscription: 'premium',
            points: 1250,
            createdAt: new Date().toISOString(),
            completedLessonIds: ['l12-1', 'l12-2'], 
            progress: { completedLessonIds: ['l12-1'], quizScores: {'q-1': 18}, totalStudyHours: 42, currentFatigue: 15 }
        }
      }, 
      attempts: [], 
      invoices: [], 
      notifications: {}, 
      questions: [], 
      teacher_messages: [], 
      teachers: [], 
      reviews: [], 
      resources: [],
      forum: [
        {
          id: 'post_1',
          authorEmail: 'student.beta@ssc.test',
          authorName: 'طالب تجريبي (Beta)',
          title: 'سؤال حول قانون نيوتن الثاني',
          content: 'لم أفهم تماماً كيف يمكن تطبيق قانون F=ma عندما تكون هناك قوى متعددة تؤثر على الجسم. هل نجمع القوى جبرياً أم اتجاهياً؟',
          tags: ['ميكانيكا', 'قوانين-نيوتن', 'صف-11'],
          timestamp: new Date(Date.now() - 86400000).toISOString(), // 1 day ago
          upvotes: 12,
          replies: [
            {
              id: 'rep_1',
              authorEmail: 'teacher@ssc.test',
              authorName: 'أ. جاسم الكندري',
              content: 'سؤال ممتاز! يجب جمع القوى اتجاهياً (Vector Sum) للحصول على القوة المحصلة، ثم تطبيق القانون. إذا كانت القوى على نفس المحور، يمكن جمعها جبرياً مع مراعاة الإشارة.',
              role: 'teacher',
              timestamp: new Date(Date.now() - 76400000).toISOString(),
              upvotes: 8,
            }
          ]
        },
        {
          id: 'post_2',
          authorEmail: 'another.student@ssc.test',
          authorName: 'لمى الحمصي',
          title: 'ما الفرق بين الانشطار والاندماج النووي؟',
          content: 'كلاهما ينتج طاقة هائلة، لكن ما هو الفرق الجوهري في آلية العمل؟ وأيهما أكثر كفاءة؟',
          tags: ['نووية', 'فيزياء-حديثة', 'صف-12'],
          timestamp: new Date(Date.now() - 172800000).toISOString(), // 2 days ago
          upvotes: 7,
          replies: []
        }
      ]
    };
  }

  // --- Users ---

  async getUser(identifier: string): Promise<User | null> {
    if (this.useCloud) {
      try {
        // If identifier is an email, query by the 'email' field.
        if (identifier.includes('@')) {
          const q = query(collection(db, "users"), where("email", "==", identifier));
          const querySnap = await getDocs(q);
          if (!querySnap.empty) {
            return querySnap.docs[0].data() as User;
          }
        } else {
          // Otherwise, assume it's a UID and get the document directly.
          const docRef = doc(db, "users", identifier);
          const docSnap = await getDoc(docRef);
          if (docSnap.exists()) {
            return docSnap.data() as User;
          }
        }
      } catch (e) {
        console.error("Firestore Error in getUser:", e);
      }
      return null;
    } else {
      const data = this.getLocalData();
      return data.users[identifier] || Object.values(data.users).find((u: any) => u.email === identifier) || null;
    }
  }

  async saveUser(user: User): Promise<void> {
    if (this.useCloud) {
      await setDoc(doc(db, "users", user.uid), user, { merge: true });
    } else {
      const data = this.getLocalData();
      if (!data.users) data.users = {};
      data.users[user.uid] = user;
      this.saveLocalData(data);
    }
  }

  async deleteUser(uid: string): Promise<void> {
    if (this.useCloud) {
      await deleteDoc(doc(db, "users", uid));
    } else {
      const data = this.getLocalData();
      if (data.users && data.users[uid]) {
        delete data.users[uid];
        this.saveLocalData(data);
      }
    }
  }

  async getAllStudents(): Promise<User[]> {
    if (this.useCloud) {
      const q = query(collection(db, "users"), where("role", "==", "student"));
      const snap = await getDocs(q);
      return snap.docs.map((d: any) => d.data() as User);
    } else {
      const data = this.getLocalData();
      return Object.values(data.users as Record<string, User>).filter((u) => u.role === 'student');
    }
  }

  // --- Analytics & Attempts ---

  async saveAttempt(attempt: QuizAttempt) {
    if (this.useCloud) {
      // حفظ في مجموعة attempts
      await addDoc(collection(db, "attempts"), attempt);
      
      // تحديث تقدم الطالب مباشرة
      const userRef = doc(db, "users", attempt.userId);
      const userSnap = await getDoc(userRef);
      if (userSnap.exists()) {
         const userData = userSnap.data() as User;
         const updatedScores = { ...userData.progress.quizScores, [attempt.quizId]: attempt.score };
         await updateDoc(userRef, {
            "progress.quizScores": updatedScores,
            "progress.lastActivity": new Date().toISOString(),
            "points": (userData.points || 0) + attempt.score
         });
      }
    } else {
      const data = this.getLocalData();
      if (!data.attempts) data.attempts = [];
      data.attempts.push(attempt);
      this.saveLocalData(data);
    }
  }

  async getUserAttempts(userId: string, quizId?: string) {
    if (this.useCloud) {
      let q = query(collection(db, "attempts"), where("userId", "==", userId));
      if (quizId) {
        q = query(q, where("quizId", "==", quizId));
      }
      const snap = await getDocs(q);
      return snap.docs.map((d: any) => d.data() as QuizAttempt);
    } else {
      const data = this.getLocalData();
      return (data.attempts || []).filter((a: any) => a.userId === userId && (!quizId || a.quizId === quizId));
    }
  }

  // --- Financials ---

  async initiatePayment(userId: string, planId: string, amount: number): Promise<Invoice> {
    const invoice: Invoice = {
      id: `inv_${Date.now()}`,
      userId,
      amount,
      status: 'PENDING',
      date: new Date().toISOString(),
      trackId: `TRK_${Math.random().toString(36).substr(2, 9).toUpperCase()}`,
      planId
    };

    if (this.useCloud) {
      await setDoc(doc(db, "invoices", invoice.id), invoice);
    } else {
      const data = this.getLocalData();
      if (!data.invoices) data.invoices = [];
      data.invoices.push(invoice);
      this.saveLocalData(data);
    }
    return invoice;
  }

  async completePayment(trackId: string, result: 'SUCCESS' | 'FAIL'): Promise<Invoice | null> {
    if (this.useCloud) {
      const q = query(collection(db, "invoices"), where("trackId", "==", trackId));
      const snap = await getDocs(q);
      if (snap.empty) return null;
      
      const invDoc = snap.docs[0];
      const invoice = invDoc.data() as Invoice;
      
      const updates: any = {
        status: result === 'SUCCESS' ? 'PAID' : 'FAILED',
        paymentId: `PAY_${Date.now()}`,
        authCode: `AUTH_${Math.floor(Math.random() * 1000000)}`
      };
      
      await updateDoc(doc(db, "invoices", invDoc.id), updates);

      if (result === 'SUCCESS') {
        // تحديث حالة المستخدم
        const userRef = doc(db, "users", invoice.userId);
        await updateDoc(userRef, {
            subscription: invoice.planId === 'p2' ? 'university' : 'premium',
            subscriptionExpiry: new Date(Date.now() + 30*24*60*60*1000).toISOString()
        });
      }
      return { ...invoice, ...updates };

    } else {
      const data = this.getLocalData();
      const invoice = data.invoices.find((i: Invoice) => i.trackId === trackId);
      if (!invoice) return null;
      
      invoice.status = result === 'SUCCESS' ? 'PAID' : 'FAILED';
      invoice.paymentId = `PAY_${Date.now()}`;
      invoice.authCode = `AUTH_${Math.floor(Math.random() * 1000000)}`;
      
      if (result === 'SUCCESS') {
        const user = data.users[invoice.userId];
        if (user) {
            user.subscription = invoice.planId === 'p2' ? 'university' : 'premium';
        }
      }
      this.saveLocalData(data);
      return invoice;
    }
  }

  async getUserLatestPaidInvoice(userId: string): Promise<Invoice | null> {
    if (this.useCloud) {
        const q = query(collection(db, "invoices"), where("userId", "==", userId), where("status", "==", "PAID"), orderBy("date", "desc"), limit(1));
        const snap = await getDocs(q);
        return snap.empty ? null : snap.docs[0].data() as Invoice;
    } else {
        const data = this.getLocalData();
        return (data.invoices || []).filter((i: Invoice) => i.userId === userId && i.status === 'PAID').pop() || null;
    }
  }

  // --- Real Time Analytics (Simplified) ---
  async getRealTimeAnalytics() {
    const students = await this.getAllStudents();
    let invoices: Invoice[] = [];
    
    if (this.useCloud) {
        const invSnap = await getDocs(query(collection(db, "invoices"), where("status", "==", "PAID")));
        invoices = invSnap.docs.map((d: any) => d.data() as Invoice);
    } else {
        invoices = (this.getLocalData().invoices || []).filter((i:any) => i.status === 'PAID');
    }

    const activeNow = Math.floor(students.length * 0.4) + 1; // Mock calculation for now
    const totalRevenue = invoices.reduce((acc, curr) => acc + curr.amount, 0);
    const avgStudyHours = "12.5"; // Mock

    return {
        activeNow,
        totalStudents: students.length,
        avgCompletion: 45,
        avgStudyHours,
        engagementDistribution: [5, 15, 40, 40],
        totalRevenue
    };
  }

  // --- Teachers & Resources (Generic Implementation) ---
  
  async getTeachers(): Promise<TeacherProfile[]> {
    if (this.useCloud) {
        const snap = await getDocs(collection(db, "teachers"));
        return snap.docs.map((d: any) => d.data() as TeacherProfile);
    }
    return this.getLocalData().teachers || [];
  }

  async saveTeacher(teacher: TeacherProfile) {
    if (this.useCloud) {
        await setDoc(doc(db, "teachers", teacher.id), teacher);
    } else {
        const data = this.getLocalData();
        if (!data.teachers) data.teachers = [];
        const idx = data.teachers.findIndex((t: any) => t.id === teacher.id);
        if (idx >= 0) data.teachers[idx] = teacher; else data.teachers.push(teacher);
        this.saveLocalData(data);
    }
  }

  async deleteTeacher(id: string) {
    if (this.useCloud) {
        await deleteDoc(doc(db, "teachers", id));
    } else {
        const data = this.getLocalData();
        data.teachers = (data.teachers || []).filter((t:any) => t.id !== id);
        this.saveLocalData(data);
    }
  }

  async getResources(): Promise<EducationalResource[]> {
    if (this.useCloud) {
        const snap = await getDocs(collection(db, "resources"));
        return snap.docs.map((d: any) => d.data() as EducationalResource);
    }
    return this.getLocalData().resources || [];
  }

  async saveResource(res: EducationalResource) {
    if (this.useCloud) {
        await setDoc(doc(db, "resources", res.id), res);
    } else {
        const data = this.getLocalData();
        if(!data.resources) data.resources = [];
        data.resources.push(res);
        this.saveLocalData(data);
    }
  }

  async deleteResource(id: string) {
      if(!this.useCloud) {
          const data = this.getLocalData();
          data.resources = (data.resources || []).filter((r:any) => r.id !== id);
          this.saveLocalData(data);
      }
  }

  // --- Forum Methods ---
  async getForumPosts(): Promise<ForumPost[]> {
    if (this.useCloud) {
        const snap = await getDocs(query(collection(db, "forum"), orderBy("timestamp", "desc")));
        return snap.docs.map(d => d.data() as ForumPost);
    }
    return (this.getLocalData().forum || []).sort((a: ForumPost, b: ForumPost) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
  }

  async createForumPost(post: Omit<ForumPost, 'id' | 'upvotes' | 'replies'>) {
    const newPost: ForumPost = {
      ...post,
      id: `post_${Date.now()}`,
      upvotes: 0,
      replies: []
    };
    if (this.useCloud) {
      await setDoc(doc(db, "forum", newPost.id), newPost);
    } else {
      const data = this.getLocalData();
      if (!data.forum) data.forum = [];
      data.forum.unshift(newPost);
      this.saveLocalData(data);
    }
  }

  async addForumReply(postId: string, reply: Omit<ForumReply, 'id' | 'upvotes'>) {
    const newReply: ForumReply = {
      ...reply,
      id: `rep_${Date.now()}`,
      upvotes: 0
    };
    if (this.useCloud) {
      // For brevity, using array update if possible or fetch-update-save
      // Ideally use arrayUnion
      const postRef = doc(db, "forum", postId);
      const postSnap = await getDoc(postRef);
      if (postSnap.exists()) {
          const post = postSnap.data() as ForumPost;
          const replies = [...(post.replies || []), newReply];
          await updateDoc(postRef, { replies });
      }
    } else {
      const data = this.getLocalData();
      const post = data.forum?.find((p: ForumPost) => p.id === postId);
      if (post) {
        if (!post.replies) post.replies = [];
        post.replies.push(newReply);
        this.saveLocalData(data);
      }
    }
  }

  async upvotePost(postId: string): Promise<void> {
    if (this.useCloud) {
        const postRef = doc(db, "forum", postId);
        const postSnap = await getDoc(postRef);
        if (postSnap.exists()) {
            await updateDoc(postRef, { upvotes: (postSnap.data().upvotes || 0) + 1 });
        }
    } else {
      const data = this.getLocalData();
      const post = data.forum?.find((p: ForumPost) => p.id === postId);
      if (post) {
        post.upvotes = (post.upvotes || 0) + 1;
        this.saveLocalData(data);
      }
    }
  }
  
  async upvoteReply(postId: string, replyId: string): Promise<void> {
    if (this.useCloud) { 
        // Logic for nested update omitted for brevity, would require read-modify-write
    } else {
      const data = this.getLocalData();
      const post = data.forum?.find((p: ForumPost) => p.id === postId);
      if (post && post.replies) {
        const reply = post.replies.find(r => r.id === replyId);
        if (reply) {
          reply.upvotes = (reply.upvotes || 0) + 1;
          this.saveLocalData(data);
        }
      }
    }
  }

  // --- Reviews Methods ---
  async getTeacherReviews(teacherId: string): Promise<Review[]> {
    if (this.useCloud) {
        try {
            const q = query(collection(db, "reviews"), where("teacherId", "==", teacherId), orderBy("timestamp", "desc"));
            const snap = await getDocs(q);
            return snap.docs.map(d => d.data() as Review);
        } catch (e) {
            console.error("Error fetching reviews:", e);
            return [];
        }
    } else {
        const data = this.getLocalData();
        return (data.reviews || []).filter((r: Review) => r.teacherId === teacherId).sort((a: Review, b: Review) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
    }
  }

  async addReview(review: Review) {
    if (this.useCloud) {
        await setDoc(doc(db, "reviews", review.id), review);
    } else {
        const data = this.getLocalData();
        if (!data.reviews) data.reviews = [];
        data.reviews.push(review);
        this.saveLocalData(data);
    }
  }

  // --- Other Methods (Stubs for full compatibility) ---
  async getInvoices() { 
      if (this.useCloud) {
          const snap = await getDocs(collection(db, "invoices"));
          return { data: snap.docs.map((d: any) => d.data()) };
      }
      return { data: this.getLocalData().invoices || [] }; 
  }
  async getFinancialStats() { return { totalRevenue: 0, pendingAmount: 0, totalInvoices: 0 }; } 
  async getBetaConfig() { return { isActive: true, invitationCode: "SSC-BETA-2024", studentLimit: 100 }; }
  async getPWAStats() { return { dau_count: 50, offline_minutes: 320 }; }
  async getCompletionRate() { return 72; }
  async getIntroVideo() { return ""; }
  async saveIntroVideo(url: string) { }
  async getAllQuestions() { 
      if(this.useCloud) {
          const snap = await getDocs(collection(db, "questions"));
          return snap.docs.map(d => d.data());
      }
      return this.getLocalData().questions || []; 
  }
  async saveQuestion(q: any) { 
      if(this.useCloud) await setDoc(doc(db, "questions", q.id), q);
      else {
          const data = this.getLocalData();
          if(!data.questions) data.questions = [];
          data.questions.push(q);
          this.saveLocalData(data);
      }
  }
  async updateInvoiceStatus(id: string, s: any) { }
  async getLessonNote(u: string, l: string) { return ""; }
  async saveLessonNote(u: string, l: string, n: string) { }
  async getStudentProgressForParent(uid: string) { return { user: null, report: null as any }; }
  async getNotifications(uid: string) { return []; }
  async addNotification(uid: string, n: any) { }
  async saveTeacherMessage(m: TeacherMessage) { 
      if(this.useCloud) await setDoc(doc(db, "teacher_messages", m.id), m);
      else {
          const data = this.getLocalData();
          if(!data.teacher_messages) data.teacher_messages = [];
          data.teacher_messages.push(m);
          this.saveLocalData(data);
      }
  }
  async getAllTeacherMessages(tid?: string) { 
      if(this.useCloud) {
          const q = query(collection(db, "teacher_messages"), where("teacherId", "==", tid));
          const snap = await getDocs(q);
          return snap.docs.map(d => d.data() as TeacherMessage);
      }
      return (this.getLocalData().teacher_messages || []).filter((m: any) => m.teacherId === tid);
  }
}

export const dbService = SyrianScienceCenterDB.getInstance();

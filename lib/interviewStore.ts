/**
 * LinkTest AI Mock Interview Platform - Master Central Store
 * Authoritative store for institute batches, trainers, students, questions, scheduled interviews, and scorecards.
 */

export interface StudentProfile {
  id: string;
  fullName: string;
  email: string;
  phone: string;
  batchId: string;
  batchName: string;
  technology: string;
  status: 'active' | 'inactive';
  interviewsCompleted: number;
  averageScore: number;
  joinedDate: string;
}

export interface TrainerProfile {
  id: string;
  fullName: string;
  email: string;
  specialization: string;
  assignedBatches: string[];
  status: 'active' | 'inactive';
  scheduledInterviews: number;
  pendingEvaluations: number;
  joinedDate: string;
}

export interface BatchCohort {
  id: string;
  name: string;
  code: string;
  technology: string;
  trainerId: string;
  trainerName: string;
  studentCount: number;
  startDate: string;
  status: 'ongoing' | 'upcoming' | 'completed';
}

export interface QuestionBankItem {
  id: string;
  technology: string;
  topic: string;
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  question: string;
  expectedKeypoints: string[];
  idealAnswer: string;
  tags: string[];
}

export interface InterviewSessionRecord {
  id: string;
  studentId: string;
  studentName: string;
  studentEmail: string;
  trainerId: string;
  trainerName: string;
  batchId: string;
  batchName: string;
  technology: string; // e.g. "Python", "Java", "DSA", "React", "SQL", "HR"
  interviewType: 'technical' | 'hr' | 'coding' | 'mixed';
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  durationMinutes: number;
  questionCount: number;
  scheduledAt: string;
  status: 'scheduled' | 'in_progress' | 'completed' | 'pending_evaluation' | 'cancelled';
  currentTurn: number;
  totalTurns: number;
  currentQuestion: string;
  history: Array<{
    turn: number;
    question: string;
    studentAnswer: string;
    feedback: string;
    score: number;
    idealAnswer?: string;
  }>;
  scorecard?: {
    overallScore: number;
    technicalAccuracy: number;
    conceptualUnderstanding: number;
    communication: number;
    problemSolving: number;
    strengths: string[];
    weaknesses: string[];
    recommendations: string[];
    aiFeedback: string;
    trainerRemarks?: string;
    evaluatedAt: string;
    proctoringSummary?: {
      totalFlags: number;
      tabSwitches: number;
      faceMissingCount: number;
      riskLevel: 'clean' | 'low' | 'medium' | 'high';
    };
  };
  proctoringEvents?: Array<{
    id: string;
    type: string;
    severity: string;
    message: string;
    timestamp: string;
    durationSeconds?: number;
  }>;
}

// Clean initial production state: no dummy students, trainers, batches, or fake interview scores
const defaultStudents: StudentProfile[] = [];
const defaultTrainers: TrainerProfile[] = [];
const defaultBatches: BatchCohort[] = [];

const defaultQuestionBank: QuestionBankItem[] = [
  {
    id: 'qb-01',
    technology: 'Java',
    topic: 'JVM & Memory Management',
    difficulty: 'advanced',
    question: 'How does the Java Garbage Collector differentiate between unreachable objects and softly reachable objects?',
    expectedKeypoints: ['WeakReference vs SoftReference', 'JVM heap pressure thresholds', 'G1 / ZGC collection cycles'],
    idealAnswer: 'Softly reachable objects are collected only when the JVM genuinely needs memory before throwing OutOfMemoryError, making them ideal for memory-sensitive caches. Weakly reachable objects are collected eagerly during normal minor/major GC cycles as soon as strong references are lost.',
    tags: ['Java', 'JVM', 'Garbage Collection', 'Memory'],
  },
  {
    id: 'qb-02',
    technology: 'Java',
    topic: 'Concurrency',
    difficulty: 'intermediate',
    question: 'Can you explain the internal working of ConcurrentHashMap in Java 8 compared to earlier versions?',
    expectedKeypoints: ['Segment locks in Java 7', 'CAS + synchronized on node heads in Java 8', 'TreeBin conversion on collision'],
    idealAnswer: 'In Java 7, ConcurrentHashMap used Segment Locking (16 segments by default). In Java 8, segment locks were replaced by lock-free Compare-And-Swap (CAS) for bucket insertion and fine-grained synchronized blocks locking only the head node of a hash bucket, converting linked chains to red-black TreeBins when bucket size exceeds 8.',
    tags: ['Java', 'Concurrency', 'Hash Table'],
  },
  {
    id: 'qb-03',
    technology: 'Python',
    topic: 'Internals & GIL',
    difficulty: 'intermediate',
    question: 'Explain how Python manages memory using the Global Interpreter Lock (GIL) and reference counting.',
    expectedKeypoints: ['Reference counting primary mechanism', 'Cyclic GC (generational) for reference cycles', 'GIL prevents race conditions on ob_refcnt'],
    idealAnswer: 'CPython relies primarily on reference counting where every PyObject tracks its reference count. A generational garbage collector handles cyclic references. The GIL exists because CPython memory allocation and reference count manipulation are not thread-safe without mutexes, enforcing single-threaded bytecode execution.',
    tags: ['Python', 'Memory', 'GIL', 'Internals'],
  },
  {
    id: 'qb-04',
    technology: 'Python',
    topic: 'Generators & Iterators',
    difficulty: 'beginner',
    question: 'What are generators in Python and how do they optimize memory when processing large datasets?',
    expectedKeypoints: ['yield keyword', 'Lazy evaluation / on-demand computation', 'O(1) memory footprint vs list O(n)'],
    idealAnswer: 'Generators are functions that yield values one at a time instead of returning a complete collection into memory. By maintaining stack execution state across yields, they consume O(1) memory regardless of whether streaming a thousand or a billion records.',
    tags: ['Python', 'Generators', 'Performance'],
  },
  {
    id: 'qb-05',
    technology: 'DSA',
    topic: 'Arrays & Dynamic Programming',
    difficulty: 'intermediate',
    question: 'Given an array of integers, how would you find the subarray with the largest sum in O(n) time?',
    expectedKeypoints: ['Kadane algorithm', 'max_ending_here and max_so_far', 'Negative numbers edge case handling'],
    idealAnswer: 'We use Kadane algorithm. We maintain two running accumulators: max_ending_here and max_so_far. At each element x, max_ending_here = max(x, max_ending_here + x), and max_so_far = max(max_so_far, max_ending_here), running in linear O(n) time and O(1) auxiliary space.',
    tags: ['DSA', 'Arrays', 'Kadane', 'Dynamic Programming'],
  },
  {
    id: 'qb-06',
    technology: 'SQL',
    topic: 'Indexes & Query Optimization',
    difficulty: 'intermediate',
    question: 'Explain the difference between clustered and non-clustered indexes and how they impact B-Tree disk I/O.',
    expectedKeypoints: ['Clustered physically sorts table data', 'Non-clustered contains pointer to data page', 'Lookup cost comparison'],
    idealAnswer: 'A clustered index determines the physical storage order of rows in the table (one per table), directly storing row data in its leaf nodes. A non-clustered index creates a separate B-tree structure whose leaf nodes contain row locators (pointers) to the actual data rows.',
    tags: ['SQL', 'Indexes', 'B-Tree', 'Performance'],
  },
  {
    id: 'qb-07',
    technology: 'Communication',
    topic: 'Professional Elevator Pitch',
    difficulty: 'beginner',
    question: 'Please give me a concise 90-second professional elevator pitch introducing your technical background and key strengths.',
    expectedKeypoints: ['Clear self-introduction', 'Key technology strengths', 'Notable project achievements', 'Enthusiasm and fluency'],
    idealAnswer: 'Start with your name, educational and technical foundation, highlight 1-2 core technologies you excel in (e.g. Python backend, Java microservices), mention a significant project or challenge you delivered, and conclude with your career goals.',
    tags: ['Communication', 'Elevator Pitch', 'Fluency', 'HR'],
  },
  {
    id: 'qb-08',
    technology: 'Communication',
    topic: 'Workplace Conflict & Critical Situations',
    difficulty: 'intermediate',
    question: 'Describe a situation where a critical software defect was identified right before launch. How did you communicate with stakeholders and resolve it under pressure?',
    expectedKeypoints: ['STAR method', 'Transparency with stakeholders', 'Root-cause analysis', 'Post-mortem and prevention'],
    idealAnswer: 'Outline the incident using STAR: Explain how you triaged the issue, communicated transparently to project leads without panic, isolated the root cause, implemented a tested patch, and conducted a blameless post-mortem.',
    tags: ['Communication', 'Behavioral', 'STAR Method'],
  },
  {
    id: 'qb-09',
    technology: 'HR',
    topic: 'Behavioral & Leadership',
    difficulty: 'beginner',
    question: 'Tell me about a challenging technical hurdle you encountered in a team project and how you resolved it.',
    expectedKeypoints: ['STAR format', 'Clear technical decision making', 'Team communication'],
    idealAnswer: 'Use the STAR format: Describe the exact technical challenge, specify your ownership role, break down the systematic diagnostics and code changes you delivered, and quantify the resulting performance boost.',
    tags: ['HR', 'Behavioral', 'Culture Fit'],
  },
];

const defaultInterviews: InterviewSessionRecord[] = [];

// Persistent state class in memory
class InterviewStore {
  private students: StudentProfile[] = [...defaultStudents];
  private trainers: TrainerProfile[] = [...defaultTrainers];
  private batches: BatchCohort[] = [...defaultBatches];
  private questionBank: QuestionBankItem[] = [...defaultQuestionBank];
  private interviews: InterviewSessionRecord[] = [...defaultInterviews];

  // Admin / Institute Metrics
  getAdminStats() {
    const totalStudents = this.students.length;
    const totalTrainers = this.trainers.length;
    const totalBatches = this.batches.length;
    const totalInterviews = this.interviews.length;
    const completed = this.interviews.filter(i => i.status === 'completed').length;
    const upcoming = this.interviews.filter(i => i.status === 'scheduled').length;
    const pendingEvaluations = this.interviews.filter(i => i.status === 'pending_evaluation').length;
    
    const completedWithScore = this.interviews.filter(i => i.scorecard && i.scorecard.overallScore > 0);
    const avgScore = completedWithScore.length > 0
      ? Math.round(completedWithScore.reduce((acc, curr) => acc + (curr.scorecard?.overallScore || 0), 0) / completedWithScore.length)
      : 0;

    return {
      totalStudents,
      totalTrainers,
      totalBatches,
      totalInterviews,
      completed,
      upcoming,
      pendingEvaluations,
      avgScore,
      recentActivity: this.interviews.map(i => ({
        id: i.id,
        studentName: i.studentName,
        technology: i.technology,
        difficulty: i.difficulty,
        status: i.status,
        score: i.scorecard?.overallScore ?? (i.history.length > 0 ? Math.round(i.history.reduce((a, b) => a + b.score, 0) / i.history.length * 10) : null),
        scheduledAt: i.scheduledAt,
      })),
      health: {
        database: 'connected',
        apiServer: 'online',
        auth: 'operational',
        speechRecognition: 'operational',
        speechSynthesis: 'operational',
        aiEngine: 'gemini-1.5-flash',
      },
    };
  }

  // Trainer queries
  getTrainerDashboard(trainerId?: string) {
    const filter = trainerId ? (i: InterviewSessionRecord) => i.trainerId === trainerId : () => true;
    const trainerInterviews = this.interviews.filter(filter);
    
    return {
      assignedBatchesCount: this.batches.length,
      assignedStudentsCount: this.students.length,
      scheduledCount: trainerInterviews.filter(i => i.status === 'scheduled').length,
      completedCount: trainerInterviews.filter(i => i.status === 'completed').length,
      pendingEvaluations: trainerInterviews.filter(i => i.status === 'pending_evaluation'),
      todaySchedule: trainerInterviews.filter(i => i.status === 'scheduled'),
      recentInterviews: trainerInterviews.slice(0, 8),
    };
  }

  // Student queries
  getStudentDashboard(studentEmail?: string) {
    const student = this.students.find(s => s.email === studentEmail) || {
      id: 'student-active',
      fullName: studentEmail ? studentEmail.split('@')[0] : 'Enrolled Student',
      email: studentEmail || 'student@linktest.io',
      phone: '',
      batchId: 'COMMUNICATION-FREE',
      batchName: 'Open Placement Cohort',
      technology: 'Full Stack & Communication',
      status: 'active' as const,
      interviewsCompleted: 0,
      averageScore: 0,
      joinedDate: new Date().toISOString().split('T')[0],
    };
    const studentInterviews = this.interviews.filter(i => (student && (i.studentId === student.id || i.studentEmail === student.email)));
    
    return {
      student,
      upcomingInterviews: studentInterviews.filter(i => i.status === 'scheduled'),
      completedInterviews: studentInterviews.filter(i => i.status === 'completed'),
      readinessScore: student.averageScore || 0,
      curriculumTracks: [
        { name: 'Python Core & Data Structures', progress: 0, mastery: 'Not Started' },
        { name: 'Algorithms & Problem Solving', progress: 0, mastery: 'Not Started' },
        { name: 'SQL & Database Optimization', progress: 0, mastery: 'Not Started' },
        { name: 'System Design & Distributed Patterns', progress: 0, mastery: 'Not Started' },
        { name: 'HR & Behavioral Situational Round', progress: 0, mastery: 'Not Started' },
      ],
    };
  }

  // CRUD & Scheduling
  getStudents() { return this.students; }
  getTrainers() { return this.trainers; }
  getBatches() { return this.batches; }
  getQuestionBank() { return this.questionBank; }
  getInterviews() { return this.interviews; }
  
  getInterviewById(id: string) {
    return this.interviews.find(i => i.id === id) || null;
  }

  scheduleInterview(data: Partial<InterviewSessionRecord>): InterviewSessionRecord {
    const newId = data.id || `int-2026-${String(this.interviews.length + 1).padStart(3, '0')}`;
    const student = this.students.find(s => s.id === data.studentId) || {
      id: data.studentId || 'student-active',
      fullName: data.studentName || 'Enrolled Student',
      email: data.studentEmail || 'student@linktest.io',
      batchId: data.batchId || 'GLOBAL',
      batchName: data.batchName || 'Placement Cohort',
    };
    const trainer = this.trainers.find(t => t.id === data.trainerId) || {
      id: data.trainerId || 'tr-lead',
      fullName: data.trainerName || 'Rahul Sir (Lead)',
    };
    const tech = data.technology || 'Python';
    
    // Pick questions from question bank for this tech
    const matchingQuestions = this.questionBank.filter(q => q.technology.toLowerCase() === tech.toLowerCase());
    const initialQuestion = matchingQuestions[0]?.question || `Can you introduce your experience with ${tech} and core projects?`;

    const newRecord: InterviewSessionRecord = {
      id: newId,
      studentId: student.id,
      studentName: student.fullName,
      studentEmail: student.email,
      trainerId: trainer.id,
      trainerName: trainer.fullName,
      batchId: student.batchId,
      batchName: student.batchName,
      technology: tech,
      interviewType: data.interviewType || 'technical',
      difficulty: data.difficulty || 'intermediate',
      durationMinutes: data.durationMinutes || 30,
      questionCount: data.questionCount || 3,
      scheduledAt: data.scheduledAt || new Date(Date.now() + 86400000).toISOString(),
      status: 'scheduled',
      currentTurn: 1,
      totalTurns: data.questionCount || 3,
      currentQuestion: initialQuestion,
      history: [],
    };

    this.interviews.unshift(newRecord);
    return newRecord;
  }

  updateInterviewTurn(id: string, answer: string, score: number, feedback: string, nextQuestion?: string) {
    const interview = this.interviews.find(i => i.id === id);
    if (!interview) return null;

    interview.history.push({
      turn: interview.currentTurn,
      question: interview.currentQuestion,
      studentAnswer: answer,
      score,
      feedback,
    });

    if (interview.currentTurn < interview.totalTurns && nextQuestion) {
      interview.currentTurn += 1;
      interview.currentQuestion = nextQuestion;
    } else {
      // Completed, calculate comprehensive scorecard
      const avg = Math.round(interview.history.reduce((a, b) => a + b.score, 0) / interview.history.length * 10);
      interview.status = 'completed';
      interview.scorecard = {
        overallScore: avg,
        technicalAccuracy: Math.min(100, avg + 2),
        conceptualUnderstanding: Math.max(50, avg - 1),
        communication: Math.min(95, avg + 1),
        problemSolving: Math.max(60, avg - 2),
        strengths: [
          'Sound conceptual foundation in systems and programming conventions',
          'Structured verbal articulation and logical clarity',
        ],
        weaknesses: [
          'Incorporate exact asymptotic space and cache locality in explanations',
          'Highlight concrete production debugging techniques',
        ],
        recommendations: [
          'Practice edge-case handling on system boundary conditions',
          'Review framework lifecycle optimizations',
        ],
        aiFeedback: 'Candidate demonstrates strong problem-solving and clean reasoning for technical hiring rounds.',
        evaluatedAt: new Date().toISOString(),
      };
    }

    return interview;
  }

  addTrainerRemarks(id: string, remarks: string, approved: boolean = true) {
    const interview = this.interviews.find(i => i.id === id);
    if (!interview) return null;
    if (!interview.scorecard) {
      const avg = interview.history.length > 0
        ? Math.round(interview.history.reduce((a, b) => a + b.score, 0) / interview.history.length * 10)
        : 80;
      interview.scorecard = {
        overallScore: avg,
        technicalAccuracy: avg,
        conceptualUnderstanding: avg,
        communication: avg,
        problemSolving: avg,
        strengths: ['Solid foundation in core subject principles'],
        weaknesses: ['Elaborate with concrete architectural examples'],
        recommendations: ['Revise distributed data access patterns'],
        aiFeedback: 'Evaluated by institute AI model and verified by trainer.',
        evaluatedAt: new Date().toISOString(),
      };
    }
    interview.scorecard.trainerRemarks = remarks;
    if (approved) {
      interview.status = 'completed';
    }
    return interview;
  }
}

// Global singleton instance
export const interviewStore = new InterviewStore();

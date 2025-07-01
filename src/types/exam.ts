export interface User {
  id: string;
  email: string;
  name: string;
  role: "student" | "instructor" | "admin";
  profileImage?: string;
}

export interface Question {
  id: string;
  text: string;
  options: string[];
  correctAnswer: number;
  explanation?: string;
  difficulty: "easy" | "medium" | "hard";
  category: string;
}

export interface Exam {
  id: string;
  title: string;
  description: string;
  duration: number; // in minutes
  questions: Question[];
  totalMarks: number;
  passingMarks: number;
  isActive: boolean;
  createdBy: string;
  createdAt: Date;
  category: string;
}

export interface ExamAttempt {
  id: string;
  examId: string;
  userId: string;
  answers: Record<string, number>; // questionId -> selectedOption
  score: number;
  percentage: number;
  startTime: Date;
  endTime?: Date;
  timeSpent: number; // in seconds
  status: "in-progress" | "completed" | "abandoned";
}

export interface ExamResult {
  id: string;
  examId: string;
  userId: string;
  score: number;
  totalQuestions: number;
  correctAnswers: number;
  percentage: number;
  grade: string;
  passed: boolean;
  timeSpent: number;
  completedAt: Date;
  answers: {
    questionId: string;
    selectedAnswer: number;
    correctAnswer: number;
    isCorrect: boolean;
  }[];
}

export interface AuthState {
  isAuthenticated: boolean;
  user: User | null;
  loading: boolean;
}

export interface ExamState {
  currentExam: Exam | null;
  currentAttempt: ExamAttempt | null;
  timeRemaining: number;
  currentQuestion: number;
  answers: Record<string, number>;
}

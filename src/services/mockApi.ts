import { ApiResponse } from "./api";

// Mock data
const mockUsers = [
  {
    id: "1",
    name: "Admin User",
    email: "admin@ranexam.com",
    role: "admin",
    department: "Administration",
    isActive: true,
    isEmailVerified: true,
  },
  {
    id: "2",
    name: "John Instructor",
    email: "instructor@test.com",
    role: "instructor",
    department: "Computer Science",
    isActive: true,
    isEmailVerified: true,
  },
  {
    id: "3",
    name: "Jane Student",
    email: "student@test.com",
    role: "student",
    department: "Computer Science",
    isActive: true,
    isEmailVerified: true,
  },
];

const mockExams = [
  {
    _id: "1",
    title: "JavaScript Fundamentals",
    description:
      "Test your knowledge of JavaScript basics including variables, functions, and data types",
    category: "Programming",
    difficulty: "beginner",
    timeLimit: 30,
    passingScore: 70,
    totalQuestions: 20,
    isActive: true,
    createdAt: "2024-01-15T10:00:00Z",
    createdBy: { name: "John Instructor" },
  },
  {
    _id: "2",
    title: "React Components",
    description:
      "Advanced React concepts including hooks, context, and component lifecycle",
    category: "Frontend",
    difficulty: "intermediate",
    timeLimit: 45,
    passingScore: 75,
    totalQuestions: 25,
    isActive: true,
    createdAt: "2024-01-20T14:30:00Z",
    createdBy: { name: "John Instructor" },
  },
  {
    _id: "3",
    title: "Database Design",
    description:
      "SQL fundamentals, database normalization, and query optimization",
    category: "Database",
    difficulty: "intermediate",
    timeLimit: 60,
    passingScore: 80,
    totalQuestions: 30,
    isActive: true,
    createdAt: "2024-02-01T09:15:00Z",
    createdBy: { name: "John Instructor" },
  },
  {
    _id: "4",
    title: "Advanced JavaScript",
    description: "Closures, promises, async/await, and advanced JS patterns",
    category: "Programming",
    difficulty: "advanced",
    timeLimit: 90,
    passingScore: 85,
    totalQuestions: 35,
    isActive: true,
    createdAt: "2024-02-10T11:00:00Z",
    createdBy: { name: "John Instructor" },
  },
  {
    _id: "5",
    title: "Machine Learning Basics",
    description:
      "Introduction to ML algorithms, data preprocessing, and model evaluation",
    category: "AI/ML",
    difficulty: "expert",
    timeLimit: 120,
    passingScore: 80,
    totalQuestions: 40,
    isActive: true,
    createdAt: "2024-02-15T13:45:00Z",
    createdBy: { name: "John Instructor" },
  },
  {
    _id: "6",
    title: "Web Security",
    description:
      "OWASP top 10, XSS, CSRF, and other common web vulnerabilities",
    category: "Security",
    difficulty: "advanced",
    timeLimit: 75,
    passingScore: 85,
    totalQuestions: 28,
    isActive: true,
    createdAt: "2024-02-20T16:20:00Z",
    createdBy: { name: "John Instructor" },
  },
];

const mockResults = [
  {
    _id: "1",
    exam: {
      title: "JavaScript Fundamentals",
      category: "Programming",
    },
    score: 17,
    totalQuestions: 20,
    percentage: 85,
    passed: true,
    completedAt: "2024-02-25T10:30:00Z",
  },
  {
    _id: "2",
    exam: {
      title: "React Components",
      category: "Frontend",
    },
    score: 20,
    totalQuestions: 25,
    percentage: 80,
    passed: true,
    completedAt: "2024-02-22T14:15:00Z",
  },
  {
    _id: "3",
    exam: {
      title: "Database Design",
      category: "Database",
    },
    score: 22,
    totalQuestions: 30,
    percentage: 73,
    passed: false,
    completedAt: "2024-02-20T09:45:00Z",
  },
];

// Mock token for authentication
const MOCK_TOKEN = "mock-jwt-token-12345";
let currentUser: any = null;

const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

export const mockAuthAPI = {
  login: async (data: {
    email: string;
    password: string;
    rememberMe?: boolean;
  }): Promise<ApiResponse<any>> => {
    await delay(800); // Simulate network delay

    const user = mockUsers.find((u) => u.email === data.email);

    if (!user || data.password !== "password") {
      return {
        success: false,
        message: "Invalid email or password",
      };
    }

    currentUser = user;

    return {
      success: true,
      message: "Login successful",
      token: MOCK_TOKEN,
      user,
    };
  },

  register: async (data: {
    name: string;
    email: string;
    password: string;
    role: string;
    department?: string;
    phoneNumber?: string;
  }): Promise<ApiResponse<any>> => {
    await delay(1000);

    // Check if user already exists
    if (mockUsers.find((u) => u.email === data.email)) {
      return {
        success: false,
        message: "User already exists with this email",
      };
    }

    const newUser = {
      id: Date.now().toString(),
      name: data.name,
      email: data.email,
      role: data.role,
      department: data.department || "",
      isActive: true,
      isEmailVerified: false,
    };

    mockUsers.push(newUser);
    currentUser = newUser;

    return {
      success: true,
      message:
        "Registration successful! Please check your email for verification.",
      token: MOCK_TOKEN,
      user: newUser,
    };
  },

  getProfile: async (): Promise<ApiResponse<any>> => {
    await delay(300);

    if (!currentUser) {
      return {
        success: false,
        message: "Not authenticated",
      };
    }

    return {
      success: true,
      user: currentUser,
    };
  },

  logout: async (): Promise<ApiResponse<any>> => {
    await delay(200);
    currentUser = null;

    return {
      success: true,
      message: "Logged out successfully",
    };
  },
};

export const mockExamsAPI = {
  getExams: async (params?: any): Promise<ApiResponse<any>> => {
    await delay(500);

    let filteredExams = [...mockExams];

    if (params?.search) {
      const searchLower = params.search.toLowerCase();
      filteredExams = filteredExams.filter(
        (exam) =>
          exam.title.toLowerCase().includes(searchLower) ||
          exam.description.toLowerCase().includes(searchLower) ||
          exam.category.toLowerCase().includes(searchLower),
      );
    }

    if (params?.category && params.category !== "all") {
      filteredExams = filteredExams.filter(
        (exam) => exam.category === params.category,
      );
    }

    if (params?.difficulty && params.difficulty !== "all") {
      filteredExams = filteredExams.filter(
        (exam) => exam.difficulty === params.difficulty,
      );
    }

    if (params?.isActive !== undefined) {
      filteredExams = filteredExams.filter(
        (exam) => exam.isActive === params.isActive,
      );
    }

    const limit = params?.limit || 10;
    const page = params?.page || 1;
    const startIndex = (page - 1) * limit;
    const endIndex = startIndex + limit;

    const paginatedExams = filteredExams.slice(startIndex, endIndex);

    return {
      success: true,
      data: {
        exams: paginatedExams,
        totalExams: filteredExams.length,
        currentPage: page,
        totalPages: Math.ceil(filteredExams.length / limit),
      },
    };
  },

  getExam: async (examId: string): Promise<ApiResponse<any>> => {
    await delay(300);

    const exam = mockExams.find((e) => e._id === examId);

    if (!exam) {
      return {
        success: false,
        message: "Exam not found",
      };
    }

    return {
      success: true,
      data: exam,
    };
  },
};

export const mockResultsAPI = {
  getUserResults: async (params?: any): Promise<ApiResponse<any>> => {
    await delay(400);

    if (!currentUser || currentUser.role !== "student") {
      return {
        success: true,
        data: { results: [] },
      };
    }

    const limit = params?.limit || 10;
    const page = params?.page || 1;
    const startIndex = (page - 1) * limit;
    const endIndex = startIndex + limit;

    const paginatedResults = mockResults.slice(startIndex, endIndex);

    return {
      success: true,
      data: {
        results: paginatedResults,
        totalResults: mockResults.length,
        currentPage: page,
        totalPages: Math.ceil(mockResults.length / limit),
      },
    };
  },
};

export const mockAdminAPI = {
  getDashboardStats: async (): Promise<ApiResponse<any>> => {
    await delay(600);

    return {
      success: true,
      data: {
        totalUsers: mockUsers.length,
        totalExams: mockExams.length,
        totalAttempts: mockResults.length,
        averageScore: Math.round(
          mockResults.reduce((acc, result) => acc + result.percentage, 0) /
            mockResults.length,
        ),
      },
    };
  },
};

// Flag to determine if we should use mock API
export const USE_MOCK_API = true; // Set to false when real backend is available

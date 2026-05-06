import axios, { AxiosResponse } from "axios";

// Create axios instance with base configuration
const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || "http://localhost:5000/api",
  headers: {
    "Content-Type": "application/json",
  },
  timeout: 10000,
});

// Request interceptor to add auth token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("token");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  },
);

// Response interceptor for error handling
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Token expired or invalid
      localStorage.removeItem("token");
      localStorage.removeItem("user");
      window.location.href = "/login";
    }
    return Promise.reject(error);
  },
);

// API Types
export interface ApiResponse<T> {
  success: boolean;
  message?: string;
  data?: T;
  token?: string;
  user?: any;
  errors?: any[];
}

export interface LoginRequest {
  email: string;
  password: string;
  rememberMe?: boolean;
}

export interface RegisterRequest {
  name: string;
  email: string;
  password: string;
  role: "student" | "instructor";
  department?: string;
  phoneNumber?: string;
}

export interface UpdateProfileRequest {
  name?: string;
  phoneNumber?: string;
  address?: string;
  emergencyContact?: string;
  dateOfBirth?: string;
  preferences?: {
    theme?: string;
    language?: string;
    emailNotifications?: boolean;
    examReminders?: boolean;
  };
}

export interface ChangePasswordRequest {
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
}

export interface CreateExamRequest {
  title: string;
  description?: string;
  category: string;
  duration: number;
  totalMarks: number;
  passingMarks: number;
  questions: string[];
  instructions?: string;
  isActive?: boolean;
  status?: "draft" | "published" | "archived" | "suspended";
  difficulty?: "beginner" | "intermediate" | "advanced" | "expert";
  tags?: string[];
  schedule?: {
    startDate?: Date | string;
    endDate?: Date | string;
  };
  settings?: {
    randomizeQuestions?: boolean;
    randomizeOptions?: boolean;
    allowReview?: boolean;
    showResults?: boolean;
    showCorrectAnswers?: boolean;
    maxAttempts?: number;
  };
}

export interface QuestionOptionInput {
  text: string;
  isCorrect: boolean;
  explanation?: string;
}

export interface CreateQuestionRequest {
  text: string;
  type: "multiple-choice" | "true-false" | "fill-blank" | "essay";
  options: QuestionOptionInput[];
  correctAnswer?: number;
  explanation?: string;
  difficulty: "easy" | "medium" | "hard";
  category: string;
  marks?: number;
  tags?: string[];
}

// Auth API
export const authAPI = {
  login: async (data: LoginRequest): Promise<ApiResponse<any>> => {
    // if (USE_MOCK_API) {
    //   return mockAuthAPI.login(data);
    // }
    const response: AxiosResponse<ApiResponse<any>> = await api.post(
      "/auth/login",
      data,
    );
    return response.data;
  },

  register: async (data: RegisterRequest): Promise<ApiResponse<any>> => {
    // if (USE_MOCK_API) {
    //   return mockAuthAPI.register(data);
    // }
    const response: AxiosResponse<ApiResponse<any>> = await api.post(
      "/auth/register",
      data,
    );
    console.log("Register response: ", response.data);
    return response.data;
  },

  getProfile: async (): Promise<ApiResponse<any>> => {
    // if (USE_MOCK_API) {
    //   return mockAuthAPI.getProfile();
    // }
    const response: AxiosResponse<ApiResponse<any>> = await api.get("/auth/me");
    return response.data;
  },

  updateProfile: async (
    data: UpdateProfileRequest,
  ): Promise<ApiResponse<any>> => {
    const response: AxiosResponse<ApiResponse<any>> = await api.put(
      "/auth/profile",
      data,
    );
    return response.data;
  },

  changePassword: async (
    data: ChangePasswordRequest,
  ): Promise<ApiResponse<any>> => {
    const response: AxiosResponse<ApiResponse<any>> = await api.put(
      "/auth/change-password",
      data,
    );
    return response.data;
  },

  forgotPassword: async (email: string): Promise<ApiResponse<any>> => {
    const response: AxiosResponse<ApiResponse<any>> = await api.post(
      "/auth/forgot-password",
      { email },
    );
    return response.data;
  },

  resetPassword: async (
    token: string,
    password: string,
  ): Promise<ApiResponse<any>> => {
    const response: AxiosResponse<ApiResponse<any>> = await api.put(
      `/auth/reset-password/${token}`,
      { password },
    );
    return response.data;
  },

  verifyEmail: async (token: string): Promise<ApiResponse<any>> => {
    const response: AxiosResponse<ApiResponse<any>> = await api.get(
      `/auth/verify-email/${token}`,
    );
    return response.data;
  },

  logout: async (): Promise<ApiResponse<any>> => {
    // if (USE_MOCK_API) {
    //   return mockAuthAPI.logout();
    // }
    const response: AxiosResponse<ApiResponse<any>> =
      await api.post("/auth/logout");
    return response.data;
  },
};

// Exams API
export const examsAPI = {
  getExams: async (params?: {
    page?: number;
    limit?: number;
    search?: string;
    category?: string;
    difficulty?: string;
    status?: string;
    isActive?: boolean;
  }): Promise<ApiResponse<any>> => {
    // if (USE_MOCK_API) {
    //   return mockExamsAPI.getExams(params);
    // }
    const response: AxiosResponse<ApiResponse<any>> = await api.get("/exams", {
      params,
    });
    return response.data;
  },

  getExam: async (examId: string): Promise<ApiResponse<any>> => {
    // if (USE_MOCK_API) {
    //   return mockExamsAPI.getExam(examId);
    // }
    const response: AxiosResponse<ApiResponse<any>> = await api.get(
      `/exams/${examId}`,
    );
    return response.data;
  },

  createExam: async (data: CreateExamRequest): Promise<ApiResponse<any>> => {
    const response: AxiosResponse<ApiResponse<any>> = await api.post(
      "/exams",
      data,
    );
    return response.data;
  },

  updateExam: async (
    examId: string,
    data: Partial<CreateExamRequest>,
  ): Promise<ApiResponse<any>> => {
    const response: AxiosResponse<ApiResponse<any>> = await api.put(
      `/exams/${examId}`,
      data,
    );
    return response.data;
  },

  deleteExam: async (examId: string): Promise<ApiResponse<any>> => {
    const response: AxiosResponse<ApiResponse<any>> = await api.delete(
      `/exams/${examId}`,
    );
    return response.data;
  },

  getExamStats: async (examId: string): Promise<ApiResponse<any>> => {
    const response: AxiosResponse<ApiResponse<any>> = await api.get(
      `/exams/${examId}/analytics`,
    );
    return response.data;
  },
};

// Questions API
export const questionsAPI = {
  getQuestions: async (params?: {
    examId?: string;
    page?: number;
    limit?: number;
    search?: string;
    category?: string;
    difficulty?: string;
  }): Promise<ApiResponse<any>> => {
    const response: AxiosResponse<ApiResponse<any>> = await api.get(
      "/questions",
      { params },
    );
    return response.data;
  },

  getQuestion: async (questionId: string): Promise<ApiResponse<any>> => {
    const response: AxiosResponse<ApiResponse<any>> = await api.get(
      `/questions/${questionId}`,
    );
    return response.data;
  },

  createQuestion: async (
    data: CreateQuestionRequest,
  ): Promise<ApiResponse<any>> => {
    const response: AxiosResponse<ApiResponse<any>> = await api.post(
      "/questions",
      data,
    );
    return response.data;
  },

  updateQuestion: async (
    questionId: string,
    data: Partial<CreateQuestionRequest>,
  ): Promise<ApiResponse<any>> => {
    const response: AxiosResponse<ApiResponse<any>> = await api.put(
      `/questions/${questionId}`,
      data,
    );
    return response.data;
  },

  deleteQuestion: async (questionId: string): Promise<ApiResponse<any>> => {
    const response: AxiosResponse<ApiResponse<any>> = await api.delete(
      `/questions/${questionId}`,
    );
    return response.data;
  },

  addQuestionToExam: async (
    examId: string,
    questionId: string,
  ): Promise<ApiResponse<any>> => {
    const response: AxiosResponse<ApiResponse<any>> = await api.post(
      `/exams/${examId}/questions/${questionId}`,
    );
    return response.data;
  },

  removeQuestionFromExam: async (
    examId: string,
    questionId: string,
  ): Promise<ApiResponse<any>> => {
    const response: AxiosResponse<ApiResponse<any>> = await api.delete(
      `/exams/${examId}/questions/${questionId}`,
    );
    return response.data;
  },
};

// Attempts API
export const attemptsAPI = {
  startAttempt: async (examId: string): Promise<ApiResponse<any>> => {
    const response: AxiosResponse<ApiResponse<any>> = await api.post(
      "/attempts/start",
      { examId },
    );
    return response.data;
  },

  getCurrentAttempt: async (examId: string): Promise<ApiResponse<any>> => {
    const response: AxiosResponse<ApiResponse<any>> = await api.get(
      `/attempts/current/${examId}`,
    );
    return response.data;
  },

  getAttempt: async (attemptId: string): Promise<ApiResponse<any>> => {
    const response: AxiosResponse<ApiResponse<any>> = await api.get(
      `/attempts/${attemptId}/result`,
    );
    return response.data;
  },

  saveAnswer: async (
    attemptId: string,
    questionId: string,
    answer: {
      selectedOption?: number;
      textAnswer?: string;
      timeSpent?: number;
    },
  ): Promise<ApiResponse<any>> => {
    const response: AxiosResponse<ApiResponse<any>> = await api.put(
      `/attempts/${attemptId}/answer`,
      {
        questionId,
        ...answer,
      },
    );
    return response.data;
  },

  submitAttempt: async (attemptId: string): Promise<ApiResponse<any>> => {
    const response: AxiosResponse<ApiResponse<any>> = await api.post(
      `/attempts/${attemptId}/submit`,
    );
    return response.data;
  },

  getUserAttempts: async (params?: {
    page?: number;
    limit?: number;
    examId?: string;
    status?: string;
  }): Promise<ApiResponse<any>> => {
    const response: AxiosResponse<ApiResponse<any>> = await api.get(
      "/attempts/my-attempts",
      { params },
    );
    return response.data;
  },

  getAttemptResult: async (attemptId: string): Promise<ApiResponse<any>> => {
    const response: AxiosResponse<ApiResponse<any>> = await api.get(
      `/attempts/${attemptId}/result`,
    );
    return response.data;
  },
};

// Results API
export const resultsAPI = {
  getResult: async (resultId: string): Promise<ApiResponse<any>> => {
    // if (USE_MOCK_API) {
    //   // Mock implementation for getting a single result
    //   return { success: true, data: null };
    // }
    const response: AxiosResponse<ApiResponse<any>> = await api.get(
      `/results/${resultId}`,
    );
    return response.data;
  },

  getUserResults: async (params?: {
    page?: number;
    limit?: number;
    examId?: string;
  }): Promise<ApiResponse<any>> => {
    // if (USE_MOCK_API) {
    //   return mockResultsAPI.getUserResults(params);
    // }
    const response: AxiosResponse<ApiResponse<any>> = await api.get(
      "/results",
      { params },
    );
    return response.data;
  },

  getExamResults: async (
    examId: string,
    params?: {
      page?: number;
      limit?: number;
    },
  ): Promise<ApiResponse<any>> => {
    const response: AxiosResponse<ApiResponse<any>> = await api.get(
      `/attempts/exam/${examId}`,
      { params },
    );
    return response.data;
  },
};

// Users API
export const usersAPI = {
  getUsers: async (params?: {
    page?: number;
    limit?: number;
    search?: string;
    role?: string;
    department?: string;
    isActive?: boolean;
  }): Promise<ApiResponse<any>> => {
    const response: AxiosResponse<ApiResponse<any>> = await api.get("/users", {
      params,
    });
    return response.data;
  },

  getUser: async (userId: string): Promise<ApiResponse<any>> => {
    const response: AxiosResponse<ApiResponse<any>> = await api.get(
      `/users/${userId}`,
    );
    return response.data;
  },

  updateUser: async (userId: string, data: any): Promise<ApiResponse<any>> => {
    const response: AxiosResponse<ApiResponse<any>> = await api.put(
      `/users/${userId}`,
      data,
    );
    return response.data;
  },

  createUser: async (data: {
    name: string;
    email: string;
    password: string;
    role: "student" | "instructor" | "admin";
    department?: string;
    phoneNumber?: string;
    address?: string;
    emergencyContact?: string;
    permissions?: string[];
    notes?: string;
  }): Promise<ApiResponse<any>> => {
    const response: AxiosResponse<ApiResponse<any>> = await api.post(
      "/users",
      data,
    );
    return response.data;
  },

  deleteUser: async (userId: string): Promise<ApiResponse<any>> => {
    const response: AxiosResponse<ApiResponse<any>> = await api.delete(
      `/users/${userId}`,
    );
    return response.data;
  },

  getUserStats: async (userId: string): Promise<ApiResponse<any>> => {
    const response: AxiosResponse<ApiResponse<any>> = await api.get(
      `/users/${userId}/stats`,
    );
    return response.data;
  },

  resetUserPassword: async (userId: string): Promise<ApiResponse<any>> => {
    const response: AxiosResponse<ApiResponse<any>> = await api.post(
      `/users/${userId}/reset-password`,
    );
    return response.data;
  },

  bulkUserAction: async (action: "activate" | "deactivate" | "delete", userIds: string[]): Promise<ApiResponse<any>> => {
    const response: AxiosResponse<ApiResponse<any>> = await api.post(
      "/users/bulk",
      { action, userIds },
    );
    return response.data;
  },
};

// Admin API
export const adminAPI = {
  getDashboardStats: async (): Promise<ApiResponse<any>> => {
    // if (USE_MOCK_API) {
    //   return mockAdminAPI.getDashboardStats();
    // }
    const response: AxiosResponse<ApiResponse<any>> =
      await api.get("/admin/dashboard");
    return response.data;
  },

  getSystemSettings: async (): Promise<ApiResponse<any>> => {
    const response: AxiosResponse<ApiResponse<any>> =
      await api.get("/admin/settings");
    return response.data;
  },

  updateSystemSettings: async (data: any): Promise<ApiResponse<any>> => {
    const response: AxiosResponse<ApiResponse<any>> = await api.put(
      "/admin/settings",
      data,
    );
    return response.data;
  },

  exportData: async (type: string, params?: any): Promise<any> => {
    const response = await api.get(`/admin/export/${type}`, {
      params,
      responseType: "blob",
    });
    return response.data;
  },
};

export default api;

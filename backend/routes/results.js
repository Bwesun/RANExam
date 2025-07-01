const express = require("express");
const { query, validationResult } = require("express-validator");
const ExamAttempt = require("../models/ExamAttempt");
const Exam = require("../models/Exam");
const User = require("../models/User");
const { protect, authorize } = require("../middleware/auth");
const router = express.Router();

// Apply protection to all routes
router.use(protect);

// @desc    Get exam results with filtering and pagination
// @route   GET /api/results
// @access  Private (Admin/Instructor)
router.get(
  "/",
  authorize("admin", "instructor"),
  [
    query("page")
      .optional()
      .isInt({ min: 1 })
      .withMessage("Page must be a positive integer"),
    query("limit")
      .optional()
      .isInt({ min: 1, max: 100 })
      .withMessage("Limit must be between 1 and 100"),
    query("examId").optional().isMongoId().withMessage("Invalid exam ID"),
    query("userId").optional().isMongoId().withMessage("Invalid user ID"),
    query("status")
      .optional()
      .isIn(["completed", "in-progress", "abandoned"])
      .withMessage("Invalid status"),
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          errors: errors.array(),
        });
      }

      const {
        page = 1,
        limit = 10,
        examId,
        userId,
        status = "completed",
        sortBy = "createdAt",
        sortOrder = "desc",
      } = req.query;

      // Build query
      const query = { status };

      if (examId) query.exam = examId;
      if (userId) query.user = userId;

      // For instructors, only show results for their exams
      if (req.user.role === "instructor") {
        const instructorExams = await Exam.find({
          createdBy: req.user.id,
        }).select("_id");
        const examIds = instructorExams.map((exam) => exam._id);
        query.exam = { $in: examIds };
      }

      // Build sort object
      const sort = {};
      sort[sortBy] = sortOrder === "asc" ? 1 : -1;

      // Execute query
      const results = await ExamAttempt.find(query)
        .populate("user", "name email role department")
        .populate("exam", "title category totalMarks passingMarks duration")
        .sort(sort)
        .limit(limit * 1)
        .skip((page - 1) * limit)
        .select("-answers"); // Exclude detailed answers for performance

      const total = await ExamAttempt.countDocuments(query);

      res.status(200).json({
        success: true,
        count: results.length,
        total,
        page: parseInt(page),
        pages: Math.ceil(total / limit),
        data: results,
      });
    } catch (error) {
      console.error("Get results error:", error);
      res.status(500).json({
        success: false,
        message: "Server error",
      });
    }
  },
);

// @desc    Get detailed result for specific attempt
// @route   GET /api/results/:id
// @access  Private (Admin/Instructor/Student-own)
router.get("/:id", async (req, res) => {
  try {
    const result = await ExamAttempt.findById(req.params.id)
      .populate("user", "name email role department")
      .populate(
        "exam",
        "title description category totalMarks passingMarks settings",
      )
      .populate({
        path: "answers.question",
        select: "text options correctAnswer explanation difficulty category",
      });

    if (!result) {
      return res.status(404).json({
        success: false,
        message: "Result not found",
      });
    }

    // Check permissions
    let canView = false;

    if (req.user.role === "admin") {
      canView = true;
    } else if (req.user.role === "instructor") {
      const exam = await Exam.findById(result.exam._id);
      canView = exam && exam.createdBy.toString() === req.user.id;
    } else if (req.user.role === "student") {
      canView = result.user._id.toString() === req.user.id;
    }

    if (!canView) {
      return res.status(403).json({
        success: false,
        message: "Not authorized to view this result",
      });
    }

    // For students, check if results should be shown
    if (req.user.role === "student" && !result.exam.settings.showResults) {
      return res.status(403).json({
        success: false,
        message: "Results are not available for this exam",
      });
    }

    // Filter sensitive information for students
    let responseData = result.toObject();

    if (req.user.role === "student") {
      delete responseData.metadata;
      delete responseData.proctoring;
      delete responseData.analytics;

      // Show correct answers only if setting allows
      if (!result.exam.settings.showCorrectAnswers) {
        responseData.answers = responseData.answers.map((answer) => {
          const answerObj = { ...answer };
          if (answerObj.question) {
            delete answerObj.question.correctAnswer;
            delete answerObj.question.explanation;
          }
          return answerObj;
        });
      }
    }

    res.status(200).json({
      success: true,
      data: responseData,
    });
  } catch (error) {
    console.error("Get result error:", error);
    res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
});

// @desc    Get results analytics for an exam
// @route   GET /api/results/exam/:examId/analytics
// @access  Private (Creator/Admin)
router.get("/exam/:examId/analytics", async (req, res) => {
  try {
    const exam = await Exam.findById(req.params.examId);
    if (!exam) {
      return res.status(404).json({
        success: false,
        message: "Exam not found",
      });
    }

    // Check permissions
    if (
      req.user.role !== "admin" &&
      exam.createdBy.toString() !== req.user.id
    ) {
      return res.status(403).json({
        success: false,
        message: "Not authorized to view exam analytics",
      });
    }

    // Get all completed attempts for this exam
    const attempts = await ExamAttempt.find({
      exam: req.params.examId,
      status: "completed",
    })
      .populate("user", "name email role department")
      .sort({ createdAt: -1 });

    if (attempts.length === 0) {
      return res.status(200).json({
        success: true,
        data: {
          overview: {
            totalAttempts: 0,
            averageScore: 0,
            passRate: 0,
            averageTimeSpent: 0,
          },
          scoreDistribution: {},
          gradeDistribution: {},
          timeAnalysis: {},
          questionAnalysis: {},
        },
      });
    }

    // Calculate overview statistics
    const totalAttempts = attempts.length;
    const passedAttempts = attempts.filter(
      (attempt) => attempt.result.passed,
    ).length;
    const averageScore =
      Math.round(
        (attempts.reduce((sum, attempt) => sum + attempt.score.percentage, 0) /
          totalAttempts) *
          100,
      ) / 100;
    const passRate = Math.round((passedAttempts / totalAttempts) * 100);
    const averageTimeSpent = Math.round(
      attempts.reduce((sum, attempt) => sum + attempt.timeSpent, 0) /
        totalAttempts,
    );

    // Score distribution
    const scoreRanges = {
      "90-100": 0,
      "80-89": 0,
      "70-79": 0,
      "60-69": 0,
      "50-59": 0,
      "0-49": 0,
    };

    attempts.forEach((attempt) => {
      const score = attempt.score.percentage;
      if (score >= 90) scoreRanges["90-100"]++;
      else if (score >= 80) scoreRanges["80-89"]++;
      else if (score >= 70) scoreRanges["70-79"]++;
      else if (score >= 60) scoreRanges["60-69"]++;
      else if (score >= 50) scoreRanges["50-59"]++;
      else scoreRanges["0-49"]++;
    });

    // Grade distribution
    const gradeDistribution = attempts.reduce((dist, attempt) => {
      const grade = attempt.result.grade || "F";
      dist[grade] = (dist[grade] || 0) + 1;
      return dist;
    }, {});

    // Time analysis
    const timeRanges = {
      "under-25%": 0,
      "25-50%": 0,
      "50-75%": 0,
      "75-100%": 0,
      overtime: 0,
    };

    const examDurationSeconds = exam.duration * 60;
    attempts.forEach((attempt) => {
      const timePercentage = (attempt.timeSpent / examDurationSeconds) * 100;
      if (timePercentage < 25) timeRanges["under-25%"]++;
      else if (timePercentage < 50) timeRanges["25-50%"]++;
      else if (timePercentage < 75) timeRanges["50-75%"]++;
      else if (timePercentage <= 100) timeRanges["75-100%"]++;
      else timeRanges["overtime"]++;
    });

    // Question-wise analysis
    const questionAnalysis = {};

    attempts.forEach((attempt) => {
      attempt.answers.forEach((answer, index) => {
        if (!questionAnalysis[index]) {
          questionAnalysis[index] = {
            questionNumber: index + 1,
            totalAttempts: 0,
            correctAttempts: 0,
            averageTimeSpent: 0,
            totalTimeSpent: 0,
          };
        }

        questionAnalysis[index].totalAttempts++;
        if (answer.isCorrect) {
          questionAnalysis[index].correctAttempts++;
        }
        questionAnalysis[index].totalTimeSpent += answer.timeSpent || 0;
      });
    });

    // Calculate averages for question analysis
    Object.keys(questionAnalysis).forEach((questionIndex) => {
      const stats = questionAnalysis[questionIndex];
      stats.correctPercentage = Math.round(
        (stats.correctAttempts / stats.totalAttempts) * 100,
      );
      stats.averageTimeSpent = Math.round(
        stats.totalTimeSpent / stats.totalAttempts,
      );
      delete stats.totalTimeSpent; // Remove intermediate calculation
    });

    // Department-wise performance
    const departmentPerformance = {};
    attempts.forEach((attempt) => {
      const dept = attempt.user.department || "Unknown";
      if (!departmentPerformance[dept]) {
        departmentPerformance[dept] = {
          totalStudents: 0,
          averageScore: 0,
          totalScore: 0,
          passCount: 0,
        };
      }

      departmentPerformance[dept].totalStudents++;
      departmentPerformance[dept].totalScore += attempt.score.percentage;
      if (attempt.result.passed) {
        departmentPerformance[dept].passCount++;
      }
    });

    Object.keys(departmentPerformance).forEach((dept) => {
      const stats = departmentPerformance[dept];
      stats.averageScore =
        Math.round((stats.totalScore / stats.totalStudents) * 100) / 100;
      stats.passRate = Math.round(
        (stats.passCount / stats.totalStudents) * 100,
      );
      delete stats.totalScore; // Remove intermediate calculation
    });

    // Recent attempts for timeline
    const recentAttempts = attempts.slice(0, 10).map((attempt) => ({
      studentName: attempt.user.name,
      studentEmail: attempt.user.email,
      score: attempt.score.percentage,
      grade: attempt.result.grade,
      passed: attempt.result.passed,
      timeSpent: attempt.timeSpent,
      completedAt: attempt.createdAt,
    }));

    const analytics = {
      overview: {
        totalAttempts,
        averageScore,
        passRate,
        averageTimeSpent,
        highestScore: Math.max(...attempts.map((a) => a.score.percentage)),
        lowestScore: Math.min(...attempts.map((a) => a.score.percentage)),
      },
      scoreDistribution: scoreRanges,
      gradeDistribution,
      timeAnalysis: timeRanges,
      questionAnalysis: Object.values(questionAnalysis),
      departmentPerformance,
      recentAttempts,
      examInfo: {
        title: exam.title,
        category: exam.category,
        totalMarks: exam.totalMarks,
        passingMarks: exam.passingMarks,
        duration: exam.duration,
      },
    };

    res.status(200).json({
      success: true,
      data: analytics,
    });
  } catch (error) {
    console.error("Get exam analytics error:", error);
    res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
});

// @desc    Get user performance summary
// @route   GET /api/results/user/:userId/summary
// @access  Private (Admin/Instructor/Own profile)
router.get("/user/:userId/summary", async (req, res) => {
  try {
    const userId = req.params.userId;

    // Check permissions
    if (
      req.user.role !== "admin" &&
      req.user.role !== "instructor" &&
      req.user.id !== userId
    ) {
      return res.status(403).json({
        success: false,
        message: "Not authorized to view this user summary",
      });
    }

    const user = await User.findById(userId).select(
      "name email role department",
    );
    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    // Get all user's completed attempts
    const attempts = await ExamAttempt.find({
      user: userId,
      status: "completed",
    })
      .populate("exam", "title category totalMarks passingMarks")
      .sort({ createdAt: -1 });

    const totalExams = attempts.length;

    if (totalExams === 0) {
      return res.status(200).json({
        success: true,
        data: {
          user,
          summary: {
            totalExams: 0,
            examsPassed: 0,
            examsFailed: 0,
            averageScore: 0,
            totalTimeSpent: 0,
            lastExamDate: null,
          },
          categoryPerformance: {},
          recentAttempts: [],
        },
      });
    }

    const examsPassed = attempts.filter(
      (attempt) => attempt.result.passed,
    ).length;
    const examsFailed = totalExams - examsPassed;
    const averageScore =
      Math.round(
        (attempts.reduce((sum, attempt) => sum + attempt.score.percentage, 0) /
          totalExams) *
          100,
      ) / 100;
    const totalTimeSpent = attempts.reduce(
      (sum, attempt) => sum + attempt.timeSpent,
      0,
    );
    const lastExamDate = attempts[0].createdAt;

    // Category-wise performance
    const categoryPerformance = {};
    attempts.forEach((attempt) => {
      const category = attempt.exam.category;
      if (!categoryPerformance[category]) {
        categoryPerformance[category] = {
          totalExams: 0,
          averageScore: 0,
          totalScore: 0,
          passCount: 0,
        };
      }

      categoryPerformance[category].totalExams++;
      categoryPerformance[category].totalScore += attempt.score.percentage;
      if (attempt.result.passed) {
        categoryPerformance[category].passCount++;
      }
    });

    Object.keys(categoryPerformance).forEach((category) => {
      const stats = categoryPerformance[category];
      stats.averageScore =
        Math.round((stats.totalScore / stats.totalExams) * 100) / 100;
      stats.passRate = Math.round((stats.passCount / stats.totalExams) * 100);
      delete stats.totalScore;
    });

    // Recent attempts
    const recentAttempts = attempts.slice(0, 5).map((attempt) => ({
      examTitle: attempt.exam.title,
      category: attempt.exam.category,
      score: attempt.score.percentage,
      grade: attempt.result.grade,
      passed: attempt.result.passed,
      timeSpent: attempt.timeSpent,
      completedAt: attempt.createdAt,
    }));

    const summary = {
      user,
      summary: {
        totalExams,
        examsPassed,
        examsFailed,
        averageScore,
        totalTimeSpent,
        lastExamDate,
        passRate: Math.round((examsPassed / totalExams) * 100),
      },
      categoryPerformance,
      recentAttempts,
    };

    res.status(200).json({
      success: true,
      data: summary,
    });
  } catch (error) {
    console.error("Get user summary error:", error);
    res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
});

// @desc    Export results to CSV
// @route   GET /api/results/export/:examId
// @access  Private (Creator/Admin)
router.get("/export/:examId", async (req, res) => {
  try {
    const exam = await Exam.findById(req.params.examId);
    if (!exam) {
      return res.status(404).json({
        success: false,
        message: "Exam not found",
      });
    }

    // Check permissions
    if (
      req.user.role !== "admin" &&
      exam.createdBy.toString() !== req.user.id
    ) {
      return res.status(403).json({
        success: false,
        message: "Not authorized to export this exam data",
      });
    }

    const results = await ExamAttempt.find({
      exam: req.params.examId,
      status: "completed",
    })
      .populate("user", "name email department")
      .sort({ createdAt: -1 });

    // Prepare CSV data
    const csvData = results.map((result) => ({
      "Student Name": result.user.name,
      Email: result.user.email,
      Department: result.user.department || "",
      Score: result.score.obtained,
      "Total Marks": result.score.total,
      Percentage: result.score.percentage,
      Grade: result.result.grade,
      Passed: result.result.passed ? "Yes" : "No",
      "Time Spent (minutes)": Math.round(result.timeSpent / 60),
      "Attempt Number": result.attemptNumber,
      "Completed At": result.createdAt.toLocaleString(),
    }));

    // Convert to CSV
    const { Parser } = require("json2csv");
    const json2csvParser = new Parser();
    const csv = json2csvParser.parse(csvData);

    // Set headers for download
    res.setHeader("Content-Type", "text/csv");
    res.setHeader(
      "Content-Disposition",
      `attachment; filename="${exam.title}-results.csv"`,
    );

    res.status(200).send(csv);
  } catch (error) {
    console.error("Export results error:", error);
    res.status(500).json({
      success: false,
      message: "Server error during export",
    });
  }
});

module.exports = router;

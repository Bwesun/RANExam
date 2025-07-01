const express = require("express");
const { body, validationResult, query } = require("express-validator");
const Exam = require("../models/Exam");
const Question = require("../models/Question");
const ExamAttempt = require("../models/ExamAttempt");
const { protect, authorize } = require("../middleware/auth");
const router = express.Router();

// Apply protection to all routes
router.use(protect);

// @desc    Get all exams with filtering and pagination
// @route   GET /api/exams
// @access  Private
router.get(
  "/",
  [
    query("page")
      .optional()
      .isInt({ min: 1 })
      .withMessage("Page must be a positive integer"),
    query("limit")
      .optional()
      .isInt({ min: 1, max: 100 })
      .withMessage("Limit must be between 1 and 100"),
    query("category")
      .optional()
      .isString()
      .withMessage("Category must be a string"),
    query("difficulty")
      .optional()
      .isIn(["beginner", "intermediate", "advanced", "expert"])
      .withMessage("Invalid difficulty"),
    query("status")
      .optional()
      .isIn(["draft", "published", "archived", "suspended"])
      .withMessage("Invalid status"),
    query("isActive")
      .optional()
      .isBoolean()
      .withMessage("isActive must be boolean"),
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
        search = "",
        category,
        difficulty,
        status,
        isActive,
        createdBy,
      } = req.query;

      // Build query
      const query = {};

      // Search across multiple fields
      if (search) {
        query.$or = [
          { title: { $regex: search, $options: "i" } },
          { description: { $regex: search, $options: "i" } },
          { category: { $regex: search, $options: "i" } },
          { tags: { $in: [new RegExp(search, "i")] } },
        ];
      }

      // Apply filters
      if (category) query.category = category;
      if (difficulty) query.difficulty = difficulty;
      if (status) query.status = status;
      if (isActive !== undefined) query.isActive = isActive === "true";
      if (createdBy) query.createdBy = createdBy;

      // For students, only show published and active exams
      if (req.user.role === "student") {
        query.isActive = true;
        query.status = "published";
        // Check if exam is within schedule
        const now = new Date();
        query.$or = [
          { "schedule.startDate": { $exists: false } },
          { "schedule.startDate": { $lte: now } },
        ];
        query.$and = [
          {
            $or: [
              { "schedule.endDate": { $exists: false } },
              { "schedule.endDate": { $gte: now } },
            ],
          },
        ];
      }

      // For instructors, show their own exams and published exams
      if (req.user.role === "instructor") {
        query.$or = [
          { createdBy: req.user.id },
          { status: "published", isActive: true },
        ];
      }

      // Build sort object
      const sort = { createdAt: -1 };

      // Execute query with pagination
      const exams = await Exam.find(query)
        .populate("createdBy", "name email")
        .populate("questions", "text difficulty category")
        .sort(sort)
        .limit(limit * 1)
        .skip((page - 1) * limit)
        .lean();

      // Get total count for pagination
      const total = await Exam.countDocuments(query);

      // Add computed fields
      const examsWithComputedFields = exams.map((exam) => ({
        ...exam,
        questionCount: exam.questions ? exam.questions.length : 0,
        passPercentage: Math.round((exam.passingMarks / exam.totalMarks) * 100),
        isAvailable: exam.isActive && exam.status === "published",
      }));

      res.status(200).json({
        success: true,
        count: examsWithComputedFields.length,
        total,
        page: parseInt(page),
        pages: Math.ceil(total / limit),
        data: examsWithComputedFields,
      });
    } catch (error) {
      console.error("Get exams error:", error);
      res.status(500).json({
        success: false,
        message: "Server error",
      });
    }
  },
);

// @desc    Get single exam
// @route   GET /api/exams/:id
// @access  Private
router.get("/:id", async (req, res) => {
  try {
    const exam = await Exam.findById(req.params.id)
      .populate("createdBy", "name email")
      .populate({
        path: "questions",
        select:
          req.user.role === "student"
            ? "text type options difficulty timeAllocation multimedia formatting"
            : undefined,
      });

    if (!exam) {
      return res.status(404).json({
        success: false,
        message: "Exam not found",
      });
    }

    // Check permissions for students
    if (req.user.role === "student") {
      if (!exam.isActive || exam.status !== "published") {
        return res.status(403).json({
          success: false,
          message: "Exam is not available",
        });
      }

      // Check schedule
      const now = new Date();
      if (exam.schedule.startDate && now < exam.schedule.startDate) {
        return res.status(403).json({
          success: false,
          message: "Exam has not started yet",
        });
      }
      if (exam.schedule.endDate && now > exam.schedule.endDate) {
        return res.status(403).json({
          success: false,
          message: "Exam has ended",
        });
      }

      // For students, remove sensitive information and get exam version of questions
      const studentExam = {
        ...exam.toObject(),
        questions: exam.questions.map((q) =>
          q.getExamVersion ? q.getExamVersion() : q,
        ),
      };

      // Remove admin-only fields
      delete studentExam.analytics;
      delete studentExam.createdBy;

      return res.status(200).json({
        success: true,
        data: studentExam,
      });
    }

    // Check permissions for instructors
    if (
      req.user.role === "instructor" &&
      exam.createdBy._id.toString() !== req.user.id &&
      exam.status !== "published"
    ) {
      return res.status(403).json({
        success: false,
        message: "Not authorized to view this exam",
      });
    }

    res.status(200).json({
      success: true,
      data: exam,
    });
  } catch (error) {
    console.error("Get exam error:", error);
    res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
});

// @desc    Create new exam
// @route   POST /api/exams
// @access  Private (Instructor/Admin)
router.post(
  "/",
  authorize("instructor", "admin"),
  [
    body("title")
      .trim()
      .isLength({ min: 3, max: 200 })
      .withMessage("Title must be between 3 and 200 characters"),
    body("category")
      .trim()
      .isLength({ min: 2, max: 100 })
      .withMessage("Category must be between 2 and 100 characters"),
    body("duration")
      .isInt({ min: 1, max: 600 })
      .withMessage("Duration must be between 1 and 600 minutes"),
    body("totalMarks")
      .isInt({ min: 1 })
      .withMessage("Total marks must be at least 1"),
    body("passingMarks")
      .isInt({ min: 1 })
      .withMessage("Passing marks must be at least 1"),
    body("questions")
      .isArray({ min: 1 })
      .withMessage("At least one question is required"),
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
        title,
        description,
        category,
        duration,
        totalMarks,
        passingMarks,
        instructions,
        questions,
        settings,
        schedule,
        accessibility,
        tags,
        difficulty,
        estimatedTime,
      } = req.body;

      // Validate that passing marks don't exceed total marks
      if (passingMarks > totalMarks) {
        return res.status(400).json({
          success: false,
          message: "Passing marks cannot exceed total marks",
        });
      }

      // Validate questions exist
      const questionDocs = await Question.find({
        _id: { $in: questions },
        status: "approved",
      });

      if (questionDocs.length !== questions.length) {
        return res.status(400).json({
          success: false,
          message: "Some questions are invalid or not approved",
        });
      }

      const exam = await Exam.create({
        title,
        description,
        category,
        duration,
        totalMarks,
        passingMarks,
        instructions,
        questions,
        settings: settings || {},
        schedule: schedule || {},
        accessibility: accessibility || {},
        tags: tags || [],
        difficulty: difficulty || "intermediate",
        estimatedTime: estimatedTime || duration,
        createdBy: req.user.id,
      });

      const populatedExam = await Exam.findById(exam._id)
        .populate("createdBy", "name email")
        .populate("questions", "text difficulty category marks");

      res.status(201).json({
        success: true,
        message: "Exam created successfully",
        data: populatedExam,
      });
    } catch (error) {
      console.error("Create exam error:", error);
      res.status(500).json({
        success: false,
        message: "Server error during exam creation",
      });
    }
  },
);

// @desc    Update exam
// @route   PUT /api/exams/:id
// @access  Private (Creator/Admin)
router.put(
  "/:id",
  [
    body("title")
      .optional()
      .trim()
      .isLength({ min: 3, max: 200 })
      .withMessage("Title must be between 3 and 200 characters"),
    body("duration")
      .optional()
      .isInt({ min: 1, max: 600 })
      .withMessage("Duration must be between 1 and 600 minutes"),
    body("totalMarks")
      .optional()
      .isInt({ min: 1 })
      .withMessage("Total marks must be at least 1"),
    body("passingMarks")
      .optional()
      .isInt({ min: 1 })
      .withMessage("Passing marks must be at least 1"),
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

      const exam = await Exam.findById(req.params.id);
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
          message: "Not authorized to update this exam",
        });
      }

      // Check if exam has attempts (restrict certain updates)
      const attemptCount = await ExamAttempt.countDocuments({
        exam: req.params.id,
      });
      if (attemptCount > 0) {
        const restrictedFields = ["questions", "totalMarks", "passingMarks"];
        const hasRestrictedUpdates = restrictedFields.some(
          (field) => req.body[field] !== undefined,
        );

        if (hasRestrictedUpdates) {
          return res.status(400).json({
            success: false,
            message:
              "Cannot modify questions or marks after students have attempted the exam",
          });
        }
      }

      // Validate questions if provided
      if (req.body.questions) {
        const questionDocs = await Question.find({
          _id: { $in: req.body.questions },
          status: "approved",
        });

        if (questionDocs.length !== req.body.questions.length) {
          return res.status(400).json({
            success: false,
            message: "Some questions are invalid or not approved",
          });
        }
      }

      // Validate passing marks
      const totalMarks = req.body.totalMarks || exam.totalMarks;
      const passingMarks = req.body.passingMarks || exam.passingMarks;
      if (passingMarks > totalMarks) {
        return res.status(400).json({
          success: false,
          message: "Passing marks cannot exceed total marks",
        });
      }

      const allowedFields = [
        "title",
        "description",
        "category",
        "duration",
        "totalMarks",
        "passingMarks",
        "instructions",
        "questions",
        "settings",
        "schedule",
        "accessibility",
        "tags",
        "difficulty",
        "estimatedTime",
        "isActive",
        "status",
      ];

      const updateData = {};
      allowedFields.forEach((field) => {
        if (req.body[field] !== undefined) {
          updateData[field] = req.body[field];
        }
      });

      const updatedExam = await Exam.findByIdAndUpdate(
        req.params.id,
        updateData,
        { new: true, runValidators: true },
      )
        .populate("createdBy", "name email")
        .populate("questions", "text difficulty category marks");

      res.status(200).json({
        success: true,
        message: "Exam updated successfully",
        data: updatedExam,
      });
    } catch (error) {
      console.error("Update exam error:", error);
      res.status(500).json({
        success: false,
        message: "Server error during exam update",
      });
    }
  },
);

// @desc    Delete exam
// @route   DELETE /api/exams/:id
// @access  Private (Creator/Admin)
router.delete("/:id", async (req, res) => {
  try {
    const exam = await Exam.findById(req.params.id);
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
        message: "Not authorized to delete this exam",
      });
    }

    // Check if exam has attempts
    const attemptCount = await ExamAttempt.countDocuments({
      exam: req.params.id,
    });
    if (attemptCount > 0) {
      // Soft delete - just archive the exam
      exam.status = "archived";
      exam.isActive = false;
      await exam.save();

      return res.status(200).json({
        success: true,
        message: "Exam archived successfully (has existing attempts)",
      });
    }

    // Hard delete if no attempts
    await exam.deleteOne();

    res.status(200).json({
      success: true,
      message: "Exam deleted successfully",
    });
  } catch (error) {
    console.error("Delete exam error:", error);
    res.status(500).json({
      success: false,
      message: "Server error during exam deletion",
    });
  }
});

// @desc    Get exam analytics
// @route   GET /api/exams/:id/analytics
// @access  Private (Creator/Admin)
router.get("/:id/analytics", async (req, res) => {
  try {
    const exam = await Exam.findById(req.params.id);
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

    // Get attempt statistics
    const attemptStats = await ExamAttempt.getAttemptStats(req.params.id);

    // Get detailed analytics
    const attempts = await ExamAttempt.find({
      exam: req.params.id,
      status: "completed",
    })
      .populate("user", "name email role")
      .select("user score result timeSpent createdAt answers")
      .sort({ createdAt: -1 });

    // Calculate question-wise analytics
    const questionAnalytics = {};
    attempts.forEach((attempt) => {
      attempt.answers.forEach((answer) => {
        const qId = answer.question.toString();
        if (!questionAnalytics[qId]) {
          questionAnalytics[qId] = {
            totalAttempts: 0,
            correctAttempts: 0,
            totalTimeSpent: 0,
          };
        }

        questionAnalytics[qId].totalAttempts++;
        if (answer.isCorrect) {
          questionAnalytics[qId].correctAttempts++;
        }
        questionAnalytics[qId].totalTimeSpent += answer.timeSpent || 0;
      });
    });

    // Calculate difficulty and discrimination indices
    Object.keys(questionAnalytics).forEach((qId) => {
      const stats = questionAnalytics[qId];
      stats.difficultyIndex =
        stats.totalAttempts > 0
          ? stats.correctAttempts / stats.totalAttempts
          : 0;
      stats.averageTimeSpent =
        stats.totalAttempts > 0
          ? stats.totalTimeSpent / stats.totalAttempts
          : 0;
    });

    // Grade distribution
    const gradeDistribution = attempts.reduce((dist, attempt) => {
      const grade = attempt.result.grade || "F";
      dist[grade] = (dist[grade] || 0) + 1;
      return dist;
    }, {});

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

    const analytics = {
      overview: attemptStats[0] || {
        totalAttempts: 0,
        averageScore: 0,
        highestScore: 0,
        lowestScore: 0,
        passCount: 0,
        passRate: 0,
        averageTimeSpent: 0,
      },
      recentAttempts: attempts.slice(0, 10).map((attempt) => ({
        studentName: attempt.user.name,
        studentEmail: attempt.user.email,
        score: attempt.score.percentage,
        grade: attempt.result.grade,
        passed: attempt.result.passed,
        timeSpent: attempt.timeSpent,
        completedAt: attempt.createdAt,
      })),
      questionAnalytics,
      gradeDistribution,
      scoreDistribution: scoreRanges,
      trends: {
        // Could add time-based trends here
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

// @desc    Duplicate exam
// @route   POST /api/exams/:id/duplicate
// @access  Private (Creator/Admin)
router.post("/:id/duplicate", async (req, res) => {
  try {
    const originalExam = await Exam.findById(req.params.id);
    if (!originalExam) {
      return res.status(404).json({
        success: false,
        message: "Exam not found",
      });
    }

    // Check permissions
    if (
      req.user.role !== "admin" &&
      originalExam.createdBy.toString() !== req.user.id
    ) {
      return res.status(403).json({
        success: false,
        message: "Not authorized to duplicate this exam",
      });
    }

    const examData = originalExam.toObject();
    delete examData._id;
    delete examData.createdAt;
    delete examData.updatedAt;
    delete examData.analytics;

    // Modify title to indicate it's a copy
    examData.title = `${examData.title} (Copy)`;
    examData.status = "draft";
    examData.createdBy = req.user.id;

    const duplicatedExam = await Exam.create(examData);

    const populatedExam = await Exam.findById(duplicatedExam._id)
      .populate("createdBy", "name email")
      .populate("questions", "text difficulty category marks");

    res.status(201).json({
      success: true,
      message: "Exam duplicated successfully",
      data: populatedExam,
    });
  } catch (error) {
    console.error("Duplicate exam error:", error);
    res.status(500).json({
      success: false,
      message: "Server error during exam duplication",
    });
  }
});

module.exports = router;

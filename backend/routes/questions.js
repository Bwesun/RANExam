const express = require("express");
const { body, validationResult, query } = require("express-validator");
const Question = require("../models/Question");
const { protect, authorize } = require("../middleware/auth");
const router = express.Router();

// Apply protection to all routes
router.use(protect);

// @desc    Get all questions with filtering and pagination
// @route   GET /api/questions
// @access  Private (Instructor/Admin)
router.get(
  "/",
  authorize("instructor", "admin"),
  [
    query("page")
      .optional()
      .isInt({ min: 1 })
      .withMessage("Page must be a positive integer"),
    query("limit")
      .optional()
      .isInt({ min: 1, max: 100 })
      .withMessage("Limit must be between 1 and 100"),
    query("difficulty")
      .optional()
      .isIn(["easy", "medium", "hard"])
      .withMessage("Invalid difficulty"),
    query("status")
      .optional()
      .isIn(["draft", "review", "approved", "archived"])
      .withMessage("Invalid status"),
    query("type")
      .optional()
      .isIn(["multiple-choice", "true-false", "fill-blank", "essay"])
      .withMessage("Invalid question type"),
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
        subject,
        topic,
        difficulty,
        status,
        type,
        createdBy,
        tags,
      } = req.query;

      // Build query
      const query = {};

      // Search across multiple fields
      if (search) {
        query.$or = [
          { text: { $regex: search, $options: "i" } },
          { category: { $regex: search, $options: "i" } },
          { subject: { $regex: search, $options: "i" } },
          { topic: { $regex: search, $options: "i" } },
          { tags: { $in: [new RegExp(search, "i")] } },
        ];
      }

      // Apply filters
      if (category) query.category = category;
      if (subject) query.subject = subject;
      if (topic) query.topic = topic;
      if (difficulty) query.difficulty = difficulty;
      if (status) query.status = status;
      if (type) query.type = type;
      if (createdBy) query.createdBy = createdBy;
      if (tags) query.tags = { $in: tags.split(",") };

      // For instructors, show their own questions and approved questions
      if (req.user.role === "instructor") {
        query.$or = [{ createdBy: req.user.id }, { status: "approved" }];
      }

      // Build sort object
      const sort = { createdAt: -1 };

      // Execute query with pagination
      const questions = await Question.find(query)
        .populate("createdBy", "name email")
        .populate("lastModifiedBy", "name email")
        .sort(sort)
        .limit(limit * 1)
        .skip((page - 1) * limit)
        .lean();

      // Get total count for pagination
      const total = await Question.countDocuments(query);

      // Add computed fields
      const questionsWithComputedFields = questions.map((question) => ({
        ...question,
        correctPercentage:
          question.analytics.totalAttempts > 0
            ? Math.round(
                (question.analytics.correctAttempts /
                  question.analytics.totalAttempts) *
                  100,
              )
            : 0,
        optionCount: question.options ? question.options.length : 0,
      }));

      res.status(200).json({
        success: true,
        count: questionsWithComputedFields.length,
        total,
        page: parseInt(page),
        pages: Math.ceil(total / limit),
        data: questionsWithComputedFields,
      });
    } catch (error) {
      console.error("Get questions error:", error);
      res.status(500).json({
        success: false,
        message: "Server error",
      });
    }
  },
);

// @desc    Get single question
// @route   GET /api/questions/:id
// @access  Private (Creator/Admin/Approved questions for instructors)
router.get("/:id", async (req, res) => {
  try {
    const question = await Question.findById(req.params.id)
      .populate("createdBy", "name email")
      .populate("lastModifiedBy", "name email");

    if (!question) {
      return res.status(404).json({
        success: false,
        message: "Question not found",
      });
    }

    // Check permissions
    if (req.user.role === "instructor") {
      if (
        question.createdBy._id.toString() !== req.user.id &&
        question.status !== "approved"
      ) {
        return res.status(403).json({
          success: false,
          message: "Not authorized to view this question",
        });
      }
    }

    res.status(200).json({
      success: true,
      data: question,
    });
  } catch (error) {
    console.error("Get question error:", error);
    res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
});

// @desc    Create new question
// @route   POST /api/questions
// @access  Private (Instructor/Admin)
router.post(
  "/",
  authorize("instructor", "admin"),
  [
    body("text")
      .trim()
      .isLength({ min: 10, max: 2000 })
      .withMessage("Question text must be between 10 and 2000 characters"),
    body("type")
      .isIn(["multiple-choice", "true-false", "fill-blank", "essay"])
      .withMessage("Invalid question type"),
    body("options")
      .isArray({ min: 2, max: 5 })
      .withMessage("Must have between 2 and 5 options"),
    body("category")
      .trim()
      .isLength({ min: 2, max: 100 })
      .withMessage("Category must be between 2 and 100 characters"),
    body("difficulty")
      .isIn(["easy", "medium", "hard"])
      .withMessage("Difficulty must be easy, medium, or hard"),
    body("marks")
      .optional()
      .isFloat({ min: 0.5, max: 10 })
      .withMessage("Marks must be between 0.5 and 10"),
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
        text,
        type,
        options,
        correctAnswer,
        explanation,
        difficulty,
        category,
        subject,
        topic,
        marks,
        negativeMarking,
        timeAllocation,
        multimedia,
        formatting,
        tags,
        bloomsLevel,
        cognitiveLevel,
      } = req.body;

      // Validate options based on type
      if (type === "multiple-choice") {
        // Ensure exactly one correct option
        const correctOptions = options.filter((option) => option.isCorrect);
        if (correctOptions.length !== 1) {
          return res.status(400).json({
            success: false,
            message:
              "Multiple choice questions must have exactly one correct option",
          });
        }
      }

      if (type === "true-false" && options.length !== 2) {
        return res.status(400).json({
          success: false,
          message: "True/False questions must have exactly 2 options",
        });
      }

      const question = await Question.create({
        text,
        type,
        options,
        correctAnswer,
        explanation,
        difficulty,
        category,
        subject,
        topic,
        marks: marks || 1,
        negativeMarking: negativeMarking || { enabled: false, penalty: 0.25 },
        timeAllocation,
        multimedia: multimedia || {},
        formatting: formatting || {},
        tags: tags || [],
        bloomsLevel,
        cognitiveLevel,
        createdBy: req.user.id,
        status: req.user.role === "admin" ? "approved" : "draft",
      });

      const populatedQuestion = await Question.findById(question._id).populate(
        "createdBy",
        "name email",
      );

      res.status(201).json({
        success: true,
        message: "Question created successfully",
        data: populatedQuestion,
      });
    } catch (error) {
      console.error("Create question error:", error);
      res.status(500).json({
        success: false,
        message: "Server error during question creation",
      });
    }
  },
);

// @desc    Update question
// @route   PUT /api/questions/:id
// @access  Private (Creator/Admin)
router.put(
  "/:id",
  [
    body("text")
      .optional()
      .trim()
      .isLength({ min: 10, max: 2000 })
      .withMessage("Question text must be between 10 and 2000 characters"),
    body("options")
      .optional()
      .isArray({ min: 2, max: 5 })
      .withMessage("Must have between 2 and 5 options"),
    body("difficulty")
      .optional()
      .isIn(["easy", "medium", "hard"])
      .withMessage("Difficulty must be easy, medium, or hard"),
    body("marks")
      .optional()
      .isFloat({ min: 0.5, max: 10 })
      .withMessage("Marks must be between 0.5 and 10"),
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

      const question = await Question.findById(req.params.id);
      if (!question) {
        return res.status(404).json({
          success: false,
          message: "Question not found",
        });
      }

      // Check permissions
      if (
        req.user.role !== "admin" &&
        question.createdBy.toString() !== req.user.id
      ) {
        return res.status(403).json({
          success: false,
          message: "Not authorized to update this question",
        });
      }

      // Check if question is being used in active exams
      if (question.usageCount > 0 && question.status === "approved") {
        // Create new version instead of modifying existing
        const newVersion = question.toObject();
        delete newVersion._id;
        delete newVersion.createdAt;
        delete newVersion.updatedAt;
        delete newVersion.analytics;
        delete newVersion.usageCount;
        delete newVersion.lastUsed;

        // Apply updates
        const allowedFields = [
          "text",
          "options",
          "correctAnswer",
          "explanation",
          "difficulty",
          "category",
          "subject",
          "topic",
          "marks",
          "negativeMarking",
          "timeAllocation",
          "multimedia",
          "formatting",
          "tags",
          "bloomsLevel",
          "cognitiveLevel",
        ];

        allowedFields.forEach((field) => {
          if (req.body[field] !== undefined) {
            newVersion[field] = req.body[field];
          }
        });

        newVersion.version = question.version + 1;
        newVersion.status = "draft";
        newVersion.lastModifiedBy = req.user.id;

        const newQuestion = await Question.create(newVersion);
        const populatedQuestion = await Question.findById(newQuestion._id)
          .populate("createdBy", "name email")
          .populate("lastModifiedBy", "name email");

        return res.status(200).json({
          success: true,
          message: "New version created successfully",
          data: populatedQuestion,
        });
      }

      // Validate options if provided
      if (req.body.options && req.body.type === "multiple-choice") {
        const correctOptions = req.body.options.filter(
          (option) => option.isCorrect,
        );
        if (correctOptions.length !== 1) {
          return res.status(400).json({
            success: false,
            message:
              "Multiple choice questions must have exactly one correct option",
          });
        }
      }

      const allowedFields = [
        "text",
        "options",
        "correctAnswer",
        "explanation",
        "difficulty",
        "category",
        "subject",
        "topic",
        "marks",
        "negativeMarking",
        "timeAllocation",
        "multimedia",
        "formatting",
        "tags",
        "bloomsLevel",
        "cognitiveLevel",
        "status",
        "reviewNotes",
      ];

      const updateData = {};
      allowedFields.forEach((field) => {
        if (req.body[field] !== undefined) {
          updateData[field] = req.body[field];
        }
      });

      updateData.lastModifiedBy = req.user.id;

      const updatedQuestion = await Question.findByIdAndUpdate(
        req.params.id,
        updateData,
        { new: true, runValidators: true },
      )
        .populate("createdBy", "name email")
        .populate("lastModifiedBy", "name email");

      res.status(200).json({
        success: true,
        message: "Question updated successfully",
        data: updatedQuestion,
      });
    } catch (error) {
      console.error("Update question error:", error);
      res.status(500).json({
        success: false,
        message: "Server error during question update",
      });
    }
  },
);

// @desc    Delete question
// @route   DELETE /api/questions/:id
// @access  Private (Creator/Admin)
router.delete("/:id", async (req, res) => {
  try {
    const question = await Question.findById(req.params.id);
    if (!question) {
      return res.status(404).json({
        success: false,
        message: "Question not found",
      });
    }

    // Check permissions
    if (
      req.user.role !== "admin" &&
      question.createdBy.toString() !== req.user.id
    ) {
      return res.status(403).json({
        success: false,
        message: "Not authorized to delete this question",
      });
    }

    // Check if question is being used
    if (question.usageCount > 0) {
      // Soft delete - archive the question
      question.status = "archived";
      await question.save();

      return res.status(200).json({
        success: true,
        message: "Question archived successfully (has existing usage)",
      });
    }

    // Hard delete if not used
    await question.deleteOne();

    res.status(200).json({
      success: true,
      message: "Question deleted successfully",
    });
  } catch (error) {
    console.error("Delete question error:", error);
    res.status(500).json({
      success: false,
      message: "Server error during question deletion",
    });
  }
});

// @desc    Approve/Reject question
// @route   PUT /api/questions/:id/review
// @access  Private (Admin only)
router.put(
  "/:id/review",
  authorize("admin"),
  [
    body("status")
      .isIn(["approved", "review", "draft"])
      .withMessage("Invalid status"),
    body("reviewNotes")
      .optional()
      .isLength({ max: 1000 })
      .withMessage("Review notes cannot exceed 1000 characters"),
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

      const { status, reviewNotes } = req.body;

      const question = await Question.findById(req.params.id);
      if (!question) {
        return res.status(404).json({
          success: false,
          message: "Question not found",
        });
      }

      question.status = status;
      question.reviewNotes = reviewNotes;
      question.lastModifiedBy = req.user.id;

      await question.save();

      const populatedQuestion = await Question.findById(question._id)
        .populate("createdBy", "name email")
        .populate("lastModifiedBy", "name email");

      res.status(200).json({
        success: true,
        message: `Question ${status} successfully`,
        data: populatedQuestion,
      });
    } catch (error) {
      console.error("Review question error:", error);
      res.status(500).json({
        success: false,
        message: "Server error during question review",
      });
    }
  },
);

// @desc    Bulk import questions
// @route   POST /api/questions/bulk-import
// @access  Private (Instructor/Admin)
router.post(
  "/bulk-import",
  authorize("instructor", "admin"),
  async (req, res) => {
    try {
      const { questions } = req.body;

      if (!Array.isArray(questions) || questions.length === 0) {
        return res.status(400).json({
          success: false,
          message: "Questions array is required",
        });
      }

      const createdQuestions = [];
      const errors = [];

      for (let i = 0; i < questions.length; i++) {
        try {
          const questionData = {
            ...questions[i],
            createdBy: req.user.id,
            status: req.user.role === "admin" ? "approved" : "draft",
          };

          const question = await Question.create(questionData);
          createdQuestions.push(question);
        } catch (error) {
          errors.push({
            index: i,
            error: error.message,
          });
        }
      }

      res.status(201).json({
        success: true,
        message: `Successfully imported ${createdQuestions.length} questions`,
        data: {
          created: createdQuestions.length,
          errors: errors.length,
          errorDetails: errors,
        },
      });
    } catch (error) {
      console.error("Bulk import error:", error);
      res.status(500).json({
        success: false,
        message: "Server error during bulk import",
      });
    }
  },
);

// @desc    Get question categories
// @route   GET /api/questions/categories
// @access  Private
router.get("/meta/categories", async (req, res) => {
  try {
    const categories = await Question.distinct("category", {
      status: "approved",
    });
    const subjects = await Question.distinct("subject", { status: "approved" });
    const topics = await Question.distinct("topic", { status: "approved" });
    const tags = await Question.distinct("tags", { status: "approved" });

    res.status(200).json({
      success: true,
      data: {
        categories: categories.filter(Boolean),
        subjects: subjects.filter(Boolean),
        topics: topics.filter(Boolean),
        tags: tags.filter(Boolean),
      },
    });
  } catch (error) {
    console.error("Get categories error:", error);
    res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
});

// @desc    Get similar questions
// @route   GET /api/questions/:id/similar
// @access  Private (Instructor/Admin)
router.get(
  "/:id/similar",
  authorize("instructor", "admin"),
  async (req, res) => {
    try {
      const similarQuestions = await Question.getSimilarQuestions(
        req.params.id,
      );

      res.status(200).json({
        success: true,
        data: similarQuestions,
      });
    } catch (error) {
      console.error("Get similar questions error:", error);
      res.status(500).json({
        success: false,
        message: "Server error",
      });
    }
  },
);

module.exports = router;

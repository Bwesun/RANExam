const express = require("express");
const { body, validationResult, query } = require("express-validator");
const { Question, User, sequelize } = require("../models");
const { protect, authorize } = require("../middleware/auth");
const { Op } = require("sequelize");
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

      const where = {};

      if (search) {
        where[Op.or] = [
          { text: { [Op.iLike]: `%${search}%` } },
          { category: { [Op.iLike]: `%${search}%` } },
          { subject: { [Op.iLike]: `%${search}%` } },
          { topic: { [Op.iLike]: `%${search}%` } },
        ];
      }

      if (category) where.category = category;
      if (subject) where.subject = subject;
      if (topic) where.topic = topic;
      if (difficulty) where.difficulty = difficulty;
      if (status) where.status = status;
      if (type) where.type = type;
      if (createdBy) where.createdBy = createdBy;
      if (tags) where.tags = { [Op.contains]: tags.split(",") };

      if (req.user.role === "instructor") {
        where[Op.or] = [{ createdBy: req.user.id }, { status: "approved" }];
      }

      const { count, rows } = await Question.findAndCountAll({
        where,
        include: [
          { model: User, attributes: ['name', 'email'] },
        ],
        limit,
        offset: (page - 1) * limit,
      });

      res.status(200).json({
        success: true,
        count: rows.length,
        total: count,
        page: parseInt(page),
        pages: Math.ceil(count / limit),
        data: rows,
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
    const question = await Question.findByPk(req.params.id, {
      include: [
        { model: User, attributes: ['name', 'email'] },
      ],
    });

    if (!question) {
      return res.status(404).json({
        success: false,
        message: "Question not found",
      });
    }

    if (req.user.role === "instructor") {
      if (
        question.createdBy !== req.user.id &&
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
      } = req.body;

      if (type === "multiple-choice") {
        const correctOptions = options.filter((option) => option.isCorrect);
        if (correctOptions.length !== 1) {
          return res.status(400).json({
            success: false,
            message:
              "Multiple choice questions must have exactly one correct option",
          });
        }
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
        marks,
        negativeMarking,
        timeAllocation,
        multimedia,
        formatting,
        tags,
        createdBy: req.user.id,
        status: req.user.role === "admin" ? "approved" : "draft",
      });

      const populatedQuestion = await Question.findByPk(question.id, {
        include: [
          { model: User, attributes: ['name', 'email'] },
        ],
      });

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

      const question = await Question.findByPk(req.params.id);
      if (!question) {
        return res.status(404).json({
          success: false,
          message: "Question not found",
        });
      }

      if (
        req.user.role !== "admin" &&
        question.createdBy !== req.user.id
      ) {
        return res.status(403).json({
          success: false,
          message: "Not authorized to update this question",
        });
      }

      const [updated] = await Question.update(req.body, { where: { id: req.params.id } });

      if (updated) {
        const updatedQuestion = await Question.findByPk(req.params.id, {
          include: [
            { model: User, attributes: ['name', 'email'] },
          ],
        });
        res.status(200).json({
          success: true,
          message: "Question updated successfully",
          data: updatedQuestion,
        });
      } else {
        res.status(404).json({
          success: false,
          message: "Question not found",
        });
      }
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
    const question = await Question.findByPk(req.params.id);
    if (!question) {
      return res.status(404).json({
        success: false,
        message: "Question not found",
      });
    }

    if (
      req.user.role !== "admin" &&
      question.createdBy !== req.user.id
    ) {
      return res.status(403).json({
        success: false,
        message: "Not authorized to delete this question",
      });
    }

    await question.destroy();

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

module.exports = router;
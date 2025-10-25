const express = require("express");
const { body, validationResult, query } = require("express-validator");
const { Exam, Question, ExamAttempt, User, sequelize } = require("../models");
const { protect, authorize } = require("../middleware/auth");
const { Op } = require("sequelize");
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

      const where = {};

      if (search) {
        where[Op.or] = [
          { title: { [Op.iLike]: `%${search}%` } },
          { description: { [Op.iLike]: `%${search}%` } },
          { category: { [Op.iLike]: `%${search}%` } },
        ];
      }

      if (category) where.category = category;
      if (difficulty) where.difficulty = difficulty;
      if (status) where.status = status;
      if (isActive !== undefined) where.isActive = isActive === "true";
      if (createdBy) where.createdBy = createdBy;

      if (req.user.role === "student") {
        where.isActive = true;
        where.status = "published";
      }

      if (req.user.role === "instructor") {
        where[Op.or] = [
          { createdBy: req.user.id },
          { status: "published", isActive: true },
        ];
      }

      const { count, rows } = await Exam.findAndCountAll({
        where,
        include: [
          { model: User, attributes: ['name', 'email'] },
          { model: Question, attributes: ['text', 'difficulty', 'category'] },
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
    const exam = await Exam.findByPk(req.params.id, {
      include: [
        { model: User, attributes: ['name', 'email'] },
        {
          model: Question,
          attributes: req.user.role === 'student' ? ['text', 'type', 'options', 'difficulty', 'timeAllocation', 'multimedia', 'formatting'] : undefined,
        },
      ],
    });

    if (!exam) {
      return res.status(404).json({
        success: false,
        message: "Exam not found",
      });
    }

    if (req.user.role === "student") {
      if (!exam.isActive || exam.status !== "published") {
        return res.status(403).json({
          success: false,
          message: "Exam is not available",
        });
      }
    }

    if (
      req.user.role === "instructor" &&
      exam.createdBy !== req.user.id &&
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
        tags,
        difficulty,
      } = req.body;

      if (passingMarks > totalMarks) {
        return res.status(400).json({
          success: false,
          message: "Passing marks cannot exceed total marks",
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
        settings,
        schedule,
        tags,
        difficulty,
        createdBy: req.user.id,
      });

      await exam.addQuestions(questions);

      const populatedExam = await Exam.findByPk(exam.id, {
        include: [
          { model: User, attributes: ['name', 'email'] },
          { model: Question, attributes: ['text', 'difficulty', 'category', 'marks'] },
        ],
      });

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

      const exam = await Exam.findByPk(req.params.id);
      if (!exam) {
        return res.status(404).json({
          success: false,
          message: "Exam not found",
        });
      }

      if (
        req.user.role !== "admin" &&
        exam.createdBy !== req.user.id
      ) {
        return res.status(403).json({
          success: false,
          message: "Not authorized to update this exam",
        });
      }

      const attemptCount = await ExamAttempt.count({ where: { examId: req.params.id } });
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

      const totalMarks = req.body.totalMarks || exam.totalMarks;
      const passingMarks = req.body.passingMarks || exam.passingMarks;
      if (passingMarks > totalMarks) {
        return res.status(400).json({
          success: false,
          message: "Passing marks cannot exceed total marks",
        });
      }

      const [updated] = await Exam.update(req.body, { where: { id: req.params.id } });

      if (updated) {
        const updatedExam = await Exam.findByPk(req.params.id, {
          include: [
            { model: User, attributes: ['name', 'email'] },
            { model: Question, attributes: ['text', 'difficulty', 'category', 'marks'] },
          ],
        });
        res.status(200).json({
          success: true,
          message: "Exam updated successfully",
          data: updatedExam,
        });
      } else {
        res.status(404).json({
          success: false,
          message: "Exam not found",
        });
      }
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
    const exam = await Exam.findByPk(req.params.id);
    if (!exam) {
      return res.status(404).json({
        success: false,
        message: "Exam not found",
      });
    }

    if (
      req.user.role !== "admin" &&
      exam.createdBy !== req.user.id
    ) {
      return res.status(403).json({
        success: false,
        message: "Not authorized to delete this exam",
      });
    }

    const attemptCount = await ExamAttempt.count({ where: { examId: req.params.id } });
    if (attemptCount > 0) {
      exam.status = "archived";
      exam.isActive = false;
      await exam.save();

      return res.status(200).json({
        success: true,
        message: "Exam archived successfully (has existing attempts)",
      });
    }

    await exam.destroy();

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

module.exports = router;
const express = require("express");
const { query, validationResult } = require("express-validator");
const { ExamAttempt, Exam, User, sequelize } = require("../models");
const { protect, authorize } = require("../middleware/auth");
const { Op } = require("sequelize");
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
    query("examId").optional().isInt().withMessage("Invalid exam ID"),
    query("userId").optional().isInt().withMessage("Invalid user ID"),
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

      const where = { status };

      if (examId) where.examId = examId;
      if (userId) where.userId = userId;

      if (req.user.role === "instructor") {
        const instructorExams = await Exam.findAll({ where: { createdBy: req.user.id }, attributes: ['id'] });
        const examIds = instructorExams.map((exam) => exam.id);
        where.examId = { [Op.in]: examIds };
      }

      const { count, rows } = await ExamAttempt.findAndCountAll({
        where,
        include: [
          { model: User, attributes: ['name', 'email', 'role', 'department'] },
          { model: Exam, attributes: ['title', 'category', 'totalMarks', 'passingMarks', 'duration'] },
        ],
        order: [[sortBy, sortOrder]],
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
    const result = await ExamAttempt.findByPk(req.params.id, {
      include: [
        { model: User, attributes: ['name', 'email', 'role', 'department'] },
        { model: Exam, attributes: ['title', 'description', 'category', 'totalMarks', 'passingMarks', 'settings'] },
        { model: Question, attributes: ['text', 'options', 'correctAnswer', 'explanation', 'difficulty', 'category'] },
      ],
    });

    if (!result) {
      return res.status(404).json({
        success: false,
        message: "Result not found",
      });
    }

    let canView = false;
    if (req.user.role === "admin") {
      canView = true;
    } else if (req.user.role === "instructor") {
      const exam = await Exam.findByPk(result.examId);
      canView = exam && exam.createdBy === req.user.id;
    } else if (req.user.role === "student") {
      canView = result.userId === req.user.id;
    }

    if (!canView) {
      return res.status(403).json({
        success: false,
        message: "Not authorized to view this result",
      });
    }

    res.status(200).json({
      success: true,
      data: result,
    });
  } catch (error) {
    console.error("Get result error:", error);
    res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
});

module.exports = router;
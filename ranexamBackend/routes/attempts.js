const express = require("express");
const { body, validationResult } = require("express-validator");
const { ExamAttempt, Exam, Question, User, sequelize } = require("../models");
const { protect, authorize } = require("../middleware/auth");
const { Op } = require("sequelize");
const router = express.Router();

// Apply protection to all routes
router.use(protect);

// @desc    Start new exam attempt
// @route   POST /api/attempts/start
// @access  Private (Student)
router.post(
  "/start",
  [body("examId").isInt().withMessage("Valid exam ID is required")],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          errors: errors.array(),
        });
      }

      const { examId } = req.body;

      const exam = await Exam.findByPk(examId, { include: [Question] });
      if (!exam) {
        return res.status(404).json({
          success: false,
          message: "Exam not found",
        });
      }

      const previousAttempts = await ExamAttempt.count({
        where: { examId, userId: req.user.id },
      });

      if (previousAttempts >= (exam.settings.maxAttempts || 1)) {
        return res.status(403).json({
          success: false,
          message: "Maximum attempts exceeded",
        });
      }

      const existingAttempt = await ExamAttempt.findOne({
        where: { examId, userId: req.user.id, status: "in-progress" },
      });

      if (existingAttempt) {
        return res.status(200).json({
          success: true,
          message: "Resuming existing attempt",
          data: existingAttempt,
        });
      }

      let questions = exam.Questions;
      if (exam.settings && exam.settings.randomizeQuestions) {
        questions = questions.sort(() => Math.random() - 0.5);
      }

      const answers = questions.map((question) => ({
        questionId: question.id,
      }));

      const attempt = await ExamAttempt.create({
        examId,
        userId: req.user.id,
        attemptNumber: previousAttempts + 1,
        timeRemaining: exam.duration * 60,
        answers,
        score: {
          obtained: 0,
          total: exam.totalMarks,
          percentage: 0,
        },
        metadata: {
          ipAddress: req.ip,
          userAgent: req.get("User-Agent"),
        },
        startTime: new Date(),
      });

      res.status(201).json({
        success: true,
        message: "Exam attempt started successfully",
        data: attempt,
      });
    } catch (error) {
      console.error("Start exam attempt error:", error);
      res.status(500).json({
        success: false,
        message: "Server error during exam start",
      });
    }
  },
);

// @desc    Get current attempt
// @route   GET /api/attempts/current/:examId
// @access  Private (Student)
router.get("/current/:examId", async (req, res) => {
  try {
    const attempt = await ExamAttempt.findOne({
      where: { examId: req.params.examId, userId: req.user.id, status: "in-progress" },
      include: [Exam],
    });

    if (!attempt) {
      return res.status(404).json({
        success: false,
        message: "No active attempt found",
      });
    }

    res.status(200).json({
      success: true,
      data: attempt,
    });
  } catch (error) {
    console.error("Get current attempt error:", error);
    res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
});

// @desc    Submit answer for a question
// @route   PUT /api/attempts/:id/answer
// @access  Private (Student)
router.put(
  "/:id/answer",
  [body("questionId").isInt().withMessage("Valid question ID is required")],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          errors: errors.array(),
        });
      }

      const { questionId, selectedOption, textAnswer, timeSpent } = req.body;

      const attempt = await ExamAttempt.findByPk(req.params.id);
      if (!attempt) {
        return res.status(404).json({
          success: false,
          message: "Attempt not found",
        });
      }

      if (attempt.userId !== req.user.id) {
        return res.status(403).json({
          success: false,
          message: "Not authorized to modify this attempt",
        });
      }

      if (attempt.status !== "in-progress") {
        return res.status(400).json({
          success: false,
          message: "Cannot modify completed attempt",
        });
      }

      const answers = attempt.answers.map(ans => {
        if (ans.questionId === questionId) {
          return { ...ans, selectedOption, textAnswer, timeSpent, answeredAt: new Date(), visited: true };
        }
        return ans;
      });
      await attempt.update({ answers });

      res.status(200).json({
        success: true,
        message: "Answer submitted successfully",
      });
    } catch (error) {
      console.error("Submit answer error:", error);
      res.status(500).json({
        success: false,
        message: "Server error during answer submission",
      });
    }
  },
);

// @desc    Submit exam attempt
// @route   POST /api/attempts/:id/submit
// @access  Private (Student)
router.post("/:id/submit", async (req, res) => {
  try {
    const attempt = await ExamAttempt.findByPk(req.params.id, { include: [Exam] });
    if (!attempt) {
      return res.status(404).json({
        success: false,
        message: "Attempt not found",
      });
    }

    if (attempt.userId !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: "Not authorized to submit this attempt",
      });
    }

    if (attempt.status !== "in-progress") {
      return res.status(400).json({
        success: false,
        message: "Attempt is not in progress",
      });
    }

    let score = 0;
    const answers = await Promise.all(attempt.answers.map(async (answer) => {
      const question = await Question.findByPk(answer.questionId);
      if (question && answer.selectedOption === question.correctAnswer) {
        answer.isCorrect = true;
        answer.marksAwarded = question.marks || 1;
        score += answer.marksAwarded;
      } else {
        answer.isCorrect = false;
      }
      return answer;
    }));

    const percentage = (score / attempt.Exam.totalMarks) * 100;

    await attempt.update({
      endTime: new Date(),
      status: "completed",
      score: {
        obtained: score,
        total: attempt.Exam.totalMarks,
        percentage: percentage,
      },
      result: {
        passed: percentage >= ((attempt.Exam.passingMarks / attempt.Exam.totalMarks) * 100)
      },
      answers,
    });

    res.status(200).json({
      success: true,
      message: "Exam submitted successfully",
      data: attempt,
    });
  } catch (error) {
    console.error("Submit exam error:", error);
    res.status(500).json({
      success: false,
      message: "Server error during exam submission",
    });
  }
});

module.exports = router;
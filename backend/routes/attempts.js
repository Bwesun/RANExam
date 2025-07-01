const express = require("express");
const { body, validationResult } = require("express-validator");
const ExamAttempt = require("../models/ExamAttempt");
const Exam = require("../models/Exam");
const Question = require("../models/Question");
const User = require("../models/User");
const { protect, authorize } = require("../middleware/auth");
const router = express.Router();

// Apply protection to all routes
router.use(protect);

// @desc    Start new exam attempt
// @route   POST /api/attempts/start
// @access  Private (Student)
router.post(
  "/start",
  [body("examId").isMongoId().withMessage("Valid exam ID is required")],
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

      // Get exam details
      const exam = await Exam.findById(examId).populate("questions");
      if (!exam) {
        return res.status(404).json({
          success: false,
          message: "Exam not found",
        });
      }

      // Check if exam is available
      const availability = exam.canUserTakeExam(req.user.id);
      if (!availability.canTake) {
        return res.status(403).json({
          success: false,
          message: availability.reason,
        });
      }

      // Check user's previous attempts
      const previousAttempts = await ExamAttempt.countDocuments({
        exam: examId,
        user: req.user.id,
      });

      if (previousAttempts >= exam.settings.maxAttempts) {
        return res.status(403).json({
          success: false,
          message: "Maximum attempts exceeded",
        });
      }

      // Check for existing in-progress attempt
      const existingAttempt = await ExamAttempt.findOne({
        exam: examId,
        user: req.user.id,
        status: "in-progress",
      });

      if (existingAttempt) {
        return res.status(200).json({
          success: true,
          message: "Resuming existing attempt",
          data: existingAttempt,
        });
      }

      // Get questions for the exam
      let questions = exam.questions;

      // Randomize questions if setting is enabled
      if (exam.settings.randomizeQuestions) {
        questions = questions.sort(() => Math.random() - 0.5);
      }

      // Prepare answers array
      const answers = questions.map((question) => ({
        question: question._id,
        selectedOption: undefined,
        textAnswer: "",
        isCorrect: undefined,
        marksAwarded: 0,
        timeSpent: 0,
        flagged: false,
        visited: false,
        answeredAt: undefined,
      }));

      // Create new attempt
      const attempt = await ExamAttempt.create({
        exam: examId,
        user: req.user.id,
        attemptNumber: previousAttempts + 1,
        timeRemaining: exam.duration * 60, // Convert to seconds
        answers,
        score: {
          obtained: 0,
          total: exam.totalMarks,
          percentage: 0,
        },
        metadata: {
          ipAddress: req.ip,
          userAgent: req.get("User-Agent"),
          timezone: req.body.timezone || "UTC",
        },
      });

      // Populate the attempt with exam and question details
      const populatedAttempt = await ExamAttempt.findById(attempt._id)
        .populate({
          path: "exam",
          select:
            "title duration totalMarks passingMarks instructions settings",
        })
        .populate({
          path: "answers.question",
          select:
            "text type options difficulty timeAllocation multimedia formatting",
        });

      // Remove sensitive information from questions
      populatedAttempt.answers = populatedAttempt.answers.map((answer) => ({
        ...answer.toObject(),
        question: answer.question.getExamVersion(),
      }));

      res.status(201).json({
        success: true,
        message: "Exam attempt started successfully",
        data: populatedAttempt,
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
      exam: req.params.examId,
      user: req.user.id,
      status: "in-progress",
    })
      .populate({
        path: "exam",
        select: "title duration totalMarks passingMarks instructions settings",
      })
      .populate({
        path: "answers.question",
        select:
          "text type options difficulty timeAllocation multimedia formatting",
      });

    if (!attempt) {
      return res.status(404).json({
        success: false,
        message: "No active attempt found",
      });
    }

    // Check if attempt has timed out
    const now = new Date();
    const examDuration = attempt.exam.duration * 60 * 1000; // Convert to milliseconds
    const timeElapsed = now - attempt.startTime;

    if (timeElapsed >= examDuration) {
      // Auto-submit the attempt
      await attempt.complete("timeout");

      return res.status(200).json({
        success: false,
        message: "Exam time has expired. Attempt has been auto-submitted.",
        timeExpired: true,
      });
    }

    // Update time remaining
    const timeRemaining = Math.max(
      0,
      Math.floor((examDuration - timeElapsed) / 1000),
    );
    attempt.timeRemaining = timeRemaining;
    await attempt.save();

    // Remove sensitive information from questions
    attempt.answers = attempt.answers.map((answer) => ({
      ...answer.toObject(),
      question: answer.question.getExamVersion(),
    }));

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
  [body("questionId").isMongoId().withMessage("Valid question ID is required")],
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

      const attempt = await ExamAttempt.findById(req.params.id);
      if (!attempt) {
        return res.status(404).json({
          success: false,
          message: "Attempt not found",
        });
      }

      // Check if user owns this attempt
      if (attempt.user.toString() !== req.user.id) {
        return res.status(403).json({
          success: false,
          message: "Not authorized to modify this attempt",
        });
      }

      // Check if attempt is still in progress
      if (attempt.status !== "in-progress") {
        return res.status(400).json({
          success: false,
          message: "Cannot modify completed attempt",
        });
      }

      // Submit the answer
      await attempt.submitAnswer(
        questionId,
        {
          selectedOption,
          textAnswer,
        },
        timeSpent,
      );

      res.status(200).json({
        success: true,
        message: "Answer submitted successfully",
      });
    } catch (error) {
      console.error("Submit answer error:", error);
      res.status(500).json({
        success: false,
        message: error.message || "Server error during answer submission",
      });
    }
  },
);

// @desc    Flag/unflag question
// @route   PUT /api/attempts/:id/flag/:questionIndex
// @access  Private (Student)
router.put("/:id/flag/:questionIndex", async (req, res) => {
  try {
    const attempt = await ExamAttempt.findById(req.params.id);
    if (!attempt) {
      return res.status(404).json({
        success: false,
        message: "Attempt not found",
      });
    }

    // Check if user owns this attempt
    if (attempt.user.toString() !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: "Not authorized to modify this attempt",
      });
    }

    // Check if attempt is still in progress
    if (attempt.status !== "in-progress") {
      return res.status(400).json({
        success: false,
        message: "Cannot modify completed attempt",
      });
    }

    await attempt.toggleFlag(parseInt(req.params.questionIndex));

    res.status(200).json({
      success: true,
      message: "Question flag toggled successfully",
    });
  } catch (error) {
    console.error("Toggle flag error:", error);
    res.status(500).json({
      success: false,
      message: error.message || "Server error during flag toggle",
    });
  }
});

// @desc    Submit exam attempt
// @route   POST /api/attempts/:id/submit
// @access  Private (Student)
router.post("/:id/submit", async (req, res) => {
  try {
    const attempt = await ExamAttempt.findById(req.params.id);
    if (!attempt) {
      return res.status(404).json({
        success: false,
        message: "Attempt not found",
      });
    }

    // Check if user owns this attempt
    if (attempt.user.toString() !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: "Not authorized to submit this attempt",
      });
    }

    // Check if attempt is still in progress
    if (attempt.status !== "in-progress") {
      return res.status(400).json({
        success: false,
        message: "Attempt is not in progress",
      });
    }

    // Complete the attempt
    await attempt.complete("manual");

    // Update exam analytics
    const exam = await Exam.findById(attempt.exam);
    if (exam) {
      await exam.updateAnalytics({
        status: "completed",
        percentage: attempt.score.percentage,
        passed: attempt.result.passed,
        timeSpent: attempt.timeSpent,
      });
    }

    // Update user exam stats
    const user = await User.findById(req.user.id);
    if (user) {
      await user.updateExamStats({
        percentage: attempt.score.percentage,
        passed: attempt.result.passed,
        timeSpent: attempt.timeSpent,
      });
    }

    // Update question analytics
    for (const answer of attempt.answers) {
      const question = await Question.findById(answer.question);
      if (question) {
        await question.updateAnalytics(
          answer.isCorrect || false,
          answer.timeSpent || 0,
        );
      }
    }

    const populatedAttempt = await ExamAttempt.findById(attempt._id)
      .populate("exam", "title totalMarks passingMarks")
      .populate("user", "name email");

    res.status(200).json({
      success: true,
      message: "Exam submitted successfully",
      data: {
        id: populatedAttempt._id,
        examTitle: populatedAttempt.exam.title,
        score: populatedAttempt.score,
        result: populatedAttempt.result,
        timeSpent: populatedAttempt.timeSpent,
        submittedAt: populatedAttempt.submission.submittedAt,
      },
    });
  } catch (error) {
    console.error("Submit exam error:", error);
    res.status(500).json({
      success: false,
      message: "Server error during exam submission",
    });
  }
});

// @desc    Get user's attempts for an exam
// @route   GET /api/attempts/exam/:examId
// @access  Private
router.get("/exam/:examId", async (req, res) => {
  try {
    const query = {
      exam: req.params.examId,
    };

    // Students can only see their own attempts
    if (req.user.role === "student") {
      query.user = req.user.id;
    }

    // Instructors can see attempts for their exams
    if (req.user.role === "instructor") {
      const exam = await Exam.findById(req.params.examId);
      if (!exam) {
        return res.status(404).json({
          success: false,
          message: "Exam not found",
        });
      }

      if (exam.createdBy.toString() !== req.user.id) {
        return res.status(403).json({
          success: false,
          message: "Not authorized to view these attempts",
        });
      }
    }

    const attempts = await ExamAttempt.find(query)
      .populate("user", "name email")
      .populate("exam", "title totalMarks passingMarks")
      .sort({ createdAt: -1 })
      .select("-answers"); // Exclude detailed answers for performance

    res.status(200).json({
      success: true,
      count: attempts.length,
      data: attempts,
    });
  } catch (error) {
    console.error("Get exam attempts error:", error);
    res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
});

// @desc    Get user's all attempts
// @route   GET /api/attempts/my-attempts
// @access  Private (Student)
router.get("/my-attempts", async (req, res) => {
  try {
    const { page = 1, limit = 10, status } = req.query;

    const query = { user: req.user.id };
    if (status) {
      query.status = status;
    }

    const attempts = await ExamAttempt.find(query)
      .populate("exam", "title category totalMarks passingMarks")
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .select("-answers");

    const total = await ExamAttempt.countDocuments(query);

    res.status(200).json({
      success: true,
      count: attempts.length,
      total,
      page: parseInt(page),
      pages: Math.ceil(total / limit),
      data: attempts,
    });
  } catch (error) {
    console.error("Get my attempts error:", error);
    res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
});

// @desc    Get detailed attempt result
// @route   GET /api/attempts/:id/result
// @access  Private
router.get("/:id/result", async (req, res) => {
  try {
    const attempt = await ExamAttempt.findById(req.params.id)
      .populate("exam", "title description totalMarks passingMarks settings")
      .populate("user", "name email")
      .populate({
        path: "answers.question",
        select: "text options correctAnswer explanation difficulty category",
      });

    if (!attempt) {
      return res.status(404).json({
        success: false,
        message: "Attempt not found",
      });
    }

    // Check permissions
    let canView = false;

    if (req.user.role === "admin") {
      canView = true;
    } else if (req.user.role === "instructor") {
      const exam = await Exam.findById(attempt.exam._id);
      canView = exam && exam.createdBy.toString() === req.user.id;
    } else if (req.user.role === "student") {
      canView =
        attempt.user._id.toString() === req.user.id &&
        attempt.status === "completed";
    }

    if (!canView) {
      return res.status(403).json({
        success: false,
        message: "Not authorized to view this result",
      });
    }

    // Check if results should be shown to students
    if (req.user.role === "student" && !attempt.exam.settings.showResults) {
      return res.status(403).json({
        success: false,
        message: "Results are not available for this exam",
      });
    }

    // For students, filter sensitive information
    let resultData = attempt.toObject();

    if (req.user.role === "student") {
      // Remove sensitive metadata
      delete resultData.metadata;
      delete resultData.proctoring;
      delete resultData.analytics;

      // Show correct answers only if setting allows
      if (!attempt.exam.settings.showCorrectAnswers) {
        resultData.answers = resultData.answers.map((answer) => {
          const answerObj = { ...answer };
          delete answerObj.question.correctAnswer;
          delete answerObj.question.explanation;
          return answerObj;
        });
      }
    }

    res.status(200).json({
      success: true,
      data: resultData,
    });
  } catch (error) {
    console.error("Get attempt result error:", error);
    res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
});

// @desc    Update attempt metadata (for proctoring)
// @route   PUT /api/attempts/:id/metadata
// @access  Private (Student)
router.put("/:id/metadata", async (req, res) => {
  try {
    const attempt = await ExamAttempt.findById(req.params.id);
    if (!attempt) {
      return res.status(404).json({
        success: false,
        message: "Attempt not found",
      });
    }

    // Check if user owns this attempt
    if (attempt.user.toString() !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: "Not authorized to modify this attempt",
      });
    }

    const { violations, webcamSnapshot, screenResolution, browserInfo } =
      req.body;

    // Update violations
    if (violations && Array.isArray(violations)) {
      attempt.proctoring.violations.push(...violations);
      attempt.proctoring.totalViolations = attempt.proctoring.violations.length;

      // Flag attempt if too many violations
      const criticalViolations = attempt.proctoring.violations.filter(
        (v) => v.severity === "critical",
      ).length;
      if (criticalViolations >= 3) {
        attempt.proctoring.flagged = true;
      }
    }

    // Update webcam snapshot
    if (webcamSnapshot) {
      attempt.proctoring.webcamSnapshots.push({
        timestamp: new Date(),
        imageUrl: webcamSnapshot,
      });
    }

    // Update metadata
    if (screenResolution) {
      attempt.metadata.screenResolution = screenResolution;
    }

    if (browserInfo) {
      attempt.metadata.browserInfo = browserInfo;
    }

    await attempt.save();

    res.status(200).json({
      success: true,
      message: "Metadata updated successfully",
    });
  } catch (error) {
    console.error("Update metadata error:", error);
    res.status(500).json({
      success: false,
      message: "Server error during metadata update",
    });
  }
});

module.exports = router;

const mongoose = require("mongoose");

const examAttemptSchema = new mongoose.Schema(
  {
    exam: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Exam",
      required: true,
    },
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    attemptNumber: {
      type: Number,
      required: true,
      min: 1,
    },
    status: {
      type: String,
      enum: ["in-progress", "completed", "abandoned", "timeout", "suspended"],
      default: "in-progress",
    },
    startTime: {
      type: Date,
      required: true,
      default: Date.now,
    },
    endTime: {
      type: Date,
    },
    timeSpent: {
      type: Number, // in seconds
      default: 0,
    },
    timeRemaining: {
      type: Number, // in seconds
      required: true,
    },
    answers: [
      {
        question: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "Question",
          required: true,
        },
        selectedOption: {
          type: Number,
        },
        textAnswer: {
          type: String,
          maxlength: [5000, "Answer cannot exceed 5000 characters"],
        },
        isCorrect: {
          type: Boolean,
        },
        marksAwarded: {
          type: Number,
          default: 0,
        },
        timeSpent: {
          type: Number, // in seconds
          default: 0,
        },
        flagged: {
          type: Boolean,
          default: false,
        },
        visited: {
          type: Boolean,
          default: false,
        },
        answeredAt: {
          type: Date,
        },
      },
    ],
    currentQuestion: {
      type: Number,
      default: 0,
    },
    score: {
      obtained: {
        type: Number,
        default: 0,
      },
      total: {
        type: Number,
        required: true,
      },
      percentage: {
        type: Number,
        default: 0,
      },
    },
    result: {
      passed: {
        type: Boolean,
      },
      grade: {
        type: String,
        enum: [
          "A+",
          "A",
          "A-",
          "B+",
          "B",
          "B-",
          "C+",
          "C",
          "C-",
          "D+",
          "D",
          "F",
        ],
      },
      rank: {
        type: Number,
      },
      percentile: {
        type: Number,
      },
    },
    metadata: {
      ipAddress: {
        type: String,
      },
      userAgent: {
        type: String,
      },
      browserInfo: {
        name: String,
        version: String,
        platform: String,
      },
      screenResolution: {
        width: Number,
        height: Number,
      },
      timezone: {
        type: String,
      },
    },
    proctoring: {
      webcamSnapshots: [
        {
          timestamp: Date,
          imageUrl: String,
        },
      ],
      violations: [
        {
          type: {
            type: String,
            enum: [
              "tab-switch",
              "window-blur",
              "fullscreen-exit",
              "copy-attempt",
              "paste-attempt",
              "suspicious-activity",
            ],
          },
          timestamp: Date,
          description: String,
          severity: {
            type: String,
            enum: ["low", "medium", "high", "critical"],
            default: "medium",
          },
        },
      ],
      totalViolations: {
        type: Number,
        default: 0,
      },
      flagged: {
        type: Boolean,
        default: false,
      },
    },
    submission: {
      submittedAt: {
        type: Date,
      },
      autoSubmitted: {
        type: Boolean,
        default: false,
      },
      submissionMethod: {
        type: String,
        enum: ["manual", "timeout", "force-submit"],
        default: "manual",
      },
    },
    review: {
      reviewed: {
        type: Boolean,
        default: false,
      },
      reviewedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
      },
      reviewedAt: {
        type: Date,
      },
      reviewNotes: {
        type: String,
        maxlength: [2000, "Review notes cannot exceed 2000 characters"],
      },
      adjustedScore: {
        type: Number,
      },
      adjustmentReason: {
        type: String,
        maxlength: [500, "Adjustment reason cannot exceed 500 characters"],
      },
    },
    analytics: {
      questionOrder: [Number],
      timePerQuestion: [
        {
          questionIndex: Number,
          timeSpent: Number,
        },
      ],
      navigationPattern: [
        {
          action: {
            type: String,
            enum: ["visit", "answer", "flag", "unflag", "review"],
          },
          questionIndex: Number,
          timestamp: Date,
        },
      ],
      pauseEvents: [
        {
          startTime: Date,
          endTime: Date,
          duration: Number,
          reason: String,
        },
      ],
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  },
);

// Compound indexes
examAttemptSchema.index(
  { exam: 1, user: 1, attemptNumber: 1 },
  { unique: true },
);
examAttemptSchema.index({ user: 1, status: 1 });
examAttemptSchema.index({ exam: 1, status: 1 });
examAttemptSchema.index({ startTime: -1 });
examAttemptSchema.index({ "result.passed": 1 });
examAttemptSchema.index({ "score.percentage": -1 });

// Virtual for duration
examAttemptSchema.virtual("duration").get(function () {
  if (this.endTime && this.startTime) {
    return Math.floor((this.endTime - this.startTime) / 1000); // in seconds
  }
  return this.timeSpent;
});

// Virtual for completion percentage
examAttemptSchema.virtual("completionPercentage").get(function () {
  const totalQuestions = this.answers.length;
  const answeredQuestions = this.answers.filter(
    (answer) => answer.selectedOption !== undefined || answer.textAnswer,
  ).length;

  return totalQuestions > 0
    ? Math.round((answeredQuestions / totalQuestions) * 100)
    : 0;
});

// Virtual for accuracy
examAttemptSchema.virtual("accuracy").get(function () {
  const answeredQuestions = this.answers.filter(
    (answer) => answer.isCorrect !== undefined,
  );
  const correctAnswers = this.answers.filter(
    (answer) => answer.isCorrect === true,
  );

  return answeredQuestions.length > 0
    ? Math.round((correctAnswers.length / answeredQuestions.length) * 100)
    : 0;
});

// Pre-save middleware
examAttemptSchema.pre("save", function (next) {
  // Calculate time spent if endTime is set
  if (this.endTime && this.startTime && !this.timeSpent) {
    this.timeSpent = Math.floor((this.endTime - this.startTime) / 1000);
  }

  // Calculate score percentage
  if (this.score.total > 0) {
    this.score.percentage = Math.round(
      (this.score.obtained / this.score.total) * 100,
    );
  }

  next();
});

// Method to submit answer
examAttemptSchema.methods.submitAnswer = function (
  questionId,
  answer,
  timeSpent = 0,
) {
  const answerIndex = this.answers.findIndex(
    (a) => a.question.toString() === questionId.toString(),
  );

  if (answerIndex === -1) {
    throw new Error("Question not found in this attempt");
  }

  this.answers[answerIndex].selectedOption = answer.selectedOption;
  this.answers[answerIndex].textAnswer = answer.textAnswer;
  this.answers[answerIndex].timeSpent = timeSpent;
  this.answers[answerIndex].answeredAt = new Date();
  this.answers[answerIndex].visited = true;

  return this.save();
};

// Method to flag/unflag question
examAttemptSchema.methods.toggleFlag = function (questionIndex) {
  if (questionIndex >= 0 && questionIndex < this.answers.length) {
    this.answers[questionIndex].flagged = !this.answers[questionIndex].flagged;
    return this.save();
  }
  throw new Error("Invalid question index");
};

// Method to calculate final score
examAttemptSchema.methods.calculateScore = async function () {
  await this.populate("answers.question");

  let obtainedMarks = 0;

  for (let answer of this.answers) {
    const question = answer.question;

    if (question.type === "multiple-choice" || question.type === "true-false") {
      if (answer.selectedOption === question.correctAnswer) {
        answer.isCorrect = true;
        answer.marksAwarded = question.marks || 1;
        obtainedMarks += answer.marksAwarded;
      } else if (answer.selectedOption !== undefined) {
        answer.isCorrect = false;

        // Apply negative marking if enabled
        if (question.negativeMarking && question.negativeMarking.enabled) {
          const penalty =
            (question.marks || 1) * question.negativeMarking.penalty;
          answer.marksAwarded = -penalty;
          obtainedMarks -= penalty;
        }
      }
    }
  }

  this.score.obtained = Math.max(0, obtainedMarks); // Ensure score is not negative
  this.score.percentage = Math.round(
    (this.score.obtained / this.score.total) * 100,
  );

  return this.save();
};

// Method to determine pass/fail
examAttemptSchema.methods.determineResult = async function () {
  await this.populate("exam");

  const passingPercentage = Math.round(
    (this.exam.passingMarks / this.exam.totalMarks) * 100,
  );
  this.result.passed = this.score.percentage >= passingPercentage;

  // Assign grade based on percentage
  if (this.score.percentage >= 97) this.result.grade = "A+";
  else if (this.score.percentage >= 93) this.result.grade = "A";
  else if (this.score.percentage >= 90) this.result.grade = "A-";
  else if (this.score.percentage >= 87) this.result.grade = "B+";
  else if (this.score.percentage >= 83) this.result.grade = "B";
  else if (this.score.percentage >= 80) this.result.grade = "B-";
  else if (this.score.percentage >= 77) this.result.grade = "C+";
  else if (this.score.percentage >= 73) this.result.grade = "C";
  else if (this.score.percentage >= 70) this.result.grade = "C-";
  else if (this.score.percentage >= 67) this.result.grade = "D+";
  else if (this.score.percentage >= 60) this.result.grade = "D";
  else this.result.grade = "F";

  return this.save();
};

// Method to complete attempt
examAttemptSchema.methods.complete = async function (
  submissionMethod = "manual",
) {
  this.status = "completed";
  this.endTime = new Date();
  this.submission.submittedAt = new Date();
  this.submission.submissionMethod = submissionMethod;

  if (submissionMethod === "timeout") {
    this.submission.autoSubmitted = true;
  }

  await this.calculateScore();
  await this.determineResult();

  return this.save();
};

// Static method to get attempt statistics
examAttemptSchema.statics.getAttemptStats = function (examId) {
  return this.aggregate([
    { $match: { exam: mongoose.Types.ObjectId(examId), status: "completed" } },
    {
      $group: {
        _id: null,
        totalAttempts: { $sum: 1 },
        averageScore: { $avg: "$score.percentage" },
        highestScore: { $max: "$score.percentage" },
        lowestScore: { $min: "$score.percentage" },
        passCount: {
          $sum: { $cond: [{ $eq: ["$result.passed", true] }, 1, 0] },
        },
        averageTimeSpent: { $avg: "$timeSpent" },
      },
    },
    {
      $addFields: {
        passRate: {
          $multiply: [{ $divide: ["$passCount", "$totalAttempts"] }, 100],
        },
      },
    },
  ]);
};

module.exports = mongoose.model("ExamAttempt", examAttemptSchema);

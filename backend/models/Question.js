const mongoose = require("mongoose");

const questionSchema = new mongoose.Schema(
  {
    text: {
      type: String,
      required: [true, "Question text is required"],
      trim: true,
      maxlength: [2000, "Question text cannot exceed 2000 characters"],
    },
    type: {
      type: String,
      enum: ["multiple-choice", "true-false", "fill-blank", "essay"],
      default: "multiple-choice",
    },
    options: [
      {
        text: {
          type: String,
          required: true,
          trim: true,
          maxlength: [500, "Option text cannot exceed 500 characters"],
        },
        isCorrect: {
          type: Boolean,
          default: false,
        },
        explanation: {
          type: String,
          trim: true,
          maxlength: [1000, "Option explanation cannot exceed 1000 characters"],
        },
      },
    ],
    correctAnswer: {
      type: Number,
      required: function () {
        return this.type === "multiple-choice" || this.type === "true-false";
      },
      min: 0,
    },
    explanation: {
      type: String,
      trim: true,
      maxlength: [2000, "Explanation cannot exceed 2000 characters"],
    },
    difficulty: {
      type: String,
      enum: ["easy", "medium", "hard"],
      default: "medium",
    },
    category: {
      type: String,
      required: [true, "Category is required"],
      trim: true,
      maxlength: [100, "Category cannot exceed 100 characters"],
    },
    subject: {
      type: String,
      trim: true,
      maxlength: [100, "Subject cannot exceed 100 characters"],
    },
    topic: {
      type: String,
      trim: true,
      maxlength: [100, "Topic cannot exceed 100 characters"],
    },
    marks: {
      type: Number,
      default: 1,
      min: [0.5, "Marks must be at least 0.5"],
      max: [10, "Marks cannot exceed 10"],
    },
    negativeMarking: {
      enabled: {
        type: Boolean,
        default: false,
      },
      penalty: {
        type: Number,
        default: 0.25,
        min: 0,
        max: 1,
      },
    },
    timeAllocation: {
      type: Number, // in seconds
      min: [10, "Time allocation must be at least 10 seconds"],
      max: [600, "Time allocation cannot exceed 10 minutes"],
    },
    multimedia: {
      image: {
        url: String,
        alt: String,
        caption: String,
      },
      audio: {
        url: String,
        duration: Number,
      },
      video: {
        url: String,
        duration: Number,
        thumbnail: String,
      },
    },
    formatting: {
      mathFormula: {
        type: Boolean,
        default: false,
      },
      codeSnippet: {
        type: Boolean,
        default: false,
      },
      language: {
        type: String,
        enum: [
          "javascript",
          "python",
          "java",
          "cpp",
          "html",
          "css",
          "sql",
          "other",
        ],
      },
    },
    analytics: {
      totalAttempts: {
        type: Number,
        default: 0,
      },
      correctAttempts: {
        type: Number,
        default: 0,
      },
      averageTimeSpent: {
        type: Number,
        default: 0,
      },
      difficultyIndex: {
        type: Number,
        default: 0,
        min: 0,
        max: 1,
      },
      discriminationIndex: {
        type: Number,
        default: 0,
        min: -1,
        max: 1,
      },
    },
    tags: [
      {
        type: String,
        trim: true,
        maxlength: [50, "Tag cannot exceed 50 characters"],
      },
    ],
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    lastModifiedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
    version: {
      type: Number,
      default: 1,
    },
    status: {
      type: String,
      enum: ["draft", "review", "approved", "archived"],
      default: "draft",
    },
    reviewNotes: {
      type: String,
      maxlength: [1000, "Review notes cannot exceed 1000 characters"],
    },
    usageCount: {
      type: Number,
      default: 0,
    },
    lastUsed: {
      type: Date,
    },
    bloomsLevel: {
      type: String,
      enum: [
        "remember",
        "understand",
        "apply",
        "analyze",
        "evaluate",
        "create",
      ],
    },
    cognitiveLevel: {
      type: String,
      enum: [
        "knowledge",
        "comprehension",
        "application",
        "analysis",
        "synthesis",
        "evaluation",
      ],
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  },
);

// Indexes
questionSchema.index({ createdBy: 1 });
questionSchema.index({ category: 1 });
questionSchema.index({ difficulty: 1 });
questionSchema.index({ subject: 1 });
questionSchema.index({ topic: 1 });
questionSchema.index({ status: 1 });
questionSchema.index({ tags: 1 });
questionSchema.index({ usageCount: -1 });
questionSchema.index({ createdAt: -1 });

// Virtual for correct percentage
questionSchema.virtual("correctPercentage").get(function () {
  if (this.analytics.totalAttempts === 0) return 0;
  return Math.round(
    (this.analytics.correctAttempts / this.analytics.totalAttempts) * 100,
  );
});

// Virtual for option count
questionSchema.virtual("optionCount").get(function () {
  return this.options ? this.options.length : 0;
});

// Pre-save validation
questionSchema.pre("save", function (next) {
  // Validate that only one option is marked as correct for multiple choice
  if (this.type === "multiple-choice") {
    const correctOptions = this.options.filter((option) => option.isCorrect);
    if (correctOptions.length !== 1) {
      return next(
        new Error(
          "Multiple choice questions must have exactly one correct option",
        ),
      );
    }

    // Set correctAnswer index
    this.correctAnswer = this.options.findIndex((option) => option.isCorrect);
  }

  // Validate minimum options for multiple choice
  if (this.type === "multiple-choice" && this.options.length < 2) {
    return next(
      new Error("Multiple choice questions must have at least 2 options"),
    );
  }

  // Validate maximum options
  if (this.options.length > 5) {
    return next(new Error("Questions cannot have more than 5 options"));
  }

  next();
});

// Method to update analytics
questionSchema.methods.updateAnalytics = function (isCorrect, timeSpent) {
  this.analytics.totalAttempts += 1;

  if (isCorrect) {
    this.analytics.correctAttempts += 1;
  }

  // Update average time spent
  const totalTime =
    this.analytics.averageTimeSpent * (this.analytics.totalAttempts - 1) +
    timeSpent;
  this.analytics.averageTimeSpent = Math.round(
    totalTime / this.analytics.totalAttempts,
  );

  // Update difficulty index (percentage of students who answered correctly)
  this.analytics.difficultyIndex =
    this.analytics.correctAttempts / this.analytics.totalAttempts;

  this.lastUsed = new Date();
  this.usageCount += 1;

  return this.save();
};

// Method to get question for exam (without showing correct answer)
questionSchema.methods.getExamVersion = function () {
  const examQuestion = this.toObject();

  // Remove correct answer information
  delete examQuestion.correctAnswer;
  delete examQuestion.explanation;

  // Remove isCorrect from options
  examQuestion.options = examQuestion.options.map((option) => ({
    text: option.text,
    _id: option._id,
  }));

  // Remove analytics and internal data
  delete examQuestion.analytics;
  delete examQuestion.createdBy;
  delete examQuestion.lastModifiedBy;
  delete examQuestion.status;
  delete examQuestion.reviewNotes;
  delete examQuestion.usageCount;
  delete examQuestion.lastUsed;

  return examQuestion;
};

// Static method to get questions by difficulty distribution
questionSchema.statics.getByDifficultyDistribution = function (
  category,
  distribution,
) {
  const { easy = 0, medium = 0, hard = 0 } = distribution;

  return Promise.all([
    this.aggregate([
      { $match: { category, difficulty: "easy", status: "approved" } },
      { $sample: { size: easy } },
    ]),
    this.aggregate([
      { $match: { category, difficulty: "medium", status: "approved" } },
      { $sample: { size: medium } },
    ]),
    this.aggregate([
      { $match: { category, difficulty: "hard", status: "approved" } },
      { $sample: { size: hard } },
    ]),
  ]).then(([easyQuestions, mediumQuestions, hardQuestions]) => {
    return [...easyQuestions, ...mediumQuestions, ...hardQuestions];
  });
};

// Static method to get similar questions
questionSchema.statics.getSimilarQuestions = function (questionId, limit = 5) {
  return this.findById(questionId).then((question) => {
    if (!question) throw new Error("Question not found");

    return this.find({
      _id: { $ne: questionId },
      $or: [
        { category: question.category },
        { subject: question.subject },
        { topic: question.topic },
        { tags: { $in: question.tags } },
      ],
      status: "approved",
    })
      .limit(limit)
      .select("text category difficulty marks")
      .lean();
  });
};

module.exports = mongoose.model("Question", questionSchema);

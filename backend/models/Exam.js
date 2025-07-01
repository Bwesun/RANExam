const mongoose = require("mongoose");

const examSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, "Exam title is required"],
      trim: true,
      maxlength: [200, "Title cannot exceed 200 characters"],
    },
    description: {
      type: String,
      trim: true,
      maxlength: [1000, "Description cannot exceed 1000 characters"],
    },
    category: {
      type: String,
      required: [true, "Category is required"],
      trim: true,
      maxlength: [100, "Category cannot exceed 100 characters"],
    },
    duration: {
      type: Number,
      required: [true, "Duration is required"],
      min: [1, "Duration must be at least 1 minute"],
      max: [600, "Duration cannot exceed 600 minutes"],
    },
    totalMarks: {
      type: Number,
      required: [true, "Total marks is required"],
      min: [1, "Total marks must be at least 1"],
    },
    passingMarks: {
      type: Number,
      required: [true, "Passing marks is required"],
      min: [1, "Passing marks must be at least 1"],
    },
    instructions: {
      type: String,
      default:
        "Read all questions carefully. Select the best answer for each question.",
      maxlength: [2000, "Instructions cannot exceed 2000 characters"],
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    questions: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Question",
      },
    ],
    settings: {
      randomizeQuestions: {
        type: Boolean,
        default: false,
      },
      randomizeOptions: {
        type: Boolean,
        default: false,
      },
      showResults: {
        type: Boolean,
        default: true,
      },
      showCorrectAnswers: {
        type: Boolean,
        default: true,
      },
      allowReview: {
        type: Boolean,
        default: true,
      },
      maxAttempts: {
        type: Number,
        default: 1,
        min: [1, "Max attempts must be at least 1"],
        max: [10, "Max attempts cannot exceed 10"],
      },
      timeLimit: {
        type: Boolean,
        default: true,
      },
      proctored: {
        type: Boolean,
        default: false,
      },
      webcamRequired: {
        type: Boolean,
        default: false,
      },
      fullScreenRequired: {
        type: Boolean,
        default: false,
      },
      preventCopy: {
        type: Boolean,
        default: true,
      },
      shuffleAnswers: {
        type: Boolean,
        default: false,
      },
    },
    schedule: {
      startDate: {
        type: Date,
      },
      endDate: {
        type: Date,
      },
      timezone: {
        type: String,
        default: "UTC",
      },
    },
    accessibility: {
      allowScreenReader: {
        type: Boolean,
        default: true,
      },
      fontSize: {
        type: String,
        enum: ["small", "medium", "large", "extra-large"],
        default: "medium",
      },
      highContrast: {
        type: Boolean,
        default: false,
      },
      extraTime: {
        type: Number, // percentage
        default: 0,
        min: 0,
        max: 100,
      },
    },
    analytics: {
      totalAttempts: {
        type: Number,
        default: 0,
      },
      completedAttempts: {
        type: Number,
        default: 0,
      },
      averageScore: {
        type: Number,
        default: 0,
      },
      passRate: {
        type: Number,
        default: 0,
      },
      averageTimeSpent: {
        type: Number,
        default: 0,
      },
      difficultyRating: {
        type: Number,
        default: 0,
        min: 0,
        max: 5,
      },
    },
    tags: [
      {
        type: String,
        trim: true,
        maxlength: [50, "Tag cannot exceed 50 characters"],
      },
    ],
    difficulty: {
      type: String,
      enum: ["beginner", "intermediate", "advanced", "expert"],
      default: "intermediate",
    },
    estimatedTime: {
      type: Number, // in minutes
      min: [1, "Estimated time must be at least 1 minute"],
    },
    prerequisites: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Exam",
      },
    ],
    rewards: {
      certificate: {
        type: Boolean,
        default: false,
      },
      badge: {
        type: String,
        trim: true,
      },
      points: {
        type: Number,
        default: 0,
        min: 0,
      },
    },
    status: {
      type: String,
      enum: ["draft", "published", "archived", "suspended"],
      default: "draft",
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  },
);

// Indexes
examSchema.index({ createdBy: 1 });
examSchema.index({ category: 1 });
examSchema.index({ isActive: 1 });
examSchema.index({ status: 1 });
examSchema.index({ "schedule.startDate": 1, "schedule.endDate": 1 });
examSchema.index({ tags: 1 });
examSchema.index({ difficulty: 1 });
examSchema.index({ createdAt: -1 });

// Virtual for question count
examSchema.virtual("questionCount").get(function () {
  return this.questions ? this.questions.length : 0;
});

// Virtual for pass percentage
examSchema.virtual("passPercentage").get(function () {
  return Math.round((this.passingMarks / this.totalMarks) * 100);
});

// Virtual for availability status
examSchema.virtual("isAvailable").get(function () {
  if (!this.isActive || this.status !== "published") return false;

  const now = new Date();
  if (this.schedule.startDate && now < this.schedule.startDate) return false;
  if (this.schedule.endDate && now > this.schedule.endDate) return false;

  return true;
});

// Pre-save middleware to validate passing marks
examSchema.pre("save", function (next) {
  if (this.passingMarks > this.totalMarks) {
    const error = new Error("Passing marks cannot exceed total marks");
    return next(error);
  }
  next();
});

// Pre-save middleware to validate schedule
examSchema.pre("save", function (next) {
  if (this.schedule.startDate && this.schedule.endDate) {
    if (this.schedule.startDate >= this.schedule.endDate) {
      const error = new Error("Start date must be before end date");
      return next(error);
    }
  }
  next();
});

// Method to update analytics
examSchema.methods.updateAnalytics = function (result) {
  this.analytics.totalAttempts += 1;

  if (result.status === "completed") {
    this.analytics.completedAttempts += 1;

    // Update average score
    const totalScore =
      this.analytics.averageScore * (this.analytics.completedAttempts - 1) +
      result.percentage;
    this.analytics.averageScore =
      Math.round((totalScore / this.analytics.completedAttempts) * 100) / 100;

    // Update pass rate
    if (result.passed) {
      const totalPassed =
        Math.round(
          (this.analytics.passRate / 100) *
            (this.analytics.completedAttempts - 1),
        ) + 1;
      this.analytics.passRate = Math.round(
        (totalPassed / this.analytics.completedAttempts) * 100,
      );
    } else {
      const totalPassed = Math.round(
        (this.analytics.passRate / 100) *
          (this.analytics.completedAttempts - 1),
      );
      this.analytics.passRate = Math.round(
        (totalPassed / this.analytics.completedAttempts) * 100,
      );
    }

    // Update average time spent
    const totalTime =
      this.analytics.averageTimeSpent * (this.analytics.completedAttempts - 1) +
      result.timeSpent;
    this.analytics.averageTimeSpent = Math.round(
      totalTime / this.analytics.completedAttempts,
    );
  }

  return this.save();
};

// Method to check if user can take exam
examSchema.methods.canUserTakeExam = function (userId, userAttempts = 0) {
  if (!this.isAvailable)
    return { canTake: false, reason: "Exam is not available" };

  if (userAttempts >= this.settings.maxAttempts) {
    return { canTake: false, reason: "Maximum attempts exceeded" };
  }

  return { canTake: true };
};

// Static method to get public exam info
examSchema.statics.getPublicInfo = function (examId) {
  return this.findById(examId)
    .select(
      "title description category duration totalMarks passingMarks instructions difficulty estimatedTime tags",
    )
    .populate("createdBy", "name")
    .lean();
};

module.exports = mongoose.model("Exam", examSchema);

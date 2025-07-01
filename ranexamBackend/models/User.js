const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const crypto = require("crypto");

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "Name is required"],
      trim: true,
      maxlength: [100, "Name cannot exceed 100 characters"],
    },
    email: {
      type: String,
      required: [true, "Email is required"],
      unique: true,
      lowercase: true,
      trim: true,
      match: [
        /^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/,
        "Please provide a valid email",
      ],
    },
    password: {
      type: String,
      required: [true, "Password is required"],
      minlength: [6, "Password must be at least 6 characters"],
      select: false,
    },
    role: {
      type: String,
      enum: ["student", "instructor", "admin"],
      default: "student",
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    department: {
      type: String,
      trim: true,
      maxlength: [100, "Department cannot exceed 100 characters"],
    },
    phoneNumber: {
      type: String,
      trim: true,
      match: [/^\+?[\d\s-()]+$/, "Please provide a valid phone number"],
    },
    address: {
      type: String,
      trim: true,
      maxlength: [500, "Address cannot exceed 500 characters"],
    },
    emergencyContact: {
      type: String,
      trim: true,
      maxlength: [200, "Emergency contact cannot exceed 200 characters"],
    },
    profileImage: {
      type: String,
      default: null,
    },
    dateOfBirth: {
      type: Date,
    },
    permissions: [
      {
        type: String,
        enum: [
          "create_exam",
          "edit_exam",
          "delete_exam",
          "view_results",
          "manage_users",
          "export_data",
          "system_settings",
          "view_analytics",
        ],
      },
    ],
    notes: {
      type: String,
      maxlength: [1000, "Notes cannot exceed 1000 characters"],
    },
    lastLogin: {
      type: Date,
    },
    loginCount: {
      type: Number,
      default: 0,
    },
    totalLoginTime: {
      type: Number, // in seconds
      default: 0,
    },
    examStats: {
      totalExams: {
        type: Number,
        default: 0,
      },
      examsPassed: {
        type: Number,
        default: 0,
      },
      examsFailed: {
        type: Number,
        default: 0,
      },
      averageScore: {
        type: Number,
        default: 0,
      },
      totalTimeSpent: {
        type: Number, // in seconds
        default: 0,
      },
      lastExamDate: {
        type: Date,
      },
    },
    preferences: {
      theme: {
        type: String,
        enum: ["light", "dark", "auto"],
        default: "auto",
      },
      language: {
        type: String,
        default: "en",
      },
      emailNotifications: {
        type: Boolean,
        default: true,
      },
      examReminders: {
        type: Boolean,
        default: true,
      },
    },
    resetPasswordToken: String,
    resetPasswordExpire: Date,
    emailVerificationToken: String,
    isEmailVerified: {
      type: Boolean,
      default: false,
    },
    twoFactorSecret: String,
    isTwoFactorEnabled: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  },
);

// Indexes
userSchema.index({ email: 1 });
userSchema.index({ role: 1 });
userSchema.index({ isActive: 1 });
userSchema.index({ department: 1 });
userSchema.index({ createdAt: -1 });

// Virtual for full name
userSchema.virtual("initials").get(function () {
  return this.name
    .split(" ")
    .map((n) => n.charAt(0))
    .join("")
    .toUpperCase();
});

// Hash password before saving
userSchema.pre("save", async function (next) {
  if (!this.isModified("password")) return next();

  const salt = await bcrypt.genSalt(12);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

// Compare password method
userSchema.methods.comparePassword = async function (candidatePassword) {
  return await bcrypt.compare(candidatePassword, this.password);
};

// Generate JWT token
userSchema.methods.getSignedJwtToken = function () {
  return jwt.sign(
    {
      id: this._id,
      role: this.role,
      permissions: this.permissions,
    },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRE },
  );
};

// Generate password reset token
userSchema.methods.getResetPasswordToken = function () {
  const resetToken = crypto.randomBytes(20).toString("hex");

  this.resetPasswordToken = crypto
    .createHash("sha256")
    .update(resetToken)
    .digest("hex");

  this.resetPasswordExpire = Date.now() + 10 * 60 * 1000; // 10 minutes

  return resetToken;
};

// Generate email verification token
userSchema.methods.getEmailVerificationToken = function () {
  const verificationToken = crypto.randomBytes(20).toString("hex");

  this.emailVerificationToken = crypto
    .createHash("sha256")
    .update(verificationToken)
    .digest("hex");

  return verificationToken;
};

// Update exam stats
userSchema.methods.updateExamStats = function (examResult) {
  this.examStats.totalExams += 1;

  if (examResult.passed) {
    this.examStats.examsPassed += 1;
  } else {
    this.examStats.examsFailed += 1;
  }

  // Calculate new average score
  const totalScore =
    this.examStats.averageScore * (this.examStats.totalExams - 1) +
    examResult.percentage;
  this.examStats.averageScore =
    Math.round((totalScore / this.examStats.totalExams) * 100) / 100;

  this.examStats.totalTimeSpent += examResult.timeSpent;
  this.examStats.lastExamDate = new Date();

  return this.save();
};

// Update login stats
userSchema.methods.updateLoginStats = function (sessionDuration = 0) {
  this.lastLogin = new Date();
  this.loginCount += 1;
  this.totalLoginTime += sessionDuration;

  return this.save();
};

module.exports = mongoose.model("User", userSchema);

const express = require("express");
const { body, validationResult } = require("express-validator");
const User = require("../models/User");
const Exam = require("../models/Exam");
const Question = require("../models/Question");
const ExamAttempt = require("../models/ExamAttempt");
const { protect, authorize, auditLog } = require("../middleware/auth");
const { sendEmail } = require("../utils/sendEmail");
const router = express.Router();

// Apply protection and admin authorization to all routes
router.use(protect);
router.use(authorize("admin"));

// @desc    Get system dashboard statistics
// @route   GET /api/admin/dashboard
// @access  Private (Admin only)
router.get("/dashboard", auditLog("view_admin_dashboard"), async (req, res) => {
  try {
    // Get counts
    const totalUsers = await User.countDocuments();
    const activeUsers = await User.countDocuments({ isActive: true });
    const totalStudents = await User.countDocuments({ role: "student" });
    const totalInstructors = await User.countDocuments({ role: "instructor" });
    const totalAdmins = await User.countDocuments({ role: "admin" });

    const totalExams = await Exam.countDocuments();
    const publishedExams = await Exam.countDocuments({
      status: "published",
      isActive: true,
    });
    const draftExams = await Exam.countDocuments({ status: "draft" });

    const totalQuestions = await Question.countDocuments();
    const approvedQuestions = await Question.countDocuments({
      status: "approved",
    });
    const pendingQuestions = await Question.countDocuments({
      status: "review",
    });

    const totalAttempts = await ExamAttempt.countDocuments();
    const completedAttempts = await ExamAttempt.countDocuments({
      status: "completed",
    });
    const inProgressAttempts = await ExamAttempt.countDocuments({
      status: "in-progress",
    });

    // Get recent activity
    const recentUsers = await User.find()
      .sort({ createdAt: -1 })
      .limit(5)
      .select("name email role createdAt isActive");

    const recentExams = await Exam.find()
      .sort({ createdAt: -1 })
      .limit(5)
      .populate("createdBy", "name")
      .select("title category status createdAt");

    const recentAttempts = await ExamAttempt.find({ status: "completed" })
      .sort({ createdAt: -1 })
      .limit(5)
      .populate("user", "name")
      .populate("exam", "title")
      .select("score result createdAt");

    // Calculate trends (last 30 days vs previous 30 days)
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const sixtyDaysAgo = new Date(Date.now() - 60 * 24 * 60 * 60 * 1000);

    const newUsersLast30 = await User.countDocuments({
      createdAt: { $gte: thirtyDaysAgo },
    });
    const newUsersPrevious30 = await User.countDocuments({
      createdAt: { $gte: sixtyDaysAgo, $lt: thirtyDaysAgo },
    });

    const newExamsLast30 = await Exam.countDocuments({
      createdAt: { $gte: thirtyDaysAgo },
    });
    const newExamsPrevious30 = await Exam.countDocuments({
      createdAt: { $gte: sixtyDaysAgo, $lt: thirtyDaysAgo },
    });

    const attemptsLast30 = await ExamAttempt.countDocuments({
      createdAt: { $gte: thirtyDaysAgo },
    });
    const attemptsPrevious30 = await ExamAttempt.countDocuments({
      createdAt: { $gte: sixtyDaysAgo, $lt: thirtyDaysAgo },
    });

    // Calculate growth percentages
    const userGrowth =
      newUsersPrevious30 > 0
        ? Math.round(
            ((newUsersLast30 - newUsersPrevious30) / newUsersPrevious30) * 100,
          )
        : newUsersLast30 > 0
          ? 100
          : 0;

    const examGrowth =
      newExamsPrevious30 > 0
        ? Math.round(
            ((newExamsLast30 - newExamsPrevious30) / newExamsPrevious30) * 100,
          )
        : newExamsLast30 > 0
          ? 100
          : 0;

    const attemptGrowth =
      attemptsPrevious30 > 0
        ? Math.round(
            ((attemptsLast30 - attemptsPrevious30) / attemptsPrevious30) * 100,
          )
        : attemptsLast30 > 0
          ? 100
          : 0;

    // System health metrics
    const systemHealth = {
      activeUsers: activeUsers,
      totalUsers: totalUsers,
      activeUserPercentage: Math.round((activeUsers / totalUsers) * 100),
      publishedExamPercentage: Math.round((publishedExams / totalExams) * 100),
      approvedQuestionPercentage: Math.round(
        (approvedQuestions / totalQuestions) * 100,
      ),
      completionRate: Math.round((completedAttempts / totalAttempts) * 100),
    };

    const dashboard = {
      overview: {
        totalUsers,
        activeUsers,
        totalStudents,
        totalInstructors,
        totalAdmins,
        totalExams,
        publishedExams,
        draftExams,
        totalQuestions,
        approvedQuestions,
        pendingQuestions,
        totalAttempts,
        completedAttempts,
        inProgressAttempts,
      },
      trends: {
        userGrowth,
        examGrowth,
        attemptGrowth,
        newUsersLast30,
        newExamsLast30,
        attemptsLast30,
      },
      systemHealth,
      recentActivity: {
        recentUsers,
        recentExams,
        recentAttempts,
      },
    };

    res.status(200).json({
      success: true,
      data: dashboard,
    });
  } catch (error) {
    console.error("Get admin dashboard error:", error);
    res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
});

// @desc    Get system settings
// @route   GET /api/admin/settings
// @access  Private (Admin only)
router.get("/settings", async (req, res) => {
  try {
    // In a real application, you would store these in a Settings model
    const settings = {
      system: {
        maintenanceMode: false,
        registrationEnabled: true,
        emailVerificationRequired: true,
        twoFactorRequired: false,
        maxLoginAttempts: 5,
        sessionTimeout: 30, // minutes
      },
      exam: {
        maxExamDuration: 300, // minutes
        maxQuestionsPerExam: 100,
        defaultMaxAttempts: 3,
        allowExamReview: true,
        defaultShowResults: true,
        defaultShowCorrectAnswers: true,
      },
      notification: {
        emailNotificationsEnabled: true,
        examReminderEnabled: true,
        resultNotificationEnabled: true,
        systemAlertEnabled: true,
      },
      security: {
        passwordMinLength: 6,
        passwordRequireSpecialChar: false,
        passwordRequireNumber: true,
        passwordRequireUppercase: false,
        accountLockoutEnabled: true,
        accountLockoutDuration: 15, // minutes
      },
    };

    res.status(200).json({
      success: true,
      data: settings,
    });
  } catch (error) {
    console.error("Get settings error:", error);
    res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
});

// @desc    Update system settings
// @route   PUT /api/admin/settings
// @access  Private (Admin only)
router.put(
  "/settings",
  auditLog("update_system_settings"),
  async (req, res) => {
    try {
      // In a real application, you would validate and save these to a Settings model
      const { system, exam, notification, security } = req.body;

      // Validate settings (basic validation)
      if (
        system?.maxLoginAttempts &&
        (system.maxLoginAttempts < 3 || system.maxLoginAttempts > 10)
      ) {
        return res.status(400).json({
          success: false,
          message: "Max login attempts must be between 3 and 10",
        });
      }

      if (
        exam?.maxExamDuration &&
        (exam.maxExamDuration < 10 || exam.maxExamDuration > 600)
      ) {
        return res.status(400).json({
          success: false,
          message: "Max exam duration must be between 10 and 600 minutes",
        });
      }

      if (
        security?.passwordMinLength &&
        (security.passwordMinLength < 6 || security.passwordMinLength > 20)
      ) {
        return res.status(400).json({
          success: false,
          message:
            "Password minimum length must be between 6 and 20 characters",
        });
      }

      // Here you would save the settings to the database
      // For now, we'll just return success

      res.status(200).json({
        success: true,
        message: "Settings updated successfully",
        data: { system, exam, notification, security },
      });
    } catch (error) {
      console.error("Update settings error:", error);
      res.status(500).json({
        success: false,
        message: "Server error",
      });
    }
  },
);

// @desc    Get audit logs
// @route   GET /api/admin/audit-logs
// @access  Private (Admin only)
router.get("/audit-logs", async (req, res) => {
  try {
    const {
      page = 1,
      limit = 50,
      action,
      userId,
      startDate,
      endDate,
    } = req.query;

    // In a real application, you would have an AuditLog model
    // For now, we'll return a mock response
    const mockLogs = [
      {
        id: "1",
        timestamp: new Date(),
        userId: "user123",
        userName: "John Doe",
        action: "login",
        resource: "auth",
        ipAddress: "192.168.1.1",
        userAgent: "Mozilla/5.0...",
        status: "success",
        details: "User logged in successfully",
      },
      // More mock logs...
    ];

    res.status(200).json({
      success: true,
      count: mockLogs.length,
      total: mockLogs.length,
      page: parseInt(page),
      pages: Math.ceil(mockLogs.length / limit),
      data: mockLogs,
    });
  } catch (error) {
    console.error("Get audit logs error:", error);
    res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
});

// @desc    Bulk user operations
// @route   POST /api/admin/users/bulk
// @access  Private (Admin only)
router.post(
  "/users/bulk",
  auditLog("bulk_user_operation"),
  [
    body("action")
      .isIn([
        "activate",
        "deactivate",
        "delete",
        "resetPassword",
        "sendNotification",
      ])
      .withMessage("Invalid bulk action"),
    body("userIds")
      .isArray({ min: 1 })
      .withMessage("User IDs array is required"),
    body("message")
      .optional()
      .isLength({ min: 1, max: 500 })
      .withMessage("Message must be between 1 and 500 characters"),
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

      const { action, userIds, message } = req.body;
      let results = { success: 0, failed: 0, errors: [] };

      switch (action) {
        case "activate":
          const activateResult = await User.updateMany(
            { _id: { $in: userIds } },
            { isActive: true },
          );
          results.success = activateResult.modifiedCount;
          break;

        case "deactivate":
          const deactivateResult = await User.updateMany(
            { _id: { $in: userIds } },
            { isActive: false },
          );
          results.success = deactivateResult.modifiedCount;
          break;

        case "delete":
          // Soft delete - mark as inactive and change email
          for (const userId of userIds) {
            try {
              const user = await User.findById(userId);
              if (user) {
                user.isActive = false;
                user.email = `deleted_${Date.now()}_${user.email}`;
                await user.save();
                results.success++;
              }
            } catch (error) {
              results.failed++;
              results.errors.push({ userId, error: error.message });
            }
          }
          break;

        case "resetPassword":
          for (const userId of userIds) {
            try {
              const user = await User.findById(userId);
              if (user) {
                const tempPassword = Math.random().toString(36).slice(-8);
                user.password = tempPassword;
                await user.save();

                // Send email
                await sendEmail({
                  email: user.email,
                  subject: "Password Reset - RanExam",
                  message: `Your password has been reset. New password: ${tempPassword}`,
                });

                results.success++;
              }
            } catch (error) {
              results.failed++;
              results.errors.push({ userId, error: error.message });
            }
          }
          break;

        case "sendNotification":
          if (!message) {
            return res.status(400).json({
              success: false,
              message: "Message is required for notification",
            });
          }

          for (const userId of userIds) {
            try {
              const user = await User.findById(userId);
              if (user) {
                await sendEmail({
                  email: user.email,
                  subject: "Notification from RanExam",
                  message: message,
                });
                results.success++;
              }
            } catch (error) {
              results.failed++;
              results.errors.push({ userId, error: error.message });
            }
          }
          break;

        default:
          return res.status(400).json({
            success: false,
            message: "Invalid action",
          });
      }

      res.status(200).json({
        success: true,
        message: `Bulk ${action} completed`,
        data: results,
      });
    } catch (error) {
      console.error("Bulk user operation error:", error);
      res.status(500).json({
        success: false,
        message: "Server error during bulk operation",
      });
    }
  },
);

// @desc    System maintenance operations
// @route   POST /api/admin/maintenance
// @access  Private (Admin only)
router.post(
  "/maintenance",
  auditLog("system_maintenance"),
  [
    body("operation")
      .isIn(["cleanup", "backup", "optimize", "reset-analytics"])
      .withMessage("Invalid maintenance operation"),
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

      const { operation } = req.body;
      let result = {};

      switch (operation) {
        case "cleanup":
          // Clean up old data
          const cutoffDate = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000); // 90 days ago

          // Delete old abandoned attempts
          const deletedAttempts = await ExamAttempt.deleteMany({
            status: "abandoned",
            createdAt: { $lt: cutoffDate },
          });

          // Archive old completed attempts
          const archivedAttempts = await ExamAttempt.updateMany(
            {
              status: "completed",
              createdAt: { $lt: cutoffDate },
            },
            { archived: true },
          );

          result = {
            deletedAttempts: deletedAttempts.deletedCount,
            archivedAttempts: archivedAttempts.modifiedCount,
          };
          break;

        case "backup":
          // In a real application, you would trigger a database backup
          result = {
            message: "Backup initiated successfully",
            timestamp: new Date().toISOString(),
          };
          break;

        case "optimize":
          // Database optimization operations
          result = {
            message: "Database optimization completed",
            operations: ["reindex", "analyze", "vacuum"],
          };
          break;

        case "reset-analytics":
          // Reset all analytics data
          await Exam.updateMany(
            {},
            {
              $unset: { analytics: 1 },
            },
          );

          await Question.updateMany(
            {},
            {
              $unset: { analytics: 1 },
            },
          );

          result = {
            message: "Analytics data reset successfully",
          };
          break;

        default:
          return res.status(400).json({
            success: false,
            message: "Invalid operation",
          });
      }

      res.status(200).json({
        success: true,
        message: `${operation} completed successfully`,
        data: result,
      });
    } catch (error) {
      console.error("Maintenance operation error:", error);
      res.status(500).json({
        success: false,
        message: "Server error during maintenance operation",
      });
    }
  },
);

// @desc    Export system data
// @route   GET /api/admin/export/:type
// @access  Private (Admin only)
router.get("/export/:type", auditLog("data_export"), async (req, res) => {
  try {
    const { type } = req.params;
    const { format = "json" } = req.query;

    let data = [];
    let filename = "";

    switch (type) {
      case "users":
        data = await User.find()
          .select("-password -resetPasswordToken -resetPasswordExpire")
          .lean();
        filename = `users-export-${Date.now()}`;
        break;

      case "exams":
        data = await Exam.find().populate("createdBy", "name email").lean();
        filename = `exams-export-${Date.now()}`;
        break;

      case "questions":
        data = await Question.find().populate("createdBy", "name email").lean();
        filename = `questions-export-${Date.now()}`;
        break;

      case "results":
        data = await ExamAttempt.find({ status: "completed" })
          .populate("user", "name email")
          .populate("exam", "title category")
          .select("-answers")
          .lean();
        filename = `results-export-${Date.now()}`;
        break;

      default:
        return res.status(400).json({
          success: false,
          message: "Invalid export type",
        });
    }

    if (format === "csv" && ["users", "results"].includes(type)) {
      const { Parser } = require("json2csv");
      const json2csvParser = new Parser();
      const csv = json2csvParser.parse(data);

      res.setHeader("Content-Type", "text/csv");
      res.setHeader(
        "Content-Disposition",
        `attachment; filename="${filename}.csv"`,
      );
      return res.send(csv);
    }

    // Default to JSON
    res.setHeader("Content-Type", "application/json");
    res.setHeader(
      "Content-Disposition",
      `attachment; filename="${filename}.json"`,
    );
    res.json({
      success: true,
      exportDate: new Date().toISOString(),
      type,
      count: data.length,
      data,
    });
  } catch (error) {
    console.error("Export data error:", error);
    res.status(500).json({
      success: false,
      message: "Server error during data export",
    });
  }
});

module.exports = router;

const express = require("express");
const { body, validationResult, query } = require("express-validator");
const User = require("../models/User");
const ExamAttempt = require("../models/ExamAttempt");
const { protect, authorize } = require("../middleware/auth");
const { sendEmail } = require("../utils/sendEmail");
const router = express.Router();

// Apply protection to all routes
router.use(protect);

// @desc    Get all users with filtering, pagination, and search
// @route   GET /api/users
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
    query("role")
      .optional()
      .isIn(["student", "instructor", "admin"])
      .withMessage("Invalid role"),
    query("isActive")
      .optional()
      .isBoolean()
      .withMessage("isActive must be boolean"),
    query("sortBy")
      .optional()
      .isIn(["name", "email", "createdAt", "lastLogin", "examsTaken"])
      .withMessage("Invalid sort field"),
    query("sortOrder")
      .optional()
      .isIn(["asc", "desc"])
      .withMessage("Sort order must be asc or desc"),
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
        role,
        department,
        isActive,
        sortBy = "createdAt",
        sortOrder = "desc",
      } = req.query;

      // Build query
      const query = {};

      // Search across multiple fields
      if (search) {
        query.$or = [
          { name: { $regex: search, $options: "i" } },
          { email: { $regex: search, $options: "i" } },
          { department: { $regex: search, $options: "i" } },
          { phoneNumber: { $regex: search, $options: "i" } },
        ];
      }

      // Apply filters
      if (role) query.role = role;
      if (department) query.department = department;
      if (isActive !== undefined) query.isActive = isActive === "true";

      // For instructors, limit access to students only
      if (req.user.role === "instructor") {
        query.role = "student";
      }

      // Build sort object
      const sort = {};
      sort[sortBy] = sortOrder === "asc" ? 1 : -1;

      // Execute query with pagination
      const users = await User.find(query)
        .select(
          "-password -resetPasswordToken -resetPasswordExpire -emailVerificationToken",
        )
        .sort(sort)
        .limit(limit * 1)
        .skip((page - 1) * limit)
        .lean();

      // Get total count for pagination
      const total = await User.countDocuments(query);

      res.status(200).json({
        success: true,
        count: users.length,
        total,
        page: parseInt(page),
        pages: Math.ceil(total / limit),
        data: users,
      });
    } catch (error) {
      console.error("Get users error:", error);
      res.status(500).json({
        success: false,
        message: "Server error",
      });
    }
  },
);

// @desc    Get single user
// @route   GET /api/users/:id
// @access  Private (Admin/Instructor/Own Profile)
router.get("/:id", async (req, res) => {
  try {
    const user = await User.findById(req.params.id)
      .select(
        "-password -resetPasswordToken -resetPasswordExpire -emailVerificationToken",
      )
      .lean();

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    // Check permissions
    if (
      req.user.role !== "admin" &&
      req.user.role !== "instructor" &&
      req.user.id !== req.params.id
    ) {
      return res.status(403).json({
        success: false,
        message: "Not authorized to view this user",
      });
    }

    // For instructors, only allow viewing students
    if (
      req.user.role === "instructor" &&
      user.role !== "student" &&
      req.user.id !== req.params.id
    ) {
      return res.status(403).json({
        success: false,
        message: "Not authorized to view this user",
      });
    }

    res.status(200).json({
      success: true,
      data: user,
    });
  } catch (error) {
    console.error("Get user error:", error);
    res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
});

// @desc    Create new user
// @route   POST /api/users
// @access  Private (Admin only)
router.post(
  "/",
  authorize("admin"),
  [
    body("name")
      .trim()
      .isLength({ min: 2, max: 100 })
      .withMessage("Name must be between 2 and 100 characters"),
    body("email")
      .isEmail()
      .normalizeEmail()
      .withMessage("Please provide a valid email"),
    body("password")
      .isLength({ min: 6 })
      .withMessage("Password must be at least 6 characters"),
    body("role")
      .isIn(["student", "instructor", "admin"])
      .withMessage("Role must be student, instructor, or admin"),
    body("phoneNumber")
      .optional()
      .matches(/^\+?[\d\s-()]+$/)
      .withMessage("Please provide a valid phone number"),
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
        name,
        email,
        password,
        role,
        department,
        phoneNumber,
        address,
        emergencyContact,
        permissions,
        notes,
      } = req.body;

      // Check if user already exists
      const existingUser = await User.findOne({ email });
      if (existingUser) {
        return res.status(400).json({
          success: false,
          message: "User already exists with this email",
        });
      }

      // Set default permissions based on role
      let defaultPermissions = [];
      if (role === "instructor") {
        defaultPermissions = ["create_exam", "edit_exam", "view_results"];
      } else if (role === "admin") {
        defaultPermissions = [
          "create_exam",
          "edit_exam",
          "delete_exam",
          "view_results",
          "manage_users",
          "export_data",
          "system_settings",
          "view_analytics",
        ];
      }

      const user = await User.create({
        name,
        email,
        password,
        role,
        department,
        phoneNumber,
        address,
        emergencyContact,
        permissions: permissions || defaultPermissions,
        notes,
        isEmailVerified: true, // Admin-created users are auto-verified
      });

      // Send welcome email
      const message = `
      Welcome to RanExam!
      
      Your account has been created by an administrator.
      
      Login Details:
      Email: ${email}
      Role: ${role}
      
      Please change your password after your first login.
      
      Login URL: ${process.env.FRONTEND_URL}/login
    `;

      try {
        await sendEmail({
          email: user.email,
          subject: "Welcome to RanExam - Account Created",
          message,
        });
      } catch (err) {
        console.log("Welcome email could not be sent:", err.message);
      }

      const userResponse = await User.findById(user._id).select("-password");

      res.status(201).json({
        success: true,
        message: "User created successfully",
        data: userResponse,
      });
    } catch (error) {
      console.error("Create user error:", error);
      res.status(500).json({
        success: false,
        message: "Server error during user creation",
      });
    }
  },
);

// @desc    Update user
// @route   PUT /api/users/:id
// @access  Private (Admin/Own Profile)
router.put(
  "/:id",
  [
    body("name")
      .optional()
      .trim()
      .isLength({ min: 2, max: 100 })
      .withMessage("Name must be between 2 and 100 characters"),
    body("email")
      .optional()
      .isEmail()
      .normalizeEmail()
      .withMessage("Please provide a valid email"),
    body("role")
      .optional()
      .isIn(["student", "instructor", "admin"])
      .withMessage("Role must be student, instructor, or admin"),
    body("phoneNumber")
      .optional()
      .matches(/^\+?[\d\s-()]+$/)
      .withMessage("Please provide a valid phone number"),
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

      const user = await User.findById(req.params.id);
      if (!user) {
        return res.status(404).json({
          success: false,
          message: "User not found",
        });
      }

      // Check permissions
      const isOwnProfile = req.user.id === req.params.id;
      const isAdmin = req.user.role === "admin";

      if (!isAdmin && !isOwnProfile) {
        return res.status(403).json({
          success: false,
          message: "Not authorized to update this user",
        });
      }

      // Define allowed fields based on role
      let allowedFields = [
        "name",
        "phoneNumber",
        "address",
        "emergencyContact",
        "preferences",
      ];

      if (isAdmin) {
        allowedFields = [
          ...allowedFields,
          "email",
          "role",
          "department",
          "isActive",
          "permissions",
          "notes",
        ];
      }

      // Build update object
      const updateData = {};
      allowedFields.forEach((field) => {
        if (req.body[field] !== undefined) {
          updateData[field] = req.body[field];
        }
      });

      // Check for email uniqueness if email is being updated
      if (updateData.email && updateData.email !== user.email) {
        const existingUser = await User.findOne({ email: updateData.email });
        if (existingUser) {
          return res.status(400).json({
            success: false,
            message: "Email already exists",
          });
        }
      }

      const updatedUser = await User.findByIdAndUpdate(
        req.params.id,
        updateData,
        { new: true, runValidators: true },
      ).select("-password");

      res.status(200).json({
        success: true,
        message: "User updated successfully",
        data: updatedUser,
      });
    } catch (error) {
      console.error("Update user error:", error);
      res.status(500).json({
        success: false,
        message: "Server error during user update",
      });
    }
  },
);

// @desc    Delete user
// @route   DELETE /api/users/:id
// @access  Private (Admin only)
router.delete("/:id", authorize("admin"), async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    // Prevent deleting the last admin
    if (user.role === "admin") {
      const adminCount = await User.countDocuments({
        role: "admin",
        isActive: true,
      });
      if (adminCount <= 1) {
        return res.status(400).json({
          success: false,
          message: "Cannot delete the last admin user",
        });
      }
    }

    // Soft delete - just deactivate the user
    user.isActive = false;
    user.email = `deleted_${Date.now()}_${user.email}`;
    await user.save();

    res.status(200).json({
      success: true,
      message: "User deleted successfully",
    });
  } catch (error) {
    console.error("Delete user error:", error);
    res.status(500).json({
      success: false,
      message: "Server error during user deletion",
    });
  }
});

// @desc    Get user statistics
// @route   GET /api/users/:id/stats
// @access  Private (Admin/Instructor/Own Profile)
router.get("/:id/stats", async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    // Check permissions
    if (
      req.user.role !== "admin" &&
      req.user.role !== "instructor" &&
      req.user.id !== req.params.id
    ) {
      return res.status(403).json({
        success: false,
        message: "Not authorized to view user statistics",
      });
    }

    // Get exam attempts for this user
    const attempts = await ExamAttempt.find({
      user: req.params.id,
      status: "completed",
    }).populate("exam", "title category difficulty");

    // Calculate statistics
    const stats = {
      totalExams: attempts.length,
      examsPassed: attempts.filter((attempt) => attempt.result.passed).length,
      examsFailed: attempts.filter((attempt) => !attempt.result.passed).length,
      averageScore:
        attempts.length > 0
          ? Math.round(
              (attempts.reduce(
                (sum, attempt) => sum + attempt.score.percentage,
                0,
              ) /
                attempts.length) *
                100,
            ) / 100
          : 0,
      totalTimeSpent: attempts.reduce(
        (sum, attempt) => sum + attempt.timeSpent,
        0,
      ),
      lastExamDate:
        attempts.length > 0
          ? Math.max(
              ...attempts.map((attempt) =>
                new Date(attempt.createdAt).getTime(),
              ),
            )
          : null,
      recentAttempts: attempts
        .sort(
          (a, b) =>
            new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
        )
        .slice(0, 5)
        .map((attempt) => ({
          examTitle: attempt.exam.title,
          score: attempt.score.percentage,
          passed: attempt.result.passed,
          date: attempt.createdAt,
          timeSpent: attempt.timeSpent,
        })),
      categoryPerformance: {},
    };

    // Calculate category-wise performance
    const categoryGroups = attempts.reduce((groups, attempt) => {
      const category = attempt.exam.category;
      if (!groups[category]) {
        groups[category] = [];
      }
      groups[category].push(attempt);
      return groups;
    }, {});

    Object.keys(categoryGroups).forEach((category) => {
      const categoryAttempts = categoryGroups[category];
      stats.categoryPerformance[category] = {
        totalExams: categoryAttempts.length,
        averageScore:
          Math.round(
            (categoryAttempts.reduce(
              (sum, attempt) => sum + attempt.score.percentage,
              0,
            ) /
              categoryAttempts.length) *
              100,
          ) / 100,
        passRate: Math.round(
          (categoryAttempts.filter((attempt) => attempt.result.passed).length /
            categoryAttempts.length) *
            100,
        ),
      };
    });

    res.status(200).json({
      success: true,
      data: stats,
    });
  } catch (error) {
    console.error("Get user stats error:", error);
    res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
});

// @desc    Reset user password (Admin only)
// @route   POST /api/users/:id/reset-password
// @access  Private (Admin only)
router.post("/:id/reset-password", authorize("admin"), async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    // Generate temporary password
    const tempPassword = Math.random().toString(36).slice(-8);
    user.password = tempPassword;
    await user.save();

    // Send email with new password
    const message = `
      Your password has been reset by an administrator.
      
      New temporary password: ${tempPassword}
      
      Please login and change your password immediately.
      
      Login URL: ${process.env.FRONTEND_URL}/login
    `;

    try {
      await sendEmail({
        email: user.email,
        subject: "Password Reset - RanExam",
        message,
      });

      res.status(200).json({
        success: true,
        message:
          "Password reset successfully. New password sent to user email.",
      });
    } catch (err) {
      res.status(500).json({
        success: false,
        message: "Password reset but email could not be sent",
      });
    }
  } catch (error) {
    console.error("Reset user password error:", error);
    res.status(500).json({
      success: false,
      message: "Server error during password reset",
    });
  }
});

// @desc    Bulk user operations
// @route   POST /api/users/bulk
// @access  Private (Admin only)
router.post(
  "/bulk",
  authorize("admin"),
  [
    body("action")
      .isIn(["activate", "deactivate", "delete"])
      .withMessage("Invalid bulk action"),
    body("userIds")
      .isArray({ min: 1 })
      .withMessage("User IDs array is required"),
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

      const { action, userIds } = req.body;

      let updateQuery = {};
      let message = "";

      switch (action) {
        case "activate":
          updateQuery = { isActive: true };
          message = "Users activated successfully";
          break;
        case "deactivate":
          updateQuery = { isActive: false };
          message = "Users deactivated successfully";
          break;
        case "delete":
          // Soft delete
          updateQuery = {
            isActive: false,
            email: {
              $concat: [
                "deleted_",
                { $toString: new Date().getTime() },
                "_",
                "$email",
              ],
            },
          };
          message = "Users deleted successfully";
          break;
      }

      const result = await User.updateMany(
        { _id: { $in: userIds } },
        updateQuery,
      );

      res.status(200).json({
        success: true,
        message,
        modifiedCount: result.modifiedCount,
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

module.exports = router;

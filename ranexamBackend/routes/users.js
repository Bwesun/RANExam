const express = require("express");
const { body, validationResult, query } = require("express-validator");
const { User, ExamAttempt, Exam } = require("../models");
const { protect, authorize } = require("../middleware/auth");
const { sendEmail } = require("../utils/sendEmail");
const router = express.Router();
const { Op } = require("sequelize");

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
      .isIn(["name", "email", "createdAt"])
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
      const where = {};

      if (search) {
        where[Op.or] = [
          { name: { [Op.iLike]: `%${search}%` } },
          { email: { [Op.iLike]: `%${search}%` } },
          { department: { [Op.iLike]: `%${search}%` } },
          { phoneNumber: { [Op.iLike]: `%${search}%` } },
        ];
      }

      if (role) where.role = role;
      if (department) where.department = department;
      if (isActive !== undefined) where.isActive = isActive === "true";

      if (req.user.role === "instructor") {
        where.role = "student";
      }

      const { count, rows } = await User.findAndCountAll({
        where,
        order: [[sortBy, sortOrder]],
        limit,
        offset: (page - 1) * limit,
        attributes: { exclude: ['password', 'resetPasswordToken', 'resetPasswordExpire'] }
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
    const user = await User.findByPk(req.params.id, {
      attributes: { exclude: ['password', 'resetPasswordToken', 'resetPasswordExpire'] }
    });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

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
      .isString()
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
      } = req.body;

      const existingUser = await User.findOne({ where: { email } });
      if (existingUser) {
        return res.status(400).json({
          success: false,
          message: "User already exists with this email",
        });
      }

      const user = await User.create({
        name,
        email,
        password,
        role,
        department,
        phoneNumber,
        address,
      });

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

      const userResponse = await User.findByPk(user.id, {
        attributes: { exclude: ['password'] }
      });

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
      .isString()
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

      const user = await User.findByPk(req.params.id);
      if (!user) {
        return res.status(404).json({
          success: false,
          message: "User not found",
        });
      }

      const isOwnProfile = req.user.id === parseInt(req.params.id);
      const isAdmin = req.user.role === "admin";

      if (!isAdmin && !isOwnProfile) {
        return res.status(403).json({
          success: false,
          message: "Not authorized to update this user",
        });
      }

      const [updated] = await User.update(req.body, { where: { id: req.params.id } });

      if (updated) {
        const updatedUser = await User.findByPk(req.params.id, {
          attributes: { exclude: ['password'] }
        });
        res.status(200).json({
          success: true,
          message: "User updated successfully",
          data: updatedUser,
        });
      } else {
        res.status(404).json({
          success: false,
          message: "User not found",
        });
      }
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
    const user = await User.findByPk(req.params.id);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    if (user.role === "admin") {
      const adminCount = await User.count({ where: { role: "admin", isActive: true } });
      if (adminCount <= 1) {
        return res.status(400).json({
          success: false,
          message: "Cannot delete the last admin user",
        });
      }
    }

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

module.exports = router;
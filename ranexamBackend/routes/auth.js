const express = require("express");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const crypto = require("crypto");
const { body, validationResult } = require("express-validator");
const { User } = require("../models");
const { protect } = require("../middleware/auth");
const { sendEmail } = require("../utils/sendEmail");
const router = express.Router();
const { Op } = require("sequelize");

// @desc    Register user
// @route   POST /api/auth/register
// @access  Public
router.post(
  "/register",
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
      .isIn(["student", "instructor"])
      .withMessage("Role must be student or instructor"),
  ],
  async (req, res) => {
    try {
      // Check for validation errors
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          errors: errors.array(),
        });
      }

      const { name, email, password, role, department, phoneNumber } = req.body;

      // Check if user already exists
      const existingUser = await User.findOne({ where: { email } });
      if (existingUser) {
        return res.status(400).json({
          success: false,
          message: "User already exists with this email",
        });
      }

      // Create user
      const user = await User.create({
        name,
        email,
        password,
        role,
        department,
        phoneNumber,
      });

      // Generate JWT token
      const token = user.getSignedJwtToken();

      res.status(201).json({
        success: true,
        message:
          "User registered successfully. Please check your email to verify your account.",
        token,
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
          role: user.role,
          department: user.department,
          isActive: user.isActive,
        },
      });
    } catch (error) {
      console.error("Registration error:", error);
      res.status(500).json({
        success: false,
        message: "Server error during registration",
      });
    }
  },
);

// @desc    Login user
// @route   POST /api/auth/login
// @access  Public
router.post(
  "/login",
  [
    body("email")
      .isEmail()
      .normalizeEmail()
      .withMessage("Please provide a valid email"),
    body("password").notEmpty().withMessage("Password is required"),
  ],
  async (req, res) => {
    try {
      // Check for validation errors
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          errors: errors.array(),
        });
      }

      const { email, password, rememberMe } = req.body;

      // Check for user
      const user = await User.findOne({ where: { email } });
      if (!user) {
        return res.status(401).json({
          success: false,
          message: "Invalid credentials",
        });
      }

      // Check if user is active
      if (!user.isActive) {
        return res.status(401).json({
          success: false,
          message: "Account is deactivated. Please contact administrator.",
        });
      }

      // Check password
      const isMatch = await user.comparePassword(password);
      if (!isMatch) {
        return res.status(401).json({
          success: false,
          message: "Invalid credentials",
        });
      }

      // Generate JWT token
      const token = user.getSignedJwtToken();

      res.status(200).json({
        success: true,
        message: "Login successful",
        token,
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
          role: user.role,
          department: user.department,
          isActive: user.isActive,
          profileImage: user.profileImage,
        },
      });
    } catch (error) {
      console.error("Login error:", error);
      res.status(500).json({
        success: false,
        message: "Server error during login",
      });
    }
  },
);

// @desc    Get current logged in user
// @route   GET /api/auth/me
// @access  Private
router.get("/me", protect, async (req, res) => {
  try {
    const user = await User.findByPk(req.user.id);

    res.status(200).json({
      success: true,
      user,
    });
  } catch (error) {
    console.error("Get user error:", error);
    res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
});

// @desc    Update user profile
// @route   PUT /api/auth/profile
// @access  Private
router.put(
  "/profile",
  protect,
  [
    body("name")
      .optional()
      .trim()
      .isLength({ min: 2, max: 100 })
      .withMessage("Name must be between 2 and 100 characters"),
    body("phoneNumber")
      .optional()
      .isString()
      .withMessage("Please provide a valid phone number"),
    body("address")
      .optional()
      .isLength({ max: 500 })
      .withMessage("Address cannot exceed 500 characters"),
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

      const [updated] = await User.update(req.body, { where: { id: req.user.id } });

      if (updated) {
        const updatedUser = await User.findByPk(req.user.id);
        res.status(200).json({
          success: true,
          message: "Profile updated successfully",
          user: updatedUser,
        });
      } else {
        res.status(404).json({
          success: false,
          message: "User not found",
        });
      }
    } catch (error) {
      console.error("Profile update error:", error);
      res.status(500).json({
        success: false,
        message: "Server error during profile update",
      });
    }
  },
);

// @desc    Change password
// @route   PUT /api/auth/change-password
// @access  Private
router.put(
  "/change-password",
  protect,
  [
    body("currentPassword")
      .notEmpty()
      .withMessage("Current password is required"),
    body("newPassword")
      .isLength({ min: 6 })
      .withMessage("New password must be at least 6 characters"),
    body("confirmPassword").custom((value, { req }) => {
      if (value !== req.body.newPassword) {
        throw new Error("Passwords do not match");
      }
      return true;
    }),
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

      const { currentPassword, newPassword } = req.body;

      const user = await User.findByPk(req.user.id);

      const isMatch = await user.comparePassword(currentPassword);
      if (!isMatch) {
        return res.status(400).json({
          success: false,
          message: "Current password is incorrect",
        });
      }

      user.password = newPassword;
      await user.save();

      res.status(200).json({
        success: true,
        message: "Password changed successfully",
      });
    } catch (error) {
      console.error("Change password error:", error);
      res.status(500).json({
        success: false,
        message: "Server error during password change",
      });
    }
  },
);

// @desc    Forgot password
// @route   POST /api/auth/forgot-password
// @access  Public
router.post(
  "/forgot-password",
  [
    body("email")
      .isEmail()
      .normalizeEmail()
      .withMessage("Please provide a valid email"),
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

      const { email } = req.body;

      const user = await User.findOne({ where: { email } });
      if (!user) {
        return res.status(404).json({
          success: false,
          message: "No user found with this email",
        });
      }

      const resetToken = user.getResetPasswordToken();
      await user.save();

      const resetUrl = `${process.env.FRONTEND_URL}/reset-password/${resetToken}`;

      const message = `
      You requested a password reset for your RanExam account.
      Please click the link below to reset your password:
      ${resetUrl}
      
      This link will expire in 10 minutes.
      
      If you did not request this, please ignore this email.
    `;

      try {
        await sendEmail({
          email: user.email,
          subject: "Password Reset - RanExam",
          message,
        });

        res.status(200).json({
          success: true,
          message: "Password reset email sent",
        });
      } catch (err) {
        user.resetPasswordToken = undefined;
        user.resetPasswordExpire = undefined;
        await user.save();

        return res.status(500).json({
          success: false,
          message: "Email could not be sent",
        });
      }
    } catch (error) {
      console.error("Forgot password error:", error);
      res.status(500).json({
        success: false,
        message: "Server error",
      });
    }
  },
);

// @desc    Reset password
// @route   PUT /api/auth/reset-password/:resettoken
// @access  Public
router.put(
  "/reset-password/:resettoken",
  [
    body("password")
      .isLength({ min: 6 })
      .withMessage("Password must be at least 6 characters"),
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

      const resetPasswordToken = crypto
        .createHash("sha256")
        .update(req.params.resettoken)
        .digest("hex");

      const user = await User.findOne({
        where: {
          resetPasswordToken,
          resetPasswordExpire: { [Op.gt]: Date.now() },
        },
      });

      if (!user) {
        return res.status(400).json({
          success: false,
          message: "Invalid or expired reset token",
        });
      }

      user.password = req.body.password;
      user.resetPasswordToken = undefined;
      user.resetPasswordExpire = undefined;
      await user.save();

      const token = user.getSignedJwtToken();

      res.status(200).json({
        success: true,
        message: "Password reset successful",
        token,
      });
    } catch (error) {
      console.error("Reset password error:", error);
      res.status(500).json({
        success: false,
        message: "Server error",
      });
    }
  },
);

module.exports = router;
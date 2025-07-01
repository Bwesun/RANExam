const jwt = require("jsonwebtoken");
const User = require("../models/User");

// Protect routes - check for valid JWT token
const protect = async (req, res, next) => {
  let token;

  // Check for token in header
  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith("Bearer")
  ) {
    token = req.headers.authorization.split(" ")[1];
  }

  // Check for token in cookies (if using cookie-based auth)
  else if (req.cookies && req.cookies.token) {
    token = req.cookies.token;
  }

  // Make sure token exists
  if (!token) {
    return res.status(401).json({
      success: false,
      message: "Not authorized to access this route",
    });
  }

  try {
    // Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // Get user from token
    const user = await User.findById(decoded.id).select("-password");

    if (!user) {
      return res.status(401).json({
        success: false,
        message: "No user found with this token",
      });
    }

    // Check if user is active
    if (!user.isActive) {
      return res.status(401).json({
        success: false,
        message: "User account is deactivated",
      });
    }

    // Add user to request object
    req.user = user;
    next();
  } catch (error) {
    console.error("Auth middleware error:", error);

    if (error.name === "JsonWebTokenError") {
      return res.status(401).json({
        success: false,
        message: "Invalid token",
      });
    } else if (error.name === "TokenExpiredError") {
      return res.status(401).json({
        success: false,
        message: "Token expired",
      });
    }

    return res.status(401).json({
      success: false,
      message: "Not authorized to access this route",
    });
  }
};

// Grant access to specific roles
const authorize = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: "Not authorized to access this route",
      });
    }

    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: `User role '${req.user.role}' is not authorized to access this route`,
      });
    }

    next();
  };
};

// Check for specific permissions
const checkPermission = (permission) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: "Not authorized to access this route",
      });
    }

    // Admins have all permissions
    if (req.user.role === "admin") {
      return next();
    }

    // Check if user has the specific permission
    if (!req.user.permissions || !req.user.permissions.includes(permission)) {
      return res.status(403).json({
        success: false,
        message: `Permission '${permission}' is required to access this route`,
      });
    }

    next();
  };
};

// Check if user can access resource (for resource-specific authorization)
const checkResourceAccess = (resourceType) => {
  return async (req, res, next) => {
    try {
      if (!req.user) {
        return res.status(401).json({
          success: false,
          message: "Not authorized to access this route",
        });
      }

      // Admin can access everything
      if (req.user.role === "admin") {
        return next();
      }

      const resourceId = req.params.id;

      switch (resourceType) {
        case "exam":
          const Exam = require("../models/Exam");
          const exam = await Exam.findById(resourceId);

          if (!exam) {
            return res.status(404).json({
              success: false,
              message: "Resource not found",
            });
          }

          // Instructors can access their own exams
          if (
            req.user.role === "instructor" &&
            exam.createdBy.toString() === req.user.id
          ) {
            return next();
          }

          // Students can access published and active exams
          if (
            req.user.role === "student" &&
            exam.isActive &&
            exam.status === "published"
          ) {
            return next();
          }

          return res.status(403).json({
            success: false,
            message: "Not authorized to access this resource",
          });

        case "question":
          const Question = require("../models/Question");
          const question = await Question.findById(resourceId);

          if (!question) {
            return res.status(404).json({
              success: false,
              message: "Resource not found",
            });
          }

          // Instructors can access their own questions and approved questions
          if (req.user.role === "instructor") {
            if (
              question.createdBy.toString() === req.user.id ||
              question.status === "approved"
            ) {
              return next();
            }
          }

          return res.status(403).json({
            success: false,
            message: "Not authorized to access this resource",
          });

        case "attempt":
          const ExamAttempt = require("../models/ExamAttempt");
          const attempt =
            await ExamAttempt.findById(resourceId).populate("exam");

          if (!attempt) {
            return res.status(404).json({
              success: false,
              message: "Resource not found",
            });
          }

          // Students can access their own attempts
          if (
            req.user.role === "student" &&
            attempt.user.toString() === req.user.id
          ) {
            return next();
          }

          // Instructors can access attempts for their exams
          if (
            req.user.role === "instructor" &&
            attempt.exam.createdBy.toString() === req.user.id
          ) {
            return next();
          }

          return res.status(403).json({
            success: false,
            message: "Not authorized to access this resource",
          });

        case "user":
          const User = require("../models/User");
          const targetUser = await User.findById(resourceId);

          if (!targetUser) {
            return res.status(404).json({
              success: false,
              message: "Resource not found",
            });
          }

          // Users can access their own profile
          if (req.user.id === resourceId) {
            return next();
          }

          // Instructors can access student profiles
          if (req.user.role === "instructor" && targetUser.role === "student") {
            return next();
          }

          return res.status(403).json({
            success: false,
            message: "Not authorized to access this resource",
          });

        default:
          return res.status(500).json({
            success: false,
            message: "Unknown resource type",
          });
      }
    } catch (error) {
      console.error("Resource access check error:", error);
      return res.status(500).json({
        success: false,
        message: "Server error during authorization check",
      });
    }
  };
};

// Rate limiting for sensitive operations
const rateLimitSensitive = (windowMs = 15 * 60 * 1000, maxRequests = 5) => {
  const requests = new Map();

  return (req, res, next) => {
    const key = req.user ? req.user.id : req.ip;
    const now = Date.now();
    const windowStart = now - windowMs;

    // Clean old requests
    if (requests.has(key)) {
      const userRequests = requests
        .get(key)
        .filter((time) => time > windowStart);
      requests.set(key, userRequests);
    }

    const userRequests = requests.get(key) || [];

    if (userRequests.length >= maxRequests) {
      return res.status(429).json({
        success: false,
        message: "Too many requests. Please try again later.",
        retryAfter: Math.ceil((userRequests[0] + windowMs - now) / 1000),
      });
    }

    userRequests.push(now);
    requests.set(key, userRequests);

    next();
  };
};

// Middleware to log user actions for audit trail
const auditLog = (action) => {
  return (req, res, next) => {
    // Store original end function
    const originalEnd = res.end;

    // Override end function to log after response
    res.end = function (...args) {
      // Log the action
      console.log({
        timestamp: new Date().toISOString(),
        userId: req.user ? req.user.id : null,
        userRole: req.user ? req.user.role : null,
        action,
        method: req.method,
        url: req.originalUrl,
        ip: req.ip,
        userAgent: req.get("User-Agent"),
        statusCode: res.statusCode,
        resourceId: req.params.id || null,
      });

      // Call original end function
      originalEnd.apply(this, args);
    };

    next();
  };
};

// Middleware to check if user's email is verified for sensitive operations
const requireEmailVerification = (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({
      success: false,
      message: "Not authorized to access this route",
    });
  }

  if (!req.user.isEmailVerified) {
    return res.status(403).json({
      success: false,
      message: "Email verification required to perform this action",
    });
  }

  next();
};

// Middleware to check if user has 2FA enabled for admin operations
const require2FA = (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({
      success: false,
      message: "Not authorized to access this route",
    });
  }

  // For admin users, require 2FA for sensitive operations
  if (req.user.role === "admin" && !req.user.isTwoFactorEnabled) {
    return res.status(403).json({
      success: false,
      message: "Two-factor authentication required for this operation",
    });
  }

  next();
};

module.exports = {
  protect,
  authorize,
  checkPermission,
  checkResourceAccess,
  rateLimitSensitive,
  auditLog,
  requireEmailVerification,
  require2FA,
};

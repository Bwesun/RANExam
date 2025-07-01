const express = require("express");
const multer = require("multer");
const sharp = require("sharp");
const path = require("path");
const fs = require("fs");
const { protect } = require("../middleware/auth");
const router = express.Router();

// Apply protection to all routes
router.use(protect);

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    const uploadPath = path.join(__dirname, "../uploads");

    // Create uploads directory if it doesn't exist
    if (!fs.existsSync(uploadPath)) {
      fs.mkdirSync(uploadPath, { recursive: true });
    }

    cb(null, uploadPath);
  },
  filename: function (req, file, cb) {
    // Generate unique filename
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    cb(
      null,
      file.fieldname + "-" + uniqueSuffix + path.extname(file.originalname),
    );
  },
});

// File filter function
const fileFilter = (req, file, cb) => {
  // Check file type based on field name
  if (file.fieldname === "profileImage") {
    // Accept only image files
    if (file.mimetype.startsWith("image/")) {
      cb(null, true);
    } else {
      cb(new Error("Only image files are allowed for profile pictures"), false);
    }
  } else if (file.fieldname === "questionImage") {
    // Accept image files
    if (file.mimetype.startsWith("image/")) {
      cb(null, true);
    } else {
      cb(new Error("Only image files are allowed for questions"), false);
    }
  } else if (file.fieldname === "bulkImport") {
    // Accept CSV and JSON files
    if (
      file.mimetype === "text/csv" ||
      file.mimetype === "application/json" ||
      file.mimetype === "application/vnd.ms-excel"
    ) {
      cb(null, true);
    } else {
      cb(
        new Error("Only CSV and JSON files are allowed for bulk import"),
        false,
      );
    }
  } else {
    cb(new Error("Unknown file field"), false);
  }
};

const upload = multer({
  storage: storage,
  fileFilter: fileFilter,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB limit
    files: 5, // Maximum 5 files
  },
});

// @desc    Upload profile image
// @route   POST /api/upload/profile-image
// @access  Private
router.post(
  "/profile-image",
  upload.single("profileImage"),
  async (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({
          success: false,
          message: "No file uploaded",
        });
      }

      const User = require("../models/User");

      // Process image with Sharp
      const processedImagePath = path.join(
        path.dirname(req.file.path),
        "processed-" + req.file.filename,
      );

      await sharp(req.file.path)
        .resize(200, 200, {
          fit: "cover",
          position: "center",
        })
        .jpeg({ quality: 90 })
        .toFile(processedImagePath);

      // Delete original file
      fs.unlinkSync(req.file.path);

      // Update user profile
      const user = await User.findById(req.user.id);

      // Delete old profile image if it exists
      if (user.profileImage) {
        const oldImagePath = path.join(
          __dirname,
          "../uploads",
          path.basename(user.profileImage),
        );
        if (fs.existsSync(oldImagePath)) {
          fs.unlinkSync(oldImagePath);
        }
      }

      // Save new image path
      const imageUrl = `/uploads/processed-${req.file.filename}`;
      user.profileImage = imageUrl;
      await user.save();

      res.status(200).json({
        success: true,
        message: "Profile image uploaded successfully",
        data: {
          imageUrl: imageUrl,
          filename: `processed-${req.file.filename}`,
        },
      });
    } catch (error) {
      console.error("Profile image upload error:", error);

      // Clean up uploaded file on error
      if (req.file && fs.existsSync(req.file.path)) {
        fs.unlinkSync(req.file.path);
      }

      res.status(500).json({
        success: false,
        message: "Server error during image upload",
      });
    }
  },
);

// @desc    Upload question image
// @route   POST /api/upload/question-image
// @access  Private (Instructor/Admin)
router.post(
  "/question-image",
  upload.single("questionImage"),
  async (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({
          success: false,
          message: "No file uploaded",
        });
      }

      // Check user permissions
      if (req.user.role !== "instructor" && req.user.role !== "admin") {
        return res.status(403).json({
          success: false,
          message: "Not authorized to upload question images",
        });
      }

      // Process image with Sharp
      const processedImagePath = path.join(
        path.dirname(req.file.path),
        "question-" + req.file.filename,
      );

      await sharp(req.file.path)
        .resize(800, 600, {
          fit: "inside",
          withoutEnlargement: true,
        })
        .jpeg({ quality: 85 })
        .toFile(processedImagePath);

      // Delete original file
      fs.unlinkSync(req.file.path);

      const imageUrl = `/uploads/question-${req.file.filename}`;

      res.status(200).json({
        success: true,
        message: "Question image uploaded successfully",
        data: {
          imageUrl: imageUrl,
          filename: `question-${req.file.filename}`,
        },
      });
    } catch (error) {
      console.error("Question image upload error:", error);

      // Clean up uploaded file on error
      if (req.file && fs.existsSync(req.file.path)) {
        fs.unlinkSync(req.file.path);
      }

      res.status(500).json({
        success: false,
        message: "Server error during image upload",
      });
    }
  },
);

// @desc    Bulk import users/questions
// @route   POST /api/upload/bulk-import
// @access  Private (Admin only)
router.post("/bulk-import", upload.single("bulkImport"), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: "No file uploaded",
      });
    }

    // Check admin permissions
    if (req.user.role !== "admin") {
      return res.status(403).json({
        success: false,
        message: "Only admins can perform bulk imports",
      });
    }

    const { type } = req.body; // 'users' or 'questions'

    if (!type || !["users", "questions"].includes(type)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid import type. Must be "users" or "questions"',
      });
    }

    let data = [];

    // Parse file based on type
    if (req.file.mimetype === "application/json") {
      const fileContent = fs.readFileSync(req.file.path, "utf8");
      data = JSON.parse(fileContent);
    } else if (
      req.file.mimetype === "text/csv" ||
      req.file.mimetype === "application/vnd.ms-excel"
    ) {
      const csv = require("csv-parser");
      const results = [];

      await new Promise((resolve, reject) => {
        fs.createReadStream(req.file.path)
          .pipe(csv())
          .on("data", (data) => results.push(data))
          .on("end", resolve)
          .on("error", reject);
      });

      data = results;
    }

    // Clean up uploaded file
    fs.unlinkSync(req.file.path);

    if (!Array.isArray(data) || data.length === 0) {
      return res.status(400).json({
        success: false,
        message: "Invalid file format or empty data",
      });
    }

    let results = { success: 0, failed: 0, errors: [] };

    if (type === "users") {
      const User = require("../models/User");

      for (let i = 0; i < data.length; i++) {
        try {
          const userData = data[i];

          // Validate required fields
          if (
            !userData.name ||
            !userData.email ||
            !userData.password ||
            !userData.role
          ) {
            throw new Error(
              "Missing required fields: name, email, password, role",
            );
          }

          // Check if user already exists
          const existingUser = await User.findOne({ email: userData.email });
          if (existingUser) {
            throw new Error("User with this email already exists");
          }

          // Create user
          await User.create({
            name: userData.name,
            email: userData.email,
            password: userData.password,
            role: userData.role,
            department: userData.department,
            phoneNumber: userData.phoneNumber,
            isActive:
              userData.isActive !== undefined ? userData.isActive : true,
            isEmailVerified: true, // Auto-verify imported users
          });

          results.success++;
        } catch (error) {
          results.failed++;
          results.errors.push({
            row: i + 1,
            email: data[i].email || "unknown",
            error: error.message,
          });
        }
      }
    } else if (type === "questions") {
      const Question = require("../models/Question");

      for (let i = 0; i < data.length; i++) {
        try {
          const questionData = data[i];

          // Validate required fields
          if (
            !questionData.text ||
            !questionData.options ||
            !questionData.category
          ) {
            throw new Error("Missing required fields: text, options, category");
          }

          // Parse options if they're a string
          let options = questionData.options;
          if (typeof options === "string") {
            try {
              options = JSON.parse(options);
            } catch (e) {
              // Try to split by delimiter
              options = options.split("|").map((opt, index) => ({
                text: opt.trim(),
                isCorrect: index === (questionData.correctAnswer || 0),
              }));
            }
          }

          // Create question
          await Question.create({
            text: questionData.text,
            type: questionData.type || "multiple-choice",
            options: options,
            correctAnswer: questionData.correctAnswer || 0,
            explanation: questionData.explanation,
            difficulty: questionData.difficulty || "medium",
            category: questionData.category,
            subject: questionData.subject,
            topic: questionData.topic,
            marks: questionData.marks || 1,
            tags: questionData.tags
              ? questionData.tags.split(",").map((tag) => tag.trim())
              : [],
            createdBy: req.user.id,
            status: "approved", // Auto-approve imported questions for admin
          });

          results.success++;
        } catch (error) {
          results.failed++;
          results.errors.push({
            row: i + 1,
            text: (data[i].text || "").substring(0, 50) + "...",
            error: error.message,
          });
        }
      }
    }

    res.status(200).json({
      success: true,
      message: `Bulk import completed for ${type}`,
      data: results,
    });
  } catch (error) {
    console.error("Bulk import error:", error);

    // Clean up uploaded file on error
    if (req.file && fs.existsSync(req.file.path)) {
      fs.unlinkSync(req.file.path);
    }

    res.status(500).json({
      success: false,
      message: "Server error during bulk import",
    });
  }
});

// @desc    Delete uploaded file
// @route   DELETE /api/upload/:filename
// @access  Private
router.delete("/:filename", async (req, res) => {
  try {
    const { filename } = req.params;
    const filePath = path.join(__dirname, "../uploads", filename);

    // Security check - ensure filename doesn't contain path traversal
    if (
      filename.includes("..") ||
      filename.includes("/") ||
      filename.includes("\\")
    ) {
      return res.status(400).json({
        success: false,
        message: "Invalid filename",
      });
    }

    // Check if user owns the file (basic check for profile images)
    if (filename.startsWith("processed-") && req.user.profileImage) {
      const userImageFilename = path.basename(req.user.profileImage);
      if (userImageFilename !== filename) {
        return res.status(403).json({
          success: false,
          message: "Not authorized to delete this file",
        });
      }
    }

    // Check if file exists
    if (!fs.existsSync(filePath)) {
      return res.status(404).json({
        success: false,
        message: "File not found",
      });
    }

    // Delete file
    fs.unlinkSync(filePath);

    // If it's a profile image, update user record
    if (filename.startsWith("processed-") && req.user.profileImage) {
      const User = require("../models/User");
      await User.findByIdAndUpdate(req.user.id, { profileImage: null });
    }

    res.status(200).json({
      success: true,
      message: "File deleted successfully",
    });
  } catch (error) {
    console.error("Delete file error:", error);
    res.status(500).json({
      success: false,
      message: "Server error during file deletion",
    });
  }
});

// Error handling middleware for multer
router.use((error, req, res, next) => {
  if (error instanceof multer.MulterError) {
    if (error.code === "LIMIT_FILE_SIZE") {
      return res.status(400).json({
        success: false,
        message: "File too large. Maximum size is 5MB.",
      });
    }
    if (error.code === "LIMIT_FILE_COUNT") {
      return res.status(400).json({
        success: false,
        message: "Too many files. Maximum is 5 files.",
      });
    }
    if (error.code === "LIMIT_UNEXPECTED_FILE") {
      return res.status(400).json({
        success: false,
        message: "Unexpected file field.",
      });
    }
  }

  return res.status(400).json({
    success: false,
    message: error.message || "File upload error",
  });
});

module.exports = router;

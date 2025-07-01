const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
require("dotenv").config();

// Import models
const User = require("../models/User");
const Exam = require("../models/Exam");
const Question = require("../models/Question");

// Connect to database
mongoose.connect(
  process.env.MONGODB_URI || "mongodb://localhost:27017/ranexam",
  {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  },
);

const seedDatabase = async () => {
  try {
    console.log("🌱 Starting database seeding...");

    // Clear existing data
    await User.deleteMany({});
    await Exam.deleteMany({});
    await Question.deleteMany({});

    console.log("🗑️  Cleared existing data");

    // Create admin user
    const adminUser = await User.create({
      name: "Admin User",
      email: process.env.ADMIN_EMAIL || "admin@ranexam.com",
      password: process.env.ADMIN_PASSWORD || "admin123",
      role: "admin",
      department: "Administration",
      isActive: true,
      isEmailVerified: true,
      permissions: [
        "create_exam",
        "edit_exam",
        "delete_exam",
        "view_results",
        "manage_users",
        "export_data",
        "system_settings",
        "view_analytics",
      ],
    });

    console.log("👤 Created admin user");

    // Create instructor users
    const instructors = await User.create([
      {
        name: "Dr. Jane Smith",
        email: "jane.smith@ranexam.com",
        password: "instructor123",
        role: "instructor",
        department: "Computer Science",
        phoneNumber: "+1234567890",
        isActive: true,
        isEmailVerified: true,
        permissions: ["create_exam", "edit_exam", "view_results"],
      },
      {
        name: "Prof. John Doe",
        email: "john.doe@ranexam.com",
        password: "instructor123",
        role: "instructor",
        department: "Software Engineering",
        phoneNumber: "+1234567891",
        isActive: true,
        isEmailVerified: true,
        permissions: ["create_exam", "edit_exam", "view_results"],
      },
    ]);

    console.log("👨‍🏫 Created instructor users");

    // Create student users
    const students = await User.create([
      {
        name: "Alice Johnson",
        email: "alice.johnson@student.ranexam.com",
        password: "student123",
        role: "student",
        department: "Computer Science",
        phoneNumber: "+1234567892",
        isActive: true,
        isEmailVerified: true,
      },
      {
        name: "Bob Wilson",
        email: "bob.wilson@student.ranexam.com",
        password: "student123",
        role: "student",
        department: "Software Engineering",
        phoneNumber: "+1234567893",
        isActive: true,
        isEmailVerified: true,
      },
      {
        name: "Charlie Brown",
        email: "charlie.brown@student.ranexam.com",
        password: "student123",
        role: "student",
        department: "Information Technology",
        phoneNumber: "+1234567894",
        isActive: true,
        isEmailVerified: true,
      },
    ]);

    console.log("👨‍🎓 Created student users");

    // Create sample questions
    const questions = await Question.create([
      // JavaScript Questions
      {
        text: "What is the correct way to declare a variable in JavaScript?",
        type: "multiple-choice",
        options: [
          { text: "var x = 5;", isCorrect: true },
          { text: "variable x = 5;", isCorrect: false },
          { text: "v x = 5;", isCorrect: false },
          { text: "declare x = 5;", isCorrect: false },
        ],
        correctAnswer: 0,
        explanation:
          "The var keyword is used to declare variables in JavaScript.",
        difficulty: "easy",
        category: "JavaScript",
        subject: "Programming Fundamentals",
        topic: "Variables",
        marks: 2,
        tags: ["variables", "syntax", "fundamentals"],
        createdBy: instructors[0]._id,
        status: "approved",
      },
      {
        text: "Which of the following is NOT a JavaScript data type?",
        type: "multiple-choice",
        options: [
          { text: "Number", isCorrect: false },
          { text: "String", isCorrect: false },
          { text: "Boolean", isCorrect: false },
          { text: "Float", isCorrect: true },
        ],
        correctAnswer: 3,
        explanation:
          "JavaScript has Number type, but not a separate Float type.",
        difficulty: "medium",
        category: "JavaScript",
        subject: "Programming Fundamentals",
        topic: "Data Types",
        marks: 3,
        tags: ["data-types", "fundamentals"],
        createdBy: instructors[0]._id,
        status: "approved",
      },
      {
        text: 'What does the "this" keyword refer to in JavaScript?',
        type: "multiple-choice",
        options: [
          { text: "The current function", isCorrect: false },
          { text: "The current object", isCorrect: true },
          { text: "The global window", isCorrect: false },
          { text: "The parent element", isCorrect: false },
        ],
        correctAnswer: 1,
        explanation:
          'The "this" keyword refers to the object that is executing the current function.',
        difficulty: "medium",
        category: "JavaScript",
        subject: "Advanced JavaScript",
        topic: "Object-Oriented Programming",
        marks: 4,
        tags: ["this", "objects", "context"],
        createdBy: instructors[0]._id,
        status: "approved",
      },
      {
        text: "How do you create a function in JavaScript?",
        type: "multiple-choice",
        options: [
          { text: "function myFunction() {}", isCorrect: true },
          { text: "create myFunction() {}", isCorrect: false },
          { text: "def myFunction() {}", isCorrect: false },
          { text: "function = myFunction() {}", isCorrect: false },
        ],
        correctAnswer: 0,
        explanation:
          "Functions in JavaScript are declared using the function keyword.",
        difficulty: "easy",
        category: "JavaScript",
        subject: "Programming Fundamentals",
        topic: "Functions",
        marks: 2,
        tags: ["functions", "syntax"],
        createdBy: instructors[0]._id,
        status: "approved",
      },
      {
        text: 'What is the result of 3 + "3" in JavaScript?',
        type: "multiple-choice",
        options: [
          { text: "6", isCorrect: false },
          { text: "33", isCorrect: true },
          { text: "Error", isCorrect: false },
          { text: "undefined", isCorrect: false },
        ],
        correctAnswer: 1,
        explanation:
          "JavaScript performs string concatenation when adding a number and string.",
        difficulty: "medium",
        category: "JavaScript",
        subject: "Programming Fundamentals",
        topic: "Type Coercion",
        marks: 3,
        tags: ["type-coercion", "operators"],
        createdBy: instructors[0]._id,
        status: "approved",
      },

      // React Questions
      {
        text: "What is JSX in React?",
        type: "multiple-choice",
        options: [
          { text: "A JavaScript library", isCorrect: false },
          { text: "A syntax extension for JavaScript", isCorrect: true },
          { text: "A CSS framework", isCorrect: false },
          { text: "A database query language", isCorrect: false },
        ],
        correctAnswer: 1,
        explanation:
          "JSX is a syntax extension for JavaScript that allows you to write HTML-like code in React.",
        difficulty: "easy",
        category: "React",
        subject: "Frontend Development",
        topic: "JSX",
        marks: 2,
        tags: ["jsx", "syntax", "react"],
        createdBy: instructors[1]._id,
        status: "approved",
      },
      {
        text: "Which hook is used to manage state in functional components?",
        type: "multiple-choice",
        options: [
          { text: "useEffect", isCorrect: false },
          { text: "useState", isCorrect: true },
          { text: "useContext", isCorrect: false },
          { text: "useReducer", isCorrect: false },
        ],
        correctAnswer: 1,
        explanation:
          "useState is the React hook used to add state to functional components.",
        difficulty: "medium",
        category: "React",
        subject: "Frontend Development",
        topic: "Hooks",
        marks: 3,
        tags: ["hooks", "state", "useState"],
        createdBy: instructors[1]._id,
        status: "approved",
      },

      // Database Questions
      {
        text: "What does SQL stand for?",
        type: "multiple-choice",
        options: [
          { text: "Structured Query Language", isCorrect: true },
          { text: "Simple Query Language", isCorrect: false },
          { text: "Standard Query Language", isCorrect: false },
          { text: "Sequential Query Language", isCorrect: false },
        ],
        correctAnswer: 0,
        explanation: "SQL stands for Structured Query Language.",
        difficulty: "easy",
        category: "Database",
        subject: "Database Management",
        topic: "SQL Basics",
        marks: 2,
        tags: ["sql", "database", "fundamentals"],
        createdBy: instructors[1]._id,
        status: "approved",
      },
      {
        text: "Which SQL command is used to retrieve data from a database?",
        type: "multiple-choice",
        options: [
          { text: "GET", isCorrect: false },
          { text: "FETCH", isCorrect: false },
          { text: "SELECT", isCorrect: true },
          { text: "RETRIEVE", isCorrect: false },
        ],
        correctAnswer: 2,
        explanation:
          "The SELECT command is used to retrieve data from a database.",
        difficulty: "easy",
        category: "Database",
        subject: "Database Management",
        topic: "SQL Commands",
        marks: 2,
        tags: ["sql", "select", "queries"],
        createdBy: instructors[1]._id,
        status: "approved",
      },
      {
        text: "What is a primary key in a database?",
        type: "multiple-choice",
        options: [
          { text: "A key that can be null", isCorrect: false },
          {
            text: "A key that uniquely identifies each record",
            isCorrect: true,
          },
          { text: "A key that references another table", isCorrect: false },
          { text: "A key used for sorting", isCorrect: false },
        ],
        correctAnswer: 1,
        explanation:
          "A primary key uniquely identifies each record in a database table.",
        difficulty: "medium",
        category: "Database",
        subject: "Database Design",
        topic: "Keys and Constraints",
        marks: 3,
        tags: ["primary-key", "database-design", "constraints"],
        createdBy: instructors[1]._id,
        status: "approved",
      },
    ]);

    console.log("❓ Created sample questions");

    // Create sample exams
    const exams = await Exam.create([
      {
        title: "JavaScript Fundamentals Assessment",
        description:
          "Test your knowledge of JavaScript basics including variables, functions, and data types",
        category: "JavaScript",
        duration: 30,
        totalMarks: 100,
        passingMarks: 60,
        instructions:
          "Read all questions carefully. Select the best answer for each question. You cannot go back once you submit.",
        questions: questions
          .filter((q) => q.category === "JavaScript")
          .map((q) => q._id),
        settings: {
          randomizeQuestions: false,
          randomizeOptions: false,
          showResults: true,
          showCorrectAnswers: true,
          allowReview: true,
          maxAttempts: 3,
          timeLimit: true,
        },
        difficulty: "intermediate",
        tags: ["javascript", "fundamentals", "programming"],
        createdBy: instructors[0]._id,
        status: "published",
        isActive: true,
      },
      {
        title: "React Concepts Quiz",
        description:
          "Advanced React concepts including hooks, context, and performance optimization",
        category: "React",
        duration: 45,
        totalMarks: 150,
        passingMarks: 90,
        instructions:
          "This quiz covers advanced React concepts. Take your time and read each question carefully.",
        questions: questions
          .filter((q) => q.category === "React")
          .map((q) => q._id),
        settings: {
          randomizeQuestions: true,
          randomizeOptions: false,
          showResults: true,
          showCorrectAnswers: true,
          allowReview: true,
          maxAttempts: 2,
          timeLimit: true,
        },
        difficulty: "advanced",
        tags: ["react", "frontend", "hooks"],
        createdBy: instructors[1]._id,
        status: "published",
        isActive: true,
      },
      {
        title: "Database Design Principles",
        description:
          "SQL fundamentals, database normalization, and design patterns",
        category: "Database",
        duration: 60,
        totalMarks: 200,
        passingMarks: 120,
        instructions:
          "Comprehensive database exam covering SQL, normalization, and design principles.",
        questions: questions
          .filter((q) => q.category === "Database")
          .map((q) => q._id),
        settings: {
          randomizeQuestions: false,
          randomizeOptions: true,
          showResults: true,
          showCorrectAnswers: true,
          allowReview: true,
          maxAttempts: 2,
          timeLimit: true,
        },
        difficulty: "intermediate",
        tags: ["database", "sql", "design"],
        createdBy: instructors[1]._id,
        status: "published",
        isActive: true,
      },
      {
        title: "Web Development Basics (Draft)",
        description: "HTML, CSS, and JavaScript basics for web development",
        category: "Web Development",
        duration: 40,
        totalMarks: 120,
        passingMarks: 72,
        instructions:
          "This is a draft exam covering web development fundamentals.",
        questions: questions
          .filter((q) => q.category === "JavaScript")
          .slice(0, 3)
          .map((q) => q._id),
        settings: {
          randomizeQuestions: false,
          randomizeOptions: false,
          showResults: true,
          showCorrectAnswers: false,
          allowReview: false,
          maxAttempts: 1,
          timeLimit: true,
        },
        difficulty: "beginner",
        tags: ["web-development", "html", "css", "javascript"],
        createdBy: instructors[0]._id,
        status: "draft",
        isActive: false,
      },
    ]);

    console.log("📝 Created sample exams");

    // Update exam analytics with some sample data
    for (const exam of exams) {
      if (exam.status === "published") {
        exam.analytics.totalAttempts = Math.floor(Math.random() * 50) + 10;
        exam.analytics.completedAttempts = Math.floor(
          exam.analytics.totalAttempts * 0.8,
        );
        exam.analytics.averageScore = Math.floor(Math.random() * 30) + 60;
        exam.analytics.passRate = Math.floor(Math.random() * 40) + 60;
        exam.analytics.averageTimeSpent = Math.floor(Math.random() * 600) + 900;
        await exam.save();
      }
    }

    // Update user exam stats with sample data
    for (const student of students) {
      student.examStats.totalExams = Math.floor(Math.random() * 10) + 2;
      student.examStats.examsPassed = Math.floor(
        student.examStats.totalExams * 0.7,
      );
      student.examStats.examsFailed =
        student.examStats.totalExams - student.examStats.examsPassed;
      student.examStats.averageScore = Math.floor(Math.random() * 30) + 60;
      student.examStats.totalTimeSpent =
        Math.floor(Math.random() * 10000) + 5000;
      student.examStats.lastExamDate = new Date(
        Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000,
      );
      student.lastLogin = new Date(
        Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000,
      );
      student.loginCount = Math.floor(Math.random() * 50) + 10;
      await student.save();
    }

    console.log("📊 Updated analytics with sample data");

    console.log("✅ Database seeding completed successfully!");
    console.log("\n📋 Summary:");
    console.log(
      `👤 Users created: ${1 + instructors.length + students.length}`,
    );
    console.log(`❓ Questions created: ${questions.length}`);
    console.log(`📝 Exams created: ${exams.length}`);
    console.log("\n🔑 Default Login Credentials:");
    console.log(
      `Admin: ${adminUser.email} / ${process.env.ADMIN_PASSWORD || "admin123"}`,
    );
    console.log(`Instructor: ${instructors[0].email} / instructor123`);
    console.log(`Student: ${students[0].email} / student123`);
  } catch (error) {
    console.error("❌ Error seeding database:", error);
  } finally {
    mongoose.connection.close();
  }
};

// Run seeding
seedDatabase();

const { sequelize, User, Exam, Question } = require('../models');
const bcrypt = require('bcryptjs');
require('dotenv').config();

const seedDatabase = async () => {
  try {
    console.log('🌱 Starting database seeding...');

    // Sync all models
    await sequelize.sync({ force: true });

    console.log('🗑️  Cleared existing data');

    // Create admin user
    const adminUser = await User.create({
      name: 'Admin User',
      email: process.env.ADMIN_EMAIL || 'admin@ranexam.com',
      password: process.env.ADMIN_PASSWORD || 'admin123',
      role: 'admin',
    });

    console.log('👤 Created admin user');

    // Create instructor users
    const instructors = await User.bulkCreate([
      {
        name: 'Dr. Jane Smith',
        email: 'jane.smith@ranexam.com',
        password: 'instructor123',
        role: 'instructor',
      },
      {
        name: 'Prof. John Doe',
        email: 'john.doe@ranexam.com',
        password: 'instructor123',
        role: 'instructor',
      },
    ]);

    console.log('👨‍🏫 Created instructor users');

    // Create student users
    const students = await User.bulkCreate([
      {
        name: 'Alice Johnson',
        email: 'alice.johnson@student.ranexam.com',
        password: 'student123',
        role: 'student',
      },
      {
        name: 'Bob Wilson',
        email: 'bob.wilson@student.ranexam.com',
        password: 'student123',
        role: 'student',
      },
    ]);

    console.log('👨‍🎓 Created student users');

    // Create sample questions
    const questions = await Question.bulkCreate([
      {
        text: 'What is the correct way to declare a variable in JavaScript?',
        type: 'multiple-choice',
        options: [
          { text: 'var x = 5;', isCorrect: true },
          { text: 'variable x = 5;', isCorrect: false },
        ],
        correctAnswer: 0,
        explanation: 'The var keyword is used to declare variables in JavaScript.',
        difficulty: 'easy',
        category: 'JavaScript',
        marks: 2,
        createdBy: instructors[0].id,
      },
      {
        text: 'Which of the following is NOT a JavaScript data type?',
        type: 'multiple-choice',
        options: [
          { text: 'Number', isCorrect: false },
          { text: 'Float', isCorrect: true },
        ],
        correctAnswer: 1,
        explanation: 'JavaScript has a Number type, but not a separate Float type.',
        difficulty: 'medium',
        category: 'JavaScript',
        marks: 3,
        createdBy: instructors[0].id,
      },
      {
        text: 'What is JSX in React?',
        type: 'multiple-choice',
        options: [
          { text: 'A JavaScript library', isCorrect: false },
          { text: 'A syntax extension for JavaScript', isCorrect: true },
        ],
        correctAnswer: 1,
        explanation: 'JSX is a syntax extension for JavaScript that allows you to write HTML-like code in React.',
        difficulty: 'easy',
        category: 'React',
        marks: 2,
        createdBy: instructors[1].id,
      },
    ]);

    console.log('❓ Created sample questions');

    // Create sample exams
    const exams = await Exam.bulkCreate([
      {
        title: 'JavaScript Fundamentals Assessment',
        description: 'Test your knowledge of JavaScript basics',
        category: 'JavaScript',
        duration: 30,
        totalMarks: 100,
        passingMarks: 60,
        createdBy: instructors[0].id,
      },
      {
        title: 'React Concepts Quiz',
        description: 'Advanced React concepts',
        category: 'React',
        duration: 45,
        totalMarks: 150,
        passingMarks: 90,
        createdBy: instructors[1].id,
      },
    ]);

    console.log('📝 Created sample exams');

    // Add questions to exams
    await exams[0].addQuestion(questions.filter(q => q.category === 'JavaScript'));
    await exams[1].addQuestion(questions.filter(q => q.category === 'React'));

    console.log('✅ Database seeding completed successfully!');
  } catch (error) {
    console.error('❌ Error seeding database:', error);
  } finally {
    await sequelize.close();
  }
};

seedDatabase();
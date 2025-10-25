'use strict';
/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('Questions', {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER
      },
      text: {
        type: Sequelize.TEXT,
        allowNull: false,
      },
      type: {
        type: Sequelize.ENUM('multiple-choice', 'true-false', 'fill-blank', 'essay'),
        defaultValue: 'multiple-choice',
      },
      options: {
        type: Sequelize.JSONB
      },
      correctAnswer: {
        type: Sequelize.INTEGER
      },
      explanation: {
        type: Sequelize.TEXT
      },
      difficulty: {
        type: Sequelize.ENUM('easy', 'medium', 'hard'),
        defaultValue: 'medium',
      },
      category: {
        type: Sequelize.STRING,
        allowNull: false,
      },
      subject: {
        type: Sequelize.STRING,
      },
      topic: {
        type: Sequelize.STRING,
      },
      marks: {
        type: Sequelize.FLOAT,
        defaultValue: 1,
      },
      negativeMarking: {
        type: Sequelize.JSONB,
      },
      timeAllocation: {
        type: Sequelize.INTEGER,
      },
      multimedia: {
        type: Sequelize.JSONB,
      },
      formatting: {
        type: Sequelize.JSONB,
      },
      analytics: {
        type: Sequelize.JSONB,
      },
      tags: {
        type: Sequelize.ARRAY(Sequelize.STRING),
      },
      status: {
        type: Sequelize.ENUM('draft', 'review', 'approved', 'archived'),
      },
      createdBy: {
        type: Sequelize.INTEGER,
        references: {
          model: 'Users',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'SET NULL'
      },
      createdAt: {
        allowNull: false,
        type: Sequelize.DATE
      },
      updatedAt: {
        allowNull: false,
        type: Sequelize.DATE
      }
    });
  },
  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable('Questions');
  }
};
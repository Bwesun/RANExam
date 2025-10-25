'use strict';
/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('ExamAttempts', {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER
      },
      examId: {
        type: Sequelize.INTEGER,
        references: {
          model: 'Exams',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE'
      },
      userId: {
        type: Sequelize.INTEGER,
        references: {
          model: 'Users',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE'
      },
      attemptNumber: {
        type: Sequelize.INTEGER,
        allowNull: false,
      },
      status: {
        type: Sequelize.ENUM('in-progress', 'completed', 'abandoned'),
        defaultValue: 'in-progress',
      },
      startTime: {
        type: Sequelize.DATE,
        allowNull: false,
      },
      endTime: {
        type: Sequelize.DATE
      },
      timeSpent: {
        type: Sequelize.INTEGER,
      },
      score: {
        type: Sequelize.JSONB,
      },
      answers: {
        type: Sequelize.JSONB
      },
      result: {
        type: Sequelize.JSONB,
      },
      metadata: {
        type: Sequelize.JSONB,
      },
      proctoring: {
        type: Sequelize.JSONB,
      },
      submission: {
        type: Sequelize.JSONB,
      },
      review: {
        type: Sequelize.JSONB,
      },
      analytics: {
        type: Sequelize.JSONB,
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
    await queryInterface.dropTable('ExamAttempts');
  }
};
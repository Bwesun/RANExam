'use strict';
/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('Exams', {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER
      },
      title: {
        type: Sequelize.STRING,
        allowNull: false,
      },
      description: {
        type: Sequelize.TEXT
      },
      category: {
        type: Sequelize.STRING,
        allowNull: false,
      },
      duration: {
        type: Sequelize.INTEGER,
        allowNull: false,
      },
      totalMarks: {
        type: Sequelize.INTEGER,
        allowNull: false,
      },
      passingMarks: {
        type: Sequelize.INTEGER,
        allowNull: false,
      },
      isActive: {
        type: Sequelize.BOOLEAN,
        defaultValue: true,
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
      settings: {
        type: Sequelize.JSONB,
      },
      schedule: {
        type: Sequelize.JSONB,
      },
      analytics: {
        type: Sequelize.JSONB,
      },
      tags: {
        type: Sequelize.ARRAY(Sequelize.STRING),
      },
      difficulty: {
        type: Sequelize.ENUM('beginner', 'intermediate', 'advanced', 'expert'),
      },
      status: {
        type: Sequelize.ENUM('draft', 'published', 'archived'),
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
    await queryInterface.dropTable('Exams');
  }
};
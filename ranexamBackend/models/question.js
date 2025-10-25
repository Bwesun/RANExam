'use strict';
const {
  Model
} = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class Question extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      Question.belongsToMany(models.Exam, { through: 'ExamQuestions' });
      Question.belongsTo(models.User, { foreignKey: 'createdBy' });
    }
  }
  Question.init({
    text: {
      type: DataTypes.TEXT,
      allowNull: false
    },
    type: {
      type: DataTypes.ENUM('multiple-choice', 'true-false', 'fill-blank', 'essay'),
      defaultValue: 'multiple-choice'
    },
    options: DataTypes.JSONB,
    correctAnswer: DataTypes.INTEGER,
    explanation: DataTypes.TEXT,
    difficulty: {
      type: DataTypes.ENUM('easy', 'medium', 'hard'),
      defaultValue: 'medium'
    },
    category: {
      type: DataTypes.STRING,
      allowNull: false
    },
    subject: DataTypes.STRING,
    topic: DataTypes.STRING,
    marks: {
      type: DataTypes.FLOAT,
      defaultValue: 1
    },
    negativeMarking: DataTypes.JSONB,
    timeAllocation: DataTypes.INTEGER,
    multimedia: DataTypes.JSONB,
    formatting: DataTypes.JSONB,
    analytics: DataTypes.JSONB,
    tags: DataTypes.ARRAY(DataTypes.STRING),
    status: DataTypes.ENUM('draft', 'review', 'approved', 'archived'),
  }, {
    sequelize,
    modelName: 'Question',
  });
  return Question;
};
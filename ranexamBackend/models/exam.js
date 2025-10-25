'use strict';
const {
  Model
} = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class Exam extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      Exam.belongsTo(models.User, { foreignKey: 'createdBy' });
      Exam.belongsToMany(models.Question, { through: 'ExamQuestions' });
      Exam.hasMany(models.ExamAttempt, { foreignKey: 'examId' });
    }
  }
  Exam.init({
    title: {
      type: DataTypes.STRING,
      allowNull: false
    },
    description: DataTypes.TEXT,
    category: {
      type: DataTypes.STRING,
      allowNull: false
    },
    duration: {
      type: DataTypes.INTEGER,
      allowNull: false
    },
    totalMarks: {
      type: DataTypes.INTEGER,
      allowNull: false
    },
    passingMarks: {
      type: DataTypes.INTEGER,
      allowNull: false
    },
    isActive: {
      type: DataTypes.BOOLEAN,
      defaultValue: true
    },
    settings: DataTypes.JSONB,
    schedule: DataTypes.JSONB,
    analytics: DataTypes.JSONB,
    tags: DataTypes.ARRAY(DataTypes.STRING),
    difficulty: DataTypes.ENUM('beginner', 'intermediate', 'advanced', 'expert'),
    status: DataTypes.ENUM('draft', 'published', 'archived'),
  }, {
    sequelize,
    modelName: 'Exam',
  });
  return Exam;
};
'use strict';
const {
  Model
} = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class ExamAttempt extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      ExamAttempt.belongsTo(models.Exam, { foreignKey: 'examId' });
      ExamAttempt.belongsTo(models.User, { foreignKey: 'userId' });
    }
  }
  ExamAttempt.init({
    attemptNumber: {
      type: DataTypes.INTEGER,
      allowNull: false
    },
    status: {
      type: DataTypes.ENUM('in-progress', 'completed', 'abandoned'),
      defaultValue: 'in-progress'
    },
    startTime: {
      type: DataTypes.DATE,
      allowNull: false
    },
    endTime: DataTypes.DATE,
    timeSpent: DataTypes.INTEGER,
    score: DataTypes.JSONB,
    answers: DataTypes.JSONB,
    result: DataTypes.JSONB,
    metadata: DataTypes.JSONB,
    proctoring: DataTypes.JSONB,
    submission: DataTypes.JSONB,
    review: DataTypes.JSONB,
    analytics: DataTypes.JSONB,
  }, {
    sequelize,
    modelName: 'ExamAttempt',
  });
  return ExamAttempt;
};
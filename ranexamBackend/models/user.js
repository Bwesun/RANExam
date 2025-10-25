'use strict';
const { Model } = require('sequelize');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');

module.exports = (sequelize, DataTypes) => {
  class User extends Model {
    static associate(models) {
      User.hasMany(models.Exam, { as: 'createdExams', foreignKey: 'createdBy' });
      User.hasMany(models.ExamAttempt, { foreignKey: 'userId' });
      User.hasMany(models.Question, { as: 'createdQuestions', foreignKey: 'createdBy' });
    }

    async comparePassword(candidatePassword) {
      return await bcrypt.compare(candidatePassword, this.password);
    }

    getSignedJwtToken() {
      return jwt.sign({ id: this.id, role: this.role }, process.env.JWT_SECRET, {
        expiresIn: process.env.JWT_EXPIRE,
      });
    }

    getResetPasswordToken() {
      const resetToken = crypto.randomBytes(20).toString('hex');
      this.resetPasswordToken = crypto
        .createHash('sha256')
        .update(resetToken)
        .digest('hex');
      this.resetPasswordExpire = Date.now() + 10 * 60 * 1000; // 10 minutes
      return resetToken;
    }
  }
  User.init({
    name: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    email: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true,
      validate: {
        isEmail: true,
      },
    },
    password: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    role: {
      type: DataTypes.ENUM('student', 'instructor', 'admin'),
      defaultValue: 'student',
    },
    isActive: {
      type: DataTypes.BOOLEAN,
      defaultValue: true,
    },
    department: DataTypes.STRING,
    phoneNumber: DataTypes.STRING,
    address: DataTypes.STRING,
    profileImage: DataTypes.STRING,
    preferences: DataTypes.JSONB,
    resetPasswordToken: DataTypes.STRING,
    resetPasswordExpire: DataTypes.DATE,
  }, {
    sequelize,
    modelName: 'User',
    hooks: {
      beforeCreate: async (user) => {
        if (user.password) {
          const salt = await bcrypt.genSalt(10);
          user.password = await bcrypt.hash(user.password, salt);
        }
      },
      beforeUpdate: async (user) => {
        if (user.changed('password')) {
          const salt = await bcrypt.genSalt(10);
          user.password = await bcrypt.hash(user.password, salt);
        }
      }
    }
  });
  return User;
};
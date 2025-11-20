const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');
const Candidate = require('./Candidate');
const User = require('./User');

const PerformanceReview = sequelize.define('PerformanceReview', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true,
  },
  candidateId: {
    type: DataTypes.UUID,
    allowNull: false,
    references: {
      model: Candidate,
      key: 'id',
    },
  },
  reviewerId: {
    type: DataTypes.UUID,
    allowNull: false,
    references: {
      model: User,
      key: 'id',
    },
  },
  rating: {
    type: DataTypes.INTEGER,
    allowNull: false,
    validate: {
      min: 1,
      max: 5,
    },
  },
  summary: {
    type: DataTypes.TEXT,
    allowNull: true,
  },
  needHqIntervention: {
    type: DataTypes.BOOLEAN,
    defaultValue: false,
  },
  reviewDate: {
    type: DataTypes.DATEONLY,
    allowNull: false,
  },
});

module.exports = PerformanceReview;

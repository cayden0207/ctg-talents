const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');
const JV = require('./JV');

const Candidate = sequelize.define('Candidate', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  name: {
    type: DataTypes.STRING,
    allowNull: false
  },
  resumeUrl: {
    type: DataTypes.STRING,
    allowNull: true
  },
  status: {
    type: DataTypes.ENUM(
      'NEW', 'INTERVIEWING', 'READY', // POOL
      'PENDING_ACCEPTANCE', // TRANSIT
      'ONBOARDING', 'PROBATION', 'CONFIRMED', 'PIP', // ACTIVE
      'RESIGNED', 'TERMINATED', 'RETURNED' // END
    ),
    defaultValue: 'NEW'
  },
  interviewNotes: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  tags: {
    type: DataTypes.JSON, // Store as JSON array
    allowNull: true
  },
  currentJvId: {
    type: DataTypes.UUID,
    allowNull: true,
    references: {
      model: JV,
      key: 'id'
    }
  },
  performanceRating: {
    type: DataTypes.INTEGER,
    allowNull: true
  },
  performanceNotes: {
    type: DataTypes.TEXT,
    allowNull: true
  }
});

module.exports = Candidate;

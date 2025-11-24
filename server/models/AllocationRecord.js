const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const AllocationRecord = sequelize.define('AllocationRecord', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true,
  },
  candidateId: {
    type: DataTypes.UUID,
    allowNull: false,
  },
  jvId: {
    type: DataTypes.UUID,
    allowNull: false,
  },
  action: {
    type: DataTypes.ENUM('ALLOCATE', 'ACCEPT', 'REJECT', 'RETURN'),
    allowNull: false,
  },
  note: {
    type: DataTypes.TEXT,
    allowNull: true,
  }
}, {
  timestamps: true,
  updatedAt: false // Only care about creation time (history log)
});

module.exports = AllocationRecord;

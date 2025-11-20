const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');
const User = require('./User');

const AuditLog = sequelize.define('AuditLog', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true,
  },
  actorId: {
    type: DataTypes.UUID,
    allowNull: false,
    references: {
      model: User,
      key: 'id',
    },
  },
  entityType: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  entityId: {
    type: DataTypes.UUID,
    allowNull: false,
  },
  action: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  before: {
    type: DataTypes.JSON,
    allowNull: true,
  },
  after: {
    type: DataTypes.JSON,
    allowNull: true,
  },
});

module.exports = AuditLog;

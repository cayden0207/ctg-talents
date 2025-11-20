const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');
const JV = require('./JV');

const User = sequelize.define('User', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  email: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true
  },
  password: {
    type: DataTypes.STRING,
    allowNull: false
  },
  role: {
    type: DataTypes.ENUM('HQ_ADMIN', 'JV_PARTNER'),
    allowNull: false
  },
  jvId: {
    type: DataTypes.UUID,
    allowNull: true,
    references: {
      model: JV,
      key: 'id'
    }
  }
});

module.exports = User;

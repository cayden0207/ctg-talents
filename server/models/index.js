const sequelize = require('../config/database');
const User = require('./User');
const JV = require('./JV');
const Candidate = require('./Candidate');

// Associations
JV.hasMany(User, { foreignKey: 'jvId' });
User.belongsTo(JV, { foreignKey: 'jvId' });

JV.hasMany(Candidate, { foreignKey: 'currentJvId' });
Candidate.belongsTo(JV, { foreignKey: 'currentJvId' });

module.exports = {
  sequelize,
  User,
  JV,
  Candidate
};

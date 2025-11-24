const sequelize = require('../config/database');
const User = require('./User');
const JV = require('./JV');
const Candidate = require('./Candidate');
const PerformanceReview = require('./PerformanceReview');
const Notification = require('./Notification');
const AuditLog = require('./AuditLog');
const Comment = require('./Comment');
const AllocationRecord = require('./AllocationRecord');

// Associations
JV.hasMany(User, { foreignKey: 'jvId' });
User.belongsTo(JV, { foreignKey: 'jvId' });

// Allocation History
Candidate.hasMany(AllocationRecord, { foreignKey: 'candidateId', as: 'allocationHistory' });
AllocationRecord.belongsTo(Candidate, { foreignKey: 'candidateId' });
AllocationRecord.belongsTo(JV, { foreignKey: 'jvId' });
JV.hasMany(AllocationRecord, { foreignKey: 'jvId' });

JV.hasMany(Candidate, { foreignKey: 'currentJvId', as: 'currentCandidates' });
Candidate.belongsTo(JV, { foreignKey: 'currentJvId', as: 'currentJv' });

JV.hasMany(Candidate, { foreignKey: 'pendingJvId', as: 'pendingCandidates' });
Candidate.belongsTo(JV, { foreignKey: 'pendingJvId', as: 'pendingJv' });

Candidate.hasMany(PerformanceReview, { foreignKey: 'candidateId', as: 'reviews' });
PerformanceReview.belongsTo(Candidate, { foreignKey: 'candidateId' });
PerformanceReview.belongsTo(User, { foreignKey: 'reviewerId', as: 'reviewer' });
User.hasMany(PerformanceReview, { foreignKey: 'reviewerId', as: 'submittedReviews' });

Candidate.hasMany(Comment, { foreignKey: 'candidateId', as: 'comments' });
Comment.belongsTo(Candidate, { foreignKey: 'candidateId' });
Comment.belongsTo(User, { foreignKey: 'authorId', as: 'author' });
User.hasMany(Comment, { foreignKey: 'authorId' });

User.hasMany(Notification, { foreignKey: 'userId', as: 'notifications' });
Notification.belongsTo(User, { foreignKey: 'userId', as: 'user' });

User.hasMany(AuditLog, { foreignKey: 'actorId', as: 'actions' });
AuditLog.belongsTo(User, { foreignKey: 'actorId', as: 'actor' });

module.exports = {
  sequelize,
  User,
  JV,
  Candidate,
  PerformanceReview,
  Notification,
  AuditLog,
  Comment,
  AllocationRecord
};

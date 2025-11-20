const { Sequelize } = require('sequelize');
const path = require('path');

// Allow overriding SQLite path via env (useful for deployments with persistent disks)
const defaultPath = path.join(__dirname, '../../database.sqlite');
const storagePath = process.env.SQLITE_PATH || defaultPath;

const sequelize = new Sequelize({
  dialect: 'sqlite',
  storage: storagePath,
  logging: false,
});

module.exports = sequelize;

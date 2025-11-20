const { Sequelize } = require('sequelize');
const path = require('path');

// If DATABASE_URL is provided, prefer Postgres; otherwise fall back to SQLite
let sequelize;

if (process.env.DATABASE_URL) {
  // Example Railway DATABASE_URL: postgres://user:pass@host:port/db
  sequelize = new Sequelize(process.env.DATABASE_URL, {
    dialect: 'postgres',
    protocol: 'postgres',
    logging: false,
    dialectOptions: {
      ssl: process.env.PGSSLMODE === 'require' ? { require: true, rejectUnauthorized: false } : false,
    },
  });
} else {
  // Allow overriding SQLite path via env (useful for deployments with persistent disks)
  const defaultPath = path.join(__dirname, '../../database.sqlite');
  const storagePath = process.env.SQLITE_PATH || defaultPath;
  sequelize = new Sequelize({
    dialect: 'sqlite',
    storage: storagePath,
    logging: false,
  });
}

module.exports = sequelize;

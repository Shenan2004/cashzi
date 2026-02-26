const { Pool } = require("pg");
require("dotenv").config();

// Neon (and other cloud PG providers) give a single DATABASE_URL.
// Fall back to individual vars for local development.
const pool = new Pool(
  process.env.DATABASE_URL
    ? {
        connectionString: process.env.DATABASE_URL,
        ssl: { rejectUnauthorized: false }, // required by Neon
      }
    : {
        user: process.env.DB_USER,
        password: process.env.DB_PASSWORD,
        host: process.env.DB_HOST || "localhost",
        port: process.env.DB_PORT || 5432,
        database: process.env.DB_NAME || "cashzi",
      }
);

module.exports = pool;
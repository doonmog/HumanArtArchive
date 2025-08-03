const bcrypt = require('bcrypt');
const { Pool } = require('pg');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../../db/.env') });

const pool = new Pool({
  user: process.env.POSTGRES_USER,
  password: process.env.POSTGRES_PASSWORD,
  host: process.env.POSTGRES_HOST || 'localhost',
  port: process.env.POSTGRES_PORT || 5432,
  database: process.env.POSTGRES_DB || 'db',
});

async function seedAdmin() {
  try {
    const webUser = process.env.WEB_USER;
    const webPassword = process.env.WEB_PASSWORD;

    if (!webUser || !webPassword) {
      console.error('WEB_USER and WEB_PASSWORD must be set in .env file');
      process.exit(1);
    }

    const existingAdmin = await pool.query(
      'SELECT username FROM admin WHERE username = $1',
      [webUser]
    );

    if (existingAdmin.rows.length > 0) {
      console.log(`Admin user '${webUser}' already exists`);
      return;
    }

    const saltRounds = 12;
    const passwordHash = await bcrypt.hash(webPassword, saltRounds);

    await pool.query(
      'INSERT INTO admin (username, password_hash) VALUES ($1, $2)',
      [webUser, passwordHash]
    );

    console.log(`Admin user '${webUser}' created successfully`);

  } catch (error) {
    console.error('Error seeding admin user:', error);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

if (require.main === module) {
  seedAdmin();
}

module.exports = seedAdmin;

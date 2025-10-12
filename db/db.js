require('dotenv').config();
const sql = require('mssql');

/**
 * Data access object. Accepts connection config via constructor.
 */
class NorthwindDb {
  constructor(cfg) {
    this.cfg = cfg;
    this.poolPromise = null;
  }

  async getPool() {
    if (!this.poolPromise) {
      this.poolPromise = sql.connect(this.cfg);
    }
    return this.poolPromise;
  }

  // Returns a number (count of customers)
  async getCustomerCount() {
    const pool = await this.getPool();
    const result = await pool.request().query('SELECT COUNT(*) AS CustomerCount FROM dbo.Customers;');
    return result.recordset[0].CustomerCount;
  }

  // Returns an array of last names (strings)
  async getCustomerLastNames() {
    const pool = await this.getPool();
    // Northwind Customers table has ContactName, not separate first/last.
    // We'll split on the last space; if no space, use full name.
    const result = await pool.request().query(`
      SELECT ContactName
      FROM dbo.Customers
      ORDER BY ContactName;
    `);
    return result.recordset.map(r => {
      const name = r.ContactName ?? '';
      const parts = name.trim().split(' ');
      return parts.length > 1 ? parts[parts.length - 1] : name;
    });
  }

  // Returns an array of customer display names (strings)
  async getCustomerNames() {
    const pool = await this.getPool();
    const result = await pool.request().query(`
      SELECT ContactName
      FROM dbo.Customers
      ORDER BY ContactName;
    `);
    return result.recordset.map(r => r.ContactName);
  }
}

/**
 * Build config from .env (used by business layer)
 */
function buildConfigFromEnv() {
  return {
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    server: process.env.DB_SERVER,
    port: Number(process.env.DB_PORT || 1433),
    database: process.env.DB_NAME,
    options: {
      trustServerCertificate: true
    }
  };
}

module.exports = { NorthwindDb, buildConfigFromEnv };


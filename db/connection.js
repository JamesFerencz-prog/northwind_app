require("dotenv").config();
const sql = require("mssql");

const config = {
  server: process.env.DB_SERVER || "127.0.0.1",
  database: process.env.DB_DATABASE || "Northwind",
  user: process.env.DB_USER || "sa",
  password: process.env.DB_PASSWORD || "Test!1234",
  options: {
    encrypt: false,                 // disable SSL encryption for local dev
    trustServerCertificate: true,   // allow self-signed certs
    port: 1433                      // confirmed correct port
  }
};

let pool;
async function getPool() {
  if (!pool) {
    try {
      pool = await sql.connect(config);
      console.log("✅ Database connection successful");
    } catch (err) {
      console.error("❌ Database connection failed:", err.message);
      throw err;
    }
  }
  return pool;
}

module.exports = { sql, getPool };

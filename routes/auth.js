const express = require("express");
const bcrypt = require("bcrypt");
const { getPool } = require("../db/connection");
const sql = require("mssql");

const router = express.Router();

// Create table if missing
async function ensureAppUsers(pool) {
  await pool.request().query(`
    IF OBJECT_ID('dbo.AppUsers','U') IS NULL
    CREATE TABLE dbo.AppUsers(
      Id INT IDENTITY PRIMARY KEY,
      Username NVARCHAR(64) UNIQUE NOT NULL,
      PasswordHash NVARCHAR(200) NOT NULL
    );
  `);
}

// ---------- DEV: force-reset users to password "Test!1234" ----------
router.get("/dev/reset-student", async (_req, res) => {
  try {
    const pool = await getPool();
    await ensureAppUsers(pool);

    const hash = await bcrypt.hash("Test!1234", 10);

    // upsert student
    await pool.request()
      .input("u", sql.NVarChar(64), "student")
      .input("h", sql.NVarChar(200), hash)
      .query(`
        MERGE dbo.AppUsers AS t
        USING (SELECT @u AS Username, @h AS PasswordHash) s
        ON t.Username = s.Username
        WHEN MATCHED THEN UPDATE SET PasswordHash = s.PasswordHash
        WHEN NOT MATCHED THEN INSERT(Username, PasswordHash) VALUES (s.Username, s.PasswordHash);
      `);

    // optional second user
    await pool.request()
      .input("u", sql.NVarChar(64), "student2")
      .input("h", sql.NVarChar(200), hash)
      .query(`
        MERGE dbo.AppUsers AS t
        USING (SELECT @u AS Username, @h AS PasswordHash) s
        ON t.Username = s.Username
        WHEN MATCHED THEN UPDATE SET PasswordHash = s.PasswordHash
        WHEN NOT MATCHED THEN INSERT(Username, PasswordHash) VALUES (s.Username, s.PasswordHash);
      `);

    res.send("✅ Reset done. Users: student / student2. Password: Test!1234");
  } catch (err) {
    console.error("RESET ERROR:", err);
    res.status(500).send("Reset failed");
  }
});

// ---------- Login form ----------
router.get("/login", (_req, res) => {
  res.send(`<!doctype html><html><body>
    <h1>Login</h1>
    <form method="post" action="/login">
      <input name="username" placeholder="Username" />
      <input name="password" type="password" placeholder="Password" />
      <button type="submit">Login</button>
    </form>
  </body></html>`);
});

// ---------- Login handler ----------
router.post("/login", async (req, res) => {
  try {
    const { username, password } = req.body || {};
    if (!username || !password) return res.status(400).send("Missing username or password");

    const pool = await getPool();
    await ensureAppUsers(pool);

    const result = await pool.request()
      .input("username", sql.NVarChar(64), username)
      .query("SELECT Id, PasswordHash FROM dbo.AppUsers WHERE Username = @username");

    const user = result.recordset[0];
    if (!user) return res.status(401).send("Invalid credentials");

    const ok = await bcrypt.compare(password, user.PasswordHash);
    if (!ok) return res.status(401).send("Invalid credentials");

    req.session.userId = user.Id;
    res.redirect("/protected");
  } catch (err) {
    console.error("💥 LOGIN ERROR:", err);
    res.status(500).send("Server error during login");
  }
});

// ---------- Logout ----------
router.get("/logout", (req, res) => {
  req.session.destroy(() => res.redirect("/login"));
});

// ---------- Protected page ----------
router.get("/protected", (req, res) => {
  if (!req.session?.userId) return res.redirect("/login");
  res.send("You are logged in.");
});

module.exports = router;

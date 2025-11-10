// IT481 Unit 4 Server - Authentication + Three-Table Report (Northwind)
require("dotenv").config();
const express = require("express");
const session = require("express-session");
const path = require("path");

const requireAuth = require("./middleware/requireAuth");
const authRoutes = require("./routes/auth");
const reportRoutes = require("./routes/report");

const app = express();
const PORT = Number(process.env.APP_PORT || 3000);

// ---------- Middleware & Sessions ----------
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(
  session({
    secret: process.env.SESSION_SECRET || "change-me",
    resave: false,
    saveUninitialized: false,
  })
);

// ---------- Static Files (optional GUI folder) ----------
app.use(express.static(path.join(__dirname, "public")));

// ---------- Authentication Routes ----------
app.use(authRoutes);

// ---------- Protected Three-Table Report ----------
app.use(reportRoutes(requireAuth));

// ---------- Root ----------
app.get("/", (req, res) => {
  res.send(
    `<h1>Northwind Secure App</h1>
     <p><a href="/login">Login</a> to access protected routes.</p>`
  );
});

// ---------- Start Server ----------
app.listen(PORT, () => {
  console.log(`✅ Unit 4 server running at http://localhost:${PORT}`);
});

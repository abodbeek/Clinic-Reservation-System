const express = require("express");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const pool = require("../Config/db");
const protect = require("../middleware/auth.middleware");
const authorize = require("../middleware/role.middleware");

const router = express.Router();
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

router.post("/register", async (req, res) => {
  const { full_name, email, password } = req.body || {};
  if (
    typeof full_name !== "string" ||
    !full_name.trim() ||
    full_name.trim().length > 150 ||
    typeof email !== "string" ||
    !EMAIL_RE.test(email.trim()) ||
    email.trim().length > 255 ||
    typeof password !== "string" ||
    password.length < 8 ||
    Buffer.byteLength(password, "utf8") > 72
  ) {
    return res.status(400).json({ message: "Invalid name, email or password" });
  }
  try {
    const passwordHash = await bcrypt.hash(password, 12);
    const result = await pool.query(
      `INSERT INTO users (full_name, email, password_hash, role)
       VALUES ($1, $2, $3, 'PATIENT')
       RETURNING id, full_name, email, role, created_at`,
      [full_name.trim(), email.trim().toLowerCase(), passwordHash],
    );
    return res
      .status(201)
      .json({ message: "User registered successfully", user: result.rows[0] });
  } catch (err) {
    if (err.code === "23505")
      return res.status(409).json({ message: "Email already exists" });
    console.error(err);
    return res.status(500).json({ message: "Internal server error" });
  }
});

router.post("/login", async (req, res) => {
  const { email, password } = req.body || {};
  if (
    typeof email !== "string" ||
    !email.trim() ||
    typeof password !== "string" ||
    !password
  ) {
    return res.status(400).json({ message: "Email and password are required" });
  }
  try {
    const result = await pool.query(
      "SELECT id, full_name, email, password_hash, role FROM users WHERE email = $1",
      [email.trim().toLowerCase()],
    );
    const user = result.rows[0];
    if (!user || !(await bcrypt.compare(password, user.password_hash))) {
      return res.status(401).json({ message: "Invalid email or password" });
    }
    const token = jwt.sign({ sub: String(user.id) }, process.env.JWT_SECRET, {
      algorithm: "HS256",
      expiresIn: "1h",
    });
    return res.json({
      message: "Login successful",
      token,
      user: {
        id: user.id,
        full_name: user.full_name,
        email: user.email,
        role: user.role,
      },
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: "Internal server error" });
  }
});

router.get("/me", protect, async (req, res) => {
  return res.json({ user: req.user });
});

router.get("/admin-test", protect, authorize("ADMIN"), (_req, res) => {
  return res.json({ message: "Welcome Admin" });
});

module.exports = router;

const express = require("express");
const jwt = require("jsonwebtoken");
const User = require("../models/User");

const router = express.Router();

// Register user
router.post("/register", async (req, res) => {
  try {
    const { name, email, password, confirmPassword } = req.body;
    if (!name || !email || !password || !confirmPassword) {
      return res.status(400).json({ message: "All fields are required" });
    }
    if (password !== confirmPassword) {
      return res.status(400).json({ message: "Passwords do not match" });
    }

    const existing = await User.findOne({ email: email.toLowerCase() });
    if (existing) return res.status(409).json({ message: "Email already registered" });

    const user = await User.create({ name, email: email.toLowerCase(), password });
    const token = user.getSignedJwtToken();

    res.status(201).json({ message: "User registered", token, user: { id: user._id, name: user.name, email: user.email } });
  } catch (error) {
    res.status(500).json({ message: "Registration failed", error: error.message });
  }
});

// Login user
router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) return res.status(400).json({ message: "Email and password are required" });

    const user = await User.findOne({ email: email.toLowerCase() }).select("+password");
    if (!user) return res.status(401).json({ message: "Invalid email or password" });

    const isValid = await user.matchPassword(password);
    if (!isValid) return res.status(401).json({ message: "Invalid email or password" });
    if (!user.isActive) return res.status(403).json({ message: "User account inactive" });

    const token = user.getSignedJwtToken();
    res.json({ message: "Login successful", token, user: { id: user._id, name: user.name, email: user.email } });
  } catch (error) {
    res.status(500).json({ message: "Login failed", error: error.message });
  }
});

// Auth middleware for users
async function userAuthMiddleware(req, res, next) {
  try {
    const token = req.headers.authorization?.split(" ")[1];
    if (!token) return res.status(401).json({ message: "No token provided" });
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.id);
    if (!user || !user.isActive) return res.status(401).json({ message: "Invalid token or user inactive" });
    req.user = user;
    next();
  } catch (err) {
    res.status(401).json({ message: "Invalid token", error: err.message });
  }
}

router.get("/verify", userAuthMiddleware, (req, res) => {
  res.json({ message: "Token valid", user: { id: req.user._id, name: req.user.name, email: req.user.email } });
});

router.get("/me", userAuthMiddleware, (req, res) => {
  res.json({ user: { id: req.user._id, name: req.user.name, email: req.user.email, createdAt: req.user.createdAt } });
});

module.exports = router;

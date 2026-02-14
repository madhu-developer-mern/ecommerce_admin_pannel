const express = require("express");
const router = express.Router();
const {
  adminSignup,
  adminLogin,
  authMiddleware,
  verifyToken,
  getCurrentAdmin,
  forgotPassword,
  verifyOTP,
  resetPassword,
  changePassword,
  refreshAccessToken,
  logout
} = require("../controllers/adminAuthController");

router.post("/signup", adminSignup);
router.post("/login", adminLogin);
router.post("/refresh-token", refreshAccessToken);
router.post("/logout", authMiddleware, logout);
router.get("/verify", authMiddleware, verifyToken);
router.get("/me", authMiddleware, getCurrentAdmin);
router.post("/forgot-password", forgotPassword);
router.post("/verify-otp", verifyOTP);
router.post("/reset-password", resetPassword);
router.post("/change-password", authMiddleware, changePassword);

module.exports = { router, authMiddleware };

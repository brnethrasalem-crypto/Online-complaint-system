// routes/authRoutes.js
// Auth endpoints — registration, login, OTP verification, password reset.

const express = require("express");
const rateLimit = require("express-rate-limit");
const {
  registerUser,
  verifyOTP,
  loginUser,
  forgotPassword,
  resetPassword,
  resendOTP,
  getMe,
} = require("../controllers/authController");
const { protect } = require("../middleware/authMiddleware");

const router = express.Router();

// Stricter rate limit for sensitive auth endpoints (prevents brute-force/OTP abuse)
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100,
  message: {
    success: false,
    message: "Too many attempts from this IP. Please try again later.",
  },
});

router.post("/register", authLimiter, registerUser);
router.post("/verify-otp", authLimiter, verifyOTP);
router.post("/resend-otp", authLimiter, resendOTP);
router.post("/login", authLimiter, loginUser);
router.post("/forgot-password", authLimiter, forgotPassword);
router.put("/reset-password/:resetToken", authLimiter, resetPassword);
router.get("/me", protect, getMe);

module.exports = router;
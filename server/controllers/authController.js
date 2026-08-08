// controllers/authController.js
// Handles registration, login, OTP verification, and password reset flows.

const crypto = require("crypto");
const User = require("../models/User");
const generateToken = require("../utils/generateToken");
const sendEmail = require("../utils/sendEmail");

const wrapAsync = (fn) => (req, res, next) =>
  Promise.resolve(fn(req, res, next)).catch(next);

// @desc    Register a new user
// @route   POST /api/auth/register
// @access  Public
const registerUser = wrapAsync(async (req, res) => {
  const { name, email, password, phone, city, area, language, role } = req.body;

  if (!name || !email || !password || !phone) {
    res.status(400);
    throw new Error("Please provide name, email, password, and phone");
  }

  const userExists = await User.findOne({ email });
  if (userExists) {
    res.status(400);
    throw new Error("A user with this email already exists");
  }

  // Prevent public self-registration as Admin/Officer — only "User" allowed publicly.
  // Officer/Admin accounts should be created by an existing Admin via a protected route.
  const safeRole = role === "Officer" || role === "Admin" ? "User" : role || "User";

  const user = await User.create({
    name,
    email,
    password,
    phone,
    city,
    area,
    language,
    role: safeRole,
  });

  // Generate & send OTP for email verification
  const otp = user.generateOTP();
  await user.save({ validateBeforeSave: false });

  try {
    await sendEmail({
      to: user.email,
      subject: "Verify your Grievance System account",
      html: `<p>Hi ${user.name},</p><p>Your OTP for account verification is <b>${otp}</b>. It expires in ${process.env.OTP_EXPIRE_MINUTES || 10} minutes.</p>`,
    });
  } catch (err) {
    console.error("Failed to send OTP email:", err.message);
    // Do not block registration if email fails — user can request OTP resend
  }

  res.status(201).json({
    success: true,
    message: "Registration successful. Please verify your email with the OTP sent.",
    userId: user._id,
  });
});

// @desc    Verify OTP for account activation
// @route   POST /api/auth/verify-otp
// @access  Public
const verifyOTP = wrapAsync(async (req, res) => {
  const { email, otp } = req.body;

  if (!email || !otp) {
    res.status(400);
    throw new Error("Please provide email and OTP");
  }

  const user = await User.findOne({ email }).select("+otp.code +otp.expiresAt");

  if (!user) {
    res.status(404);
    throw new Error("User not found");
  }

  if (user.isVerified) {
    res.status(400);
    throw new Error("Account is already verified");
  }

  if (!user.otp || !user.otp.code) {
    res.status(400);
    throw new Error("No OTP found. Please request a new one");
  }

  if (user.otp.expiresAt < Date.now()) {
    res.status(400);
    throw new Error("OTP has expired. Please request a new one");
  }

  if (user.otp.code !== otp) {
    res.status(400);
    throw new Error("Invalid OTP");
  }

  user.isVerified = true;
  user.otp = undefined;
  await user.save({ validateBeforeSave: false });

  res.status(200).json({
    success: true,
    message: "Account verified successfully. You may now log in.",
  });
});

// @desc    Login user & get token
// @route   POST /api/auth/login
// @access  Public
const loginUser = wrapAsync(async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    res.status(400);
    throw new Error("Please provide email and password");
  }

  const user = await User.findOne({ email }).select("+password");

  if (!user || !(await user.matchPassword(password))) {
    res.status(401);
    throw new Error("Invalid email or password");
  }

  if (!user.isVerified) {
    res.status(403);
    throw new Error("Please verify your account via OTP before logging in");
  }

  if (!user.isActive) {
    res.status(403);
    throw new Error("Your account has been deactivated. Contact admin.");
  }

  user.lastLogin = Date.now();
  await user.save({ validateBeforeSave: false });

  const token = generateToken(user._id, user.role);

  res.status(200).json({
    success: true,
    token,
    user: {
      id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      phone: user.phone,
      city: user.city,
      area: user.area,
      language: user.language,
      department: user.department,
    },
  });
});

// @desc    Forgot password — sends reset link/token via email
// @route   POST /api/auth/forgot-password
// @access  Public
const forgotPassword = wrapAsync(async (req, res) => {
  const { email } = req.body;

  const user = await User.findOne({ email });
  if (!user) {
    // Avoid leaking whether an email is registered (security best practice)
    return res.status(200).json({
      success: true,
      message: "If that email is registered, a reset link has been sent",
    });
  }

  const resetToken = user.getResetPasswordToken();
  await user.save({ validateBeforeSave: false });

  const resetUrl = `${process.env.CLIENT_URL}/reset-password/${resetToken}`;

  try {
    await sendEmail({
      to: user.email,
      subject: "Password Reset Request — Grievance System",
      html: `<p>Hi ${user.name},</p><p>You requested a password reset. Click the link below (valid for 15 minutes):</p><p><a href="${resetUrl}">${resetUrl}</a></p><p>If you did not request this, please ignore this email.</p>`,
    });

    res.status(200).json({
      success: true,
      message: "If that email is registered, a reset link has been sent",
    });
  } catch (err) {
    user.resetPasswordToken = undefined;
    user.resetPasswordExpire = undefined;
    await user.save({ validateBeforeSave: false });

    res.status(500);
    throw new Error("Email could not be sent. Please try again later");
  }
});

// @desc    Reset password using token from email
// @route   PUT /api/auth/reset-password/:resetToken
// @access  Public
const resetPassword = wrapAsync(async (req, res) => {
  const { password } = req.body;

  if (!password || password.length < 8) {
    res.status(400);
    throw new Error("Password must be at least 8 characters long");
  }

  const resetPasswordToken = crypto
    .createHash("sha256")
    .update(req.params.resetToken)
    .digest("hex");

  const user = await User.findOne({
    resetPasswordToken,
    resetPasswordExpire: { $gt: Date.now() },
  });

  if (!user) {
    res.status(400);
    throw new Error("Invalid or expired reset token");
  }

  user.password = password; // Will be hashed via pre('save') hook
  user.resetPasswordToken = undefined;
  user.resetPasswordExpire = undefined;
  await user.save();

  const token = generateToken(user._id, user.role);

  res.status(200).json({
    success: true,
    message: "Password reset successful",
    token,
  });
});

// @desc    Resend OTP
// @route   POST /api/auth/resend-otp
// @access  Public
const resendOTP = wrapAsync(async (req, res) => {
  const { email } = req.body;

  const user = await User.findOne({ email });
  if (!user) {
    res.status(404);
    throw new Error("User not found");
  }

  if (user.isVerified) {
    res.status(400);
    throw new Error("Account is already verified");
  }

  const otp = user.generateOTP();
  await user.save({ validateBeforeSave: false });

  await sendEmail({
    to: user.email,
    subject: "Your new OTP — Grievance System",
    html: `<p>Your new OTP is <b>${otp}</b>. It expires in ${process.env.OTP_EXPIRE_MINUTES || 10} minutes.</p>`,
  });

  res.status(200).json({
    success: true,
    message: "OTP resent successfully",
  });
});

// @desc    Get current logged-in user profile
// @route   GET /api/auth/me
// @access  Private
const getMe = wrapAsync(async (req, res) => {
  const user = await User.findById(req.user._id);
  res.status(200).json({ success: true, user });
});

module.exports = {
  registerUser,
  verifyOTP,
  loginUser,
  forgotPassword,
  resetPassword,
  resendOTP,
  getMe,
};
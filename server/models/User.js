// models/User.js
// Core User schema — used for citizens, officers, and admins (role-differentiated).

const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
const crypto = require("crypto");

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "Name is required"],
      trim: true,
      maxlength: [100, "Name cannot exceed 100 characters"],
    },
    email: {
      type: String,
      required: [true, "Email is required"],
      unique: true,
      lowercase: true,
      trim: true,
      match: [
        /^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/,
        "Please enter a valid email address",
      ],
    },
    password: {
      type: String,
      required: [true, "Password is required"],
      minlength: [8, "Password must be at least 8 characters"],
      select: false, // Never return password by default
    },
    role: {
      type: String,
      enum: ["User", "Officer", "Admin"],
      default: "User",
    },
    phone: {
      type: String,
      required: [true, "Phone number is required"],
      match: [/^[6-9]\d{9}$/, "Please enter a valid 10-digit phone number"],
    },
    department: {
      // Relevant mainly for Officer/Admin roles
      type: mongoose.Schema.Types.ObjectId,
      ref: "Department",
      default: null,
    },
    city: {
      type: String,
      trim: true,
    },
    area: {
      type: String,
      trim: true,
    },
    language: {
      type: String,
      enum: ["English", "Hindi", "Tamil", "Telugu", "Kannada", "Other"],
      default: "English",
    },
    isVerified: {
      type: Boolean,
      default: false,
    },
    otp: {
      code: { type: String, select: false },
      expiresAt: { type: Date, select: false },
    },
    resetPasswordToken: {
      type: String,
      select: false,
    },
    resetPasswordExpire: {
      type: Date,
      select: false,
    },
    isActive: {
      type: Boolean,
      default: true, // For soft-disabling accounts
    },
    lastLogin: {
      type: Date,
    },
  },
  { timestamps: true }
);

// ---- Middleware: Hash password before save ----
userSchema.pre("save", async function (next) {
  if (!this.isModified("password")) return next();
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

// ---- Instance Method: Compare entered password with hashed password ----
userSchema.methods.matchPassword = async function (enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

// ---- Instance Method: Generate & hash password reset token ----
userSchema.methods.getResetPasswordToken = function () {
  const resetToken = crypto.randomBytes(20).toString("hex");

  this.resetPasswordToken = crypto
    .createHash("sha256")
    .update(resetToken)
    .digest("hex");

  this.resetPasswordExpire = Date.now() + 15 * 60 * 1000; // 15 minutes

  return resetToken; // Unhashed token sent via email
};

// ---- Instance Method: Generate OTP for verification ----
userSchema.methods.generateOTP = function () {
  const otp = Math.floor(100000 + Math.random() * 900000).toString();
  this.otp.code = otp;
  const expireMinutes = parseInt(process.env.OTP_EXPIRE_MINUTES) || 10;
  this.otp.expiresAt = Date.now() + expireMinutes * 60 * 1000;
  return otp;
};

module.exports = mongoose.model("User", userSchema);
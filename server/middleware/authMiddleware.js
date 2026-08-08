// middleware/authMiddleware.js
// JWT verification ("protect") and role-based access control ("authorize").

const jwt = require("jsonwebtoken");
const User = require("../models/User");

// Lightweight async wrapper that avoids requiring an extra package when it is unavailable.
const wrapAsync = (fn) => (req, res, next) =>
  Promise.resolve(fn(req, res, next)).catch(next);

// ---- Protect Routes: Verifies JWT and attaches user to req ----
const protect = wrapAsync(async (req, res, next) => {
  let token;

  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith("Bearer")
  ) {
    token = req.headers.authorization.split(" ")[1];
  } else if (req.cookies && req.cookies.token) {
    token = req.cookies.token;
  }

  if (!token) {
    res.status(401);
    throw new Error("Not authorized, no token provided");
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // Attach user (without password) to request object
    req.user = await User.findById(decoded.id).select("-password");

    if (!req.user) {
      res.status(401);
      throw new Error("Not authorized, user not found");
    }

    if (!req.user.isActive) {
      res.status(403);
      throw new Error("Account has been deactivated. Contact admin.");
    }

    next();
  } catch (error) {
    res.status(401);
    throw new Error("Not authorized, token verification failed");
  }
});

// ---- Role-Based Authorization ----
// Usage: authorize("Admin", "Officer")
const authorize = (...roles) => {
  return (req, res, next) => {
    if (!req.user || !roles.includes(req.user.role)) {
      res.status(403);
      throw new Error(
        `Role '${req.user ? req.user.role : "Unknown"}' is not authorized to access this resource`
      );
    }
    next();
  };
};

module.exports = { protect, authorize };
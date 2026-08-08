// models/ActivityLog.js
// Audit trail for critical actions (status changes, logins, role changes)
// — important for a grievance system's transparency/accountability requirements.

const mongoose = require("mongoose");

const activityLogSchema = new mongoose.Schema(
  {
    actor: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    action: {
      type: String,
      required: true, // e.g. "COMPLAINT_STATUS_UPDATED", "LOGIN", "USER_ROLE_CHANGED"
    },
    targetModel: {
      type: String, // e.g. "Complaint", "User"
    },
    targetId: {
      type: mongoose.Schema.Types.ObjectId,
    },
    metadata: {
      type: mongoose.Schema.Types.Mixed, // Flexible field for before/after values etc.
    },
    ipAddress: {
      type: String,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("ActivityLog", activityLogSchema);
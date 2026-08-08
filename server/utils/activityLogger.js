// utils/activityLogger.js
// Writes an entry to the ActivityLog collection. Never throws — logging
// failures should not break the main request flow.

const ActivityLog = require("../models/ActivityLog");

const logActivity = async ({ actor, action, targetModel, targetId, metadata, ipAddress }) => {
  try {
    await ActivityLog.create({
      actor,
      action,
      targetModel,
      targetId,
      metadata,
      ipAddress,
    });
  } catch (error) {
    console.error("Failed to write activity log:", error.message);
  }
};

module.exports = { logActivity };
// config/constants.js
// Central place for enums/constants used across models & controllers.

module.exports = {
  ROLES: {
    USER: "User",
    OFFICER: "Officer",
    ADMIN: "Admin",
  },
  COMPLAINT_STATUS: {
    PENDING: "Pending",
    ASSIGNED: "Assigned",
    IN_PROGRESS: "In Progress",
    UNDER_REVIEW: "Under Review",
    RESOLVED: "Resolved",
    CLOSED: "Closed",
  },
  PRIORITY: {
    LOW: "Low",
    MEDIUM: "Medium",
    HIGH: "High",
    CRITICAL: "Critical",
  },
};
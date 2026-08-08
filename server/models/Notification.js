// models/Notification.js
// In-app notification records, also used to drive Socket.IO real-time pushes.

const mongoose = require("mongoose");

const notificationSchema = new mongoose.Schema(
  {
    recipient: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    title: {
      type: String,
      required: true,
    },
    message: {
      type: String,
      required: true,
    },
    type: {
      type: String,
      enum: [
        "Complaint Update",
        "Assignment",
        "SLA Warning",
        "System",
        "Feedback Request",
      ],
      default: "System",
    },
    relatedComplaint: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Complaint",
    },
    isRead: {
      type: Boolean,
      default: false,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Notification", notificationSchema);
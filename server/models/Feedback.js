// models/Feedback.js
// Stores citizen feedback separately from the inline complaint rating,
// allowing richer analytics (e.g., service-quality surveys).

const mongoose = require("mongoose");

const feedbackSchema = new mongoose.Schema(
  {
    complaint: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Complaint",
      required: true,
    },
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    officer: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
    satisfactionScore: {
      type: Number,
      min: 1,
      max: 5,
      required: true,
    },
    resolutionSpeedScore: {
      type: Number,
      min: 1,
      max: 5,
    },
    comments: {
      type: String,
      maxlength: 1000,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Feedback", feedbackSchema);
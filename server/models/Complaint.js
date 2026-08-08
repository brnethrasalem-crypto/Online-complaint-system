// models/Complaint.js
// Central Complaint schema — tracks lifecycle from submission to resolution.

const mongoose = require("mongoose");

const timelineEntrySchema = new mongoose.Schema(
  {
    status: {
      type: String,
      enum: [
        "Pending",
        "Assigned",
        "In Progress",
        "Under Review",
        "Resolved",
        "Closed",
      ],
      required: true,
    },
    note: { type: String, trim: true },
    updatedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
    updatedAt: {
      type: Date,
      default: Date.now,
    },
  },
  { _id: false }
);

const complaintSchema = new mongoose.Schema(
  {
    complaintId: {
      // Human-readable unique tracking ID, e.g. GRV-2026-000123
      type: String,
      unique: true,
    },
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    title: {
      type: String,
      required: [true, "Complaint title is required"],
      trim: true,
      maxlength: 150,
    },
    description: {
      type: String,
      required: [true, "Complaint description is required"],
      maxlength: 2000,
    },
    category: {
      type: String,
      required: true,
      enum: [
        "Water Supply",
        "Electricity",
        "Roads & Infrastructure",
        "Sanitation",
        "Public Safety",
        "Health",
        "Education",
        "Corruption",
        "Other",
      ],
    },
    department: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Department",
      required: true,
    },
    priority: {
      type: String,
      enum: ["Low", "Medium", "High", "Critical"],
      default: "Medium",
    },
    status: {
      type: String,
      enum: [
        "Pending",
        "Assigned",
        "In Progress",
        "Under Review",
        "Resolved",
        "Closed",
      ],
      default: "Pending",
    },
    images: [
      {
        url: { type: String },
        publicId: { type: String }, // For cloud storage reference cleanup
      },
    ],
    documents: [
      {
        url: { type: String },
        fileName: { type: String },
      },
    ],
    location: {
      city: { type: String, required: true },
      area: { type: String, required: true },
      addressLine: { type: String },
      coordinates: {
        lat: { type: Number },
        lng: { type: Number },
      },
    },
    assignedOfficer: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User", // References a User with role = Officer
      default: null,
    },
    resolutionNotes: {
      type: String,
      maxlength: 2000,
    },
    timeline: [timelineEntrySchema],
    rating: {
      score: { type: Number, min: 1, max: 5 },
      comment: { type: String, maxlength: 500 },
      ratedAt: { type: Date },
    },
    slaDeadline: {
      // Service Level Agreement deadline — auto-calculated based on priority/category
      type: Date,
    },
    isEscalated: {
      type: Boolean,
      default: false,
    },
  },
  { timestamps: true }
);

// ---- Auto-generate a human-readable complaintId before saving ----
complaintSchema.pre("save", async function (next) {
  if (!this.isNew) return next();

  if (!this.complaintId) {
    const year = new Date().getFullYear();
    const count = await mongoose.model("Complaint").countDocuments();
    this.complaintId = `CMP-${year}-${String(count + 1).padStart(4, "0")}`;
  }

  // Push initial timeline entry
  this.timeline.push({
    status: this.status,
    note: "Complaint registered",
    updatedBy: this.user,
  });

  // Auto-calculate SLA deadline (example: Critical = 24h, High = 3d, Medium = 7d, Low = 14d)
  const slaMap = { Critical: 1, High: 3, Medium: 7, Low: 14 };
  const days = slaMap[this.priority] || 7;
  this.slaDeadline = new Date(Date.now() + days * 24 * 60 * 60 * 1000);

  next();
});

// Index for faster search/filter queries
complaintSchema.index({ status: 1, department: 1, priority: 1 });
complaintSchema.index({ "location.city": 1, "location.area": 1 });

module.exports = mongoose.model("Complaint", complaintSchema);
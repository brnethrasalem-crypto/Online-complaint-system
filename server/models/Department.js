// models/Department.js
// Represents a government department (e.g., Water, Electricity, Roads).

const mongoose = require("mongoose");

const departmentSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },
    code: {
      type: String, // Short code e.g. "WTR", "ELEC"
      required: true,
      unique: true,
      uppercase: true,
    },
    description: {
      type: String,
      maxlength: 500,
    },
    headOfficer: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
    city: {
      type: String,
    },
    contactEmail: {
      type: String,
    },
    contactPhone: {
      type: String,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Department", departmentSchema);
// seed/seedDepartments.js
// Run once to populate baseline Department documents.
// Usage: node seed/seedDepartments.js

const path = require("path");
require("dotenv").config({ path: path.join(__dirname, "..", ".env") });
const mongoose = require("mongoose");
const Department = require("../models/Department");

const departments = [
  { name: "Water Supply", code: "WTR", description: "Handles water supply and pipeline issues" },
  { name: "Electricity", code: "ELEC", description: "Handles power and electrical infrastructure" },
  { name: "Roads & Infrastructure", code: "ROAD", description: "Handles roads, bridges, and public infrastructure" },
  { name: "Sanitation", code: "SAN", description: "Handles waste management and sanitation" },
  { name: "Public Safety", code: "SAFE", description: "Handles public safety concerns" },
  { name: "Health", code: "HLTH", description: "Handles public health services" },
  { name: "Education", code: "EDU", description: "Handles education-related grievances" },
  { name: "Corruption", code: "CORR", description: "Handles corruption complaints" },
  { name: "Other", code: "OTH", description: "General/uncategorized complaints" },
];

const run = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log("Connected to MongoDB for seeding...");

    for (const dept of departments) {
      await Department.findOneAndUpdate(
        { code: dept.code },
        dept,
        { upsert: true, new: true }
      );
    }

    console.log(`✅ Seeded ${departments.length} departments`);
    process.exit(0);
  } catch (error) {
    console.error("❌ Seeding failed:", error.message);
    process.exit(1);
  }
};

run();
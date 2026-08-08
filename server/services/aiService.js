// services/aiService.js
// Lightweight rule-based "AI" categorization stub.
// Replace the body of predictComplaintContext with a real LLM/ML call later
// if your capstone requires it — this keeps the app fully functional without
// external API keys for now.

const Department = require("../models/Department");

const CATEGORY_KEYWORDS = {
  "Water Supply": ["water", "pipeline", "leak", "tap", "drainage"],
  Electricity: ["electric", "power", "voltage", "streetlight", "transformer"],
  "Roads & Infrastructure": ["road", "pothole", "bridge", "footpath", "construction"],
  Sanitation: ["garbage", "waste", "sewage", "trash", "sanitation", "toilet"],
  "Public Safety": ["safety", "crime", "accident", "unsafe", "harassment"],
  Health: ["hospital", "clinic", "health", "medicine", "doctor"],
  Education: ["school", "college", "education", "teacher"],
  Corruption: ["bribe", "corruption", "fraud"],
};

const PRIORITY_KEYWORDS = {
  Critical: ["emergency", "fire", "collapse", "death", "urgent"],
  High: ["danger", "unsafe", "severe", "major"],
  Low: ["minor", "cosmetic"],
};

const guessCategory = (text) => {
  const lower = text.toLowerCase();
  for (const [category, keywords] of Object.entries(CATEGORY_KEYWORDS)) {
    if (keywords.some((kw) => lower.includes(kw))) return category;
  }
  return null;
};

const guessPriority = (text) => {
  const lower = text.toLowerCase();
  for (const [priority, keywords] of Object.entries(PRIORITY_KEYWORDS)) {
    if (keywords.some((kw) => lower.includes(kw))) return priority;
  }
  return null;
};

// @param {Object} input - { title, description, city, area, department }
// @returns {Object} - { category, priority, department }
const predictComplaintContext = async ({ title, description, city, area, department }) => {
  const combinedText = `${title || ""} ${description || ""}`;

  const category = guessCategory(combinedText);
  const priority = guessPriority(combinedText);

  // If the caller already supplied a valid department ObjectId, trust it.
  // Otherwise, try to find a department whose name matches the guessed category.
  let resolvedDepartment = department || null;

  if (category) {
    try {
      const match = await Department.findOne({
        name: { $regex: category, $options: "i" },
      });
      if (match) resolvedDepartment = match._id;
    } catch (error) {
      console.error("Department lookup failed in aiService:", error.message);
    }
  }

  return {
    category,
    priority,
    department: resolvedDepartment,
  };
};

module.exports = { predictComplaintContext };
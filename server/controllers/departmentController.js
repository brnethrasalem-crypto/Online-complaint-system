const Department = require("../models/Department");

const wrapAsync = (fn) => (req, res, next) =>
  Promise.resolve(fn(req, res, next)).catch(next);

const getDepartments = wrapAsync(async (req, res) => {
  const departments = await Department.find({ isActive: true }).select("name code");
  res.status(200).json({ success: true, departments });
});

module.exports = { getDepartments };

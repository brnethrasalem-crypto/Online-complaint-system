const express = require("express");
const { getDashboardStats, exportComplaintReports } = require("../controllers/adminController");
const { protect, authorize } = require("../middleware/authMiddleware");

const router = express.Router();

router.get("/stats", protect, authorize("Admin"), getDashboardStats);
router.get("/reports/export", protect, authorize("Admin"), exportComplaintReports);

module.exports = router;

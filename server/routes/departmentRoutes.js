const express = require("express");
const { getDepartments } = require("../controllers/departmentController");
const { protect } = require("../middleware/authMiddleware");

const router = express.Router();

router.get("/", protect, getDepartments);

module.exports = router;

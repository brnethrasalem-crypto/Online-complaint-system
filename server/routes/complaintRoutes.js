const express = require("express");
const {
  createComplaint,
  getComplaints,
  getComplaintById,
  updateComplaintStatus,
  assignComplaint,
  deleteComplaint,
} = require("../controllers/complaintController");
const { protect, authorize } = require("../middleware/authMiddleware");
const upload = require("../middleware/uploadMiddleware");

const router = express.Router();

router.post(
  "/",
  protect,
  upload.fields([
    { name: "images", maxCount: 5 },
    { name: "documents", maxCount: 5 },
  ]),
  createComplaint
);

router.get("/", protect, getComplaints);
router.get("/:id", protect, getComplaintById);
router.put("/:id/status", protect, updateComplaintStatus);
router.put("/:id/assign", protect, authorize("Admin"), assignComplaint);
router.delete("/:id", protect, deleteComplaint);

module.exports = router;
const Complaint = require("../models/Complaint");
const User = require("../models/User");
const Department = require("../models/Department");
const sendEmail = require("../utils/sendEmail");
const { logActivity } = require("../utils/activityLogger");
const { predictComplaintContext } = require("../services/aiService");

const wrapAsync = (fn) => (req, res, next) =>
  Promise.resolve(fn(req, res, next)).catch(next);

const buildFilePayload = (req) => {
  const images = [];
  const documents = [];

  if (req.files?.images) {
    req.files.images.forEach((file) => {
      images.push({
        url: `/uploads/${file.filename}`,
        publicId: file.filename,
      });
    });
  }

  if (req.files?.documents) {
    req.files.documents.forEach((file) => {
      documents.push({
        url: `/uploads/${file.filename}`,
        fileName: file.originalname,
      });
    });
  }

  return { images, documents };
};

const generateComplaintId = () => {
  const year = new Date().getFullYear();
  const randomPart = Math.floor(1000 + Math.random() * 9000).toString();
  return `CMP-${year}-${randomPart}`;
};

const canAccessComplaint = (user, complaint) => {
  if (!user || !complaint) return false;
  if (user.role === "Admin" || user.role === "Officer") return true;
  return complaint.user?.toString() === user._id.toString();
};

const notifyComplaintUpdate = async (complaint, subject, message) => {
  try {
    const complainant = await User.findById(complaint.user);
    if (complainant?.email) {
      await sendEmail({
        to: complainant.email,
        subject,
        html: `<p>Hi ${complainant.name || "there"},</p><p>${message}</p><p>Complaint ID: <b>${complaint.complaintId}</b></p>`,
      });
    }
  } catch (error) {
    console.error("Failed to send complaint email notification:", error.message);
  }
};

const emitComplaintUpdate = (req, complaint, payload) => {
  const io = req.app.get("io");
  if (!io) return;

  if (complaint.user) {
    io.to(String(complaint.user)).emit("notification", {
      type: "complaint-updated",
      complaintId: complaint.complaintId,
      payload,
    });
  }

  if (complaint.assignedOfficer) {
    io.to(String(complaint.assignedOfficer)).emit("notification", {
      type: "complaint-updated",
      complaintId: complaint.complaintId,
      payload,
    });
  }
};

// @desc    Register a new complaint
// @route   POST /api/complaints
// @access  Private
const createComplaint = wrapAsync(async (req, res) => {
  const {
    title,
    description,
    category,
    department,
    priority,
    city,
    area,
    addressLine,
    lat,
    lng,
  } = req.body;

  if (!title || !description || !category || !department || !city || !area) {
    res.status(400);
    throw new Error("Please provide title, description, category, department, city, and area");
  }

  const prediction = await predictComplaintContext({
    title,
    description,
    city,
    area,
    department,
  });

  const resolvedDepartmentId = prediction.department || department;
  const departmentExists = await Department.findById(resolvedDepartmentId);
  if (!departmentExists) {
    res.status(404);
    throw new Error("Department not found");
  }

  const filePayload = buildFilePayload(req);
  const complaint = await Complaint.create({
    complaintId: generateComplaintId(),
    user: req.user._id,
    title,
    description,
    category: prediction.category || category,
    department: resolvedDepartmentId,
    priority: priority || prediction.priority || "Medium",
    location: {
      city,
      area,
      addressLine: addressLine || "",
      coordinates: {
        lat: lat ? Number(lat) : undefined,
        lng: lng ? Number(lng) : undefined,
      },
    },
    images: filePayload.images,
    documents: filePayload.documents,
  });

  await logActivity({
    actor: req.user._id,
    action: "COMPLAINT_CREATED",
    targetModel: "Complaint",
    targetId: complaint._id,
    metadata: {
      complaintId: complaint.complaintId,
      category,
      department,
      status: complaint.status,
    },
    ipAddress: req.ip,
  });

  await notifyComplaintUpdate(
    complaint,
    "Complaint Received",
    "Your complaint has been successfully registered. We will keep you updated on progress."
  );

  const populatedComplaint = await Complaint.findById(complaint._id)
    .populate("user", "name email phone")
    .populate("department", "name code")
    .populate("assignedOfficer", "name email role");

  emitComplaintUpdate(req, complaint, {
    event: "created",
    status: complaint.status,
    category: complaint.category,
    priority: complaint.priority,
  });

  res.status(201).json({
    success: true,
    message: "Complaint registered successfully",
    complaint: populatedComplaint,
    aiPrediction: prediction,
  });
});

// @desc    Get complaints with search, filter, and pagination
// @route   GET /api/complaints
// @access  Private
const getComplaints = wrapAsync(async (req, res) => {
  const {
    search,
    category,
    priority,
    department,
    status,
    city,
    date,
    page = 1,
    limit = 10,
  } = req.query;

  const pageNumber = Math.max(1, Number(page));
  const limitNumber = Math.min(100, Math.max(1, Number(limit)));
  const skip = (pageNumber - 1) * limitNumber;

  const query = {};

  if (req.user.role === "User") {
    query.user = req.user._id;
  }

  if (search) {
    query.$or = [
      { title: { $regex: search, $options: "i" } },
      { description: { $regex: search, $options: "i" } },
      { complaintId: { $regex: search, $options: "i" } },
      { "location.city": { $regex: search, $options: "i" } },
    ];
  }

  if (category) query.category = category;
  if (priority) query.priority = priority;
  if (department) query.department = department;
  if (status) query.status = status;
  if (city) query["location.city"] = { $regex: city, $options: "i" };

  if (date) {
    const start = new Date(date);
    start.setHours(0, 0, 0, 0);
    const end = new Date(date);
    end.setHours(23, 59, 59, 999);
    query.createdAt = { $gte: start, $lte: end };
  }

  const total = await Complaint.countDocuments(query);
  const complaints = await Complaint.find(query)
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(limitNumber)
    .populate("user", "name email phone")
    .populate("department", "name code")
    .populate("assignedOfficer", "name email role");

  res.status(200).json({
    success: true,
    count: complaints.length,
    page: pageNumber,
    pages: Math.ceil(total / limitNumber),
    total,
    complaints,
  });
});

// @desc    Get complaint details including timeline and officer info
// @route   GET /api/complaints/:id
// @access  Private
const getComplaintById = wrapAsync(async (req, res) => {
  const complaint = await Complaint.findById(req.params.id)
    .populate("user", "name email phone city area")
    .populate("department", "name code")
    .populate("assignedOfficer", "name email role phone")
    .populate({ path: "timeline.updatedBy", select: "name email role" });

  if (!complaint) {
    res.status(404);
    throw new Error("Complaint not found");
  }

  if (!canAccessComplaint(req.user, complaint)) {
    res.status(403);
    throw new Error("You are not authorized to view this complaint");
  }

  res.status(200).json({
    success: true,
    complaint,
  });
});

// @desc    Update complaint status and add work notes
// @route   PUT /api/complaints/:id/status
// @access  Private (Officer/Admin or complaint owner)
const updateComplaintStatus = wrapAsync(async (req, res) => {
  const { status, note, resolutionNotes } = req.body;

  if (!status) {
    res.status(400);
    throw new Error("Please provide a status");
  }

  const complaint = await Complaint.findById(req.params.id);
  if (!complaint) {
    res.status(404);
    throw new Error("Complaint not found");
  }

  if (!canAccessComplaint(req.user, complaint) && req.user.role !== "Admin" && req.user.role !== "Officer") {
    res.status(403);
    throw new Error("You are not authorized to update this complaint");
  }

  if (req.user.role !== "Admin" && req.user.role !== "Officer" && complaint.user.toString() !== req.user._id.toString()) {
    res.status(403);
    throw new Error("You are not authorized to update this complaint");
  }

  const previousStatus = complaint.status;
  complaint.status = status;
  if (resolutionNotes !== undefined) {
    complaint.resolutionNotes = resolutionNotes;
  }

  complaint.timeline.push({
    status,
    note: note || "Status updated",
    updatedBy: req.user._id,
    updatedAt: new Date(),
  });

  if (status === "Resolved" || status === "Closed") {
    complaint.isEscalated = false;
  } else if (complaint.slaDeadline && new Date() > complaint.slaDeadline) {
    complaint.isEscalated = true;
  }

  await complaint.save();

  await logActivity({
    actor: req.user._id,
    action: "COMPLAINT_STATUS_UPDATED",
    targetModel: "Complaint",
    targetId: complaint._id,
    metadata: {
      previousStatus,
      newStatus: status,
      note,
    },
    ipAddress: req.ip,
  });

  await notifyComplaintUpdate(
    complaint,
    "Complaint Status Updated",
    `The status of your complaint has been updated to ${status}.`
  );

  emitComplaintUpdate(req, complaint, {
    event: "status-updated",
    status,
    note,
  });

  const updatedComplaint = await Complaint.findById(complaint._id)
    .populate("user", "name email phone")
    .populate("department", "name code")
    .populate("assignedOfficer", "name email role")
    .populate({ path: "timeline.updatedBy", select: "name email role" });

  res.status(200).json({
    success: true,
    message: "Complaint status updated successfully",
    complaint: updatedComplaint,
  });
});

// @desc    Assign a complaint to an officer
// @route   PUT /api/complaints/:id/assign
// @access  Private (Admin only)
const assignComplaint = wrapAsync(async (req, res) => {
  const { officerId } = req.body;

  if (!officerId) {
    res.status(400);
    throw new Error("Please provide an officerId");
  }

  const complaint = await Complaint.findById(req.params.id);
  if (!complaint) {
    res.status(404);
    throw new Error("Complaint not found");
  }

  const officer = await User.findById(officerId);
  if (!officer || officer.role !== "Officer") {
    res.status(404);
    throw new Error("Officer not found");
  }

  complaint.assignedOfficer = officer._id;
  complaint.status = complaint.status === "Pending" ? "Assigned" : complaint.status;
  complaint.timeline.push({
    status: complaint.status,
    note: `Assigned to ${officer.name}`,
    updatedBy: req.user._id,
    updatedAt: new Date(),
  });

  await complaint.save();

  await logActivity({
    actor: req.user._id,
    action: "COMPLAINT_ASSIGNED",
    targetModel: "Complaint",
    targetId: complaint._id,
    metadata: {
      officerId: officer._id,
      officerName: officer.name,
    },
    ipAddress: req.ip,
  });

  await notifyComplaintUpdate(
    complaint,
    "Complaint Assigned",
    `Your complaint has been assigned to ${officer.name}.`
  );

  emitComplaintUpdate(req, complaint, {
    event: "assigned",
    assignedOfficer: officer.name,
  });

  const updatedComplaint = await Complaint.findById(complaint._id)
    .populate("user", "name email phone")
    .populate("department", "name code")
    .populate("assignedOfficer", "name email role")
    .populate({ path: "timeline.updatedBy", select: "name email role" });

  res.status(200).json({
    success: true,
    message: "Complaint assigned successfully",
    complaint: updatedComplaint,
  });
});
// @desc    Delete a complaint (only if still Pending, or if Admin)
// @route   DELETE /api/complaints/:id
// @access  Private (owner while Pending, or Admin anytime)
const deleteComplaint = wrapAsync(async (req, res) => {
  const complaint = await Complaint.findById(req.params.id);

  if (!complaint) {
    res.status(404);
    throw new Error("Complaint not found");
  }

  const isOwner = complaint.user.toString() === req.user._id.toString();
  const isAdmin = req.user.role === "Admin";

  if (!isOwner && !isAdmin) {
    res.status(403);
    throw new Error("You are not authorized to delete this complaint");
  }

  // Regular users can only delete while still Pending; Admins can delete anytime.
  if (isOwner && !isAdmin && complaint.status !== "Pending") {
    res.status(400);
    throw new Error("Only pending complaints can be deleted");
  }

  await complaint.deleteOne();

  await logActivity({
    actor: req.user._id,
    action: "COMPLAINT_DELETED",
    targetModel: "Complaint",
    targetId: complaint._id,
    metadata: { complaintId: complaint.complaintId, status: complaint.status },
    ipAddress: req.ip,
  });

  res.status(200).json({
    success: true,
    message: "Complaint deleted successfully",
  });
});

module.exports = {
  createComplaint,
  getComplaints,
  getComplaintById,
  updateComplaintStatus,
  assignComplaint,
  deleteComplaint,
};
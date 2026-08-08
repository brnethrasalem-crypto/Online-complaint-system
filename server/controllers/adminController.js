const Complaint = require("../models/Complaint");
const Department = require("../models/Department");
const User = require("../models/User");

const wrapAsync = (fn) => (req, res, next) =>
  Promise.resolve(fn(req, res, next)).catch(next);

const getDashboardStats = wrapAsync(async (req, res) => {
  let complaints = [];

  try {
    complaints = await Complaint.find({}).lean();
  } catch (error) {
    complaints = [];
  }

  const monthlyComplaints = complaints.reduce((acc, complaint) => {
    const month = new Date(complaint.createdAt).toLocaleString("default", { month: "short", year: "numeric" });
    acc[month] = (acc[month] || 0) + 1;
    return acc;
  }, {});

  const departmentDistribution = complaints.reduce((acc, complaint) => {
    const departmentName = complaint.department?.name || "Unassigned";
    acc[departmentName] = (acc[departmentName] || 0) + 1;
    return acc;
  }, {});

  const priorityBreakdown = complaints.reduce((acc, complaint) => {
    acc[complaint.priority || "Medium"] = (acc[complaint.priority || "Medium"] || 0) + 1;
    return acc;
  }, {});

  const resolutionTimes = complaints
    .filter((complaint) => complaint.status === "Resolved" || complaint.status === "Closed")
    .map((complaint) => {
      const createdAt = new Date(complaint.createdAt).getTime();
      const updatedAt = new Date(complaint.updatedAt).getTime();
      const diffHours = Math.max(1, Math.round((updatedAt - createdAt) / (1000 * 60 * 60)));
      return diffHours;
    });

  const avgResolutionHours = resolutionTimes.length
    ? Math.round(resolutionTimes.reduce((sum, value) => sum + value, 0) / resolutionTimes.length)
    : 0;

  res.status(200).json({
    success: true,
    stats: {
      totalComplaints: complaints.length,
      resolvedComplaints: complaints.filter((complaint) => complaint.status === "Resolved" || complaint.status === "Closed").length,
      pendingComplaints: complaints.filter((complaint) => complaint.status !== "Resolved" && complaint.status !== "Closed").length,
      monthlyComplaints,
      departmentDistribution,
      priorityBreakdown,
      avgResolutionHours,
    },
  });
});

const exportComplaintReports = wrapAsync(async (req, res) => {
  let complaints = [];

  try {
    complaints = await Complaint.find({})
      .populate("user", "name email")
      .populate("department", "name code")
      .populate("assignedOfficer", "name email")
      .lean();
  } catch (error) {
    complaints = [];
  }

  const payload = complaints.map((complaint) => ({
    complaintId: complaint.complaintId,
    title: complaint.title,
    category: complaint.category,
    priority: complaint.priority,
    status: complaint.status,
    department: complaint.department?.name || "N/A",
    complainant: complaint.user?.name || "N/A",
    assignedOfficer: complaint.assignedOfficer?.name || "Unassigned",
    city: complaint.location?.city || "N/A",
    createdAt: complaint.createdAt,
    updatedAt: complaint.updatedAt,
  }));

  res.status(200).json({
    success: true,
    export: payload,
  });
});

module.exports = {
  getDashboardStats,
  exportComplaintReports,
};

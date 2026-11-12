
const express = require("express");
const router = express.Router();

const protect = require("../middleware/authMiddleware");

const {
  getOverviewAnalytics,
  getMonthlyAnalytics,
  getCategoryAnalytics,
  getDailyAnalytics,
  getYearlyAnalytics,
  getAnomalyAnalytics
} = require("../controllers/analyticsController");

// Protect all analytics endpoints.
router.use(protect);

// Overview analytics.
router.get("/overview", getOverviewAnalytics);

// Monthly analytics.
router.get("/monthly", getMonthlyAnalytics);

// Category-wise expense analytics.
router.get("/categories", getCategoryAnalytics);

// Daily spending analytics.
router.get("/daily", getDailyAnalytics);

// Yearly financial analytics.
router.get("/yearly", getYearlyAnalytics);

// AI-powered spending anomaly detection.
router.get("/anomalies", getAnomalyAnalytics);

module.exports = router;

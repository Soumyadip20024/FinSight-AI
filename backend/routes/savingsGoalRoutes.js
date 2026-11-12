
const express = require("express");
const router = express.Router();

// JWT authentication middleware
const protect = require("../middleware/authMiddleware");

// Savings goal controller functions
const {
  createSavingsGoal,
  getSavingsGoals,
  updateSavingsGoal,
  deleteSavingsGoal
} = require("../controllers/savingsGoalController");

// All savings goal routes require authentication
router.use(protect);

// CREATE a savings goal
router.post("/", createSavingsGoal);

// GET all savings goals
router.get("/", getSavingsGoals);

// UPDATE a savings goal
router.put("/:id", updateSavingsGoal);

// DELETE a savings goal
router.delete("/:id", deleteSavingsGoal);

module.exports = router;

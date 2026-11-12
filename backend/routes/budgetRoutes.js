
const express = require("express");
const router = express.Router();

// JWT authentication middleware
const protect = require("../middleware/authMiddleware");

// Budget controller functions
const {
  createBudget,
  getBudgets,
  updateBudget,
  deleteBudget
} = require("../controllers/budgetController");

// All budget routes require authentication
router.use(protect);

// CREATE a budget
router.post("/", createBudget);

// GET all budgets
router.get("/", getBudgets);

// UPDATE a budget
router.put("/:id", updateBudget);

// DELETE a budget
router.delete("/:id", deleteBudget);

module.exports = router;


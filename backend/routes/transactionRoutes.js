
const express = require("express");
const router = express.Router();

const protect = require("../middleware/authMiddleware");

const {
  createTransaction,
  getTransactions,
  updateTransaction,
  deleteTransaction
} = require("../controllers/transactionController");

// All transaction routes require authentication
router.use(protect);

// CREATE transaction
router.post("/", createTransaction);

// READ all transactions
router.get("/", getTransactions);

// UPDATE transaction
router.put("/:id", updateTransaction);

// DELETE transaction
router.delete("/:id", deleteTransaction);

module.exports = router;

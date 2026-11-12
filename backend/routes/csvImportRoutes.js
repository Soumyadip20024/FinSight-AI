
const express = require("express");
const router = express.Router();

// JWT authentication middleware
const protect = require("../middleware/authMiddleware");

// Multer upload middleware
const upload = require("../middleware/uploadMiddleware");

// CSV import controller
const {
  importTransactions
} = require("../controllers/csvImportController");

// All CSV import routes require authentication
router.use(protect);

// Import transactions from CSV
router.post(
  "/",
  upload.single("file"),
  importTransactions
);

module.exports = router;

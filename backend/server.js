
const express = require("express");
const cors = require("cors");
const dotenv = require("dotenv");
const helmet = require("helmet");

// Load environment variables
dotenv.config();

// Database connection
const connectDB = require("./config/db");

// Routes
const authRoutes = require("./routes/authRoutes");
const transactionRoutes = require("./routes/transactionRoutes");
const budgetRoutes = require("./routes/budgetRoutes");
const savingsGoalRoutes = require("./routes/savingsGoalRoutes");

const csvImportRoutes = require("./routes/csvImportRoutes");

const analyticsRoutes = require("./routes/analyticsRoutes");

// Error handling
const errorHandler = require("./middleware/errorMiddleware");

// Initialize Express
const app = express();

// Security middleware
app.use(helmet());

// Enable frontend communication
app.use(
  cors({
    origin: process.env.CLIENT_URL || "http://localhost:5173"
  })
);

// Parse JSON requests
app.use(express.json({ limit: "1mb" }));

// Root API
app.get("/", (req, res) => {
  res.json({
    success: true,
    message: "Welcome to FinSight AI API"
  });
});

// Health check
app.get("/api/health", (req, res) => {
  res.json({
    success: true,
    service: "FinSight AI Backend",
    database: "Connected"
  });
});

// Authentication routes
app.use("/api/auth", authRoutes);

// Transaction routes (JWT protected)
app.use("/api/transactions", transactionRoutes);

// Budget routes (JWT protected)
app.use("/api/budgets", budgetRoutes);

// Savings goal routes (JWT protected)
app.use("/api/savings-goals", savingsGoalRoutes);

// CSV transaction import routes (JWT protected)
app.use("/api/import/csv", csvImportRoutes);

app.use("/api/analytics", analyticsRoutes);

// Handle unknown routes
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: `Route not found: ${req.method} ${req.originalUrl}`
  });
});

// Centralized error handler (must be last)
app.use(errorHandler);

// Start server after database connection
const PORT = process.env.PORT || 5000;

const startServer = async () => {
  try {
    await connectDB();

    app.listen(PORT, () => {
      console.log(`FinSight AI Backend running on port ${PORT}`);
    });
  } catch (error) {
    console.error("Server startup failed:", error.message);
    process.exit(1);
  }
};

startServer();

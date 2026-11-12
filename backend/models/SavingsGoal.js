
const mongoose = require("mongoose");

// Define Savings Goal Schema
const savingsGoalSchema = new mongoose.Schema(
  {
    // User who owns this savings goal
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true
    },

    // Savings goal title
    title: {
      type: String,
      required: true,
      trim: true
    },

    // Target savings amount
    targetAmount: {
      type: Number,
      required: true,
      min: 1
    },

    // Amount saved so far
    savedAmount: {
      type: Number,
      default: 0,
      min: 0
    },

    // Goal completion deadline
    deadline: {
      type: Date
    },

    // Current goal status
    status: {
      type: String,
      enum: ["active", "completed"],
      default: "active"
    }
  },
  {
    timestamps: true
  }
);

// Export SavingsGoal Model
module.exports = mongoose.model(
  "SavingsGoal",
  savingsGoalSchema
);

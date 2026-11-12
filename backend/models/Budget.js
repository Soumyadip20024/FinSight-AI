
const mongoose = require("mongoose");

// Define Budget Schema
const budgetSchema = new mongoose.Schema(
  {
    // User who owns this budget
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true
    },

    // Expense category
    category: {
      type: String,
      required: true,
      trim: true
    },

    // Maximum spending limit
    limit: {
      type: Number,
      required: true,
      min: 0
    },

    // Budget month (1-12)
    month: {
      type: Number,
      required: true,
      min: 1,
      max: 12
    },

    // Budget year
    year: {
      type: Number,
      required: true
    }
  },
  {
    timestamps: true
  }
);

// Prevent duplicate budgets for the same user,
// category, month and year.
budgetSchema.index(
  {
    userId: 1,
    category: 1,
    month: 1,
    year: 1
  },
  {
    unique: true
  }
);

// Export Budget Model
module.exports = mongoose.model("Budget", budgetSchema);


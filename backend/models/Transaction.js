
const mongoose = require("mongoose");

// Define Transaction Schema
const transactionSchema = new mongoose.Schema(
  {
    // Reference to the user who owns this transaction
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true
    },

    // Transaction title
    title: {
      type: String,
      required: true,
      trim: true
    },

    // Transaction amount
    amount: {
      type: Number,
      required: true,
      min: 0.01
    },

    // Income or expense
    type: {
      type: String,
      enum: ["income", "expense"],
      required: true
    },

    // Expense category
    category: {
      type: String,
      default: "Uncategorized"
    },

    // Additional description
    description: {
      type: String,
      default: ""
    },

    // Transaction date
    date: {
      type: Date,
      required: true,
      default: Date.now
    },

    // Payment method
    paymentMethod: {
      type: String,
      enum: ["cash", "upi", "card", "bank_transfer", "other"],
      default: "other"
    },

    // Recurring transaction
    isRecurring: {
      type: Boolean,
      default: false
    },

    // AI categorization status
    
    // AI categorization status
    aiCategorized: {
      type: Boolean,
      default: false
    },

    // AI prediction confidence (0–100)
    aiCategoryConfidence: {
      type: Number,
      min: 0,
      max: 100,
      default: null
    },

    // Source of AI categorization
    aiCategorySource: {
      type: String,
      enum: ["keyword_rule", "machine_learning", null],
      default: null
    },

    // Flag for predictions requiring manual review
    aiNeedsReview: {
      type: Boolean,
      default: false
    }

  },
  {
    timestamps: true
  }
);

// Index for faster user-wise transaction queries
transactionSchema.index({ userId: 1, date: -1 });

// Export Transaction Model
module.exports = mongoose.model("Transaction", transactionSchema);

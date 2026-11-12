
const mongoose = require("mongoose");

// Define User Schema
const userSchema = new mongoose.Schema(
  {
    // User's full name
    name: {
      type: String,
      required: true,
      trim: true
    },

    // Unique email address
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true
    },

    // Password will be stored as a bcrypt hash
    password: {
      type: String,
      required: true,
      minlength: 8,
      select: false
    },

    // Default currency
    currency: {
      type: String,
      default: "INR"
    },

    // Monthly income
    monthlyIncome: {
      type: Number,
      default: 0,
      min: 0
    }
  },
  {
    timestamps: true
  }
);

// Export User Model
module.exports = mongoose.model("User", userSchema);

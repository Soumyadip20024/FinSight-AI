
const Transaction = require("../models/Transaction");

const { categorizeTransaction } = require("../services/mlService");

// Create a new transaction
// Create a new transaction with automatic expense categorization
const createTransaction = async (req, res, next) => {
  try {
    const {
      title,
      amount,
      type,
      category,
      description,
      date,
      paymentMethod,
      isRecurring
    } = req.body;

    // Validate required fields
    if (!title || amount === undefined || !type) {
      return res.status(400).json({
        success: false,
        message: "Title, amount and type are required"
      });
    }

    // Validate amount
    if (!Number.isFinite(Number(amount)) || Number(amount) <= 0) {
      return res.status(400).json({
        success: false,
        message: "Amount must be greater than zero"
      });
    }

    // Validate transaction type
    if (!["income", "expense"].includes(type)) {
      return res.status(400).json({
        success: false,
        message: "Type must be income or expense"
      });
    }

    // Preserve a category explicitly selected by the user
    const hasManualCategory =
      typeof category === "string" && category.trim().length > 0;

    let finalCategory = hasManualCategory
      ? category.trim()
      : "Uncategorized";

    // Default AI metadata
    let aiCategorized = false;
    let aiCategoryConfidence = null;
    let aiCategorySource = null;
    let aiNeedsReview = false;

    // Automatically categorize only expenses without a manual category
    if (type === "expense" && !hasManualCategory) {
      const transactionDescription =
        typeof description === "string" && description.trim()
          ? description.trim()
          : title.trim();

      try {
        const result = await categorizeTransaction(
          transactionDescription
        );

        const prediction = result?.data;

        if (
          result?.success &&
          prediction &&
          typeof prediction.category === "string" &&
          prediction.category.trim()
        ) {
          finalCategory = prediction.category.trim();

          aiCategorized = true;

          aiCategoryConfidence =
            prediction.confidence !== null &&
            prediction.confidence !== undefined &&
            Number.isFinite(Number(prediction.confidence))
              ? Number(prediction.confidence)
              : null;

          aiCategorySource = prediction.source || null;
          aiNeedsReview = Boolean(prediction.needs_review);
        } else {
          aiNeedsReview = true;
        }

      } catch (mlError) {
        // Do not block transaction creation if ML service is unavailable
        console.error(
          "Expense categorization unavailable:",
          mlError.message
        );

        aiNeedsReview = true;
      }
    }

    // Create transaction for authenticated user only
    const transaction = await Transaction.create({
      userId: req.user.id,
      title: title.trim(),
      amount: Number(amount),
      type,
      category: finalCategory,
      description,
      date,
      paymentMethod,
      isRecurring,

      // AI categorization metadata
      aiCategorized,
      aiCategoryConfidence,
      aiCategorySource,
      aiNeedsReview
    });

    return res.status(201).json({
      success: true,
      message: "Transaction created successfully",
      transaction
    });

  } catch (error) {
    next(error);
  }
};

 // Get all transactions for the authenticated user
const getTransactions = async (req, res, next) => {
  try {
    const {
      type,
      category,
      page = 1,
      limit = 10
    } = req.query;

    // Build user-specific query
    const filter = {
      userId: req.user.id
    };

    // Optional filters
    if (type) {
      if (!["income", "expense"].includes(type)) {
        return res.status(400).json({
          success: false,
          message: "Invalid transaction type"
        });
      }

      filter.type = type;
    }

    if (category) {
      filter.category = category;
    }

    // Validate pagination
    const currentPage = Math.max(1, parseInt(page, 10) || 1);
    const pageSize = Math.min(
      100,
      Math.max(1, parseInt(limit, 10) || 10)
    );

    const skip = (currentPage - 1) * pageSize;

    // Fetch transactions
    const [transactions, total] = await Promise.all([
      Transaction.find(filter)
        .sort({ date: -1, createdAt: -1 })
        .skip(skip)
        .limit(pageSize),

      Transaction.countDocuments(filter)
    ]);

    return res.status(200).json({
      success: true,
      count: transactions.length,
      total,
      currentPage,
      totalPages: Math.ceil(total / pageSize),
      transactions
    });

  } catch (error) {
    next(error);
  }
};


const updateTransaction = async (req, res, next) => {
  try {
    const allowedFields = [
      "title",
      "amount",
      "type",
      "category",
      "description",
      "date",
      "paymentMethod",
      "isRecurring"
    ];

    const updates = {};

    // Accept only explicitly allowed fields
    for (const field of allowedFields) {
      if (req.body[field] !== undefined) {
        updates[field] = req.body[field];
      }
    }

    if (Object.keys(updates).length === 0) {
      return res.status(400).json({
        success: false,
        message: "No valid fields provided for update"
      });
    }

    // Validate title
    if (
      updates.title !== undefined &&
      (typeof updates.title !== "string" || !updates.title.trim())
    ) {
      return res.status(400).json({
        success: false,
        message: "Title cannot be empty"
      });
    }

    // Validate amount
    if (updates.amount !== undefined) {
      if (
        !Number.isFinite(Number(updates.amount)) ||
        Number(updates.amount) <= 0
      ) {
        return res.status(400).json({
          success: false,
          message: "Amount must be greater than zero"
        });
      }

      updates.amount = Number(updates.amount);
    }

    // Validate type
    if (
      updates.type !== undefined &&
      !["income", "expense"].includes(updates.type)
    ) {
      return res.status(400).json({
        success: false,
        message: "Type must be income or expense"
      });
    }

    // Normalize title
    if (updates.title !== undefined) {
      updates.title = updates.title.trim();
    }

    // Update only the authenticated user's transaction
    const transaction = await Transaction.findOneAndUpdate(
      {
        _id: req.params.id,
        userId: req.user.id
      },
      { $set: updates },
      {
        new: true,
        runValidators: true
      }
    );

    if (!transaction) {
      return res.status(404).json({
        success: false,
        message: "Transaction not found"
      });
    }

    return res.status(200).json({
      success: true,
      message: "Transaction updated successfully",
      transaction
    });

  } catch (error) {
    next(error);
  }
};


const deleteTransaction = async (req, res, next) => {
  try {
    // Find and delete only the authenticated user's transaction
    const transaction = await Transaction.findOneAndDelete({
      _id: req.params.id,
      userId: req.user.id
    });

    if (!transaction) {
      return res.status(404).json({
        success: false,
        message: "Transaction not found"
      });
    }

    return res.status(200).json({
      success: true,
      message: "Transaction deleted successfully"
    });

  } catch (error) {
    next(error);
  }
};


module.exports = {
  createTransaction,
  getTransactions,
  updateTransaction,
  deleteTransaction
};
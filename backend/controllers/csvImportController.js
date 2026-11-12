
const csv = require("csv-parser");
const { Readable } = require("stream");
const Transaction = require("../models/Transaction");
const { categorizeTransaction } = require("../services/mlService");

// IMPORT TRANSACTIONS FROM CSV
const importTransactions = async (req, res, next) => {
  try {
    // Check whether a file was uploaded
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: "Please upload a CSV file"
      });
    }

    const results = [];
    const rejectedRows = [];

    // Read CSV data from uploaded file buffer
    await new Promise((resolve, reject) => {
      Readable.from(req.file.buffer)
        .pipe(csv())
        .on("data", (row) => {
          results.push(row);
        })
        .on("end", resolve)
        .on("error", reject);
    });

    if (results.length === 0) {
      return res.status(400).json({
        success: false,
        message: "CSV file is empty or contains no data rows"
      });
    }

    const validTransactions = [];

    // Validate every CSV row
    results.forEach((row, index) => {
      const title = row.title?.trim();
      const amount = Number(row.amount);
      const type = row.type?.trim().toLowerCase();

      const hasManualCategory =
        typeof row.category === "string" &&
        row.category.trim().length > 0;

      const category = hasManualCategory
        ? row.category.trim()
        : "Uncategorized";

      const description = row.description?.trim() || "";

      const paymentMethod =
        row.paymentMethod?.trim().toLowerCase() || "other";

      const date = row.date ? new Date(row.date) : new Date();

      const allowedPaymentMethods = [
        "cash",
        "upi",
        "card",
        "bank_transfer",
        "other"
      ];

      const errors = [];

      if (!title) {
        errors.push("Title is required");
      }

      if (!Number.isFinite(amount) || amount <= 0) {
        errors.push("Amount must be greater than zero");
      }

      if (!["income", "expense"].includes(type)) {
        errors.push("Type must be income or expense");
      }

      if (Number.isNaN(date.getTime())) {
        errors.push("Invalid date");
      }

      if (!allowedPaymentMethods.includes(paymentMethod)) {
        errors.push("Invalid payment method");
      }

      if (errors.length > 0) {
        rejectedRows.push({
          row: index + 2,
          errors
        });
        return;
      }

      validTransactions.push({
        userId: req.user.id,
        title,
        amount,
        type,
        category,
        description,
        date,
        paymentMethod,

        // Internal flag, removed before MongoDB insertion
        hasManualCategory,

        // AI categorization metadata
        aiCategorized: false,
        aiCategoryConfidence: null,
        aiCategorySource: null,
        aiNeedsReview: false
      });
    });

    // Categorize eligible expense transactions
    // Process in batches of 10 to limit concurrent ML requests
    const batchSize = 10;

    for (let i = 0; i < validTransactions.length; i += batchSize) {
      const batch = validTransactions.slice(i, i + batchSize);

      const categorizationTasks = batch.map(async (transaction) => {
        // Skip income and manually categorized transactions
        if (
          transaction.type !== "expense" ||
          transaction.hasManualCategory
        ) {
          return;
        }

        const transactionDescription =
          transaction.description || transaction.title;

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
            transaction.category = prediction.category.trim();
            transaction.aiCategorized = true;

            transaction.aiCategoryConfidence =
              prediction.confidence !== null &&
              prediction.confidence !== undefined &&
              Number.isFinite(Number(prediction.confidence))
                ? Number(prediction.confidence)
                : null;

            transaction.aiCategorySource =
              prediction.source || null;

            transaction.aiNeedsReview =
              Boolean(prediction.needs_review);
          } else {
            transaction.aiNeedsReview = true;
          }

        } catch (error) {
          console.error(
            `CSV categorization failed for "${transaction.title}":`,
            error.message
          );

          // Continue importing even if ML categorization fails
          transaction.category = "Uncategorized";
          transaction.aiCategorized = false;
          transaction.aiCategoryConfidence = null;
          transaction.aiCategorySource = null;
          transaction.aiNeedsReview = true;
        }
      });

      await Promise.allSettled(categorizationTasks);
    }

    // Remove internal processing flags before MongoDB insertion
    validTransactions.forEach((transaction) => {
      delete transaction.hasManualCategory;
    });

    // Save all valid transactions
    let importedTransactions = [];

    if (validTransactions.length > 0) {
      importedTransactions = await Transaction.insertMany(
        validTransactions,
        { ordered: false }
      );
    }

    return res.status(200).json({
      success: true,
      message: "CSV import processing completed",
      totalRows: results.length,
      importedCount: importedTransactions.length,
      rejectedCount: rejectedRows.length,
      rejectedRows,
      importedTransactions
    });

  } catch (error) {
    next(error);
  }
};

module.exports = {
  importTransactions
};

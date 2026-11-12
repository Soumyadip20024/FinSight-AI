
const mongoose = require("mongoose");
const Transaction = require("../models/Transaction");
const { detectAnomalies } = require("../services/mlService");

// ==========================================
// 1. GET OVERVIEW ANALYTICS
// ==========================================

const getOverviewAnalytics = async (req, res, next) => {
  try {
    const userId = new mongoose.Types.ObjectId(req.user.id);

    const result = await Transaction.aggregate([
      {
        $match: {
          userId: userId
        }
      },
      {
        $group: {
          _id: null,
          totalIncome: {
            $sum: {
              $cond: [
                { $eq: ["$type", "income"] },
                "$amount",
                0
              ]
            }
          },
          totalExpenses: {
            $sum: {
              $cond: [
                { $eq: ["$type", "expense"] },
                "$amount",
                0
              ]
            }
          },
          transactionCount: {
            $sum: 1
          }
        }
      }
    ]);

    const analytics = result[0] || {
      totalIncome: 0,
      totalExpenses: 0,
      transactionCount: 0
    };

    const balance =
      analytics.totalIncome - analytics.totalExpenses;

    const savingsRate =
      analytics.totalIncome > 0
        ? (balance / analytics.totalIncome) * 100
        : 0;

    return res.status(200).json({
      success: true,
      message: "Overview analytics retrieved successfully",
      data: {
        totalIncome: analytics.totalIncome,
        totalExpenses: analytics.totalExpenses,
        balance,
        transactionCount: analytics.transactionCount,
        savingsRate: Number(savingsRate.toFixed(2))
      }
    });

  } catch (error) {
    next(error);
  }
};


// ==========================================
// 2. GET MONTHLY INCOME AND EXPENSE ANALYTICS
// ==========================================

const getMonthlyAnalytics = async (req, res, next) => {
  try {
    const userId = new mongoose.Types.ObjectId(req.user.id);

    const now = new Date();

    const startDate = new Date(
      Date.UTC(
        now.getUTCFullYear(),
        now.getUTCMonth() - 11,
        1
      )
    );

    const monthlyData = await Transaction.aggregate([
      {
        $match: {
          userId: userId,
          date: {
            $gte: startDate
          }
        }
      },
      {
        $group: {
          _id: {
            year: {
              $year: "$date"
            },
            month: {
              $month: "$date"
            }
          },
          income: {
            $sum: {
              $cond: [
                { $eq: ["$type", "income"] },
                "$amount",
                0
              ]
            }
          },
          expenses: {
            $sum: {
              $cond: [
                { $eq: ["$type", "expense"] },
                "$amount",
                0
              ]
            }
          },
          transactionCount: {
            $sum: 1
          }
        }
      },
      {
        $sort: {
          "_id.year": 1,
          "_id.month": 1
        }
      },
      {
        $project: {
          _id: 0,
          year: "$_id.year",
          month: "$_id.month",
          income: 1,
          expenses: 1,
          balance: {
            $subtract: [
              "$income",
              "$expenses"
            ]
          },
          transactionCount: 1
        }
      }
    ]);

    return res.status(200).json({
      success: true,
      message: "Monthly analytics retrieved successfully",
      data: monthlyData
    });

  } catch (error) {
    next(error);
  }
};


// ==========================================
// 3. GET CATEGORY-WISE EXPENSE ANALYTICS
// ==========================================

const getCategoryAnalytics = async (req, res, next) => {
  try {
    const userId = new mongoose.Types.ObjectId(req.user.id);

    const categoryData = await Transaction.aggregate([
      {
        $match: {
          userId: userId,
          type: "expense"
        }
      },
      {
        $group: {
          _id: "$category",
          totalAmount: {
            $sum: "$amount"
          },
          transactionCount: {
            $sum: 1
          }
        }
      },
      {
        $sort: {
          totalAmount: -1
        }
      },
      {
        $project: {
          _id: 0,
          category: "$_id",
          totalAmount: 1,
          transactionCount: 1
        }
      }
    ]);

    const totalExpenses = categoryData.reduce(
      (sum, item) => sum + item.totalAmount,
      0
    );

    const formattedData = categoryData.map((item) => ({
      ...item,
      percentage:
        totalExpenses > 0
          ? Number(
              ((item.totalAmount / totalExpenses) * 100).toFixed(2)
            )
          : 0
    }));

    return res.status(200).json({
      success: true,
      message: "Category analytics retrieved successfully",
      totalExpenses,
      data: formattedData
    });

  } catch (error) {
    next(error);
  }
};


// ==========================================
// 4. GET DAILY SPENDING ANALYTICS
// ==========================================

const getDailyAnalytics = async (req, res, next) => {
  try {
    const userId = new mongoose.Types.ObjectId(req.user.id);

    const now = new Date();

    const month = Number(req.query.month) || now.getUTCMonth() + 1;
    const year = Number(req.query.year) || now.getUTCFullYear();

    if (
      !Number.isInteger(month) ||
      month < 1 ||
      month > 12 ||
      !Number.isInteger(year) ||
      year < 2000 ||
      year > 2100
    ) {
      return res.status(400).json({
        success: false,
        message: "Please provide a valid month and year"
      });
    }

    const startDate = new Date(Date.UTC(year, month - 1, 1));
    const endDate = new Date(Date.UTC(year, month, 1));

    const dailyData = await Transaction.aggregate([
      {
        $match: {
          userId: userId,
          type: "expense",
          date: {
            $gte: startDate,
            $lt: endDate
          }
        }
      },
      {
        $group: {
          _id: {
            $dateToString: {
              format: "%Y-%m-%d",
              date: "$date",
              timezone: "UTC"
            }
          },
          totalExpenses: {
            $sum: "$amount"
          },
          transactionCount: {
            $sum: 1
          }
        }
      },
      {
        $sort: {
          _id: 1
        }
      },
      {
        $project: {
          _id: 0,
          date: "$_id",
          totalExpenses: 1,
          transactionCount: 1
        }
      }
    ]);

    return res.status(200).json({
      success: true,
      message: "Daily analytics retrieved successfully",
      month,
      year,
      data: dailyData
    });

  } catch (error) {
    next(error);
  }
};


// ==========================================
// 5. GET YEARLY FINANCIAL ANALYTICS
// ==========================================

const getYearlyAnalytics = async (req, res, next) => {
  try {
    const userId = new mongoose.Types.ObjectId(req.user.id);

    const currentYear = new Date().getUTCFullYear();
    const year = Number(req.query.year) || currentYear;

    if (
      !Number.isInteger(year) ||
      year < 2000 ||
      year > 2100
    ) {
      return res.status(400).json({
        success: false,
        message: "Please provide a valid year"
      });
    }

    const startDate = new Date(Date.UTC(year, 0, 1));
    const endDate = new Date(Date.UTC(year + 1, 0, 1));

    const result = await Transaction.aggregate([
      {
        $match: {
          userId: userId,
          date: {
            $gte: startDate,
            $lt: endDate
          }
        }
      },
      {
        $group: {
          _id: null,
          totalIncome: {
            $sum: {
              $cond: [
                { $eq: ["$type", "income"] },
                "$amount",
                0
              ]
            }
          },
          totalExpenses: {
            $sum: {
              $cond: [
                { $eq: ["$type", "expense"] },
                "$amount",
                0
              ]
            }
          },
          transactionCount: {
            $sum: 1
          }
        }
      }
    ]);

    const analytics = result[0] || {
      totalIncome: 0,
      totalExpenses: 0,
      transactionCount: 0
    };

    const balance =
      analytics.totalIncome - analytics.totalExpenses;

    const savingsRate =
      analytics.totalIncome > 0
        ? (balance / analytics.totalIncome) * 100
        : 0;

    return res.status(200).json({
      success: true,
      message: "Yearly analytics retrieved successfully",
      data: {
        year,
        totalIncome: analytics.totalIncome,
        totalExpenses: analytics.totalExpenses,
        balance,
        transactionCount: analytics.transactionCount,
        savingsRate: Number(savingsRate.toFixed(2))
      }
    });

  } catch (error) {
    next(error);
  }
};


// ==========================================
// 6. GET AI-POWERED SPENDING ANOMALIES
// ==========================================

const getAnomalyAnalytics = async (req, res, next) => {
  try {
    const userId = new mongoose.Types.ObjectId(req.user.id);

    // Retrieve only the authenticated user's expenses.
    const transactions = await Transaction.find({
      userId,
      type: "expense"
    })
      .select("title amount category date -_id")
      .sort({ date: -1 })
      .limit(5000)
      .lean();

    // At least 5 transactions are required.
    if (transactions.length < 5) {
      return res.status(400).json({
        success: false,
        message: "At least 5 expense transactions are required for anomaly detection.",
        requiredTransactions: 5,
        availableTransactions: transactions.length
      });
    }

    // Prepare data for Python ML service.
    const mlTransactions = transactions.map((transaction) => ({
      title: transaction.title,
      amount: transaction.amount,
      category: transaction.category || "Uncategorized",
      date: transaction.date.toISOString().slice(0, 10)
    }));

    // Call anomaly detection service.
    const mlResponse = await detectAnomalies(
      mlTransactions,
      0.05
    );

    return res.status(200).json({
      success: true,
      message: "Spending anomaly analysis completed successfully",
      data: mlResponse.data,
      notice: "Anomaly alerts indicate unusual spending patterns, not confirmed fraud."
    });

  } catch (error) {
    next(error);
  }
};


// ==========================================
// EXPORT CONTROLLERS
// ==========================================

module.exports = {
  getOverviewAnalytics,
  getMonthlyAnalytics,
  getCategoryAnalytics,
  getDailyAnalytics,
  getYearlyAnalytics,
  getAnomalyAnalytics
};

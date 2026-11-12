
const Budget = require("../models/Budget");

// CREATE BUDGET
const createBudget = async (req, res, next) => {
  try {
    const { category, limit, month, year } = req.body;

    if (!category || limit === undefined || month === undefined || year === undefined) {
      return res.status(400).json({
        success: false,
        message: "Category, limit, month and year are required"
      });
    }

    const budgetLimit = Number(limit);
    const budgetMonth = Number(month);
    const budgetYear = Number(year);

    if (!Number.isFinite(budgetLimit) || budgetLimit <= 0) {
      return res.status(400).json({
        success: false,
        message: "Budget limit must be greater than zero"
      });
    }

    if (!Number.isInteger(budgetMonth) || budgetMonth < 1 || budgetMonth > 12) {
      return res.status(400).json({
        success: false,
        message: "Month must be between 1 and 12"
      });
    }

    if (!Number.isInteger(budgetYear) || budgetYear < 2000) {
      return res.status(400).json({
        success: false,
        message: "Please provide a valid year"
      });
    }

    const budget = await Budget.create({
      userId: req.user.id,
      category: category.trim(),
      limit: budgetLimit,
      month: budgetMonth,
      year: budgetYear
    });

    res.status(201).json({
      success: true,
      message: "Budget created successfully",
      budget
    });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(409).json({
        success: false,
        message: "A budget for this category and month already exists"
      });
    }

    next(error);
  }
};

// GET ALL BUDGETS
const getBudgets = async (req, res, next) => {
  try {
    const filter = {
      userId: req.user.id
    };

    if (req.query.month !== undefined) {
      const month = Number(req.query.month);

      if (!Number.isInteger(month) || month < 1 || month > 12) {
        return res.status(400).json({
          success: false,
          message: "Invalid month filter"
        });
      }

      filter.month = month;
    }

    if (req.query.year !== undefined) {
      const year = Number(req.query.year);

      if (!Number.isInteger(year) || year < 2000) {
        return res.status(400).json({
          success: false,
          message: "Invalid year filter"
        });
      }

      filter.year = year;
    }

    const budgets = await Budget.find(filter).sort({
      year: -1,
      month: -1,
      category: 1
    });

    res.status(200).json({
      success: true,
      count: budgets.length,
      budgets
    });
  } catch (error) {
    next(error);
  }
};

// UPDATE BUDGET
const updateBudget = async (req, res, next) => {
  try {
    const { category, limit, month, year } = req.body;

    const updates = {};

    if (category !== undefined) {
      if (typeof category !== "string" || !category.trim()) {
        return res.status(400).json({
          success: false,
          message: "Category cannot be empty"
        });
      }

      updates.category = category.trim();
    }

    if (limit !== undefined) {
      const budgetLimit = Number(limit);

      if (!Number.isFinite(budgetLimit) || budgetLimit <= 0) {
        return res.status(400).json({
          success: false,
          message: "Budget limit must be greater than zero"
        });
      }

      updates.limit = budgetLimit;
    }

    if (month !== undefined) {
      const budgetMonth = Number(month);

      if (!Number.isInteger(budgetMonth) || budgetMonth < 1 || budgetMonth > 12) {
        return res.status(400).json({
          success: false,
          message: "Month must be between 1 and 12"
        });
      }

      updates.month = budgetMonth;
    }

    if (year !== undefined) {
      const budgetYear = Number(year);

      if (!Number.isInteger(budgetYear) || budgetYear < 2000) {
        return res.status(400).json({
          success: false,
          message: "Please provide a valid year"
        });
      }

      updates.year = budgetYear;
    }

    if (Object.keys(updates).length === 0) {
      return res.status(400).json({
        success: false,
        message: "Provide at least one field to update"
      });
    }

    const budget = await Budget.findOneAndUpdate(
      {
        _id: req.params.id,
        userId: req.user.id
      },
      {
        $set: updates
      },
      {
        new: true,
        runValidators: true
      }
    );

    if (!budget) {
      return res.status(404).json({
        success: false,
        message: "Budget not found"
      });
    }

    res.status(200).json({
      success: true,
      message: "Budget updated successfully",
      budget
    });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(409).json({
        success: false,
        message: "A budget for this category and month already exists"
      });
    }

    next(error);
  }
};

// DELETE BUDGET
const deleteBudget = async (req, res, next) => {
  try {
    const budget = await Budget.findOneAndDelete({
      _id: req.params.id,
      userId: req.user.id
    });

    if (!budget) {
      return res.status(404).json({
        success: false,
        message: "Budget not found"
      });
    }

    res.status(200).json({
      success: true,
      message: "Budget deleted successfully"
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  createBudget,
  getBudgets,
  updateBudget,
  deleteBudget
};

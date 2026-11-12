
const SavingsGoal = require("../models/SavingsGoal");

// CREATE SAVINGS GOAL
const createSavingsGoal = async (req, res, next) => {
  try {
    const { title, targetAmount, savedAmount, deadline } = req.body;

    if (!title || targetAmount === undefined) {
      return res.status(400).json({
        success: false,
        message: "Title and target amount are required"
      });
    }

    const target = Number(targetAmount);
    const saved = savedAmount === undefined ? 0 : Number(savedAmount);

    if (!Number.isFinite(target) || target < 1) {
      return res.status(400).json({
        success: false,
        message: "Target amount must be at least 1"
      });
    }

    if (!Number.isFinite(saved) || saved < 0) {
      return res.status(400).json({
        success: false,
        message: "Saved amount cannot be negative"
      });
    }

    if (saved > target) {
      return res.status(400).json({
        success: false,
        message: "Saved amount cannot exceed target amount"
      });
    }

    let parsedDeadline;

    if (deadline) {
      parsedDeadline = new Date(deadline);

      if (Number.isNaN(parsedDeadline.getTime())) {
        return res.status(400).json({
          success: false,
          message: "Please provide a valid deadline"
        });
      }
    }

    const savingsGoal = await SavingsGoal.create({
      userId: req.user.id,
      title: title.trim(),
      targetAmount: target,
      savedAmount: saved,
      deadline: parsedDeadline,
      status: saved >= target ? "completed" : "active"
    });

    res.status(201).json({
      success: true,
      message: "Savings goal created successfully",
      savingsGoal
    });
  } catch (error) {
    next(error);
  }
};

// GET ALL SAVINGS GOALS
const getSavingsGoals = async (req, res, next) => {
  try {
    const filter = {
      userId: req.user.id
    };

    if (req.query.status !== undefined) {
      if (!["active", "completed"].includes(req.query.status)) {
        return res.status(400).json({
          success: false,
          message: "Status must be active or completed"
        });
      }

      filter.status = req.query.status;
    }

    const savingsGoals = await SavingsGoal.find(filter).sort({
      createdAt: -1
    });

    res.status(200).json({
      success: true,
      count: savingsGoals.length,
      savingsGoals
    });
  } catch (error) {
    next(error);
  }
};

// UPDATE SAVINGS GOAL
const updateSavingsGoal = async (req, res, next) => {
  try {
    const { title, targetAmount, savedAmount, deadline } = req.body;

    const savingsGoal = await SavingsGoal.findOne({
      _id: req.params.id,
      userId: req.user.id
    });

    if (!savingsGoal) {
      return res.status(404).json({
        success: false,
        message: "Savings goal not found"
      });
    }

    if (Object.keys(req.body).length === 0) {
      return res.status(400).json({
        success: false,
        message: "Provide at least one field to update"
      });
    }

    if (title !== undefined) {
      if (typeof title !== "string" || !title.trim()) {
        return res.status(400).json({
          success: false,
          message: "Title cannot be empty"
        });
      }

      savingsGoal.title = title.trim();
    }

    if (targetAmount !== undefined) {
      const target = Number(targetAmount);

      if (!Number.isFinite(target) || target < 1) {
        return res.status(400).json({
          success: false,
          message: "Target amount must be at least 1"
        });
      }

      savingsGoal.targetAmount = target;
    }

    if (savedAmount !== undefined) {
      const saved = Number(savedAmount);

      if (!Number.isFinite(saved) || saved < 0) {
        return res.status(400).json({
          success: false,
          message: "Saved amount cannot be negative"
        });
      }

      savingsGoal.savedAmount = saved;
    }

    if (savingsGoal.savedAmount > savingsGoal.targetAmount) {
      return res.status(400).json({
        success: false,
        message: "Saved amount cannot exceed target amount"
      });
    }

    if (deadline !== undefined) {
      if (deadline === null || deadline === "") {
        savingsGoal.deadline = undefined;
      } else {
        const parsedDeadline = new Date(deadline);

        if (Number.isNaN(parsedDeadline.getTime())) {
          return res.status(400).json({
            success: false,
            message: "Please provide a valid deadline"
          });
        }

        savingsGoal.deadline = parsedDeadline;
      }
    }

    // Automatically update goal status
    savingsGoal.status =
      savingsGoal.savedAmount >= savingsGoal.targetAmount
        ? "completed"
        : "active";

    await savingsGoal.save();

    res.status(200).json({
      success: true,
      message: "Savings goal updated successfully",
      savingsGoal
    });
  } catch (error) {
    next(error);
  }
};

// DELETE SAVINGS GOAL
const deleteSavingsGoal = async (req, res, next) => {
  try {
    const savingsGoal = await SavingsGoal.findOneAndDelete({
      _id: req.params.id,
      userId: req.user.id
    });

    if (!savingsGoal) {
      return res.status(404).json({
        success: false,
        message: "Savings goal not found"
      });
    }

    res.status(200).json({
      success: true,
      message: "Savings goal deleted successfully"
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  createSavingsGoal,
  getSavingsGoals,
  updateSavingsGoal,
  deleteSavingsGoal
};

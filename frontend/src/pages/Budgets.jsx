
import { useCallback, useEffect, useState } from "react";

import {
  Plus,
  Trash2,
  Wallet,
  CalendarDays,
  RefreshCw,
  TrendingUp,
  AlertTriangle,
  CheckCircle
} from "lucide-react";

import toast from "react-hot-toast";

import API from "../services/api";
import Header from "../components/Header";

const categories = [
  "Food",
  "Groceries",
  "Transportation",
  "Utilities",
  "Healthcare",
  "Education",
  "Entertainment",
  "Shopping",
  "Rent",
  "Travel",
  "Insurance",
  "Personal Care",
  "Subscriptions",
  "Other"
];

const monthNames = [
  "January", "February", "March", "April",
  "May", "June", "July", "August",
  "September", "October", "November", "December"
];

const formatCurrency = (amount) =>
  new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 2
  }).format(amount || 0);

// Calculate spending for one budget
const getBudgetSpending = (budget, transactions) => {
  return transactions.reduce((total, transaction) => {
    const transactionDate = new Date(transaction.date);

    const matchesCategory =
      transaction.category?.trim().toLowerCase() ===
      budget.category?.trim().toLowerCase();

    const matchesMonth =
      transactionDate.getUTCMonth() + 1 === budget.month;

    const matchesYear =
      transactionDate.getUTCFullYear() === budget.year;

    if (matchesCategory && matchesMonth && matchesYear) {
      return total + Number(transaction.amount || 0);
    }

    return total;
  }, 0);
};

export default function Budgets() {
  const today = new Date();

  const [budgets, setBudgets] = useState([]);
  const [transactions, setTransactions] = useState([]);

  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const [formData, setFormData] = useState({
    category: "",
    limit: "",
    month: today.getMonth() + 1,
    year: today.getFullYear()
  });

  // Fetch budgets and every page of expense transactions
  const fetchBudgets = useCallback(async () => {
    try {
      setLoading(true);

      const [budgetResponse, firstTransactionResponse] =
        await Promise.all([
          API.get("/budgets"),
          API.get("/transactions", {
            params: {
              type: "expense",
              page: 1,
              limit: 100
            }
          })
        ]);

      const fetchedBudgets =
        budgetResponse.data.budgets || [];

      const firstPageTransactions =
        firstTransactionResponse.data.transactions || [];

      const totalPages =
        firstTransactionResponse.data.totalPages || 1;

      let allTransactions = [...firstPageTransactions];

      // Fetch remaining pages if necessary
      if (totalPages > 1) {
        const remainingRequests = [];

        for (let page = 2; page <= totalPages; page++) {
          remainingRequests.push(
            API.get("/transactions", {
              params: {
                type: "expense",
                page,
                limit: 100
              }
            })
          );
        }

        const remainingResponses =
          await Promise.all(remainingRequests);

        remainingResponses.forEach((response) => {
          allTransactions.push(
            ...(response.data.transactions || [])
          );
        });
      }

      setBudgets(fetchedBudgets);
      setTransactions(allTransactions);

    } catch (error) {
      console.error("Budget data fetch error:", error);

      toast.error(
        error.response?.data?.message ||
        "Unable to load budget information."
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchBudgets();
  }, [fetchBudgets]);

  const handleChange = (event) => {
    const { name, value } = event.target;

    setFormData((previous) => ({
      ...previous,
      [name]: value
    }));
  };

  // Create budget
  const handleSubmit = async (event) => {
    event.preventDefault();

    const limit = Number(formData.limit);
    const month = Number(formData.month);
    const year = Number(formData.year);

    if (!formData.category) {
      toast.error("Please select a category.");
      return;
    }

    if (!Number.isFinite(limit) || limit <= 0) {
      toast.error("Enter a valid budget limit.");
      return;
    }

    if (!Number.isInteger(month) || month < 1 || month > 12) {
      toast.error("Select a valid month.");
      return;
    }

    if (!Number.isInteger(year) || year < 2000 || year > 2100) {
      toast.error("Enter a valid year.");
      return;
    }

    try {
      setSubmitting(true);

      const response = await API.post("/budgets", {
        category: formData.category,
        limit,
        month,
        year
      });

      if (response.data.success) {
        toast.success("Budget created successfully!");

        setFormData({
          category: "",
          limit: "",
          month: today.getMonth() + 1,
          year: today.getFullYear()
        });

        setShowForm(false);

        await fetchBudgets();
      }

    } catch (error) {
      console.error("Budget creation error:", error);

      toast.error(
        error.response?.data?.message ||
        "Unable to create budget."
      );
    } finally {
      setSubmitting(false);
    }
  };

  // Delete budget
  const handleDelete = async (budgetId) => {
    if (!window.confirm("Are you sure you want to delete this budget?")) {
      return;
    }

    try {
      const response = await API.delete(`/budgets/${budgetId}`);

      if (response.data.success) {
        toast.success("Budget deleted successfully!");

        setBudgets((previous) =>
          previous.filter((budget) => budget._id !== budgetId)
        );
      }

    } catch (error) {
      console.error("Budget deletion error:", error);

      toast.error(
        error.response?.data?.message ||
        "Unable to delete budget."
      );
    }
  };

  // Calculate summary values
  const totalBudget = budgets.reduce(
    (total, budget) => total + Number(budget.limit || 0),
    0
  );

  const totalSpent = budgets.reduce(
    (total, budget) =>
      total + getBudgetSpending(budget, transactions),
    0
  );

  const totalRemaining = totalBudget - totalSpent;

  const overallUsage =
    totalBudget > 0
      ? (totalSpent / totalBudget) * 100
      : 0;

  return (
    <div className="min-h-screen bg-[#080d19]">

      {/* Header */}
      <Header />

      <div className="p-6 space-y-6">

        {/* Page Heading */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-white">
              Budgets
            </h1>

            <p className="text-sm text-slate-400 mt-1">
              Monitor spending and manage your monthly limits.
            </p>
          </div>

          <button
            onClick={() => setShowForm((previous) => !previous)}
            className="flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-5 py-3 rounded-xl text-sm font-medium transition"
          >
            <Plus size={18} />
            Create Budget
          </button>
        </div>

        {/* Budget Summary */}
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-5">

          <div className="bg-[#101827] border border-slate-800 rounded-2xl p-5">
            <p className="text-sm text-slate-400">
              Total Budget
            </p>

            <h2 className="text-2xl font-bold text-white mt-3">
              {formatCurrency(totalBudget)}
            </h2>

            <Wallet className="text-blue-400 mt-3" size={23} />
          </div>

          <div className="bg-[#101827] border border-slate-800 rounded-2xl p-5">
            <p className="text-sm text-slate-400">
              Total Spent
            </p>

            <h2 className="text-2xl font-bold text-white mt-3">
              {formatCurrency(totalSpent)}
            </h2>

            <TrendingUp className="text-orange-400 mt-3" size={23} />
          </div>

          <div className="bg-[#101827] border border-slate-800 rounded-2xl p-5">
            <p className="text-sm text-slate-400">
              Remaining Budget
            </p>

            <h2 className={`text-2xl font-bold mt-3 ${
              totalRemaining < 0
                ? "text-red-400"
                : "text-green-400"
            }`}>
              {formatCurrency(totalRemaining)}
            </h2>

            <CheckCircle className="text-green-400 mt-3" size={23} />
          </div>

          <div className="bg-[#101827] border border-slate-800 rounded-2xl p-5">
            <p className="text-sm text-slate-400">
              Overall Usage
            </p>

            <h2 className="text-2xl font-bold text-white mt-3">
              {overallUsage.toFixed(1)}%
            </h2>

            <CalendarDays className="text-purple-400 mt-3" size={23} />
          </div>

        </div>

        {/* Create Budget Form */}
        {showForm && (
          <div className="bg-[#101827] border border-slate-800 rounded-2xl p-6">

            <h2 className="text-lg font-semibold text-white mb-5">
              Create New Budget
            </h2>

            <form onSubmit={handleSubmit} className="space-y-5">

              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">

                <div>
                  <label className="block text-sm text-slate-300 mb-2">
                    Expense Category
                  </label>

                  <select
                    name="category"
                    value={formData.category}
                    onChange={handleChange}
                    required
                    className="w-full bg-[#080d19] border border-slate-700 rounded-xl px-4 py-3 text-white outline-none focus:border-blue-500"
                  >
                    <option value="">Select category</option>

                    {categories.map((category) => (
                      <option key={category} value={category}>
                        {category}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm text-slate-300 mb-2">
                    Monthly Budget Limit (INR)
                  </label>

                  <input
                    type="number"
                    name="limit"
                    value={formData.limit}
                    onChange={handleChange}
                    min="0.01"
                    step="0.01"
                    placeholder="Enter amount"
                    required
                    className="w-full bg-[#080d19] border border-slate-700 rounded-xl px-4 py-3 text-white outline-none focus:border-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm text-slate-300 mb-2">
                    Month
                  </label>

                  <select
                    name="month"
                    value={formData.month}
                    onChange={handleChange}
                    className="w-full bg-[#080d19] border border-slate-700 rounded-xl px-4 py-3 text-white outline-none focus:border-blue-500"
                  >
                    {monthNames.map((month, index) => (
                      <option key={month} value={index + 1}>
                        {month}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm text-slate-300 mb-2">
                    Year
                  </label>

                  <input
                    type="number"
                    name="year"
                    value={formData.year}
                    onChange={handleChange}
                    min="2000"
                    max="2100"
                    required
                    className="w-full bg-[#080d19] border border-slate-700 rounded-xl px-4 py-3 text-white outline-none focus:border-blue-500"
                  />
                </div>

              </div>

              <div className="flex gap-3">

                <button
                  type="submit"
                  disabled={submitting}
                  className="bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white px-6 py-3 rounded-xl text-sm font-medium transition"
                >
                  {submitting ? "Creating..." : "Save Budget"}
                </button>

                <button
                  type="button"
                  onClick={() => setShowForm(false)}
                  className="bg-slate-700 hover:bg-slate-600 text-white px-6 py-3 rounded-xl text-sm transition"
                >
                  Cancel
                </button>

              </div>
            </form>
          </div>
        )}

        {/* Budget List */}
        <div className="bg-[#101827] border border-slate-800 rounded-2xl p-6">

          <div className="flex items-center justify-between mb-6">

            <div>
              <h2 className="text-lg font-semibold text-white">
                Budget Performance
              </h2>

              <p className="text-xs text-slate-400 mt-1">
                Actual expenses compared with your allocated limits.
              </p>
            </div>

            <button
              onClick={fetchBudgets}
              disabled={loading}
              title="Refresh budgets"
              className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition"
            >
              <RefreshCw
                size={18}
                className={loading ? "animate-spin" : ""}
              />
            </button>

          </div>

          {loading ? (
            <p className="text-center text-slate-400 py-10">
              Loading budget information...
            </p>
          ) : budgets.length === 0 ? (
            <div className="text-center py-12">

              <Wallet
                size={40}
                className="mx-auto text-slate-600 mb-4"
              />

              <p className="text-white font-medium">
                No budgets created yet
              </p>

              <p className="text-sm text-slate-400 mt-2">
                Create your first budget to start monitoring spending.
              </p>

            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">

              {budgets.map((budget) => {
                const spent = getBudgetSpending(
                  budget,
                  transactions
                );

                const limit = Number(budget.limit || 0);
                const remaining = limit - spent;

                const percentage =
                  limit > 0
                    ? (spent / limit) * 100
                    : 0;

                const progressWidth = Math.min(
                  percentage,
                  100
                );

                const isExceeded = percentage > 100;

                const isWarning =
                  percentage >= 80 && !isExceeded;

                const progressColor = isExceeded
                  ? "bg-red-500"
                  : isWarning
                  ? "bg-yellow-500"
                  : "bg-green-500";

                return (
                  <div
                    key={budget._id}
                    className="border border-slate-700 bg-[#0b1220] rounded-xl p-5 hover:border-blue-500/50 transition"
                  >

                    {/* Category and Month */}
                    <div className="flex items-start justify-between gap-3">

                      <div>
                        <h3 className="text-white font-semibold">
                          {budget.category}
                        </h3>

                        <p className="text-xs text-slate-400 mt-1">
                          {monthNames[budget.month - 1]} {budget.year}
                        </p>
                      </div>

                      <button
                        onClick={() => handleDelete(budget._id)}
                        title="Delete budget"
                        className="p-2 text-red-400 hover:bg-red-500/10 rounded-lg transition"
                      >
                        <Trash2 size={17} />
                      </button>

                    </div>

                    {/* Spent and Limit */}
                    <div className="mt-6 flex justify-between items-end">

                      <div>
                        <p className="text-xs text-slate-400">
                          Amount Spent
                        </p>

                        <p className="text-xl font-bold text-white mt-1">
                          {formatCurrency(spent)}
                        </p>
                      </div>

                      <div className="text-right">
                        <p className="text-xs text-slate-400">
                          Budget Limit
                        </p>

                        <p className="text-sm font-semibold text-slate-300 mt-1">
                          {formatCurrency(limit)}
                        </p>
                      </div>

                    </div>

                    {/* Progress Bar */}
                    <div className="mt-5">

                      <div className="flex justify-between text-xs mb-2">
                        <span className="text-slate-400">
                          Budget Usage
                        </span>

                        <span className={
                          isExceeded
                            ? "text-red-400 font-semibold"
                            : isWarning
                            ? "text-yellow-400 font-semibold"
                            : "text-green-400 font-semibold"
                        }>
                          {percentage.toFixed(1)}%
                        </span>
                      </div>

                      <div className="w-full h-2.5 bg-slate-800 rounded-full overflow-hidden">
                        <div
                          className={`h-full rounded-full transition-all duration-500 ${progressColor}`}
                          style={{
                            width: `${progressWidth}%`
                          }}
                        />
                      </div>

                    </div>

                    {/* Remaining / Overspending */}
                    <div className="mt-4 flex items-center gap-2">

                      {isExceeded ? (
                        <>
                          <AlertTriangle
                            size={16}
                            className="text-red-400 shrink-0"
                          />

                          <p className="text-sm text-red-400">
                            Exceeded by {formatCurrency(Math.abs(remaining))}
                          </p>
                        </>
                      ) : isWarning ? (
                        <>
                          <AlertTriangle
                            size={16}
                            className="text-yellow-400 shrink-0"
                          />

                          <p className="text-sm text-yellow-400">
                            Only {formatCurrency(remaining)} remaining
                          </p>
                        </>
                      ) : (
                        <>
                          <CheckCircle
                            size={16}
                            className="text-green-400 shrink-0"
                          />

                          <p className="text-sm text-green-400">
                            {formatCurrency(remaining)} remaining
                          </p>
                        </>
                      )}

                    </div>

                  </div>
                );
              })}

            </div>
          )}

        </div>

      </div>
    </div>
  );
}

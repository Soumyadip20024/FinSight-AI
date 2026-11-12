
import { useCallback, useEffect, useState } from "react";

import {
  Plus,
  Trash2,
  ArrowDownCircle,
  ArrowUpCircle,
  RefreshCw,
  ChevronLeft,
  ChevronRight,
  Receipt
} from "lucide-react";

import toast from "react-hot-toast";
import API from "../services/api";

import Header from "../components/Header";
import AddTransaction from "../components/AddTransaction";

export default function Transactions() {
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);

  const [filter, setFilter] = useState("all");
  const [page, setPage] = useState(1);

  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);

  const [showAddTransaction, setShowAddTransaction] = useState(false);

  // Fetch transactions from backend
  const fetchTransactions = useCallback(async () => {
    try {
      setLoading(true);

      const params = {
        page,
        limit: 10
      };

      if (filter !== "all") {
        params.type = filter;
      }

      const response = await API.get("/transactions", { params });

      if (!response.data.success) {
        throw new Error("Unable to retrieve transactions.");
      }

      setTransactions(response.data.transactions || []);
      setTotal(response.data.total || 0);
      setTotalPages(Math.max(1, response.data.totalPages || 1));

    } catch (error) {
      console.error("Transactions page error:", error);

      toast.error(
        error.response?.data?.message ||
        "Unable to load transactions."
      );

    } finally {
      setLoading(false);
    }
  }, [page, filter]);

  useEffect(() => {
    fetchTransactions();
  }, [fetchTransactions]);

  // Format currency
  const formatCurrency = (amount) => {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      maximumFractionDigits: 2
    }).format(amount || 0);
  };

  // Format transaction date
  const formatDate = (date) => {
    if (!date) return "Date unavailable";

    const parsedDate = new Date(date);

    if (Number.isNaN(parsedDate.getTime())) {
      return "Invalid date";
    }

    return parsedDate.toLocaleDateString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric"
    });
  };

  // Change transaction filter
  const handleFilterChange = (value) => {
    setFilter(value);
    setPage(1);
  };

  // Delete transaction
  const handleDelete = async (transaction) => {
    const confirmed = window.confirm(
      `Are you sure you want to delete "${transaction.title}"?`
    );

    if (!confirmed) return;

    try {
      const response = await API.delete(
        `/transactions/${transaction._id}`
      );

      if (!response.data.success) {
        throw new Error("Unable to delete transaction.");
      }

      toast.success("Transaction deleted successfully.");

      // Move to previous page if the last item was deleted
      if (transactions.length === 1 && page > 1) {
        setPage((previous) => previous - 1);
      } else {
        fetchTransactions();
      }

    } catch (error) {
      console.error("Delete transaction error:", error);

      toast.error(
        error.response?.data?.message ||
        error.message ||
        "Unable to delete transaction."
      );
    }
  };

  // Handle successful transaction creation
  const handleTransactionSuccess = () => {
    setShowAddTransaction(false);
    setPage(1);
    setFilter("all");
  };

  return (
    <div className="min-h-screen bg-[#080d19]">

      {/* Header */}
      <Header />

      <div className="p-6 space-y-6">

        {/* Page heading */}
        <div className="flex flex-wrap items-center justify-between gap-4">

          <div>
            <h2 className="text-xl font-bold text-white">
              Transactions
            </h2>

            <p className="text-sm text-slate-400 mt-1">
              Manage and track all your income and expenses.
            </p>
          </div>

          <button
            type="button"
            onClick={() => setShowAddTransaction(true)}
            className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-5 py-3 rounded-xl text-sm font-medium transition"
          >
            <Plus size={19} />
            Add Transaction
          </button>

        </div>

        {/* Summary and filters */}
        <div className="bg-[#101827] border border-slate-800 rounded-2xl p-5">

          <div className="flex flex-wrap items-center justify-between gap-4">

            <div>
              <p className="text-sm text-slate-400">
                Total Transactions
              </p>

              <p className="text-2xl font-bold text-white mt-1">
                {total}
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-3">

              <select
                value={filter}
                onChange={(event) =>
                  handleFilterChange(event.target.value)
                }
                className="bg-[#182234] border border-slate-700 rounded-xl px-4 py-2.5 text-sm text-white outline-none focus:border-blue-500"
              >
                <option value="all">All Transactions</option>
                <option value="income">Income Only</option>
                <option value="expense">Expenses Only</option>
              </select>

              <button
                type="button"
                onClick={fetchTransactions}
                disabled={loading}
                className="flex items-center gap-2 px-4 py-2.5 rounded-xl border border-slate-700 text-slate-300 hover:bg-slate-800 transition disabled:opacity-50"
              >
                <RefreshCw size={16} />
                Refresh
              </button>

            </div>

          </div>

        </div>

        {/* Transaction table */}
        <div className="bg-[#101827] border border-slate-800 rounded-2xl overflow-hidden">

          <div className="p-5 border-b border-slate-800">
            <h3 className="text-lg font-semibold text-white">
              Transaction History
            </h3>

            <p className="text-sm text-slate-400 mt-1">
              Your latest financial activities
            </p>
          </div>

          {loading ? (

            <div className="py-16 text-center text-slate-400">
              Loading transactions...
            </div>

          ) : transactions.length === 0 ? (

            <div className="py-16 flex flex-col items-center text-center">

              <Receipt
                size={40}
                className="text-slate-600 mb-3"
              />

              <p className="text-white font-medium">
                No transactions found
              </p>

              <p className="text-sm text-slate-400 mt-1">
                Add a transaction or change your filter.
              </p>

            </div>

          ) : (

            <div className="overflow-x-auto">

              <table className="w-full text-left">

                <thead className="bg-[#182234] text-xs uppercase text-slate-400">

                  <tr>
                    <th className="px-5 py-4">Transaction</th>
                    <th className="px-5 py-4">Category</th>
                    <th className="px-5 py-4">Date</th>
                    <th className="px-5 py-4">Type</th>
                    <th className="px-5 py-4 text-right">Amount</th>
                    <th className="px-5 py-4 text-center">Action</th>
                  </tr>

                </thead>

                <tbody className="divide-y divide-slate-800">

                  {transactions.map((transaction) => {
                    const isIncome = transaction.type === "income";

                    return (
                      <tr
                        key={transaction._id}
                        className="hover:bg-slate-800/30 transition"
                      >

                        <td className="px-5 py-4">
                          <p className="text-sm font-medium text-white">
                            {transaction.title}
                          </p>

                          {transaction.description && (
                            <p className="text-xs text-slate-500 mt-1">
                              {transaction.description}
                            </p>
                          )}
                        </td>

                        <td className="px-5 py-4">
                          <span className="text-sm text-slate-300">
                            {transaction.category || "Uncategorized"}
                          </span>

                          {transaction.aiCategorized && (
                            <span className="block text-xs text-blue-400 mt-1">
                              AI categorized
                            </span>
                          )}

                          {transaction.aiNeedsReview && (
                            <span className="block text-xs text-amber-400 mt-1">
                              Needs review
                            </span>
                          )}
                        </td>

                        <td className="px-5 py-4 text-sm text-slate-400 whitespace-nowrap">
                          {formatDate(transaction.date)}
                        </td>

                        <td className="px-5 py-4">

                          <span
                            className={`inline-flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-full ${
                              isIncome
                                ? "bg-green-500/10 text-green-400"
                                : "bg-red-500/10 text-red-400"
                            }`}
                          >
                            {isIncome ? (
                              <ArrowUpCircle size={14} />
                            ) : (
                              <ArrowDownCircle size={14} />
                            )}

                            {isIncome ? "Income" : "Expense"}
                          </span>

                        </td>

                        <td
                          className={`px-5 py-4 text-sm font-semibold text-right whitespace-nowrap ${
                            isIncome
                              ? "text-green-400"
                              : "text-red-400"
                          }`}
                        >
                          {isIncome ? "+" : "-"}
                          {formatCurrency(transaction.amount)}
                        </td>

                        <td className="px-5 py-4 text-center">

                          <button
                            type="button"
                            onClick={() => handleDelete(transaction)}
                            title="Delete transaction"
                            className="p-2 text-slate-400 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition"
                          >
                            <Trash2 size={17} />
                          </button>

                        </td>

                      </tr>
                    );
                  })}

                </tbody>

              </table>

            </div>
          )}

          {/* Pagination */}
          {!loading && total > 0 && (
            <div className="flex flex-wrap items-center justify-between gap-3 p-5 border-t border-slate-800">

              <p className="text-sm text-slate-400">
                Page {page} of {totalPages}
                {" · "}
                {total} transactions
              </p>

              <div className="flex items-center gap-2">

                <button
                  type="button"
                  disabled={page <= 1}
                  onClick={() => setPage((previous) => previous - 1)}
                  className="flex items-center gap-1 px-3 py-2 rounded-lg border border-slate-700 text-slate-300 hover:bg-slate-800 disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  <ChevronLeft size={17} />
                  Previous
                </button>

                <button
                  type="button"
                  disabled={page >= totalPages}
                  onClick={() => setPage((previous) => previous + 1)}
                  className="flex items-center gap-1 px-3 py-2 rounded-lg border border-slate-700 text-slate-300 hover:bg-slate-800 disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  Next
                  <ChevronRight size={17} />
                </button>

              </div>

            </div>
          )}

        </div>

      </div>

      {/* Add transaction modal */}
      {showAddTransaction && (
        <AddTransaction
          onClose={() => setShowAddTransaction(false)}
          onSuccess={handleTransactionSuccess}
        />
      )}

    </div>
  );
}

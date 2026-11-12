
import { useEffect, useState } from "react";

import {
  ShoppingBag,
  Utensils,
  Car,
  Home,
  Heart,
  GraduationCap,
  Film,
  Plane,
  Wallet
} from "lucide-react";

import toast from "react-hot-toast";
import API from "../services/api";

export default function TransactionList({ refreshKey }) {
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);

  // Format amount in Indian Rupees
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

  // Select an icon based on transaction category
  const getCategoryIcon = (category) => {
    const value = (category || "").toLowerCase();

    if (value.includes("food") || value.includes("groceries")) {
      return Utensils;
    }

    if (value.includes("transport")) {
      return Car;
    }

    if (value.includes("rent") || value.includes("housing")) {
      return Home;
    }

    if (value.includes("health") || value.includes("medical")) {
      return Heart;
    }

    if (value.includes("education")) {
      return GraduationCap;
    }

    if (value.includes("entertainment")) {
      return Film;
    }

    if (value.includes("travel")) {
      return Plane;
    }

    if (value.includes("shopping")) {
      return ShoppingBag;
    }

    return Wallet;
  };

  // Fetch latest transactions from the backend
  const fetchTransactions = async () => {
    try {
      setLoading(true);

      const response = await API.get("/transactions", {
        params: {
          page: 1,
          limit: 5
        }
      });

      if (!response.data.success) {
        throw new Error("Unable to retrieve transactions.");
      }

      setTransactions(response.data.transactions || []);

    } catch (error) {
      console.error("Transaction loading error:", error);

      toast.error(
        error.response?.data?.message ||
        error.message ||
        "Unable to load recent transactions."
      );

    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTransactions();
  }, [refreshKey]);

  return (
    <div className="bg-[#101827] border border-slate-800 rounded-2xl p-5">

      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <h3 className="text-lg font-semibold text-white">
            Recent Transactions
          </h3>

          <p className="text-sm text-slate-400 mt-1">
            Your latest financial activities
          </p>
        </div>
      </div>

      {/* Loading state */}
      {loading && (
        <div className="py-10 text-center text-slate-400">
          Loading transactions...
        </div>
      )}

      {/* Empty state */}
      {!loading && transactions.length === 0 && (
        <div className="py-10 text-center text-slate-400">
          No transactions found.
        </div>
      )}

      {/* Transaction list */}
      {!loading && transactions.length > 0 && (
        <div className="space-y-4">

          {transactions.map((transaction) => {
            const Icon = getCategoryIcon(transaction.category);

            const isIncome = transaction.type === "income";

            return (
              <div
                key={transaction._id}
                className="flex items-center justify-between gap-3"
              >
                {/* Transaction information */}
                <div className="flex items-center gap-3 min-w-0">

                  <div className="bg-slate-700/40 p-3 rounded-xl shrink-0">
                    <Icon
                      size={19}
                      className="text-blue-400"
                    />
                  </div>

                  <div className="min-w-0">
                    <p className="text-sm font-medium text-white truncate">
                      {transaction.title}
                    </p>

                    <p className="text-xs text-slate-400 mt-1">
                      {transaction.category || "Uncategorized"}
                      {" · "}
                      {formatDate(transaction.date)}
                    </p>
                  </div>
                </div>

                {/* Transaction amount */}
                <p
                  className={`text-sm font-semibold whitespace-nowrap ${
                    isIncome
                      ? "text-green-400"
                      : "text-red-400"
                  }`}
                >
                  {isIncome ? "+" : "-"}
                  {formatCurrency(transaction.amount)}
                </p>

              </div>
            );
          })}

        </div>
      )}

    </div>
  );
}

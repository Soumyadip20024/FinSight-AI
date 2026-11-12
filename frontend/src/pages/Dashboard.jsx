
import { useEffect, useState } from "react";

import {
  Wallet,
  TrendingUp,
  TrendingDown,
  PiggyBank,
  BrainCircuit,
  Plus
} from "lucide-react";

import toast from "react-hot-toast";
import API from "../services/api";

import Header from "../components/Header";
import StatCard from "../components/StatCard";
import ExpenseChart from "../components/ExpenseChart";
import TransactionList from "../components/TransactionList";
import AddTransaction from "../components/AddTransaction";

export default function Dashboard() {
  const [analytics, setAnalytics] = useState({
    totalIncome: 0,
    totalExpenses: 0,
    balance: 0,
    transactionCount: 0,
    savingsRate: 0
  });

  const [loading, setLoading] = useState(true);
  const [showAddTransaction, setShowAddTransaction] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      maximumFractionDigits: 2
    }).format(amount || 0);
  };

  const fetchOverview = async () => {
    try {
      setLoading(true);

      const response = await API.get("/analytics/overview");

      if (response.data.success) {
        setAnalytics(response.data.data);
      }
    } catch (error) {
      console.error("Dashboard analytics error:", error);

      toast.error(
        error.response?.data?.message ||
        "Unable to load financial analytics."
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOverview();
  }, [refreshKey]);

  const handleTransactionSuccess = () => {
    setShowAddTransaction(false);
    setRefreshKey((previous) => previous + 1);
  };

  return (
    <div className="min-h-screen bg-[#080d19]">
      <Header />

      <div className="p-6 space-y-6">

        {/* Dashboard heading and action */}
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h2 className="text-xl font-bold text-white">
              Financial Overview
            </h2>

            <p className="text-sm text-slate-400 mt-1">
              Track your money. Understand your habits. Save smarter.
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

        {/* Financial statistics */}
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-5">
          <StatCard
            title="Total Balance"
            amount={
              loading
                ? "Loading..."
                : formatCurrency(analytics.balance)
            }
            change="Available balance"
            icon={Wallet}
            color="bg-blue-500/20 text-blue-400"
          />

          <StatCard
            title="Total Income"
            amount={
              loading
                ? "Loading..."
                : formatCurrency(analytics.totalIncome)
            }
            change={`${analytics.transactionCount} total transactions`}
            icon={TrendingUp}
            color="bg-green-500/20 text-green-400"
          />

          <StatCard
            title="Total Expenses"
            amount={
              loading
                ? "Loading..."
                : formatCurrency(analytics.totalExpenses)
            }
            change="Recorded expenses"
            icon={TrendingDown}
            color="bg-red-500/20 text-red-400"
          />

          <StatCard
            title="Total Savings"
            amount={
              loading
                ? "Loading..."
                : formatCurrency(analytics.balance)
            }
            change={`${Number(analytics.savingsRate || 0).toFixed(2)}% savings rate`}
            icon={PiggyBank}
            color="bg-purple-500/20 text-purple-400"
          />
        </div>

        {/* Charts and recent transactions */}
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
          <div className="xl:col-span-2">
            <ExpenseChart refreshKey={refreshKey} />
          </div>

          <div>
            <TransactionList refreshKey={refreshKey} />
          </div>
        </div>

        {/* AI insights */}
        <div className="bg-gradient-to-r from-blue-900/40 to-purple-900/30 border border-blue-500/20 rounded-2xl p-6">
          <div className="flex items-center gap-3 mb-3">
            <div className="bg-blue-500/20 p-3 rounded-xl">
              <BrainCircuit size={25} className="text-blue-400" />
            </div>

            <h3 className="text-lg font-bold text-white">
              FinSight AI Insights
            </h3>
          </div>

          <p className="text-slate-300 text-sm leading-7">
            Your financial overview is connected to your account.
            FinSight AI will help analyze your spending patterns,
            detect unusual transactions, forecast expenses
            and suggest personalized saving strategies.
          </p>
        </div>

        <p className="text-center text-xs text-slate-500 py-3">
          FinSight AI · Smart Personal Finance Management
        </p>
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

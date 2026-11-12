
import { useCallback, useEffect, useState } from "react";

import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
  Legend
} from "recharts";

import {
  Wallet,
  TrendingUp,
  TrendingDown,
  Receipt,
  RefreshCw,
  ChartNoAxesCombined
} from "lucide-react";

import toast from "react-hot-toast";
import API from "../services/api";

const COLORS = [
  "#3B82F6",
  "#10B981",
  "#F59E0B",
  "#8B5CF6",
  "#EC4899",
  "#06B6D4",
  "#F97316",
  "#A3E635",
  "#E879F9",
  "#94A3B8"
];

const formatCurrency = (value) =>
  `₹${Number(value || 0).toLocaleString("en-IN", {
    maximumFractionDigits: 0
  })}`;

const currentDate = new Date();

function Analytics() {
  const [overview, setOverview] = useState(null);
  const [monthlyData, setMonthlyData] = useState([]);
  const [categoryData, setCategoryData] = useState([]);

  const [dailyData, setDailyData] = useState([]);
  const [yearlyData, setYearlyData] = useState(null);

  const [month, setMonth] = useState(currentDate.getMonth() + 1);
  const [year, setYear] = useState(currentDate.getFullYear());

  const [loading, setLoading] = useState(true);
  const [dailyLoading, setDailyLoading] = useState(true);
  const [error, setError] = useState(false);

  const monthNames = [
    "January", "February", "March", "April",
    "May", "June", "July", "August",
    "September", "October", "November", "December"
  ];

  const fetchMainAnalytics = useCallback(async () => {
    try {
      setLoading(true);
      setError(false);

      const [
        overviewResponse,
        monthlyResponse,
        categoryResponse
      ] = await Promise.all([
        API.get("/analytics/overview"),
        API.get("/analytics/monthly"),
        API.get("/analytics/categories")
      ]);

      setOverview(overviewResponse.data.data);
      setMonthlyData(monthlyResponse.data.data || []);
      setCategoryData(categoryResponse.data.data || []);

    } catch (error) {
      console.error("Analytics loading error:", error);

      setError(true);

      toast.error(
        error.response?.data?.message ||
        "Unable to load analytics"
      );
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchDailyAndYearlyAnalytics = useCallback(async () => {
    try {
      setDailyLoading(true);

      const [dailyResponse, yearlyResponse] = await Promise.all([
        API.get("/analytics/daily", {
          params: { month, year }
        }),

        API.get("/analytics/yearly", {
          params: { year }
        })
      ]);

      setDailyData(dailyResponse.data.data || []);
      setYearlyData(yearlyResponse.data.data);

    } catch (error) {
      console.error("Daily/yearly analytics error:", error);

      toast.error(
        error.response?.data?.message ||
        "Unable to load selected period analytics"
      );
    } finally {
      setDailyLoading(false);
    }
  }, [month, year]);

  useEffect(() => {
    fetchMainAnalytics();
  }, [fetchMainAnalytics]);

  useEffect(() => {
    fetchDailyAndYearlyAnalytics();
  }, [fetchDailyAndYearlyAnalytics]);

  const monthlyChartData = monthlyData.map((item) => ({
    ...item,
    label: `${monthNames[item.month - 1].slice(0, 3)} ${String(item.year).slice(-2)}`
  }));

  const categoryChartData = categoryData.map((item) => ({
    name: item.category || "Uncategorized",
    value: item.totalAmount,
    percentage: item.percentage
  }));

  const dailyChartData = dailyData.map((item) => ({
    ...item,
    day: Number(item.date.slice(-2))
  }));

  const availableYears = Array.from(
    { length: 6 },
    (_, index) => currentDate.getFullYear() - index
  );

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-950 text-slate-400">
        <RefreshCw className="mr-3 animate-spin" size={22} />
        Loading financial analytics...
      </div>
    );
  }

  if (error && !overview) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-slate-950 text-center text-white">
        <ChartNoAxesCombined size={45} className="mb-4 text-slate-500" />

        <h2 className="text-xl font-semibold">
          Unable to load analytics
        </h2>

        <p className="mt-2 text-sm text-slate-400">
          Please check your backend connection and try again.
        </p>

        <button
          onClick={fetchMainAnalytics}
          className="mt-5 rounded-xl bg-blue-600 px-5 py-3 text-sm font-semibold hover:bg-blue-500"
        >
          Retry
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 p-4 text-white sm:p-6 lg:p-8">

      {/* Header */}
      <div className="mb-8 flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <h1 className="text-2xl font-bold sm:text-3xl">
            Financial Analytics
          </h1>

          <p className="mt-2 text-sm text-slate-400">
            Understand your income, expenses and financial performance.
          </p>
        </div>

        <button
          onClick={fetchMainAnalytics}
          disabled={loading}
          className="flex items-center justify-center gap-2 rounded-xl border border-slate-700 px-4 py-3 text-sm text-slate-300 transition hover:bg-slate-800"
        >
          <RefreshCw size={17} />
          Refresh
        </button>
      </div>

      {/* Overview Cards */}
      <div className="mb-8 grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">

        <SummaryCard
          title="Total Balance"
          value={formatCurrency(overview?.balance)}
          icon={<Wallet size={21} />}
          color="text-cyan-400"
        />

        <SummaryCard
          title="Total Income"
          value={formatCurrency(overview?.totalIncome)}
          icon={<TrendingUp size={21} />}
          color="text-emerald-400"
        />

        <SummaryCard
          title="Total Expenses"
          value={formatCurrency(overview?.totalExpenses)}
          icon={<TrendingDown size={21} />}
          color="text-red-400"
        />

        <SummaryCard
          title="Transactions"
          value={overview?.transactionCount || 0}
          icon={<Receipt size={21} />}
          color="text-violet-400"
        />
      </div>

      {/* Savings Rate */}
      <div className="mb-8 rounded-2xl border border-slate-800 bg-slate-900 p-5">
        <div className="mb-3 flex items-center justify-between">
          <div>
            <h2 className="font-semibold">Overall Savings Rate</h2>
            <p className="mt-1 text-xs text-slate-400">
              Percentage of income remaining after expenses
            </p>
          </div>

          <span className="text-2xl font-bold text-emerald-400">
            {(overview?.savingsRate || 0).toFixed(2)}%
          </span>
        </div>

        <div className="h-3 overflow-hidden rounded-full bg-slate-800">
          <div
            className="h-full rounded-full bg-emerald-500 transition-all duration-500"
            style={{
              width: `${Math.min(
                Math.max(overview?.savingsRate || 0, 0),
                100
              )}%`
            }}
          />
        </div>
      </div>

      {/* Monthly Income and Expense Chart */}
      <div className="mb-8 rounded-2xl border border-slate-800 bg-slate-900 p-5">
        <div className="mb-6">
          <h2 className="text-lg font-semibold">
            Monthly Income vs Expenses
          </h2>

          <p className="mt-1 text-sm text-slate-400">
            Financial performance over the last 12 months
          </p>
        </div>

        {monthlyChartData.length === 0 ? (
          <EmptyChart />
        ) : (
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={monthlyChartData}>
                <defs>
                  <linearGradient id="incomeGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#10B981" stopOpacity={0.35} />
                    <stop offset="95%" stopColor="#10B981" stopOpacity={0} />
                  </linearGradient>

                  <linearGradient id="analyticsExpenseGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#EF4444" stopOpacity={0.35} />
                    <stop offset="95%" stopColor="#EF4444" stopOpacity={0} />
                  </linearGradient>
                </defs>

                <CartesianGrid strokeDasharray="3 3" stroke="#263449" />

                <XAxis
                  dataKey="label"
                  stroke="#94a3b8"
                  tick={{ fontSize: 11 }}
                />

                <YAxis
                  stroke="#94a3b8"
                  tickFormatter={(value) =>
                    value >= 1000
                      ? `₹${value / 1000}k`
                      : `₹${value}`
                  }
                  tick={{ fontSize: 11 }}
                />

                <Tooltip
                  contentStyle={{
                    background: "#182234",
                    border: "1px solid #334155",
                    borderRadius: "10px",
                    color: "#fff"
                  }}
                  formatter={(value) => formatCurrency(value)}
                />

                <Legend />

                <Area
                  type="monotone"
                  dataKey="income"
                  name="Income"
                  stroke="#10B981"
                  strokeWidth={2}
                  fill="url(#incomeGradient)"
                />

                <Area
                  type="monotone"
                  dataKey="expenses"
                  name="Expenses"
                  stroke="#EF4444"
                  strokeWidth={2}
                  fill="url(#analyticsExpenseGradient)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>

      {/* Category Breakdown */}
      <div className="mb-8 grid grid-cols-1 gap-5 xl:grid-cols-2">

        <div className="rounded-2xl border border-slate-800 bg-slate-900 p-5">
          <h2 className="text-lg font-semibold">
            Expense Category Breakdown
          </h2>

          <p className="mt-1 text-sm text-slate-400">
            Distribution of all recorded expenses
          </p>

          {categoryChartData.length === 0 ? (
            <EmptyChart />
          ) : (
            <div className="h-72">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={categoryChartData}
                    dataKey="value"
                    nameKey="name"
                    cx="50%"
                    cy="50%"
                    innerRadius={65}
                    outerRadius={105}
                    paddingAngle={3}
                  >
                    {categoryChartData.map((entry, index) => (
                      <Cell
                        key={entry.name}
                        fill={COLORS[index % COLORS.length]}
                      />
                    ))}
                  </Pie>

                  <Tooltip
                    formatter={(value) => formatCurrency(value)}
                    contentStyle={{
                      background: "#182234",
                      border: "1px solid #334155",
                      borderRadius: "10px",
                      color: "#fff"
                    }}
                  />

                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>

        <div className="rounded-2xl border border-slate-800 bg-slate-900 p-5">
          <h2 className="mb-5 text-lg font-semibold">
            Category Details
          </h2>

          {categoryChartData.length === 0 ? (
            <EmptyChart />
          ) : (
            <div className="max-h-72 space-y-4 overflow-y-auto pr-2">
              {categoryChartData.map((item, index) => (
                <div key={item.name}>
                  <div className="mb-2 flex items-center justify-between gap-3">
                    <div className="flex items-center gap-2">
                      <span
                        className="h-3 w-3 rounded-full"
                        style={{
                          backgroundColor: COLORS[index % COLORS.length]
                        }}
                      />

                      <span className="text-sm text-slate-300">
                        {item.name}
                      </span>
                    </div>

                    <span className="text-sm font-semibold">
                      {formatCurrency(item.value)}
                    </span>
                  </div>

                  <div className="h-2 overflow-hidden rounded-full bg-slate-800">
                    <div
                      className="h-full rounded-full"
                      style={{
                        width: `${item.percentage}%`,
                        backgroundColor: COLORS[index % COLORS.length]
                      }}
                    />
                  </div>

                  <p className="mt-1 text-right text-xs text-slate-500">
                    {item.percentage}% of expenses
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Daily Spending */}
      <div className="mb-8 rounded-2xl border border-slate-800 bg-slate-900 p-5">
        <div className="mb-6 flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
          <div>
            <h2 className="text-lg font-semibold">
              Daily Spending Trend
            </h2>

            <p className="mt-1 text-sm text-slate-400">
              Expense distribution for the selected month
            </p>
          </div>

          <div className="flex gap-2">
            <select
              value={month}
              onChange={(event) => setMonth(Number(event.target.value))}
              className="rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-white outline-none focus:border-cyan-500"
            >
              {monthNames.map((name, index) => (
                <option key={name} value={index + 1}>
                  {name}
                </option>
              ))}
            </select>

            <select
              value={year}
              onChange={(event) => setYear(Number(event.target.value))}
              className="rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-white outline-none focus:border-cyan-500"
            >
              {availableYears.map((value) => (
                <option key={value} value={value}>
                  {value}
                </option>
              ))}
            </select>
          </div>
        </div>

        {dailyLoading ? (
          <div className="flex h-72 items-center justify-center text-slate-400">
            <RefreshCw className="mr-2 animate-spin" size={18} />
            Loading daily spending...
          </div>
        ) : dailyChartData.length === 0 ? (
          <EmptyChart message="No expenses recorded for this month." />
        ) : (
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={dailyChartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#263449" />

                <XAxis
                  dataKey="day"
                  stroke="#94a3b8"
                  tick={{ fontSize: 11 }}
                />

                <YAxis
                  stroke="#94a3b8"
                  tickFormatter={(value) =>
                    value >= 1000
                      ? `₹${value / 1000}k`
                      : `₹${value}`
                  }
                  tick={{ fontSize: 11 }}
                />

                <Tooltip
                  labelFormatter={(day) => `${day} ${monthNames[month - 1]}`}
                  formatter={(value) => formatCurrency(value)}
                  contentStyle={{
                    background: "#182234",
                    border: "1px solid #334155",
                    borderRadius: "10px",
                    color: "#fff"
                  }}
                />

                <Bar
                  dataKey="totalExpenses"
                  name="Daily Expenses"
                  fill="#3B82F6"
                  radius={[5, 5, 0, 0]}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>

      {/* Yearly Summary */}
      <div className="rounded-2xl border border-slate-800 bg-slate-900 p-5">
        <div className="mb-6">
          <h2 className="text-lg font-semibold">
            Yearly Financial Summary
          </h2>

          <p className="mt-1 text-sm text-slate-400">
            Financial performance for {year}
          </p>
        </div>

        {dailyLoading ? (
          <div className="flex h-32 items-center justify-center text-slate-400">
            Loading yearly summary...
          </div>
        ) : yearlyData ? (
          <>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
              <YearlyCard
                title="Annual Income"
                value={formatCurrency(yearlyData.totalIncome)}
                color="text-emerald-400"
              />

              <YearlyCard
                title="Annual Expenses"
                value={formatCurrency(yearlyData.totalExpenses)}
                color="text-red-400"
              />

              <YearlyCard
                title="Annual Balance"
                value={formatCurrency(yearlyData.balance)}
                color="text-cyan-400"
              />

              <YearlyCard
                title="Savings Rate"
                value={`${yearlyData.savingsRate}%`}
                color="text-violet-400"
              />
            </div>

            <div className="mt-5 border-t border-slate-800 pt-4 text-sm text-slate-400">
              Total transactions in {year}:{" "}
              <span className="font-semibold text-white">
                {yearlyData.transactionCount}
              </span>
            </div>
          </>
        ) : (
          <EmptyChart />
        )}
      </div>

    </div>
  );
}

function SummaryCard({ title, value, icon, color }) {
  return (
    <div className="rounded-2xl border border-slate-800 bg-slate-900 p-5">
      <div className="mb-4 flex items-center justify-between">
        <p className="text-sm text-slate-400">{title}</p>
        <span className={color}>{icon}</span>
      </div>

      <h3 className="text-2xl font-bold">{value}</h3>
    </div>
  );
}

function YearlyCard({ title, value, color }) {
  return (
    <div className="rounded-xl border border-slate-800 bg-slate-950 p-4">
      <p className="text-sm text-slate-400">{title}</p>
      <h3 className={`mt-2 text-xl font-bold ${color}`}>
        {value}
      </h3>
    </div>
  );
}

function EmptyChart({ message = "No analytics data available." }) {
  return (
    <div className="flex h-64 items-center justify-center text-center text-sm text-slate-500">
      {message}
    </div>
  );
}

export default Analytics;

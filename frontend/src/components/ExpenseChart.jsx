
import { useEffect, useState } from "react";

import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid
} from "recharts";

import toast from "react-hot-toast";
import API from "../services/api";

export default function ExpenseChart({ refreshKey }) {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);

  // Fetch monthly analytics from backend
  const fetchMonthlyAnalytics = async () => {
    try {
      setLoading(true);

      const response = await API.get("/analytics/monthly");

      if (!response.data.success) {
        throw new Error("Unable to retrieve monthly analytics.");
      }

      const monthlyRecords = response.data.data || [];

      // Index backend records by year and month
      const recordsMap = new Map(
        monthlyRecords.map((record) => [
          `${record.year}-${String(record.month).padStart(2, "0")}`,
          record
        ])
      );

      // Generate the last 12 months
      const today = new Date();

      const last12Months = Array.from(
        { length: 12 },
        (_, index) => {
          const date = new Date(
            today.getFullYear(),
            today.getMonth() - 11 + index,
            1
          );

          const year = date.getFullYear();
          const month = date.getMonth() + 1;

          const key = `${year}-${String(month).padStart(2, "0")}`;

          const record = recordsMap.get(key);

          return {
            month: date.toLocaleString("en-IN", {
              month: "short"
            }),
            year,
            expense: record?.expenses || 0,
            income: record?.income || 0
          };
        }
      );

      setData(last12Months);

    } catch (error) {
      console.error("Monthly analytics error:", error);

      toast.error(
        error.response?.data?.message ||
        error.message ||
        "Unable to load monthly expenses."
      );

    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMonthlyAnalytics();
  }, [refreshKey]);

  // Format INR
  const formatCurrency = (value) => {
    return `₹${Number(value || 0).toLocaleString("en-IN")}`;
  };

  return (
    <div className="bg-[#101827] border border-slate-800 rounded-2xl p-5">

      <div className="mb-6">
        <h3 className="text-lg font-semibold text-white">
          Expense Overview
        </h3>

        <p className="text-sm text-slate-400">
          Monthly spending trends · Last 12 months
        </p>
      </div>

      {loading ? (
        <div className="h-72 flex items-center justify-center text-slate-400">
          Loading monthly analytics...
        </div>
      ) : data.length === 0 ? (
        <div className="h-72 flex items-center justify-center text-slate-400">
          No monthly analytics available.
        </div>
      ) : (
        <div className="h-72">

          <ResponsiveContainer width="100%" height="100%">

            <AreaChart data={data}>

              <defs>
                <linearGradient
                  id="expenseGradient"
                  x1="0"
                  y1="0"
                  x2="0"
                  y2="1"
                >
                  <stop
                    offset="0%"
                    stopColor="#3B82F6"
                    stopOpacity={0.4}
                  />

                  <stop
                    offset="95%"
                    stopColor="#3B82F6"
                    stopOpacity={0}
                  />
                </linearGradient>
              </defs>

              <CartesianGrid
                strokeDasharray="3 3"
                stroke="#263449"
              />

              <XAxis
                dataKey="month"
                stroke="#94a3b8"
                tick={{ fontSize: 12 }}
              />

              <YAxis
                stroke="#94a3b8"
                tickFormatter={(value) =>
                  value >= 1000
                    ? `₹${value / 1000}k`
                    : `₹${value}`
                }
                tick={{ fontSize: 12 }}
              />

              <Tooltip
                contentStyle={{
                  background: "#182234",
                  border: "1px solid #334155",
                  borderRadius: "10px",
                  color: "#ffffff"
                }}
                formatter={(value) => [
                  formatCurrency(value),
                  "Expenses"
                ]}
                labelFormatter={(label, payload) => {
                  const year = payload?.[0]?.payload?.year;
                  return year ? `${label} ${year}` : label;
                }}
              />

              <Area
                type="monotone"
                dataKey="expense"
                name="Expenses"
                stroke="#3B82F6"
                strokeWidth={3}
                fill="url(#expenseGradient)"
              />

            </AreaChart>

          </ResponsiveContainer>

        </div>
      )}

    </div>
  );
}


import { useState } from "react";

import {
  X,
  Plus,
  ArrowDownCircle,
  ArrowUpCircle,
  Sparkles
} from "lucide-react";

import toast from "react-hot-toast";
import API from "../services/api";

const expenseCategories = [
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

const incomeCategories = [
  "Salary",
  "Freelance",
  "Business",
  "Investment",
  "Gift",
  "Other"
];

const getToday = () => {
  const today = new Date();

  const year = today.getFullYear();
  const month = String(today.getMonth() + 1).padStart(2, "0");
  const day = String(today.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
};

export default function AddTransaction({ onClose, onSuccess }) {
  const [formData, setFormData] = useState({
    title: "",
    amount: "",
    type: "expense",
    category: "",
    description: "",
    date: getToday(),
    paymentMethod: "upi",
    isRecurring: false
  });

  const [submitting, setSubmitting] = useState(false);

  const categories =
    formData.type === "income"
      ? incomeCategories
      : expenseCategories;

  const handleChange = (event) => {
    const { name, value, type, checked } = event.target;

    setFormData((previous) => ({
      ...previous,
      [name]: type === "checkbox" ? checked : value
    }));
  };

  const handleTypeChange = (type) => {
    setFormData((previous) => ({
      ...previous,
      type,
      category: ""
    }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (!formData.title.trim()) {
      toast.error("Please enter a transaction title.");
      return;
    }

    if (!formData.amount || Number(formData.amount) <= 0) {
      toast.error("Please enter an amount greater than zero.");
      return;
    }

    if (!Number.isFinite(Number(formData.amount))) {
      toast.error("Please enter a valid amount.");
      return;
    }

    if (!formData.date) {
      toast.error("Please select a transaction date.");
      return;
    }

    const payload = {
      title: formData.title.trim(),
      amount: Number(formData.amount),
      type: formData.type,
      description: formData.description.trim(),
      date: formData.date,
      paymentMethod: formData.paymentMethod,
      isRecurring: formData.isRecurring
    };

    // An empty expense category allows the ML service
    // to automatically predict the category.
    if (formData.category) {
      payload.category = formData.category;
    }

    try {
      setSubmitting(true);

      const response = await API.post(
        "/transactions",
        payload
      );

      if (!response.data.success) {
        throw new Error(
          response.data.message || "Transaction creation failed."
        );
      }

      toast.success("Transaction added successfully!");

      // Notify the dashboard that a transaction was created.
      if (onSuccess) {
        onSuccess(response.data.transaction);
      }

      onClose();

    } catch (error) {
      console.error("Create transaction error:", error);

      toast.error(
        error.response?.data?.message ||
        error.message ||
        "Unable to add transaction."
      );

    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4"
      onClick={onClose}
    >
      <div
        className="w-full max-w-xl max-h-[90vh] overflow-y-auto bg-[#101827] border border-slate-700 rounded-2xl shadow-2xl"
        onClick={(event) => event.stopPropagation()}
      >

        {/* Modal header */}
        <div className="flex items-center justify-between p-6 border-b border-slate-700">
          <div>
            <h2 className="text-xl font-bold text-white">
              Add Transaction
            </h2>

            <p className="text-sm text-slate-400 mt-1">
              Record your income or expenses.
            </p>
          </div>

          <button
            type="button"
            onClick={onClose}
            disabled={submitting}
            className="text-slate-400 hover:text-white p-2 rounded-lg hover:bg-slate-700 transition"
          >
            <X size={21} />
          </button>
        </div>

        {/* Transaction form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-5">

          {/* Transaction type */}
          <div>
            <label className="block text-sm text-slate-300 mb-2">
              Transaction Type
            </label>

            <div className="grid grid-cols-2 gap-3">

              <button
                type="button"
                onClick={() => handleTypeChange("expense")}
                className={`flex items-center justify-center gap-2 p-3 rounded-xl border transition ${
                  formData.type === "expense"
                    ? "bg-red-500/15 border-red-500 text-red-400"
                    : "bg-slate-800 border-slate-700 text-slate-400"
                }`}
              >
                <ArrowDownCircle size={19} />
                Expense
              </button>

              <button
                type="button"
                onClick={() => handleTypeChange("income")}
                className={`flex items-center justify-center gap-2 p-3 rounded-xl border transition ${
                  formData.type === "income"
                    ? "bg-green-500/15 border-green-500 text-green-400"
                    : "bg-slate-800 border-slate-700 text-slate-400"
                }`}
              >
                <ArrowUpCircle size={19} />
                Income
              </button>

            </div>
          </div>

          {/* Title */}
          <div>
            <label className="block text-sm text-slate-300 mb-2">
              Transaction Title *
            </label>

            <input
              type="text"
              name="title"
              value={formData.title}
              onChange={handleChange}
              placeholder="e.g. Grocery shopping"
              maxLength={100}
              required
              className="w-full bg-[#182234] border border-slate-700 rounded-xl px-4 py-3 text-white outline-none focus:border-blue-500"
            />
          </div>

          {/* Amount */}
          <div>
            <label className="block text-sm text-slate-300 mb-2">
              Amount (INR) *
            </label>

            <input
              type="number"
              name="amount"
              value={formData.amount}
              onChange={handleChange}
              placeholder="Enter amount"
              min="0.01"
              step="0.01"
              required
              className="w-full bg-[#182234] border border-slate-700 rounded-xl px-4 py-3 text-white outline-none focus:border-blue-500"
            />
          </div>

          {/* Category */}
          <div>
            <label className="block text-sm text-slate-300 mb-2">
              Category
            </label>

            <select
              name="category"
              value={formData.category}
              onChange={handleChange}
              className="w-full bg-[#182234] border border-slate-700 rounded-xl px-4 py-3 text-white outline-none focus:border-blue-500"
            >
              <option value="">
                {formData.type === "expense"
                  ? "Auto-detect category using AI"
                  : "Select income category"}
              </option>

              {categories.map((category) => (
                <option key={category} value={category}>
                  {category}
                </option>
              ))}
            </select>

            {formData.type === "expense" && (
              <p className="flex items-center gap-2 text-xs text-blue-400 mt-2">
                <Sparkles size={14} />
                Leave blank to enable automatic AI categorization.
              </p>
            )}
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm text-slate-300 mb-2">
              Description
            </label>

            <textarea
              name="description"
              value={formData.description}
              onChange={handleChange}
              placeholder="Add additional details..."
              rows={3}
              maxLength={500}
              className="w-full bg-[#182234] border border-slate-700 rounded-xl px-4 py-3 text-white outline-none focus:border-blue-500 resize-none"
            />
          </div>

          {/* Date and payment method */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">

            <div>
              <label className="block text-sm text-slate-300 mb-2">
                Transaction Date *
              </label>

              <input
                type="date"
                name="date"
                value={formData.date}
                onChange={handleChange}
                required
                className="w-full bg-[#182234] border border-slate-700 rounded-xl px-4 py-3 text-white outline-none focus:border-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm text-slate-300 mb-2">
                Payment Method
              </label>

              <select
                name="paymentMethod"
                value={formData.paymentMethod}
                onChange={handleChange}
                className="w-full bg-[#182234] border border-slate-700 rounded-xl px-4 py-3 text-white outline-none focus:border-blue-500"
              >
                <option value="cash">Cash</option>
                <option value="upi">UPI</option>
                <option value="card">Card</option>
                <option value="bank_transfer">Bank Transfer</option>
                <option value="other">Other</option>
              </select>
            </div>

          </div>

          {/* Recurring transaction */}
          <label className="flex items-center gap-3 text-sm text-slate-300 cursor-pointer">
            <input
              type="checkbox"
              name="isRecurring"
              checked={formData.isRecurring}
              onChange={handleChange}
              className="w-4 h-4 accent-blue-500"
            />
            This is a recurring transaction
          </label>

          {/* Form actions */}
          <div className="flex justify-end gap-3 pt-4 border-t border-slate-700">

            <button
              type="button"
              onClick={onClose}
              disabled={submitting}
              className="px-5 py-2.5 rounded-xl border border-slate-600 text-slate-300 hover:bg-slate-800 transition disabled:opacity-50"
            >
              Cancel
            </button>

            <button
              type="submit"
              disabled={submitting}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-medium transition disabled:opacity-50"
            >
              <Plus size={18} />
              {submitting ? "Saving..." : "Add Transaction"}
            </button>

          </div>

        </form>
      </div>
    </div>
  );
}

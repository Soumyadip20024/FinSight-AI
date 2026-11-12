
import { useCallback, useEffect, useState } from "react";
import {
  Plus,
  Target,
  Wallet,
  TrendingUp,
  CheckCircle,
  CalendarDays,
  Pencil,
  Trash2,
  X,
  RefreshCw,
  PiggyBank
} from "lucide-react";
import toast from "react-hot-toast";
import API from "../services/api";

const initialForm = {
  title: "",
  targetAmount: "",
  savedAmount: "0",
  deadline: ""
};

const formatCurrency = (amount) =>
  new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0
  }).format(Number(amount) || 0);

const formatDate = (date) => {
  if (!date) return "No deadline";
  return new Date(date).toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric"
  });
};

function SavingsGoals() {
  const [goals, setGoals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [editingGoal, setEditingGoal] = useState(null);
  const [filter, setFilter] = useState("all");
  const [form, setForm] = useState(initialForm);

  const fetchGoals = useCallback(async () => {
    try {
      setLoading(true);

      const response = await API.get("/savings-goals");
      setGoals(response.data.savingsGoals || []);
    } catch (error) {
      toast.error(
        error.response?.data?.message || "Failed to load savings goals"
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchGoals();
  }, [fetchGoals]);

  const openCreateModal = () => {
    setEditingGoal(null);
    setForm(initialForm);
    setShowModal(true);
  };

  const openEditModal = (goal) => {
    setEditingGoal(goal);

    setForm({
      title: goal.title,
      targetAmount: String(goal.targetAmount),
      savedAmount: String(goal.savedAmount),
      deadline: goal.deadline
        ? new Date(goal.deadline).toISOString().slice(0, 10)
        : ""
    });

    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setEditingGoal(null);
    setForm(initialForm);
  };

  const handleChange = (event) => {
    const { name, value } = event.target;

    setForm((previous) => ({
      ...previous,
      [name]: value
    }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    const target = Number(form.targetAmount);
    const saved = Number(form.savedAmount);

    if (!form.title.trim()) {
      toast.error("Please enter a goal title");
      return;
    }

    if (!Number.isFinite(target) || target < 1) {
      toast.error("Target amount must be at least ₹1");
      return;
    }

    if (!Number.isFinite(saved) || saved < 0) {
      toast.error("Saved amount cannot be negative");
      return;
    }

    if (saved > target) {
      toast.error("Saved amount cannot exceed target amount");
      return;
    }

    const payload = {
      title: form.title.trim(),
      targetAmount: target,
      savedAmount: saved,
      deadline: form.deadline || null
    };

    try {
      setSaving(true);

      if (editingGoal) {
        await API.put(
          `/savings-goals/${editingGoal._id}`,
          payload
        );

        toast.success("Savings goal updated successfully");
      } else {
        await API.post("/savings-goals", payload);

        toast.success("Savings goal created successfully");
      }

      closeModal();
      await fetchGoals();
    } catch (error) {
      toast.error(
        error.response?.data?.message || "Unable to save savings goal"
      );
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id) => {
    const confirmed = window.confirm(
      "Are you sure you want to delete this savings goal?"
    );

    if (!confirmed) return;

    try {
      await API.delete(`/savings-goals/${id}`);

      toast.success("Savings goal deleted successfully");
      await fetchGoals();
    } catch (error) {
      toast.error(
        error.response?.data?.message || "Unable to delete savings goal"
      );
    }
  };

  const filteredGoals = goals.filter((goal) => {
    if (filter === "all") return true;
    return goal.status === filter;
  });

  const totalTarget = goals.reduce(
    (sum, goal) => sum + Number(goal.targetAmount || 0),
    0
  );

  const totalSaved = goals.reduce(
    (sum, goal) => sum + Number(goal.savedAmount || 0),
    0
  );

  const completedGoals = goals.filter(
    (goal) => goal.status === "completed"
  ).length;

  const overallProgress =
    totalTarget > 0
      ? Math.min((totalSaved / totalTarget) * 100, 100)
      : 0;

  return (
    <div className="min-h-screen bg-slate-950 p-4 text-white sm:p-6 lg:p-8">

      {/* Page Header */}
      <div className="mb-8 flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <h1 className="text-2xl font-bold sm:text-3xl">
            Savings Goals
          </h1>

          <p className="mt-2 text-sm text-slate-400">
            Set financial targets and track your savings progress.
          </p>
        </div>

        <div className="flex gap-2">
          <button
            onClick={fetchGoals}
            disabled={loading}
            className="flex items-center gap-2 rounded-xl border border-slate-700 px-4 py-3 text-sm text-slate-300 transition hover:bg-slate-800"
          >
            <RefreshCw size={17} />
            Refresh
          </button>

          <button
            onClick={openCreateModal}
            className="flex items-center gap-2 rounded-xl bg-cyan-500 px-4 py-3 text-sm font-semibold text-slate-950 transition hover:bg-cyan-400"
          >
            <Plus size={18} />
            Create Goal
          </button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="mb-8 grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">

        <SummaryCard
          title="Total Target"
          value={formatCurrency(totalTarget)}
          icon={<Target size={21} />}
          color="text-cyan-400"
        />

        <SummaryCard
          title="Total Saved"
          value={formatCurrency(totalSaved)}
          icon={<Wallet size={21} />}
          color="text-emerald-400"
        />

        <SummaryCard
          title="Overall Progress"
          value={`${overallProgress.toFixed(1)}%`}
          icon={<TrendingUp size={21} />}
          color="text-violet-400"
        />

        <SummaryCard
          title="Completed Goals"
          value={`${completedGoals}/${goals.length}`}
          icon={<CheckCircle size={21} />}
          color="text-amber-400"
        />
      </div>

      {/* Overall Progress */}
      <div className="mb-8 rounded-2xl border border-slate-800 bg-slate-900 p-5">
        <div className="mb-3 flex items-center justify-between gap-3">
          <div>
            <h2 className="font-semibold">Overall Savings Progress</h2>
            <p className="mt-1 text-xs text-slate-400">
              Total saved compared with all your goal targets
            </p>
          </div>

          <span className="text-lg font-bold text-cyan-400">
            {overallProgress.toFixed(1)}%
          </span>
        </div>

        <div className="h-3 overflow-hidden rounded-full bg-slate-800">
          <div
            className="h-full rounded-full bg-cyan-500 transition-all duration-500"
            style={{ width: `${overallProgress}%` }}
          />
        </div>

        <div className="mt-3 flex justify-between text-xs text-slate-400">
          <span>Saved: {formatCurrency(totalSaved)}</span>
          <span>Target: {formatCurrency(totalTarget)}</span>
        </div>
      </div>

      {/* Goals Section */}
      <div className="mb-5 flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
        <div>
          <h2 className="text-xl font-bold">Your Goals</h2>
          <p className="mt-1 text-sm text-slate-400">
            {goals.length} savings goal{goals.length !== 1 ? "s" : ""}
          </p>
        </div>

        <div className="flex gap-2">
          {["all", "active", "completed"].map((value) => (
            <button
              key={value}
              onClick={() => setFilter(value)}
              className={`rounded-lg px-4 py-2 text-sm font-medium capitalize transition ${
                filter === value
                  ? "bg-cyan-500 text-slate-950"
                  : "bg-slate-800 text-slate-400 hover:bg-slate-700"
              }`}
            >
              {value === "all" ? "All Goals" : value}
            </button>
          ))}
        </div>
      </div>

      {/* Goals List */}
      {loading ? (
        <div className="flex min-h-52 items-center justify-center text-slate-400">
          <RefreshCw className="mr-2 animate-spin" size={20} />
          Loading savings goals...
        </div>
      ) : filteredGoals.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-slate-700 bg-slate-900/50 px-6 py-14 text-center">
          <PiggyBank className="mx-auto mb-4 text-slate-500" size={42} />

          <h3 className="text-lg font-semibold">
            {goals.length === 0
              ? "No savings goals yet"
              : "No goals in this category"}
          </h3>

          <p className="mt-2 text-sm text-slate-400">
            {goals.length === 0
              ? "Create your first savings goal and start tracking your progress."
              : "Try selecting another filter."}
          </p>

          {goals.length === 0 && (
            <button
              onClick={openCreateModal}
              className="mt-5 rounded-xl bg-cyan-500 px-5 py-3 text-sm font-semibold text-slate-950 hover:bg-cyan-400"
            >
              Create Your First Goal
            </button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">

          {filteredGoals.map((goal) => {
            const progress =
              goal.targetAmount > 0
                ? Math.min(
                    (goal.savedAmount / goal.targetAmount) * 100,
                    100
                  )
                : 0;

            const remaining = Math.max(
              Number(goal.targetAmount) - Number(goal.savedAmount),
              0
            );

            const completed = goal.status === "completed";

            return (
              <div
                key={goal._id}
                className="rounded-2xl border border-slate-800 bg-slate-900 p-5 transition hover:border-slate-700"
              >
                <div className="mb-5 flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className="rounded-xl bg-cyan-500/10 p-3 text-cyan-400">
                      <Target size={23} />
                    </div>

                    <div>
                      <h3 className="font-semibold">{goal.title}</h3>

                      <p className="mt-1 flex items-center gap-1 text-xs text-slate-400">
                        <CalendarDays size={13} />
                        {formatDate(goal.deadline)}
                      </p>
                    </div>
                  </div>

                  <span
                    className={`rounded-full px-3 py-1 text-xs font-medium ${
                      completed
                        ? "bg-emerald-500/10 text-emerald-400"
                        : "bg-cyan-500/10 text-cyan-400"
                    }`}
                  >
                    {completed ? "Completed" : "Active"}
                  </span>
                </div>

                <div className="mb-3 flex items-end justify-between gap-2">
                  <div>
                    <p className="text-xs text-slate-400">Amount saved</p>
                    <p className="mt-1 text-2xl font-bold">
                      {formatCurrency(goal.savedAmount)}
                    </p>
                  </div>

                  <div className="text-right">
                    <p className="text-xs text-slate-400">Target amount</p>
                    <p className="mt-1 font-semibold text-slate-300">
                      {formatCurrency(goal.targetAmount)}
                    </p>
                  </div>
                </div>

                <div className="mb-2 h-2.5 overflow-hidden rounded-full bg-slate-800">
                  <div
                    className={`h-full rounded-full transition-all duration-500 ${
                      completed ? "bg-emerald-500" : "bg-cyan-500"
                    }`}
                    style={{ width: `${progress}%` }}
                  />
                </div>

                <div className="mb-5 flex justify-between text-xs">
                  <span className="font-medium text-cyan-400">
                    {progress.toFixed(1)}% completed
                  </span>

                  <span className="text-slate-400">
                    {completed
                      ? "Target achieved!"
                      : `${formatCurrency(remaining)} remaining`}
                  </span>
                </div>

                <div className="flex justify-end gap-2 border-t border-slate-800 pt-4">
                  <button
                    onClick={() => openEditModal(goal)}
                    className="flex items-center gap-2 rounded-lg bg-slate-800 px-3 py-2 text-xs text-slate-300 transition hover:bg-slate-700"
                  >
                    <Pencil size={14} />
                    Edit
                  </button>

                  <button
                    onClick={() => handleDelete(goal._id)}
                    className="flex items-center gap-2 rounded-lg bg-red-500/10 px-3 py-2 text-xs text-red-400 transition hover:bg-red-500/20"
                  >
                    <Trash2 size={14} />
                    Delete
                  </button>
                </div>
              </div>
            );
          })}

        </div>
      )}

      {/* Create / Edit Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-black/70 p-4">
          <div className="my-auto w-full max-w-lg rounded-2xl border border-slate-700 bg-slate-900 p-6 shadow-2xl">

            <div className="mb-6 flex items-center justify-between">
              <div>
                <h2 className="text-xl font-bold">
                  {editingGoal ? "Edit Savings Goal" : "Create Savings Goal"}
                </h2>

                <p className="mt-1 text-sm text-slate-400">
                  Define your target and track your savings.
                </p>
              </div>

              <button
                onClick={closeModal}
                disabled={saving}
                className="rounded-lg p-2 text-slate-400 hover:bg-slate-800 hover:text-white"
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">

              <div>
                <label className="mb-2 block text-sm text-slate-300">
                  Goal Title
                </label>

                <input
                  type="text"
                  name="title"
                  value={form.title}
                  onChange={handleChange}
                  placeholder="e.g. Buy a new laptop"
                  maxLength={100}
                  required
                  className="w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 text-sm text-white outline-none focus:border-cyan-500"
                />
              </div>

              <div>
                <label className="mb-2 block text-sm text-slate-300">
                  Target Amount (₹)
                </label>

                <input
                  type="number"
                  name="targetAmount"
                  value={form.targetAmount}
                  onChange={handleChange}
                  placeholder="50000"
                  min="1"
                  step="0.01"
                  required
                  className="w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 text-sm text-white outline-none focus:border-cyan-500"
                />
              </div>

              <div>
                <label className="mb-2 block text-sm text-slate-300">
                  Amount Already Saved (₹)
                </label>

                <input
                  type="number"
                  name="savedAmount"
                  value={form.savedAmount}
                  onChange={handleChange}
                  min="0"
                  step="0.01"
                  required
                  className="w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 text-sm text-white outline-none focus:border-cyan-500"
                />
              </div>

              <div>
                <label className="mb-2 block text-sm text-slate-300">
                  Target Deadline (Optional)
                </label>

                <input
                  type="date"
                  name="deadline"
                  value={form.deadline}
                  onChange={handleChange}
                  className="w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 text-sm text-white outline-none focus:border-cyan-500"
                />
              </div>

              <div className="flex justify-end gap-3 pt-3">
                <button
                  type="button"
                  onClick={closeModal}
                  disabled={saving}
                  className="rounded-xl border border-slate-700 px-5 py-3 text-sm text-slate-300 hover:bg-slate-800"
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  disabled={saving}
                  className="flex items-center gap-2 rounded-xl bg-cyan-500 px-5 py-3 text-sm font-semibold text-slate-950 transition hover:bg-cyan-400 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {saving && (
                    <RefreshCw size={15} className="animate-spin" />
                  )}

                  {saving
                    ? "Saving..."
                    : editingGoal
                      ? "Update Goal"
                      : "Create Goal"}
                </button>
              </div>

            </form>
          </div>
        </div>
      )}

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

export default SavingsGoals;

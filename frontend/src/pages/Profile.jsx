
import { useEffect, useState } from "react";
import {
  UserRound,
  Mail,
  CalendarDays,
  Wallet,
  Lock,
  Save,
  LogOut,
  LoaderCircle,
  ShieldCheck
} from "lucide-react";
import toast from "react-hot-toast";
import { useNavigate } from "react-router-dom";

import API from "../services/api";
import Header from "../components/Header";
import { useAuth } from "../context/AuthContext";

export default function Profile() {
  const navigate = useNavigate();
  const { user, updateUser, logout } = useAuth();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [changingPassword, setChangingPassword] = useState(false);

  const [profile, setProfile] = useState({
    name: "",
    email: "",
    currency: "INR",
    monthlyIncome: 0,
    createdAt: ""
  });

  const [form, setForm] = useState({
    name: "",
    currency: "INR",
    monthlyIncome: 0
  });

  const [passwordForm, setPasswordForm] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: ""
  });

  // Fetch profile information
  useEffect(() => {
    const fetchProfile = async () => {
      try {
        setLoading(true);

        const response = await API.get("/auth/profile");
        const userData = response.data.user;

        setProfile(userData);

        setForm({
          name: userData.name || "",
          currency: userData.currency || "INR",
          monthlyIncome: userData.monthlyIncome ?? 0
        });

        updateUser(userData);
      } catch (error) {
        toast.error(
          error.response?.data?.message ||
          "Unable to load profile"
        );
      } finally {
        setLoading(false);
      }
    };

    fetchProfile();
  }, [updateUser]);

  // Handle profile form changes
  const handleProfileChange = (e) => {
    const { name, value } = e.target;

    setForm((previous) => ({
      ...previous,
      [name]: name === "monthlyIncome" ? value : value
    }));
  };

  // Update profile
  const handleProfileSubmit = async (e) => {
    e.preventDefault();

    if (!form.name.trim()) {
      return toast.error("Name cannot be empty");
    }

    if (!/^[A-Za-z]{3}$/.test(form.currency.trim())) {
      return toast.error("Enter a valid 3-letter currency code");
    }

    if (
      form.monthlyIncome === "" ||
      !Number.isFinite(Number(form.monthlyIncome)) ||
      Number(form.monthlyIncome) < 0
    ) {
      return toast.error("Enter a valid monthly income");
    }

    try {
      setSaving(true);

      const response = await API.put("/auth/profile", {
        name: form.name.trim(),
        currency: form.currency.trim().toUpperCase(),
        monthlyIncome: Number(form.monthlyIncome)
      });

      const updatedUser = response.data.user;

      setProfile(updatedUser);

      setForm({
        name: updatedUser.name,
        currency: updatedUser.currency,
        monthlyIncome: updatedUser.monthlyIncome
      });

      updateUser(updatedUser);

      toast.success("Profile updated successfully");
    } catch (error) {
      toast.error(
        error.response?.data?.message ||
        "Unable to update profile"
      );
    } finally {
      setSaving(false);
    }
  };

  // Handle password form changes
  const handlePasswordChange = (e) => {
    const { name, value } = e.target;

    setPasswordForm((previous) => ({
      ...previous,
      [name]: value
    }));
  };

  // Change password
  const handlePasswordSubmit = async (e) => {
    e.preventDefault();

    if (
      !passwordForm.currentPassword ||
      !passwordForm.newPassword ||
      !passwordForm.confirmPassword
    ) {
      return toast.error("Please fill in all password fields");
    }

    if (passwordForm.newPassword.length < 8) {
      return toast.error("New password must contain at least 8 characters");
    }

    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      return toast.error("New passwords do not match");
    }

    try {
      setChangingPassword(true);

      const response = await API.put("/auth/change-password", {
        currentPassword: passwordForm.currentPassword,
        newPassword: passwordForm.newPassword
      });

      toast.success(
        response.data.message || "Password changed successfully"
      );

      setPasswordForm({
        currentPassword: "",
        newPassword: "",
        confirmPassword: ""
      });
    } catch (error) {
      toast.error(
        error.response?.data?.message ||
        "Unable to change password"
      );
    } finally {
      setChangingPassword(false);
    }
  };

  // Logout
  const handleLogout = () => {
    logout();
    toast.success("Logged out successfully");
    navigate("/login", { replace: true });
  };

  const formattedDate = profile.createdAt
    ? new Date(profile.createdAt).toLocaleDateString("en-IN", {
        day: "numeric",
        month: "long",
        year: "numeric"
      })
    : "Not available";

  if (loading) {
    return (
      <div className="min-h-screen bg-[#080d19]">
        <Header />

        <div className="flex min-h-[60vh] items-center justify-center">
          <LoaderCircle className="animate-spin text-blue-400" size={36} />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#080d19]">
      <Header />

      <main className="p-6 lg:p-8 max-w-6xl mx-auto">

        {/* Page Heading */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-white">
            My Profile
          </h1>

          <p className="text-slate-400 mt-2">
            Manage your personal information and account security.
          </p>
        </div>

        {/* Profile Overview */}
        <div className="bg-[#111c2e] border border-slate-800 rounded-2xl p-6 mb-8">
          <div className="flex flex-wrap items-center gap-5">

            <div className="w-20 h-20 rounded-full bg-blue-500/15 flex items-center justify-center">
              <UserRound size={42} className="text-blue-400" />
            </div>

            <div className="flex-1 min-w-0">
              <h2 className="text-2xl font-bold text-white">
                {profile.name}
              </h2>

              <p className="text-slate-400 mt-1 break-all">
                {profile.email}
              </p>

              <div className="flex items-center gap-2 mt-3">
                <ShieldCheck size={16} className="text-emerald-400" />

                <span className="text-sm text-emerald-400">
                  Authenticated account
                </span>
              </div>
            </div>

          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

          {/* Personal Information */}
          <section className="bg-[#111c2e] border border-slate-800 rounded-2xl p-6">

            <div className="flex items-center gap-3 mb-6">
              <UserRound className="text-blue-400" size={22} />

              <h2 className="text-xl font-semibold text-white">
                Personal Information
              </h2>
            </div>

            <form onSubmit={handleProfileSubmit} className="space-y-5">

              <div>
                <label className="block text-sm text-slate-300 mb-2">
                  Full Name
                </label>

                <input
                  type="text"
                  name="name"
                  value={form.name}
                  onChange={handleProfileChange}
                  required
                  className="w-full bg-[#182438] border border-slate-700 rounded-xl px-4 py-3 text-white outline-none focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm text-slate-300 mb-2">
                  Email Address
                </label>

                <div className="flex items-center gap-3 bg-[#182438] border border-slate-700 rounded-xl px-4 py-3">
                  <Mail size={18} className="text-slate-400" />

                  <span className="text-slate-400 text-sm break-all">
                    {profile.email}
                  </span>
                </div>

                <p className="text-xs text-slate-500 mt-2">
                  Email address cannot currently be changed.
                </p>
              </div>

              <div>
                <label className="block text-sm text-slate-300 mb-2">
                  Currency
                </label>

                <select
                  name="currency"
                  value={form.currency}
                  onChange={handleProfileChange}
                  className="w-full bg-[#182438] border border-slate-700 rounded-xl px-4 py-3 text-white outline-none focus:border-blue-500"
                >
                  <option value="INR">INR - Indian Rupee</option>
                  <option value="USD">USD - US Dollar</option>
                  <option value="EUR">EUR - Euro</option>
                  <option value="GBP">GBP - British Pound</option>
                  <option value="JPY">JPY - Japanese Yen</option>
                </select>
              </div>

              <div>
                <label className="block text-sm text-slate-300 mb-2">
                  Monthly Income
                </label>

                <input
                  type="number"
                  name="monthlyIncome"
                  min="0"
                  step="0.01"
                  value={form.monthlyIncome}
                  onChange={handleProfileChange}
                  required
                  className="w-full bg-[#182438] border border-slate-700 rounded-xl px-4 py-3 text-white outline-none focus:border-blue-500"
                />
              </div>

              <button
                type="submit"
                disabled={saving}
                className="w-full flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-60 text-white font-semibold rounded-xl px-5 py-3 transition"
              >
                {saving ? (
                  <LoaderCircle size={18} className="animate-spin" />
                ) : (
                  <Save size={18} />
                )}

                {saving ? "Saving..." : "Save Changes"}
              </button>

            </form>
          </section>

          {/* Account Details */}
          <div className="space-y-6">

            <section className="bg-[#111c2e] border border-slate-800 rounded-2xl p-6">

              <h2 className="text-xl font-semibold text-white mb-6">
                Account Details
              </h2>

              <div className="space-y-5">

                <div className="flex items-center gap-4">
                  <div className="bg-blue-500/10 p-3 rounded-xl">
                    <CalendarDays className="text-blue-400" size={22} />
                  </div>

                  <div>
                    <p className="text-sm text-slate-400">
                      Account Created
                    </p>

                    <p className="text-white font-medium mt-1">
                      {formattedDate}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-4">
                  <div className="bg-emerald-500/10 p-3 rounded-xl">
                    <ShieldCheck className="text-emerald-400" size={22} />
                  </div>

                  <div>
                    <p className="text-sm text-slate-400">
                      Account Status
                    </p>

                    <p className="text-emerald-400 font-medium mt-1">
                      Active
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-4">
                  <div className="bg-purple-500/10 p-3 rounded-xl">
                    <Wallet className="text-purple-400" size={22} />
                  </div>

                  <div>
                    <p className="text-sm text-slate-400">
                      Preferred Currency
                    </p>

                    <p className="text-white font-medium mt-1">
                      {profile.currency}
                    </p>
                  </div>
                </div>

              </div>
            </section>

            {/* Change Password */}
            <section className="bg-[#111c2e] border border-slate-800 rounded-2xl p-6">

              <div className="flex items-center gap-3 mb-6">
                <Lock className="text-blue-400" size={22} />

                <h2 className="text-xl font-semibold text-white">
                  Change Password
                </h2>
              </div>

              <form onSubmit={handlePasswordSubmit} className="space-y-4">

                <input
                  type="password"
                  name="currentPassword"
                  placeholder="Current Password"
                  value={passwordForm.currentPassword}
                  onChange={handlePasswordChange}
                  autoComplete="current-password"
                  className="w-full bg-[#182438] border border-slate-700 rounded-xl px-4 py-3 text-white outline-none focus:border-blue-500"
                />

                <input
                  type="password"
                  name="newPassword"
                  placeholder="New Password (minimum 8 characters)"
                  value={passwordForm.newPassword}
                  onChange={handlePasswordChange}
                  autoComplete="new-password"
                  className="w-full bg-[#182438] border border-slate-700 rounded-xl px-4 py-3 text-white outline-none focus:border-blue-500"
                />

                <input
                  type="password"
                  name="confirmPassword"
                  placeholder="Confirm New Password"
                  value={passwordForm.confirmPassword}
                  onChange={handlePasswordChange}
                  autoComplete="new-password"
                  className="w-full bg-[#182438] border border-slate-700 rounded-xl px-4 py-3 text-white outline-none focus:border-blue-500"
                />

                <button
                  type="submit"
                  disabled={changingPassword}
                  className="w-full flex items-center justify-center gap-2 bg-purple-600 hover:bg-purple-700 disabled:opacity-60 text-white font-semibold rounded-xl px-5 py-3 transition"
                >
                  {changingPassword ? (
                    <LoaderCircle size={18} className="animate-spin" />
                  ) : (
                    <Lock size={18} />
                  )}

                  {changingPassword ? "Updating..." : "Update Password"}
                </button>

              </form>
            </section>

          </div>
        </div>

        {/* Logout */}
        <section className="mt-6 bg-[#111c2e] border border-red-900/40 rounded-2xl p-6 flex flex-wrap items-center justify-between gap-4">

          <div>
            <h2 className="text-lg font-semibold text-white">
              Sign Out
            </h2>

            <p className="text-sm text-slate-400 mt-1">
              Log out of your FinSight AI account.
            </p>
          </div>

          <button
            type="button"
            onClick={handleLogout}
            className="flex items-center gap-2 bg-red-600 hover:bg-red-700 text-white font-semibold rounded-xl px-5 py-3 transition"
          >
            <LogOut size={18} />
            Logout
          </button>

        </section>

      </main>
    </div>
  );
}

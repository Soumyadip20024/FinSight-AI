
import { useNavigate } from "react-router-dom";

import {
  Search,
  Bell,
  UserCircle
} from "lucide-react";

import { useAuth } from "../context/AuthContext";

export default function Header() {
  const { user } = useAuth();
  const navigate = useNavigate();

  return (
    <header className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-800 px-6 py-5">

      {/* Page Information */}
      <div>
        <h2 className="text-2xl font-bold text-white">
          FinSight AI
        </h2>

        <p className="text-sm text-slate-400 mt-1">
          Welcome back! Manage your finances smarter.
        </p>
      </div>

      {/* User Information */}
      <div className="flex items-center gap-4">

        <div className="hidden sm:flex items-center gap-2 bg-[#182234] px-4 py-2 rounded-xl">
          <Search size={17} className="text-slate-400" />

          <input
            type="text"
            placeholder="Search..."
            className="bg-transparent outline-none text-sm w-32 text-white"
          />
        </div>

        <button
          type="button"
          className="text-slate-400 hover:text-white transition"
          aria-label="Notifications"
        >
          <Bell size={21} />
        </button>

        {/* Clickable Profile */}
        <button
          type="button"
          onClick={() => navigate("/profile")}
          className="flex items-center gap-2 text-left rounded-xl hover:bg-[#182234] p-2 transition"
          title="View Profile"
          aria-label="View Profile"
        >
          <UserCircle
            size={32}
            className="text-blue-400"
          />

          <div className="hidden sm:block">
            <p className="text-sm font-semibold text-white">
              {user?.name || "User"}
            </p>

            <p className="text-xs text-slate-400">
              {user?.email || "Personal Account"}
            </p>
          </div>
        </button>

      </div>
    </header>
  );
}

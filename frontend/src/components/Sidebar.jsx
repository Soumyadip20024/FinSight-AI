
import {
  LayoutDashboard,
  Wallet,
  ArrowLeftRight,
  ChartNoAxesCombined,
  Target,
  BrainCircuit,
  Settings,
  LogOut
} from "lucide-react";

import { useLocation, useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import { useAuth } from "../context/AuthContext";

const menuItems = [
  {
    name: "Dashboard",
    icon: LayoutDashboard,
    path: "/"
  },
  {
    name: "Transactions",
    icon: ArrowLeftRight,
    path: "/transactions"
  },
  {
    name: "Budgets",
    icon: Wallet,
    path: "/budgets"
  },
  {
    name: "Analytics",
    icon: ChartNoAxesCombined,
    path: "/analytics"
  },
  {
    name: "Savings Goals",
    icon: Target,
    path: "/savings-goals"
  },
  {
    name: "AI Advisor",
    icon: BrainCircuit
  }
];

export default function Sidebar() {
  const navigate = useNavigate();
  const location = useLocation();
  const { logout } = useAuth();

  const handleNavigation = (item) => {
    if (item.path) {
      navigate(item.path);
    } else {
      toast("This feature is coming soon!", {
        icon: "🚧"
      });
    }
  };

  const handleLogout = () => {
    logout();
    toast.success("Logged out successfully");
    navigate("/login", { replace: true });
  };

  return (
    <aside className="w-64 min-h-screen bg-[#0c1423] border-r border-slate-800 p-5 flex flex-col">

      {/* Logo */}
      <div className="flex items-center gap-3 mb-10">
        <div className="bg-blue-600 p-2 rounded-xl">
          <Wallet size={23} className="text-white" />
        </div>

        <div>
          <h1 className="text-xl font-bold text-white">
            FinSight AI
          </h1>
          <p className="text-xs text-slate-400">
            Smart Finance Management
          </p>
        </div>
      </div>

      {/* Navigation */}
      <nav className="space-y-2 flex-1">
        <p className="text-xs uppercase tracking-wider text-slate-500 mb-4">
          Menu
        </p>

        {menuItems.map((item) => {
          const Icon = item.icon;

          const isActive =
            item.path === location.pathname;

          return (
            <button
              key={item.name}
              onClick={() => handleNavigation(item)}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm transition ${
                isActive
                  ? "bg-blue-600 text-white shadow-lg shadow-blue-600/20"
                  : "text-slate-400 hover:bg-slate-800 hover:text-white"
              }`}
            >
              <Icon size={19} />
              <span>{item.name}</span>

              {!item.path && (
                <span className="ml-auto text-[10px] text-slate-500">
                  Soon
                </span>
              )}
            </button>
          );
        })}
      </nav>

      {/* Bottom Actions */}
      <div className="border-t border-slate-800 pt-4 space-y-2">

        <button
          onClick={() =>
            toast("Settings are coming soon!", {
              icon: "⚙️"
            })
          }
          className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm text-slate-400 hover:bg-slate-800 hover:text-white transition"
        >
          <Settings size={19} />
          Settings
        </button>

        <button
          onClick={handleLogout}
          className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm text-red-400 hover:bg-red-500/10 transition"
        >
          <LogOut size={19} />
          Logout
        </button>

      </div>
    </aside>
  );
}

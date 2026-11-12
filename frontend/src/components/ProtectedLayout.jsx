import { Outlet } from "react-router-dom";
import Sidebar from "./Sidebar";

export default function ProtectedLayout() {
  return (
    <div className="flex min-h-screen bg-[#080d19]">
      <div className="hidden lg:block shrink-0">
        <Sidebar />
      </div>

      <main className="flex-1 min-w-0">
        <Outlet />
      </main>
    </div>
  );
}
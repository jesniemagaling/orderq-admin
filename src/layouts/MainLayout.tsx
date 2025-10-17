import { Outlet } from "react-router-dom";
import useAuth from "../hooks/useAuth";
import Sidebar from "../components/Sidebar";

export default function MainLayout() {
  const { role } = useAuth(); // read from localStorage

  return (
    <div className="flex min-h-screen bg-gray-100">
      <Sidebar role={role as "admin" | "cashier" | "kitchen"} />

      <main className="flex-1 p-6 overflow-y-auto">
        <Outlet />
      </main>
    </div>
  );
}

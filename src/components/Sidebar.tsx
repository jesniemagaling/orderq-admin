import { NavLink } from "react-router-dom";

interface SidebarProps {
  role: "admin" | "cashier" | "kitchen";
}

export default function Sidebar({ role }: SidebarProps) {
  // Define menu options per role
  const menuItems: Record<string, { name: string; path: string }[]> = {
    admin: [
      { name: "Overview", path: "/admin" },
      { name: "Orders", path: "/admin/orders" },
      { name: "Menu", path: "/admin/menu" },
    ],
    cashier: [
      { name: "Tables", path: "/cashier/tables" },
      { name: "Orders", path: "/cashier/orders" },
    ],
    kitchen: [
      { name: "Orders", path: "/kitchen/orders" },
    ],
  };

  const currentMenu = menuItems[role] || [];

  return (
    <aside className="w-64 h-screen p-6 bg-white shadow-lg">
      <h1 className="text-2xl font-bold mb-8 text-[#820D17]">OrderQ</h1>

      <nav className="flex flex-col space-y-3">
        {currentMenu.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            className={({ isActive }) =>
              `block px-3 py-2 rounded-md transition-colors ${
                isActive
                  ? "bg-[#820D17]/10 text-[#820D17] font-semibold"
                  : "text-gray-700 hover:bg-gray-100"
              }`
            }
          >
            {item.name}
          </NavLink>
        ))}
      </nav>
    </aside>
  );
}

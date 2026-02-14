import { Link, useLocation } from "react-router-dom";
import { BarChart3, ShoppingCart, Package, Settings as SettingsIcon, TrendingUp, Menu } from "lucide-react";

export default function Sidebar({ isOpen }) {
  const location = useLocation();

  const links = [
    { name: "Dashboard", path: "/", icon: BarChart3 },
    { name: "Products", path: "/products", icon: Package },
    { name: "Orders", path: "/orders", icon: ShoppingCart },
    { name: "Analytics", path: "/analytics", icon: TrendingUp },
    { name: "Settings", path: "/settings", icon: SettingsIcon }
  ];

  return (
    <aside
      className={`transition-all duration-300 ${
        isOpen ? "w-64" : "w-20"
      } bg-gradient-to-b from-slate-900 to-slate-800 text-white flex flex-col`}
    >
      <div className="p-6 border-b border-slate-700">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-gradient-to-br from-blue-400 to-blue-600 rounded-lg flex items-center justify-center font-bold text-lg">
            E
          </div>
          {isOpen && <span className="font-bold text-lg">E-Shop</span>}
        </div>
      </div>

      <nav className="flex-1 p-4 space-y-2">
        {links.map((link) => {
          const Icon = link.icon;
          const isActive = location.pathname === link.path;
          return (
            <Link
              key={link.path}
              to={link.path}
              className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-all ${
                isActive
                  ? "bg-blue-500 text-white"
                  : "text-gray-300 hover:bg-slate-700"
              }`}
              title={!isOpen ? link.name : ""}
            >
              <Icon size={20} />
              {isOpen && <span>{link.name}</span>}
            </Link>
          );
        })}
      </nav>

      <div className="p-4 border-t border-slate-700">
        <div className="text-xs text-gray-400 text-center">
          {isOpen ? "© 2024 E-Shop Admin" : "v1.0"}
        </div>
      </div>
    </aside>
  );
}

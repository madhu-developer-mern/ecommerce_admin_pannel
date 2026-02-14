import { Menu, Bell, User, LogOut } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export default function Header({ onToggleSidebar }) {
  const navigate = useNavigate();
  const { admin, logout } = useAuth();

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  return (
    <header className="bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
      <div className="flex items-center gap-4">
        <button
          onClick={onToggleSidebar}
          className="p-2 hover:bg-gray-100 rounded-lg transition"
          title="Toggle Sidebar"
        >
          <Menu size={20} />
        </button>
        <div className="flex items-center gap-3">
          <img
            src="https://res.cloudinary.com/dzdcizyyv/image/upload/v1770311958/Gemini_Generated_Image_awod6awod6awod6a_tjqu88.png"
            alt="Logo"
            className="w-10 h-10 rounded-full object-cover"
          />
          <h1 className="text-2xl font-bold text-gray-900">E-Commerce Admin</h1>
        </div>
      </div>

      <div className="flex items-center gap-4">
        <button className="relative p-2 text-gray-600 hover:bg-gray-100 rounded-lg transition">
          <Bell size={20} />
          <span className="absolute top-0 right-0 w-3 h-3 bg-red-500 rounded-full"></span>
        </button>

        <div className="flex items-center gap-3 pl-4 border-l border-gray-200">
          <div className="text-right">
            <p className="text-sm font-medium text-gray-900">{admin?.name || "Admin User"}</p>
            <p className="text-xs text-gray-500">Active now</p>
          </div>
          <button className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg transition">
            <User size={20} />
          </button>
          <button
            onClick={handleLogout}
            className="p-2 text-gray-600 hover:bg-gray-100 hover:text-red-600 rounded-lg transition"
            title="Logout"
          >
            <LogOut size={20} />
          </button>
        </div>
      </div>
    </header>
  );
}

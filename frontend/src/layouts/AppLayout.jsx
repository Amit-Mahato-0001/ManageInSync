import { useAuth } from "../context/AuthContext";
import { useNavigate, useLocation, Link } from "react-router-dom";
import {
  LayoutDashboard,
  FolderKanban,
  Users,
  User,
  FileText,
} from "lucide-react";

export default function AppLayout({ children }) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  const navItems = [
    { name: "Dashboard", to: "/", icon: LayoutDashboard, roles: ["owner", "admin", "member", "client"] },
    { name: "Projects", to: "/projects", icon: FolderKanban, roles: ["owner", "admin", "member", "client"] },
    { name: "Clients", to: "/clients", icon: User, roles: ["owner", "admin"] },
    { name: "Members", to: "/members", icon: Users, roles: ["owner", "admin"] },
    { name: "Audit Logs", to: "/audit-logs", icon: FileText, roles: ["owner", "admin"] },
  ];

  return (
    <div className="h-screen flex flex-col bg-[#0B0F19] text-white">

      {/* NAVBAR */}
      <header className="h-14 flex items-center justify-between px-6 border-b border-white/10 bg-[#18181B]">
        <div className="flex items-center gap-3">
          <img src="/Union.png" className="h-6" />
        </div>

        <button
          onClick={handleLogout}
          className="text-sm px-3 py-1.5 rounded-md bg-white/10"
        >
          Logout
        </button>
      </header>

      {/* BODY */}
      <div className="flex flex-1 overflow-hidden">

        {/* SIDEBAR */}
        <aside className="w-60 border-r border-white/10 p-4 bg-[#18181B]">

          <nav className="flex flex-col gap-2">
            {navItems
              .filter(item => item.roles.includes(user?.role))
              .map((item) => {
                const isActive =
                  item.to === "/"
                    ? location.pathname === "/"
                    : location.pathname.startsWith(item.to);

                const Icon = item.icon;

                return (
                  <Link
                    key={item.name}
                    to={item.to}
                    className={`
                      px-3 py-2 text-sm rounded-md flex items-center gap-3
                      transition-colors
                      ${
                        isActive
                          ? "bg-white/10"
                          : "hover:bg-white/10"
                      }
                    `}
                  >
                    <Icon className="w-4 h-4" />
                    {item.name}
                  </Link>
                );
              })}
          </nav>

        </aside>

        {/* CONTENT */}
        <main className="flex-1 overflow-auto bg-[#09090B] p-6">
          <div className="max-w-7xl mx-auto">
            <div className="p-6 min-h-[70vh]">
              {children}
            </div>
          </div>
        </main>

      </div>
    </div>
  );
}

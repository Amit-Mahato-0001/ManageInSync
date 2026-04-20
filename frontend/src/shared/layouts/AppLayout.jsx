import { useState } from "react";
import { useAuth } from "@/features/auth/hooks/useAuth";
import { useNavigate, useLocation, Link } from "react-router-dom";
import {
  LayoutDashboard,
  FolderKanban,
  Users,
  User,
  CreditCard,
  FileText,
  LogOut,
} from "lucide-react";

export default function AppLayout({ children }) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  const handleLogout = async () => {
    setIsLoggingOut(true);

    try {
      await logout();
      navigate("/login");
    } finally {
      setIsLoggingOut(false);
    }
  };

  const navItems = [
    { name: "Dashboard", to: "/", icon: LayoutDashboard, roles: ["owner", "admin", "member", "client"] },
    { name: "Projects", to: "/projects", icon: FolderKanban, roles: ["owner", "admin", "member", "client"] },
    { name: "Billing", to: "/billing", icon: CreditCard, roles: ["owner", "client"] },
    { name: "Clients", to: "/clients", icon: User, roles: ["owner", "admin"] },
    { name: "Members", to: "/members", icon: Users, roles: ["owner", "admin"] },
    { name: "Activity Feed", to: "/activity-feed", icon: FileText, roles: ["owner", "admin", "member"] },
  ];

  return (
    <div className="app-shell h-screen flex flex-col bg-[#0B0F19] text-2xl text-white">

      {/* NAVBAR */}
      <header className="h-20 flex items-center justify-between px-6 border-b border-white/10 bg-[#18181B]">
        <div className="flex items-center gap-3">
          <img src="/Union.png" className="h-12" />
        </div>

        <button
          onClick={handleLogout}
          disabled={isLoggingOut}
          className="inline-flex items-center gap-4 rounded-lg border border-white/10 bg-gradient-to-br from-[#18181B] to-blue-500 px-4 py-2 text-2xl"
        >
          {isLoggingOut ? "Logging out..." : "Logout"}
          <LogOut className="h-6 w-6"/>
        </button>
      </header>

      {/* BODY */}
      <div className="flex flex-1 overflow-hidden">

        {/* SIDEBAR */}
        <aside className="w-60 border-r border-white/10 p-4 bg-[#18181B]">

          <nav className="flex flex-col gap-4">
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
                      px-3 py-2 text-2xl rounded-md flex items-center gap-3
                      transition-colors
                      ${
                        isActive
                          ? "bg-white/10"
                          : "hover:bg-white/10"
                      }
                    `}
                  >
                    <Icon className="w-6 h-6" />
                    {item.name}
                  </Link>
                );
              })}
          </nav>

        </aside>

        {/* CONTENT */}
        <main className="flex-1 overflow-auto bg-[#09090B] p-6">
          <div className="max-w-8xl mx-auto">
            <div className="p-6 min-h-[70vh]">
              {children}
            </div>
          </div>
        </main>

      </div>
    </div>
  );
}

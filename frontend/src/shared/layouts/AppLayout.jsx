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
  Settings,
  LogOut,
  Menu,
  X,
} from "lucide-react";

export default function AppLayout({ children }) {
  const { user, tenant, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  const navItems = [
    {
      name: "Dashboard",
      to: "/",
      icon: LayoutDashboard,
      roles: ["owner", "admin", "member", "client"],
    },
    {
      name: "Projects",
      to: "/projects",
      icon: FolderKanban,
      roles: ["owner", "admin", "member", "client"],
    },
    {
      name: "Billing",
      to: "/billing",
      icon: CreditCard,
      roles: ["owner", "client"],
    },
    {
      name: "Clients",
      to: "/clients",
      icon: User,
      roles: ["owner", "admin"],
    },
    {
      name: "Members",
      to: "/members",
      icon: Users,
      roles: ["owner", "admin"],
    },
    {
      name: "Activity Feed",
      to: "/activity-feed",
      icon: FileText,
      roles: ["owner", "admin", "member"],
    },
    {
      name: "Account",
      to: "/account",
      icon: Settings,
      roles: ["owner", "admin", "member", "client"],
    },
  ]

  const handleLogout = async () => {

    let workspace = ""

    if (tenant) {

      workspace = tenant.slug || tenant.name || ""

    }

    try {

      setIsLoggingOut(true)

      await logout()

      if (workspace) {

        navigate(`/login?workspace=${encodeURIComponent(workspace)}`)

      } else {

        navigate("/login")
      }

    } finally {

      setIsLoggingOut(false)

    }

  }

  const handleNavClick = () => {
    setIsSidebarOpen(false)
  }

  return (

    <div className="app-shell flex h-screen flex-col bg-[#0B0F19] text-2xl text-white">

      <header className="relative flex h-20 items-center border-b border-white/10 bg-[#18181B] px-4 md:px-6">

        {/* left hamburger [mobile] */}
        <div className="flex items-center md:hidden">
          <button
            onClick={() => setIsSidebarOpen((v) => !v)}
            aria-label="Toggle menu"
            className="flex items-center justify-center"
          >
            {isSidebarOpen ? (
              <X className="h-7 w-7" />
            ) : (
              <Menu className="h-7 w-7" />
            )}
          </button>
        </div>

        {/* logo */}
        <div className="absolute left-1/2 -translate-x-1/2 md:static md:translate-x-0 md:left-auto">
          {tenant?.logoUrl ? (
            <img
              src={tenant.logoUrl}
              alt={tenant.name || "Workspace"}
              className="h-9 w-9 rounded-full object-cover md:h-12 md:w-12"
            />
          ) : (
            <img src="/ManageInSync-Logo.png" alt="ManageInSync" className="h-20 md:h-26" />
          )}
        </div>

        {/* logout btn */}
        <div className="ml-auto">
          <button
            onClick={handleLogout}
            disabled={isLoggingOut}
            className="inline-flex items-center gap-2 md:gap-4 rounded-lg border border-white/10 bg-gradient-to-br from-[#18181B] to-blue-500 px-3 md:px-4 py-2 text-lg md:text-2xl"
          >
            <span className="hidden sm:inline">
              {isLoggingOut ? "Logging out..." : "Logout"}
            </span>
            <LogOut className="h-5 w-5 md:h-6 md:w-6" />
          </button>
        </div>
      </header>

      <div className="relative flex flex-1 overflow-hidden">

        {/* mobile overlay */}
        {isSidebarOpen && (

          <div
            className="fixed inset-0 z-20 bg-black/50 md:hidden"
            onClick={() => setIsSidebarOpen(false)}
          />

        )}

        {/* side bar */}
        <aside
          className={`
            fixed inset-y-0 left-0 z-30 w-60 border-r border-white/10 bg-[#18181B] p-4
            transform transition-transform duration-200
            md:static md:translate-x-0 md:z-auto
            ${isSidebarOpen ? "translate-x-0" : "-translate-x-full"}
          `}
          style={{ top: "5rem" }} // offset below header on mobile
        >
          <nav className="flex flex-col gap-4">
            {navItems.map((item) => {
              const canShow = user && item.roles.includes(user.role);

              if (!canShow) {
                return null;
              }

              let isActive = false;

              if (item.to === "/") {
                isActive = location.pathname === "/";
              } else {
                isActive = location.pathname.startsWith(item.to);
              }

              const Icon = item.icon;

              return (
                <Link
                  key={item.name}
                  to={item.to}
                  onClick={handleNavClick}
                  className={`flex items-center gap-3 rounded-md px-3 py-2 text-2xl transition-colors ${
                    isActive ? "bg-white/10" : "hover:bg-white/10"
                  }`}
                >
                  <Icon className="h-6 w-6" />
                  {item.name}
                </Link>
              );
            })}
          </nav>
        </aside>

        <main className="flex-1 overflow-auto bg-[#09090B] p-6">
          <div className="mx-auto max-w-8xl">
            <div className="min-h-[70vh] p-6">{children}</div>
          </div>
        </main>
      </div>
    </div>
  )
  
}
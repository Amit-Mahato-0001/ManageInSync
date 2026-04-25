import { useState } from "react"
import { useAuth } from "@/features/auth/hooks/useAuth"
import { useNavigate, useLocation, Link } from "react-router-dom"
import {
  LayoutDashboard,
  FolderKanban,
  Users,
  User,
  CreditCard,
  FileText,
  Shield,
  LogOut
} from "lucide-react"

export default function AppLayout({ children }) {
  const { user, tenant, logout } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const [isLoggingOut, setIsLoggingOut] = useState(false)

  const navItems = [
    {
      name: "Dashboard",
      to: "/",
      icon: LayoutDashboard,
      roles: ["owner", "admin", "member", "client"]
    },
    {
      name: "Projects",
      to: "/projects",
      icon: FolderKanban,
      roles: ["owner", "admin", "member", "client"]
    },
    {
      name: "Billing",
      to: "/billing",
      icon: CreditCard,
      roles: ["owner", "client"]
    },
    {
      name: "Clients",
      to: "/clients",
      icon: User,
      roles: ["owner", "admin"]
    },
    {
      name: "Members",
      to: "/members",
      icon: Users,
      roles: ["owner", "admin"]
    },
    {
      name: "Activity Feed",
      to: "/activity-feed",
      icon: FileText,
      roles: ["owner", "admin", "member"]
    },
    {
      name: "Security",
      to: "/security",
      icon: Shield,
      roles: ["owner", "admin", "member", "client"]
    }
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

  return (
    <div className="app-shell flex h-screen flex-col bg-[#0B0F19] text-2xl text-white">
      <header className="flex h-20 items-center justify-between border-b border-white/10 bg-[#18181B] px-6">
        <div className="flex items-center gap-3">
          <img src="/Union.png" alt="ManageInSync" className="h-12" />
        </div>

        <button
          onClick={handleLogout}
          disabled={isLoggingOut}
          className="inline-flex items-center gap-4 rounded-lg border border-white/10 bg-gradient-to-br from-[#18181B] to-blue-500 px-4 py-2 text-2xl"
        >
          {isLoggingOut ? "Logging out..." : "Logout"}
          <LogOut className="h-6 w-6" />
        </button>
      </header>

      <div className="flex flex-1 overflow-hidden">
        <aside className="w-60 border-r border-white/10 bg-[#18181B] p-4">
          <nav className="flex flex-col gap-4">
            {navItems.map((item) => {
              const canShow = user && item.roles.includes(user.role)

              if (!canShow) {
                return null
              }

              let isActive = false

              if (item.to === "/") {
                isActive = location.pathname === "/"
              } else {
                isActive = location.pathname.startsWith(item.to)
              }

              const Icon = item.icon

              return (
                <Link
                  key={item.name}
                  to={item.to}
                  className={`flex items-center gap-3 rounded-md px-3 py-2 text-2xl transition-colors ${
                    isActive ? "bg-white/10" : "hover:bg-white/10"
                  }`}
                >
                  <Icon className="h-6 w-6" />
                  {item.name}
                </Link>
              )
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

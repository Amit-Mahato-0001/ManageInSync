import { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "@/features/auth/hooks/useAuth";

// --------------------------------------------------------------
// SOLID ICONS (unchanged – they work perfectly)
// --------------------------------------------------------------

const SolidDashboardIcon = ({ className = "h-5 w-5", ...props }) => (
  <svg className={className} viewBox="0 0 24 24" fill="currentColor" {...props}>
    <path d="M4 13h6a1 1 0 0 0 1-1V4a1 1 0 0 0-1-1H4a1 1 0 0 0-1 1v8a1 1 0 0 0 1 1zm0 8h6a1 1 0 0 0 1-1v-4a1 1 0 0 0-1-1H4a1 1 0 0 0-1 1v4a1 1 0 0 0 1 1zm10 0h6a1 1 0 0 0 1-1v-8a1 1 0 0 0-1-1h-6a1 1 0 0 0-1 1v8a1 1 0 0 0 1 1zm0-18v4a1 1 0 0 0 1 1h6a1 1 0 0 0 1-1V4a1 1 0 0 0-1-1h-6a1 1 0 0 0-1 1z" />
  </svg>
);

const SolidFolderIcon = ({ className = "h-5 w-5", ...props }) => (
  <svg className={className} viewBox="0 0 24 24" fill="currentColor" {...props}>
    <path d="M4 20h16a2 2 0 0 0 2-2V8a2 2 0 0 0-2-2h-7l-2-2H4a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2z" />
  </svg>
);

const SolidCreditCardIcon = ({ className = "h-5 w-5", ...props }) => (
  <svg className={className} viewBox="0 0 24 24" fill="currentColor" {...props}>
    <path d="M20 4H4a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V6a2 2 0 0 0-2-2zm0 8H4V8h16v4z" />
  </svg>
);

const SolidUserIcon = ({ className = "h-5 w-5", ...props }) => (
  <svg className={className} viewBox="0 0 24 24" fill="currentColor" {...props}>
    <path fillRule="evenodd" d="M7.5 6a4.5 4.5 0 1 1 9 0 4.5 4.5 0 0 1-9 0zM3.751 20.105a8.25 8.25 0 0 1 16.498 0 .75.75 0 0 1-.437.695A18.683 18.683 0 0 1 12 22.5c-2.786 0-5.433-.608-7.812-1.7a.75.75 0 0 1-.437-.695z" clipRule="evenodd" />
  </svg>
);

const SolidUsersIcon = ({ className = "h-5 w-5", ...props }) => (
  <svg className={className} viewBox="0 0 24 24" fill="currentColor" {...props}>
    <path d="M4.5 6.375a4.125 4.125 0 1 1 8.25 0 4.125 4.125 0 0 1-8.25 0zM14.25 8.625a3.375 3.375 0 1 1 6.75 0 3.375 3.375 0 0 1-6.75 0zM1.5 19.125a7.125 7.125 0 0 1 14.25 0v.003l-.001.119a.75.75 0 0 1-.363.63 13.067 13.067 0 0 1-6.761 1.873c-2.472 0-4.786-.684-6.76-1.873a.75.75 0 0 1-.364-.63l-.001-.122zM17.25 19.128l-.001.144a2.25 2.25 0 0 1-.233.96 10.088 10.088 0 0 0 5.06-1.01.75.75 0 0 0 .42-.643 4.875 4.875 0 0 0-6.957-4.611 8.586 8.586 0 0 1 1.71 5.157v.003z" />
  </svg>
);

const SolidFileTextIcon = ({ className = "h-5 w-5", ...props }) => (
  <svg className={className} viewBox="0 0 24 24" fill="currentColor" {...props}>
    <path d="M5.625 1.5c-1.036 0-1.875.84-1.875 1.875v17.25c0 1.035.84 1.875 1.875 1.875h12.75c1.035 0 1.875-.84 1.875-1.875V12.75A3.75 3.75 0 0 0 16.5 9h-1.875a1.875 1.875 0 0 1-1.875-1.875V5.25A3.75 3.75 0 0 0 9 1.5H5.625z" />
    <path d="M12.971 1.816A5.23 5.23 0 0 1 14.25 5.25v1.875c0 .207.168.375.375.375H16.5a5.23 5.23 0 0 1 3.434 1.279 9.768 9.768 0 0 0-6.963-6.963z" />
  </svg>
);

const SolidSettingsIcon = ({ className = "h-5 w-5", ...props }) => (
  <svg className={className} viewBox="0 0 24 24" fill="currentColor" {...props}>
    <path d="M18.75 12.75h1.5a.75.75 0 0 0 0-1.5h-1.5a.75.75 0 0 0 0 1.5zM12 6a.75.75 0 0 1 .75-.75h7.5a.75.75 0 0 1 0 1.5h-7.5A.75.75 0 0 1 12 6zm-8.25 6a.75.75 0 0 1 .75-.75h13.5a.75.75 0 0 1 0 1.5H4.5a.75.75 0 0 1-.75-.75zM12 18a.75.75 0 0 1 .75-.75h7.5a.75.75 0 0 1 0 1.5h-7.5A.75.75 0 0 1 12 18zM3.75 6.75h1.5a.75.75 0 0 0 0-1.5h-1.5a.75.75 0 0 0 0 1.5zm0 12h1.5a.75.75 0 0 0 0-1.5h-1.5a.75.75 0 0 0 0 1.5z" />
  </svg>
);

const SolidLogoutIcon = ({ className = "h-5 w-5", ...props }) => (
  <svg className={className} viewBox="0 0 24 24" fill="currentColor" {...props}>
    <path d="M9 3.75H6.75a2.25 2.25 0 0 0-2.25 2.25v12a2.25 2.25 0 0 0 2.25 2.25H9a.75.75 0 0 0 0-1.5H6.75a.75.75 0 0 1-.75-.75V6a.75.75 0 0 1 .75-.75H9a.75.75 0 0 0 0-1.5z" />
    <path d="M15.78 8.22a.75.75 0 1 0-1.06 1.06L17.44 12l-2.72 2.72a.75.75 0 1 0 1.06 1.06l3.25-3.25a.75.75 0 0 0 0-1.06l-3.25-3.25z" />
    <path d="M9 12a.75.75 0 0 1 .75-.75h9.75a.75.75 0 0 1 0 1.5H9.75A.75.75 0 0 1 9 12z" />
  </svg>
);

// --------------------------------------------------------------
// MAIN APP LAYOUT (fixed logo size, added debug)
// --------------------------------------------------------------
export default function AppLayout({ children }) {
  const { user, tenant, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  const navItems = [
    { name: "Dashboard", to: "/", icon: SolidDashboardIcon, roles: ["owner", "admin", "member", "client"], color: "bg-amber-600" },
    { name: "Projects", to: "/projects", icon: SolidFolderIcon, roles: ["owner", "admin", "member", "client"], color: "bg-purple-600" },
    { name: "Billing", to: "/billing", icon: SolidCreditCardIcon, roles: ["owner", "client"], color: "bg-emerald-600" },
    { name: "Clients", to: "/clients", icon: SolidUserIcon, roles: ["owner", "admin"], color: "bg-blue-600" },
    { name: "Members", to: "/members", icon: SolidUsersIcon, roles: ["owner", "admin"], color: "bg-rose-600" },
    { name: "Activity Feed", to: "/activity-feed", icon: SolidFileTextIcon, roles: ["owner", "admin", "member"], color: "bg-indigo-600" },
    { name: "Account", to: "/account", icon: SolidSettingsIcon, roles: ["owner", "admin", "member", "client"], color: "bg-cyan-600" },
  ];

  const handleLogout = async () => {
    const workspace = tenant?.slug || tenant?.name || "";
    try {
      setIsLoggingOut(true);
      await logout();
      navigate(workspace ? `/login?workspace=${encodeURIComponent(workspace)}` : "/login");
    } finally {
      setIsLoggingOut(false);
    }
  };

  const handleNavClick = () => setIsSidebarOpen(false);
  const workspaceName = tenant?.name || tenant?.slug || "ManageInSync";

  // Mobile menu icons
  const MenuIcon = ({ className }) => (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor">
      <path fillRule="evenodd" d="M3 6.75A.75.75 0 0 1 3.75 6h16.5a.75.75 0 0 1 0 1.5H3.75A.75.75 0 0 1 3 6.75zM3 12a.75.75 0 0 1 .75-.75h16.5a.75.75 0 0 1 0 1.5H3.75A.75.75 0 0 1 3 12zm0 5.25a.75.75 0 0 1 .75-.75h16.5a.75.75 0 0 1 0 1.5H3.75a.75.75 0 0 1-.75-.75z" clipRule="evenodd" />
    </svg>
  );
  const XIcon = ({ className }) => (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor">
      <path fillRule="evenodd" d="M5.47 5.47a.75.75 0 0 1 1.06 0L12 10.94l5.47-5.47a.75.75 0 1 1 1.06 1.06L13.06 12l5.47 5.47a.75.75 0 1 1-1.06 1.06L12 13.06l-5.47 5.47a.75.75 0 0 1-1.06-1.06L10.94 12 5.47 6.53a.75.75 0 0 1 0-1.06z" clipRule="evenodd" />
    </svg>
  );

  // DEBUG: Log current path and user role (remove after fixing)
  console.log("Current location:", location.pathname);
  console.log("User role:", user?.role);

  return (
    <div className="app-shell flex h-screen flex-col overflow-hidden bg-black text-white">
      <header className="relative z-40 flex h-16 items-center border-b border-white/10 bg-black px-4 md:px-6">
        <div className="flex items-center md:hidden">
          <button
            onClick={() => setIsSidebarOpen((open) => !open)}
            aria-label="Toggle menu"
            className="flex h-10 w-10 items-center justify-center rounded-[8px] bg-[#2b2b2b] text-white transition hover:bg-[#383838]"
          >
            {isSidebarOpen ? <XIcon className="h-5 w-5" /> : <MenuIcon className="h-5 w-5" />}
          </button>
        </div>

        <div className="absolute left-1/2 flex -translate-x-1/2 items-center gap-3 md:static md:left-auto md:translate-x-0">
          {/* Correct logo size: h-9 w-9 (not h-45 w-45) */}
          <img
            src="/ManageInSync-Logo.png"
            alt="ManageInSync"
            className="h-20 w-auto object-contain"
          />
        </div>

        <div className="ml-auto">
          <button
            onClick={handleLogout}
            disabled={isLoggingOut}
            className="inline-flex h-10 items-center justify-center gap-2 rounded-[8px] bg-blue-600 px-3 text-[14px] font-bold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60 md:px-4"
          >
            <span className="hidden sm:inline">{isLoggingOut ? "Logging out..." : "Logout"}</span>
            <SolidLogoutIcon className="h-5 w-5" aria-hidden="true" />
          </button>
        </div>
      </header>

      <div className="relative flex flex-1 overflow-hidden">
        {isSidebarOpen && <div className="fixed inset-0 z-20 bg-black/70 md:hidden" onClick={() => setIsSidebarOpen(false)} />}

        <aside
          className={`
            fixed inset-y-0 left-0 z-30 w-64 border-r border-white/10 bg-black p-3
            transform transition-transform duration-200
            md:static md:translate-x-0 md:z-auto
            ${isSidebarOpen ? "translate-x-0" : "-translate-x-full"}
          `}
          style={{ top: "4rem" }}
        >
          <nav className="flex flex-col gap-1">
            {navItems.map((item) => {
              const canShow = user && item.roles.includes(user.role);
              // DEBUG: Log which items are shown
              console.log(`${item.name} visible:`, canShow);
              if (!canShow) return null;
              const isActive = item.to === "/" ? location.pathname === "/" : location.pathname.startsWith(item.to);
              const Icon = item.icon;
              return (
                <Link
                  key={item.name}
                  to={item.to}
                  onClick={handleNavClick}
                  className={`flex h-11 items-center gap-3 rounded-[8px] px-3 text-[14px] font-semibold transition-colors ${
                    isActive
                      ? "bg-[#2b2b2b] text-white"
                      : "text-[#8b8b8b] hover:bg-[#202020] hover:text-white"
                  }`}
                >
                  <span className={`flex h-6 w-6 items-center justify-center rounded-md ${item.color} text-white`}>
                    <Icon className="h-4 w-4" aria-hidden="true" />
                  </span>
                  {item.name}
                </Link>
              );
            })}
          </nav>
        </aside>

        <main className="flex-1 overflow-auto bg-[#090909] p-4 md:p-6">
          <div className="mx-auto w-full max-w-[1280px]">
            <div className="min-h-[70vh]">{children}</div>
          </div>
        </main>
      </div>
    </div>
  );
}
import { useAuth } from "../context/AuthContext";
import { useNavigate, useLocation, Link } from "react-router-dom";

export default function AppLayout({ children }) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  const navItems = [
    { name: "Dashboard", to: "/", roles: ["owner", "admin", "member", "client"] },
    { name: "Projects", to: "/projects", roles: ["owner", "admin", "member", "client"] },
    { name: "Tasks", to: "/tasks", roles: ["owner", "admin", "member"] },
    { name: "Clients", to: "/clients", roles: ["owner", "admin"] },
    { name: "Members", to: "/members", roles: ["owner", "admin"] },
    { name: "Audit Logs", to: "/audit-logs", roles: ["owner", "admin"] },
  ];

  return (

    <div className="relative min-h-screen flex flex-col overflow-hidden">

      {/* bg */}
      <div className="absolute inset-0 -z-10">

        <div className="w-full h-full bg-[url('/a.jpeg')] bg-cover bg-center" />
        <div className="absolute inset-0 bg-black/30" />

      </div>

      {/* header*/}
      <header className="w-full">

        <div className="max-w-6xl mx-auto px-6 py-6 flex justify-between items-center text-white">

          <img src="/Union.png" className="max-h-20 max-w-40" />

          <button
            onClick={handleLogout}
            className="bg-white/20 border border-white/10 text-white px-4 py-2 text-sm rounded-full"
          >
            Logout
          </button>

        </div>

      </header>

      {/* main */}
      <main className="flex-1 flex items-center justify-center">
        
        <div className="w-full max-w-6xl flex flex-col gap-6">

          {/* tabs */}

          <div className="flex gap-3 flex-wrap justify-center">
            {navItems
              .filter(item => item.roles.includes(user?.role))
              .map((item) => {
                const isActive =
                  item.to === "/"
                    ? location.pathname === "/"
                    : location.pathname.startsWith(item.to);

                return (

                  <Link
                    key={item.name}
                    to={item.to}
                    className={`
                      px-4 py-2 text-sm font-medium rounded-full transition
                      ${
                        isActive
                          ? "bg-white/20 text-white border border-white/10"
                          : "text-white hover:bg-white/20 border border-transparent hover:border-white/10"
                      }
                    `}
                  >
                    {item.name}
                  </Link>

                )

              })}
          </div>

          {/* content card */}
          
          <div className="relative">

            <div className="absolute -inset-[7px] rounded-[34px] bg-white/20 border border-white/10" />

            <div className="relative rounded-[28px] bg-white p-12 min-h-[40vh] max-h-[40vh] overflow-auto no-scrollbar">
              {children}
            </div>

          </div>

        </div>

      </main>

      {/* footer section */}
      <footer className="w-full ">

        <div className="max-w-6xl mx-auto px-6 py-10 text-white">

          <div className="mb-6">
            <img src="/Union.png" className="max-h-20 max-w-40" />
          </div>

          <div className="border-t border-white/20 mb-6" />

          <div className="flex flex-wrap gap-6 text-sm text-white/70">

            <span>© 2026 AgencyOS Inc</span>
            <a href="#" className="hover:text-white">Privacy</a>
            <a href="#" className="hover:text-white">Articles</a>
            <a href="#" className="hover:text-white">Services</a>
            <a href="#" className="hover:text-white">Our Team</a>
            <a href="#" className="hover:text-white">Contact Us</a>
            
          </div>

        </div>

      </footer>

    </div>
  );
}
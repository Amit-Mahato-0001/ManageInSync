import { useAuth } from "../context/AuthContext";
import { useNavigate } from "react-router-dom";

export default function AppLayout({ children }) {
  const { logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  return (
    <div className="min-h-screen">
      <header className="shadow p-4 flex justify-between">
        <span className="font-bold text-xl">AgencyOS</span>
        <button
          onClick={handleLogout}
          className="font-bold text-xl text-red-500"
        >
          Logout
        </button>
      </header>

      <main className="p-4">{children}</main>

      <nav className="flex gap-4 text-sm">
        <a href="/" className="hover:underline">Dashboard</a>
        <a href="/projects" className="hover:underline">Projects</a>
        <a href="/clients" className="hover:underline">Clients</a>
        <a href="/audit-logs" className="hover:underline">Audit Logs</a>
      </nav>
    </div>
  );
}

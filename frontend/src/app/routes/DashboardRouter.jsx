import { useAuth } from "@/features/auth/hooks/useAuth"
import Dashboard from "@/features/dashboard/pages/Dashboard"
import ClientDashboard from "@/features/dashboard/pages/ClientDashboard"
import MemberDashboard from "@/features/dashboard/pages/MemberDashboard"

const DashboardRouter = () => {
  const { status, user } = useAuth()

  if (status === "loading") {
    return <p>Loading dashboard...</p>
  }

  if (!user) {
    return null
  }

  if (user.role === "client") {
    return <ClientDashboard />
  }

  if (user.role === "member") {
    return <MemberDashboard />
  }

  return <Dashboard />
}

export default DashboardRouter

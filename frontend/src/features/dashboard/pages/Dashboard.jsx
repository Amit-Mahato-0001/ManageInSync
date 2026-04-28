import React, { useEffect, useState } from "react"
import fetchDashboard from "../api/dashboard"
import { DASHBOARD_REFRESH_EVENT } from "@/shared/utils/dashboardRefresh"
import {
  Folder,
  CheckCircle,
  ListChecks,
  CheckCheck,
  Users,
  User
} from "lucide-react"

const DASHBOARD_REFRESH_INTERVAL_MS = 10000

const getTimeBasedGreeting = () => {
  const hour = new Date().getHours()

  if (hour >= 5 && hour < 12) {
    return "Good Morning"
  }

  if (hour >= 12 && hour < 17) {
    return "Good Afternoon"
  }

  if (hour >= 17 && hour < 21) {
    return "Good Evening"
  }

  return "Good Night"
}

const capitalizeFirstCharacter = (value) => {
  if (!value) {
    return ""
  }

  return value.charAt(0).toUpperCase() + value.slice(1)
}

function Stat({ label, value, icon, color, sub }) {
  const Icon = icon

  return (
    <div className="relative rounded-lg border border-white/10 bg-gradient-to-br from-[#18181B] to-[#09090B] p-5">
      <p className="text-2xl text-white/60">{label}</p>

      <p className="mt-2 text-5xl font-bold">{value || 0}</p>

      <p className="mt-1 text-2xl text-white/40">{sub}</p>

      <div className={`absolute top-4 right-4 rounded-lg p-2 ${color}`}>
        <Icon className="h-6 w-6" />
      </div>
    </div>
  )
}

const Dashboard = () => {
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")

  async function loadDashboard(showLoader = false) {
    try {
      if (showLoader) {
        setLoading(true)
      }

      const response = await fetchDashboard()
      setData(response.data)
      setError("")
    } catch (error) {
      console.error(error)
      setError("Failed to load dashboard")
    } finally {
      if (showLoader) {
        setLoading(false)
      }
    }
  }

  useEffect(() => {
    loadDashboard(true)
  }, [])

  useEffect(() => {
    function refreshDashboard() {
      loadDashboard()
    }

    const interval = setInterval(refreshDashboard, DASHBOARD_REFRESH_INTERVAL_MS)

    window.addEventListener(DASHBOARD_REFRESH_EVENT, refreshDashboard)
    window.addEventListener("focus", refreshDashboard)

    return () => {
      clearInterval(interval)
      window.removeEventListener(DASHBOARD_REFRESH_EVENT, refreshDashboard)
      window.removeEventListener("focus", refreshDashboard)
    }
  }, [])

  if (loading) {
    return <p>Loading dashboard...</p>
  }

  if (error) {
    return <p className="text-red-500">{error}</p>
  }

  if (!data || !data.dashboardStats) {
    return <p>No dashboard data available</p>
  }

  let tenantName = ""

  if (data.tenantName) {
    tenantName = capitalizeFirstCharacter(data.tenantName.trim())
  }

  const greeting = getTimeBasedGreeting()

  return (
    <div>
      <h1 className="text-5xl font-semibold">
        {greeting}{tenantName ? `, ${tenantName}` : ""}
      </h1>

      <p className="mt-1 text-2xl text-white/60">
        While we move through today’s work, keep in mind that supporting your progress is always our top priority.
      </p>

      <div className="mt-6 grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
        <Stat
          label="Total Projects"
          value={data.dashboardStats.totalProjects}
          icon={Folder}
          color="border border-white/10 bg-gradient-to-br from-[#18181B] to-orange-500"
          sub="projects in workspace"
        />

        <Stat
          label="Completed Projects"
          value={data.dashboardStats.completedProjects}
          icon={CheckCircle}
          color="border border-white/10 bg-gradient-to-br from-[#18181B] to-green-500"
          sub="finished projects"
        />

        <Stat
          label="Total Tasks"
          value={data.dashboardStats.totalTasks}
          icon={ListChecks}
          color="border border-white/10 bg-gradient-to-br from-[#18181B] to-cyan-500"
          sub="tasks across projects"
        />

        <Stat
          label="Completed Tasks"
          value={data.dashboardStats.completedTasks}
          icon={CheckCheck}
          color="border border-white/10 bg-gradient-to-br from-[#18181B] to-emerald-500"
          sub="tasks marked done"
        />

        <Stat
          label="Team Members"
          value={data.dashboardStats.totalMembers}
          icon={Users}
          color="border border-white/10 bg-gradient-to-br from-[#18181B] to-purple-500"
          sub="in your team"
        />

        <Stat
          label="Clients"
          value={data.dashboardStats.totalClients}
          icon={User}
          color="border border-white/10 bg-gradient-to-br from-[#18181B] to-yellow-500"
          sub="total clients"
        />
      </div>
    </div>
  )
}

export default Dashboard
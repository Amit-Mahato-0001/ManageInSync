import React, { useCallback, useEffect, useState } from "react"
import fetchDashboard from "../api/dashboard"
import { DASHBOARD_REFRESH_EVENT } from "../utils/dashboardRefresh"
import {
  Folder,
  CheckCircle,
  Users,
  User
} from "lucide-react"

const DASHBOARD_REFRESH_INTERVAL_MS = 10000

const Dashboard = () => {

  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")

  const loadDashboard = useCallback(async ({ showLoader = false } = {}) => {

    if (showLoader) setLoading(true)

    try {
      const res = await fetchDashboard()
      setData(res.data)
      setError("")
    } catch (err) {
      console.error(err)
      setError("Failed to load dashboard")
    } finally {
      if (showLoader) setLoading(false)
    }

  }, [])

  useEffect(() => {
    loadDashboard({ showLoader: true })
  }, [loadDashboard])

  useEffect(() => {

    const refresh = () => loadDashboard()

    const interval = setInterval(refresh, DASHBOARD_REFRESH_INTERVAL_MS)

    window.addEventListener(DASHBOARD_REFRESH_EVENT, refresh)
    window.addEventListener("focus", refresh)

    return () => {
      clearInterval(interval)
      window.removeEventListener(DASHBOARD_REFRESH_EVENT, refresh)
      window.removeEventListener("focus", refresh)
    }

  }, [loadDashboard])

  if (loading) return <p>Loading dashboard...</p>
  if (error) return <p className="text-red-500">{error}</p>
  if (!data?.dashboardStats) return <p>No dashboard data available</p>

  return (
    <div>

      {/* HEADER */}
      <h1 className="text-2xl font-semibold">
        Welcome back, Unity
      </h1>

      <p className="text-sm text-white/60 mt-1">
        Here's what's happening with your projects today
      </p>

      {/* STATS */}
      <div className="grid grid-cols-4 gap-4 mt-6">

        <Stat
          label="Total Projects"
          value={data.dashboardStats.totalProjects}
          icon={Folder}
          color="text-blue-400 bg-blue-500/10"
          sub="projects in workspace"
        />

        <Stat
          label="Active Projects"
          value={data.dashboardStats.activeProjects}
          icon={CheckCircle}
          color="text-green-400 bg-green-500/10"
          sub="currently active"
        />

        <Stat
          label="Team Members"
          value={data.dashboardStats.totalUsers}
          icon={Users}
          color="text-purple-400 bg-purple-500/10"
          sub="in your team"
        />

        <Stat
          label="Clients"
          value={data.dashboardStats.totalClients}
          icon={User}
          color="text-yellow-400 bg-yellow-500/10"
          sub="total clients"
        />

      </div>

    </div>
  )
}


/* ✅ SIMPLE STAT COMPONENT */

function Stat({ label, value, icon: Icon, color, sub }) {

  return (
    <div className="relative rounded-xl p-5 border border-white/10 bg-gradient-to-br from-[#18181B] to-[#09090B]">

      <p className="text-sm text-white/60">{label}</p>

      <p className="text-3xl font-semibold mt-2">
        {value ?? 0}
      </p>

      <p className="text-xs text-white/40 mt-1">
        {sub}
      </p>

      <div className={`absolute top-4 right-4 p-2 rounded-lg ${color}`}>
        <Icon className="w-5 h-5" />
      </div>

    </div>
  )
}

export default Dashboard
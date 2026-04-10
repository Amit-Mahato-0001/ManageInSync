import React, { useCallback, useEffect, useState } from "react"
import fetchDashboard from "../api/dashboard"
import { DASHBOARD_REFRESH_EVENT } from "../utils/dashboardRefresh"
import {
  Folder,
  CheckCircle,
  ListChecks,
  CheckCheck,
  Users,
  User
} from "lucide-react"

const DASHBOARD_REFRESH_INTERVAL_MS = 10000

const Dashboard = () => {

  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const tenantName = data?.tenantName?.trim()

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

      {/* header */}
      <h1 className="text-5xl font-semibold">
        Welcome back{tenantName ? `, ${tenantName}` : ""}
      </h1>

      <p className="text-2xl text-white/60 mt-1">
        Here's what's happening with your projects today
      </p>

      {/* stats */}
      <div className="grid grid-cols-1 gap-4 mt-6 md:grid-cols-2 xl:grid-cols-3">

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

/* stats components */

function Stat({ label, value, icon: Icon, color, sub }) {

  return (

    <div className="relative rounded-lg p-5 border border-white/10 bg-gradient-to-br from-[#18181B] to-[#09090B]">

      <p className="text-2xl text-white/60">{label}</p>

      <p className="text-5xl font-bold mt-2">

        {value ?? 0}

      </p>

      <p className="text-2xl text-white/40 mt-1">

        {sub}

      </p>

      <div className={`absolute top-4 right-4 p-2 rounded-lg ${color}`}>

        <Icon className="w-6 h-6" />

      </div>

    </div>

  )

}

export default Dashboard

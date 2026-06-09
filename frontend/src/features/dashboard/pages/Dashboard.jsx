import React, { useEffect, useState } from "react"
import fetchDashboard from "../api/dashboard"
import { PageLoader } from "@/shared/components/LoadingSpinner"
import { DASHBOARD_REFRESH_EVENT } from "@/shared/utils/dashboardRefresh"


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


function Stat({ label, value, sub }) {
  return (
    <div className="relative min-h-[132px] rounded-[8px] border border-white/10 bg-[#151515] p-4 transition hover:border-white/20">
      <p className="text-[13px] font-semibold text-[#8b8b8b]">{label}</p>

      <p className="mt-4 text-[32px] font-extrabold leading-none text-white">
        {value || 0}
      </p>

      <p className="mt-2 text-[13px] font-medium text-[#5b5b5b]">{sub}</p>
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
    return <PageLoader />
  }

  if (error) {
    return (
      <p className="rounded-[8px] border border-red-500/25 bg-red-500/10 px-3 py-2 text-[13px] leading-5 text-red-200">
        {error}
      </p>
    )
  }

  if (!data || !data.dashboardStats) {
    return (
      <p className="rounded-[8px] border border-white/10 bg-[#151515] px-3 py-2 text-[13px] font-medium text-[#8b8b8b]">
        No dashboard data available
      </p>
    )
  }

  let tenantName = ""

  if (data.tenantName) {
    tenantName = capitalizeFirstCharacter(data.tenantName.trim())
  }

  const greeting = getTimeBasedGreeting()

  return (
    <div className="w-full">
      <section className="border-b border-white/10 pb-6">
        <h1 className="mt-2 text-[24px] font-extrabold leading-none text-white md:text-[28px]">
          {greeting}{tenantName ? `, ${tenantName}` : ""}
        </h1>

        <p className="mt-2 max-w-[620px] text-[14px] font-medium leading-6 text-[#787878]">
          While we move through today's work, keep in mind that supporting your progress is always our top priority.
        </p>
      </section>

      <div className="mt-6 grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-3">
        <Stat
          label="Total Projects"
          value={data.dashboardStats.totalProjects}
          sub="projects in workspace"
        />

        <Stat
          label="Completed Projects"
          value={data.dashboardStats.completedProjects}
          sub="finished projects"
        />

        <Stat
          label="Total Tasks"
          value={data.dashboardStats.totalTasks}
          sub="tasks across projects"
        />

        <Stat
          label="Completed Tasks"
          value={data.dashboardStats.completedTasks}
          sub="tasks marked done"
        />

        <Stat
          label="Team Members"
          value={data.dashboardStats.totalMembers}
          sub="in your team"
        />

        <Stat
          label="Clients"
          value={data.dashboardStats.totalClients}
          sub="total clients"
        />
      </div>
    </div>
  )
}

export default Dashboard
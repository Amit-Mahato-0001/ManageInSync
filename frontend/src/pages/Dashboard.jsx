import React, { useCallback, useEffect, useState } from "react"
import fetchDashboard from "../api/dashboard"
import { DASHBOARD_REFRESH_EVENT } from "../utils/dashboardRefresh"

const DASHBOARD_REFRESH_INTERVAL_MS = 10000

const Dashboard = () => {

  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")

  const loadDashboard = useCallback(async ({ showLoader = false } = {}) => {

    if (showLoader) {
      setLoading(true)
    }

    try {

      const res = await fetchDashboard()
      setData(res.data)
      setError("")

    } catch (err) {

      console.error("dashboard fetch failed", err)
      setError("Failed to load dashboard")

    } finally {

      if (showLoader) {
        setLoading(false)
      }

    }

  }, [])


  // dash load on component mount 
  useEffect(() => {

    loadDashboard({ showLoader: true })

  }, [loadDashboard])



  // dash refresh 
  useEffect(() => {

    const refreshDashboard = () => {
      loadDashboard()
    }

    const refreshOnVisible = () => {

      if (document.visibilityState === "visible") {
        loadDashboard()
      }

    }

    // auto refresh evry 10 sec
    const intervalId = window.setInterval(
      refreshDashboard,
      DASHBOARD_REFRESH_INTERVAL_MS
    )

    // event listeners
    window.addEventListener(DASHBOARD_REFRESH_EVENT, refreshDashboard)
    window.addEventListener("focus", refreshDashboard)
    document.addEventListener("visibilitychange", refreshOnVisible)

    // cleanup
    return () => {

      window.removeEventListener(DASHBOARD_REFRESH_EVENT, refreshDashboard)
      window.removeEventListener("focus", refreshDashboard)
      document.removeEventListener("visibilitychange", refreshOnVisible)
      window.clearInterval(intervalId)

    }

  }, [loadDashboard])


  if (loading) {
    return <p>Loading dashboard...</p>
  }

  if (error) {
    return <p className="text-red-500">{error}</p>
  }

  if (!data?.dashboardStats) {
    return <p>No dashboard data available</p>
  }

  return (
    <div>

      <h1 className="text-xl font-bold mb-4">Dashboard</h1>

      <div className="grid grid-cols-2 gap-4">

        <Stat label="Total Projects" value={data.dashboardStats.totalProjects} />
        <Stat label="Active Projects" value={data.dashboardStats.activeProjects} />
        <Stat label="Team Members" value={data.dashboardStats.totalUsers} />
        <Stat label="Clients" value={data.dashboardStats.totalClients} />

      </div>

    </div>
  )
}



function Stat({ label, value }) {

  return (
    <div className="p-4 rounded shadow">

      <p className="text-gray-500">{label}</p>
      <p className="text-2xl font-bold">{value}</p>

    </div>
  )

}

export default Dashboard
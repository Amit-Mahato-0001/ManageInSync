export const DASHBOARD_REFRESH_EVENT = "dashboard:refresh"

export const triggerDashboardRefresh = () => {

  if (typeof window !== "undefined") {

    window.dispatchEvent(new Event(DASHBOARD_REFRESH_EVENT))
    
  }
}

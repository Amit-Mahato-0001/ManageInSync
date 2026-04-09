import { useEffect, useState } from "react"
import fetchActivityFeed from "../api/activity"
import ProjectsPagination from "../components/ProjectsPagination"

const formatActivityTime = (value) => {
  const date = new Date(value)

  if (Number.isNaN(date.getTime())) {
    return ""
  }

  return date.toLocaleDateString()
}

const ActivityFeed = () => {
  const [activities, setActivities] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const [page, setPage] = useState(1)
  const [pagination, setPagination] = useState({})

  useEffect(() => {
    loadActivityFeed()
  }, [page])

  const loadActivityFeed = async () => {
    try {
      setLoading(true)

      const res = await fetchActivityFeed({
        page,
        limit: 5
      })

      setActivities(res.data.activities.data)
      setPagination(res.data.activities.pagination)
      setError("")
    } catch (requestError) {
      console.error(requestError)
      setError("Failed to load activity feed")
    } finally {
      setLoading(false)
    }
  }

  const totalPages = pagination.totalPages || 1

  if (loading) return <p>Loading activity feed...</p>

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Activity Feed</h1>
        <p className="text-sm text-white/60">
          Recent updates across your workspace
        </p>
      </div>

      {error && <p className="text-sm text-red-500">{error}</p>}

      <div className="space-y-3">
        {activities.map((activity) => {
          return (
            <div
              key={activity._id}
              className="flex items-start justify-between gap-4 rounded-xl border border-white/10 bg-gradient-to-br from-[#18181B] to-[#09090B] p-5"
            >
              <p className="min-w-0 flex-1 text-sm font-medium text-white">
                {activity.summary}
              </p>

              <p className="shrink-0 text-xs text-white/45">
                {formatActivityTime(activity.createdAt)}
              </p>
            </div>
          )
        })}

        {activities.length === 0 && (
          <p className="text-sm text-white/40">
            No activity yet
          </p>
        )}
      </div>

      <ProjectsPagination
        page={page}
        totalPages={totalPages}
        onPageChange={setPage}
      />
    </div>
  )
}

export default ActivityFeed

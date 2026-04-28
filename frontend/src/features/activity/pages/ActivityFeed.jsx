import { useCallback, useEffect, useState } from "react"
import fetchActivityFeed from "../api/activity"
import InfiniteScrollSentinel from "@/shared/components/InfiniteScrollSentinel"

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
  const [loadingMore, setLoadingMore] = useState(false)
  const [error, setError] = useState("")
  const [pagination, setPagination] = useState({})

  const loadActivityFeed = useCallback(async ({
    pageToLoad = 1,
    append = false,
    showLoader = true
  } = {}) => {
    try {
      if (showLoader) {
        setLoading(true)
      }

      const res = await fetchActivityFeed({
        page: pageToLoad,
        limit: 10
      })
      const nextActivities = res.data.activities.data

      setActivities((prev) => (append ? [...prev, ...nextActivities] : nextActivities))
      setPagination(res.data.activities.pagination)
      setError("")
    } catch (requestError) {
      console.error(requestError)
      setError("Failed to load activity feed")
    } finally {
      if (showLoader) {
        setLoading(false)
      }
    }
  }, [])

  useEffect(() => {
    loadActivityFeed()
  }, [loadActivityFeed])

  const handleLoadMore = useCallback(async () => {
    const nextPage = (pagination.page || 1) + 1

    if (loadingMore || nextPage > (pagination.totalPages || 1)) {
      return
    }

    try {
      setLoadingMore(true)
      await loadActivityFeed({
        pageToLoad: nextPage,
        append: true,
        showLoader: false
      })
    } finally {
      setLoadingMore(false)
    }
  }, [loadActivityFeed, loadingMore, pagination.page, pagination.totalPages])

  if (loading) return <p>Loading activity feed...</p>

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-5xl font-semibold">Activity Feed</h1>
        <p className="text-2xl text-white/60">
          Recent updates across your workspace
        </p>
      </div>

      {error && <p className="text-2xl text-red-500">{error}</p>}

      <div className="space-y-3">
        {activities.map((activity) => {
          return (
            <div
              key={activity._id}
              className="flex items-start justify-between gap-4 rounded-xl border border-white/10 bg-gradient-to-br from-[#18181B] to-[#09090B] p-5"
            >
              <p className="min-w-0 flex-1 text-2xl font-medium text-white">
                {activity.summary}
              </p>

              <p className="shrink-0 text-2xl text-white/45">
                {formatActivityTime(activity.createdAt)}
              </p>
            </div>
          )
        })}

        {activities.length === 0 && (
          <p className="text-2xl text-white/40">
            No activity yet
          </p>
        )}
      </div>

      <InfiniteScrollSentinel
        hasMore={(pagination.page || 1) < (pagination.totalPages || 1)}
        loading={loadingMore}
        onLoadMore={handleLoadMore}
      />
    </div>
  )
}

export default ActivityFeed

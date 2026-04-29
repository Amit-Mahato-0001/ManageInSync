import { useEffect, useRef } from "react"
import LoadingSpinner from "@/shared/components/LoadingSpinner"

const InfiniteScrollSentinel = ({ hasMore, loading, onLoadMore }) => {
  const sentinelRef = useRef(null)

  useEffect(() => {
    const sentinel = sentinelRef.current

    if (!sentinel || !hasMore) {
      return undefined
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !loading) {
          onLoadMore()
        }
      },
      {
        rootMargin: "240px"
      }
    )

    observer.observe(sentinel)

    return () => {
      observer.disconnect()
    }
  }, [hasMore, loading, onLoadMore])

  if (!hasMore) {
    return null
  }

  return (
    <div ref={sentinelRef} className="flex h-16 items-center justify-center">
      {loading ? <LoadingSpinner size="sm" /> : null}
    </div>
  )
}

export default InfiniteScrollSentinel

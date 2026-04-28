import { useEffect, useRef } from "react"

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
    <div ref={sentinelRef} className="py-6 text-center text-2xl text-white/45">
      {loading ? "Loading more..." : "Scroll for more"}
    </div>
  )
}

export default InfiniteScrollSentinel

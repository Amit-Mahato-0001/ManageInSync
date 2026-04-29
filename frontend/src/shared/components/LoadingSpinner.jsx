const sizeClasses = {
  sm: "h-5 w-5 border-2",
  md: "h-8 w-8 border-2",
  lg: "h-12 w-12 border-4"
}

const LoadingSpinner = ({ size = "md", className = "" }) => {
  return (
    <span
      role="status"
      aria-label="Loading"
      className={`inline-block animate-spin rounded-full border-white/20 border-t-white ${sizeClasses[size] || sizeClasses.md} ${className}`}
    />
  )
}

export const PageLoader = ({ className = "" }) => {
  return (
    <div className={`flex min-h-[240px] items-center justify-center ${className}`}>
      <LoadingSpinner size="lg" />
    </div>
  )
}

export default LoadingSpinner

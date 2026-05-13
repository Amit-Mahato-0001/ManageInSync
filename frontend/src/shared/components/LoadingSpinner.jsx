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

const RotatingLoaderText = ({ messages }) => {

  return (

    <div className="relative h-8 min-w-[190px] overflow-hidden text-center" aria-live="polite">

      {messages.map((message, index) => (
        <p
          key={message}
          className="loader-rotating-text absolute inset-0 text-2xl text-white/70"
          style={{
            animationDelay: `${index * 1.8}s`
          }}
        >
          {message}
        </p>
      ))}

    </div>

  )
}

export const PageLoader = ({
  className = "",
  fullScreen = false,
  label = "Loading...",
  rotatingLabels = []
}) => {
  const shellClass = fullScreen
    ? "min-h-screen bg-[#09090B] text-white"
    : "min-h-[240px]"
  const hasRotatingLabels = rotatingLabels.length > 0

  return (

    <div className={`flex items-center justify-center ${shellClass} ${className}`}>

      <div className="flex flex-col items-center gap-4">
        <LoadingSpinner size="lg" />
        {hasRotatingLabels ? <RotatingLoaderText messages={rotatingLabels} /> : null}
        {!hasRotatingLabels && label ? <p className="text-2xl text-white/60">{label}</p> : null}
      </div>

    </div>

  )
}

export default LoadingSpinner

const BROWSER_PATTERNS = [
  { name: "Edge", pattern: /Edg(?:A|iOS)?\/([\d.]+)/i },
  { name: "Chrome", pattern: /Chrome\/([\d.]+)/i },
  { name: "Firefox", pattern: /Firefox\/([\d.]+)/i },
  { name: "Safari", pattern: /Version\/([\d.]+).*Safari/i }
]

const PLATFORM_PATTERNS = [
  { name: "iPhone", pattern: /iPhone/i },
  { name: "iPad", pattern: /iPad/i },
  { name: "Android", pattern: /Android/i },
  { name: "Windows", pattern: /Windows/i },
  { name: "Mac", pattern: /Mac OS X|Macintosh/i },
  { name: "Linux", pattern: /Linux/i }
]

const isSameCalendarDay = (firstDate, secondDate) =>
  firstDate.getFullYear() === secondDate.getFullYear() &&
  firstDate.getMonth() === secondDate.getMonth() &&
  firstDate.getDate() === secondDate.getDate()

const toTitleCase = (value = "") =>
  value
    .split(/[\s._-]+/)
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ")

export const getProfileDisplayName = (user) => {
  const safeName = user?.name?.trim()

  if (safeName) {
    return safeName
  }

  const emailPrefix = user?.email?.split("@")[0] || ""

  if (emailPrefix) {
    return toTitleCase(emailPrefix)
  }

  return "Workspace User"
}

export const getInitials = (value = "") => {
  const words = value
    .trim()
    .split(/\s+/)
    .filter(Boolean)

  if (words.length === 0) {
    return "WU"
  }

  if (words.length === 1) {
    return words[0].slice(0, 2).toUpperCase()
  }

  return `${words[0][0]}${words[1][0]}`.toUpperCase()
}

export const getDeviceTitle = (userAgent = "") => {
  for (const browser of BROWSER_PATTERNS) {
    const match = userAgent.match(browser.pattern)

    if (match) {
      return match[1] ? `${browser.name} ${match[1]}` : browser.name
    }
  }

  return userAgent.trim() ? "Browser session" : "Unknown device"
}

export const getDevicePlatform = (userAgent = "") => {
  const platformMatch = PLATFORM_PATTERNS.find((platform) =>
    platform.pattern.test(userAgent)
  )

  return platformMatch?.name || ""
}

export const isMobileDevice = (userAgent = "") =>
  /Mobile|Android|iPhone|iPad/i.test(userAgent)

export const formatSessionTimestamp = (value) => {
  const sessionDate = new Date(value)

  if (Number.isNaN(sessionDate.getTime())) {
    return "Unknown activity"
  }

  const now = new Date()
  const yesterday = new Date(now)
  yesterday.setDate(now.getDate() - 1)

  const timeLabel = sessionDate.toLocaleTimeString(undefined, {
    hour: "numeric",
    minute: "2-digit"
  })

  if (isSameCalendarDay(sessionDate, now)) {
    return `Today at ${timeLabel}`
  }

  if (isSameCalendarDay(sessionDate, yesterday)) {
    return `Yesterday at ${timeLabel}`
  }

  return sessionDate.toLocaleString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit"
  })
}

export const getAuthUserId = (user) =>
  user?._id || user?.userId || user?.id || null

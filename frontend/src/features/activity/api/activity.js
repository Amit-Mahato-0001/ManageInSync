import api from "@/shared/api/axios"

const fetchActivityFeed = (params) => {
  return api.get("/activity-feed", { params })
}

export default fetchActivityFeed

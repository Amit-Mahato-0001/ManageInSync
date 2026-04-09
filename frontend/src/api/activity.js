import api from "./axios"

const fetchActivityFeed = (params) => {
  return api.get("/activity-feed", { params })
}

export default fetchActivityFeed

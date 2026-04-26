import api from "@/shared/api/axios"

const getProfileApi = () => {
  return api.get("/account/profile")
}

const updateProfileApi = (data) => {
  return api.patch("/account/profile", data)
}

const getSessionsApi = () => {
  return api.get("/account/sessions")
}

export default {
  getProfileApi,
  getSessionsApi,
  updateProfileApi
}

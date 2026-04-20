import axios from "axios"

const defaultBaseURL = import.meta.env.DEV ? "http://localhost:3000/api" : "/api"
const baseURL = import.meta.env.VITE_API_URL || defaultBaseURL

const api = axios.create({
  baseURL,
  withCredentials: true,
})

const authClient = axios.create({
  baseURL,
  withCredentials: true,
})

let accessToken = null
let refreshHandler = null
let unauthorizedHandler = null
let refreshPromise = null

export const setAccessToken = (nextToken) => {
  accessToken = nextToken || null
}

export const configureAuthSession = ({ onRefresh, onUnauthorized }) => {
  refreshHandler = typeof onRefresh === "function" ? onRefresh : null
  unauthorizedHandler =
    typeof onUnauthorized === "function" ? onUnauthorized : null
}

api.interceptors.request.use(
  (config) => {
    if (accessToken) {
      config.headers = config.headers ?? {}
      config.headers.Authorization = `Bearer ${accessToken}`
    }

    return config
  },
  (error) => Promise.reject(error)
)

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config

    if (!originalRequest) {
      return Promise.reject(error)
    }

    const isUnauthorized = error.response?.status === 401

    if (
      !isUnauthorized ||
      originalRequest._retry ||
      originalRequest.skipAuthRefresh ||
      !refreshHandler
    ) {
      return Promise.reject(error)
    }

    originalRequest._retry = true

    try {
      if (!refreshPromise) {
        refreshPromise = Promise.resolve(refreshHandler()).finally(() => {
          refreshPromise = null
        })
      }

      const nextToken = await refreshPromise

      if (nextToken) {
        originalRequest.headers = originalRequest.headers ?? {}
        originalRequest.headers.Authorization = `Bearer ${nextToken}`
      }

      return api(originalRequest)
    } catch (refreshError) {
      if (unauthorizedHandler) {
        await unauthorizedHandler(refreshError)
      }

      return Promise.reject(refreshError)
    }
  }
)

export { authClient }

export default api

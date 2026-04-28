import { useCallback, useEffect, useRef, useState } from "react"
import authApi from "../api/auth"
import {
  configureAuthSession,
  setAccessToken as syncAccessToken
} from "@/shared/api/axios"
import AuthContext from "./authContext"

let sharedRefreshPromise = null

const AuthProvider = ({ children }) => {
  const [token, setToken] = useState(null)
  const [user, setUser] = useState(null)
  const [tenant, setTenant] = useState(null)
  const [status, setStatus] = useState("loading")
  const logoutInFlightRef = useRef(null)

  const setAuthData = useCallback((accessToken, nextUser, nextTenant, nextStatus) => {
    syncAccessToken(accessToken)
    setToken(accessToken || null)
    setUser(nextUser || null)
    setTenant(nextTenant || null)

    if (nextStatus) {
      setStatus(nextStatus)
    }
  }, [])

  const clearAuthData = useCallback(() => {
    setAuthData(null, null, null, "anonymous")
  }, [setAuthData])

  const refreshSession = useCallback(async () => {
    if (!sharedRefreshPromise) {
      sharedRefreshPromise = authApi
        .refreshApi()
        .then((response) => {
          let nextToken = null
          let nextUser = null
          let nextTenant = null

          if (response && response.data) {
            nextToken = response.data.accessToken
            nextUser = response.data.user || null
            nextTenant = response.data.tenant || null
          }

          if (!nextToken) {
            throw new Error("Missing access token")
          }

          setAuthData(nextToken, nextUser, nextTenant, "authenticated")

          return nextToken
        })
        .finally(() => {
          sharedRefreshPromise = null
        })
    }

    return sharedRefreshPromise
  }, [setAuthData])

  const handleUnauthorized = useCallback(async () => {
    if (!logoutInFlightRef.current) {
      logoutInFlightRef.current = authApi
        .logoutApi()
        .catch(() => null)
        .finally(() => {
          clearAuthData()
          logoutInFlightRef.current = null
        })
    }

    await logoutInFlightRef.current
  }, [clearAuthData])

  const startAuth = useCallback(async () => {
    setStatus("loading")

    try {
      await refreshSession()
    } catch {
      clearAuthData()
    }
  }, [clearAuthData, refreshSession])

  useEffect(() => {
    configureAuthSession({
      onRefresh: refreshSession,
      onUnauthorized: handleUnauthorized
    })

    startAuth()

    return () => {
      configureAuthSession({
        onRefresh: null,
        onUnauthorized: null
      })
    }
  }, [handleUnauthorized, refreshSession, startAuth])

  function login(payload) {
    let accessToken = null
    let nextUser = null
    let nextTenant = null
    let nextStatus = "anonymous"

    if (payload) {
      accessToken = payload.accessToken || null
      nextUser = payload.user || null
      nextTenant = payload.tenant || null

      if (payload.accessToken) {
        nextStatus = "authenticated"
      }
    }

    setAuthData(accessToken, nextUser, nextTenant, nextStatus)
  }

  async function logout() {
    try {
      await authApi.logoutApi()
    } finally {
      clearAuthData()
    }
  }

  function updateUser(nextUser) {
    if (!nextUser) {
      return
    }

    setUser((currentUser) => ({
      ...(currentUser || {}),
      ...nextUser
    }))
  }

  const value = {
    token,
    user,
    tenant,
    status,
    isAuthenticated: status === "authenticated",
    login,
    logout,
    refreshSession,
    updateUser
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export default AuthProvider

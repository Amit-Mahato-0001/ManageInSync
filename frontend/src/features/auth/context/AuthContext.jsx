import { useCallback, useEffect, useMemo, useRef, useState } from "react"
import authApi from "../api/auth"
import { configureAuthSession, setAccessToken as syncAccessToken } from "@/shared/api/axios"
import AuthContext from "./authContext"

let sharedRefreshPromise = null

const AuthProvider = ({ children }) => {
  const [token, setToken] = useState(null)
  const [user, setUser] = useState(null)
  const [tenant, setTenant] = useState(null)
  const [status, setStatus] = useState("loading")
  const logoutInFlightRef = useRef(null)

  const applyAuthState = useCallback(({ accessToken, user: nextUser, tenant: nextTenant, status: nextStatus }) => {
    syncAccessToken(accessToken)
    setToken(accessToken || null)
    setUser(nextUser || null)
    setTenant(nextTenant || null)

    if (nextStatus) {
      setStatus(nextStatus)
    }
  }, [])

  const clearAuthState = useCallback(() => {
    applyAuthState({
      accessToken: null,
      user: null,
      tenant: null,
      status: "anonymous",
    })
  }, [applyAuthState])

  const refreshSession = useCallback(async () => {
    if (!sharedRefreshPromise) {
      sharedRefreshPromise = authApi
        .refreshApi()
        .then((response) => {
          const nextToken = response.data?.accessToken
          const nextUser = response.data?.user || null
          const nextTenant = response.data?.tenant || null

          if (!nextToken) {
            throw new Error("Missing access token")
          }

          applyAuthState({
            accessToken: nextToken,
            user: nextUser,
            tenant: nextTenant,
            status: "authenticated",
          })

          return nextToken
        })
        .finally(() => {
          sharedRefreshPromise = null
        })
    }

    return sharedRefreshPromise
  }, [applyAuthState])

  const handleUnauthorized = useCallback(async () => {
    if (!logoutInFlightRef.current) {
      logoutInFlightRef.current = authApi
        .logoutApi()
        .catch(() => null)
        .finally(() => {
          clearAuthState()
          logoutInFlightRef.current = null
        })
    }

    await logoutInFlightRef.current
  }, [clearAuthState])

  const bootstrapAuth = useCallback(async () => {
    setStatus("loading")

    try {
      await refreshSession()
    } catch {
      clearAuthState()
    }
  }, [clearAuthState, refreshSession])

  useEffect(() => {
    configureAuthSession({
      onRefresh: refreshSession,
      onUnauthorized: handleUnauthorized,
    })

    bootstrapAuth()

    return () => {
      configureAuthSession({
        onRefresh: null,
        onUnauthorized: null,
      })
    }
  }, [bootstrapAuth, handleUnauthorized, refreshSession])

  const login = useCallback((payload) => {
    applyAuthState({
      accessToken: payload?.accessToken || null,
      user: payload?.user || null,
      tenant: payload?.tenant || null,
      status: payload?.accessToken ? "authenticated" : "anonymous",
    })
  }, [applyAuthState])

  const logout = useCallback(async () => {
    try {
      await authApi.logoutApi()
    } finally {
      clearAuthState()
    }
  }, [clearAuthState])

  const value = useMemo(
    () => ({
      token,
      user,
      tenant,
      status,
      isAuthenticated: status === "authenticated",
      login,
      logout,
      refreshSession,
    }),
    [login, logout, refreshSession, status, tenant, token, user]
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export default AuthProvider

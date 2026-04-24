import { useState } from "react"
import { useNavigate } from "react-router-dom"
import toast from "react-hot-toast"

import authApi from "../api/auth"
import { useAuth } from "../hooks/useAuth"

const MIN_PASSWORD_LENGTH = 8

export default function Security() {
  const navigate = useNavigate()
  const { logout } = useAuth()
  const [currentPassword, setCurrentPassword] = useState("")
  const [newPassword, setNewPassword] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")

  const handleSubmit = async (event) => {
    event.preventDefault()

    if (currentPassword.length < MIN_PASSWORD_LENGTH) {
      setError("Current password must be at least 8 characters")
      return
    }

    if (newPassword.length < MIN_PASSWORD_LENGTH) {
      setError("New password must be at least 8 characters")
      return
    }

    if (currentPassword === newPassword) {
      setError("New password must be different from current password")
      return
    }

    setLoading(true)
    setError("")

    try {
      const response = await toast.promise(
        authApi.changePasswordApi({
          currentPassword,
          newPassword
        }),
        {
          loading: "Updating password...",
          success: "Password changed successfully",
          error: (requestError) =>
            requestError?.response?.data?.error || "Failed to change password"
        }
      )

      const workspace =
        response.data?.workspace?.slug ||
        response.data?.workspace?.name ||
        ""

      await logout()
      navigate(
        workspace
          ? `/login?workspace=${encodeURIComponent(workspace)}`
          : "/login"
      )
    } catch {
      return
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="max-w-3xl space-y-6">
      <div>
        <h1 className="text-5xl font-semibold">Security</h1>
        <p className="text-2xl text-white/60">
          Update your password. Changing it signs you out so you can log in again with the new one.
        </p>
      </div>

      <div className="rounded-2xl border border-white/10 bg-gradient-to-br from-[#18181B] to-[#09090B] p-8">
        <form onSubmit={handleSubmit} className="space-y-4" noValidate>
          {error && (
            <p className="text-2xl text-red-400 bg-red-500/10 border border-red-500/20 rounded-md px-3 py-2">
              {error}
            </p>
          )}

          <div className="space-y-1.5">
            <label className="text-2xl text-white/60">Current Password</label>
            <input
              type="password"
              className="w-full rounded-md border border-white/10 px-4 py-2.5 text-2xl outline-none focus:border-blue-500/60 focus:ring-2 focus:ring-blue-500/20"
              placeholder="Enter your current password"
              value={currentPassword}
              onChange={(event) => {
                setCurrentPassword(event.target.value)

                if (error) {
                  setError("")
                }
              }}
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-2xl text-white/60">New Password</label>
            <input
              type="password"
              className="w-full rounded-md border border-white/10 px-4 py-2.5 text-2xl outline-none focus:border-blue-500/60 focus:ring-2 focus:ring-blue-500/20"
              placeholder="Minimum 8 characters"
              value={newPassword}
              onChange={(event) => {
                setNewPassword(event.target.value)

                if (error) {
                  setError("")
                }
              }}
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-lg border border-white/10 bg-gradient-to-br from-[#18181B] to-blue-500 transition-colors text-2xl font-medium py-2.5 disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {loading ? "Updating..." : "Change Password"}
          </button>
        </form>
      </div>
    </div>
  )
}

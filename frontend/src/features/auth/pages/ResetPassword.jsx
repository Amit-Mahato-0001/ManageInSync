import { useState } from "react"
import { Link, useNavigate, useSearchParams } from "react-router-dom"
import toast from "react-hot-toast"
import authApi from "../api/auth"

const MIN_PASSWORD_LENGTH = 8

export default function ResetPassword() {
  const [params] = useSearchParams()
  const token = params.get("token")
  const workspaceFromQuery = params.get("workspace") || ""
  const navigate = useNavigate()

  const [password, setPassword] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")

  const handleSubmit = async (event) => {
    event.preventDefault()

    const resetToken = token?.trim()

    if (!resetToken) {
      setError("Reset link is invalid")
      return
    }

    if (password.length < MIN_PASSWORD_LENGTH) {
      setError("Password must be at least 8 characters")
      return
    }

    setLoading(true)
    setError("")

    try {
      const response = await toast.promise(
        authApi.resetPasswordApi({
          token: resetToken,
          password
        }),
        {
          loading: "Updating password...",
          success: "Password updated successfully",
          error: (requestError) =>
            requestError?.response?.data?.error || "Failed to reset password"
        }
      )

      const workspace =
        response.data?.workspace?.slug ||
        response.data?.workspace?.name ||
        workspaceFromQuery

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
    <div className="w-xl">
      <div className="rounded-2xl border border-white/10 bg-gradient-to-br from-[#18181B] to-[#09090B] p-8 text-white shadow-xl">
        <h1 className="text-5xl font-semibold mb-2">
          Choose a new password
        </h1>

        <p className="text-2xl text-white/60 mb-7">
          Set a new password for your workspace account.
        </p>

        <form onSubmit={handleSubmit} className="space-y-4" noValidate>
          {error && (
            <p className="text-2xl text-red-400 bg-red-500/10 border border-red-500/20 rounded-md px-3 py-2">
              {error}
            </p>
          )}

          <div className="space-y-1.5">
            <label className="text-2xl text-white/60">New Password</label>
            <input
              type="password"
              className="w-full rounded-md border border-white/10 px-4 py-2.5 text-2xl outline-none focus:border-blue-500/60 focus:ring-2 focus:ring-blue-500/20"
              placeholder="Minimum 8 characters"
              value={password}
              onChange={(event) => {
                setPassword(event.target.value)

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
            {loading ? "Saving..." : "Reset Password"}
          </button>
        </form>

        <p className="text-2xl text-white/50 mt-6 text-center">
          Remembered it?{" "}
          <Link
            to={workspaceFromQuery ? `/login?workspace=${encodeURIComponent(workspaceFromQuery)}` : "/login"}
            className="text-blue-400 hover:text-blue-300"
          >
            Login
          </Link>
        </p>
      </div>
    </div>
  )
}

import { useState } from "react"
import { Link, useNavigate, useSearchParams } from "react-router-dom"
import toast from "react-hot-toast"
import authApi from "../api/auth"

const MIN_PASSWORD_LENGTH = 8

export default function AcceptInvite() {
  const [params] = useSearchParams()
  const token = params.get("token")
  const navigate = useNavigate()

  const [password, setPassword] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")

  const handleSubmit = async (e) => {
    e.preventDefault()

    const inviteToken = token?.trim()

    if (!inviteToken) {
      setError("Invite link is invalid")
      return
    }

    if (password.length < MIN_PASSWORD_LENGTH) {
      setError("Password must be at least 8 characters")
      return
    }

    setLoading(true)
    setError("")

    try {
      await toast.promise(
        authApi.acceptInviteApi({
          token: inviteToken,
          password
        }),
        {
          loading: "Activating account...",
          success: "Invite accepted. Please log in.",
          error: (requestError) =>
            requestError?.response?.data?.error ||
            requestError?.response?.data?.message ||
            "Failed to accept invite",
        }
      )

      navigate("/login")
    } catch {
      return
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="w-full">
      <div className="rounded-2xl border border-white/10 bg-gradient-to-br from-[#18181B] to-[#09090B] p-8 text-white shadow-xl">
        <h1 className="text-3xl font-semibold mb-2">
          Activate your account
        </h1>

        <p className="text-sm text-white/60 mb-7">
          Set a secure password to complete your invite.
        </p>

        <form onSubmit={handleSubmit} className="space-y-4" noValidate>
          {error && (
            <p className="text-sm text-red-400 bg-red-500/10 border border-red-500/20 rounded-md px-3 py-2">
              {error}
            </p>
          )}

          <div className="space-y-1.5">
            <label className="text-xs text-white/60">New Password</label>

            <input
              type="password"
              placeholder="Minimum 8 characters"
              value={password}
              onChange={(e) => {
                setPassword(e.target.value)

                if (error) {
                  setError("")
                }
              }}
              className="w-full rounded-md border border-white/10 px-4 py-2.5 text-sm outline-none focus:border-blue-500/60 focus:ring-2 focus:ring-blue-500/20"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-lg border border-white/10 bg-gradient-to-br from-[#18181B] to-blue-500 transition-colors text-sm font-medium py-2.5 disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {loading ? "Setting password..." : "Set Password"}
          </button>
        </form>

        <p className="text-sm text-white/50 mt-6 text-center">
          Already activated?{" "}
          <Link to="/login" className="text-blue-400 hover:text-blue-300">
            Login
          </Link>
        </p>
      </div>
    </div>
  )
}

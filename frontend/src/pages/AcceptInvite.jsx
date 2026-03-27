import { useState } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { Eye, EyeOff } from 'lucide-react'
import authApi from '../api/auth'

export default function AcceptInvite () {
  const [params] = useSearchParams()
  const token = params.get("token")
  const navigate = useNavigate()

  const [password, setPassword] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")

  const handleSubmit = async (e) => {
    e.preventDefault()

    const inviteToken = token?.trim()

    if (!inviteToken) {
      setError("Invite link is invalid")
      return
    }

    if (password.length < 8) {
      setError("Password must be at least 8 characters")
      return
    }

    setLoading(true)
    setError("")

    try {
      await authApi.acceptInviteApi({
        token: inviteToken,
        password
      })

      navigate('/login')
    } catch (err) {
      setError(
        err.response?.data?.error || err.response?.data?.message || "Failed to accept invite"
      )
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="w-full">
      <div className="rounded-2xl border border-white/10 bg-gradient-to-br from-[#18181B] to-[#09090B] p-8 text-white shadow-xl">
        <p className="text-xs font-semibold tracking-widest text-blue-400 mb-2">
          MANAGEINSYNC
        </p>

        <h1 className="text-3xl font-semibold mb-2">
          Activate your account
        </h1>

        <p className="text-sm text-white/60 mb-7">
          Set a secure password to complete your invite.
        </p>

        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <p className="text-sm text-red-400 bg-red-500/10 border border-red-500/20 rounded-md px-3 py-2">
              {error}
            </p>
          )}

          <div className="space-y-1.5">
            <label className="text-xs text-white/60">New Password</label>

            <div className="relative">
              <input
                type={showPassword ? "text" : "password"}
                placeholder="Minimum 8 characters"
                value={password}
                minLength={8}
                required
                onChange={(e) => setPassword(e.target.value)}
                className="w-full rounded-md border border-white/10 bg-black/20 px-4 py-2.5 pr-12 text-sm outline-none focus:border-blue-500/60 focus:ring-2 focus:ring-blue-500/20"
              />

              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute inset-y-0 right-3 flex items-center text-white hover:text-white/80 transition-colors"
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-md bg-blue-600 hover:bg-blue-500 transition-colors text-sm font-medium py-2.5 disabled:opacity-60 disabled:cursor-not-allowed"
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
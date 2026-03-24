import { useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import authApi from '../api/auth'

export default function AcceptInvite () {

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
        err.response?.data?.message || "Failed to accept invite"
      )

    } finally {

      setLoading(false)
    }
  }

  return (

    <div className="min-h-screen flex items-center justify-center bg-[#09090B] px-4">

      {/* CARD */}
      <div className="w-full max-w-md bg-[#18181B] border border-white/10 rounded-xl p-6 space-y-6">

        {/* HEADER */}
        <div className="space-y-2">

          <p className="text-xs font-medium text-blue-400 tracking-wide">
            AGENCY OS
          </p>

          <h1 className="text-2xl font-semibold">
            Set your password
          </h1>

          <p className="text-sm text-white/60">
            Create a secure password to activate your account
          </p>

        </div>

        {/* FORM */}
        <form onSubmit={handleSubmit} className="space-y-4">

          {error && (
            <p className="text-red-500 text-sm">{error}</p>
          )}

          <input
            type="password"
            placeholder="Create password"
            value={password}
            minLength={8}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full bg-[#0B0F19] border border-white/10 px-4 py-3 rounded-md text-sm outline-none"
          />

          <button
            disabled={loading}
            className="w-full py-2 rounded-md bg-blue-600 text-sm font-medium disabled:opacity-50"
          >
            {loading ? "Setting..." : "Set password"}
          </button>

        </form>

      </div>

    </div>
  )
}
import { useState } from 'react'
import authApi from '../api/auth'
import { useAuth } from '../context/AuthContext'
import { Link, useNavigate } from 'react-router-dom'

const Signup = () => {

  const { login } = useAuth()
  const navigate = useNavigate()

  const [agencyName, setAgencyName] = useState("")
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError("")

    try {

      const res = await authApi.signupApi({
        agencyName,
        email,
        password
      })

      login(res.data.token)
      navigate('/')

    } catch (error) {
      setError(error?.response?.data?.error || "Signup failed")
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
          Create your workspace
        </h1>

        <p className="text-sm text-white/60 mb-7">
          Start your agency workspace and invite your team in minutes.
        </p>

        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <p className="text-sm text-red-400 bg-red-500/10 border border-red-500/20 rounded-md px-3 py-2">
              {error}
            </p>
          )}

          <div className="space-y-1.5">
            <label className="text-xs text-white/60">Agency Name</label>
            <input
              required
              className="w-full rounded-md border border-white/10 bg-black/20 px-4 py-2.5 text-sm outline-none focus:border-blue-500/60 focus:ring-2 focus:ring-blue-500/20"
              placeholder="ManageInSync Studio"
              value={agencyName}
              onChange={(e) => setAgencyName(e.target.value)}
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs text-white/60">Work Email</label>
            <input
              type="email"
              required
              className="w-full rounded-md border border-white/10 bg-black/20 px-4 py-2.5 text-sm outline-none focus:border-blue-500/60 focus:ring-2 focus:ring-blue-500/20"
              placeholder="you@agency.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs text-white/60">Password</label>
            <input
              type="password"
              required
              className="w-full rounded-md border border-white/10 bg-black/20 px-4 py-2.5 text-sm outline-none focus:border-blue-500/60 focus:ring-2 focus:ring-blue-500/20"
              placeholder="Minimum 8 characters"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-md bg-blue-600 hover:bg-blue-500 transition-colors text-sm font-medium py-2.5 disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {loading ? "Creating account..." : "Create Account"}
          </button>
        </form>

        <p className="text-sm text-white/50 mt-6 text-center">
          Already have an account?{" "}
          <Link to="/login" className="text-blue-400 hover:text-blue-300">
            Login
          </Link>
        </p>
      </div>
    </div>
  )
}

export default Signup

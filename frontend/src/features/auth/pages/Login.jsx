import { useState } from "react"
import { Link, useNavigate } from "react-router-dom"
import toast from "react-hot-toast"
import authApi from "../api/auth"
import { useAuth } from "../hooks/useAuth"

const EMAIL_PATTERN = /^\S+@\S+\.\S+$/

const Login = () => {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")

  const { login } = useAuth()
  const navigate = useNavigate()

  const handleSubmit = async (e) => {
    e.preventDefault()

    const safeEmail = email.trim()

    if (!safeEmail) {
      setError("Email is required")
      return
    }

    if (!EMAIL_PATTERN.test(safeEmail)) {
      setError("Enter a valid email address")
      return
    }

    if (!password) {
      setError("Password is required")
      return
    }

    setError("")
    setLoading(true)

    try {
      const res = await toast.promise(
        authApi.loginApi({ email: safeEmail, password }),
        {
          loading: "Logging in...",
          success: "Logged in successfully",
          error: (requestError) =>
            requestError?.response?.data?.error || "Invalid email or password",
        }
      )

      login(res.data)
      navigate("/")
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
          Welcome back
        </h1>

        <p className="text-2xl text-white/60 mb-7">
          Sign in to continue managing your projects, members, and clients.
        </p>

        <form onSubmit={handleSubmit} className="space-y-4" noValidate>
          {error && (
            <p className="text-2xl text-red-400 bg-red-500/10 border border-red-500/20 rounded-md px-3 py-2">
              {error}
            </p>
          )}

          <div className="space-y-1.5">
            <label className="text-2xl text-white/60">Email</label>
            <input
              type="email"
              className="w-full rounded-md border border-white/10 px-4 py-2.5 text-2xl outline-none focus:border-blue-500/60 focus:ring-2 focus:ring-blue-500/20"
              placeholder="your@gmail.com"
              value={email}
              onChange={(e) => {
                setEmail(e.target.value)

                if (error) {
                  setError("")
                }
              }}
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-2xl text-white/60">Password</label>
            <input
              type="password"
              className="w-full rounded-md border border-white/10 px-4 py-2.5 text-2xl outline-none focus:border-blue-500/60 focus:ring-2 focus:ring-blue-500/20"
              placeholder="Enter your password"
              value={password}
              onChange={(e) => {
                setPassword(e.target.value)

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
            {loading ? "Logging in..." : "Login"}
          </button>
        </form>

        <p className="text-2xl text-white/50 mt-6 text-center">
          Don&apos;t have an account?{" "}
          <Link to="/signup" className="text-blue-400 hover:text-blue-300">
            Create one
          </Link>
        </p>
      </div>
    </div>
  )
}

export default Login

import { useState } from "react"
import { Link, useNavigate } from "react-router-dom"
import toast from "react-hot-toast"
import authApi from "../api/auth"
import { useAuth } from "../context/AuthContext"

const EMAIL_PATTERN = /^\S+@\S+\.\S+$/
const MIN_PASSWORD_LENGTH = 8

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

    const safeAgencyName = agencyName.trim()
    const safeEmail = email.trim()

    if (!safeAgencyName) {
      setError("Agency name is required")
      return
    }

    if (!safeEmail) {
      setError("Work email is required")
      return
    }

    if (!EMAIL_PATTERN.test(safeEmail)) {
      setError("Enter a valid work email")
      return
    }

    if (password.length < MIN_PASSWORD_LENGTH) {
      setError("Password must be at least 8 characters")
      return
    }

    setLoading(true)
    setError("")

    try {
      const res = await toast.promise(
        authApi.signupApi({
          agencyName: safeAgencyName,
          email: safeEmail,
          password
        }),
        {
          loading: "Creating account...",
          success: "Workspace created successfully",
          error: (requestError) =>
            requestError?.response?.data?.error || "Signup failed",
        }
      )

      login(res.data.token)
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
          Create your workspace
        </h1>

        <p className="text-2xl text-white/60 mb-7">
          Start your agency workspace and invite your team in minutes.
        </p>

        <form onSubmit={handleSubmit} className="space-y-4" noValidate>
          {error && (
            <p className="text-2xl text-red-400 bg-red-500/10 border border-red-500/20 rounded-md px-3 py-2">
              {error}
            </p>
          )}

          <div className="space-y-1.5">
            <label className="text-2xl text-white/60">Agency Name</label>
            <input
              className="w-full rounded-md border border-white/10 px-4 py-2.5 text-2xl outline-none focus:border-blue-500/60 focus:ring-2 focus:ring-blue-500/20"
              placeholder="Xyz Studio"
              value={agencyName}
              onChange={(e) => {
                setAgencyName(e.target.value)

                if (error) {
                  setError("")
                }
              }}
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-2xl text-white/60">Work Email</label>
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
              placeholder="Minimum 8 characters"
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
            {loading ? "Creating account..." : "Create Account"}
          </button>
        </form>

        <p className="text-2xl text-white/50 mt-6 text-center">
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

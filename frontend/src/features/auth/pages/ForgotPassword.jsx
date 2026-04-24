import { useState } from "react"
import { Link, useSearchParams } from "react-router-dom"
import toast from "react-hot-toast"
import authApi from "../api/auth"

const EMAIL_PATTERN = /^\S+@\S+\.\S+$/

export default function ForgotPassword() {
  const [params] = useSearchParams()
  const [workspace, setWorkspace] = useState(() => params.get("workspace") || "")
  const [email, setEmail] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const [submitted, setSubmitted] = useState(false)

  const handleSubmit = async (event) => {
    event.preventDefault()

    const safeWorkspace = workspace.trim()
    const safeEmail = email.trim()

    if (!safeWorkspace) {
      setError("Workspace is required")
      return
    }

    if (!safeEmail) {
      setError("Email is required")
      return
    }

    if (!EMAIL_PATTERN.test(safeEmail)) {
      setError("Enter a valid email address")
      return
    }

    setLoading(true)
    setError("")

    try {
      await toast.promise(
        authApi.forgotPasswordApi({
          workspace: safeWorkspace,
          email: safeEmail
        }),
        {
          loading: "Sending reset link...",
          success: "If the account exists, a reset link has been sent",
          error: (requestError) =>
            requestError?.response?.data?.error || "Failed to send reset link"
        }
      )

      setSubmitted(true)
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
          Reset your password
        </h1>

        <p className="text-2xl text-white/60 mb-7">
          Enter your workspace and email address to receive a reset link.
        </p>

        <form onSubmit={handleSubmit} className="space-y-4" noValidate>
          {error && (
            <p className="text-2xl text-red-400 bg-red-500/10 border border-red-500/20 rounded-md px-3 py-2">
              {error}
            </p>
          )}

          {submitted && (
            <p className="text-2xl text-emerald-300 bg-emerald-500/10 border border-emerald-500/20 rounded-md px-3 py-2">
              Check your inbox for a reset link if the workspace and email match an account.
            </p>
          )}

          <div className="space-y-1.5">
            <label className="text-2xl text-white/60">Workspace</label>
            <input
              className="w-full rounded-md border border-white/10 px-4 py-2.5 text-2xl outline-none focus:border-blue-500/60 focus:ring-2 focus:ring-blue-500/20"
              placeholder="your-workspace"
              value={workspace}
              onChange={(event) => {
                setWorkspace(event.target.value)

                if (error) {
                  setError("")
                }
              }}
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-2xl text-white/60">Email</label>
            <input
              type="email"
              className="w-full rounded-md border border-white/10 px-4 py-2.5 text-2xl outline-none focus:border-blue-500/60 focus:ring-2 focus:ring-blue-500/20"
              placeholder="you@example.com"
              value={email}
              onChange={(event) => {
                setEmail(event.target.value)

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
            {loading ? "Sending link..." : "Send reset link"}
          </button>
        </form>

        <p className="text-2xl text-white/50 mt-6 text-center">
          Back to{" "}
          <Link
            to={workspace.trim() ? `/login?workspace=${encodeURIComponent(workspace.trim())}` : "/login"}
            className="text-blue-400 hover:text-blue-300"
          >
            Login
          </Link>
        </p>
      </div>
    </div>
  )
}

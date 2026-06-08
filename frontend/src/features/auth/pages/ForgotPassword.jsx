import { useState } from "react"
import { Link, useSearchParams } from "react-router-dom"
import toast from "react-hot-toast"
import { AlertCircle } from "lucide-react"
import manageInSyncLogo from "@/shared/assets/M-logo.png"
import authApi from "../api/auth"

const EMAIL_PATTERN = /^\S+@\S+\.\S+$/

export default function ForgotPassword() {
  const [params] = useSearchParams()

  const [workspace, setWorkspace] = useState(
    () => params.get("workspace") || ""
  )

  const [email, setEmail] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const [submitted, setSubmitted] = useState(false)
  const [fieldErrors, setFieldErrors] = useState({})

  const clearFieldError = (fieldName) => {
    if (fieldErrors[fieldName]) {
      setFieldErrors((current) => {
        const next = { ...current }
        delete next[fieldName]
        return next
      })
    }

    if (error) setError("")
  }

  const handleSubmit = async (event) => {
    event.preventDefault()

    const safeWorkspace = workspace.trim()
    const safeEmail = email.trim()

    const nextFieldErrors = {}

    if (!safeWorkspace) {
      nextFieldErrors.workspace = true
    }

    if (!safeEmail || !EMAIL_PATTERN.test(safeEmail)) {
      nextFieldErrors.email = true
    }

    if (Object.keys(nextFieldErrors).length) {
      setFieldErrors(nextFieldErrors)
      setError("")
      return
    }

    setLoading(true)
    setError("")
    setFieldErrors({})

    try {
      await toast.promise(
        authApi.forgotPasswordApi({
          workspace: safeWorkspace,
          email: safeEmail,
        }),
        {
          loading: "Sending reset link...",
          success: "If the account exists, a reset link has been sent",
          error: (requestError) =>
            requestError?.response?.data?.error ||
            "Failed to send reset link",
        }
      )

      setSubmitted(true)
    } catch {
      setFieldErrors({
        workspace: true,
        email: true,
      })
    } finally {
      setLoading(false)
    }
  }

  const inputClassName = (hasError) =>
    [
      "h-11 w-full rounded-[8px] border px-4 text-[14px] font-medium text-white outline-none transition placeholder:text-[#8b8b8b]",
      hasError
        ? "border-rose-500 bg-rose-950/45 pr-11 text-rose-300 placeholder:text-rose-300/65 focus:border-rose-400 focus:bg-rose-950/55"
        : "border-transparent bg-[#2b2b2b] focus:border-white/25 focus:bg-[#303030]",
    ].join(" ")

  return (
    <form
      className="w-full"
      onSubmit={handleSubmit}
      noValidate
    >
      <div className="mb-2 flex justify-center">
        <img
          src={manageInSyncLogo}
          alt="ManageInSync"
          className="h-20 w-20 object-contain"
        />
      </div>

      <div className="mb-8 text-center">
        <h1 className="text-[24px] font-extrabold leading-none text-white">
          Reset your password
        </h1>

        <p className="mt-1 text-[23px] font-extrabold leading-none text-[#787878]">
          Get back to work in seconds.
        </p>
      </div>

      <div className="space-y-3">
        {error && (
          <p className="rounded-[8px] border border-red-500/25 bg-red-500/10 px-3 py-2 text-[13px] leading-5 text-red-200">
            {error}
          </p>
        )}

        {submitted && (
          <p className="rounded-[8px] border border-emerald-500/25 bg-emerald-500/10 px-3 py-2 text-[13px] leading-5 text-emerald-200">
            Check your inbox for a reset link if the workspace and email match an account.
          </p>
        )}

        <div className="relative">
          <input
            className={inputClassName(fieldErrors.workspace)}
            placeholder="Enter your workspace"
            value={workspace}
            onChange={(event) => {
              setWorkspace(event.target.value)
              clearFieldError("workspace")
            }}
          />

          {fieldErrors.workspace && (
            <AlertCircle
              className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-rose-300"
            />
          )}
        </div>

        <div className="relative">
          <input
            type="email"
            className={inputClassName(fieldErrors.email)}
            placeholder="Enter your email"
            value={email}
            onChange={(event) => {
              setEmail(event.target.value)
              clearFieldError("email")
            }}
          />

          {fieldErrors.email && (
            <AlertCircle
              className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-rose-300"
            />
          )}
        </div>

        <button
          type="submit"
          disabled={loading}
          className="h-11 w-full rounded-[8px] bg-[#2b2b2b] px-4 text-[14px] font-bold text-white transition hover:bg-[#383838] disabled:cursor-not-allowed disabled:opacity-60"
        >
          {loading ? "Sending link..." : "Send link"}
        </button>
      </div>

      <div className="mt-5 flex items-center justify-center text-[13px] font-medium">
        <Link
          to={
            workspace.trim()
              ? `/login?workspace=${encodeURIComponent(
                  workspace.trim()
                )}`
              : "/login"
          }
          className="text-white/45 transition hover:text-white/80"
        >
          Back to login
        </Link>
      </div>
    </form>
  )
}
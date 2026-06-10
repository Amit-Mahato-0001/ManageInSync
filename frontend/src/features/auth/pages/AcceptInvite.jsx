import { useState } from "react"
import { Link, useNavigate, useSearchParams } from "react-router-dom"
import toast from "react-hot-toast"
import { AlertCircle, Eye, EyeOff } from "lucide-react"
import manageInSyncLogo from "@/shared/assets/M-logo.png"
import authApi from "../api/auth"

const MIN_PASSWORD_LENGTH = 8

const MIN_WORKSPACE_LENGTH = 1

const AcceptInvite = () => {
  const [params] = useSearchParams()
  const token = params.get("token")
  const workspaceFromQuery = params.get("workspace") || ""
  const navigate = useNavigate()

  const [workspace, setWorkspace] = useState(workspaceFromQuery)
  const [password, setPassword] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const [fieldErrors, setFieldErrors] = useState({})

  const handleSubmit = async (e) => {
    e.preventDefault()

    const inviteToken = token?.trim()
    const safeWorkspace = workspace.trim()

    const nextFieldErrors = {}
    if (!inviteToken) {
      setError("Invite link is invalid")
      return
    }
    if (!safeWorkspace) nextFieldErrors.workspace = true
    if (password.length < MIN_PASSWORD_LENGTH) nextFieldErrors.password = true

    if (Object.keys(nextFieldErrors).length) {
      setFieldErrors(nextFieldErrors)
      setError("")
      return
    }

    setError("")
    setFieldErrors({})
    setLoading(true)

    try {
      const response = await toast.promise(
        authApi.acceptInviteApi({
          token: inviteToken,
          password,
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

      const workspace =
        response.data?.workspace?.slug ||
        response.data?.workspace?.name ||
        safeWorkspace

      navigate(
        workspace
          ? `/login?workspace=${encodeURIComponent(workspace)}`
          : "/login"
      )
    } catch {
      setFieldErrors({ workspace: true, password: true })
      return
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

  const passwordInputClassName = (hasError) =>
    [
      "no-password-reveal h-11 w-full rounded-[8px] border px-4 text-[14px] font-medium text-white outline-none transition placeholder:text-[#8b8b8b]",
      hasError
        ? "border-rose-500 bg-rose-950/45 pr-20 text-rose-300 placeholder:text-rose-300/65 focus:border-rose-400 focus:bg-rose-950/55"
        : "border-transparent bg-[#2b2b2b] pr-11 focus:border-white/25 focus:bg-[#303030]",
    ].join(" ")

  const clearFieldError = (fieldName) => {
    if (fieldErrors[fieldName]) {
      setFieldErrors((currentErrors) => {
        const nextErrors = { ...currentErrors }
        delete nextErrors[fieldName]
        return nextErrors
      })
    }
    if (error) setError("")
  }

  return (
    <form className="w-full" onSubmit={handleSubmit} noValidate>
      <div className="mb-2 flex justify-center">
        <img
          src={manageInSyncLogo}
          alt="ManageInSync"
          className="h-20 w-20 object-contain"
        />
      </div>

      <div className="mb-8 text-center">
        <h1 className="text-[24px] font-extrabold leading-none text-white">
          Activate your account
        </h1>
        <p className="mt-1 text-[18px] font-bold leading-none text-[#787878]">
          Set a secure password to complete your invite.
        </p>
      </div>

      <div className="space-y-3">
        {error && (
          <p className="rounded-[8px] border border-red-500/25 bg-red-500/10 px-3 py-2 text-[13px] leading-5 text-red-200">
            {error}
          </p>
        )}

        <label className="sr-only" htmlFor="invite-workspace">Workspace</label>
        <div className="relative">
          <input
            id="invite-workspace"
            className={inputClassName(fieldErrors.workspace)}
            placeholder="Enter your workspace"
            value={workspace}
            aria-invalid={fieldErrors.workspace ? "true" : "false"}
            onChange={(e) => {
              setWorkspace(e.target.value)
              clearFieldError("workspace")
            }}
          />
          {fieldErrors.workspace && (
            <AlertCircle
              className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-rose-300"
              aria-hidden="true"
            />
          )}
        </div>

        <label className="sr-only" htmlFor="invite-password">New Password</label>
        <div className="relative">
          <input
            id="invite-password"
            type={showPassword ? "text" : "password"}
            className={passwordInputClassName(fieldErrors.password)}
            placeholder="Minimum 8 characters"
            value={password}
            aria-invalid={fieldErrors.password ? "true" : "false"}
            onChange={(e) => {
              setPassword(e.target.value)
              clearFieldError("password")
            }}
          />
          <button
            type="button"
            className={`absolute top-1/2 -translate-y-1/2 rounded p-1 transition ${
              fieldErrors.password
                ? "right-9 text-rose-300/75 hover:text-rose-200"
                : "right-3 text-white/35 hover:text-white/70"
            }`}
            onClick={() => setShowPassword((isVisible) => !isVisible)}
            aria-label={showPassword ? "Hide password" : "Show password"}
          >
            {showPassword ? (
              <EyeOff className="h-4 w-4" aria-hidden="true" />
            ) : (
              <Eye className="h-4 w-4" aria-hidden="true" />
            )}
          </button>
          {fieldErrors.password && (
            <AlertCircle
              className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-rose-300"
              aria-hidden="true"
            />
          )}
        </div>

        <button
          type="submit"
          disabled={loading}
          className="h-11 w-full rounded-[8px] bg-[#2b2b2b] px-4 text-[14px] font-bold text-white transition hover:bg-[#383838] disabled:cursor-not-allowed disabled:opacity-60"
        >
          {loading ? "Setting password..." : "Set Password"}
        </button>
      </div>

      <p className="mt-5 text-[13px] font-medium text-center text-white/45">
        Already activated?{" "}
        <Link
          to={workspace.trim() ? `/login?workspace=${encodeURIComponent(workspace.trim())}` : "/login"}
          className="text-white/45 transition hover:text-white/80"
        >
          Login
        </Link>
      </p>
    </form>
  )
}

export default AcceptInvite
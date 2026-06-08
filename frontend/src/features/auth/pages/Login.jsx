import { useState } from "react"
import { Link, useNavigate, useSearchParams } from "react-router-dom"
import toast from "react-hot-toast"
import { AlertCircle, Eye, EyeOff } from "lucide-react"
import { FcGoogle } from "react-icons/fc"
import manageInSyncLogo from "@/shared/assets/M-logo.png"
import authApi from "../api/auth"
import { useAuth } from "../hooks/useAuth"

const EMAIL_PATTERN = /^\S+@\S+\.\S+$/

const Login = () => {
  const [params] = useSearchParams()
  const [workspace, setWorkspace] = useState(() => params.get("workspace") || "")
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const [fieldErrors, setFieldErrors] = useState({})

  const { login } = useAuth()
  const navigate = useNavigate()

  const handleSubmit = async (e) => {
    e.preventDefault()

    const safeWorkspace = workspace.trim()
    const safeEmail = email.trim()

    const nextFieldErrors = {}
    if (!safeWorkspace) nextFieldErrors.workspace = true
    if (!safeEmail || !EMAIL_PATTERN.test(safeEmail)) nextFieldErrors.email = true
    if (!password) nextFieldErrors.password = true

    if (Object.keys(nextFieldErrors).length) {
      setFieldErrors(nextFieldErrors)
      setError("")
      return
    }

    setError("")
    setFieldErrors({})
    setLoading(true)

    try {
      const res = await toast.promise(
        authApi.loginApi({ workspace: safeWorkspace, email: safeEmail, password }),
        {
          loading: "Logging in...",
          success: "Logged in successfully",
          error: (requestError) =>
            requestError?.response?.data?.error || "Invalid workspace, email, or password",
        }
      )
      login(res.data)
      navigate("/")
    } catch {
      setFieldErrors({ workspace: true, email: true, password: true })
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
          Welcome to ManageInSync
        </h1>
        <p className="mt-1 text-[23px] font-extrabold leading-none text-[#787878]">
          Turn Chaos into Control.
        </p>
      </div>

      <button
        type="button"
        className="flex h-11 w-full items-center justify-center gap-3 rounded-[8px] bg-white px-4 text-[14px] font-semibold text-[#111] transition hover:bg-zinc-200"
      >
        <FcGoogle className="text-[18px]" aria-hidden="true" />
        Continue with Google
      </button>

      <div className="my-6 flex items-center gap-4">
        <span className="h-px flex-1 bg-white/15" />
        <span className="text-[12px] font-medium text-[#5b5b5b]">OR</span>
        <span className="h-px flex-1 bg-white/15" />
      </div>

      <div className="space-y-3">
        {error && (
          <p className="rounded-[8px] border border-red-500/25 bg-red-500/10 px-3 py-2 text-[13px] leading-5 text-red-200">
            {error}
          </p>
        )}

        <label className="sr-only" htmlFor="login-workspace">Workspace</label>
        <div className="relative">
          <input
            id="login-workspace"
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

        <label className="sr-only" htmlFor="login-email">Work email</label>
        <div className="relative">
          <input
            id="login-email"
            type="email"
            className={inputClassName(fieldErrors.email)}
            placeholder="Enter your email"
            value={email}
            aria-invalid={fieldErrors.email ? "true" : "false"}
            onChange={(e) => {
              setEmail(e.target.value)
              clearFieldError("email")
            }}
          />
          {fieldErrors.email && (
            <AlertCircle
              className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-rose-300"
              aria-hidden="true"
            />
          )}
        </div>

        <label className="sr-only" htmlFor="login-password">Password</label>
        <div className="relative">
          <input
            id="login-password"
            type={showPassword ? "text" : "password"}
            className={passwordInputClassName(fieldErrors.password)}
            placeholder="Enter your password"
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
          {loading ? "Logging in..." : "Login"}
        </button>
      </div>

      <div className="mt-5 flex items-center justify-between text-[13px] font-medium">
        <Link
          to={`/forgot-password${workspace.trim() ? `?workspace=${encodeURIComponent(workspace.trim())}` : ""}`}
          className="text-white/45 transition hover:text-white/80"
        >
          Forgot password?
        </Link>
        <Link to="/signup" className="text-white/45 transition hover:text-white/80">
          Create account
        </Link>
      </div>
    </form>
  )
}

export default Login

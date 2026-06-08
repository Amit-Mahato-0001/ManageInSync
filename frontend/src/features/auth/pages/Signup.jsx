import { useState } from "react"
import { Link, useNavigate } from "react-router-dom"
import toast from "react-hot-toast"
import { AlertCircle, Eye, EyeOff } from "lucide-react"
import { FcGoogle } from "react-icons/fc"
import manageInSyncLogo from "@/shared/assets/M-logo.png"
import authApi from "../api/auth"
import { useAuth } from "../hooks/useAuth"

const EMAIL_PATTERN = /^\S+@\S+\.\S+$/
const MIN_PASSWORD_LENGTH = 8

const Signup = () => {
  const { login } = useAuth()
  const navigate = useNavigate()

  const [agencyName, setAgencyName] = useState("")
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [showPassword, setShowPassword] = useState(false)

  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
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

  const handleSubmit = async (e) => {
    e.preventDefault()

    const safeAgencyName = agencyName.trim()
    const safeEmail = email.trim()

    const nextFieldErrors = {}

    if (!safeAgencyName) nextFieldErrors.agencyName = true

    if (!safeEmail || !EMAIL_PATTERN.test(safeEmail)) {
      nextFieldErrors.email = true
    }

    if (!password || password.length < MIN_PASSWORD_LENGTH) {
      nextFieldErrors.password = true
    }

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
        authApi.signupApi({
          agencyName: safeAgencyName,
          email: safeEmail,
          password,
        }),
        {
          loading: "Creating account...",
          success: "Workspace created successfully",
          error: (requestError) =>
            requestError?.response?.data?.error || "Signup failed",
        }
      )

      login(res.data)
      navigate("/")
    } catch {
      setFieldErrors({
        agencyName: true,
        email: true,
        password: true,
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

  const passwordInputClassName = (hasError) =>
    [
      "h-11 w-full rounded-[8px] border px-4 text-[14px] font-medium text-white outline-none transition placeholder:text-[#8b8b8b]",
      hasError
        ? "border-rose-500 bg-rose-950/45 pr-20 text-rose-300 placeholder:text-rose-300/65 focus:border-rose-400 focus:bg-rose-950/55"
        : "border-transparent bg-[#2b2b2b] pr-11 focus:border-white/25 focus:bg-[#303030]",
    ].join(" ")

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
          Create Your Workspace.
        </p>
      </div>

      <button
        type="button"
        className="flex h-11 w-full items-center justify-center gap-3 rounded-[8px] bg-white px-4 text-[14px] font-semibold text-[#111] transition hover:bg-zinc-200"
      >
        <FcGoogle className="text-[18px]" />
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

        <div className="relative">
          <input
            className={inputClassName(fieldErrors.agencyName)}
            placeholder="Enter workspace name"
            value={agencyName}
            onChange={(e) => {
              setAgencyName(e.target.value)
              clearFieldError("agencyName")
            }}
          />

          {fieldErrors.agencyName && (
            <AlertCircle className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-rose-300" />
          )}
        </div>

        <div className="relative">
          <input
            type="email"
            className={inputClassName(fieldErrors.email)}
            placeholder="Enter your email"
            value={email}
            onChange={(e) => {
              setEmail(e.target.value)
              clearFieldError("email")
            }}
          />

          {fieldErrors.email && (
            <AlertCircle className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-rose-300" />
          )}
        </div>

        <div className="relative">
          <input
            type={showPassword ? "text" : "password"}
            className={passwordInputClassName(fieldErrors.password)}
            placeholder="Minimum 8 characters"
            value={password}
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
            onClick={() => setShowPassword((prev) => !prev)}
          >
            {showPassword ? (
              <EyeOff className="h-4 w-4" />
            ) : (
              <Eye className="h-4 w-4" />
            )}
          </button>

          {fieldErrors.password && (
            <AlertCircle className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-rose-300" />
          )}
        </div>

        <button
          type="submit"
          disabled={loading}
          className="h-11 w-full rounded-[8px] bg-[#2b2b2b] px-4 text-[14px] font-bold text-white transition hover:bg-[#383838] disabled:cursor-not-allowed disabled:opacity-60"
        >
          {loading ? "Creating..." : "Create"}
        </button>
      </div>

      <div className="mt-5 flex items-center justify-center text-[13px] font-medium">
        <p className="text-white/45">
          Already have an account?{" "}
          <Link
            to="/login"
            className="text-white transition hover:text-white/80"
          >
            Login
          </Link>
        </p>
      </div>
    </form>
  )
}

export default Signup
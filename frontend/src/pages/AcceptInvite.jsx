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

  const handleSubmit = async(e) => {

    e.preventDefault()
    const inviteToken = token?.trim()

    if(!inviteToken){
      setError("Invite link is invalid. Please request a new invite.")
      return
    }

    if(password.length < 8){
      setError("Password must be at least 8 characters")
      return
    }

    setLoading(true)
    setError("")

    try {
      await authApi.acceptInviteApi({ token: inviteToken, password})
      navigate('/login')
    } catch (error) {
      setError(
        error.response?.data?.message || "Failed to accept invite"
      )
    } finally {
      setLoading(false)
    }
  }

  return(

    <div className="w-full max-w-md">

      <p className="text-xs font-semibold text-blue-500 tracking-wide mb-2">
        AGENCY OS
      </p>

      <h1 className="text-4xl font-bold text-gray-900 mb-4">
        Set your password
      </h1>

      <p className="text-gray-500 text-sm mb-8">
        Create a secure password to activate your account.
      </p>

      <form onSubmit={handleSubmit} className="space-y-4">

        {error && (
          <p className="text-red-500 text-sm">{error}</p>
        )}

        <input
          type="password"
          placeholder='Create password'
          value={password}
          minLength={8}
          onChange={(e) => setPassword(e.target.value)}
          className="w-full rounded-lg border border-gray-300 px-4 py-3 hover:outline-none hover:ring-2 hover:ring-blue-500"
        />

        <div className="flex items-center justify-between pt-2">
          <button
            disabled={loading}
            className="px-14 py-2 rounded-full bg-blue-500 hover:bg-blue-700 text-white font-medium disabled:opacity-50"
          >
            {loading ? "Setting..." : "Set password"}
          </button>
        </div>

      </form>

    </div>
  )
}
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

        <div>

            <form onSubmit={handleSubmit}
            className='p-6 rounded shadow w-94'>

                <h1 className='text-xl font-bold mb-4'>Set your password</h1>

                {error && (

                    <p className='text-red-500 text-sm mb-2'>{error}</p>

                )}

                <input type="password"
                placeholder='Create password'
                value={password}
                className='w-full border p-2 mb-4 rounded'
                minLength={8}
                onChange={(e) => setPassword(e.target.value)}
                 />

                <button
                disabled={loading}
                className='w-full bg-black text-white py-2 rounded'>

                    {loading ? "Setting..." : "Set password"}

                </button>

            </form>

        </div>
    )
}

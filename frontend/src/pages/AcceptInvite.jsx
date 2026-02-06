import { useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import acceptInviteApi from '../api/auth'

export default function AcceptInvite () {

    const [params] = useSearchParams()
    const token = params.get("token")
    const navigate = useNavigate()

    const [password, setPassword] = useState("")
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState("")

    const handleSubmit = async(e) => {

        e.preventDefault()
        setLoading(true)
        setError("")

        try {
            
            await acceptInviteApi({ token, password})

            navigate('/login')

        } catch (error) {
            
            setError("Invite expired or invalid")

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
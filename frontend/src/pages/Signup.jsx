import { useState } from 'react'
import authApi from '../api/auth'
import { useAuth } from '../context/AuthContext'
import { useNavigate } from 'react-router-dom'

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
        setLoading(true)
        setError("")

        try {
            
            const res = await authApi.signupApi({
                agencyName,
                email,
                password
            })

            console.log(res.data)

            login(res.data.token) // for auto login

            navigate('/')
            
        } catch (error) {
            
            console.log(error)
            setError("signup failed")

        } finally{

            setLoading(false)
        }
    }

  return (

    <form 
    className='p-6 rounded-lg shadow w-90'
    onSubmit={handleSubmit}>

        <h1 className='text-2xl font-bold mb-4'>Signup</h1>
        
        {error && (

            <p className='text-red-500 text-sm mb-2'>{error}</p>
        )}

        <input 
        className='w-full border p-2 mb-4 rounded'
        placeholder='Enter agency name'
        value={agencyName}
        onChange={(e) => setAgencyName(e.target.value)}/>

        <input 
        className='w-full border p-2 mb-4 rounded'
        placeholder='Enter your email'
        value={email}
        onChange={(e) => setEmail(e.target.value)}/>

        <input 
        className='w-full border p-2 mb-4 rounded'
        type='password'
        placeholder='Enter your password'
        value={password}
        onChange={(e) => setPassword(e.target.value)}/>

        <button
        disabled={loading}
        className='w-full bg-black text-white py-2 rounded disabled:opacity-50'>
            {loading ? "Creating..." : "Create Account"}
        </button>
    </form>
  )
}

export default Signup
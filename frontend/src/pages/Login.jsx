import React, { useState } from 'react'
import authApi from '../api/auth'
import { useAuth } from '../context/AuthContext'
import { useNavigate } from 'react-router-dom'

const Login = () => {

  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")

  const { login } = useAuth()
  const navigate = useNavigate()

  const handleSubmit = async (e) => {

    e.preventDefault()
    setError("")
    setLoading(true)

    try {

      const res = await authApi.loginApi({ email, password })
      login(res.data.token)
      navigate('/')

    } catch (err) {

      setError("Invalid email or password")

    } finally {

      setLoading(false)

    }
  }

  return (

    <form 
    onSubmit={handleSubmit}
    className='p-4 rounded-lg shadow w-95'>

      <h1 className='text-2xl font-bold mb-4'>Login</h1>

      {error && (
        <p className='text-red-500 text-sm mb-4'>{error}</p>
      )}

      <input 
      className='w-full border p-2 mb-4 rounded'
      placeholder='Email'
      value={email}
      onChange={(e) => setEmail(e.target.value)} />

      <input
      className='w-full border p-2 mb-4 rounded'
      type='password'
      placeholder='Password'
      value={password}
      onChange={(e) => setPassword(e.target.value)} />

      <button 
      disabled={loading}
      className='w-full bg-black text-white py-2 rounded disabled:opacity-50'>

        {loading ? "Logging in..." : "Login"}

      </button>

    </form>
  )
}

export default Login
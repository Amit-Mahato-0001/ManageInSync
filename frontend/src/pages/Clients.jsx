import { useState, useEffect } from "react"
import {
  fetchClients,
  inviteClient as inviteClientAPI,
  deleteClient as deleteClientAPI
} from "../api/clients"

const Clients = () => {

  const [clients, setClients] = useState([])
  const [loading, setLoading] = useState(true)
  const [inviteLoading, setInviteLoading] = useState(false)

  const [email, setEmail] = useState("")
  const [error, setError] = useState("")
  const [message, setMessage] = useState("")

  useEffect(() => {

    loadClients()

  }, [])

  const loadClients = async () => {

    try {
      setLoading(true)
      const res = await fetchClients()
      setClients(res.data.clients)

    } catch (error) {

      console.error("Failed to load clients", error)
      setError("Failed to load clients")

    } finally {

      setLoading(false)
    }

  }

  const handleSubmit = async (e) => {

    e.preventDefault()

    if (!email.trim()) return

    try {
      setInviteLoading(true)
      setError("")
      setMessage("")

      await inviteClientAPI({ email })

      setMessage("Invite sent successfully")
      setEmail("")
      loadClients()

    } catch (error) {

      setError(
        error.response?.data?.message || "Failed to send invite"
      )

    } finally {

      setInviteLoading(false)

    }
    
  }

  const handleDelete = async (clientId) => {

    const confirmDelete = window.confirm(
      "Are you sure you want to permanently delete this client?"
    )

    if (!confirmDelete) return

    try {

      await deleteClientAPI(clientId)

      setClients(prev =>
        prev.filter(c => c._id !== clientId)
      )

    } catch (error) {
        
      alert(
        error.response?.data?.message ||
        "Failed to delete client"
      )
    }
  }

  if (loading) return <p>Loading clients...</p>

  return (
    <div>

      <h1 className="text-2xl font-bold mb-4">Clients</h1>

      <form
        onSubmit={handleSubmit}
        className="flex gap-3 mb-6"
      >

        <input
          type="email"
          placeholder="Client email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          className="border p-2 rounded w-60"
        />

        <button
          disabled={inviteLoading}
          className="bg-black text-white px-4 rounded"
        >
          {inviteLoading ? "Inviting..." : "Invite Client"}
        </button>

      </form>

      {message && (
        <p className="text-green-600 mb-4">{message}</p>
      )}

      {error && (
        <p className="text-red-500 mb-4">{error}</p>
      )}

      <div className="space-y-3">

        {clients.map((c) => (

          <div
            key={c._id}
            className="p-4 rounded shadow flex items-center justify-between bg-white"
          >

            <span className="font-medium">{c.email}</span>

            <button
              onClick={() => handleDelete(c._id)}
              className="px-3 py-2 rounded-full bg-blue-500 hover:bg-blue-700 text-white font-medium disabled:opacity-50"
            >
              Remove
            </button>

          </div>
        ))}

        {clients.length === 0 && (
          <p className="text-gray-500">
            No clients invited yet
          </p>
        )}

      </div>

    </div>
  )
}

export default Clients
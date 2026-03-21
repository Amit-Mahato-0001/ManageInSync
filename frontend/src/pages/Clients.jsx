import { useState, useEffect } from "react"
import {
  fetchClients,
  inviteClient as inviteClientAPI,
  deleteClient as deleteClientAPI
} from "../api/clients"
import { triggerDashboardRefresh } from "../utils/dashboardRefresh"
import { Plus, Trash2, User2 } from "lucide-react"

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

      const tenantId = localStorage.getItem("tenantId")
      const role = "client"

      await inviteClientAPI({ email, tenantId, role })

      setMessage("Invite sent successfully")
      setEmail("")
      loadClients()
      triggerDashboardRefresh()

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
      triggerDashboardRefresh()

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

      {/* invite form */}
      <form
        onSubmit={handleSubmit}
        className="flex gap-2 mb-6"
      >

        <input
          type="email"
          placeholder="Client email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          className="border border-gray-300 rounded-full p-2 w-64 hover:border-blue-500 focus:border-blue-500 focus:outline-none"
        />

        <button
          disabled={inviteLoading}
          className="h-10 w-10 flex items-center justify-center rounded-full bg-blue-500 text-white hover:bg-blue-600 transition shadow-sm disabled:opacity-50"
        >
          <Plus size={18} />
        </button>

      </form>

      {message && (
        <p className="text-green-600 mb-4">{message}</p>
      )}

      {error && (
        <p className="text-red-500 mb-4">{error}</p>
      )}

      {/* client list */}
      <div className="space-y-4">

        {clients.map((c) => (

          <div
            key={c._id}
            className="p-4 rounded-lg shadow relative"
          >

            <div className="flex justify-between items-center">

              <div className="flex items-center gap-2">
                <User2
                  size={18}
                  className="bg-blue-200 text-blue-600 rounded-full"
                />
                <span className="font-medium">{c.email}</span>
              </div>

              <button
                onClick={() => handleDelete(c._id)}
                className="text-red-500 text-sm"
              >
                <Trash2
                  size={34}
                  className="bg-red-200 p-1 text-red-500 rounded-full hover:bg-red-300 hover:text-red-600 transition shadow-sm"
                />
              </button>

            </div>

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
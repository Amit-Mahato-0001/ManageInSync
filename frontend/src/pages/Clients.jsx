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
    } catch (err) {
      console.error(err)
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

    } catch (err) {
      setError(err.response?.data?.message || "Failed to send invite")
    } finally {
      setInviteLoading(false)
    }
  }

  const handleDelete = async (clientId) => {

    if (!confirm("Delete this client?")) return

    try {
      await deleteClientAPI(clientId)

      setClients(prev =>
        prev.filter(c => c._id !== clientId)
      )

      triggerDashboardRefresh()

    } catch (err) {
      alert("Failed to delete client")
    }
  }

  if (loading) return <p>Loading clients...</p>

  return (
    <div className="space-y-6">

      {/* HEADER */}
      <div>
        <h1 className="text-2xl font-semibold">Clients</h1>
        <p className="text-sm text-white/60">
          Manage and invite your clients
        </p>
      </div>

      {/* INVITE FORM */}
      <form onSubmit={handleSubmit} className="flex gap-3">

        <input
          type="email"
          placeholder="Client email..."
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          className="border border-white/10 px-4 py-2 rounded-md text-sm w-72 outline-none"
        />

        <button
          disabled={inviteLoading}
          className="h-10 w-10 flex items-center justify-center rounded-md bg-blue-600 disabled:opacity-50"
        >
          <Plus size={16} />
        </button>

      </form>

      {message && <p className="text-green-400 text-sm">{message}</p>}
      {error && <p className="text-red-500 text-sm">{error}</p>}

      {/* CLIENT LIST */}
      <div className="space-y-3">

        {clients.map((c) => (

          <div
            key={c._id}
            className="flex items-center justify-between rounded-xl p-5 border border-white/10 bg-gradient-to-br from-[#18181B] to-[#09090B]"
          >

            {/* LEFT */}
            <div className="flex items-center gap-2 text-sm">

              <User2 className="w-4 h-4 text-blue-400" />

              <span>{c.email}</span>

            </div>

            {/* DELETE */}
            <button onClick={() => handleDelete(c._id)}>
              <Trash2 className="w-4 h-4 text-red-400" />
            </button>

          </div>

        ))}

        {clients.length === 0 && (
          <p className="text-sm text-white/40">
            No clients invited yet
          </p>
        )}

      </div>

    </div>
  )
}

export default Clients
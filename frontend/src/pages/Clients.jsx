import { useState, useEffect } from "react"
import {
  fetchClients,
  inviteClient as inviteClientAPI,
  deleteClient as deleteClientAPI
} from "../api/clients"
import { triggerDashboardRefresh } from "../utils/dashboardRefresh"
import { Trash2, User2 } from "lucide-react"
import InviteEntityModal from "../components/InviteEntityModal"

const Clients = () => {

  const [clients, setClients] = useState([])
  const [loading, setLoading] = useState(true)
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

  const handleSubmit = async (email) => {

    const safeEmail = email.trim()

    if (!safeEmail) {

      throw new Error("Client email required")

    }

    try {

      setError("")
      setMessage("")

      const tenantId = localStorage.getItem("tenantId")
      const role = "client"

      await inviteClientAPI({ email: safeEmail, tenantId, role })

      setMessage("Invite sent successfully")
      await loadClients()
      triggerDashboardRefresh()

    } catch (error) {

      throw new Error(error?.response?.data?.message || "Failed to send invite")

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

    } catch {

      alert("Failed to delete client")

    }

  }

  if (loading) return <p>Loading clients...</p>

  return (

    <div className="space-y-6">

      {/* header */}
      <div>

        <h1 className="text-2xl font-semibold">Clients</h1>

        <p className="text-sm text-white/60">
          Manage and invite your clients
        </p>

      </div>

      <InviteEntityModal
        entityLabel="Client"
        description="Send an invite to add a new client"
        placeholder="Enter client email..."
        onSubmit={handleSubmit}
      />

      {message && <p className="text-green-400 text-sm">{message}</p>}

      {error && <p className="text-red-500 text-sm">{error}</p>}

      {/* client list */}

      <div className="space-y-3">

        {clients.map((c) => (

          <div
            key={c._id}
            className="flex items-center justify-between rounded-xl p-5 border border-white/10 bg-gradient-to-br from-[#18181B] to-[#09090B]"
          >

            {/* left */}
            <div className="flex items-center gap-2 text-sm">

              <User2 className="w-4 h-4 text-blue-400" />

              <span>{c.email}</span>

            </div>

            {/* delete */}

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

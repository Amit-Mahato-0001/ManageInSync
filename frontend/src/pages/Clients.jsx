import { useState, useEffect } from "react"
import toast from "react-hot-toast"
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
  const [deletingClientId, setDeletingClientId] = useState(null)

  useEffect(() => {

    loadClients()

  }, [])

  const loadClients = async ({ showLoader = true, throwOnError = false } = {}) => {

    try {

      if (showLoader) {
        setLoading(true)
      }

      const res = await fetchClients()
      setClients(res.data.clients)
      setError("")

    } catch (err) {

      console.error(err)
      setError("Failed to load clients")

      if (throwOnError) {
        throw err
      }

    } finally {

      if (showLoader) {
        setLoading(false)
      }
    }

  }

  const handleSubmit = async (email) => {

    const safeEmail = email.trim()

    if (!safeEmail) {

      throw new Error("Client email required")

    }

    try {

      setError("")

      const tenantId = localStorage.getItem("tenantId")
      const role = "client"

      await toast.promise(
        (async () => {
          await inviteClientAPI({ email: safeEmail, tenantId, role })
          await loadClients({ showLoader: false, throwOnError: true })
          triggerDashboardRefresh()
        })(),
        {
          loading: "Sending client invite...",
          success: "Client invite sent",
          error: (requestError) =>
            requestError?.response?.data?.message || "Failed to send invite",
        }
      )

    } catch (error) {

      throw new Error(error?.response?.data?.message || "Failed to send invite")

    }

  }

  const handleDelete = async (clientId) => {

    if (!confirm("Delete this client?")) return

    try {
      setDeletingClientId(clientId)

      await toast.promise(
        (async () => {
          await deleteClientAPI(clientId)

          setClients((prev) =>
            prev.filter((client) => client._id !== clientId)
          )

          triggerDashboardRefresh()
        })(),
        {
          loading: "Deleting client...",
          success: "Client deleted",
          error: "Failed to delete client",
        }
      )
    } catch {
      return
    } finally {
      setDeletingClientId(null)

    }

  }

  if (loading) return <p>Loading clients...</p>

  return (

    <div className="space-y-6">

      {/* header */}
      <div>

        <h1 className="text-5xl font-semibold">Clients</h1>

        <p className="text-2xl text-white/60">
          Manage and invite your clients
        </p>

      </div>

      <InviteEntityModal
        entityLabel="Client"
        description="Send an invite to add a new client"
        placeholder="Enter client email..."
        onSubmit={handleSubmit}
      />

      {error && <p className="text-red-500 text-2xl">{error}</p>}

      {/* client list */}

      <div className="space-y-3">

        {clients.map((c) => (

          <div
            key={c._id}
            className="flex items-center justify-between rounded-xl p-5 border border-white/10 bg-gradient-to-br from-[#18181B] to-[#09090B]"
          >

            {/* left */}
            <div className="flex items-center gap-4 text-2xl">

              <User2 className="w-6 h-6" />

              <span>{c.email}</span>

            </div>

            {/* delete */}

            <button
              onClick={() => handleDelete(c._id)}
              disabled={deletingClientId === c._id}
              className="disabled:cursor-not-allowed disabled:opacity-60"
            >

              <div className="p-2 rounded-lg border border-white/10 bg-gradient-to-br from-[#18181B] to-red-500">
                <Trash2 className="h-6 w-6" />
              </div>

            </button>

          </div>

        ))}

        {clients.length === 0 && (

          <p className="text-2xl text-white/40">
            No clients invited yet
          </p>

        )}

      </div>

    </div>
  )
}

export default Clients

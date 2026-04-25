import { useEffect, useState } from "react"
import toast from "react-hot-toast"
import {
  fetchClients,
  inviteClient as inviteClientAPI,
  deleteClient as deleteClientAPI
} from "../api/clients"
import { triggerDashboardRefresh } from "@/shared/utils/dashboardRefresh"
import { Trash2, User2 } from "lucide-react"
import InviteEntityModal from "@/shared/components/InviteEntityModal"

const Clients = () => {
  const [clients, setClients] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const [deletingClientId, setDeletingClientId] = useState("")

  useEffect(() => {
    loadClients()
  }, [])

  const loadClients = async () => {
    try {
      setLoading(true)
      const response = await fetchClients({ includeInvited: true })
      setClients(response.data.clients)
      setError("")
    } catch (error) {
      console.error(error)
      setError("Failed to load clients")
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (email) => {
    const clientEmail = email.trim()

    if (!clientEmail) {
      throw new Error("Client email required")
    }

    const toastId = toast.loading("Adding client...")

    try {
      setError("")
      await inviteClientAPI({ email: clientEmail })

      const response = await fetchClients({ includeInvited: true })
      setClients(response.data.clients)

      triggerDashboardRefresh()
      toast.success("Client added", { id: toastId })
    } catch (error) {
      console.error(error)
      const message = error?.response?.data?.message || "Failed to add client"
      toast.error(message, { id: toastId })
      throw new Error(message)
    }
  }

  const handleDelete = async (client) => {
    if (!window.confirm("Delete this client?")) {
      return
    }

    const toastId = toast.loading("Deleting client...")

    try {
      setDeletingClientId(client._id)
      await deleteClientAPI(client._id)

      const response = await fetchClients({ includeInvited: true })
      setClients(response.data.clients)

      triggerDashboardRefresh()
      toast.success("Client deleted", { id: toastId })
    } catch (error) {
      console.error(error)
      toast.error(
        error?.response?.data?.message || "Failed to delete client",
        { id: toastId }
      )
    } finally {
      setDeletingClientId("")
    }
  }

  if (loading) {
    return <p>Loading clients...</p>
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-5xl font-semibold">Clients</h1>
          <p className="text-2xl text-white/60">Add and remove your clients</p>
        </div>

        <InviteEntityModal
          entityLabel="Client"
          description="Add a new client to your workspace"
          placeholder="Enter client email..."
          onSubmit={handleSubmit}
        />
      </div>

      {error && <p className="text-red-500 text-2xl">{error}</p>}

      <div className="space-y-3">
        {clients.map((client) => (
          <div
            key={client._id}
            className="flex flex-col gap-4 rounded-xl border border-white/10 bg-gradient-to-br from-[#18181B] to-[#09090B] p-5 md:flex-row md:items-center md:justify-between"
          >
            <div className="flex min-w-0 items-center gap-4 text-2xl">
              <User2 className="h-6 w-6 shrink-0" />
              <p className="break-all">{client.email}</p>
            </div>

            <div className="flex items-center gap-3 md:justify-end">
              <button
                onClick={() => handleDelete(client)}
                disabled={deletingClientId === client._id}
                className="disabled:cursor-not-allowed disabled:opacity-60"
              >
                <div className="rounded-lg border border-white/10 bg-gradient-to-br from-[#18181B] to-red-500 p-2">
                  <Trash2 className="h-6 w-6" />
                </div>
              </button>
            </div>
          </div>
        ))}

        {clients.length === 0 && (
          <p className="text-2xl text-white/40">No clients added yet</p>
        )}
      </div>
    </div>
  )
}

export default Clients

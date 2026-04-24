import { useState, useEffect } from "react"
import toast from "react-hot-toast"
import {
  fetchClients,
  inviteClient as inviteClientAPI,
  deleteClient as deleteClientAPI
} from "../api/clients"
import { triggerDashboardRefresh } from "@/shared/utils/dashboardRefresh"
import { RefreshCcw, Trash2, User2 } from "lucide-react"
import InviteEntityModal from "@/shared/components/InviteEntityModal"

const formatInviteExpiry = (value) => {
  if (!value) {
    return ""
  }

  const date = new Date(value)

  if (Number.isNaN(date.getTime())) {
    return ""
  }

  return date.toLocaleDateString()
}

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

      const res = await fetchClients({ includeInvited: true })
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
      const existingClient = clients.find(
        (client) => client.email === safeEmail && client.status === "invited"
      )

      await toast.promise(
        (async () => {
          await inviteClientAPI({ email: safeEmail })
          await loadClients({ showLoader: false, throwOnError: true })
          triggerDashboardRefresh()
        })(),
        {
          loading: "Sending client invite...",
          success: existingClient ? "Client invite resent" : "Client invite sent",
          error: (requestError) =>
            requestError?.response?.data?.message || "Failed to send invite",
        }
      )

    } catch (error) {

      throw new Error(error?.response?.data?.message || "Failed to send invite")

    }

  }

  const handleDelete = async (client) => {

    const isInvited = client.status === "invited"

    if (!confirm(isInvited ? "Revoke this client invite?" : "Delete this client?")) return

    try {
      setDeletingClientId(client._id)

      await toast.promise(
        (async () => {
          await deleteClientAPI(client._id)

          setClients((prev) =>
            prev.filter((currentClient) => currentClient._id !== client._id)
          )

          triggerDashboardRefresh()
        })(),
        {
          loading: isInvited ? "Revoking invite..." : "Deleting client...",
          success: isInvited ? "Client invite revoked" : "Client deleted",
          error: isInvited ? "Failed to revoke invite" : "Failed to delete client",
        }
      )
    } catch {
      return
    } finally {
      setDeletingClientId(null)

    }

  }

  const handleResendInvite = async (clientEmail) => {
    try {
      await toast.promise(
        (async () => {
          await inviteClientAPI({ email: clientEmail })
          await loadClients({ showLoader: false, throwOnError: true })
        })(),
        {
          loading: "Resending invite...",
          success: "Invite resent",
          error: (requestError) =>
            requestError?.response?.data?.message || "Failed to resend invite"
        }
      )
    } catch {
      return
    }
  }

  if (loading) return <p>Loading clients...</p>

  return (

    <div className="space-y-6">

      {/* header */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">

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

      </div>

      {error && <p className="text-red-500 text-2xl">{error}</p>}

      {/* client list */}

      <div className="space-y-3">

        {clients.map((c) => {
          const isInvited = c.status === "invited"
          const inviteExpiry = formatInviteExpiry(c.inviteTokenExpires)

          return (
            <div
              key={c._id}
              className="flex items-center justify-between rounded-xl p-5 border border-white/10 bg-gradient-to-br from-[#18181B] to-[#09090B]"
            >

              {/* left */}
              <div className="flex items-center gap-4 text-2xl">

                <User2 className="w-6 h-6" />

                <div className="space-y-1">
                  <p>{c.email}</p>
                  <div className="flex flex-wrap items-center gap-2 text-base text-white/50">
                    <span className={`rounded-full px-2 py-0.5 ${isInvited ? "bg-amber-500/15 text-amber-300" : "bg-emerald-500/15 text-emerald-300"}`}>
                      {isInvited ? "Invited" : "Active"}
                    </span>

                    {isInvited && inviteExpiry && (
                      <span>Expires {inviteExpiry}</span>
                    )}
                  </div>
                </div>

              </div>

              {/* delete */}

              <div className="flex items-center gap-3">
                {isInvited && (
                  <button
                    onClick={() => handleResendInvite(c.email)}
                    className="inline-flex items-center gap-2 rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-2xl"
                  >
                    <RefreshCcw className="h-5 w-5" />
                    Resend
                  </button>
                )}

                <button
                  onClick={() => handleDelete(c)}
                  disabled={deletingClientId === c._id}
                  className="disabled:cursor-not-allowed disabled:opacity-60"
                >

                  <div className="p-2 rounded-lg border border-white/10 bg-gradient-to-br from-[#18181B] to-red-500">
                    <Trash2 className="h-6 w-6" />
                  </div>

                </button>
              </div>

            </div>
          )
        })}

        {clients.length === 0 && (

          <p className="text-2xl text-white/40">
            No clients or pending invites yet
          </p>

        )}

      </div>

    </div>
  )
}

export default Clients

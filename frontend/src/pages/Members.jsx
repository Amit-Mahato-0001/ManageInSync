import { useEffect, useState } from "react"
import toast from "react-hot-toast"
import { deleteMember, fetchMembers, inviteMember } from "../api/members"
import { triggerDashboardRefresh } from "../utils/dashboardRefresh"
import { Trash2, User2 } from "lucide-react"
import InviteEntityModal from "../components/InviteEntityModal"

const Members = () => {

  const [members, setMembers] = useState([])
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(true)
  const [deletingMemberId, setDeletingMemberId] = useState(null)

  useEffect(() => {

    loadMembers()

  }, [])

  const loadMembers = async ({ showLoader = true, throwOnError = false } = {}) => {

    try {

      if (showLoader) {
        setLoading(true)
      }

      const res = await fetchMembers()
      setMembers(res.data.members)
      setError("")

    } catch (err) {

      console.error(err)
      setError("Failed to load members")

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
      throw new Error("Member email required")
    }

    try {

      setError("")

      const tenantId = localStorage.getItem("tenantId")
      const role = "member"

      await toast.promise(
        (async () => {
          await inviteMember({ email: safeEmail, tenantId, role })
          await loadMembers({ showLoader: false, throwOnError: true })
          triggerDashboardRefresh()
        })(),
        {
          loading: "Sending member invite...",
          success: "Member invite sent",
          error: (requestError) =>
            requestError?.response?.data?.message || "Failed to send invite",
        }
      )

    } catch (error) {

      throw new Error(error?.response?.data?.message || "Failed to send invite")

    }

  }

  const handleDelete = async (memberId) => {

    if (!confirm("Delete this member?")) return

    try {
      setDeletingMemberId(memberId)

      await toast.promise(
        (async () => {
          await deleteMember(memberId)

          setMembers((prev) =>
            prev.filter((member) => member._id !== memberId)
          )

          triggerDashboardRefresh()
        })(),
        {
          loading: "Deleting member...",
          success: "Member deleted",
          error: "Failed to delete member",
        }
      )
    } catch {
      return
    } finally {
      setDeletingMemberId(null)

    }

  }

  if (loading) return <p>Loading members...</p>

  return (

    <div className="space-y-6">

      {/* header */}

      <div>

        <h1 className="text-5xl font-semibold">Members</h1>

        <p className="text-2xl text-white/60">
          Manage your team members
        </p>
        
      </div>

      <InviteEntityModal
        entityLabel="Member"
        description="Send an invite to add a new team member"
        placeholder="Enter member email..."
        onSubmit={handleSubmit}
      />

      {error && <p className="text-red-500 text-2xl">{error}</p>}

      {/* members list */}
      <div className="space-y-3">

        {members.map((m) => (

          <div
            key={m._id}
            className="flex items-center justify-between rounded-xl p-5 border border-white/10 bg-gradient-to-br from-[#18181B] to-[#09090B]"
          >

            {/* left */}

            <div className="flex items-center gap-4 text-2xl">

              <User2 className="w-6 h-6" />

              <span>{m.email}</span>

            </div>

            {/* delete */}

            <button
              onClick={() => handleDelete(m._id)}
              disabled={deletingMemberId === m._id}
              className="disabled:cursor-not-allowed disabled:opacity-60"
            >

              <div className="p-2 rounded-lg border border-white/10 bg-gradient-to-br from-[#18181B] to-red-500">
                <Trash2 className="h-6 w-6" />
              </div>

            </button>

          </div>

        ))}

        {members.length === 0 && (

          <p className="text-2xl text-white/40">
            No members invited yet
          </p>

        )}

      </div>

    </div>
  )
}

export default Members

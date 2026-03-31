import { useEffect, useState } from "react"
import { deleteMember, fetchMembers, inviteMember } from "../api/members"
import { triggerDashboardRefresh } from "../utils/dashboardRefresh"
import { Trash2, User2 } from "lucide-react"
import InviteEntityModal from "../components/InviteEntityModal"

const Members = () => {

  const [members, setMembers] = useState([])
  const [error, setError] = useState("")
  const [message, setMessage] = useState("")
  const [loading, setLoading] = useState(true)

  useEffect(() => {

    loadMembers()

  }, [])

  const loadMembers = async () => {

    try {

      setLoading(true)
      const res = await fetchMembers()
      setMembers(res.data.members)

    } catch (err) {

      console.error(err)
      setError("Failed to load members")

    } finally {

      setLoading(false)

    }

  }

  const handleSubmit = async (email) => {
    const safeEmail = email.trim()

    if (!safeEmail) {
      throw new Error("Member email required")
    }

    try {

      setError("")
      setMessage("")

      const tenantId = localStorage.getItem("tenantId")
      const role = "member"

      await inviteMember({ email: safeEmail, tenantId, role })

      setMessage("Invite sent successfully")
      await loadMembers()
      triggerDashboardRefresh()

    } catch (error) {

      throw new Error(error?.response?.data?.message || "Failed to send invite")

    }

  }

  const handleDelete = async (memberId) => {

    if (!confirm("Delete this member?")) return

    try {

      await deleteMember(memberId)

      setMembers(prev =>
        prev.filter(m => m._id !== memberId)
      )

      triggerDashboardRefresh()

    } catch {

      alert("Failed to delete member")

    }

  }

  if (loading) return <p>Loading members...</p>

  return (

    <div className="space-y-6">

      {/* header */}

      <div>

        <h1 className="text-2xl font-semibold">Members</h1>

        <p className="text-sm text-white/60">
          Manage your team members
        </p>
        
      </div>

      <InviteEntityModal
        entityLabel="Member"
        description="Send an invite to add a new team member"
        placeholder="Enter member email..."
        onSubmit={handleSubmit}
      />

      {message && <p className="text-green-400 text-sm">{message}</p>}
      {error && <p className="text-red-500 text-sm">{error}</p>}

      {/* members list */}
      <div className="space-y-3">

        {members.map((m) => (

          <div
            key={m._id}
            className="flex items-center justify-between rounded-xl p-5 border border-white/10 bg-gradient-to-br from-[#18181B] to-[#09090B]"
          >

            {/* left */}

            <div className="flex items-center gap-2 text-sm">

              <User2 className="w-4 h-4 text-blue-400" />

              <span>{m.email}</span>

            </div>

            {/* delete */}

            <button onClick={() => handleDelete(m._id)}>
              <Trash2 className="w-4 h-4 text-red-400" />
            </button>

          </div>

        ))}

        {members.length === 0 && (

          <p className="text-sm text-white/40">
            No members invited yet
          </p>

        )}

      </div>

    </div>
  )
}

export default Members

import { useEffect, useState } from "react"
import { deleteMember, fetchMembers, inviteMember } from "../api/members"
import { triggerDashboardRefresh } from "../utils/dashboardRefresh"
import { Plus, Trash2, User2 } from "lucide-react"

const Members = () => {

  const [members, setMembers] = useState([])
  const [email, setEmail] = useState("")
  const [inviteLoading, setInviteLoading] = useState(false)

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

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!email.trim()) return

    try {
      setInviteLoading(true)
      setError("")
      setMessage("")

      const tenantId = localStorage.getItem("tenantId")
      const role = "member"

      await inviteMember({ email, tenantId, role })

      setMessage("Invite sent successfully")
      setEmail("")
      loadMembers()
      triggerDashboardRefresh()

    } catch (err) {
      setError(err.response?.data?.message || "Failed to send invite")
    } finally {
      setInviteLoading(false)
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

    } catch (err) {
      alert("Failed to delete member")
    }
  }

  if (loading) return <p>Loading members...</p>

  return (
    <div className="space-y-6">

      {/* HEADER */}
      <div>
        <h1 className="text-2xl font-semibold">Members</h1>
        <p className="text-sm text-white/60">
          Manage your team members
        </p>
      </div>

      {/* INVITE FORM */}
      <form onSubmit={handleSubmit} className="flex gap-3">

        <input
          type="email"
          placeholder="Member email..."
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

      {/* MEMBERS LIST */}
      <div className="space-y-3">

        {members.map((m) => (

          <div
            key={m._id}
            className="flex items-center justify-between rounded-xl p-5 border border-white/10 bg-gradient-to-br from-[#18181B] to-[#09090B]"
          >

            {/* LEFT */}
            <div className="flex items-center gap-2 text-sm">

              <User2 className="w-4 h-4 text-blue-400" />

              <span>{m.email}</span>

            </div>

            {/* DELETE */}
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
import { useEffect, useState } from "react"
import toast from "react-hot-toast"
import { deleteMember, fetchMembers, inviteMember } from "../api/members"
import { triggerDashboardRefresh } from "@/shared/utils/dashboardRefresh"
import { Trash2, User2 } from "lucide-react"
import InviteEntityModal from "@/shared/components/InviteEntityModal"

const Members = () => {
  const [members, setMembers] = useState([])
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(true)
  const [deletingMemberId, setDeletingMemberId] = useState("")

  useEffect(() => {
    loadMembers()
  }, [])

  const loadMembers = async () => {
    try {
      setLoading(true)
      const response = await fetchMembers()
      setMembers(response.data.members)
      setError("")
    } catch (error) {
      console.error(error)
      setError("Failed to load members")
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (email) => {
    const memberEmail = email.trim()

    if (!memberEmail) {
      throw new Error("Member email required")
    }

    const toastId = toast.loading("Sending invite...")

    try {
      setError("")
      await inviteMember({ email: memberEmail })

      const response = await fetchMembers()
      setMembers(response.data.members)

      triggerDashboardRefresh()
      toast.success("Member invite sent", { id: toastId })
    } catch (error) {
      console.error(error)
      const message = error?.response?.data?.message || "Failed to add member"
      toast.error(message, { id: toastId })
      throw new Error(message)
    }
  }

  const handleDelete = async (member) => {
    if (!window.confirm("Delete this member?")) {
      return
    }

    const toastId = toast.loading("Deleting member...")

    try {
      setDeletingMemberId(member._id)
      await deleteMember(member._id)

      const response = await fetchMembers()
      setMembers(response.data.members)

      triggerDashboardRefresh()
      toast.success("Member deleted", { id: toastId })
    } catch (error) {
      console.error(error)
      toast.error(
        error?.response?.data?.message || "Failed to delete member",
        { id: toastId }
      )
    } finally {
      setDeletingMemberId("")
    }
  }

  if (loading) {
    return <p>Loading members...</p>
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-5xl font-semibold">Members</h1>
          <p className="text-2xl text-white/60">Invite and remove your team members</p>
        </div>

        <InviteEntityModal
          entityLabel="Member"
          description="Send an invite link to a new team member"
          placeholder="Enter member email..."
          onSubmit={handleSubmit}
        />
      </div>

      {error && <p className="text-red-500 text-2xl">{error}</p>}

      <div className="space-y-3">
        {members.map((member) => (
          <div
            key={member._id}
            className="flex flex-col gap-4 rounded-xl border border-white/10 bg-gradient-to-br from-[#18181B] to-[#09090B] p-5 md:flex-row md:items-center md:justify-between"
          >
            <div className="flex min-w-0 items-center gap-4 text-2xl">
              <User2 className="h-6 w-6 shrink-0" />
              <p className="break-all">{member.email}</p>
            </div>

            <div className="flex items-center gap-3 md:justify-end">
              <button
                onClick={() => handleDelete(member)}
                disabled={deletingMemberId === member._id}
                className="disabled:cursor-not-allowed disabled:opacity-60"
              >
                <div className="rounded-lg border border-white/10 bg-gradient-to-br from-[#18181B] to-red-500 p-2">
                  <Trash2 className="h-6 w-6" />
                </div>
              </button>
            </div>
          </div>
        ))}

        {members.length === 0 && (
          <p className="text-2xl text-white/40">No members added yet</p>
        )}
      </div>
    </div>
  )
}

export default Members

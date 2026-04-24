import { useEffect, useState } from "react"
import toast from "react-hot-toast"
import { deleteMember, fetchMembers, inviteMember } from "../api/members"
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

      const res = await fetchMembers({ includeInvited: true })
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
      const existingMember = members.find(
        (member) => member.email === safeEmail && member.status === "invited"
      )

      await toast.promise(
        (async () => {
          await inviteMember({ email: safeEmail })
          await loadMembers({ showLoader: false, throwOnError: true })
          triggerDashboardRefresh()
        })(),
        {
          loading: "Sending member invite...",
          success: existingMember ? "Member invite resent" : "Member invite sent",
          error: (requestError) =>
            requestError?.response?.data?.message || "Failed to send invite",
        }
      )

    } catch (error) {

      throw new Error(error?.response?.data?.message || "Failed to send invite")

    }

  }

  const handleDelete = async (member) => {
    const isInvited = member.status === "invited"

    if (!confirm(isInvited ? "Revoke this member invite?" : "Delete this member?")) return

    try {
      setDeletingMemberId(member._id)

      await toast.promise(
        (async () => {
          await deleteMember(member._id)

          setMembers((prev) =>
            prev.filter((currentMember) => currentMember._id !== member._id)
          )

          triggerDashboardRefresh()
        })(),
        {
          loading: isInvited ? "Revoking invite..." : "Deleting member...",
          success: isInvited ? "Member invite revoked" : "Member deleted",
          error: isInvited ? "Failed to revoke invite" : "Failed to delete member",
        }
      )
    } catch {
      return
    } finally {
      setDeletingMemberId(null)

    }

  }

  const handleResendInvite = async (memberEmail) => {
    try {
      await toast.promise(
        (async () => {
          await inviteMember({ email: memberEmail })
          await loadMembers({ showLoader: false, throwOnError: true })
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

  if (loading) return <p>Loading members...</p>

  return (

    <div className="space-y-6">

      {/* header */}

      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">

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

      </div>

      {error && <p className="text-red-500 text-2xl">{error}</p>}

      {/* members list */}
      <div className="space-y-3">

        {members.map((m) => {
          const isInvited = m.status === "invited"
          const inviteExpiry = formatInviteExpiry(m.inviteTokenExpires)

          return (
            <div
              key={m._id}
              className="flex items-center justify-between rounded-xl p-5 border border-white/10 bg-gradient-to-br from-[#18181B] to-[#09090B]"
            >

              {/* left */}

              <div className="flex items-center gap-4 text-2xl">

                <User2 className="w-6 h-6" />

                <div className="space-y-1">
                  <p>{m.email}</p>
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
                    onClick={() => handleResendInvite(m.email)}
                    className="inline-flex items-center gap-2 rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-2xl"
                  >
                    <RefreshCcw className="h-5 w-5" />
                    Resend
                  </button>
                )}

                <button
                  onClick={() => handleDelete(m)}
                  disabled={deletingMemberId === m._id}
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

        {members.length === 0 && (

          <p className="text-2xl text-white/40">
            No members or pending invites yet
          </p>

        )}

      </div>

    </div>
  )
}

export default Members

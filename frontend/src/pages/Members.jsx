import { useEffect, useState } from "react"
import { deleteMember, fetchMembers, inviteMember } from "../api/members"
import { triggerDashboardRefresh } from "../utils/dashboardRefresh"

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

        } catch (error) {

            console.error("Failed to load members", error)
            setError("Failed to load members")

        } finally{

            setLoading(false)
        }

    }

    const handleSubmit = async (e) => {

        e.preventDefault()

        if(!email.trim()) return

        try{
        
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

        } catch(error){

            setError(
                error.response?.data?.message || "Failed to send invite"
            )

        } finally{

            setInviteLoading(false)
        }

    }

    const handleDelete = async (memberId) => {

        const confirmDelete = window.confirm(

            "Are you sure you want to permanently delete this member?"
        )

        if(!confirmDelete) return

        try {
            
            await deleteMember(memberId)

            setMembers(prev => prev.filter(m => m._id !== memberId))
            triggerDashboardRefresh()

        } catch (error) {
            
            alert(
                error.response?.data?.message || "Failed to delete member"
            )
        }
    }

    if (loading) return <p>Loading members...</p>

    return (

        <div>

            <h1 className="mb-4 font-bold text-2xl">Members</h1>

            <form onSubmit={handleSubmit}
            className="flex gap-3 mb-6">

                <input 
                type="email"
                placeholder="Member email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="border p-2 rounded w-60"
                />

                <button
                disabled={inviteLoading}
                className="bg-black text-white px-4 rounded">

                    {inviteLoading ? "Inviting..." : "Invite Member"}

                </button>

            </form>

            {message && (

                <p className="text-green-600 mb-4">
                    {message}
                </p>

            )}

            {error && (
                <p className="text-red-500 mb-4">{error}</p>
            )}

            <div className="space-y-3">

                {members.map((m) => (

                    <div
                    key={m._id}
                    className="p-4 rounded shadow flex items-center justify-between bg-white">

                        <span className="font-medium">
                            {m.email}
                        </span>

                        <button
                        onClick={() => handleDelete(m._id)}
                        className="px-3 py-2 rounded-full bg-blue-500 hover:bg-blue-700 text-white font-medium disabled:opacity-50">
                            Remove
                        </button>

                    </div>
                ))}

                {
                    members.length === 0 && (

                        <p className="text-gray-500"> 
                            No members invited yet
                        </p>
                    )
                }
            </div>

        </div>
    )
}

export default Members

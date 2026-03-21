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

            {/* INVITE FORM */}
            <form 
                onSubmit={handleSubmit}
                className="flex gap-2 mb-6"
            >

                <input 
                    type="email"
                    placeholder="Member email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    className="border border-gray-300 rounded-full p-2 w-64 hover:border-blue-500 focus:border-blue-500 focus:outline-none"
                />

                <button
                    disabled={inviteLoading}
                    className="h-10 w-10 flex items-center justify-center rounded-full bg-blue-500 text-white hover:bg-blue-600 transition shadow-sm disabled:opacity-50"
                >
                    <Plus size={18} />
                </button>

            </form>

            {message && (
                <p className="text-green-600 mb-4">
                    {message}
                </p>
            )}

            {error && (
                <p className="text-red-500 mb-4">
                    {error}
                </p>
            )}

            {/* MEMBERS LIST */}
            <div className="space-y-4">

                {members.map((m) => (

                    <div
                        key={m._id}
                        className="p-4 rounded-lg shadow relative"
                    >

                        <div className="flex justify-between items-center">

                            <div className="flex items-center gap-2">
                                <User2
                                    size={18}
                                    className="bg-blue-200 text-blue-600 rounded-full"
                                />
                                <span className="font-medium">
                                    {m.email}
                                </span>
                            </div>

                            <button
                                onClick={() => handleDelete(m._id)}
                                className="text-red-500 text-sm"
                            >
                                <Trash2
                                    size={34}
                                    className="bg-red-200 p-1 text-red-500 rounded-full hover:bg-red-300 hover:text-red-600 transition shadow-sm"
                                />
                            </button>

                        </div>

                    </div>
                ))}

                {members.length === 0 && (
                    <p className="text-gray-500"> 
                        No members invited yet
                    </p>
                )}

            </div>

        </div>
    )
}

export default Members
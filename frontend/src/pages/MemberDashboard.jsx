import { useEffect, useState } from "react"
import { fetchProjects } from "../api/projects"

const MemberDashboard = () => {

    const [projects, setProjects] = useState([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState("")

    useEffect(() => {

        const loadProjects = async () => {

            try {

                const res = await fetchProjects({ page: 1, limit: 10 })
                const projectList = res.data?.projects?.data

                setProjects(Array.isArray(projectList) ? projectList : [])
                setError("")

            } catch (error) {

                console.error("Failed to fetch member projects", error)
                setError("Failed to load projects")

            } finally {

                setLoading(false)
            }
        }

        loadProjects()

    }, [])

    if(loading) return <p>Loading...</p>

    if(error) return <p className="text-red-500">{error}</p>
   
    return(

        <div>

            <h1 className="text-xl font-bold mb-4">Your projects</h1>

            { projects.length === 0 ? (

                <p className="text-gray-500">
                    No projects assigned yet
                </p>

            ) : (

                <div className="space-y-2">

                    {projects.map((p) => (

                        <div
                        key={p._id}
                        className="p-4 rounded shadow">

                            <p className="font-medium">{p.name}</p>

                        </div>
                    ))}
                </div>
            ) }
        </div>
    )
}

export default MemberDashboard

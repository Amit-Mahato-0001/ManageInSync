import { useEffect, useState } from "react"
import { fetchProjects } from "@/features/projects/api/projects"

const MemberDashboard = () => {
  const [projects, setProjects] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")

  useEffect(() => {
    loadProjects()
  }, [])

  const loadProjects = async () => {
    try {
      setLoading(true)

      const response = await fetchProjects({ page: 1, limit: 10 })
      let projectList = []

      if (
        response &&
        response.data &&
        response.data.projects &&
        Array.isArray(response.data.projects.data)
      ) {
        projectList = response.data.projects.data
      }

      setProjects(projectList)
      setError("")
    } catch (error) {
      console.error(error)
      setError("Failed to load projects")
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return <p>Loading...</p>
  }

  if (error) {
    return <p className="text-red-500">{error}</p>
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-5xl font-semibold">Your Projects</h1>
        <p className="text-2xl text-white/60">
          Projects you're currently working on
        </p>
      </div>

      {projects.length === 0 ? (
        <p className="text-2xl text-white/40">No projects assigned yet</p>
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {projects.map((project) => {
            let statusClassName = "bg-gradient-to-br from-[#18181B] to-gray-500"

            if (project.status === "active") {
              statusClassName = "bg-gradient-to-br from-[#18181B] to-green-500"
            }

            if (project.status === "on-hold") {
              statusClassName = "bg-gradient-to-br from-[#18181B] to-yellow-500"
            }

            return (
              <div
                key={project._id}
                className="space-y-3 rounded-xl border border-white/10 bg-gradient-to-br from-[#18181B] to-[#09090B] p-5"
              >
                <p className="font-medium">{project.name}</p>

                <span className={`rounded-lg px-2 py-1 text-2xl ${statusClassName}`}>
                  {project.status || "unknown"}
                </span>

                <p className="mt-2 text-2xl font-medium text-white/40">
                  Assigned project
                </p>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}

export default MemberDashboard

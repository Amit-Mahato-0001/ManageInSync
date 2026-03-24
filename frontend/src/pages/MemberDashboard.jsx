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

      } catch (err) {

        console.error(err)
        setError("Failed to load projects")

      } finally {

        setLoading(false)
      }
    }

    loadProjects()

  }, [])

  if (loading) return <p>Loading...</p>
  if (error) return <p className="text-red-500">{error}</p>

  return (

    <div className="space-y-6">

      {/* HEADER */}
      <div>
        <h1 className="text-2xl font-semibold">
          Your Projects
        </h1>

        <p className="text-sm text-white/60">
          Projects you're currently working on
        </p>
      </div>

      {/* PROJECT LIST */}
      {projects.length === 0 ? (

        <p className="text-sm text-white/40">
          No projects assigned yet
        </p>

      ) : (

        <div className="grid md:grid-cols-2 gap-4">

          {projects.map((p) => (

            <div
              key={p._id}
              className="rounded-xl p-5 border border-white/10 bg-gradient-to-br from-[#18181B] to-[#09090B] space-y-3"
            >

              {/* NAME */}
              <p className="font-medium">
                {p.name}
              </p>

              {/* STATUS */}
              <span className={`text-xs px-2 py-1 rounded-md ${
                p.status === "active"
                  ? "bg-green-500/10 text-green-400"
                  : p.status === "on-hold"
                  ? "bg-yellow-500/10 text-yellow-400"
                  : "bg-gray-500/10 text-gray-400"
              }`}>
                {p.status || "unknown"}
              </span>

              {/* OPTIONAL SUBTEXT */}
              <p className="text-xs text-white/40">
                Assigned project
              </p>

            </div>

          ))}

        </div>

      )}

    </div>
  )
}

export default MemberDashboard
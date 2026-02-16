import { useEffect, useState } from "react"
import {
  fetchProjects,
  createProject,
  deleteProject,
  assignClient
} from "../api/projects"
import { useAuth } from "../context/AuthContext"
import { fetchClients } from "../api/clients"

const Projects = () => {
  const { user } = useAuth()

  const [projects, setProjects] = useState([])
  const [clients, setClients] = useState([])
  const [name, setName] = useState("")
  const [loading, setLoading] = useState(true)

  const [openDropdown, setOpenDropdown] = useState(null)
  const [selectedClients, setSelectedClients] = useState({})

  // LOAD PROJECTS
  useEffect(() => {
    loadProjects()
  }, [])

  const loadProjects = async () => {
    try {
      const res = await fetchProjects()
      setProjects(res.data.projects)
    } catch (err) {
      console.error("Failed to load projects")
    } finally {
      setLoading(false)
    }
  }

  // LOAD CLIENTS
  useEffect(() => {
    if (user?.role !== "client") {
      fetchClients().then(res => {
        setClients(res.data.clients)
      })
    }
  }, [user])

  // CREATE PROJECT
  const handleCreate = async (e) => {
    e.preventDefault()
    if (!name.trim()) return

    await createProject({ name })
    setName("")
    loadProjects()
  }

  // DELETE 
  const handleDelete = async (id) => {
    if (!confirm("Delete this project?")) return
    await deleteProject(id)
    setProjects(prev => prev.filter(p => p._id !== id))
  }

  // CHECKBOX TOGGLE
  const handleCheckboxChange = (projectId, clientId) => {
    setSelectedClients(prev => {
      const current = prev[projectId] || []

      if (current.includes(clientId)) {
        return {
          ...prev,
          [projectId]: current.filter(id => id !== clientId)
        }
      } else {
        return {
          ...prev,
          [projectId]: [...current, clientId]
        }
      }
    })
  }

  // SAVE CLIENTS
  const handleSaveClients = async (projectId) => {

    const existing =
      projects.find(p => p._id === projectId)?.clients || []

    const newSelected = selectedClients[projectId] || []

    // merge existing + newly selected
    const finalClients = [...new Set([...existing, ...newSelected])]

    if (finalClients.length === 0) return

    await assignClient(projectId, finalClients)

    // reset state
    setSelectedClients(prev => ({ ...prev, [projectId]: [] }))
    setOpenDropdown(null)

    loadProjects()
  }

  if (loading) return <p>Loading projects...</p>

  return (
    <div>
      <h1 className="text-2xl font-bold mb-4">Projects</h1>

      {/* CREATE */}
      {user?.role !== "client" && (
        <form onSubmit={handleCreate} className="flex gap-2 mb-6">
          <input
            className="border rounded p-2 w-64"
            placeholder="New project name"
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
          <button className="bg-black text-white px-4 rounded">
            Create
          </button>
        </form>
      )}

      {/* PROJECT LIST */}
      <div className="space-y-4">
        {projects.map((p) => (
          <div key={p._id} className="p-4 rounded shadow bg-white relative">

            <div className="flex justify-between items-center">
              <h2 className="font-semibold">{p.name}</h2>

              {user?.role !== "client" && (
                <div className="flex gap-3">

                  <button
                    onClick={() =>
                      setOpenDropdown(
                        openDropdown === p._id ? null : p._id
                      )
                    }
                    className="bg-gray-100 px-3 py-1 rounded text-sm"
                  >
                    Assign Clients
                  </button>

                  <button
                    onClick={() => handleDelete(p._id)}
                    className="text-red-500 text-sm"
                  >
                    Delete
                  </button>
                </div>
              )}
            </div>

            {/* ASSIGNED CLIENT BADGES */}

            {user?.role !== "client" && (

              <div className="flex gap-2 mt-3 flex-wrap">
              {p.clients?.length > 0 ? (
                p.clients.map((id) => {
                  const client = clients.find(c => c._id === id)
                  return (
                    <span
                      key={id}
                      className="text-xs bg-gray-200 px-2 py-1 rounded-full"
                    >
                      {client?.email || "Client"}
                    </span>
                  )
                })
              ) : (
                <span className="text-xs text-gray-400">
                  No clients assigned
                </span>
              )}
            </div>

            )}

            {/* DROPDOWN */}
            {openDropdown === p._id && (
              <div className="absolute mt-3 w-64 bg-white border rounded shadow p-3 z-10">

                <div className="max-h-40 overflow-y-auto space-y-2">
                  {clients.map(c => (
                    <label
                      key={c._id}
                      className="flex items-center gap-2 text-sm"
                    >
                      <input
                        type="checkbox"
                        checked={
                          selectedClients[p._id]?.includes(c._id) ||
                          p.clients?.includes(c._id)
                        }
                        onChange={() =>
                          handleCheckboxChange(p._id, c._id)
                        }
                      />
                      {c.email}
                    </label>
                  ))}
                </div>

                <button
                  onClick={() => handleSaveClients(p._id)}
                  className="mt-3 w-full bg-black text-white text-sm py-1 rounded"
                >
                  Save
                </button>
              </div>
            )}

          </div>
        ))}
      </div>
    </div>
  )
}

export default Projects
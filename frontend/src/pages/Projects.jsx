import { useEffect, useState } from "react";
import {
  fetchProjects,
  createProject,
  deleteProject,
  assignClient,
  updateProjectStatus,
} from "../api/projects";
import { useAuth } from "../context/AuthContext";
import { fetchClients } from "../api/clients";
import { Plus, User2, Trash2 } from "lucide-react";

const Projects = () => {
  const { user } = useAuth();

  const [projects, setProjects] = useState([]);
  const [clients, setClients] = useState([]);
  const [name, setName] = useState("");
  const [loading, setLoading] = useState(true);

  const [openDropdown, setOpenDropdown] = useState(null);
  const [selectedClients, setSelectedClients] = useState({});

  // LOAD PROJECTS
  useEffect(() => {
    loadProjects();
  }, []);

  const loadProjects = async () => {
    try {
      const res = await fetchProjects();
      setProjects(res.data.projects);
    } catch (err) {
      console.error("Failed to load projects");
    } finally {
      setLoading(false);
    }
  };

  // LOAD CLIENTS
  useEffect(() => {
    if (user?.role !== "client") {
      fetchClients().then((res) => {
        setClients(res.data.clients);
      });
    }
  }, [user]);

  // CREATE PROJECT
  const handleCreate = async (e) => {
    e.preventDefault();
    if (!name.trim()) return;

    await createProject({ name });
    setName("");
    loadProjects();
  };

  // DELETE
  const handleDelete = async (id) => {
    if (!confirm("Delete this project?")) return;
    await deleteProject(id);
    setProjects((prev) => prev.filter((p) => p._id !== id));
  };

  // CHECKBOX TOGGLE
  const handleCheckboxChange = (projectId, clientId) => {
    setSelectedClients((prev) => {
      const current = prev[projectId] || [];

      if (current.includes(clientId)) {
        return {
          ...prev,
          [projectId]: current.filter((id) => id !== clientId),
        };
      } else {
        return {
          ...prev,
          [projectId]: [...current, clientId],
        };
      }
    });
  };

  // SAVE CLIENTS
  const handleSaveClients = async (projectId) => {
    const existing = projects.find((p) => p._id === projectId)?.clients || [];

    const newSelected = selectedClients[projectId] || [];

    // merge existing + newly selected
    const finalClients = [...new Set([...existing, ...newSelected])];

    if (finalClients.length === 0) return;

    await assignClient(projectId, finalClients);

    // reset state
    setSelectedClients((prev) => ({ ...prev, [projectId]: [] }));
    setOpenDropdown(null);

    loadProjects();
  };

  // PROJECT STATUS
  const handleStatusChange = async (projectId, status) => {
    try {
      await updateProjectStatus(projectId, status);

      setProjects((prev) =>
        prev.map((p) => (p._id === projectId ? { ...p, status } : p)),
      );
    } catch (error) {
      alert("Failed to update status");
    }
  };

  if (loading) return <p>Loading projects...</p>;

  return (
    <div>
      <h1 className="text-2xl font-bold mb-4">Projects</h1>

      {/* CREATE */}
      {user?.role !== "client" && (
        <form onSubmit={handleCreate} className="flex gap-2 mb-6">
          <input
            className="border border-gray-300 rounded-full p-2 w-64 hover:border-green-500 focus:border-green-500 focus:outline-none"
            placeholder="New project name"
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
          <button className="h-10 w-10 flex items-center justify-center rounded-full bg-green-500 text-white hover:bg-green-600 transition shadow-sm">
            <Plus size={18} />
          </button>
        </form>
      )}

      {/* PROJECT LIST */}
      <div className="space-y-4">
        {projects.map((p) => (
          <div key={p._id} className="p-4 rounded-lg shadow relative">
            <div className="flex justify-between items-center">
              <h2 className="font-semibold">{p.name}</h2>

              {user?.role !== "client" && (
                <div className="flex gap-3">
                  <button
                    onClick={() =>
                      setOpenDropdown(openDropdown === p._id ? null : p._id)
                    }
                    className="p-2 rounded-full bg-green-500 text-white hover:bg-green-600 transition shadow-sm text-sm"
                  >
                    Assign Clients
                  </button>

                  {(user.role === "owner" || user.role === "admin") && (
                    <button
                      onClick={() => handleDelete(p._id)}
                      className="text-red-500 text-sm"
                    >
                      <Trash2
                        size={34}
                        className="bg-red-200 p-1 text-red-500 rounded-full hover:bg-red-300 hover:text-red-600 transition shadow-sm"
                      />
                    </button>
                  )}
                </div>
              )}
            </div>

            {/* ASSIGNED CLIENT BADGES */}

            {user?.role !== "client" && (
              <div className="flex mt-2 flex-wrap items-center gap-2">
                <User2
                  size={18}
                  className="bg-green-200 text-green-600 rounded-full"
                />

                {p.clients?.length > 0 ? (
                  <span className="text-sm p-2 text-gray-400">
                    {p.clients
                      .map((id) => {
                        const client = clients.find((c) => c._id === id);
                        return client?.email;
                      })
                      .filter(Boolean)
                      .join(", ")}
                  </span>
                ) : (
                  <span className="text-sm p-2 text-gray-400">
                    No clients assigned
                  </span>
                )}
              </div>
            )}

            {/* ASSIGN CLIENT DROPDOWN */}
            {openDropdown === p._id && (
              <div className="absolute mt-14 w-96 rounded text-gray-400 bg-white shadow p-3 z-10">
                <div className="max-h-40 overflow-y-auto space-y-2">
                  {clients.map((c) => (
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
                        onChange={() => handleCheckboxChange(p._id, c._id)}
                      />
                      {c.email}
                    </label>
                  ))}
                </div>

                <button
                  onClick={() => handleSaveClients(p._id)}
                  className="mt-3 w-full bg-green-500 text-white text-sm py-2 rounded-full hover:bg-green-600 transition shadow-sm"
                >
                  Save
                </button>
              </div>
            )}

            {/* PROJECT STATUS DPOPDOWN */}

            {(user?.role === "owner" ||
              user?.role === "admin" ||
              user?.role === "member") && (
              <select
                value={p.status}
                onChange={(e) => handleStatusChange(p._id, e.target.value)}
                className="border border-gray-300 rounded-full px-2 py-1 text-sm text-gray-500 hover:border-green-500 focus:border-green-500 focus:outline-none"
              >
                <option value="active">Active</option>
                <option value="on-hold">On Hold</option>
                <option value="completed">Completed</option>
              </select>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

export default Projects;

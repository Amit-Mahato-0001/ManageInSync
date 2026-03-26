import { useCallback, useEffect, useState } from "react"
import { Link, useLocation, useParams } from "react-router-dom"
import { ArrowLeft, Plus, Trash2 } from "lucide-react"
import { createTask, deleteTask, fetchTasks, updateTask } from "../../api/tasks"
import { useAuth } from "../../context/AuthContext"
import TasksPagination from "../../components/TasksPagination"

const getStatusStyle = (status) => {

  if (status === "todo") return "bg-yellow-500/10 text-yellow-400"
  if (status === "in-progress") return "bg-blue-500/10 text-blue-400"
  if (status === "done") return "bg-green-500/10 text-green-400"

  return "bg-white/10 text-white/60"

}

const getPriorityStyle = (priority) => {

  if (priority === "low") return "bg-gray-500/10 text-gray-400"
  if (priority === "medium") return "bg-orange-500/10 text-orange-400"
  if (priority === "high") return "bg-red-500/10 text-red-400"

  return "bg-white/10 text-white/60"

}

const ProjectTasks = () => {

  const { projectId } = useParams()
  const { state } = useLocation()
  const { user } = useAuth()

  const [tasks, setTasks] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const [title, setTitle] = useState("")
  const [status, setStatus] = useState("todo")
  const [priority, setPriority] = useState("medium")
  const [submitting, setSubmitting] = useState(false)
  const [deletingTaskId, setDeletingTaskId] = useState(null)
  const [updatingTaskId, setUpdatingTaskId] = useState(null)

  const [page, setPage] = useState(1)
  const [pagination, setPagination] = useState({})

  const canCreateTasks = user?.role === "owner" || user?.role === "admin"
  const canUpdateTasks =
    user?.role === "owner" || user?.role === "admin" || user?.role === "member"
  const currentUserId = user?.userId
  const projectName = state?.projectName || "Project"
  const isCompletedProject = state?.projectStatus === "completed"

  const loadTasks = useCallback(async () => {

    try {

      setLoading(true)
      setError("")

      const res = await fetchTasks(projectId, { page, limit: 5 })
      setTasks(res.data.tasks.data)
      setPagination(res.data.tasks.pagination)

    } catch (err) {

      setError(err?.response?.data?.error || "Failed to load tasks")

    } finally {

      setLoading(false)

    }

  }, [projectId, page])

  useEffect(() => {

    loadTasks()

  }, [loadTasks])

  const handleCreateTask = async (e) => {

    e.preventDefault()

    if (!canCreateTasks) {

      setError("Only owner/admin can create tasks")

      return

    }

    if (isCompletedProject) {

      setError("Cannot create tasks in completed projects")

      return

    }

    if (!currentUserId) {

      setError("Session expired")

      return

    }

    if (!title.trim()) {

      setError("Title required")

      return

    }

    try {

      setSubmitting(true)

      setError("")

      await createTask(projectId, {

        title: title.trim(),
        assigneeId: currentUserId,
        status,
        priority

      })

      setTitle("")
      setStatus("todo")
      setPriority("medium")

      if (page === 1) {

        await loadTasks()

      } else {

        setPage(1)

      }

    } catch (err) {

      setError(err?.response?.data?.error || "Failed to create task")

    } finally {

      setSubmitting(false)

    }

  }

  const handleDeleteTask = async (taskId) => {

    if (!canCreateTasks) {

      setError("Not allowed")

      return

    }

    if (!confirm("Delete this task?")) return

    try {

      setDeletingTaskId(taskId)
      setError("")

      await deleteTask(projectId, taskId)

      if (tasks.length === 1 && page > 1) {

        setPage((prev) => prev - 1)

      } else {

        await loadTasks()

      }

    } catch (err) {

      setError(err?.response?.data?.error || "Failed to delete task")

    } finally {

      setDeletingTaskId(null)

    }

  }

  const handleUpdateTask = async (task, updates) => {

    if (!canUpdateTasks) {

      setError("Not allowed")

      return

    }

    if (isCompletedProject) {

      setError("Cannot update tasks in completed projects")

      return

    }

    const [field] = Object.keys(updates)

    if (!field || task[field] === updates[field]) return

    try {

      setUpdatingTaskId(task._id)
      setError("")

      await updateTask(projectId, task._id, updates)
      await loadTasks()

    } catch (err) {

      setError(err?.response?.data?.error || "Failed to update task")

    } finally {

      setUpdatingTaskId(null)

    }

  }

  const totalPages =

    Number.isFinite(pagination.totalPages) && pagination.totalPages > 0
      ? pagination.totalPages
      : 1

  if (loading) return <p>Loading project tasks...</p>

  return (

    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">{projectName} Tasks</h1>
          <p className="text-sm text-white/60">Project scoped task management</p>
        </div>

        <Link
          to="/projects"
          className="inline-flex items-center gap-2 text-sm px-3 py-2 rounded-md bg-white/10"
        >
          <ArrowLeft size={14} />
          Back to Projects
        </Link>

      </div>

      {canCreateTasks ? (

        <form onSubmit={handleCreateTask} className="flex flex-wrap gap-3">

          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Task title..."
            className="border border-white/10 px-4 py-2 rounded-md text-sm w-64 outline-none"
          />

          <select
            value={status}
            onChange={(e) => setStatus(e.target.value)}
            className="border border-white/10 px-3 py-2 rounded-md text-sm"
          >
            <option value="todo">Todo</option>
            <option value="in-progress">In Progress</option>
            <option value="done">Done</option>
          </select>

          <select
            value={priority}
            onChange={(e) => setPriority(e.target.value)}
            className="border border-white/10 px-3 py-2 rounded-md text-sm"
          >
            <option value="low">Low</option>
            <option value="medium">Medium</option>
            <option value="high">High</option>
          </select>

          <button
            disabled={submitting || isCompletedProject}
            className="h-10 w-10 flex items-center justify-center rounded-md bg-blue-600 disabled:opacity-60"
            title={isCompletedProject ? "Project completed" : "Create task"}
          >
            <Plus size={16} />
          </button>

        </form>

      ) : (

        <p className="text-sm text-white/40">
          Only owner/admin can create tasks. Members can update status and priority.
        </p>

      )}

      {error && <p className="text-sm text-red-500">{error}</p>}

      <div className="space-y-3">

        {tasks.map((task) => (

          <div
            key={task._id}
            className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between rounded-xl p-5 border border-white/10 bg-gradient-to-br from-[#18181B] to-[#09090B]"
          >
            <div className="space-y-2">
              <h2 className="font-medium">{task.title}</h2>
              <div className="flex gap-2 text-xs">
                <span className={`px-2 py-1 rounded-md ${getStatusStyle(task.status)}`}>
                  {task.status}
                </span>
                <span className={`px-2 py-1 rounded-md ${getPriorityStyle(task.priority)}`}>
                  {task.priority}
                </span>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              {canUpdateTasks && (
                <>
                  <select
                    value={task.status}
                    disabled={updatingTaskId === task._id || isCompletedProject}
                    onChange={(e) => handleUpdateTask(task, { status: e.target.value })}
                    className="border border-white/10 px-3 py-2 rounded-md text-sm bg-transparent"
                  >
                    <option value="todo">Todo</option>
                    <option value="in-progress">In Progress</option>
                    <option value="done">Done</option>
                  </select>

                  <select
                    value={task.priority}
                    disabled={updatingTaskId === task._id || isCompletedProject}
                    onChange={(e) => handleUpdateTask(task, { priority: e.target.value })}
                    className="border border-white/10 px-3 py-2 rounded-md text-sm bg-transparent"
                  >
                    <option value="low">Low</option>
                    <option value="medium">Medium</option>
                    <option value="high">High</option>
                  </select>
                </>
              )}

              {canCreateTasks && (

                <button
                  disabled={deletingTaskId === task._id || updatingTaskId === task._id}
                  onClick={() => handleDeleteTask(task._id)}
                >
                  <Trash2 className="w-4 h-4 text-red-400" />
                </button>

              )}

              {updatingTaskId === task._id && (

                <span className="text-xs text-white/50">
                  Updating...
                </span>

              )}

            </div>

          </div>

        ))}

        {tasks.length === 0 && (

          <p className="text-sm text-white/40">No tasks in this project</p>

        )}

        <TasksPagination page={page} totalPages={totalPages} onPageChange={setPage} />

      </div>

    </div>

  )
  
}

export default ProjectTasks

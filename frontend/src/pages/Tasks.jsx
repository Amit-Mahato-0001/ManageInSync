import { useCallback, useEffect, useState } from 'react'
import { createTask, deleteTask, fetchTasks } from '../api/tasks'
import { Plus, Trash2 } from "lucide-react"
import { useAuth } from '../context/AuthContext'
import TasksPagination from '../components/TasksPagination'

const DASHBOARD_REFRESH_INTERVAL_MS = 10000

const getStatusStyle = (status) => {
  if (status === "todo") return "bg-yellow-500/10 text-yellow-400"
  if (status === "in-progress") return "bg-blue-500/10 text-blue-400"
  if (status === "done") return "bg-green-500/10 text-green-400"
}

const getPriorityStyle = (priority) => {
  if (priority === "low") return "bg-gray-500/10 text-gray-400"
  if (priority === "medium") return "bg-orange-500/10 text-orange-400"
  if (priority === "high") return "bg-red-500/10 text-red-400"
}

const Tasks = () => {

  const { user } = useAuth()

  const [tasks, setTasks] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const [title, setTitle] = useState("")
  const [status, setStatus] = useState("todo")
  const [priority, setPriority] = useState("medium")
  const [submitting, setSubmitting] = useState(false)
  const [deletingTaskId, setDeletingTaskId] = useState(null)

  const canCreateTasks = user?.role === "owner" || user?.role === "admin"
  const currentUserId = user?.userId

  const [page, setPage] = useState(1)
  const [pagination, setPagination] = useState({})

  const loadTasks = useCallback(async () => {

    try {
      setLoading(true)

      const res = await fetchTasks({ page, limit: 3 })

      setTasks(res.data.tasks.data)
      setPagination(res.data.tasks.pagination)

    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }

  }, [page])

  useEffect(() => {
    loadTasks()
  }, [loadTasks])

  const handleCreateTask = async (e) => {

    e.preventDefault()

    if (!canCreateTasks) {
      setError("Only owner/admin can create tasks")
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

      await createTask({
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
      setError("Failed to create task")
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
      await deleteTask(taskId)

      if (tasks.length === 1 && page > 1) {
        setPage((p) => p - 1)
      } else {
        await loadTasks()
      }

    } catch (err) {
      setError("Failed to delete")
    } finally {
      setDeletingTaskId(null)
    }
  }

  const totalPages =
    Number.isFinite(pagination.totalPages) && pagination.totalPages > 0
      ? pagination.totalPages
      : 1

  if (loading) return <p>Loading tasks...</p>

  return (
    <div className="space-y-6">

      {/* HEADER */}
      <div>
        <h1 className="text-2xl font-semibold">Tasks</h1>
        <p className="text-sm text-white/60">
          Manage and track your tasks
        </p>
      </div>

      {/* CREATE */}
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
            disabled={submitting}
            className="h-10 w-10 flex items-center justify-center rounded-md bg-blue-600"
          >
            <Plus size={16} />
          </button>

        </form>
      ) : (
        <p className="text-sm text-white/40">
          Members can only view tasks
        </p>
      )}

      {error && <p className="text-sm text-red-500">{error}</p>}

      {/* LIST */}
      <div className="space-y-3">

        {tasks.map((task) => (

          <div
            key={task._id}
            className="flex items-center justify-between rounded-xl p-5 border border-white/10 bg-gradient-to-br from-[#18181B] to-[#09090B]"
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

            {canCreateTasks && (
              <button
                disabled={deletingTaskId === task._id}
                onClick={() => handleDeleteTask(task._id)}
              >
                <Trash2 className="w-4 h-4 text-red-400" />
              </button>
            )}

          </div>
        ))}

        {tasks.length === 0 && (
          <p className="text-sm text-white/40">No tasks found</p>
        )}

        <TasksPagination
          page={page}
          totalPages={totalPages}
          onPageChange={setPage}
        />

      </div>

    </div>
  )
}

export default Tasks
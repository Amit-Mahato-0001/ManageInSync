import { useCallback, useEffect, useState } from "react"
import { Link, useLocation, useParams } from "react-router-dom"
import { ArrowLeft, Rocket, Trash2, X } from "lucide-react"
import { createTask, deleteTask, fetchTasks, updateTask } from "../api/tasks"
import { useAuth } from "@/features/auth/hooks/useAuth"
import { getAuthUserId } from "@/features/auth/utils/getAuthUserId"
import TasksPagination from "@/shared/components/TasksPagination"
import { formatDate } from "@/shared/utils/formatDate"
import {
  getErrorMessage,
  isValidationError,
  runAsyncToast,
  splitValidationErrors
} from "../utils/projectModuleUtils"

const formatTaskBadgeLabel = (value = "") =>
  value
    .split("-")
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ")

const getTaskStatusClasses = (status) => {
  if (status === "done") {
    return "bg-emerald-500/15 text-emerald-300 border border-emerald-500/20"
  }

  if (status === "in-progress") {
    return "bg-amber-500/15 text-amber-300 border border-amber-500/20"
  }

  return "bg-white/10 text-white/70 border border-white/10"
}

const getTaskPriorityClasses = (priority) => {
  if (priority === "high") {
    return "bg-rose-500/15 text-rose-300 border border-rose-500/20"
  }

  if (priority === "medium") {
    return "bg-amber-500/15 text-amber-300 border border-amber-500/20"
  }

  return "bg-white/10 text-white/70 border border-white/10"
}

const getTabClassName = (active) => {
  return active
    ? "rounded-lg bg-white px-4 py-2 text-2xl font-medium border border-white/10 bg-gradient-to-br from-[#18181B] to-blue-500"
    : "px-4 py-2 text-2xl font-medium"
}

const ProjectTasks = () => {
  const { projectId } = useParams()
  const { state } = useLocation()
  const { user } = useAuth()

  const [tasks, setTasks] = useState([])
  const [loading, setLoading] = useState(true)
  const [pageError, setPageError] = useState("")
  const [fieldErrors, setFieldErrors] = useState({})
  const [formError, setFormError] = useState("")
  const [title, setTitle] = useState("")
  const [description, setDescription] = useState("")
  const [targetDate, setTargetDate] = useState("")
  const [status, setStatus] = useState("todo")
  const [priority, setPriority] = useState("medium")
  const [submitting, setSubmitting] = useState(false)
  const [deletingTaskId, setDeletingTaskId] = useState(null)
  const [updatingTaskId, setUpdatingTaskId] = useState(null)
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false)

  const [page, setPage] = useState(1)
  const [pagination, setPagination] = useState({})

  const canCreateTasks = user?.role === "owner" || user?.role === "admin"
  const canUpdateTasks =
    user?.role === "owner" || user?.role === "admin" || user?.role === "member"
  const currentUserId = getAuthUserId(user)
  const projectName = state?.projectName || "Project"
  const projectDescription = state?.projectDescription || ""
  const projectTargetDate = state?.projectTargetDate || ""
  const unreadCount = Number(state?.unreadCount) || 0
  const isCompletedProject = state?.projectStatus === "completed"

  const projectRouteState = {
    projectName,
    projectDescription,
    projectTargetDate,
    projectStatus: state?.projectStatus,
    unreadCount
  }

  const loadTasks = useCallback(async ({ showLoader = true, throwOnError = false } = {}) => {
    try {
      if (showLoader) {
        setLoading(true)
      }

      setPageError("")

      const res = await fetchTasks(projectId, { page, limit: 5 })
      setTasks(res.data.tasks.data)
      setPagination(res.data.tasks.pagination)
    } catch (error) {
      console.error(error)
      setPageError(getErrorMessage(error, "Failed to load tasks"))

      if (throwOnError) {
        throw error
      }
    } finally {
      if (showLoader) {
        setLoading(false)
      }
    }
  }, [projectId, page])

  useEffect(() => {
    loadTasks()
  }, [loadTasks])

  const handleOpenCreateModal = () => {
    if (!canCreateTasks || isCompletedProject) {
      return
    }

    setTitle("")
    setDescription("")
    setTargetDate("")
    setStatus("todo")
    setPriority("medium")
    setFieldErrors({})
    setFormError("")
    setIsCreateModalOpen(true)
  }

  const handleCloseCreateModal = () => {
    if (submitting) return

    setIsCreateModalOpen(false)
    setTitle("")
    setDescription("")
    setTargetDate("")
    setStatus("todo")
    setPriority("medium")
    setFieldErrors({})
    setFormError("")
  }

  const handleCreateTask = async (e) => {
    e.preventDefault()

    if (!canCreateTasks) {
      setFieldErrors({})
      setFormError("Only owner/admin can create tasks")
      return
    }

    if (isCompletedProject) {
      setFieldErrors({})
      setFormError("Cannot create tasks in completed projects")
      return
    }

    if (!currentUserId) {
      setFieldErrors({})
      setFormError("Session expired")
      return
    }

    try {
      setSubmitting(true)
      setFieldErrors({})
      setFormError("")

      await runAsyncToast(
        async () => {
          await createTask(projectId, {
            title: title.trim(),
            description: description.trim() || undefined,
            targetDate: targetDate || undefined,
            assigneeId: currentUserId,
            status,
            priority
          })

          if (page === 1) {
            await loadTasks({ showLoader: false, throwOnError: true })
          } else {
            setPage(1)
          }
        },
        {
          loadingMessage: "Creating task...",
          successMessage: "Task created",
          fallbackError: "Failed to create task",
          suppressErrorToast: isValidationError
        }
      )

      setTitle("")
      setDescription("")
      setTargetDate("")
      setStatus("todo")
      setPriority("medium")
      setFieldErrors({})
      setFormError("")
      setIsCreateModalOpen(false)
    } catch (error) {
      if (isValidationError(error)) {
        const { fieldErrors: nextFieldErrors, formError: nextFormError } = splitValidationErrors(error)
        const nextFormState = { ...nextFieldErrors }

        if (nextFormState.assigneeId) {
          setFormError(nextFormError || nextFormState.assigneeId)
          delete nextFormState.assigneeId
        } else {
          setFormError(nextFormError)
        }

        setFieldErrors(nextFormState)
      }

      return
    } finally {
      setSubmitting(false)
    }
  }

  const handleDeleteTask = async (taskId) => {
    if (!canCreateTasks) {
      setPageError("Only owner/admin can delete tasks")
      return
    }

    if (!confirm("Delete this task?")) return

    try {
      setDeletingTaskId(taskId)

      await runAsyncToast(
        async () => {
          await deleteTask(projectId, taskId)

          if (tasks.length === 1 && page > 1) {
            setPage((prev) => prev - 1)
          } else {
            await loadTasks({ showLoader: false, throwOnError: true })
          }
        },
        {
          loadingMessage: "Deleting task...",
          successMessage: "Task deleted",
          fallbackError: "Failed to delete task"
        }
      )
    } catch {
      return
    } finally {
      setDeletingTaskId(null)
    }
  }

  const handleUpdateTask = async (task, updates) => {
    if (!canUpdateTasks) {
      setPageError("Only owner, admin, or member can update tasks")
      return
    }

    if (isCompletedProject) {
      setPageError("Cannot update tasks in completed projects")
      return
    }

    const [field] = Object.keys(updates)

    if (!field || task[field] === updates[field]) return

    try {
      setUpdatingTaskId(task._id)
      setPageError("")

      await runAsyncToast(
        async () => {
          await updateTask(projectId, task._id, updates)
          await loadTasks({ showLoader: false, throwOnError: true })
        },
        {
          loadingMessage:
            field === "status" ? "Updating task status..." : "Updating task priority...",
          successMessage:
            field === "status" ? "Task status updated" : "Task priority updated",
          fallbackError: "Failed to update task"
        }
      )
    } catch {
      return
    } finally {
      setUpdatingTaskId(null)
    }
  }

  const totalPages =
    Number.isFinite(pagination.totalPages) && pagination.totalPages > 0
      ? pagination.totalPages
      : 1

  return (
    <>
      <div className="space-y-6">
        <div className="space-y-4">
          <div className="flex items-center gap-4">
            <Link
              to="/projects"
              className="inline-flex items-center gap-2"
            >
              <ArrowLeft className="h-12 w-12" />
            </Link>

            <div>
              <h1 className="text-5xl font-semibold">{projectName}</h1>
              <p className="text-2xl text-white/60">
                Track progress and manage project tasks
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex flex-wrap items-center gap-2">
              <Link
                to={`/projects/${projectId}/tasks`}
                state={projectRouteState}
                className={getTabClassName(true)}
              >
                Tasks
              </Link>

              <Link
                to={`/projects/${projectId}/conversation`}
                state={projectRouteState}
                className={`${getTabClassName(false)} relative`}
              >
                Conversation

                {unreadCount > 0 && (
                  <span
                    className="absolute top-1 right-1 h-2.5 w-2.5 rounded-full bg-gradient-to-br from-[#18181B] to-green-500"
                  >
                  </span>
                )}
              </Link>
            </div>

            {canCreateTasks ? (
              <button
                type="button"
                onClick={handleOpenCreateModal}
                disabled={isCompletedProject}
                className="inline-flex items-center gap-4 rounded-lg border border-white/10 bg-gradient-to-br from-[#18181B] to-blue-500 px-4 py-2 text-2xl font-medium text-white disabled:cursor-not-allowed disabled:opacity-60"
              >
                Create Task
                <Rocket className="h-6 w-6" />
              </button>
            ) : (
              <p className="text-2xl text-white/40">
                Only owner/admin can create tasks. Members can update status and priority.
              </p>
            )}
          </div>
        </div>

        {pageError && <p className="text-2xl text-red-500">{pageError}</p>}

        <div className="space-y-3">
          {loading && (
            <p className="text-2xl text-white/50">
              Loading tasks...
            </p>
          )}

          {!loading &&
            tasks.map((task) => {
              const formattedTaskTargetDate = formatDate(task.targetDate)

              return (
                <div
                  key={task._id}
                  className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between rounded-xl p-5 border border-white/10 bg-gradient-to-br from-[#18181B] to-[#09090B]"
                >
                  <div className="space-y-3 flex-1 min-w-0">
                    <div className="space-y-2">
                      <h2 className="font-medium text-white text-2xl">{task.title}</h2>

                      {task.description && (
                        <p className="text-2xl text-white/55">
                          {task.description}
                        </p>
                      )}
                    </div>

                    {formattedTaskTargetDate && (
                      <p className="pt-1 text-2xl text-white/60">
                        Target Date: {formattedTaskTargetDate}
                      </p>
                    )}

                    <div className="flex flex-wrap gap-2 text-2xl">
                      <span
                        className={`inline-flex rounded-lg px-3 py-1 text-2xl font-medium ${getTaskStatusClasses(task.status)}`}
                      >
                        {formatTaskBadgeLabel(task.status)}
                      </span>

                      <span
                        className={`inline-flex rounded-lg px-3 py-1 text-2xl font-medium ${getTaskPriorityClasses(task.priority)}`}
                      >
                        {formatTaskBadgeLabel(task.priority)}
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
                          className="border border-white/10 px-3 py-2 rounded-md text-2xl bg-transparent"
                        >
                          <option value="todo">Todo</option>
                          <option value="in-progress">In Progress</option>
                          <option value="done">Done</option>
                        </select>

                        <select
                          value={task.priority}
                          disabled={updatingTaskId === task._id || isCompletedProject}
                          onChange={(e) => handleUpdateTask(task, { priority: e.target.value })}
                          className="border border-white/10 px-3 py-2 rounded-md text-2xl bg-transparent"
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
                        className="disabled:cursor-not-allowed disabled:opacity-60"
                      >
                        <div className="p-2 rounded-lg border border-white/10 bg-gradient-to-br from-[#18181B] to-red-500">
                          <Trash2 className="h-6 w-6" />
                        </div>
                      </button>
                    )}

                    {updatingTaskId === task._id && (
                      <span className="text-2xl text-white/50">
                        Updating...
                      </span>
                    )}
                  </div>
                </div>
              )
            })}

          {!loading && tasks.length === 0 && (
            <p className="text-2xl text-white/40">No tasks in this project</p>
          )}

          <TasksPagination page={page} totalPages={totalPages} onPageChange={setPage} />
        </div>
      </div>

      {isCreateModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
          <div className="w-full max-w-3xl rounded-lg border border-white/10 bg-gradient-to-br from-[#18181B] to-[#09090B] p-6">
            <div className="mb-5 flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-semibold text-white">Create Task</h2>
                <p className="mt-1 text-2xl text-white/50">
                  Add a new task for this project
                </p>
              </div>

              <button
                type="button"
                onClick={handleCloseCreateModal}
              >
                <X className="w-12 h-12" />
              </button>
            </div>

            <form onSubmit={handleCreateTask} className="space-y-4" noValidate>
              <div>
                <label className="mb-2 block text-2xl font-medium text-white/80">
                  Task Title
                </label>
                <input
                  value={title}
                  onChange={(e) => {
                    setTitle(e.target.value)
                    setFieldErrors((prev) => ({ ...prev, title: "" }))
                    setFormError("")
                  }}
                  placeholder="Enter task title..."
                  aria-invalid={Boolean(fieldErrors.title)}
                  className={`w-full rounded-lg border px-4 py-3 text-2xl text-white outline-none transition bg-transparent ${
                    fieldErrors.title
                      ? "border-red-400/80 focus:border-red-400"
                      : "border-white/10 focus:border-blue-500"
                  }`}
                />

                {fieldErrors.title && (
                  <p className="mt-2 text-2xl text-red-400">
                    {fieldErrors.title}
                  </p>
                )}
              </div>

              <div>
                <label className="mb-2 block text-2xl font-medium text-white/80">
                  Description
                </label>
                <textarea
                  value={description}
                  onChange={(e) => {
                    setDescription(e.target.value)
                    setFieldErrors((prev) => ({ ...prev, description: "" }))
                    setFormError("")
                  }}
                  placeholder="Write a short task description..."
                  rows={4}
                  aria-invalid={Boolean(fieldErrors.description)}
                  className={`w-full rounded-lg border px-4 py-3 text-2xl text-white outline-none transition bg-transparent ${
                    fieldErrors.description
                      ? "border-red-400/80 focus:border-red-400"
                      : "border-white/10 focus:border-blue-500"
                  }`}
                />

                {fieldErrors.description && (
                  <p className="mt-2 text-2xl text-red-400">
                    {fieldErrors.description}
                  </p>
                )}
              </div>

              <div>
                <label className="mb-2 block text-2xl font-medium text-white/80">
                  Target Date
                </label>
                <input
                  type="date"
                  value={targetDate}
                  onChange={(e) => {
                    setTargetDate(e.target.value)
                    setFieldErrors((prev) => ({ ...prev, targetDate: "" }))
                    setFormError("")
                  }}
                  aria-invalid={Boolean(fieldErrors.targetDate)}
                  className={`w-full rounded-lg border px-4 py-3 text-2xl text-white outline-none transition bg-transparent ${
                    fieldErrors.targetDate
                      ? "border-red-400/80 focus:border-red-400"
                      : "border-white/10 focus:border-blue-500"
                  }`}
                />

                {fieldErrors.targetDate && (
                  <p className="mt-2 text-2xl text-red-400">
                    {fieldErrors.targetDate}
                  </p>
                )}
              </div>

              <div>
                <label className="mb-2 block text-2xl font-medium text-white/80">
                  Status
                </label>
                <select
                  value={status}
                  onChange={(e) => {
                    setStatus(e.target.value)
                    setFieldErrors((prev) => ({ ...prev, status: "" }))
                    setFormError("")
                  }}
                  aria-invalid={Boolean(fieldErrors.status)}
                  className={`w-full rounded-lg border px-4 py-3 text-2xl text-white outline-none transition bg-transparent ${
                    fieldErrors.status
                      ? "border-red-400/80 focus:border-red-400"
                      : "border-white/10 focus:border-blue-500"
                  }`}
                >
                  <option value="todo">Todo</option>
                  <option value="in-progress">In Progress</option>
                  <option value="done">Done</option>
                </select>

                {fieldErrors.status && (
                  <p className="mt-2 text-2xl text-red-400">
                    {fieldErrors.status}
                  </p>
                )}
              </div>

              <div>
                <label className="mb-2 block text-2xl font-medium text-white/80">
                  Priority
                </label>
                <select
                  value={priority}
                  onChange={(e) => {
                    setPriority(e.target.value)
                    setFieldErrors((prev) => ({ ...prev, priority: "" }))
                    setFormError("")
                  }}
                  aria-invalid={Boolean(fieldErrors.priority)}
                  className={`w-full rounded-lg border px-4 py-3 text-2xl text-white outline-none transition bg-transparent ${
                    fieldErrors.priority
                      ? "border-red-400/80 focus:border-red-400"
                      : "border-white/10 focus:border-blue-500"
                  }`}
                >
                  <option value="low">Low</option>
                  <option value="medium">Medium</option>
                  <option value="high">High</option>
                </select>

                {fieldErrors.priority && (
                  <p className="mt-2 text-2xl text-red-400">
                    {fieldErrors.priority}
                  </p>
                )}
              </div>

              {formError && (
                <p className="text-2xl text-red-400">
                  {formError}
                </p>
              )}

              <div className="flex items-center justify-end pt-2">
                <button
                  type="submit"
                  disabled={submitting || isCompletedProject}
                  className="inline-flex items-center gap-4 rounded-xl border border-white/10 bg-gradient-to-br from-[#18181B] to-blue-500 px-4 py-2 text-2xl font-medium text-white transition hover:opacity-90 disabled:opacity-60"
                >
                  <Rocket className="w-6 h-6" />
                  {submitting ? "Creating..." : "Create Task"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  )
}

export default ProjectTasks

import { useCallback, useEffect, useState } from 'react'
import { createTask, deleteTask, fetchTasks } from '../api/tasks'
import { Plus, Trash2 } from "lucide-react"
import { useAuth } from '../context/AuthContext'
import TasksPagination from '../components/TasksPagination'

const statusStyles = {
    
    todo: "bg-yellow-100 text-yellow-700",
    "in-progress": "bg-blue-100 text-blue-700",
    done: "bg-green-100 text-green-700",
}

const priorityStyles = {

    low: "bg-gray-100 text-gray-600",
    medium: "bg-orange-100 text-orange-700",
    high: "bg-red-100 text-red-700",
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

            const res = await fetchTasks({page, limit : 3 })

            setTasks(res.data.tasks.data)
            setPagination(res.data.tasks.pagination)

        } catch (error) {

            console.error("Failed to fetch tasks", error)
            
        } finally {

            setLoading(false)
        }
    }, [page])

    useEffect(() => {
        loadTasks()
    }, [loadTasks])

    const handleCreateTask = async (e) => {

        e.preventDefault()

        if(!canCreateTasks){

            setError("Only owner/admin can create tasks")
            return
        }

        if(!currentUserId){

            setError("Session expired. Please login again")
            return
        }

        if(!title.trim()){

            setError("Title is required")
            return
        }

        try{

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

            if(page === 1){
                await loadTasks()
            } else {
                setPage(1)
            }

        } catch (error) {

            setError(error.response?.data?.message || "Failed to create task")

        } finally {

            setSubmitting(false)

        }
    }

    const handleDeleteTask = async (taskId) => {

        if(!canCreateTasks){
            setError("Only owner/admin can delete tasks")
            return
        }

        if(!confirm("Delete this task?")) return

        try {

            setError("")
            setDeletingTaskId(taskId)
            await deleteTask(taskId)

            if(tasks.length === 1 && page > 1){
                setPage((prev) => prev - 1)
            } else {
                await loadTasks()
            }

        } catch (error) {

            setError(error.response?.data?.message || "Failed to delete task")

        } finally {

            setDeletingTaskId(null)
        }
    }

    const totalPages = Number.isFinite(pagination.totalPages) && pagination.totalPages > 0
        ? pagination.totalPages
        : 1

    if(loading) return <p>Loading tasks...</p>

  return (

    <div>

        <h1 className='mb-4 text-2xl font-bold'>Tasks</h1>

        {canCreateTasks ? (
        <form onSubmit={handleCreateTask} className='mb-6 grid gap-3 md:grid-cols-3'>

            <input 
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder='Task title'
            className='rounded-full border border-gray-300 p-2 text-sm'
            />

            <select 
            value={status}
            onChange={(e) => setStatus(e.target.value)}
            className='rounded-full border border-gray-300 px-3 py-2 text-sm'
            >
                <option value="todo">Todo</option>
                <option value="in-progress">In Progress</option>
                <option value="done">Done</option>

            </select>

            <div className='flex gap-2'>

                <select
                value={priority}
                onChange={(e) => setPriority(e.target.value)}
                className='w-full rounded-full border border-gray-300 px-3 py-2 text-sm'
                >
                    <option value="low">Low</option>
                    <option value="medium">Medium</option>
                    <option value="high">High</option>

                </select>

                <button
                disabled={submitting}
                className='flex h-10 w-12 items-center justify-center rounded-full bg-blue-500 text-white hover:bg-blue-600'>

                    <Plus size={18}/>
                </button>
            </div>

        </form>
        ) : (
            <p className='mb-6 text-sm text-gray-500'>Members can only view tasks assigned to them.</p>
        )}

        {error && <p className='mb-3 text-sm text-red-500'>{error}</p>}

        <div className='space-y-3'>

            {tasks.map((task) => (

                <div
                key={task._id}
                className='flex items-center justify-between rounded-lg bg-white p-4 shadow'>

                    <div className='space-y-2'>

                        <h2 className='font-semibold'>{task.title}</h2>

                        <div className="flex flex-wrap items-center gap-2 text-xs">

                            <span className={`rounded-full px-2 py-1 ${statusStyles[task.status]}`}>

                                {task.status}

                            </span>

                            <span className={`rounded-full px-2 py-1 ${priorityStyles[task.priority]}`}>

                                {task.priority}

                            </span>
                        </div>
                    </div>

                    
                  {canCreateTasks && (

                    <button
                      type='button'
                      disabled={deletingTaskId === task._id}
                      onClick={() => handleDeleteTask(task._id)}
                      className="text-red-500 text-sm disabled:cursor-not-allowed disabled:opacity-60"
                    >

                      <Trash2
                        size={34}
                        className="bg-red-200 p-1 text-red-500 rounded-full hover:bg-red-300 hover:text-red-600 transition shadow-sm"
                      />
                      
                    </button>
                  )}

                </div>
            ))}

            {tasks.length === 0 && <p>No tasks found</p>}

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

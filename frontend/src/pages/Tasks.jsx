import { useEffect, useState } from 'react'
import { fetchTasks } from '../api/tasks'

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

    const [tasks, setTasks] = useState([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState("")

    useEffect(() => {

        loadTasks()

    }, [])

    const loadTasks = async () => {

        try {
            
            setLoading(true)
            const res = await fetchTasks()
            setTasks(res.data.tasks || [])
            setError("")

        } catch (error) {
            
            setError("Failed to load tasks")

        } finally{

            setLoading(false)
        }
    }

    if(loading) return <p>Loading tasks...</p>

  return (

    <div>

        <h1 className='mb-4 text-2xl font-bold'>Tasks</h1>

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

                </div>
            ))}

            {tasks.length === 0 && <p>No tasks found</p>}

        </div>

    </div>
  )

}

export default Tasks
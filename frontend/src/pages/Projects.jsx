import { useEffect, useState } from 'react'
import {fetchProjects, createProject, deleteProject} from '../api/projects'
import { useAuth } from '../context/AuthContext'

const Projects = () => {

    const { user } = useAuth()

    const [projects, setProjects] = useState([])
    const [name, setName] = useState("")
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        loadProjects()
    }, [])

    const loadProjects = async () => {

        try {
            
            const res = await fetchProjects()
            setProjects(res.data.projects)

        } catch (error) {
            
            console.error("Failed to load projects")

        } finally{
            setLoading(false)
        }
    }

    const handleCreate = async (e) => {

        e.preventDefault()
        if(!name) return

        await createProject({name})
        setName("")
        loadProjects()

    }

    const handleDelete = async (id) => {

        if(!confirm("Delete this project")) return

        await deleteProject(id)

        setProjects((prev) => prev.filter((p) => p._id !== id))
    }

    if(loading) return <p>Loading projects...</p>

  return (
    
    <div>
        <h1 className='text-2xl font-bold mb-4'>
            Projects
        </h1>

        {/* CREATE PROJECT */}

        <form onSubmit={handleCreate} className='flex gap-2 mb-6'>

            <input
            className='border rounded p-2 w-64'
            placeholder='New project name'
            value={name}
            onChange={(e) => setName(e.target.value)} />

            <button className='bg-black text-white px-4 rounded'>Create</button>

        </form>

        {/* PROJECTS LIST */}

        <div className='space-y-2'>

            {projects.map((p) => (

                <div
                className='p-4 rounded shadow flex justify-between items-center'
                key={p._id}>
                    {p.name}

                    {/* PROJECT DELETE */}

                    {user?.role !== "client" && (

                        <button onClick={() => handleDelete(p._id)}
                        className='text-red-500'>

                            Delete project
                        </button>
                    )}
                </div>
            ))}

        </div>

    </div>
  )

}

export default Projects
import { useEffect, useState } from 'react'
import {fetchProjects, createProject} from '../api/projects'

const Projects = () => {

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
                className='p-4 rounded shadow'
                key={p._id}>
                    {p.name}
                </div>
            ))}

        </div>

    </div>
  )

}

export default Projects
import { useEffect, useState } from 'react'
import {fetchProjects, createProject, deleteProject, assignClient} from '../api/projects'
import { useAuth } from '../context/AuthContext'
import { fetchClients } from '../api/clients'

const Projects = () => {

    const { user } = useAuth()

    const [projects, setProjects] = useState([])
    const [name, setName] = useState("")
    const [loading, setLoading] = useState(true)
    const [clients, setClients] = useState([])

    useEffect(() => {
        loadProjects()
    }, [])

    {/* LOAD PROJECTS */}

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

    {/* LOAD CLIENTS (onwer/admin only) */}

    useEffect(() => {

        if(user?.role !== "client"){

            fetchClients().then(res => {

                setClients(res.data.clients)

            })
        }
    }, [user])

    {/* ASSIGN CLIENT */}

    const handleAssign = async (projectId, clientId) => {

        if(!clientId) return

        await assignClient(projectId, clientId)

        loadProjects()
    }

    {/* PROJECT CREATE */}

    const handleCreate = async (e) => {

        e.preventDefault()
        if(!name) return

        await createProject({name})
        setName("")
        loadProjects()

    }

    {/* DELETE PROJECT */}

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

                    {/* ASSIGN CLIENT (owner/admin only) */}

                    {user?.role !== "client" && (

                        <select
                        onChange={(e) => handleAssign(p._id, e.target.value)}
                        defaultValue=""
                        className='border text-sm ml-4'
                        >

                            <option value="" >
                                Assign client
                            </option>

                            {clients.map(c => (

                                <option value={c._id} key={c._id}>

                                    {c.email}

                                </option>
                            ))}

                        </select>
                    )}

                    {/* SHOW ASSIGNED CLIENT */}

                    {p.clientId && (

                        <p className='text-sm text-gray-500'>Client assigned</p>
                    )}

                </div>
            ))}

        </div>

    </div>
  )

}

export default Projects


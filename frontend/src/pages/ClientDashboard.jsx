import {useEffect, useState} from 'react'
import { fetchProjects } from '../api/projects'

const ClientDashboard = () => {

    const [projects, setProjects] = useState([])
    const [loading, setLoading] = useState(true)

    useEffect(() => {

        fetchProjects()
        .then(res => setProjects(res.data.projects))
        .finally(() => setLoading(false))

    }, [])

    if(loading) return <p>Loading...</p>

  return (

    <div>
        
        <h1 className='text-xl font-bold mb-4'>
            Your projects
        </h1>

        {projects.length === 0 ? (

            <p className='text-gray-500'>
                No projects assigned yet
            </p>

        ) : (

            <div className='space-y-2'>

                {projects.map(p => (

                    <div
                    key={p._id}
                    className='p-4 rounded shadow'>
                        
                        <p className='font-medium'>{p.name}</p>
                    </div>
                ))}

            </div>
        )}
    </div>

  )

}

export default ClientDashboard
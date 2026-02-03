import { useState, useEffect } from 'react'
import { fetchClients } from '../api/clients'

const Clients = () => {
    
    const [clients, setClients] = useState([])
    const [loading, setLoading] = useState(true)

    useEffect(() => {

        loadClients()
    }, [])

    const loadClients = async () => {

        try {
            
            const res = await fetchClients()
            setClients(res.data.clients)

        } catch (error) {

            console.error("failed to load clients")

        } finally{

            setLoading(false)

        }

        if(loading) return <p>Loading clients...</p>
    }

  return (

    <div>

        <h1 className='text-2xl font-bold mb-4'>Clients</h1>

        <div className='space-y-2'>

            {clients.map((c) => (

                <div
                key={c._id}
                className='p-4 rounded shadow'>

                    {c.email}
                </div>
            ))}

        </div>
    </div>

  )
}

export default Clients
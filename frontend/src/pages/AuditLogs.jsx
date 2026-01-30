import { useEffect, useState } from 'react'
import fetchAuditLogs from '../api/audit'

const AuditLogs = () => {
    const [logs, setLogs] = useState([])
    const [loading, setLoading] = useState(true)

    useEffect(() => {

        loadLogs()

    }, [])

    const loadLogs = async () => {

        try {

            const res = await fetchAuditLogs()
            setLogs(res.data)

        } catch (error) {
            
            console.error("Failed to fetch audit logs")

        } finally{

            setLoading(false)

        }
    }

    if(loading) return <p>Loading audit logs...</p>

  return (

    <div>
        
        <h1 className='text-2xl font-bold mb-4'>Audit logs</h1>

        <div className='space-y-2'>

            {logs.map((log) => (
                
                <div
                className='p-4 shadow rounded text-sm'
                key={log._id}>

                    <p className='font-medium'>
                        {log.action}
                    </p>

                    <p className='text-gray-500'>
                        {new Date(log.createdAt).toLocaleString()}
                    </p>
                </div>
                
            ))}
        </div>
    </div>
  )
}

export default AuditLogs
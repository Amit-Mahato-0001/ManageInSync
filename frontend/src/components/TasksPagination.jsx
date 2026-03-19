import { ArrowLeft, ArrowRight } from "lucide-react"


const TasksPagination = ({page, totalPages, onPageChange}) => {

  return (

    <div className="flex items-center justify-center gap-4 mt-4">

        <button 
        onClick={() => onPageChange(page - 1)} disabled={page === 1}
        className="bg-blue-500 rounded-full w-10 h-10 flex items-center justify-center justify-center text-white">

            <ArrowLeft size={18}/>

        </button>

        <span className="text-white bg-blue-500 rounded-full p-2">Page{page}</span>

        <button

        onClick={() => onPageChange(page + 1)} disabled={page === totalPages}
        className="bg-blue-500 rounded-full w-10 h-10 flex items-center justify-center text-white">

            <ArrowRight size={18}/>

        </button>
    </div>

  )
}

export default TasksPagination
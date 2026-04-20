import { ArrowLeft, ArrowRight } from "lucide-react"

const ProjectsPagination = ({ page, totalPages, onPageChange }) => {

  return (

    <div className="flex items-center justify-center gap-4 mt-6">

      {/* prev */}
      <button
        onClick={() => onPageChange(page - 1)}
        disabled={page === 1}
        className="flex items-center justify-center w-10 h-10 rounded-lg bg-[#18181B] border border-white/10 disabled:opacity-40"
      >
        <ArrowLeft className="h-6 w-6" />
      </button>

      {/* page info */}
      <div className="px-3 py-1 rounded-md bg-[#18181B] border border-white/10 text-white/70">
        {page} / {totalPages}
      </div>

      {/* next */}
      <button
        onClick={() => onPageChange(page + 1)}
        disabled={page === totalPages}
        className="flex items-center justify-center w-10 h-10 rounded-lg bg-[#18181B] border border-white/10 disabled:opacity-40"
      >
        <ArrowRight className="h-6 w-6" />
      </button>

    </div>

  )
}

export default ProjectsPagination

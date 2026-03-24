import { ArrowLeft, ArrowRight } from "lucide-react"

const ProjectsPagination = ({ page, totalPages, onPageChange }) => {

  return (

    <div className="flex items-center justify-center gap-3 mt-6">

      {/* PREV */}
      <button
        onClick={() => onPageChange(page - 1)}
        disabled={page === 1}
        className="flex items-center justify-center w-9 h-9 rounded-md bg-[#18181B] border border-white/10 disabled:opacity-40"
      >
        <ArrowLeft size={16} />
      </button>

      {/* PAGE INFO */}
      <div className="px-3 py-1 rounded-md bg-[#18181B] border border-white/10 text-sm text-white/70">
        {page} / {totalPages}
      </div>

      {/* NEXT */}
      <button
        onClick={() => onPageChange(page + 1)}
        disabled={page === totalPages}
        className="flex items-center justify-center w-9 h-9 rounded-md bg-[#18181B] border border-white/10 disabled:opacity-40"
      >
        <ArrowRight size={16} />
      </button>

    </div>

  )
}

export default ProjectsPagination
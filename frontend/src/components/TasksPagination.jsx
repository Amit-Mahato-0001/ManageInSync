import ProjectsPagination from "./ProjectsPagination"

const TasksPagination = ({ page, totalPages, onPageChange }) => {
  return <ProjectsPagination page={page} totalPages={totalPages} onPageChange={onPageChange} />
}

export default TasksPagination

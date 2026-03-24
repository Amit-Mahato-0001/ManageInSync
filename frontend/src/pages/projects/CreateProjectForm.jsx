import { Plus } from "lucide-react"

const CreateProjectForm = ({ name, setName, onSubmit }) => {

  return (
    <form onSubmit={onSubmit} className="flex gap-2">

      <input
        className="border border-white/10 px-4 py-2 rounded-md text-sm w-72 outline-none"
        placeholder="New project name..."
        value={name}
        onChange={(e) => setName(e.target.value)}
      />

      <button className="h-10 w-10 flex items-center justify-center rounded-md bg-blue-600">
        <Plus size={16} />
      </button>

    </form>
  )
}

export default CreateProjectForm
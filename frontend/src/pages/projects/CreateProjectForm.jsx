import { Plus } from "lucide-react"

const CreateProjectForm = ({ name, setName, onSubmit }) => {

  return (

    <form onSubmit={onSubmit} className="flex gap-2 mb-6">

      <input
        className="border border-gray-300 rounded-full p-2 w-64 hover:border-blue-500 focus:border-blue-500 focus:outline-none"
        placeholder="New project name"
        value={name}
        onChange={(e) => setName(e.target.value)}
      />

      <button className="h-10 w-10 flex items-center justify-center rounded-full bg-blue-500 text-white hover:bg-blue-600 transition shadow-sm">
        <Plus size={18} />
      </button>

    </form>

  )
}

export default CreateProjectForm;

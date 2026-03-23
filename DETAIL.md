# Projects Section Style Issue (Checked on 2026-03-23)

## Root Cause
Tailwind is loaded correctly, so this is **not** a Tailwind/config issue.

- Tailwind import exists in `frontend/src/index.css:1`.
- Global stylesheet is loaded in `frontend/src/main.jsx:3`.

The Projects UI looks unstyled because several extracted Projects subcomponents currently use minimal or missing utility classes compared to the previous styled version.

## Where Styles Are Missing
- `frontend/src/pages/projects/ProjectCard.jsx:34-45`
  Buttons (`Assign Clients`, `Assign Members`, delete) have no visual classes.
- `frontend/src/pages/projects/ProjectCard.jsx:77-84`
  Status `<select>` has no styling classes.
- `frontend/src/pages/projects/ProjectCard.jsx:53-54` and `:64-65`
  Icons/text badges are rendered without the previous badge/icon styling.
- `frontend/src/pages/projects/AssignClients.jsx:15-43`
  Dropdown is basic only (`absolute bg-white p-3 shadow`), labels/save button are mostly unstyled.
- `frontend/src/pages/projects/AssignMembers.jsx:15-43`
  Same issue as client dropdown.
- `frontend/src/pages/projects/CreateProjectForm.jsx:7`
  Input uses reduced classes (`border rounded-full p-2 w-64`) and misses prior hover/focus styling.

## Conclusion
The Projects section style is not fully implemented because style utility classes were not fully carried over when the page was split into `frontend/src/pages/projects/*` components.  
No application code was changed during this check.

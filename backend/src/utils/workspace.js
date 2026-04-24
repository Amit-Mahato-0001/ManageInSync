const escapeRegExp = (value = "") =>
    value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")

const normalizeWorkspaceInput = (value = "") =>
    typeof value === "string" ? value.trim().toLowerCase() : ""

const slugifyWorkspaceName = (value = "") => {
    const normalized = normalizeWorkspaceInput(value)

    return (
        normalized
            .replace(/[^a-z0-9]+/g, "-")
            .replace(/^-+|-+$/g, "")
            .replace(/-{2,}/g, "-")
            .slice(0, 60) || "workspace"
    )
}

const buildWorkspaceLookupQuery = (workspace = "") => {
    const trimmedWorkspace = typeof workspace === "string" ? workspace.trim() : ""
    const normalizedWorkspace = normalizeWorkspaceInput(trimmedWorkspace)

    if (!trimmedWorkspace || !normalizedWorkspace) {
        return null
    }

    return {
        $or: [
            {
                slug: normalizedWorkspace
            },
            {
                name: {
                    $regex: `^${escapeRegExp(trimmedWorkspace)}$`,
                    $options: "i"
                }
            }
        ]
    }
}

module.exports = {
    buildWorkspaceLookupQuery,
    normalizeWorkspaceInput,
    slugifyWorkspaceName
}

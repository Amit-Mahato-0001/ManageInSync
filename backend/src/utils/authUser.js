const serializeAuthUser = (user) => {
    if (!user) {
        return null
    }

    return {
        _id: user._id,
        email: user.email,
        name: user.name || null,
        logoUrl: user.logoUrl || null,
        role: user.role,
        status: user.status,
        tenantId: user.tenantId
    }
}

module.exports = { serializeAuthUser }

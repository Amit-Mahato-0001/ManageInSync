const serializeAuthUser = (user) => {
    if (!user) {
        return null
    }

    return {
        _id: user._id,
        email: user.email,
        role: user.role,
        status: user.status,
        tenantId: user.tenantId
    }
}

module.exports = { serializeAuthUser }

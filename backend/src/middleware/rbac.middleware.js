{/* YE CHECK KREGA KI USER KA ROLE ALLOWED HE YA NHI */}

//req se user ka role nikalo
//user role nhi mila toh error show
//allowed roles me user role nhi mile toh error

const requireRole = (allowedRoles = []) => {
    
    return(req, res, next) => {
        const userRole = req.user?.role

        if(!userRole){
            return res.status(403).json({ message: "Role not found"})
        }

        if(!allowedRoles.includes(userRole)){
            return res.status(403).json({ message: "Access denied"})
        }

        next()

    }
}

module.exports = requireRole
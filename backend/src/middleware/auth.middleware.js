const jwt = require("jsonwebtoken");
const User = require("../models/user.model")

const authenticate = async (req, res, next) => {
    
    const authHeader = req.headers.authorization;

    if(!authHeader || !authHeader.startsWith("Bearer ")){
        return res.status(401).json({ message: "Unauthorized" });
    }

    const token = authHeader.split(" ")[1];

    try{

        const decoded = jwt.verify(token, process.env.JWT_SECRET);

        const user = await User.findById(decoded.userId)

        if(!user){
            
            return res.status(401).json( {message: "User not found"})
        }

        req.user = user

        next();

    } catch (error){

        next(error)
    }
}

module.exports = authenticate;
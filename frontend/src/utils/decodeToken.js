export const decodeToken = (token) => {

    try {
        
        const payload = JSON.parse(atob(token.split(".")[1]))

        return payload

    } catch (error) {
        
        return null
    }
}

//atob -> ASCII to binary
//JSON.parse() -> JSON string to JS object
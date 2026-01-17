const jwt = require('jsonwebtoken');
require('dotenv').config();

const protect = (req, res, next) => {
    let token;

    // 1. Check if the "Authorization" header exists and starts with "Bearer"
    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
        try {
            // 2. Get the token from the header (remove "Bearer " string)
            token = req.headers.authorization.split(' ')[1];

            // 3. Verify the token using your Secret Key
            const decoded = jwt.verify(token, process.env.JWT_SECRET);

            // 4. Add the user ID to the request object so the route can use it
            req.user = decoded; 
            
            // 5. Allow access to the route
            next(); 
        } catch (error) {
            console.error(error);
            res.status(401).json({ message: 'Not authorized, token failed' });
        }
    }

    if (!token) {
        res.status(401).json({ message: 'Not authorized, no token' });
    }
};

module.exports = { protect };
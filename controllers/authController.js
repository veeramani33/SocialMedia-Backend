const User = require('../models/User')
const bcrypt = require('bcrypt')
const jwt = require('jsonwebtoken')

// @desc Login
// @route POST /auth
// @access Public
const login = async (req, res) => {
    const { email, password } = req.body;

    if (!password || !email || password.trim() === '' || email.trim() === '') {
        return res.status(400).json({ message: 'All fields are required' });
    }

    const foundUser = await User.findOne({ email }).exec();

    if (!foundUser) {
        return res.status(401).json({ message: 'Unauthorized' });
    }

    const match = await bcrypt.compare(password, foundUser.password);

    if (!match) return res.status(401).json({ message: 'Unauthorized' });

    const accessToken = jwt.sign(
        {
            "UserInfo": {
                "id": foundUser._id,   
                "username": foundUser.username,
                "email": foundUser.email
            }
        },
        process.env.ACCESS_TOKEN_SECRET,
        { expiresIn: '15m' }
    );

    const refreshToken = jwt.sign(
        { "email": foundUser.email },
        process.env.REFRESH_TOKEN_SECRET,
        { expiresIn: '7d' }
    );

    // Create secure cookie with refresh token 
    res.cookie('jwt', refreshToken, {
        httpOnly: true, 
        secure: true, 
        sameSite: 'None', 
        maxAge: 7 * 24 * 60 * 60 * 1000 
    });

    // Send accessToken containing username and roles 
    res.json({ 
        accessToken, 
        user: {
            id: foundUser._id,     
            email: foundUser.email, 
        }
    });
};


// @desc Create new user
// @route POST /users
// @access Private
const Register = async (req, res) => {
    const { username, password, email } = req.body;

    // Validate input
    if (!username || !password || !email) {
        return res.status(400).json({ message: 'All fields are required' });
    }

    try {
        // Check for duplicate email
        const duplicate = await User.findOne({ email }).collation({ locale: 'en', strength: 2 }).lean().exec();
        if (duplicate) {
            return res.status(409).json({ message: 'Email is already in use' });
        }

        // Hash password
        const hashedPwd = await bcrypt.hash(password, 10);

        // Create new user object
        const userObject = { username, email, password: hashedPwd };

        // Save to DB
        const user = await User.create(userObject);

        if (user) {
            const accessToken = jwt.sign(
                {
                    "UserInfo": {
                        "username": username,
                        "email" : email,
                        "id": user._id, // Include the user ID
                    }
                },
                process.env.ACCESS_TOKEN_SECRET,
                { expiresIn: '15m' }
            );

            const refreshToken = jwt.sign(
                { "email": email },
                process.env.REFRESH_TOKEN_SECRET,
                { expiresIn: '7d' }
            );

            // Create secure cookie with refresh token 
            res.cookie('jwt', refreshToken, {
                httpOnly: true, 
                secure: true, 
                sameSite: 'None', 
                maxAge: 7 * 24 * 60 * 60 * 1000 
            });

            // Send accessToken containing username and roles 
            res.json({
                accessToken,
                user: {
                    id: user._id,   
                    email: user.email 
                }
            });
        }

    } catch (err) {
        res.status(500).json({ message: 'Internal Server Error', error: err.message });
    }
};



// @desc Refresh
// @route GET /auth/refresh
// @access Public - because access token has expired
const refresh = (req, res) => {
    const cookies = req.cookies

    if (!cookies?.jwt) return res.status(401).json({ message: 'Unauthorized' })

    const refreshToken = cookies.jwt

    jwt.verify(
        refreshToken,
        process.env.REFRESH_TOKEN_SECRET,
        async (err, decoded) => {
            if (err) return res.status(403).json({ message: 'Forbidden' })

            const foundUser = await User.findOne({ email: decoded.email }).exec()

            if (!foundUser) return res.status(401).json({ message: 'Unauthorized' })

            const accessToken = jwt.sign(
                {
                    "UserInfo": {
                        "username": foundUser.username,
                        "email": foundUser.email
                    }
                },
                process.env.ACCESS_TOKEN_SECRET,
                { expiresIn: '15m' }
            )

            res.json({ accessToken })
        }
    )
}

// @desc Logout
// @route POST /auth/logout
// @access Public - just to clear cookie if exists
const logout = (req, res) => {
    const cookies = req.cookies
    if (!cookies?.jwt) return res.sendStatus(204) //No content
    res.clearCookie('jwt', { httpOnly: true, sameSite: 'None', secure: true })
    res.json({ message: 'Cookie cleared' })
}

module.exports = {
    login,
    Register,
    refresh,
    logout
}
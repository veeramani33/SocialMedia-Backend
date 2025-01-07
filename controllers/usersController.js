const User = require('../models/User')
const Post = require('../models/Post')
const Friend = require('../models/Friend')
const Message = require('../models/Message') 
const bcrypt = require('bcrypt')

// @desc Get all users expect current user
// @route GET /users
// @access Private
const getAllUsers = async (req, res) => {
    const currentUserId = req.user.id; // Assuming the current user's ID is passed through authentication middleware
    console.log(currentUserId);
    // Get all users except the current user, and exclude password field
    const users = await User.find({ _id: { $ne: currentUserId } })
        .select('-password')
        .lean();

    // If no users found
    if (!users?.length) {
        return res.status(400).json({ message: 'No users found' });
    }

    res.json(users);
};

const searchUsers = async (req, res) => {
    const { search } = req.query;
  
    // Ensure the search query exists and is valid
    if (!search || typeof search !== "string" || search.trim() === "") {
      return res.status(400).json({ message: "Invalid search query" });
    }
  
    const users = await User.find({
      name: { $regex: search, $options: "i" }, // Case-insensitive search
    }).select("name profilePicture"); // Only return necessary fields
  
    res.json(users);
  };
  


// @desc Get all information for particular user
// route get /users/id
const getUserDetails = async (req, res) => {
    const { userId } = req.params; // Assuming the user ID is passed as a parameter
    console.log(userId);
    if (!userId) {
        return res.status(400).json({ message: 'User ID is required' });
    }

    try {
        // Find the user by ID
        const user = await User.findById(userId).exec();
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        // Fetch the posts related to the user
        const posts = await Post.find({ userId: userId }).exec();

        // Fetch the messages related to the user (either as sender or receiver)
        const messages = await Message.find({
            $or: [{ sender: userId }, { receiver: userId }]
        }).exec();

        // Fetch the friends related to the user
        const friendships = await Friend.find({
            $or: [{ requester: userId }, { recipient: userId }],
            status: 'accepted' // Only fetch accepted friendships
        }).exec();

        // Extract the friends' user details
        const friendIds = friendships.map(friend => 
            friend.requester.toString() === userId ? friend.recipient : friend.requester
        );
        
        const friends = await User.find({ _id: { $in: friendIds } }).select('-password').exec();
        
        // Combine the user data with their related posts, messages, and chats
        const userDetails = {
            user,
            posts,
            messages,
            friends
        };

        res.json(userDetails);
    } catch (err) {
        res.status(500).json({ message: 'Internal Server Error', error: err.message });
    }
};



// @desc Create new user
// @route POST /users
// @access Private
const createNewUser = async (req, res) => {
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
        const userObject = { name: username, email, password: hashedPwd };

        // Save to DB
        const user = await User.create(userObject);

        if (user) {
            res.status(201).json({ message: `New user ${username} created successfully` });
        } else {
            res.status(400).json({ message: 'Failed to create user' });
        }
    } catch (err) {
        res.status(500).json({ message: 'Internal Server Error', error: err.message });
    }
};


// @desc Update a user
// @route PATCH /users
// @access Private
const updateUser = async (req, res) => {
    const { id, username, email, password, profilePicture } = req.body;

    // Confirm data 
    if (!id || !username || !email) {
        return res.status(400).json({ message: 'All fields except password and profile picture are required' });
    }

    try {
        // Check if the user exists
        const user = await User.findById(id).exec();
        if (!user) {
            return res.status(400).json({ message: 'User not found' });
        }

        // Check for duplicate email
        const duplicate = await User.findOne({ email }).collation({ locale: 'en', strength: 2 }).lean().exec();
        if (duplicate && duplicate?._id.toString() !== id) {
            return res.status(409).json({ message: 'Duplicate email' });
        }

        // Update fields
        user.name = username;
        user.email = email;

        if (password) {
            // Hash the password before updating
            user.password = await bcrypt.hash(password, 10); // salt rounds
        }

        if (profilePicture) {
            // Update profile picture if provided
            user.profilePicture = profilePicture;
        }

        // Save updated user
        const updatedUser = await user.save();

        res.json({ message: `${updatedUser.name} updated`, user: updatedUser });
    } catch (err) {
        res.status(500).json({ message: 'Internal Server Error', error: err.message });
    }
};


// @desc Delete a user
// @route DELETE /users
// @access Private
const deleteUser = async (req, res) => {
    const { id } = req.body;

    // Confirm data
    if (!id) {
        return res.status(400).json({ message: 'User ID is required' });
    }

    try {
        // Check if the user exists
        const user = await User.findById(id).exec();
        if (!user) {
            return res.status(400).json({ message: 'User not found' });
        }

        // Delete user's posts
        await Post.deleteMany({ user: id });

        // Delete friendships where the user is involved
        await Friend.deleteMany({ $or: [{ requester: id }, { recipient: id }] });

        // Delete messages sent or received by the user
        await Message.deleteMany({ $or: [{ sender: id }, { receiver: id }] });

        // Finally, delete the user
        const result = await user.deleteOne();

        const reply = `User ${result.name} with ID ${result._id} and all related data deleted`;
        res.json({ message: reply });
    } catch (err) {
        res.status(500).json({ message: 'Internal Server Error', error: err.message });
    }
};


module.exports = {
    getAllUsers,
    getUserDetails,
    createNewUser,
    updateUser,
    searchUsers,
    deleteUser
}
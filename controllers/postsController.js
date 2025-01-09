const Post = require('../models/Post');
const User = require('../models/User'); 

const getPost = async (req, res) => {
    try {
        // Fetch all posts, populated with the user data, sorted by creation date
        const posts = await Post.find()
            .sort({ createdAt: -1 }) // Sort in descending order of createdAt
            .populate('userId', 'name profilePicture') // Populate the 'userId' field with 'username' and 'profilePicture' from the User model
            .exec();

        // Map through the posts and include the date/time formatted as needed
        const postsWithDetails = posts.map(post => {
            return {
                _id: post._id,
                content: post.content,
                userId: {
                    name: post.userId.name,  // Adding the username
                    profilePicture: post.userId.profilePicture,  // Adding the profile picture URL
                },
                createdAt: post.createdAt,  // Date and time of the post
                formattedDate: post.createdAt.toLocaleString(),  // Optional: formatted date-time string
            };
        });

        // Return the posts along with additional details
        res.status(200).json({
            message: 'Posts retrieved successfully',
            posts: postsWithDetails
        });
    } catch (err) {
        res.status(500).json({
            message: 'Error retrieving posts',
            error: err.message
        });
    }
};


const getPostById = async (req, res) => {
    const { id } = req.params; 

    if (!id) {
        return res.status(400).json({ message: 'Post ID is required' });
    }

    try {
        // Find the post by ID
        const post = await Post.findById(id).populate('userId', 'name email').populate('tags', 'name email').exec();
        if (!post) {
            return res.status(404).json({ message: 'Post not found' });
        }

        // Return the post details
        res.status(200).json({
            message: 'Post retrieved successfully',
            post
        });
    } catch (err) {
        res.status(500).json({
            message: 'Error retrieving post',
            error: err.message
        });
    }
};


const createPost = async (req, res) => {
    const { userId, text, media, tags } = req.body; 

    // Confirm that the userId is provided
    if (!userId) {
        return res.status(400).json({ message: 'User ID is required' });
    }

    // Validate that the user exists
    const user = await User.findById(userId).exec();
    if (!user) {
        return res.status(400).json({ message: 'User not found' });
    }

    // Ensure tags are valid users (optional validation step)
    if (tags && tags.length > 0) {
        const validTags = await User.find({ '_id': { $in: tags } }).exec();
        if (validTags.length !== tags.length) {
            return res.status(400).json({ message: 'Some tagged users do not exist' });
        }
    }

    // Create the post object based on the schema
    const newPost = new Post({
        userId,
        content: { text, media },
        tags // Ensure tags is passed as an array of ObjectIds
    });

    // Save the post
    try {
        const post = await newPost.save();
        res.status(201).json({
            message: 'Post created successfully',
            post: post
        });
    } catch (err) {
        res.status(500).json({ message: 'Error creating post', error: err.message });
    }
};



module.exports = { createPost, getPost, getPostById };

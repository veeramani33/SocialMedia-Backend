const Message = require('../models/Message'); // Import the Message model
const Friendship = require('../models/Friend'); // Import the Friendship model


const getMessages = async (req, res) => {
    const { userId, friendId } = req.query;
    console.log(userId, friendId);
    // Validate the required fields
    if (!userId || !friendId) {
        return res.status(400).json({ message: 'User and friend IDs are required' });
    }

    try {
        // Fetch the messages between the two users
        const messages = await Message.find({
            $or: [
                { sender: userId, receiver: friendId },
                { sender: friendId, receiver: userId }
            ]
        }).sort({ createdAt: 1 }).exec(); // Sort by creation date (ascending)

        if (!messages.length) {
            return res.status(200).json({ message: 'No messages found between these users' });
        }

        res.json({ messages });
    } catch (err) {
        res.status(500).json({ message: 'Error fetching messages', error: err.message });
    }
};


const sendMessage = async (req, res) => {
    const { senderId, receiverId, content } = req.body;

    // Validate the required fields
    if (!senderId || !receiverId || !content) {
        return res.status(400).json({ message: 'Sender, receiver, and content are required' });
    }

    try {
        // Check if sender and receiver are friends (status should be 'accepted')
        const friendship = await Friendship.findOne({
            $or: [
                { requester: senderId, recipient: receiverId, status: 'accepted' },
                { requester: receiverId, recipient: senderId, status: 'accepted' }
            ]
        }).exec();

        if (!friendship) {
            return res.status(403).json({ message: 'You can only send messages to friends' });
        }

        // Create and save the new message
        const newMessage = new Message({
            sender: senderId,
            receiver: receiverId,
            content,
            isRead: false // Initially set to false
        });

        const savedMessage = await newMessage.save();

        res.status(201).json({
            message: 'Message sent successfully',
            messageData: savedMessage
        });
    } catch (err) {
        res.status(500).json({ message: 'Error sending message', error: err.message });
    }
};



module.exports = { sendMessage, getMessages };

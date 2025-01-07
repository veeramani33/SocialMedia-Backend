const Friendship = require('../models/Friend'); // Import Friendship model
const User = require('../models/User'); // Assuming you have a User model for validation

const getFriendRequests = async (req, res) => {
  const { userId } = req.params;  // Get the user ID from the URL

  if (!userId) {
    return res.status(400).json({ message: 'User ID is required' });
  }

  try {
    // Find all pending friend requests where the current user is the recipient
    const friendRequests = await Friendship.find({
      recipient: userId,
      status: 'pending'  // Only pending requests
    })
    .populate('requester', 'username profilePicture')  // Populating the requester field with username and profilePicture
    .exec();  // Execute the query

    if (friendRequests.length === 0) {
      console.log('No friend request found');
        return res.status(200).json([]);
    }

    // Return the populated friend requests
    res.json(friendRequests);
  } catch (err) {
    res.status(500).json({ message: 'Error fetching friend requests', error: err.message });
  }
};

const getUsersNotInFriendList = async (req, res) => {
    const { userId } = req.params;  // Get the current user ID from the URL
  
    if (!userId) {
      return res.status(400).json({ message: 'User ID is required' });
    }
  
    try {
      // Find all accepted friendships where the current user is either the requester or recipient
      const friendships = await Friendship.find({
        $or: [
          { requester: userId, status: 'accepted' },
          { recipient: userId, status: 'accepted' }
        ]
      })
      .exec();  // Execute the query
  
      // Extract the list of friends (both requester and recipient)
      const friends = friendships.map(friendship => {
        return friendship.requester.toString() === userId.toString()
          ? friendship.recipient
          : friendship.requester;
      });
  
      // Find all users who are not the current user and not in their friend list
      const usersNotInFriendList = await User.find({
        _id: { $nin: [userId, ...friends] }  // Excluding the current user and their friends
      })
      .select('name profilePicture');  // Projecting only 'name' and 'profilePicture'
  
      if (usersNotInFriendList.length === 0) {
        console.log('No users found');
        return res.status(200).json([]);
      }
  
      // Return the list of users not in the friend list
      res.json(usersNotInFriendList);
    } catch (err) {
      res.status(500).json({ message: 'Error fetching users not in friend list', error: err.message });
    }
  };
  
  

const sendFriendRequest = async (req, res) => {
    const { requesterId, recipientId } = req.body; // Extracting required data from the request body

    // Confirm data is present
    if (!requesterId || !recipientId) {
        return res.status(400).json({ message: 'Requester and recipient IDs are required' });
    }

    // Validate if both users exist
    const requester = await User.findById(requesterId).exec();
    const recipient = await User.findById(recipientId).exec();

    if (!requester || !recipient) {
        return res.status(404).json({ message: 'Requester or recipient not found' });
    }

    // Check if a friendship already exists (either pending or accepted)
    const existingFriendship = await Friendship.findOne({
        $or: [
            { requester: requesterId, recipient: recipientId },
            { requester: recipientId, recipient: requesterId }
        ]
    }).exec();

    if (existingFriendship) {
        return res.status(409).json({ message: 'Friendship request already exists' });
    }

    // Create the friendship request
    const newFriendship = new Friendship({
        requester: requesterId,
        recipient: recipientId,
        status: 'pending' // Initial status is 'pending'
    });

    try {
        const savedFriendship = await newFriendship.save();
        res.status(201).json({
            message: 'Friend request sent successfully',
            friendship: savedFriendship
        });
    } catch (err) {
        res.status(500).json({ message: 'Error sending friend request', error: err.message });
    }
};

// accepting request
const acceptFriendRequest = async (req, res) => {
    const { requesterId, recipientId } = req.body; // Extracting required data from the request body

    // Confirm data is present
    if (!requesterId || !recipientId) {
        return res.status(400).json({ message: 'Requester and recipient IDs are required' });
    }

    try {
        // Find the friendship request with status 'pending' between the two users
        const friendship = await Friendship.findOne({
            requester: requesterId,
            recipient: recipientId,
            status: 'pending'
        }).exec();

        if (!friendship) {
            return res.status(404).json({ message: 'Friend request not found or already accepted' });
        }

        // Update the friendship status to 'accepted'
        friendship.status = 'accepted';
        const updatedFriendship = await friendship.save();

        res.json({
            message: 'Friend request accepted',
            friendship: updatedFriendship
        });
    } catch (err) {
        res.status(500).json({ message: 'Error accepting friend request', error: err.message });
    }
};


module.exports = { getFriendRequests, sendFriendRequest, acceptFriendRequest, getUsersNotInFriendList };

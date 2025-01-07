const express = require('express')
const router = express.Router()
const friendsController = require('../controllers/friendsController')
const verifyJWT = require('../middleware/verifyJWT')

router.use(verifyJWT)

router.route('/')
    .post(friendsController.sendFriendRequest)
    .patch(friendsController.acceptFriendRequest)

router.route('/requests/:userId')
    .get(friendsController.getFriendRequests)

router.route('/notfriends/:userId')
    .get(friendsController.getUsersNotInFriendList)
    
module.exports = router
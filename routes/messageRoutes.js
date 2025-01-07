const express = require('express')
const router = express.Router()
const messagesController = require('../controllers/messageController')
const verifyJWT = require('../middleware/verifyJWT')

router.use(verifyJWT)

router.route('/')
    .post(messagesController.sendMessage)
    .get(messagesController.getMessages)

module.exports = router
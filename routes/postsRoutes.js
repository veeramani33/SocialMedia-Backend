const express = require('express');
const router = express.Router();
const postsController = require('../controllers/postsController');
const verifyJWT = require('../middleware/verifyJWT');

router.use(verifyJWT);

router.route('/')
    .get(postsController.getPost)
    .post(postsController.createPost);

router.route('/:id')
    .get(postsController.getPostById); // Add this route

module.exports = router;

const mongoose = require('mongoose');

const postSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true }, // Reference to the User model
  content: {
    text: { type: String, default: null },
    media: [{ type: String , default: null}] // URLs or paths for videos, images, etc.
  },
  tags: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User', default: [] }], // Tagged friends
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
}, { timestamps: true }); // Adds createdAt and updatedAt fields automatically

module.exports = mongoose.model('Post', postSchema);

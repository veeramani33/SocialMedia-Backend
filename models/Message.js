const mongoose = require('mongoose');

const messageSchema = new mongoose.Schema({
  sender: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true }, // User sending the message
  receiver: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true }, // User receiving the message
  content: { type: String, required: true }, // Text of the message
  isRead: { type: Boolean, default: false }, // Tracks if the message has been read
  createdAt: { type: Date, default: Date.now }
}, { timestamps: true }); // Adds createdAt and updatedAt fields

module.exports = mongoose.model('Message', messageSchema);

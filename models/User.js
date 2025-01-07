const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  id: { type: mongoose.Schema.Types.ObjectId, auto: true },
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  friends: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User', default: [] }],
  profilePicture: { type: String, default: null }, // URL or file path
}, { timestamps: true });

module.exports = mongoose.model('User', userSchema);

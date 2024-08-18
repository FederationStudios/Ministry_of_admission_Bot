// db.js
const mongoose = require('mongoose');

const patrolSchema = new mongoose.Schema({
  userId: String,
  patrolStart: Date,
  images: [String],
  isActive: Boolean
});

const Patrol = mongoose.model('Patrol', patrolSchema);

module.exports = { Patrol };

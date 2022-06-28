const mongoose = require('mongoose')

const Schema = mongoose.Schema

const contactSchema = new Schema({
  name: { type: String, required: true },
  number: { type: String },
  email: { type: String },
  creator: { type: mongoose.Types.ObjectId, required: true, ref: 'User' },
})

module.exports = mongoose.model('Contact', contactSchema)

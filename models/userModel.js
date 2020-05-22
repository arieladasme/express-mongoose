const mongoose = require('mongoose')
const validator = require('validator')

// name email photo password passwordConfim

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Must have a name'],
    unique: true,
  },
  email: {
    type: String,
    required: [true, 'Must have email'],
    unique: true,
    lowercase: true,
    validate: [validator.isEmail, 'Please provide a valid email'],
  },
  photo: String,
  password: {
    type: String,
    required: [true, 'Must have a pw'],
    minlength: 8,
  },
  passwordConfirm: {
    type: String,
    required: [true, 'Must confirm email'],
  },
})

const User = mongoose.model('User', userSchema)
module.exports = User

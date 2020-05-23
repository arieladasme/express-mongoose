const mongoose = require('mongoose')
const validator = require('validator')
const bcrypt = require('bcryptjs')

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
    select: false,
  },
  passwordConfirm: {
    type: String,
    required: [true, 'Must confirm email'],
    validate: {
      // This only works on CREATE and SAVE !
      validator: function (el) {
        return el === this.password
      },
      message: 'Password are not the same!',
    },
  },
})

// Encriptar pw
userSchema.pre('save', async function (next) {
  //
  // si la pw ha sido modificada se ejecutara esta f()
  if (!this.isModified('password')) return next()

  // hash(encripta) pw whit cost of 12
  this.password = await bcrypt.hash(this.password, 12)
  // delete pwConfirm
  this.passwordConfirm = undefined
  next()
})

userSchema.methods.correctPassword = async function (
  candidatePassword,
  userPassword
) {
  return await bcrypt.compare(candidatePassword, userPassword)
}

const User = mongoose.model('User', userSchema)
module.exports = User

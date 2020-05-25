const mongoose = require('mongoose')
const validator = require('validator')
const bcrypt = require('bcryptjs')

// name email photo password passwordConfim

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Must have a name'],
  },
  email: {
    type: String,
    unique: true,
    required: [true, 'Must have email'],
    lowercase: true,
    validate: [validator.isEmail, 'Please provide a valid email'],
  },
  photo: String,
  role: {
    type: String,
    enum: ['user', 'guide', 'lead-guide', 'admin'],
    default: 'user',
  },
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
  passwordChangeAt: { type: Date },
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

// la palabra this apunta al documento actual
userSchema.methods.changedPasswordAfter = function (JWTTimestamp) {
  // si no existe el campo es porque nunca ha cambiado pw
  if (this.passwordChangeAt) {
    const changedTimestamp = parseInt(
      this.passwordChangeAt.getTime() / 1000,
      10
    )

    console.log(changedTimestamp, JWTTimestamp)
    return JWTTimestamp < changedTimestamp
  }

  // false means NOT changes
  return false
}

const User = mongoose.model('User', userSchema)
module.exports = User

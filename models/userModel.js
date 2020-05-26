const crypto = require('crypto')
const mongoose = require('mongoose')
const validator = require('validator')
const bcrypt = require('bcryptjs')

// name email photo password passwordConfim

const userSchema = new mongoose.Schema({
  name: { type: String, required: [true, 'Must have a name'] },
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
  passwordResetToken: String,
  passwordResetExpires: Date,
  active: {
    type: Boolean,
    default: true,
    select: false,
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

userSchema.pre('save', function (next) {
  if (!this.isModified('password') || this.isNew) return next()

  // se resta 1 seg ya que el guardar en la db se demora mas que generar un token
  this.passwordChangeAt = Date.now() - 1000
  next()
})

// filtro usuarios inactivos
userSchema.pre(/^find/, function (next) {
  this.find({ active: { $ne: false } }) // != false
  next()
})

userSchema.methods.correctPassword = async function (candidatePassword, userPassword) {
  return await bcrypt.compare(candidatePassword, userPassword)
}

// la palabra this apunta al documento actual
userSchema.methods.changedPasswordAfter = function (JWTTimestamp) {
  // si no existe el campo es porque nunca ha cambiado pw
  if (this.passwordChangeAt) {
    const changedTimestamp = parseInt(this.passwordChangeAt.getTime() / 1000, 10)

    console.log(changedTimestamp, JWTTimestamp)
    return JWTTimestamp < changedTimestamp
  }

  // false means NOT changes
  return false
}

userSchema.methods.createPasswordResetToken = function () {
  // Creo un token random de 32 caracteres y lo codifico a hexadecimal
  const resetToken = crypto.randomBytes(32).toString('hex')

  this.passwordResetToken = crypto.createHash('sha256').update(resetToken).digest('hex')

  console.log({ resetToken }, this.passwordResetToken)

  this.passwordResetExpires = Date.now() + 10 * 60 * 1000 // milisec

  return resetToken
}

const User = mongoose.model('User', userSchema)
module.exports = User

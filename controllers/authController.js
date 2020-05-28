const crypto = require('crypto')
const { promisify } = require('util')
const jwt = require('jsonwebtoken')
const User = require('./../models/userModel')
const catchAsync = require('./../utils/catchAsync')
const AppError = require('./../utils/appError')
const sendEmail = require('./../utils/email')

const signToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN,
  })
}

const createSendToken = (user, statusCode, res) => {
  const token = signToken(user._id)

  const cookieOptions = {
    // multiplicaciones para pasar a milisegundos
    expires: new Date(Date.now() + process.env.JWT_COOKIE_EXPIRES_IN * 24 * 60 * 60 * 1000),
    //secure: true, // para que se envie el token solo con https
    httpOnly: true, // para que el navegador no acceda ni modifique
  }

  if (process.env.NODE_ENV === 'production') cookieOptions.secure = true

  res.cookie('jwt', token, cookieOptions)

  // remove the pw from output
  user.password = undefined

  res.status(statusCode).json({
    status: 'success',
    token,
    data: { user },
  })
}

exports.signup = catchAsync(async (req, res, next) => {
  //const newUser = await User.create(req.body)

  const newUser = await User.create({
    name: req.body.name,
    email: req.body.email,
    role: req.body.role,
    password: req.body.password,
    passwordConfirm: req.body.passwordConfirm,
    passwordChangeAt: req.body.passwordChangeAt,
    passwordResetToken: req.body.passwordResetToken,
    passwordResetExpires: req.body.passwordResetExpires,
  })

  createSendToken(newUser, 201, res)
})

exports.login = catchAsync(async (req, res, next) => {
  const { email, password } = req.body

  /*
   * CHECK IF EMAIL AND PW EXIST
   */
  if (!email || !password) {
    return next(new AppError('Please provide email and password', 400))
  }

  /*
   * CHECK IF USER EXISTS AND PW IS CORRECT
   */
  const user = await User.findOne({ email }).select('+password')
  //const correct = await user.correctPassword(password, user.password)

  if (!user || !(await user.correctPassword(password, user.password))) {
    // 401: no autorizado
    return next(new AppError('Incorrect email or password', 401))
  }

  /*
   * IF EVERYTHING OK, SEND TOKEN TO CLIENT
   */
  createSendToken(user, 200, res)
})

exports.protect = catchAsync(async (req, res, next) => {
  /*
   * GETTING TOKEN AND CHECK OF ITS THERE
   */
  let token
  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    // consigo el token dividiendo co split
    token = req.headers.authorization.split(' ')[1]
  }

  if (!token) {
    return next(new AppError('Your are not logged in, please login', 401))
  }
  /*
   * VERIFICATION TOKEN
   * ver si se manipuló o si expiró
   */
  const decoded = await promisify(jwt.verify)(token, process.env.JWT_SECRET)

  /*
   * CHECK IF USER STILL EXISTS
   */
  const currentUser = await User.findById(decoded.id)
  if (!currentUser) {
    return next(new AppError('The user belonging to this token does no longer exist', 401))
  }
  /*
   * CHECK IF USER CHANGED PW AFTER THE TOKEN WAS ISSUED
   */
  if (currentUser.changedPasswordAfter(decoded.iat)) {
    return next(new AppError('User recently changed password, please login again', 401))
  }

  // GRANT ACCES TO PROCTECTED ROUTE
  req.user = currentUser
  next()
})

exports.restrictTo = (...roles) => {
  return (req, res, next) => {
    // roles ['admin', 'lead-guide']. role='user'
    console.log('req.user::::::: ', req.user)
    if (!roles.includes(req.user.role)) {
      return next(new AppError('You do not have permission to perform this action', 403))
    }

    next()
  }
}

exports.forgotPassword = catchAsync(async (req, res, next) => {
  /*
   * GET USER BASED ON POSTed EMAIL
   */
  const user = await User.findOne({ email: req.body.email })
  if (!user) {
    return next(new AppError('There is no user with this email', 404))
  }
  /*
   * GENERATE THE RANDOM RESET TOKEN
   */
  const resetToken = user.createPasswordResetToken()
  // validateBeforeSave: false -> Desactiva los validadores del schema
  await user.save({ validateBeforeSave: false })

  /*
   * SEND IT TO USER'S EMAIL
   */

  const resetURL = `${req.protocol}://${req.get('host')}/api/v1/users/resetPassword/${resetToken}`
  const message = `Forgot your pw? Submit a PATCH request whit your new password and passwordConfirm to : ${resetURL}. \nIf you didn't forget your pw, please ignore this email`

  try {
    await sendEmail({
      email: user.email,
      subject: 'Your pw reset token (valid for 10 min)',
      message,
    })

    res.status(200).json({
      status: 'success',
      message: 'Token sent to email',
    })
  } catch (err) {
    user.passwordResetToken = undefined
    user.passwordResetExpires = undefined
    await user.save({ validateBeforeSave: false })

    // 500: error que sucedio por el lado del servidor
    return next(new AppError('There was an error sending the email. try again', 500))
  }
})
exports.resetPassword = catchAsync(async (req, res, next) => {
  /*
   * GET USER BASED ON THE TOKEN
   */
  const hashedToken = crypto.createHash('sha256').update(req.params.token).digest('hex')
  const user = await User.findOne({
    passwordResetToken: hashedToken,
    passwordResetExpires: { $gt: Date.now() },
  })
  /*
   * IF TOKEN HAS NOT EXPIRED, AND THERE IS USER, SET THE NEW PW
   */
  if (!user) {
    return next(new AppError('Token is invalid or expired', 400))
  }

  user.password = req.body.password
  user.passwordConfirm = req.body.passwordConfirm
  user.passwordResetToken = undefined
  user.passwordResetExpires = undefined

  await user.save()
  /*
   * UPDATE changedPasswordAt PROPERTY FOR THE USER
   */
  /*
   * LOG THE USER IN, SEND JWT
   */
  createSendToken(user, 200, res)
})

exports.updatePassword = async (req, res, next) => {
  /*
   * GET USER FROM COLLECTION
   */
  // por default password no esta incluido en la salida con +password de agrega
  const user = await User.findById(req.user.id).select('+password')

  /*
   * CHECK IF POSTED CURRENT PW IS CORRECT
   */
  if (!(await user.correctPassword(req.body.passwordCurrent, user.password))) {
    return next(new AppError('Password incorrect', 401))
  }

  /*
   * IF SO, UPDATE PW
   */

  user.password = req.body.password
  user.passwordConfirm = req.body.passwordConfirm
  //user.passwordChangeAt = Date.now()
  await user.save()

  /*
   * LOG USER IN, SEND JWT
   */
  createSendToken(user, 200, res)
}

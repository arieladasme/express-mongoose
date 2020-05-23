const jwt = require('jsonwebtoken')
const User = require('./../models/userModel')
const catchAsync = require('./../utils/catchAsync')
const AppError = require('./../utils/appError')

const signToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN,
  })
}

exports.signup = catchAsync(async (req, res, next) => {
  //const newUser = await User.create(req.body)

  const newUser = await User.create({
    name: req.body.name,
    email: req.body.email,
    password: req.body.password,
    passwordConfirm: req.body.passwordConfirm,
  })

  const token = signToken(newUser._id)

  // 201: creado
  res.status(201).json({
    status: 'success',
    token,
    data: { user: newUser },
  })
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
  const token = signToken(user._id)
  res.status(200).json({
    status: 'success',
    token,
  })
})

exports.protect = catchAsync(async (req, res, next) => {
  /*
   * GETTING TOKEN AND CHECK OF ITS THERE
   */
  let token
  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith('Bearer')
  ) {
    // consigo el token dividiendo co split
    token = req.headers.authorization.split(' ')[1]
  }
  console.log(token)

  if (!token) {
    return next(new AppError('Your are not logged in, please login', 401))
  }
  /*
   * VERIFICATION TOKEN
   */

  /*
   * CHECK IF USER STILL EXISTS
   */

  /*
   * CHECK IF USER CHANGED PW AFTER THE TOKEN WAS ISSUED
   */

  next()
})

const catchAsync = require('./../utils/catchAsync')
const User = require('./../models/userModel')
const AppError = require('./../utils/appError')
const factory = require('./handlerFactory')

const filterObj = (obj, ...allowedFields) => {
  const newObj = {}

  Object.keys(obj).forEach((el) => {
    if (allowedFields.includes(el)) newObj[el] = obj[el]
  })
  return newObj
}

exports.getMe = (req, res, next) => {
  req.params.id = req.user.id
  next()
}

exports.updateMe = catchAsync(async (req, res, next) => {
  /*
   * CREATE ERROR IF USER POSTS PASSWORD DATA
   */
  if (req.body.password || req.body.passwordConfirm) {
    return next(new AppError('This route es not for password update (updateMyPassword)', 400))
  }

  /*
   * FILTER FIELDS THAT ARE NOT ALLOWED TO BE UPDATED
   */
  const filteredBody = filterObj(req.body, 'name', 'email')

  /*
   * UPDATE USER DOCUMENT
   */
  const updatedUser = await User.findByIdAndUpdate(req.user.id, filteredBody, {
    new: true,
    runValidators: true,
  })

  res.status(200).json({
    status: 'success',
    data: { user: updatedUser },
  })
})

exports.deleteMe = catchAsync(async (req, res, next) => {
  await User.findByIdAndUpdate(req.user.id, { active: false })
  res.status(204).json({
    status: 'success',
    data: null,
  })
})

exports.getUser = factory.getOne(User)

exports.createUser = (req, res) => {
  res.status(500).json({
    status: 'error',
    message: 'This route is not defined! use /signup',
  })
}

exports.getAllUsers = factory.getAll(User)
// Do NOT update passwords width this!
exports.updateUser = factory.updateOne(User)
exports.deleteUser = factory.deleteOne(User)

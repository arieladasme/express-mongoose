const Tour = require('./../models/tourModel')
const APIFeatures = require('./../utils/apifeatures')
const catchAsync = require('./../utils/catchAsync')
const AppError = require('./../utils/appError')

// const tours = JSON.parse(
//   fs.readFileSync(`${__dirname}/../dev-data/data/tours-simple.json`)
// );

exports.aliasTopTours = async (req, res, next) => {
  req.query.limit = '5'
  req.query.sort = '-ratingsAverage,price'
  req.query.fields = 'name,price,ratingsAverage,summary,difficulty'
  next()
}

exports.getAllTours = catchAsync(async (req, res, next) => {
  // EXECUTE QUERY
  const features = new APIFeatures(Tour.find(), req.query).filter().sort().limitFields().paginate()
  const tours = await features.query

  // SEBD RESPONSE
  res.status(200).json({
    status: 'success',
    results: tours.length,
    data: {
      tours,
    },
  })
})
exports.getTour = catchAsync(async (req, res, next) => {
  const tour = await Tour.findById(req.params.id).populate('reviews')
  if (!tour) {
    return next(new AppError('Not tour found with that ID', 404))
  }

  res.status(200).json({
    status: 'success',
    data: {
      tour,
    },
  })
})

exports.createTour = catchAsync(async (req, res, next) => {
  //const newTour = new Tour({})
  //newTour.save()
  const newTour = await Tour.create(req.body)
  res.status(201).json({
    status: 'success',
    data: {
      tour: newTour,
    },
  })
})

exports.updateTour = catchAsync(async (req, res, next) => {
  const tour = await Tour.findByIdAndUpdate(req.params.id, req.body, {
    new: true,
    runValidators: true,
  })

  if (!tour) {
    return next(new AppError('Not tour found with that ID', 404))
  }

  res.status(200).json({
    status: 'success',
    data: {
      tour,
    },
  })
})

exports.deleteTour = catchAsync(async (req, res, next) => {
  const tour = await Tour.findByIdAndDelete(req.params.id)

  if (!tour) {
    return next(new AppError('Not tour found with that ID', 404))
  }

  res.status(204).json({
    status: 'success',
    data: null,
  })
})

exports.getToursStats = catchAsync(async (req, res, next) => {
  const stats = await Tour.aggregate([
    {
      $match: { ratingsAverage: { $gte: 4.5 } },
    },
    {
      $group: {
        _id: { $toUpper: '$difficulty' },
        numTours: { $sum: 1 },
        numRatings: { $sum: '$ratingsQuantity' },
        avgRating: { $avg: '$ratingsAverage' },
        avgPrice: { $avg: '$price' },
        minPrice: { $min: '$price' },
        maxPrice: { $max: '$price' },
      },
    },
    {
      $sort: { avgPrice: 1 },
    },
    //{
    //  $match: { _id: { $ne: 'EASY' } },
    //},
  ])

  res.status(200).json({
    status: 'success',
    data: {
      stats,
    },
  })
})

/**
 * Buscar mes mas ocupado de un año determinado
 */
exports.getMonthlyPlan = catchAsync(async (req, res, next) => {
  const year = req.params.year * 1 // 2021

  const plan = await Tour.aggregate([
    {
      $unwind: '$startDates', // Genera 1 documento por cada startDates
    },
    {
      $match: {
        startDates: {
          $gte: new Date(`${year}-01-01`), // $gte: >=
          $lte: new Date(`${year}-12-31`), // $lte: <=
        },
      },
    },
    {
      // group by month
      $group: {
        _id: { $month: '$startDates' }, // month (number)
        numTourStarts: { $sum: 1 }, // count(*)
        tours: { $push: '$name' }, // $push: agrega nombres encontrados
      },
    },
    {
      // $addFields: Agrega campos
      $addFields: { month: '$_id' }, // creo campo month con el dato de _id
    },
    {
      // Oculto campo
      $project: {
        _id: 0,
      },
    },
    {
      // Order By . 1:ASC -1:DESC
      $sort: { numTourStarts: -1 }, // order by numTourStarts DESC
    },
    {
      // LIMIT 12
      $limit: 12,
    },
  ])

  res.status(200).json({
    status: 'success',
    data: {
      plan,
    },
  })
})

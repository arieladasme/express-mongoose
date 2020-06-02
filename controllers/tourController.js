const Tour = require('./../models/tourModel')
const catchAsync = require('./../utils/catchAsync')
const AppError = require('./../utils/appError')
const factory = require('./handlerFactory')

// const tours = JSON.parse(
//   fs.readFileSync(`${__dirname}/../dev-data/data/tours-simple.json`)
// );

exports.aliasTopTours = async (req, res, next) => {
  req.query.limit = '5'
  req.query.sort = '-ratingsAverage,price'
  req.query.fields = 'name,price,ratingsAverage,summary,difficulty'
  next()
}

exports.getAllTours = factory.getAll(Tour)
exports.getTour = factory.getOne(Tour, { path: 'reviews' })
exports.createTour = factory.createOne(Tour)
exports.updateTour = factory.updateOne(Tour)
exports.deleteTour = factory.deleteOne(Tour)

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

// /tours-within/:distance/center/:latlng/unit/:unit
// /tours-within/234/center/-40,45/unit/mi
exports.getToursWithin = catchAsync(async (req, res, next) => {
  const { distance, latlng, unit } = req.params
  const [lat, lng] = latlng.split(',') // divido string por ","

  // Distance to Radian
  // if unit = 'mi' calculo millas, if unit = 'km' calculo kilometros
  const radius = unit === 'mi' ? distance / 3963.2 : distance / 6378.1

  if (!lat || !lng) {
    next(new AppError('Please provide latitude and longitude in the format lat,lng', 400))
  }
  console.log(distance, lat, lng, unit)

  const tours = await Tour.find({
    startLocation: {
      $geoWithin: {
        $centerSphere: [[lng, lat], radius],
      },
    },
  })

  res.status(200).json({
    status: 'success',
    results: tours.length,
    data: { data: tours },
  })
})

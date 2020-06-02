// review , rating, createAt, ref to tour, ref to user
const mongoose = require('mongoose')
const Tour = require('./tourModel')

const reviewSchema = new mongoose.Schema(
  {
    review: { type: String, required: [true, 'Review can not be empty'] },
    rating: { type: Number, min: 1, max: 5 },
    createAt: { type: Date, default: Date() },
    tour: {
      type: mongoose.Schema.ObjectId,
      ref: 'Tour',
      required: [true, 'Review must belong to a tour'],
    },

    user: {
      type: mongoose.Schema.ObjectId,
      ref: 'User',
      required: [true, 'Review must belong to a user'],
    },
  },
  {
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
)

/**
 * QUERY MIDDLEWARE
 */

reviewSchema.pre(/^find/, function (next) {
  /*this.populate({
    path: 'tour',
    select: 'name',
  }).populate({
    path: 'user',
    select: 'name photo',
  })
*/
  this.populate({
    path: 'user',
    select: 'name photo',
  })

  next()
})

reviewSchema.statics.calcAverageRatings = async function (tourId) {
  const stats = await this.aggregate([
    {
      $match: { tour: tourId }, // tomo todos los review de este id
    },
    {
      $group: {
        _id: '$tour', // agrupo todos por tour
        nRating: { $sum: 1 }, // count (*)
        avgRating: { $avg: '$rating' }, // avg rating
      },
    },
  ])
  console.log(stats)

  await Tour.findByIdAndUpdate(tourId, {
    ratingsAverage: stats[0].nRating,
    ratingsQuantity: stats[0].avgRating,
  })
}

//post: despues de insertar aplico funcion
reviewSchema.post('save', function () {
  // this points to current review schema
  // constructor: apunta al modelo actual
  this.constructor.calcAverageRatings(this.tour)
})

const Review = mongoose.model('Review', reviewSchema)
module.exports = Review

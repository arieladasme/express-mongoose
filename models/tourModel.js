const mongoose = require('mongoose')
const slugify = require('slugify')
const validator = require('validator')

const tourSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'A tour must have a name'],
      unique: true,
      trim: true,
      maxlength: [40, 'A tour name must have less or equal then 40 characters'],
      minlength: [10, 'A tour name must have more or equal then 10 characters'],
      // isAlpha no acepta espacios
      // validate: [validator.isAlpha, 'Tour name must only contain characters'],
    },
    slug: String,
    duration: {
      type: Number,
      required: [true, 'A tour must have a duration'],
    },
    maxGroupSize: {
      type: Number,
      required: [true, 'A tour must have a group size'],
    },
    difficulty: {
      type: String,
      required: [true, 'A tour must have a difficulty'],
      enum: {
        values: ['easy', 'medium', 'difficulty'],
        message: 'Difficulty is either: easy, medium, difficult',
      },
    },
    ratingsAverage: {
      type: Number,
      default: 4.5,
      min: [1, 'Rating must be above 1.0'],
      max: [5, 'Rating must be below 5.0'],
    },
    ratingsQuantity: {
      type: Number,
      default: 0,
    },
    price: {
      type: Number,
      required: [true, 'A tour must have a price'],
    },
    priceDiscount: {
      type: Number,
      validate: {
        validator: function (val) {
          // Validador personalizado
          // solo funciona con nuevos documentos (actual)
          return val < this.price
        },
        message: 'Discount price ({VALUE}) should be below regular price',
      },
    },
    summary: {
      type: String,
      trim: true,
      required: [true, 'A tour must have a description'],
    },
    description: {
      type: String,
      trim: true,
    },
    imageCover: {
      type: String,
      required: [true, 'A tour must have a cover image'],
    },
    images: [String],
    createAt: {
      type: Date,
      default: Date.now(),
      select: false,
    },
    startDates: [Date],
    secretTour: {
      type: Boolean,
      default: false,
    },
  },
  {
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
)

// Duracion de recorrido en semanas
tourSchema.virtual('durationWeeks').get(function () {
  return this.duration / 7
})

// Document Middleware: se ejecuta antes de comando save y el create
// con esto tenemos acceso al documento que se esta procesando(creando)
// this: es el documento procesado actualmente
tourSchema.pre('save', function (next) {
  this.slug = slugify(this.name, { lower: true })
  next()
})

/* 
// pre save middlewar
tourSchema.pre('save', function (next) {
  console.log('Will save document');
  next();
});

// Middleware despues de documento guardado
tourSchema.post('save', function (doc, next) {
  console.log(doc);
  next();
}); 
*/
/**
 * QUERY MIDDLEWARE
 */

//tourSchema.pre('find', function (next) {
// ejectutaEnTodosLosFind /^find/
tourSchema.pre(/^find/, function (next) {
  this.find({ secretTour: { $ne: true } }) // $ne: no es igual a true

  this.start = Date.now()
  next()
})

// /^find/ aplica a todas las cadenas(strings) los que empiecen con find
// .post() se ejecutara despues de realizar una consulta
tourSchema.post(/^find/, function (docs, next) {
  console.log(`Query took ${Date.now() - this.start} miliseconds!`)
  //console.log(docs);
  next()
})

/*
 * AGGREGATION MIDDLEWARE
 */
tourSchema.pre('aggregate', function (next) {
  // unshift() agrega esto al inicio del array
  this.pipeline().unshift({ $match: { secretTour: { $ne: true } } })
  console.log(this.pipeline())

  next()
})

const Tour = mongoose.model('Tour', tourSchema)
module.exports = Tour
const express = require('express')
const morgan = require('morgan')
const rateLimit = require('express-rate-limit')
const helmet = require('helmet')
const mongoSanitize = require('express-mongo-sanitize')
const xss = require('xss-clean')
const hpp = require('hpp')
const tourRouter = require('./routes/tourRoutes')
const userRouter = require('./routes/userRoutes')
const reviewRouter = require('./routes/reviewRoutes')
const AppError = require('./utils/appError')
const globalErrorHandler = require('./controllers/errorController')

const app = express()

/**
 *  GLOBAL MIDDLEWARES
 */
// Set security HTTP headers
app.use(helmet())

// Development loggin
if (process.env.NODE_ENV === 'development') {
  app.use(morgan('dev'))
}

// limit request from same API
const limiter = rateLimit({
  max: 100, // Permitimos 100 solicitudes
  windowMs: 60 * 60 * 1000, // Por hora
  message: 'Too many request from this IP, try in an hour',
})

// Aplico el limiter a todas las rutas con /api
app.use('/api', limiter)

// Body parser, reading data from body into req.body
app.use(express.json({ limit: '10kb' }))

// data sanitization against NoSQL query injection
app.use(mongoSanitize())

// Data sanitization XSS - inyeccion de codigo html
app.use(xss())

// Prevent parameter polution
app.use(
  hpp({
    whitelist: [
      'duration',
      'ratingsQuantity',
      'ratingsAverage',
      'maxGroupSize',
      'difficulty',
      'price',
    ],
  })
)

// Serving static files
app.use(express.static(`${__dirname}/public`))

// app.use((req, res, next) => {
//   console.log('Hello from the middleware');
//   next();
// });

// Test middleware
app.use((req, res, next) => {
  req.requestTime = new Date().toISOString()
  //console.log(req.headers)
  next()
})

app.use('/api/v1/tours', tourRouter)
app.use('/api/v1/users', userRouter)
app.use('/api/v1/reviews', reviewRouter)

/*
 * Middleware para gestionar rutas no especificadas
 */
// all: aplica esto a todos los metodos
// req.originalUrl: url que agrego el usuario
app.all('*', (req, res, next) => {
  // const err = new Error(`Can't find ${req.originalUrl} on this server`)
  // err.status = 'fail'
  // err.statusCode = 404

  next(new AppError(`Can't find ${req.originalUrl} on this server`, 404))
})

/*
 * MIDDLEWARE GLOBAL: Manejo de errores
 * status(500): error internal server
 * status(400): status fail
 */
app.use(globalErrorHandler)

module.exports = app

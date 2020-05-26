const express = require('express')
const morgan = require('morgan')
const rateLimit = require('express-rate-limit')
const tourRouter = require('./routes/tourRoutes')
const userRouter = require('./routes/userRoutes')
const AppError = require('./utils/appError')
const globalErrorHandler = require('./controllers/errorController')

const app = express()

/**
 *  GLOBAL MIDDLEWARES
 */
if (process.env.NODE_ENV === 'development') {
  app.use(morgan('dev'))
}

const limiter = rateLimit({
  max: 100, // Permitimos 100 solicitudes
  windowMs: 60 * 60 * 1000, // Por hora
  message: 'Too many request from this IP, try in an hour',
})

// Aplico el limiter a todas las rutas con /api
app.use('/api', limiter)

app.use(express.json())
app.use(express.static(`${__dirname}/public`))

// app.use((req, res, next) => {
//   console.log('Hello from the middleware');
//   next();
// });

app.use((req, res, next) => {
  req.requestTime = new Date().toISOString()
  console.log(req.headers)
  next()
})

app.use('/api/v1/tours', tourRouter)
app.use('/api/v1/users', userRouter)

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

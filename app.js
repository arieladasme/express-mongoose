const express = require('express')
const morgan = require('morgan')
const tourRouter = require('./routes/tourRoutes')
const userRouter = require('./routes/userRoutes')

const app = express()

/**
 *  MIDDLEWARES
 */
if (process.env.NODE_ENV === 'development') {
  app.use(morgan('dev'))
}

app.use(express.json())
app.use(express.static(`${__dirname}/public`))

// app.use((req, res, next) => {
//   console.log('Hello from the middleware');
//   next();
// });

app.use((req, res, next) => {
  req.requestTime = new Date().toISOString()
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
  // res.status(404).json({
  //   status: 'fail',
  //   message: `Can't find ${req.originalUrl} on this server`,
  // })

  const err = new Error(`Can't find ${req.originalUrl} on this server`)
  err.status = 'fail'
  err.statusCode = 404

  next(err)
})

/*
 * MIDDLEWARE GLOBAL: Manejo de errores
 * status(500): error internal server
 * status(400): status fail
 */
app.use((err, req, res, next) => {
  err.statusCode = err.statusCode || 500
  err.status = err.status || 'error'

  res.status(err.statusCode).json({
    status: err.status,
    message: err.message,
  })
})

module.exports = app

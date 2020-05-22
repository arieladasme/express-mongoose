const mongoose = require('mongoose')
const dotenv = require('dotenv')
dotenv.config({ path: './config.env' })
const app = require('./app')
//console.log(process.env);

process.on('uncaughtException', (err) => {
  console.log('UNCAUGHT EXCEPTION. Shutting down...')
  console.log(err.name, err.message)
  // server.close() le da tiempo a los procesos que estan pendientes antes de..
  console.log(process.exit(1))
})

const DB = process.env.DATABASE.replace(
  '<PASSWORD>',
  process.env.DATABASE_PASSWORD
)

mongoose
  .connect(DB, {
    useNewUrlParser: true,
    useCreateIndex: true,
    useFindAndModify: false,
    useUnifiedTopology: true,
  })
  .then(() => console.log('DB connected'))

const port = process.env.PORT || 3000
const server = app.listen(port, () => {
  console.log(`App running on port ${port}`)
})

process.on('unhandledRejection', (err) => {
  console.log('JUAN JANDLER REJECTION. Shutting down...')
  console.log(err)
  // server.close() le da tiempo a los procesos que estan pendientes antes de..
  server.close(() => {
    console.log(process.exit(1))
  })
})

class AppError extends Error {
  constructor(message, statusCode) {
    super(message)

    this.statusCode = statusCode
    // startsWith() indica si un string inicia con los caracteres de otro string
    // si el statuz empieza con 4 envia fail
    this.status = `${statusCode}`.startsWith('4') ? 'fail' : 'error'
    this.isOperational = true

    // elimino errores basura
    Error.captureStackTrace(this, this.constructor)
  }
}

module.exports = AppError

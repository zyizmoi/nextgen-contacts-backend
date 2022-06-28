const jwt = require('jsonwebtoken')

const HttpError = require('../models/http-error')

module.exports = (req, res, next) => {
  if (req.method === 'OPTIONS') {
    return next()
  }
  try {
    const token = req.headers.authorization.split(' ')[1]
    if (!token) {
      const error = new Error('Authentication failed')
      return next(error)
    }

    const decodedToken = jwt.verify(token, process.env.JWT_KEY)
    req.userData = { userId: decodedToken.userId }
    console.log('ok leh')
    next()
  } catch (err) {
    console.log('problem la')
    const error = new HttpError('Authentication failed', 401)
    return next(error)
  }
}

const express = require('express')
const bodyParser = require('body-parser')
const mongoose = require('mongoose')
const cors = require('cors')

const contactsRoutes = require('./routes/contacts-routes')
const usersRoutes = require('./routes/users-routes')
const baseRoute = require('./routes/base-route')
const httpError = require('./models/http-error')
const checkAuth = require('./middleware/check-auth')

const app = express()

app.use(bodyParser.json())
// app.use(cors((origin = false)))

app.use((req, res, next) => {
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization')
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE')
  next()
})

app.use('/users', usersRoutes)

app.use(checkAuth)

app.use('/', baseRoute)

app.use('/contact', contactsRoutes)

app.use((req, res, next) => {
  const error = new httpError('Could not find the route', 404)
  throw error
})

app.use((error, req, res, next) => {
  if (res.headerSent) {
    return next(error)
  }
  res.status(error.code || 500)
  res.json({ message: error.message || 'An unknown error occured!' })
})

mongoose
  .connect(`mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASSWORD}@cluster0.vitdv2w.mongodb.net/?retryWrites=true&w=majority`)
  .then(() => {
    app.listen(5000)
  })
  .catch((err) => {
    console.log(err)
  })

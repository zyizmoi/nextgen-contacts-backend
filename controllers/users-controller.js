const { validationResult } = require('express-validator')
const bcrypt = require('bcryptjs')
const jwt = require('jsonwebtoken')

const HttpError = require('../models/http-error')
const User = require('../models/user')

const signup = async (req, res, next) => {
  const errors = validationResult(req)
  if (!errors.isEmpty()) {
    return next(new HttpError('Invalid inputs passed, please check your data.', 422))
  }

  const { name, email, password } = req.body

  let existingUser
  try {
    existingUser = await User.findOne({ email: email })
  } catch (err) {
    console.log(err)
    const error = new HttpError('Singing up failed, please try again', 500)
    return next(error)
  }

  if (existingUser) {
    const error = new HttpError('User already exists', 422)
    return next(error)
  }

  let hashedPassword
  try {
    hashedPassword = await bcrypt.hash(password, 12)
  } catch (err) {
    const error = new HttpError('Failed to create account, please try again', 500)
    return next(error)
  }

  const newUser = new User({
    name,
    email,
    password: hashedPassword,
    contacts: [],
  })

  try {
    await newUser.save()
  } catch (err) {
    const error = new HttpError('Failed to create account, please try again', 500)
    return next(error)
  }

  let token
  try {
    token = jwt.sign({ userId: newUser.id, email: newUser.email }, process.env.JWT_KEY, { expiresIn: '1h' })
  } catch (err) {
    const error = new HttpError('Failed to create account, please try again', 500)
    return next(error)
  }

  res.status(201).json({ userId: newUser.id, email: newUser.email, token: token })
}

const login = async (req, res, next) => {
  const { email, password } = req.body

  let existingUser

  try {
    existingUser = await User.findOne({ email: email })
  } catch (err) {
    console.log(err)
    const error = new HttpError('Logging in failed, please try again', 500)
    return next(error)
  }

  if (!existingUser) {
    const error = new HttpError('Invalid email or Password', 401)
    return next(error)
  }

  let isValidPassword = false
  try {
    isValidPassword = await bcrypt.compare(password, existingUser.password)
  } catch (err) {
    const error = new HttpError('Logging in failed, please try again', 500)
    return next(error)
  }

  if (!isValidPassword) {
    const error = new HttpError('Invalid email or Password', 401)
    return next(error)
  }

  let token
  try {
    token = jwt.sign({ userId: existingUser.id, email: existingUser.email }, process.env.JWT_KEY, { expiresIn: '1h' })
  } catch (err) {
    const error = new HttpError('Logging in failed, please try again', 500)
    return next(error)
  }

  res.json({ userId: existingUser.id, email: existingUser.email, token: token })
}

exports.signup = signup
exports.login = login

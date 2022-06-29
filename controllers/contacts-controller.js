const { validationResult } = require('express-validator')

const HttpError = require('../models/http-error')
const Contact = require('../models/contact')
const User = require('../models/user')
const { default: mongoose } = require('mongoose')

const allContacts = async (req, res, next) => {
  let allContactList
  try {
    allContactList = await User.findById(req.userData.userId).populate('contacts')
  } catch (err) {
    const error = new HttpError('Something went wrong, could not find contacts', 500)
    return next(error)
  }

  if (!allContactList || allContactList.length === 0) {
    return res.json({})
  }

  res.json({ contacts: allContactList.contacts.map((contact) => contact.toObject({ getters: true })) })
}

const findContactById = async (req, res, next) => {
  const id = req.params.id

  let contact
  try {
    contact = await Contact.findById(id)
  } catch (err) {
    const error = new HttpError('Something went wrong, could not update contact', 500)
    return next(error)
  }

  if (!contact) {
    const error = new HttpError('Could not find contact for given ID', 404)
    return next(error)
  }

  res.json({ contact: contact.toObject({ getters: true }) })
}

const searchContact = async (req, res, next) => {
  const filter = req.query.search

  if (!filter || filter.length === 0) {
    return next(new HttpError('No search term', 400))
  }

  let contacts
  // try {
  //   contacts = await Contact.find({
  //     $or: [{ name: { $regex: filter, $options: 'i' } }, { number: { $regex: filter, $options: 'i' } }, { email: { $regex: filter, $options: 'i' } }],
  //   })
  // } catch (err) {
  //   const error = new HttpError('Something went wrong, could not find a contact', 500)
  //   return next(error)
  // }

  // $or: [{ name: { $regex: filter, $options: 'i' } }, { number: { $regex: filter, $options: 'i' } }, { email: { $regex: filter, $options: 'i' } }],
  try {
    contacts = await User.findById(req.userData.userId).populate({
      path: 'contacts',
      match: { $or: [{ name: { $regex: filter, $options: 'i' } }, { number: { $regex: filter, $options: 'i' } }, { email: { $regex: filter, $options: 'i' } }] },
    })
  } catch (err) {
    const error = new HttpError('Something went wrong, could not find a contact', 500)
    return next(error)
  }

  if (!contacts || contacts.length === 0) {
    return next(new HttpError('Could not find a matching contact', 404))
    // return res.json({ contacts: {} })
  }

  res.json({ contacts: contacts.contacts.map((contact) => contact.toObject({ getters: true })) })
}

const createContact = async (req, res, next) => {
  const errors = validationResult(req)
  if (!errors.isEmpty()) {
    return next(new HttpError('Please check your inputs', 422))
  }

  const { name, number, email, creator } = req.body
  const strNumber = number ? number.toString() : number
  const newContact = new Contact({
    name,
    number: strNumber,
    email,
    creator,
  })

  let user
  try {
    user = await User.findById(creator)
  } catch (err) {
    const error = new HttpError('Creating contact failed, please try again', 500)
  }

  if (!user) {
    const error = new HttpError('Could not find user with given ID', 404)
    return next(error)
  }

  try {
    const sess = await mongoose.startSession()
    sess.startTransaction()
    await newContact.save({ session: sess })
    user.contacts.push(newContact)
    await user.save({ session: sess })
    await sess.commitTransaction()
  } catch (err) {
    const error = new HttpError('Creating contact failed, please try again', 500)
    return next(error)
  }

  res.status(201).json({ contact: newContact })
}

const updateContact = async (req, res, next) => {
  const errors = validationResult(req)
  if (!errors.isEmpty()) {
    return next(new HttpError('Invalid inputs passed, please check your data.', 422))
  }

  const { name, number, email } = req.body
  const id = req.params.id

  const strNumber = number ? number.toString() : number

  let updatedContact
  try {
    updatedContact = await Contact.findById(id)
  } catch (err) {
    const error = new HttpError('Something went wrong, could not update contact', 500)
    return next(error)
  }

  updatedContact.name = name ? name : updatedContact.name
  updatedContact.number = strNumber ? strNumber : updatedContact.number
  updatedContact.email = email ? email : updatedContact.email

  try {
    await updatedContact.save()
  } catch (err) {
    const error = new HttpError('Something went wrong, could not update contact', 500)
    return next(error)
  }

  res.status(200).json({ contact: updatedContact.toObject({ getters: true }) })
}

const deleteContact = async (req, res, next) => {
  const id = req.params.id

  let contactToDelete
  try {
    contactToDelete = await (await Contact.findById(id)).populate('creator')
  } catch (err) {
    const error = new HttpError('Something went wrong, could not delete contact', 500)
    return next(error)
  }

  if (!contactToDelete) {
    const error = new HttpError('could not find a place for given ID', 404)
    return next(error)
  }

  try {
    const sess = await mongoose.startSession()
    sess.startTransaction()
    await contactToDelete.remove({ session: sess })
    contactToDelete.creator.contacts.pull(contactToDelete)
    await contactToDelete.creator.save({ session: sess })
    await sess.commitTransaction()
  } catch (err) {
    const error = new HttpError('Something went wrong, could not delete contact', 500)
    return next(error)
  }

  res.status(200).json({ message: 'Deleted contact' })
}

exports.searchContact = searchContact
exports.createContact = createContact
exports.updateContact = updateContact
exports.deleteContact = deleteContact
exports.allContacts = allContacts
exports.findContactById = findContactById

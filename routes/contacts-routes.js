const express = require('express')
const { check } = require('express-validator')

const contactsController = require('../controllers/contacts-controller')

const router = express.Router()

router.get('/', contactsController.searchContact)

router.post('/create', [check('name').not().isEmpty(), check('number').isNumeric().isLength({ min: 8, max: 8 })], contactsController.createContact)

router.get('/:id', contactsController.findContactById)

router.put('/:id/update', contactsController.updateContact)

router.delete('/:id/delete', contactsController.deleteContact)

module.exports = router

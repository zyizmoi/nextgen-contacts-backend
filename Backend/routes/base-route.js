const express = require('express')

const contactsController = require('../controllers/contacts-controller')

const router = express.Router()

router.get('/', contactsController.allContacts)

module.exports = router

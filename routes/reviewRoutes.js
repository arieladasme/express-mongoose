const express = require('express')
const { protect, restrictTo } = require('../controllers/authController')

const { createReview, getAllReviews } = require('./../controllers/reviewController')

const router = express.Router({ mergeParams: true })

router.route('/').post(protect, restrictTo('user'), createReview).get(getAllReviews)

module.exports = router

const express = require('express')
const { protect, restrictTo } = require('../controllers/authController')

const {
  createReview,
  getAllReviews,
  deleteReview,
  updateReview,
  setTourUserIds,
} = require('./../controllers/reviewController')

const router = express.Router({ mergeParams: true })

router.route('/').post(protect, restrictTo('user'), setTourUserIds, createReview).get(getAllReviews)
router.route('/:id').patch(updateReview).delete(deleteReview)

module.exports = router

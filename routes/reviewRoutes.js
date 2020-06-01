const express = require('express')
const { protect, restrictTo } = require('../controllers/authController')

const {
  createReview,
  getReview,
  getAllReviews,
  deleteReview,
  updateReview,
  setTourUserIds,
} = require('./../controllers/reviewController')

const router = express.Router({ mergeParams: true })

router.use(protect)

router.route('/').post(restrictTo('user'), setTourUserIds, createReview).get(getAllReviews)
router
  .route('/:id')
  .get(getReview)
  .patch(restrictTo('user', 'admin'), updateReview)
  .delete(restrictTo('user', 'admin'), deleteReview)

module.exports = router

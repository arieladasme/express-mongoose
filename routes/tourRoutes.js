const express = require('express')

const {
  getAllTours,
  createTour,
  getTour,
  updateTour,
  deleteTour,
  aliasTopTours,
  getToursStats,
  getMonthlyPlan,
} = require('../controllers/tourController')
const { protect, restrictTo } = require('../controllers/authController')
const { getAllReviews, createReview } = require('./../controllers/reviewController')

const router = express.Router()

// router.param('id', checkID);

router.route('/top-5-cheap').get(aliasTopTours, getAllTours)

router.route('/tour-stats').get(getToursStats)
router.route('/monthly-plan/:year').get(getMonthlyPlan)

router.route('/').get(protect, getAllTours).post(createTour)
router
  .route('/:id')
  .get(getTour)
  .patch(updateTour)
  .delete(protect, restrictTo('admin', 'lead-guide'), deleteTour)

// POST /tour/32i4uh34i2hu/reviews
// GET /tour/32i4uh34i2hu/reviews
// GET /tour/32i4uh34i2hu/reviews/23e9fdh7u

router.route('/:tourId/reviews').post(protect, restrictTo('user'), createReview)

module.exports = router

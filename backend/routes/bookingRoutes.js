const express = require('express');
const router = express.Router();


const { protect, adminOnly } = require('../middleware/authMiddleware');
const ctrl = require('../controllers/bookingController');

router.get('/stats', protect, adminOnly, ctrl.getBookingStats);

router
  .route('/')
  .post(protect, ctrl.createBooking)
  .get(protect, ctrl.getBookings);

router
  .route('/:id')
  .get(protect, ctrl.getBookingById)
  .patch(protect, ctrl.updateBookingStatus);

module.exports = router;
const mongoose = require('mongoose');

const BOOKING_STATUS = ['pending', 'confirmed', 'cancelled'];

const bookingSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    room: { type: mongoose.Schema.Types.ObjectId, ref: 'Room', required: true, index: true },

    checkIn: { type: Date, required: [true, 'Thiếu thời gian nhận phòng'] },
    checkOut: {
      type: Date,
      required: [true, 'Thiếu thời gian trả phòng'],
      validate: {
        validator: function (value) {
          return !this.checkIn || value > this.checkIn;
        },
        message: 'Thời gian trả phòng phải sau thời gian nhận phòng',
      },
    },

    guests: { type: Number, required: true, min: [1, 'Tối thiểu 1 khách'] },
    nights: { type: Number, required: true, min: 1 },


    pricePerNight: { type: Number, required: true, min: 0 },
    totalPrice: { type: Number, required: true, min: 0 },

    status: { type: String, enum: BOOKING_STATUS, default: 'pending', index: true },
    note: { type: String, trim: true, maxlength: [500, 'Ghi chú tối đa 500 ký tự'], default: '' },
    cancelledAt: { type: Date, default: null },
  },
  { timestamps: true }
);

bookingSchema.index({ room: 1, status: 1, checkIn: 1, checkOut: 1 });

module.exports = mongoose.model('Booking', bookingSchema);
module.exports.BOOKING_STATUS = BOOKING_STATUS;
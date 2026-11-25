const mongoose = require('mongoose');
const Booking = require('../models/Booking');
const Room = require('../models/Room');
const { BOOKING_STATUS } = require('../models/Booking');
const { sendSuccess, sendError } = require('../utils/response');

const DAY_MS = 24 * 60 * 60 * 1000;
const ROOM_FIELDS = 'name images image pricePerNight price location address';
const USER_FIELDS = 'fullName name username email phone';



const parseDate = (value) => {
  const d = new Date(value);
  return Number.isNaN(d.getTime()) ? null : d;
};

const getPagination = (query) => {
  const page = Math.max(parseInt(query.page, 10) || 1, 1);
  const limit = Math.min(Math.max(parseInt(query.limit, 10) || 10, 1), 50);
  return { page, limit, skip: (page - 1) * limit };
};

const buildPagination = (page, limit, total) => ({
  page,
  limit,
  total,
  totalPages: Math.max(Math.ceil(total / limit), 1),
});

const findOverlap = (roomId, checkIn, checkOut, excludeId = null) => {
  const filter = {
    room: roomId,
    status: { $ne: 'cancelled' },
    checkIn: { $lt: checkOut },
    checkOut: { $gt: checkIn },
  };
  if (excludeId) filter._id = { $ne: excludeId };
  return Booking.findOne(filter).select('checkIn checkOut status');
};

const isAdmin = (user) => Boolean(user) && user.role === 'admin';
const isOwner = (booking, user) => String(booking.user?._id || booking.user) === String(user._id);

const handleError = (res, err) => {
  if (err.name === 'ValidationError') {
    const message = Object.values(err.errors).map((e) => e.message).join('; ');
    return sendError(res, 400, message);
  }
  if (err.name === 'CastError') return sendError(res, 400, 'ID không hợp lệ');
  console.error('[bookingController]', err);
  return sendError(res, 500, 'Lỗi máy chủ');
};

exports.createBooking = async (req, res) => {
  try {
    const { room: roomId, checkIn, checkOut, guests, note } = req.body;

    const missing = [];
    if (!roomId) missing.push('room');
    if (!checkIn) missing.push('checkIn');
    if (!checkOut) missing.push('checkOut');
    if (guests === undefined || guests === null || guests === '') missing.push('guests');
    if (missing.length > 0) {
      return sendError(res, 400, `Thiếu trường bắt buộc: ${missing.join(', ')}`);
    }

    if (!mongoose.isValidObjectId(roomId)) return sendError(res, 400, 'room không hợp lệ');

    const inDate = parseDate(checkIn);
    const outDate = parseDate(checkOut);
    if (!inDate || !outDate) {
      return sendError(res, 400, 'checkIn/checkOut không đúng định dạng thời gian');
    }
    if (outDate <= inDate) {
      return sendError(res, 400, 'Thời gian trả phòng (checkOut) phải sau thời gian nhận phòng (checkIn)');
    }
    if (inDate < new Date()) {
      return sendError(res, 400, 'Không thể đặt phòng với thời gian nhận phòng trong quá khứ');
    }

    const guestCount = Number(guests);
    if (!Number.isInteger(guestCount) || guestCount < 1) {
      return sendError(res, 400, 'Số khách (guests) phải là số nguyên từ 1 trở lên');
    }

    const room = await Room.findById(roomId);
    if (!room) return sendError(res, 404, 'Không tìm thấy phòng');

    const capacity = room.capacity ?? room.maxGuests;
    if (capacity && guestCount > capacity) {
      return sendError(res, 400, `Số khách vượt quá sức chứa của phòng (tối đa ${capacity} khách)`);
    }

    const pricePerNight = room.pricePerNight ?? room.price;
    if (typeof pricePerNight !== 'number') {
      return sendError(res, 500, 'Phòng chưa có giá, không thể đặt');
    }

    const conflict = await findOverlap(room._id, inDate, outDate);
    if (conflict) {
      return sendError(res, 400, 'Phòng đã có người đặt trong khung giờ này, vui lòng chọn thời gian khác', {
        conflict: { checkIn: conflict.checkIn, checkOut: conflict.checkOut },
      });
    }

    const nights = Math.max(1, Math.ceil((outDate - inDate) / DAY_MS));
    const booking = await Booking.create({
      user: req.user._id,
      room: room._id,
      checkIn: inDate,
      checkOut: outDate,
      guests: guestCount,
      nights,
      pricePerNight,
      totalPrice: nights * pricePerNight,
      note: typeof note === 'string' ? note.trim() : '',
      status: 'pending',
    });

    return sendSuccess(res, 201, 'Đặt phòng thành công, đơn đang chờ duyệt', booking);
  } catch (err) {
    return handleError(res, err);
  }
};

exports.getBookings = async (req, res) => {
  try {
    const { page, limit, skip } = getPagination(req.query);
    const admin = isAdmin(req.user);
    const filter = {};

    if (!admin) filter.user = req.user._id;
    if (req.query.status) {
      if (!BOOKING_STATUS.includes(req.query.status)) {
        return sendError(res, 400, `status không hợp lệ (${BOOKING_STATUS.join(' | ')})`);
      }
      filter.status = req.query.status;
    }

    let query = Booking.find(filter)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .populate('room', ROOM_FIELDS);
    if (admin) query = query.populate('user', USER_FIELDS);

    const [items, total] = await Promise.all([query, Booking.countDocuments(filter)]);

    return sendSuccess(res, 200, 'Lấy danh sách đơn đặt phòng thành công', {
      items,
      pagination: buildPagination(page, limit, total),
    });
  } catch (err) {
    return handleError(res, err);
  }
};

exports.getBookingById = async (req, res) => {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) return sendError(res, 400, 'ID không hợp lệ');

    const booking = await Booking.findById(req.params.id)
      .populate('room', ROOM_FIELDS)
      .populate('user', USER_FIELDS);
    if (!booking) return sendError(res, 404, 'Không tìm thấy đơn đặt phòng');

    if (!isOwner(booking, req.user) && !isAdmin(req.user)) {
      return sendError(res, 403, 'Bạn không có quyền xem đơn này');
    }
    return sendSuccess(res, 200, 'Lấy chi tiết đơn đặt phòng thành công', booking);
  } catch (err) {
    return handleError(res, err);
  }
};

exports.updateBookingStatus = async (req, res) => {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) return sendError(res, 400, 'ID không hợp lệ');

    const { status } = req.body;
    if (!['confirmed', 'cancelled'].includes(status)) {
      return sendError(res, 400, 'status chỉ nhận "confirmed" hoặc "cancelled"');
    }

    const booking = await Booking.findById(req.params.id);
    if (!booking) return sendError(res, 404, 'Không tìm thấy đơn đặt phòng');

    const admin = isAdmin(req.user);

    if (!admin) {
      if (!isOwner(booking, req.user)) {
        return sendError(res, 403, 'Bạn không có quyền thao tác trên đơn này');
      }
      if (status !== 'cancelled') {
        return sendError(res, 403, 'Bạn chỉ được hủy đơn của mình, không có quyền duyệt đơn');
      }
    }

    if (booking.status === 'cancelled') {
      return sendError(res, 400, 'Đơn đã bị hủy, không thể thay đổi');
    }
    if (booking.status === status) {
      return sendError(res, 400, `Đơn đã ở trạng thái "${status}"`);
    }
    if (!admin && booking.checkIn <= new Date()) {
      return sendError(res, 400, 'Đơn đã hoặc đang diễn ra, không thể hủy');
    }


    if (status === 'confirmed') {
      const conflict = await findOverlap(booking.room, booking.checkIn, booking.checkOut, booking._id);
      if (conflict) return sendError(res, 400, 'Lịch phòng đã bị trùng, không thể duyệt đơn này');
    }
    if (status === 'cancelled') booking.cancelledAt = new Date();

    booking.status = status;
    await booking.save();

    return sendSuccess(res, 200, 'Cập nhật trạng thái đơn đặt phòng thành công', booking);
  } catch (err) {
    return handleError(res, err);
  }
};

exports.getBookingStats = async (req, res) => {
  try {
    const { from, to } = req.query;
    const groupBy = req.query.groupBy || 'month';

    if (!['day', 'month'].includes(groupBy)) {
      return sendError(res, 400, 'groupBy chỉ nhận "day" hoặc "month"');
    }

    const range = {};
    if (from) {
      const d = parseDate(from);
      if (!d) return sendError(res, 400, 'from không đúng định dạng ngày');
      range.$gte = d;
    }
    if (to) {
      const d = parseDate(to);
      if (!d) return sendError(res, 400, 'to không đúng định dạng ngày');
      if (/^\d{4}-\d{2}-\d{2}$/.test(to)) d.setUTCHours(23, 59, 59, 999);
      range.$lte = d;
    }
    if (range.$gte && range.$lte && range.$gte > range.$lte) {
      return sendError(res, 400, 'from phải nhỏ hơn hoặc bằng to');
    }

    const match = { status: 'confirmed' };
    if (Object.keys(range).length > 0) match.checkIn = range;

    const format = groupBy === 'day' ? '%Y-%m-%d' : '%Y-%m';

    const series = await Booking.aggregate([
      { $match: match },
      {
        $group: {
          _id: { $dateToString: { format, date: '$checkIn', timezone: 'Asia/Ho_Chi_Minh' } },
          revenue: { $sum: '$totalPrice' },
          bookings: { $sum: 1 },
        },
      },
      { $sort: { _id: 1 } },
      { $project: { _id: 0, period: '$_id', revenue: 1, bookings: 1 } },
    ]);

    const totalRevenue = series.reduce((sum, s) => sum + s.revenue, 0);
    const totalBookings = series.reduce((sum, s) => sum + s.bookings, 0);

    return sendSuccess(res, 200, 'Lấy thống kê doanh thu thành công', {
      from: from || null,
      to: to || null,
      groupBy,
      totalRevenue,
      totalBookings,
      series,
    });
  } catch (err) {
    return handleError(res, err);
  }
};
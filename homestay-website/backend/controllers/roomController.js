const Room = require("../models/Room");
const Booking = require("../models/Booking");
const Review = require("../models/Review");
const { todayStr, isValidDate } = require("../utils/date");

const ok = (res, status, message, data) => res.status(status).json({ success: true, message, data });
const notFoundRes = (res) => res.status(404).json({ success: false, message: "Không tìm thấy phòng", data: null });
const escapeRegex = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
const httpError = (status, message) => Object.assign(new Error(message), { statusCode: status });
const canManage = (room, user) => user.role === "admin" || String(room.host) === user.id;

const pick = (b) => {
  const out = {};
  ["name", "description", "price", "capacity", "location", "address", "images", "amenities", "status"].forEach((k) => {
    if (b[k] !== undefined) out[k] = b[k];
  });
  return out;
};

async function buildFilter(q) {
  const { keyword, location, minPrice, maxPrice, guests, checkIn, checkOut, status } = q;
  const filter = {};
  if (keyword) {
    const re = new RegExp(escapeRegex(keyword.trim()), "i");
    filter.$or = [{ name: re }, { address: re }];
  }
  if (location) filter.location = location;
  if (guests) filter.capacity = { $gte: Number(guests) };
  if (status) filter.status = status;
  if (minPrice || maxPrice) {
    filter.price = {};
    if (minPrice) filter.price.$gte = Number(minPrice);
    if (maxPrice) filter.price.$lte = Number(maxPrice);
  }
  if (checkIn || checkOut) {
    if (!isValidDate(checkIn) || !isValidDate(checkOut)) throw httpError(400, "Nhập đủ ngày nhận và ngày trả phòng hợp lệ");
    if (checkOut <= checkIn) throw httpError(400, "Ngày trả phòng phải sau ngày nhận phòng");
    const busy = await Booking.find({
      status: "confirmed",
      checkIn: { $lt: checkOut },
      checkOut: { $gt: checkIn },
    }).distinct("room");
    filter._id = { $nin: busy };
  }
  return filter;
}

async function listRooms(req, res, next, extra = {}) {
  try {
    const page = Math.max(parseInt(req.query.page) || 1, 1);
    const limit = Math.min(Math.max(parseInt(req.query.limit) || 9, 1), 50);
    const filter = { ...(await buildFilter(req.query)), ...extra };
    const sortMap = {
      newest: { createdAt: -1 },
      priceAsc: { price: 1 },
      priceDesc: { price: -1 },
      rating: { ratingAvg: -1, ratingCount: -1 },
      name: { name: 1 },
    };
    const total = await Room.countDocuments(filter);
    const rooms = await Room.find(filter)
      .populate("host", "name")
      .sort(sortMap[req.query.sort] || sortMap.newest)
      .skip((page - 1) * limit)
      .limit(limit);
    ok(res, 200, "Lấy danh sách phòng thành công", { rooms, total, page, limit, totalPages: Math.ceil(total / limit) || 1 });
  } catch (err) {
    next(err);
  }
}

exports.getRooms = (req, res, next) => listRooms(req, res, next);

exports.getMyRooms = (req, res, next) =>
  listRooms(req, res, next, req.user.role === "admin" ? {} : { host: req.user.id });

exports.getAreas = async (req, res, next) => {
  try {
    const areas = await Room.distinct("location", { status: "available" });
    ok(res, 200, "Lấy danh sách khu vực thành công", areas.sort((a, b) => a.localeCompare(b, "vi")));
  } catch (err) {
    next(err);
  }
};

exports.getRoomById = async (req, res, next) => {
  try {
    const room = await Room.findById(req.params.id).populate("host", "name phone");
    if (!room) return notFoundRes(res);
    ok(res, 200, "Lấy chi tiết phòng thành công", room);
  } catch (err) {
    next(err);
  }
};

exports.createRoom = async (req, res, next) => {
  try {
    const room = await Room.create({ ...pick(req.body), host: req.user.id });
    ok(res, 201, "Thêm phòng thành công", room);
  } catch (err) {
    next(err);
  }
};

exports.updateRoom = async (req, res, next) => {
  try {
    const room = await Room.findById(req.params.id);
    if (!room) return notFoundRes(res);
    if (!canManage(room, req.user)) throw httpError(403, "Bạn chỉ được sửa phòng của mình");
    room.set(pick(req.body));
    await room.save();
    ok(res, 200, "Cập nhật phòng thành công", room);
  } catch (err) {
    next(err);
  }
};

exports.deleteRoom = async (req, res, next) => {
  try {
    const room = await Room.findById(req.params.id);
    if (!room) return notFoundRes(res);
    if (!canManage(room, req.user)) throw httpError(403, "Bạn chỉ được xóa phòng của mình");

    const active = await Booking.countDocuments({ room: room._id, status: "confirmed", checkOut: { $gt: todayStr() } });
    if (active > 0) throw httpError(400, `Phòng còn ${active} đơn đặt chưa kết thúc. Hãy chuyển sang Bảo trì thay vì xóa`);

    await room.deleteOne();
    await Review.deleteMany({ room: room._id });
    ok(res, 200, "Xóa phòng thành công", { id: room._id });
  } catch (err) {
    next(err);
  }
};

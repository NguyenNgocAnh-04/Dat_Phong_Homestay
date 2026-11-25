const mongoose = require("mongoose");

const fail = (res, message) => res.status(400).json({ success: false, message, data: null });

exports.validateId = (req, res, next) => {
  if (!mongoose.isValidObjectId(req.params.id)) return fail(res, "ID không hợp lệ");
  next();
};

exports.validateRoom = (isUpdate = false) => (req, res, next) => {
  const { name, price, capacity, location, status, images, amenities } = req.body;
  const missing = (v) => v === undefined || v === null || v === "";

  if (!isUpdate || !missing(name)) {
    if (missing(name) || String(name).trim().length < 2) return fail(res, "Tên phòng bắt buộc, tối thiểu 2 ký tự");
  }
  if (!isUpdate || !missing(price)) {
    if (missing(price) || isNaN(price) || Number(price) <= 0) return fail(res, "Giá phải là số lớn hơn 0");
  }
  if (!isUpdate || !missing(capacity)) {
    if (missing(capacity) || !Number.isInteger(Number(capacity)) || Number(capacity) < 1)
      return fail(res, "Sức chứa phải là số nguyên từ 1 trở lên");
  }
  if (!isUpdate || location !== undefined) {
    if (missing(location) || String(location).trim().length < 2) return fail(res, "Khu vực là bắt buộc (ví dụ: Đà Lạt)");
  }
  if (!missing(status) && !["available", "maintenance"].includes(status))
    return fail(res, "Trạng thái chỉ nhận 'available' hoặc 'maintenance'");
  if (images !== undefined && !Array.isArray(images)) return fail(res, "images phải là mảng");
  if (amenities !== undefined && !Array.isArray(amenities)) return fail(res, "amenities phải là mảng");
  next();
};

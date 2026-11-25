
//dung tam
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const { sendError } = require('../utils/response');

exports.protect = async (req, res, next) => {
  try {
    const header = req.headers.authorization || '';
    const token = header.startsWith('Bearer ') ? header.slice(7) : null;
    if (!token) return sendError(res, 401, 'Bạn chưa đăng nhập');

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.id).select('-password');
    if (!user) return sendError(res, 401, 'Tài khoản không tồn tại');

    req.user = user; 
    next();
  } catch (err) {
    return sendError(res, 401, 'Token không hợp lệ hoặc đã hết hạn');
  }
};

exports.adminOnly = (req, res, next) => {
  if (req.user && req.user.role === 'admin') return next();
  return sendError(res, 403, 'Chỉ admin mới có quyền thực hiện');
};
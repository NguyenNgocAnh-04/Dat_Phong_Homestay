const DAY_MS = 24 * 60 * 60 * 1000;

export const formatVND = (n) =>
  new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(n || 0);


export const formatDateTime = (iso) =>
  iso ? new Date(iso).toLocaleString('vi-VN', { dateStyle: 'short', timeStyle: 'short' }) : '';


export const nowLocalInput = () => {
  const d = new Date();
  d.setMinutes(d.getMinutes() - d.getTimezoneOffset());
  return d.toISOString().slice(0, 16);
};

export const toISO = (localValue) => new Date(localValue).toISOString();


export const calcNights = (checkIn, checkOut) => {
  if (!checkIn || !checkOut) return 0;
  const diff = new Date(checkOut) - new Date(checkIn);
  return diff > 0 ? Math.max(1, Math.ceil(diff / DAY_MS)) : 0;
};

export const STATUS_LABEL = {
  pending: 'Chờ duyệt',
  confirmed: 'Đã xác nhận',
  cancelled: 'Đã hủy',
};
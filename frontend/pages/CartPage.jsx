import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { bookingApi } from '../api/bookingApi';
import useCartStore from '../store/useCartStore';
import { formatDateTime, formatVND, toISO } from '../utils/format';

export default function CartPage() {
  const navigate = useNavigate();
  const items = useCartStore((s) => s.items);
  const removeItem = useCartStore((s) => s.removeItem);
  const clear = useCartStore((s) => s.clear);
  const total = items.reduce((sum, i) => sum + i.subtotal, 0);

  const [processing, setProcessing] = useState(false);
  const [failures, setFailures] = useState({}); 
  const [summary, setSummary] = useState(null); 

  const handleCheckout = async () => {
    if (!localStorage.getItem('token')) {
      navigate('/login', { state: { from: '/cart' } });
      return;
    }
    setProcessing(true);
    setFailures({});
    let success = 0;
    const nextFailures = {};

    for (const item of items) {
      try {
        await bookingApi.create({
          room: item.roomId,
          checkIn: toISO(item.checkIn),
          checkOut: toISO(item.checkOut),
          guests: item.guests,
          note: item.note,
        });
        success += 1;
        removeItem(item.id); 
      } catch (err) {
        if (err.status === 401) {
          navigate('/login', { state: { from: '/cart' } });
          setProcessing(false);
          return;
        }
        nextFailures[item.id] = err.message;
      }
    }

    setFailures(nextFailures);
    setSummary({ success, failed: Object.keys(nextFailures).length });
    setProcessing(false);
  };

  if (items.length === 0) {
    return (
      <main className="bk-page">
        <h1 className="bk-title">Giỏ đặt phòng</h1>
        {summary && summary.success > 0 && (
          <p className="bk-msg bk-msg--success">
            Đã gửi {summary.success} đơn đặt phòng. <Link to="/bookings/history">Xem lịch sử đặt phòng</Link>
          </p>
        )}
        <p className="bk-empty">
          Giỏ đang trống. <Link to="/rooms">Chọn phòng để bắt đầu đặt</Link>
        </p>
      </main>
    );
  }

  return (
    <main className="bk-page">
      <h1 className="bk-title">Giỏ đặt phòng</h1>

      {summary && (
        <p className={`bk-msg ${summary.failed ? 'bk-msg--error' : 'bk-msg--success'}`} role="status">
          Thành công: {summary.success} đơn · Lỗi: {summary.failed} đơn
        </p>
      )}

      <ul className="bk-cart-list">
        {items.map((item) => (
          <li key={item.id} className="bk-card bk-cart-item">
            {item.image && <img src={item.image} alt={item.roomName} className="bk-thumb" />}
            <div className="bk-cart-info">
              <strong>{item.roomName}</strong>
              <span>
                {formatDateTime(item.checkIn)} → {formatDateTime(item.checkOut)} ({item.nights} đêm)
              </span>
              <span>{item.guests} khách</span>
              {item.note && <span className="bk-muted">Ghi chú: {item.note}</span>}
              {failures[item.id] && <span className="bk-msg bk-msg--error">{failures[item.id]}</span>}
            </div>
            <div className="bk-cart-side">
              <strong>{formatVND(item.subtotal)}</strong>
              <button className="bk-btn bk-btn--danger" onClick={() => removeItem(item.id)} disabled={processing}>
                Xóa
              </button>
            </div>
          </li>
        ))}
      </ul>

      <div className="bk-cart-footer">
        <p className="bk-total">
          Tổng cộng: <strong>{formatVND(total)}</strong>
        </p>
        <div className="bk-actions">
          <button className="bk-btn bk-btn--ghost" onClick={clear} disabled={processing}>
            Xóa giỏ
          </button>
          <button className="bk-btn" onClick={handleCheckout} disabled={processing}>
            {processing ? 'Đang gửi đơn...' : 'Xác nhận đặt phòng'}
          </button>
        </div>
      </div>
    </main>
  );
}
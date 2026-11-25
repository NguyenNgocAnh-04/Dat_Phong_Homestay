import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { bookingApi } from '../api/bookingApi';
import useCartStore from '../store/useCartStore';
import { calcNights, formatVND, nowLocalInput, toISO } from '../utils/format';


export default function BookingForm({ room }) {
  const navigate = useNavigate();
  const addItem = useCartStore((s) => s.addItem);

  const pricePerNight = room.pricePerNight ?? room.price ?? 0;
  const maxGuests = room.capacity ?? room.maxGuests ?? 10;

  const [form, setForm] = useState({ checkIn: '', checkOut: '', guests: 1, note: '' });
  const [message, setMessage] = useState(null); 
  const [submitting, setSubmitting] = useState(false);

  const nights = calcNights(form.checkIn, form.checkOut);
  const total = nights * pricePerNight; 

  const handleChange = (e) => {
    const { name, value } = e.target;
    setMessage(null);
    setForm((prev) => {
      const next = { ...prev, [name]: value };
      
      if (name === 'checkIn' && next.checkOut && next.checkOut <= value) next.checkOut = '';
      return next;
    });
  };

  const validate = () => {
    if (!form.checkIn || !form.checkOut) return 'Vui lòng chọn thời gian nhận và trả phòng';
    if (new Date(form.checkOut) <= new Date(form.checkIn)) {
      return 'Thời gian trả phòng phải sau thời gian nhận phòng';
    }
    if (new Date(form.checkIn) < new Date()) return 'Không thể chọn thời gian trong quá khứ';
    const guests = Number(form.guests);
    if (!Number.isInteger(guests) || guests < 1 || guests > maxGuests) {
      return `Số khách phải từ 1 đến ${maxGuests}`;
    }
    return null;
  };

  const handleAddToCart = () => {
    const error = validate();
    if (error) return setMessage({ type: 'error', text: error });

    const result = addItem({
      roomId: room._id,
      roomName: room.name,
      image: room.images?.[0] || room.image || '',
      pricePerNight,
      checkIn: form.checkIn,
      checkOut: form.checkOut,
      guests: Number(form.guests),
      note: form.note.trim(),
    });
    setMessage(
      result.ok
        ? { type: 'success', text: 'Đã thêm vào giỏ đặt phòng' }
        : { type: 'error', text: result.message }
    );
  };

  const handleBookNow = async () => {
    const error = validate();
    if (error) return setMessage({ type: 'error', text: error });

    if (!localStorage.getItem('token')) {
      navigate('/login', { state: { from: window.location.pathname } });
      return;
    }

    try {
      setSubmitting(true);
      await bookingApi.create({
        room: room._id,
        checkIn: toISO(form.checkIn),
        checkOut: toISO(form.checkOut),
        guests: Number(form.guests),
        note: form.note.trim(),
      });
      navigate('/bookings/history');
    } catch (err) {
      if (err.status === 401) {
        navigate('/login', { state: { from: window.location.pathname } });
        return;
      }
      setMessage({ type: 'error', text: err.message }); 
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <section className="bk-card bk-form" aria-label="Đặt phòng">
      <h3 className="bk-title">Đặt phòng</h3>
      <p className="bk-muted">{formatVND(pricePerNight)} / đêm</p>

      <div className="bk-grid-2">
        <label className="bk-field">
          <span>Nhận phòng</span>
          <input
            type="datetime-local"
            name="checkIn"
            min={nowLocalInput()}
            value={form.checkIn}
            onChange={handleChange}
          />
        </label>
        <label className="bk-field">
          <span>Trả phòng</span>
          <input
            type="datetime-local"
            name="checkOut"
            min={form.checkIn || nowLocalInput()}
            value={form.checkOut}
            onChange={handleChange}
          />
        </label>
      </div>

      <label className="bk-field">
        <span>Số khách (tối đa {maxGuests})</span>
        <input type="number" name="guests" min="1" max={maxGuests} value={form.guests} onChange={handleChange} />
      </label>

      <label className="bk-field">
        <span>Ghi chú cho chủ nhà</span>
        <textarea name="note" rows="2" maxLength={500} value={form.note} onChange={handleChange} />
      </label>

      {nights > 0 && (
        <p className="bk-total">
          {nights} đêm × {formatVND(pricePerNight)} = <strong>{formatVND(total)}</strong>
        </p>
      )}

      {message && (
        <p role="alert" className={`bk-msg bk-msg--${message.type}`}>
          {message.text}
        </p>
      )}

      <div className="bk-actions">
        <button type="button" className="bk-btn bk-btn--ghost" onClick={handleAddToCart}>
          Thêm vào giỏ
        </button>
        <button type="button" className="bk-btn" onClick={handleBookNow} disabled={submitting}>
          {submitting ? 'Đang đặt...' : 'Đặt ngay'}
        </button>
      </div>
    </section>
  );
}
import { useCallback, useEffect, useState } from 'react';
import { bookingApi } from '../api/bookingApi';
import Pagination from '../components/BookingPagination';
import StatusBadge from '../components/StatusBadge';
import { STATUS_LABEL, formatDateTime, formatVND } from '../utils/format';


const ACTIONS = {
  pending: [
    { to: 'confirmed', label: 'Duyệt', className: 'bk-btn' },
    { to: 'cancelled', label: 'Từ chối', className: 'bk-btn bk-btn--danger' },
  ],
  confirmed: [{ to: 'cancelled', label: 'Hủy', className: 'bk-btn bk-btn--danger' }],
  cancelled: [],
};

export default function AdminBookingsPage() {
  const [status, setStatus] = useState('pending');
  const [page, setPage] = useState(1);
  const [data, setData] = useState({ items: [], pagination: { page: 1, totalPages: 1, total: 0 } });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const load = useCallback(async () => {
    try {
      setLoading(true);
      setError('');
      const res = await bookingApi.getAll({ page, limit: 10, status: status || undefined });
      setData(res.data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [page, status]);

  useEffect(() => {
    load();
  }, [load]);

  const handleChange = async (booking, to, label) => {
    if (!window.confirm(`${label} đơn đặt phòng này?`)) return;
    try {
      await bookingApi.updateStatus(booking._id, to);
      load();
    } catch (err) {
      setError(err.message); 
    }
  };

  const customerName = (u) => u?.fullName || u?.name || u?.username || u?.email || '—';

  return (
    <main className="bk-page">
      <header className="bk-header">
        <h1 className="bk-title">Quản lý đơn đặt phòng</h1>
        <label className="bk-field bk-field--inline">
          <span>Trạng thái</span>
          <select
            value={status}
            onChange={(e) => {
              setStatus(e.target.value);
              setPage(1);
            }}
          >
            <option value="">Tất cả</option>
            {Object.entries(STATUS_LABEL).map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </select>
        </label>
      </header>

      {error && (
        <p className="bk-msg bk-msg--error" role="alert">
          {error}
        </p>
      )}
      {loading && <p className="bk-muted">Đang tải...</p>}
      {!loading && data.items.length === 0 && <p className="bk-empty">Không có đơn nào.</p>}

      {data.items.length > 0 && (
        <div className="bk-table-wrap">
          <table className="bk-table">
            <thead>
              <tr>
                <th>Người đặt</th>
                <th>Phòng</th>
                <th>Nhận phòng</th>
                <th>Trả phòng</th>
                <th>Khách</th>
                <th>Tổng tiền</th>
                <th>Trạng thái</th>
                <th>Thao tác</th>
              </tr>
            </thead>
            <tbody>
              {data.items.map((b) => (
                <tr key={b._id}>
                  <td>{customerName(b.user)}</td>
                  <td>{b.room?.name || 'Phòng đã bị xóa'}</td>
                  <td>{formatDateTime(b.checkIn)}</td>
                  <td>{formatDateTime(b.checkOut)}</td>
                  <td>{b.guests}</td>
                  <td>{formatVND(b.totalPrice)}</td>
                  <td>
                    <StatusBadge status={b.status} />
                  </td>
                  <td className="bk-row-actions">
                    {ACTIONS[b.status].map((a) => (
                      <button key={a.to} className={a.className} onClick={() => handleChange(b, a.to, a.label)}>
                        {a.label}
                      </button>
                    ))}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <Pagination page={data.pagination.page} totalPages={data.pagination.totalPages} onChange={setPage} />
    </main>
  );
}
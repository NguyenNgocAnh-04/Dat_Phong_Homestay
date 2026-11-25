import { useCallback, useEffect, useState } from 'react';
import { bookingApi } from '../api/bookingApi';
import Pagination from '../components/BookingPagination';
import StatusBadge from '../components/StatusBadge';
import { STATUS_LABEL, formatDateTime, formatVND } from '../utils/format';

export default function BookingHistoryPage() {
  const [status, setStatus] = useState('');
  const [page, setPage] = useState(1);
  const [data, setData] = useState({ items: [], pagination: { page: 1, totalPages: 1, total: 0 } });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const load = useCallback(async () => {
    try {
      setLoading(true);
      setError('');
      const res = await bookingApi.getAll({ page, limit: 8, status: status || undefined });
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

  const handleCancel = async (booking) => {
    if (!window.confirm('Bạn chắc chắn muốn hủy đơn đặt phòng này?')) return;
    try {
      await bookingApi.updateStatus(booking._id, 'cancelled');
      load();
    } catch (err) {
      setError(err.message);
    }
  };


  const canCancel = (b) => ['pending', 'confirmed'].includes(b.status) && new Date(b.checkIn) > new Date();

  return (
    <main className="bk-page">
      <header className="bk-header">
        <h1 className="bk-title">Lịch sử đặt phòng</h1>
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
      {!loading && data.items.length === 0 && <p className="bk-empty">Bạn chưa có đơn đặt phòng nào.</p>}

      {data.items.length > 0 && (
        <div className="bk-table-wrap">
          <table className="bk-table">
            <thead>
              <tr>
                <th>Phòng</th>
                <th>Nhận phòng</th>
                <th>Trả phòng</th>
                <th>Số đêm</th>
                <th>Khách</th>
                <th>Tổng tiền</th>
                <th>Trạng thái</th>
                <th>Ngày đặt</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {data.items.map((b) => (
                <tr key={b._id}>
                  <td>{b.room?.name || 'Phòng đã bị xóa'}</td>
                  <td>{formatDateTime(b.checkIn)}</td>
                  <td>{formatDateTime(b.checkOut)}</td>
                  <td>{b.nights}</td>
                  <td>{b.guests}</td>
                  <td>{formatVND(b.totalPrice)}</td>
                  <td>
                    <StatusBadge status={b.status} />
                  </td>
                  <td>{formatDateTime(b.createdAt)}</td>
                  <td>
                    {canCancel(b) && (
                      <button className="bk-btn bk-btn--danger" onClick={() => handleCancel(b)}>
                        Hủy đơn
                      </button>
                    )}
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
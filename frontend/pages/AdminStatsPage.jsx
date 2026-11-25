import { useEffect, useState } from 'react';
import { bookingApi } from '../api/bookingApi';
import { formatVND } from '../utils/format';

export default function AdminStatsPage() {
  const [filters, setFilters] = useState({ from: '', to: '', groupBy: 'month' });
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let alive = true;
    setLoading(true);
    setError('');
    bookingApi
      .getStats({
        from: filters.from || undefined,
        to: filters.to || undefined,
        groupBy: filters.groupBy,
      })
      .then((res) => alive && setStats(res.data))
      .catch((err) => alive && setError(err.message))
      .finally(() => alive && setLoading(false));
    return () => {
      alive = false;
    };
  }, [filters]);

  const handleChange = (e) => setFilters((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  const maxRevenue = stats ? Math.max(...stats.series.map((s) => s.revenue), 1) : 1;

  return (
    <main className="bk-page">
      <header className="bk-header">
        <h1 className="bk-title">Thống kê doanh thu</h1>
        <div className="bk-filters">
          <label className="bk-field bk-field--inline">
            <span>Từ ngày</span>
            <input type="date" name="from" value={filters.from} onChange={handleChange} />
          </label>
          <label className="bk-field bk-field--inline">
            <span>Đến ngày</span>
            <input type="date" name="to" value={filters.to} onChange={handleChange} />
          </label>
          <label className="bk-field bk-field--inline">
            <span>Nhóm theo</span>
            <select name="groupBy" value={filters.groupBy} onChange={handleChange}>
              <option value="day">Ngày</option>
              <option value="month">Tháng</option>
            </select>
          </label>
        </div>
      </header>

      {error && (
        <p className="bk-msg bk-msg--error" role="alert">
          {error}
        </p>
      )}
      {loading && <p className="bk-muted">Đang tải...</p>}

      {stats && !loading && (
        <>
          <section className="bk-stat-cards">
            <div className="bk-card">
              <span className="bk-muted">Tổng doanh thu (đơn đã xác nhận)</span>
              <strong className="bk-stat">{formatVND(stats.totalRevenue)}</strong>
            </div>
            <div className="bk-card">
              <span className="bk-muted">Tổng số lượt đặt</span>
              <strong className="bk-stat">{stats.totalBookings}</strong>
            </div>
          </section>

          {stats.series.length === 0 ? (
            <p className="bk-empty">Chưa có đơn đã xác nhận trong khoảng thời gian này.</p>
          ) : (
            <>
              <section className="bk-card">
                <h2 className="bk-subtitle">Doanh thu theo {stats.groupBy === 'day' ? 'ngày' : 'tháng'}</h2>
                <div className="bk-bars" role="img" aria-label="Biểu đồ doanh thu">
                  {stats.series.map((s) => (
                    <div
                      key={s.period}
                      className="bk-bar-col"
                      title={`${s.period}: ${formatVND(s.revenue)} · ${s.bookings} đơn`}
                    >
                      <div className="bk-bar" style={{ height: `${(s.revenue / maxRevenue) * 100}%` }} />
                      <span>{s.period}</span>
                    </div>
                  ))}
                </div>
              </section>

              <section className="bk-card">
                <h2 className="bk-subtitle">Chi tiết</h2>
                <div className="bk-table-wrap">
                  <table className="bk-table">
                    <thead>
                      <tr>
                        <th>Thời gian</th>
                        <th>Số lượt đặt</th>
                        <th>Doanh thu</th>
                      </tr>
                    </thead>
                    <tbody>
                      {stats.series.map((s) => (
                        <tr key={s.period}>
                          <td>{s.period}</td>
                          <td>{s.bookings}</td>
                          <td>{formatVND(s.revenue)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </section>
            </>
          )}
        </>
      )}
    </main>
  );
}
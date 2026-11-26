import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { getRooms, getAreas } from "../api/roomApi.js";
import Pagination from "../components/Pagination.jsx";
import { Rating } from "../components/Stars.jsx";
import { money, todayStr, addDays } from "../utils/format.js";

const LIMIT = 9;
const initial = { location: "", checkIn: "", checkOut: "", guests: "", keyword: "", minPrice: "", maxPrice: "", sort: "newest" };

export default function Home() {
  const [filters, setFilters] = useState(initial);
  const [applied, setApplied] = useState(initial);
  const [areas, setAreas] = useState([]);
  const [page, setPage] = useState(1);
  const [data, setData] = useState({ rooms: [], total: 0, totalPages: 1 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [formError, setFormError] = useState("");

  useEffect(() => { getAreas().then(setAreas).catch(() => {}); }, []);

  useEffect(() => {
    let alive = true;
    setLoading(true);
    setError("");
    getRooms({ ...applied, status: "available", page, limit: LIMIT })
      .then((d) => alive && setData(d))
      .catch((e) => alive && setError(e.message))
      .finally(() => alive && setLoading(false));
    return () => { alive = false; };
  }, [applied, page]);

  const set = (k) => (e) => setFilters({ ...filters, [k]: e.target.value });
  const setCheckIn = (e) => {
    const v = e.target.value;
    setFilters({ ...filters, checkIn: v, checkOut: filters.checkOut && filters.checkOut > v ? filters.checkOut : v ? addDays(v, 1) : "" });
  };

  const search = (e) => {
    e.preventDefault();
    if (!!filters.checkIn !== !!filters.checkOut) return setFormError("Hãy chọn đủ cả ngày nhận và ngày trả phòng");
    if (filters.checkIn && filters.checkOut <= filters.checkIn) return setFormError("Ngày trả phòng phải sau ngày nhận phòng");
    setFormError("");
    setPage(1);
    setApplied(filters);
  };
  const reset = () => { setFilters(initial); setApplied(initial); setPage(1); setFormError(""); };

  const detailQuery = new URLSearchParams(
    Object.entries({ checkIn: applied.checkIn, checkOut: applied.checkOut, guests: applied.guests }).filter(([, v]) => v)
  ).toString();

  return (
    <main className="page">
      <section className="hero">
        <h1>Tìm homestay theo ngày và khu vực</h1>
        <p>Chọn nơi muốn đến và ngày ở, chúng tôi chỉ hiện những phòng còn trống.</p>
      </section>

      <form className="filters search" onSubmit={search}>
        <label>Khu vực
          <select value={filters.location} onChange={set("location")}>
            <option value="">Tất cả khu vực</option>
            {areas.map((a) => <option key={a}>{a}</option>)}
          </select>
        </label>
        <label>Nhận phòng
          <input type="date" min={todayStr()} value={filters.checkIn} onChange={setCheckIn} />
        </label>
        <label>Trả phòng
          <input type="date" min={filters.checkIn ? addDays(filters.checkIn, 1) : todayStr()} value={filters.checkOut} onChange={set("checkOut")} />
        </label>
        <label>Số khách
          <input type="number" min="1" placeholder="Bất kỳ" value={filters.guests} onChange={set("guests")} />
        </label>
        <label>Tên / địa chỉ
          <input placeholder="Tìm theo tên" value={filters.keyword} onChange={set("keyword")} />
        </label>
        <label>Giá từ
          <input type="number" min="0" placeholder="0" value={filters.minPrice} onChange={set("minPrice")} />
        </label>
        <label>Giá đến
          <input type="number" min="0" placeholder="Không giới hạn" value={filters.maxPrice} onChange={set("maxPrice")} />
        </label>
        <label>Sắp xếp
          <select value={filters.sort} onChange={set("sort")}>
            <option value="newest">Mới nhất</option>
            <option value="rating">Đánh giá cao</option>
            <option value="priceAsc">Giá tăng dần</option>
            <option value="priceDesc">Giá giảm dần</option>
          </select>
        </label>
        <div className="search-actions">
          <button className="primary" type="submit">Tìm phòng</button>
          <button className="ghost" type="button" onClick={reset}>Xóa lọc</button>
        </div>
      </form>

      {formError && <p className="banner err">{formError}</p>}
      {error && <p className="banner err">{error}</p>}
      {!loading && !error && <p className="muted result-count">{data.total} phòng phù hợp</p>}

      {loading ? (
        <p className="center">Đang tải danh sách phòng…</p>
      ) : data.rooms.length === 0 ? (
        <p className="center">Không có phòng nào còn trống theo điều kiện này. Thử đổi ngày hoặc khu vực.</p>
      ) : (
        <div className="grid">
          {data.rooms.map((r) => (
            <Link to={`/rooms/${r._id}${detailQuery ? `?${detailQuery}` : ""}`} className="card" key={r._id}>
              <div className="thumb" style={r.images?.[0] ? { backgroundImage: `url(${r.images[0]})` } : undefined} />
              <div className="body">
                <h3>{r.name}</h3>
                <p className="muted">{r.location}, tối đa {r.capacity} khách</p>
                <Rating avg={r.ratingAvg} count={r.ratingCount} />
                <p className="price">{money(r.price)}<span> / đêm</span></p>
              </div>
            </Link>
          ))}
        </div>
      )}
      <Pagination page={page} totalPages={data.totalPages} onChange={setPage} />
    </main>
  );
}

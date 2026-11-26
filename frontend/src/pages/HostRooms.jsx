import { useEffect, useState, useCallback } from "react";
import { getMyRooms, createRoom, updateRoom, deleteRoom } from "../api/roomApi.js";
import RoomForm from "../components/RoomForm.jsx";
import Pagination from "../components/Pagination.jsx";
import { Rating } from "../components/Stars.jsx";
import { money } from "../utils/format.js";

const LIMIT = 8;
const initialFilters = { keyword: "", minPrice: "", maxPrice: "", guests: "", status: "", sort: "newest" };

export default function HostRooms() {
  const [filters, setFilters] = useState(initialFilters);
  const [applied, setApplied] = useState(initialFilters);
  const [page, setPage] = useState(1);
  const [data, setData] = useState({ rooms: [], total: 0, totalPages: 1 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [toast, setToast] = useState("");
  const [editing, setEditing] = useState(null); // null | "new" | room
  const [saving, setSaving] = useState(false);
  const [toDelete, setToDelete] = useState(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try { setData(await getMyRooms({ ...applied, page, limit: LIMIT })); }
    catch (e) { setError(e.message); }
    finally { setLoading(false); }
  }, [applied, page]);

  useEffect(() => { load(); }, [load]);
  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(""), 2500);
    return () => clearTimeout(t);
  }, [toast]);

  const setF = (k) => (e) => setFilters({ ...filters, [k]: e.target.value });
  const search = (e) => { e.preventDefault(); setPage(1); setApplied(filters); };
  const reset = () => { setFilters(initialFilters); setApplied(initialFilters); setPage(1); };

  const save = async (body) => {
    setSaving(true);
    try {
      if (editing === "new") { await createRoom(body); setToast("Đã thêm phòng"); }
      else { await updateRoom(editing._id, body); setToast("Đã cập nhật phòng"); }
      setEditing(null);
      load();
    } catch (e) { alert(e.message); }
    finally { setSaving(false); }
  };

  const confirmDelete = async () => {
    try {
      await deleteRoom(toDelete._id);
      setToast("Đã xóa phòng");
      setToDelete(null);
      if (data.rooms.length === 1 && page > 1) setPage(page - 1); else load();
    } catch (e) { alert(e.message); setToDelete(null); }
  };

  return (
    <main className="page">
      <header className="top">
        <div><h1>Phòng của tôi</h1><p>{data.total} phòng</p></div>
        <button className="primary" onClick={() => setEditing("new")}>Thêm phòng</button>
      </header>

      <form className="filters" onSubmit={search}>
        <input placeholder="Tìm theo tên hoặc địa chỉ" value={filters.keyword} onChange={setF("keyword")} />
        <input type="number" placeholder="Giá từ" value={filters.minPrice} onChange={setF("minPrice")} />
        <input type="number" placeholder="Giá đến" value={filters.maxPrice} onChange={setF("maxPrice")} />
        <input type="number" placeholder="Số khách từ" value={filters.guests} onChange={setF("guests")} />
        <select value={filters.status} onChange={setF("status")}>
          <option value="">Mọi trạng thái</option>
          <option value="available">Đang mở</option>
          <option value="maintenance">Bảo trì</option>
        </select>
        <select value={filters.sort} onChange={setF("sort")}>
          <option value="newest">Mới nhất</option>
          <option value="rating">Đánh giá cao</option>
          <option value="priceAsc">Giá tăng dần</option>
          <option value="priceDesc">Giá giảm dần</option>
        </select>
        <button className="primary" type="submit">Lọc</button>
        <button className="ghost" type="button" onClick={reset}>Xóa lọc</button>
      </form>

      {error && <p className="banner err">{error}</p>}

      <div className="table-wrap">
        <table>
          <thead><tr><th>Tên phòng</th><th>Khu vực</th><th>Giá / đêm</th><th>Sức chứa</th><th>Đánh giá</th><th>Trạng thái</th><th></th></tr></thead>
          <tbody>
            {loading ? (
              <tr><td colSpan="7" className="empty">Đang tải…</td></tr>
            ) : data.rooms.length === 0 ? (
              <tr><td colSpan="7" className="empty">Chưa có phòng nào khớp. Hãy thêm phòng mới hoặc xóa bộ lọc.</td></tr>
            ) : data.rooms.map((r) => (
              <tr key={r._id}>
                <td className="strong">{r.name}</td>
                <td>{r.location}</td>
                <td>{money(r.price)}</td>
                <td>{r.capacity} khách</td>
                <td><Rating avg={r.ratingAvg} count={r.ratingCount} /></td>
                <td><span className={`tag ${r.status}`}>{r.status === "available" ? "Đang mở" : "Bảo trì"}</span></td>
                <td className="ops">
                  <button className="link" onClick={() => setEditing(r)}>Sửa</button>
                  <button className="link danger" onClick={() => setToDelete(r)}>Xóa</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <Pagination page={page} totalPages={data.totalPages} onChange={setPage} />

      {editing && <RoomForm room={editing === "new" ? null : editing} saving={saving} onSubmit={save} onCancel={() => setEditing(null)} />}

      {toDelete && (
        <div className="overlay" onClick={() => setToDelete(null)}>
          <div className="modal small" onClick={(e) => e.stopPropagation()}>
            <h2>Xóa phòng?</h2>
            <p>“{toDelete.name}” sẽ bị xóa vĩnh viễn.</p>
            <div className="actions">
              <button className="ghost" onClick={() => setToDelete(null)}>Giữ lại</button>
              <button className="danger-btn" onClick={confirmDelete}>Xóa phòng</button>
            </div>
          </div>
        </div>
      )}
      {toast && <div className="toast" role="status">{toast}</div>}
    </main>
  );
}

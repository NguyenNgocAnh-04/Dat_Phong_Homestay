import { useState } from "react";

const empty = { name: "", description: "", price: "", capacity: "", location: "", address: "", amenities: "", images: "", status: "available" };

export default function RoomForm({ room, onSubmit, onCancel, saving }) {
  const [f, setF] = useState(
    room ? { ...empty, ...room, amenities: (room.amenities || []).join(", "), images: (room.images || []).join(", ") } : empty
  );
  const [errors, setErrors] = useState({});
  const set = (k) => (e) => setF({ ...f, [k]: e.target.value });

  const validate = () => {
    const er = {};
    if (f.name.trim().length < 2) er.name = "Nhập tên phòng (tối thiểu 2 ký tự)";
    if (!(Number(f.price) > 0)) er.price = "Giá phải lớn hơn 0";
    if (!Number.isInteger(Number(f.capacity)) || Number(f.capacity) < 1) er.capacity = "Sức chứa phải từ 1 khách";
    if (f.location.trim().length < 2) er.location = "Nhập khu vực (ví dụ: Đà Lạt)";
    setErrors(er);
    return Object.keys(er).length === 0;
  };

  const submit = (e) => {
    e.preventDefault();
    if (!validate()) return;
    const list = (s) => s.split(",").map((x) => x.trim()).filter(Boolean);
    onSubmit({
      name: f.name.trim(),
      description: f.description,
      price: Number(f.price),
      capacity: Number(f.capacity),
      location: f.location.trim(),
      address: f.address,
      amenities: list(f.amenities),
      images: list(f.images),
      status: f.status,
    });
  };

  return (
    <div className="overlay" onClick={onCancel}>
      <form className="modal" onClick={(e) => e.stopPropagation()} onSubmit={submit} noValidate>
        <h2>{room ? "Sửa phòng" : "Thêm phòng"}</h2>

        <label>Tên phòng
          <input value={f.name} onChange={set("name")} autoFocus />
          {errors.name && <small className="err">{errors.name}</small>}
        </label>
        <div className="row">
          <label>Giá / đêm (VND)
            <input type="number" value={f.price} onChange={set("price")} />
            {errors.price && <small className="err">{errors.price}</small>}
          </label>
          <label>Sức chứa (khách)
            <input type="number" value={f.capacity} onChange={set("capacity")} />
            {errors.capacity && <small className="err">{errors.capacity}</small>}
          </label>
        </div>
        <div className="row">
          <label>Khu vực
            <input value={f.location} onChange={set("location")} placeholder="Đà Lạt" />
            {errors.location && <small className="err">{errors.location}</small>}
          </label>
          <label>Địa chỉ
            <input value={f.address} onChange={set("address")} />
          </label>
        </div>
        <label>Mô tả
          <textarea rows="3" value={f.description} onChange={set("description")} />
        </label>
        <label>Tiện nghi (cách nhau bằng dấu phẩy)
          <input value={f.amenities} onChange={set("amenities")} placeholder="Wifi, Điều hòa, Bếp" />
        </label>
        <label>Link ảnh (cách nhau bằng dấu phẩy)
          <input value={f.images} onChange={set("images")} />
        </label>
        <label>Trạng thái
          <select value={f.status} onChange={set("status")}>
            <option value="available">Đang mở</option>
            <option value="maintenance">Bảo trì</option>
          </select>
        </label>

        <div className="actions">
          <button type="button" className="ghost" onClick={onCancel}>Hủy</button>
          <button type="submit" className="primary" disabled={saving}>{saving ? "Đang lưu…" : "Lưu phòng"}</button>
        </div>
      </form>
    </div>
  );
}

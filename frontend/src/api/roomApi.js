import { request } from "./client.js";

const BASE = "/api/rooms";
const qs = (params) => {
  const q = new URLSearchParams();
  Object.entries(params).forEach(([k, v]) => v !== "" && v != null && q.set(k, v));
  return q.toString();
};
export const getRooms = (params) => request(`${BASE}?${qs(params)}`);
export const getMyRooms = (params) => request(`${BASE}/mine?${qs(params)}`);
export const getAreas = () => request(`${BASE}/areas`);
export const getRoom = (id) => request(`${BASE}/${id}`);
export const getRoomReviews = (id) => request(`${BASE}/${id}/reviews`);
export const createRoom = (b) => request(BASE, { method: "POST", body: JSON.stringify(b) });
export const updateRoom = (id, b) => request(`${BASE}/${id}`, { method: "PUT", body: JSON.stringify(b) });
export const deleteRoom = (id) => request(`${BASE}/${id}`, { method: "DELETE" });

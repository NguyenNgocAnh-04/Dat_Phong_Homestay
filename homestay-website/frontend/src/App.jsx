import { Routes, Route, Navigate } from "react-router-dom";
import Layout from "./components/Layout.jsx";
import ProtectedRoute from "./components/ProtectedRoute.jsx";
import Home from "./pages/Home.jsx";
import RoomDetail from "./pages/RoomDetail.jsx";
import Cart from "./pages/Cart.jsx";
import MyBookings from "./pages/MyBookings.jsx";
import Login from "./pages/Login.jsx";
import Register from "./pages/Register.jsx";
import HostRooms from "./pages/HostRooms.jsx";
import HostDashboard from "./pages/HostDashboard.jsx";

const HOST = ["host", "admin"];

export default function App() {
  return (
    <Routes>
      <Route element={<Layout />}>
        <Route path="/" element={<Home />} />
        <Route path="/rooms/:id" element={<RoomDetail />} />
        <Route path="/cart" element={<Cart />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/bookings" element={<ProtectedRoute><MyBookings /></ProtectedRoute>} />
        <Route path="/host/rooms" element={<ProtectedRoute role={HOST}><HostRooms /></ProtectedRoute>} />
        <Route path="/host/dashboard" element={<ProtectedRoute role={HOST}><HostDashboard /></ProtectedRoute>} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Route>
    </Routes>
  );
}

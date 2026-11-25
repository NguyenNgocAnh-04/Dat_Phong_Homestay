import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { calcNights } from '../utils/format';


const overlaps = (a, b) => a.roomId === b.roomId && a.checkIn < b.checkOut && a.checkOut > b.checkIn;


const useCartStore = create(
  persist(
    (set, get) => ({
      items: [],

      addItem: (item) => {
        const nights = calcNights(item.checkIn, item.checkOut);
        if (nights <= 0) return { ok: false, message: 'Khoảng thời gian không hợp lệ' };
        if (get().items.some((i) => overlaps(i, item))) {
          return { ok: false, message: 'Phòng này đã có trong giỏ với khung giờ trùng nhau' };
        }
        const newItem = {
          ...item,
          id: `${item.roomId}_${item.checkIn}_${item.checkOut}`,
          nights,
          subtotal: nights * item.pricePerNight,
        };
        set((state) => ({ items: [...state.items, newItem] }));
        return { ok: true };
      },

      removeItem: (id) => set((state) => ({ items: state.items.filter((i) => i.id !== id) })),
      clear: () => set({ items: [] }),
      getTotal: () => get().items.reduce((sum, i) => sum + i.subtotal, 0),
    }),
    { name: 'homestay-cart', partialize: (state) => ({ items: state.items }) }
  )
);

export default useCartStore;
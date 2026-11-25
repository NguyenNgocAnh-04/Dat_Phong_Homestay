export default function Pagination({ page, totalPages, onChange }) {
  if (totalPages <= 1) return null;
  return (
    <nav className="bk-pagination" aria-label="Phân trang">
      <button className="bk-btn bk-btn--ghost" disabled={page <= 1} onClick={() => onChange(page - 1)}>
        Trang trước
      </button>
      <span>
        Trang {page} / {totalPages}
      </span>
      <button className="bk-btn bk-btn--ghost" disabled={page >= totalPages} onClick={() => onChange(page + 1)}>
        Trang sau
      </button>
    </nav>
  );
}
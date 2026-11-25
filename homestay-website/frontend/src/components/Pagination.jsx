export default function Pagination({ page, totalPages, onChange }) {
  if (totalPages <= 1) return null;
  const pages = Array.from({ length: totalPages }, (_, i) => i + 1).filter(
    (p) => p === 1 || p === totalPages || Math.abs(p - page) <= 1
  );
  return (
    <nav className="pager" aria-label="Phân trang">
      <button disabled={page === 1} onClick={() => onChange(page - 1)}>Trước</button>
      {pages.map((p, i) => (
        <span key={p}>
          {i > 0 && p - pages[i - 1] > 1 && <span className="gap">…</span>}
          <button className={p === page ? "on" : ""} onClick={() => onChange(p)} aria-current={p === page}>
            {p}
          </button>
        </span>
      ))}
      <button disabled={page === totalPages} onClick={() => onChange(page + 1)}>Sau</button>
    </nav>
  );
}

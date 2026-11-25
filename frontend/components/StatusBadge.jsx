import { STATUS_LABEL } from '../utils/format';

export default function StatusBadge({ status }) {
  return <span className={`bk-badge bk-badge--${status}`}>{STATUS_LABEL[status] || status}</span>;
}
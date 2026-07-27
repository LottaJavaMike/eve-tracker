export default function StatusPill({ label, tone = 'neutral' }) {
  return <span className={`pill pill-${tone}`}>{label}</span>;
}

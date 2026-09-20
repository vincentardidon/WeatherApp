// A small label + value tile (humidity, pressure, ...).
function StatTile({ icon: Icon, label, value, hint, children }) {
  return (
    <div className="stat-tile">
      <div className="stat-label">
        <Icon size={16} aria-hidden="true" />
        <span>{label}</span>
      </div>
      <p className="stat-value">{value}</p>
      {hint && <p className="stat-hint">{hint}</p>}
      {children}
    </div>
  );
}

export default StatTile;
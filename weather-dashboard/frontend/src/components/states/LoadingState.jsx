// Skeleton that mirrors the dashboard layout while data loads.
function LoadingState() {
  return (
    <div className="dashboard" role="status" aria-live="polite" aria-busy="true">
      <span className="visually-hidden">Loading weather…</span>
      <div className="skeleton-card skeleton-hero area-hero" />
      <div className="skeleton-card skeleton-details area-details" />
      <div className="skeleton-card skeleton-hourly area-hourly" />
      <div className="skeleton-card skeleton-daily area-daily" />
      <div className="skeleton-card skeleton-sun area-sun" />
      <div className="skeleton-card skeleton-extra area-extra" />
    </div>
  );
}

export default LoadingState;
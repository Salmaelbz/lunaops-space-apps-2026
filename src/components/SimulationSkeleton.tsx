export default function SimulationSkeleton() {
  return (
    <div className="simulation-skeleton" role="status" aria-label="Loading simulation results">
      <div className="skeleton-metrics">
        <i /><i /><i /><i />
      </div>
      <div className="skeleton-chart">
        <i /><i /><i />
      </div>
      <div className="skeleton-timeline"><i /><i /></div>
      <span className="visually-hidden">Loading simulation results</span>
    </div>
  );
}

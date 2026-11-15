import type { SimulationResult } from "../types";

interface Props {
  simulation: SimulationResult;
}

export default function SimulationTimeline({ simulation }: Props) {
  const points = simulation.points;
  const width = 720;
  const height = 190;
  const chartTop = 16;
  const chartBottom = 148;
  const x = (index: number) => 12 + (index / Math.max(points.length - 1, 1)) * (width - 24);
  const y = (value: number) =>
    chartTop + ((15 - Math.max(-15, Math.min(15, value))) / 30) * (chartBottom - chartTop);
  const sunLine = points.map((point, index) => `${x(index)},${y(point.sunElevationDeg)}`).join(" ");
  const earthLine = points.map((point, index) => `${x(index)},${y(point.earthElevationDeg)}`).join(" ");
  const horizonY = y(0);
  const segments = points.slice(0, -1);

  return (
    <div className="simulation-timeline">
      <div className="chart-legend">
        <span><i className="legend-sun" /> Sun elevation</span>
        <span><i className="legend-earth" /> Earth elevation</span>
        <span>Local horizon: 0°</span>
      </div>
      <svg
        className="elevation-chart"
        viewBox={`0 0 ${width} ${height}`}
        role="img"
        aria-label="Illustrative Sun and Earth elevations over the next 24 hours"
      >
        <line x1="12" x2={width - 12} y1={horizonY} y2={horizonY} className="chart-horizon" />
        <polyline points={sunLine} className="chart-sun-line" />
        <polyline points={earthLine} className="chart-earth-line" />
        <text x="12" y="180">NOW</text>
        <text x={width / 2} y="180" textAnchor="middle">+12 H</text>
        <text x={width - 12} y="180" textAnchor="end">+24 H</text>
      </svg>
      <div className="visibility-timelines">
        <div className="visibility-row">
          <span>Sun above geometric horizon</span>
          <div className="visibility-track" role="img" aria-label="Two-hour sunlight samples">
            {segments.map((point) => (
              <i
                key={`sun-${point.elapsedHours}`}
                className={point.sunVisible ? "visible-sun" : ""}
                title={`${point.elapsedHours}:00–${point.elapsedHours + simulation.samplingStepHours}:00 UTC`}
              />
            ))}
          </div>
        </div>
        <div className="visibility-row">
          <span>Earth geometrically visible</span>
          <div className="visibility-track" role="img" aria-label="Two-hour Earth visibility samples">
            {segments.map((point) => (
              <i
                key={`earth-${point.elapsedHours}`}
                className={point.earthGeometricallyVisible ? "visible-earth" : ""}
                title={`${point.elapsedHours}:00–${point.elapsedHours + simulation.samplingStepHours}:00 UTC`}
              />
            ))}
          </div>
        </div>
      </div>
      <small className="chart-caption">
        {simulation.classification} · {simulation.samplingStepHours}-hour samples · no terrain obstruction modeled
      </small>
    </div>
  );
}

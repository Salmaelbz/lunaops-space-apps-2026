import { ArrowRight, CircleHelp, Radio, Sun, Zap } from "lucide-react";
import type { LandingSite, ModuleId, SimulationResult } from "../types";
import { PageHeader } from "./Sites";
import SimulationTimeline from "../components/SimulationTimeline";
import SimulationSkeleton from "../components/SimulationSkeleton";

const details = {
  "sun-earth": {
    eyebrow: "ENVIRONMENT / GEOMETRY",
    title: "Sun & Earth simulator",
    text: "Explore a simplified, date-driven concept model for the selected site.",
    icon: Sun,
    metric: "Solar and Earth geometry",
    explanation: "The model illustrates spherical geometry and simplified lunar cycles. It does not query JPL Horizons or SPICE and does not model local terrain horizons.",
  },
  power: {
    eyebrow: "ENVIRONMENT / ENERGY",
    title: "Power analyzer",
    text: "Review sampled illumination and a relative solar-elevation proxy.",
    icon: Zap,
    metric: "Sampled solar exposure",
    explanation: "The power proxy is derived from the toy solar-elevation model. It is not electrical energy production, array output, battery sizing, or a power budget.",
  },
  communications: {
    eyebrow: "ENVIRONMENT / LINK PLANNING",
    title: "Communication analyzer",
    text: "Review geometric Earth visibility without implying a working link.",
    icon: Radio,
    metric: "Earth geometric visibility",
    explanation: "Visibility only indicates whether the simplified model places Earth above a geometric horizon. No terrain blockage, relay, antenna, RF link budget, or operational constraints are modeled.",
  },
} as const;

interface Props {
  module: "sun-earth" | "power" | "communications";
  site: LandingSite;
  simulation: SimulationResult | null;
  loading: boolean;
  navigate: (id: ModuleId) => void;
}

export default function Environment({ module, site, simulation, loading, navigate }: Props) {
  const config = details[module];
  const Icon = config.icon;
  const metricValue = simulation
    ? module === "sun-earth"
      ? `${simulation.current.sunElevationDeg.toFixed(1)}° / ${simulation.current.earthElevationDeg.toFixed(1)}°`
      : module === "power"
        ? `${simulation.metrics.power}/100`
        : `${simulation.metrics.earthVisibility}%`
    : "—";

  return (
    <>
      <PageHeader eyebrow={config.eyebrow} title={config.title} text={config.text} />
      <div className="notice">
        <span className="notice-icon">i</span>
        <span>Illustrative simulated values only. The model does not use the separately displayed LOLA context map or retrieve authoritative lunar ephemerides.</span>
      </div>
      <div className="environment-grid">
        <section className="panel environment-main">
          <div className="panel-header">
            <div><div className="eyebrow">SELECTED COORDINATE</div><h2>{site.name}</h2></div>
            <Icon className="heading-icon" size={22} />
          </div>
          <p className="panel-subtitle">{site.latitude} · {site.longitude} · {config.metric}</p>
          {loading && <SimulationSkeleton />}
          {!loading && !simulation && <p className="inline-error">No model result is available. Start the FastAPI backend to calculate this view.</p>}
          {simulation && <>
            <div className="position-metrics">
              <div><span>{config.metric.toUpperCase()}</span><b>{metricValue}</b><small>{simulation.classification}</small></div>
              <div><span>SUN AZIMUTH</span><b>{simulation.current.sunAzimuthDeg.toFixed(1)}°</b><small>Illustrative local direction</small></div>
              <div><span>EARTH AZIMUTH</span><b>{simulation.current.earthAzimuthDeg.toFixed(1)}°</b><small>Geometric proxy only</small></div>
              <div><span>SAMPLED WINDOWS</span><b>{simulation.sampledSunlightHours} h / {simulation.sampledEarthVisibilityHours} h</b><small>Sunlight / Earth visibility in sample</small></div>
            </div>
            <SimulationTimeline simulation={simulation} />
          </>}
        </section>
        <aside className="panel model-note">
          <div className="note-icon"><CircleHelp size={20} /></div>
          <div className="eyebrow">MODEL LIMITATIONS</div>
          <h2>Interpret with care</h2>
          <p>{config.explanation}</p>
          <div className="source-list">
            <b>Potential authoritative source families</b>
            <a href="https://ssd.jpl.nasa.gov/horizons/" target="_blank" rel="noreferrer">JPL Horizons · ephemerides</a>
            <a href="https://naif.jpl.nasa.gov/naif/" target="_blank" rel="noreferrer">NASA NAIF SPICE · geometry toolkit</a>
            <a href="https://pds-geosciences.wustl.edu/" target="_blank" rel="noreferrer">NASA PDS Geosciences Node · data products</a>
            <a href="https://quickmap.lroc.asu.edu/" target="_blank" rel="noreferrer">LROC QuickMap · lunar context</a>
          </div>
          <button className="button button-secondary full-button" onClick={() => navigate("scenarios")}>
            Compare mission scenarios <ArrowRight size={15} />
          </button>
        </aside>
      </div>
    </>
  );
}

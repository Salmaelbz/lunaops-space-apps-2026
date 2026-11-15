import { ArrowDownRight, ArrowUpRight, Compass, Radio, Sun, Zap } from "lucide-react";
import type { LandingSite, ModuleId, ScoreWeights, SimulationResult } from "../types";
import { scoreSite } from "../data";
import SimulationTimeline from "../components/SimulationTimeline";
import SimulationSkeleton from "../components/SimulationSkeleton";
import LunarTerrain from "../components/LunarTerrain";

interface Props {
  sites: LandingSite[];
  weights: ScoreWeights;
  navigate: (id: ModuleId) => void;
  activeSite: LandingSite;
  simulation: SimulationResult | null;
  simulationLoading: boolean;
  simulationError: string | null;
  onSelectSite: (siteId: string) => void;
  activity: { id: number; kind: string; message: string; time: string }[];
}

export default function Overview({
  sites,
  weights,
  navigate,
  activeSite,
  simulation,
  simulationLoading,
  simulationError,
  onSelectSite,
  activity,
}: Props) {
  const ranked = sites.map((site) => ({ ...site, score: scoreSite(site, weights) })).sort((a, b) => b.score - a.score);
  const best = ranked[0];
  return (
    <>
      <div className="page-heading">
        <div><div className="eyebrow">MISSION PLANNING / OVERVIEW</div><h1>Mission overview</h1><p>Compare candidate landing regions against your mission priorities.</p></div>
      </div>
      <div className="notice"><span className="notice-icon">i</span><span><b>Illustrative simulation.</b> Values shown are demo inputs for interface exploration—not lunar measurements, predictions, or mission recommendations.</span></div>
      <LunarTerrain sites={sites} selectedSiteId={activeSite.id} onSelectSite={onSelectSite} />
      <section className="metric-grid">
        <Metric icon={Compass} label="CANDIDATE SITES" value="03" detail="Illustrative locations" accent="blue" />
        <Metric icon={Sun} label="TOP SUNLIGHT INDEX" value={`${best?.sunlight ?? 0}%`} detail="Normalized demo score" accent="gold" />
        <Metric icon={Zap} label="POWER POTENTIAL" value={`${best?.power ?? 0}%`} detail="Relative demo index" accent="gold" />
        <Metric icon={Radio} label="COMMS OPPORTUNITY" value={`${best?.communications ?? 0}%`} detail="Relative demo index" accent="green" />
      </section>
      <section className="panel active-simulation">
        <div className="panel-header">
          <div><div className="eyebrow">DATE-DRIVEN CONCEPT MODEL</div><h2>{activeSite.name}</h2></div>
          <span className="demo-tag">{simulation?.classification ?? "SIMULATION"}</span>
        </div>
        {simulationLoading && <SimulationSkeleton />}
        {!simulationLoading && simulationError && <p className="inline-error">No simulation result is available. The API error is shown above.</p>}
        {!simulationLoading && simulation && <>
          <div className="position-metrics">
            <div><span>SUN ELEVATION</span><b>{simulation.current.sunElevationDeg.toFixed(1)}°</b><small>Az {simulation.current.sunAzimuthDeg.toFixed(1)}° · illustrative</small></div>
            <div><span>EARTH ELEVATION</span><b>{simulation.current.earthElevationDeg.toFixed(1)}°</b><small>Az {simulation.current.earthAzimuthDeg.toFixed(1)}° · geometric proxy</small></div>
            <div><span>NEXT SUN TRANSITION</span><b>{simulation.hoursUntilSunTransition === null ? "—" : `${simulation.hoursUntilSunTransition} h`}</b><small>Sampled horizon crossing</small></div>
            <div><span>NEXT EARTH TRANSITION</span><b>{simulation.hoursUntilEarthTransition === null ? "—" : `${simulation.hoursUntilEarthTransition} h`}</b><small>Not a link-availability result</small></div>
          </div>
          <SimulationTimeline simulation={simulation} />
        </>}
        <p className="chart-caption">This simplified model uses no ephemeris or terrain data; values are simulated illustrations, not lunar measurements.</p>
      </section>
      <div className="content-grid">
        <section className="panel site-panel">
          <div className="panel-header"><div><div className="eyebrow">WEIGHTED CANDIDATE RANKING</div><h2>Landing site comparison</h2></div><button className="text-button" onClick={() => navigate("sites")}>Explore sites <ArrowUpRight size={14} /></button></div>
          <p className="panel-subtitle">Relative 0–100 indices · scoring weights are adjustable in Scenario Compare</p>
          <div className="table-wrap">
            <table><thead><tr><th>Candidate</th><th>Sunlight</th><th>Power</th><th>Earth view</th><th>Comms</th><th>Score</th></tr></thead>
              <tbody>{ranked.map((site, index) => <tr key={site.id}><td><span className={`rank rank-${index + 1}`}>0{index + 1}</span><span className="site-name">{site.name}<small>{site.region}</small></span></td><td>{site.sunlight}</td><td>{site.power}</td><td>{site.earthVisibility}</td><td>{site.communications}</td><td><span className="score-pill">{site.score}</span></td></tr>)}</tbody>
            </table>
          </div>
          <div className="panel-footer"><span>Scores are weighted averages of normalized illustrative inputs.</span><button className="text-button" onClick={() => navigate("scenarios")}>View scoring model <ArrowUpRight size={14} /></button></div>
        </section>
        <section className="panel recommendation">
          <div className="eyebrow">HIGHEST DEMO SCORE · NOT A RECOMMENDATION</div><h2>{best?.name ?? "No candidate"}</h2><p>{best?.region}</p>
          <div className="score-orbit"><div><strong>{best ? scoreSite(best, weights) : "—"}</strong><span>DEMO SCORE</span></div></div>
          <div className="recommendation-row"><span><Sun size={15} /> Sunlight index</span><b>{best?.sunlight}%</b></div>
          <div className="recommendation-row"><span><Zap size={15} /> Power index</span><b>{best?.power}%</b></div>
          <div className="recommendation-row"><span><Radio size={15} /> Comms index</span><b>{best?.communications}%</b></div>
          <button className="button button-primary full-button" onClick={() => navigate("scenarios")}>Review demo scoring <ArrowDownRight size={15} /></button>
        </section>
      </div>
      <section className="panel activity-log" aria-labelledby="activity-log-title">
        <div className="activity-log-heading">
          <div><div className="eyebrow">LOCAL SESSION · USER ACTIONS AND API RESULTS</div><h2 id="activity-log-title">Activity log</h2></div>
          <span className="demo-tag">NO LIVE TELEMETRY</span>
        </div>
        <ol>
          {activity.map((entry) => (
            <li key={entry.id}>
              <time>{entry.time}</time>
              <span className={`activity-kind ${entry.kind === "API ERROR" ? "activity-warning" : ""}`}>{entry.kind}</span>
              <span>{entry.message}</span>
            </li>
          ))}
        </ol>
        {activity.length === 0 && (
          <p className="activity-empty">Waiting for a user action or model response. No live telemetry is connected.</p>
        )}
      </section>
      <section className="panel assumptions-panel"><div className="eyebrow">MODEL TRANSPARENCY</div><h2>What this prototype does—and doesn’t—tell you</h2><div className="assumptions-grid"><div><b>Illustrative inputs</b><p>Every site metric here is fabricated for the demo UI. It is not sourced from NASA data.</p></div><div><b>Simple weighted score</b><p>Indices are combined as a normalized weighted average; uncertainty and feasibility are not modeled.</p></div>      <div><b>Archived LOLA context</b><p>A south-pole permanent-shadow map is available in Landing Sites. It does not feed the demo model or candidate scores.</p><button className="text-button" onClick={() => navigate("sites")}>Inspect the data layer <ArrowUpRight size={14} /></button></div></div></section>
    </>
  );
}

function Metric({ icon: Icon, label, value, detail, accent }: { icon: typeof Sun; label: string; value: string; detail: string; accent: string }) {
  return <article className="metric-card"><div className={`metric-icon ${accent}`}><Icon size={18} /></div><div className="metric-label">{label}</div><div className="metric-value">{value}</div><div className="metric-detail">{detail}</div></article>;
}

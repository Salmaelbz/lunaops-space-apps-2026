import { AlertTriangle, Check, RotateCcw, ShieldCheck } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { scoreScenario, simulateSite } from "../api";
import SimulationSkeleton from "../components/SimulationSkeleton";
import { initialWeights } from "../data";
import type { LandingSite, ScoreResult, SimulationResult } from "../types";
import { PageHeader } from "./Sites";

const stressors = [
  { id: "low-sun", title: "Reduced illumination", description: "Apply an arbitrary 16-point sunlight metric reduction", impact: "Sunlight proxy" },
  { id: "comm-outage", title: "Communications interruption", description: "Apply an arbitrary 12-point communications reduction", impact: "Comms proxy" },
  { id: "power-margin", title: "Power margin reduction", description: "Apply an arbitrary 14-point power metric reduction", impact: "Power proxy" },
];

export default function Resilience({ sites, datetimeUtc }: { sites: LandingSite[]; datetimeUtc: string }) {
  const [selected, setSelected] = useState<string[]>([]);
  const [siteId, setSiteId] = useState(sites[0]?.id ?? "");
  const [result, setResult] = useState<{
    key: string;
    simulation: SimulationResult | null;
    baseline: ScoreResult | null;
    stressed: ScoreResult | null;
    error: string | null;
  }>({ key: "", simulation: null, baseline: null, stressed: null, error: null });
  const site = sites.find((item) => item.id === siteId) ?? sites[0];
  const selectedKey = [...selected].sort().join("|");
  const selectedStressorIds = useMemo(
    () => new Set(selectedKey.split("|").filter(Boolean)),
    [selectedKey],
  );
  const requestKey = `${site?.id ?? ""}:${datetimeUtc}:${selectedKey}`;
  const resultMatchesCurrentInputs = result.key === requestKey;
  const simulation = resultMatchesCurrentInputs ? result.simulation : null;
  const baseline = resultMatchesCurrentInputs ? result.baseline : null;
  const stressed = resultMatchesCurrentInputs ? result.stressed : null;
  const loading = !resultMatchesCurrentInputs;
  const error = resultMatchesCurrentInputs ? result.error : null;

  useEffect(() => {
    if (!site) return;
    const controller = new AbortController();
    simulateSite(site, datetimeUtc, controller.signal)
      .then(async (result) => {
        const adjustedMetrics = { ...result.metrics };
        if (selectedStressorIds.has("low-sun")) adjustedMetrics.sunlight = Math.max(0, adjustedMetrics.sunlight - 16);
        if (selectedStressorIds.has("power-margin")) adjustedMetrics.power = Math.max(0, adjustedMetrics.power - 14);
        if (selectedStressorIds.has("comm-outage")) adjustedMetrics.communications = Math.max(0, adjustedMetrics.communications - 12);
        const [baselineScore, stressedScore] = await Promise.all([
          scoreScenario(result.metrics, initialWeights, controller.signal),
          scoreScenario(adjustedMetrics, initialWeights, controller.signal),
        ]);
        if (!controller.signal.aborted) {
          setResult({
            key: requestKey,
            simulation: result,
            baseline: baselineScore,
            stressed: stressedScore,
            error: null,
          });
        }
      })
      .catch((cause: unknown) => {
        if (cause instanceof DOMException && cause.name === "AbortError") return;
        if (!controller.signal.aborted) {
          setResult({
            key: requestKey,
            simulation: null,
            baseline: null,
            stressed: null,
            error: cause instanceof Error ? cause.message : "The resilience simulation failed.",
          });
        }
      });
    return () => controller.abort();
  }, [site, datetimeUtc, selectedKey, requestKey, selectedStressorIds]);

  const toggle = (id: string) => setSelected((current) =>
    current.includes(id) ? current.filter((item) => item !== id) : [...current, id],
  );
  const reset = () => setSelected([]);

  return (
    <>
      <PageHeader eyebrow="OPERATIONS / CONTINGENCY PLANNING" title="Resilience simulation" text="Compare a selected site and date with explicitly illustrative stress cases." />
      <div className="notice"><span className="notice-icon">i</span><span>Stress effects are arbitrary demo adjustments to normalized metrics—not engineering failure models, operational guidance, or mission recommendations.</span></div>
      <div className="resilience-grid">
        <section className="panel stressor-panel">
          <div className="panel-header"><div><div className="eyebrow">SCENARIO SETUP</div><h2>Mission stressors</h2></div><ShieldCheck size={19} className="heading-icon" /></div>
          <label className="select-label" htmlFor="site-select">Candidate site</label>
          <select id="site-select" value={siteId} onChange={(event) => setSiteId(event.target.value)}>
            {sites.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}
          </select>
          <p className="panel-subtitle">Landing time: {datetimeUtc.replace("T", " ")} UTC</p>
          <div className="stressor-list">
            {stressors.map((item) => (
              <label className={`stressor-option ${selected.includes(item.id) ? "stressor-selected" : ""}`} key={item.id}>
                <input type="checkbox" checked={selected.includes(item.id)} onChange={() => toggle(item.id)} />
                <span className="checkbox-custom">{selected.includes(item.id) && <Check size={13} />}</span>
                <span><b>{item.title}</b><small>{item.description}</small></span><em>{item.impact}</em>
              </label>
            ))}
          </div>
          <button type="button" className="text-button reset-button" onClick={reset}><RotateCcw size={14} /> Clear stressors</button>
        </section>
        <section className="panel resilience-result">
          <div className="eyebrow">ILLUSTRATIVE SCENARIO OUTCOME</div>
          <h2>{site?.name ?? "No candidate selected"}</h2>
          <p>Baseline geometry and adjustable stress assumptions use the same selected date.</p>
          {loading && <SimulationSkeleton />}
          {error && <p className="inline-error" role="alert">{error}</p>}
          {!loading && baseline && stressed && <>
            <div className="resilience-score">
              <div><small>BASELINE SCORE</small><strong>{baseline.score}</strong></div>
              <div className="score-arrow">→</div>
              <div><small>STRESS CASE</small><strong className={selected.length ? "stress-score" : ""}>{stressed.score}</strong></div>
            </div>
            <div className="scenario-card-breakdown">
              {Object.entries(simulation?.metrics ?? {}).map(([key, value]) => <span key={key}>{key}: <b>{value}</b></span>)}
            </div>
            <div className="contribution-list">
              {Object.entries(stressed.contributions).map(([key, value]) => <span key={key}>Stress contribution · {key}: <b>{value}</b></span>)}
            </div>
            {selected.length > 0
              ? <div className="warning-card"><AlertTriangle size={17} /><span><b>{selected.length} stressor{selected.length > 1 ? "s" : ""} enabled</b><small>Arbitrary deductions applied to demo inputs, not mission analysis.</small></span></div>
              : <div className="ready-card"><Check size={17} /><span><b>No stressors selected</b><small>The baseline and stress case use the same illustrative inputs.</small></span></div>}
          </>}
          <div className="source-caveat">The geometry model is illustrative. Stressors change score inputs only; no physical system response is simulated.</div>
        </section>
      </div>
    </>
  );
}

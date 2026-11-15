import { useEffect, useState } from "react";
import { ArrowRight, RotateCcw, Scale } from "lucide-react";
import { scoreScenario, simulateSite } from "../api";
import SimulationSkeleton from "../components/SimulationSkeleton";
import type {
  LandingSite,
  ScoreResult,
  ScoreWeights,
  SimulationResult,
} from "../types";
import { PageHeader } from "./Sites";

interface Props {
  sites: LandingSite[];
  weights: ScoreWeights;
  setWeights: (weights: ScoreWeights) => void;
  datetimeUtc: string;
}

interface ScenarioInput {
  id: number;
  siteId: string;
  datetimeUtc: string;
}

interface ScenarioResult {
  key: string;
  simulation: SimulationResult;
  score: ScoreResult;
  error: null;
}

interface ScenarioError {
  key: string;
  error: string;
  simulation: null;
  score: null;
}

type ScenarioOutput = ScenarioResult | ScenarioError;

const factors: { key: keyof ScoreWeights; label: string; description: string }[] = [
  { key: "sunlight", label: "Sunlight availability", description: "Sampled fraction above geometric horizon" },
  { key: "power", label: "Power proxy", description: "Mean positive sine of solar elevation" },
  { key: "earthVisibility", label: "Earth visibility", description: "Sampled geometric horizon proxy" },
  { key: "communications", label: "Communications proxy", description: "Same geometric proxy; not link feasibility" },
];

function requestKey(scenario: ScenarioInput, weights: ScoreWeights): string {
  return `${scenario.siteId}:${scenario.datetimeUtc}:${JSON.stringify(weights)}`;
}

export default function Scenarios({ sites, weights, setWeights, datetimeUtc }: Props) {
  const [scenarioInputs, setScenarioInputs] = useState<ScenarioInput[]>([
    { id: 0, siteId: sites[0].id, datetimeUtc },
    { id: 1, siteId: sites[1]?.id ?? sites[0].id, datetimeUtc },
  ]);
  const [scenarioOutputs, setScenarioOutputs] = useState<Record<number, ScenarioOutput>>({});

  const weightTotal = Object.values(weights).reduce((a, b) => a + b, 0);
  const updateWeight = (key: keyof ScoreWeights, value: number) => {
    setWeights({ ...weights, [key]: value });
  };
  const updateScenario = (id: number, patch: Partial<ScenarioInput>) => {
    setScenarioInputs((current) =>
      current.map((scenario) => scenario.id === id ? { ...scenario, ...patch } : scenario),
    );
  };

  useEffect(() => {
    const controllers = scenarioInputs.map(() => new AbortController());
    scenarioInputs.forEach((scenario, index) => {
      const selectedSite = sites.find((site) => site.id === scenario.siteId);
      if (!selectedSite) return;
      const controller = controllers[index];
      const key = requestKey(scenario, weights);
      simulateSite(selectedSite, scenario.datetimeUtc, controller.signal)
        .then((simulation) =>
          scoreScenario(simulation.metrics, weights, controller.signal)
            .then((score) => ({ simulation, score })),
        )
        .then(({ simulation, score }) => {
          if (!controller.signal.aborted) {
            setScenarioOutputs((current) => ({
              ...current,
              [scenario.id]: { key, simulation, score, error: null },
            }));
          }
        })
        .catch((error: unknown) => {
          if (error instanceof DOMException && error.name === "AbortError") return;
          if (!controller.signal.aborted) {
            setScenarioOutputs((current) => ({
              ...current,
              [scenario.id]: {
                key,
                simulation: null,
                score: null,
                error: error instanceof Error ? error.message : "The comparison request failed.",
              },
            }));
          }
        });
    });
    return () => controllers.forEach((controller) => controller.abort());
  }, [scenarioInputs, sites, weights]);

  const scenarios = scenarioInputs.map((input) => {
    const output = scenarioOutputs[input.id];
    const matches = output?.key === requestKey(input, weights);
    return {
      ...input,
      simulation: matches && output && "simulation" in output ? output.simulation : null,
      score: matches && output && "score" in output ? output.score : null,
      error: matches && output ? output.error : null,
      loading: !matches,
    };
  });

  const addScenario = () => {
    if (scenarioInputs.length >= 4) return;
    setScenarioInputs((current) => {
      const id = Math.max(-1, ...current.map((scenario) => scenario.id)) + 1;
      return [...current, {
        id,
        siteId: sites[current.length % sites.length].id,
        datetimeUtc,
      }];
    });
  };
  const removeScenario = (id: number) => {
    setScenarioInputs((current) => current.filter((scenario) => scenario.id !== id));
  };
  const resetScenarios = () => {
    setScenarioInputs((current) => current.map((scenario, index) => ({
      ...scenario,
      siteId: sites[index % sites.length].id,
      datetimeUtc,
    })));
  };

  const ranked = scenarios
    .map((scenario) => ({
      scenario,
      site: sites.find((site) => site.id === scenario.siteId),
    }))
    .sort((a, b) => (b.scenario.score?.score ?? -1) - (a.scenario.score?.score ?? -1));
  const leader = ranked[0]?.scenario;
  const leaderMetrics = leader?.simulation?.metrics;
  const leaderMetric = leaderMetrics
    ? factors.reduce((highest, factor) =>
        leaderMetrics[factor.key] > leaderMetrics[highest.key] ? factor : highest,
      factors[0])
    : null;
  const leaderTradeoff = leaderMetrics
    ? factors.reduce((lowest, factor) =>
        leaderMetrics[factor.key] < leaderMetrics[lowest.key] ? factor : lowest,
      factors[0])
    : null;

  return (
    <>
      <PageHeader eyebrow="MISSION / DECISION SUPPORT" title="Scenario comparison" text="Compare site and date alternatives using explicit, adjustable scoring weights." />
      <div className="notice"><span className="notice-icon">i</span><span>All scenario outputs are illustrative simulations from a coarse, unvalidated geometry model. They are not scientific measurements or operational recommendations.</span></div>
      <div className="scenario-grid">
        <section className="panel weights-panel">
          <div className="panel-header"><div><div className="eyebrow">SCORING MODEL</div><h2>Mission priorities</h2></div><Scale size={19} className="heading-icon" /></div>
          <p className="panel-subtitle">Each input is normalized to 0–100 by the API. Score = weighted average of the four demo metrics.</p>
          {factors.map((factor) => (
            <div className="weight-row" key={factor.key}>
              <div className="weight-label"><span><b>{factor.label}</b><small>{factor.description}</small></span><strong>{weights[factor.key]}%</strong></div>
              <input aria-label={`${factor.label} weight`} type="range" min="0" max="100" value={weights[factor.key]} onChange={(event) => updateWeight(factor.key, Number(event.target.value))} />
            </div>
          ))}
          <div className={`weight-total ${weightTotal === 100 ? "" : "weight-warning"}`}>
            <span>Total weight</span><b>{weightTotal}%</b>{weightTotal !== 100 && <small>Weights are normalized automatically for scoring.</small>}
          </div>
          <button type="button" className="text-button reset-button" onClick={() => {
            setWeights({ sunlight: 35, power: 30, earthVisibility: 20, communications: 15 });
          }}><RotateCcw size={14} /> Reset to demo defaults</button>
          <div className="formula-box"><b>Scoring formula</b><code>Σ (normalized metric × weight) ÷ Σ weights</code><span>Metric contributions are returned by the API; no uncertainty or confidence interval is modeled.</span></div>
        </section>

        <section className="panel ranking-panel">
          <div className="panel-header"><div><div className="eyebrow">LIVE COMPARISON</div><h2>Mission scenarios</h2></div><span className="demo-tag">SIMULATED</span></div>
          <p className="panel-subtitle">Change a candidate or date. Each scenario is simulated and scored independently.</p>
          <div className="scenario-editors">
            {scenarios.map((scenario) => (
              <div className="scenario-editor" key={scenario.id}>
                <b>Scenario {String.fromCharCode(65 + scenario.id)}</b>
                <label>Candidate
                  <select value={scenario.siteId} onChange={(event) => updateScenario(scenario.id, { siteId: event.target.value })}>
                    {sites.map((site) => <option key={site.id} value={site.id}>{site.name}</option>)}
                  </select>
                </label>
                <label>Landing time · UTC
                  <input type="datetime-local" value={scenario.datetimeUtc} onChange={(event) => updateScenario(scenario.id, { datetimeUtc: event.target.value })} />
                </label>
                {scenarios.length > 2 && <button type="button" className="text-button" onClick={() => removeScenario(scenario.id)}>Remove scenario</button>}
              </div>
            ))}
          </div>
          {scenarios.length < 4 && <button type="button" className="button button-secondary" onClick={addScenario}>Add scenario</button>}
          {ranked.map(({ scenario, site }, index) => (
            <article className={`scenario-card ${index === 0 ? "scenario-top" : ""}`} key={`result-${scenario.id}`}>
              <div className="scenario-card-top">
                <span className={`rank rank-${index + 1}`}>0{index + 1}</span>
                <div><b>Scenario {String.fromCharCode(65 + scenario.id)} · {site?.name ?? "Unknown site"}</b><small>{scenario.datetimeUtc.replace("T", " ")} UTC</small></div>
                <div className="scenario-score"><strong>{scenario.loading ? "…" : scenario.score?.score ?? "—"}</strong><small>DEMO SCORE</small></div>
              </div>
              {scenario.error && <p className="inline-error" role="alert">{scenario.error}</p>}
              {scenario.loading && <SimulationSkeleton />}
              {scenario.simulation && <div className="scenario-card-breakdown">
                <span>Sun {scenario.simulation.metrics.sunlight}<b>%</b></span>
                <span>Power {scenario.simulation.metrics.power}<b>/100</b></span>
                <span>Earth {scenario.simulation.metrics.earthVisibility}<b>%</b></span>
                <span>Comms {scenario.simulation.metrics.communications}<b>%*</b></span>
              </div>}
              {scenario.score && <div className="contribution-list">
                {factors.map((factor) => <span key={factor.key}>{factor.label}: <b>+{scenario.score?.contributions[factor.key]}</b></span>)}
              </div>}
            </article>
          ))}
          {leader?.score && leaderMetrics && leaderMetric && leaderTradeoff && (
            <div className="recommendation-explanation">
              <b>Why this scenario ranks first in the demo</b>
              <p>
                Scenario {String.fromCharCode(65 + ranked[0].scenario.id)} leads under the current weights because its
                highest modeled input is {leaderMetric.label.toLowerCase()} ({leaderMetrics[leaderMetric.key]}/100).
                Its weakest input is {leaderTradeoff.label.toLowerCase()} ({leaderMetrics[leaderTradeoff.key]}/100).
                This is only an explanation of the toy score, not a mission recommendation.
              </p>
            </div>
          )}
          <p className="chart-caption">*The communication proxy equals geometric Earth visibility here. It does not assess terrain, hardware, links, or actual contact.</p>
          <button type="button" className="button button-secondary full-button" onClick={resetScenarios}>
            Reset scenario inputs to selected mission date <ArrowRight size={15} />
          </button>
        </section>
      </div>
    </>
  );
}

import { useMemo, useState, type FormEvent } from "react";
import { Search } from "lucide-react";
import type { LandingSite, ScoreWeights } from "../types";
import { scoreSite } from "../data";
import LunarPsrMap from "../components/LunarPsrMap";

interface Props {
  sites: LandingSite[];
  weights: ScoreWeights;
  selectedSiteId: string;
  onSelectSite: (id: string) => void;
  onApplyCustom: (latitude: number, longitude: number) => void;
}

export default function Sites({
  sites,
  weights,
  selectedSiteId,
  onSelectSite,
  onApplyCustom,
}: Props) {
  const [query, setQuery] = useState("");
  const [latitude, setLatitude] = useState("-89.0");
  const [longitude, setLongitude] = useState("0.0");
  const [coordinateError, setCoordinateError] = useState<string | null>(null);
  const ranked = useMemo(
    () => [...sites].sort((a, b) => scoreSite(b, weights) - scoreSite(a, weights)),
    [sites, weights],
  );
  const filtered = ranked.filter((site) =>
    `${site.name} ${site.region}`.toLowerCase().includes(query.trim().toLowerCase()),
  );

  const submitCoordinates = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const lat = Number(latitude);
    const lon = Number(longitude);
    if (!Number.isFinite(lat) || lat < -90 || lat > 90) {
      setCoordinateError("Latitude must be between −90° and 90°.");
      return;
    }
    if (!Number.isFinite(lon) || lon < -180 || lon > 180) {
      setCoordinateError("Longitude must be between −180° and 180°.");
      return;
    }
    setCoordinateError(null);
    onApplyCustom(lat, lon);
  };

  return (
    <>
      <PageHeader eyebrow="SPACE APPS 2026 / LUNAR LANDING SITE NAVIGATOR" title="Lunar site & date explorer" text="Compare site and time scenarios, and inspect the source of the south-pole context layer." />
      <div className="notice">
        <span className="notice-icon">i</span>
        <span>The LOLA-derived layer is archived source data. Candidate locations, coordinates, rankings, and time-dependent outputs remain illustrative and unvalidated.</span>
      </div>
      <div className="explorer-layout">
        <section className="panel map-panel">
          <LunarPsrMap />
          <form className="coordinate-form" onSubmit={submitCoordinates}>
            <div><div className="eyebrow">CUSTOM COORDINATE PREVIEW</div><p>Enter a coordinate for the illustrative simulator. It is not plotted on the source map or scored.</p></div>
            <label>Latitude (°)<input type="number" step="0.01" min="-90" max="90" value={latitude} onChange={(event) => setLatitude(event.target.value)} required /></label>
            <label>Longitude (°)<input type="number" step="0.01" min="-180" max="180" value={longitude} onChange={(event) => setLongitude(event.target.value)} required /></label>
            <button type="submit" className="button button-secondary">Preview coordinate</button>
            {coordinateError && <p className="inline-error" role="alert">{coordinateError}</p>}
          </form>
        </section>
        <section className="panel candidate-panel">
          <div className="panel-header">
            <div><div className="eyebrow">{filtered.length.toString().padStart(2, "0")} DEMO SCENARIOS</div><h2>Sample site inputs</h2></div>
          </div>
          <label className="candidate-search">
            <Search size={16} />
            <input type="search" value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search candidates" aria-label="Search candidates" />
          </label>
          <div className="candidate-list">
            {filtered.map((site, index) => (
              <article className={`candidate-card ${selectedSiteId === site.id ? "candidate-selected" : ""}`} key={site.id}>
                <div className="candidate-title">
                  <span className={`rank rank-${index + 1}`}>0{index + 1}</span>
                  <div><b>{site.name}</b><small>{site.region}</small></div>
                  <span className="score-pill">{scoreSite(site, weights)}</span>
                </div>
                <div className="candidate-coords">PLACEHOLDER COORDINATES <span>{site.latitude} · {site.longitude}</span></div>
                <div className="candidate-metrics">
                  <IndexBar label="Sunlight" value={site.sunlight} />
                  <IndexBar label="Power" value={site.power} />
                  <IndexBar label="Earth view" value={site.earthVisibility} />
                  <IndexBar label="Comms proxy" value={site.communications} />
                </div>
                <button
                  type="button"
                  className="text-button"
                  aria-pressed={selectedSiteId === site.id}
                  onClick={() => onSelectSite(site.id)}
                >{selectedSiteId === site.id ? "Selected for simulation" : "Select candidate"}</button>
              </article>
            ))}
            {filtered.length === 0 && <p className="panel-subtitle">No candidate names match “{query}”.</p>}
          </div>
        </section>
      </div>
    </>
  );
}

export function PageHeader({ eyebrow, title, text }: { eyebrow: string; title: string; text: string }) {
  return <div className="page-heading"><div><div className="eyebrow">{eyebrow}</div><h1>{title}</h1><p>{text}</p></div></div>;
}

export function IndexBar({ label, value }: { label: string; value: number }) {
  return <div className="index-bar"><span>{label}</span><div className="bar-track"><i style={{ width: `${value}%` }} /></div><b>{value}</b></div>;
}

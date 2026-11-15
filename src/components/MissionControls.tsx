import type { LandingSite } from "../types";

interface Props {
  sites: LandingSite[];
  customSite: LandingSite | null;
  selectedSiteId: string;
  datetimeUtc: string;
  onSiteChange: (id: string) => void;
  onDatetimeChange: (value: string) => void;
}

export default function MissionControls({
  sites,
  customSite,
  selectedSiteId,
  datetimeUtc,
  onSiteChange,
  onDatetimeChange,
}: Props) {
  return (
    <section className="mission-controls" aria-label="Mission simulation inputs">
      <label>
        <span>LANDING SITE</span>
        <select value={selectedSiteId} onChange={(event) => onSiteChange(event.target.value)}>
          {sites.map((site) => (
            <option key={site.id} value={site.id}>{site.name}</option>
          ))}
          {customSite && <option value="custom">Custom coordinate preview</option>}
        </select>
      </label>
      <label>
        <span>MISSION TIME · UTC</span>
        <input
          type="datetime-local"
          value={datetimeUtc}
          onChange={(event) => onDatetimeChange(event.target.value)}
          aria-describedby="mission-time-help"
        />
      </label>
      <small id="mission-time-help">The model is illustrative; the LOLA context map is not used in calculations.</small>
    </section>
  );
}

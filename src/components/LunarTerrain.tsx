import type { CSSProperties } from "react";
import { MapPin } from "lucide-react";
import type { LandingSite } from "../types";

interface Props {
  sites: LandingSite[];
  selectedSiteId: string;
  onSelectSite: (siteId: string) => void;
}

const markerPositions: Record<string, { left: string; top: string }> = {
  "south-ridge": { left: "35%", top: "61%" },
  shackleton: { left: "57%", top: "54%" },
  malapert: { left: "77%", top: "49%" },
};

export default function LunarTerrain({
  sites,
  selectedSiteId,
  onSelectSite,
}: Props) {
  return (
    <section className="terrain-scene" aria-labelledby="terrain-title">
      <svg className="terrain-art" viewBox="0 0 1100 390" preserveAspectRatio="xMidYMid slice" aria-hidden="true">
        <defs>
          <linearGradient id="lunar-sky" x1="0" y1="0" x2="0.8" y2="1">
            <stop offset="0" stopColor="#0d131b" />
            <stop offset="0.62" stopColor="#20252a" />
            <stop offset="1" stopColor="#695e50" />
          </linearGradient>
          <linearGradient id="lunar-ground" x1="0" y1="0" x2="0.78" y2="0.82">
            <stop offset="0" stopColor="#c5b9a2" />
            <stop offset="0.32" stopColor="#898274" />
            <stop offset="0.68" stopColor="#4d4d4b" />
            <stop offset="1" stopColor="#262a2b" />
          </linearGradient>
          <radialGradient id="earth-ocean" cx="32%" cy="28%" r="72%">
            <stop offset="0" stopColor="#b6d5dc" />
            <stop offset="0.48" stopColor="#4d8298" />
            <stop offset="1" stopColor="#173347" />
          </radialGradient>
          <radialGradient id="crater-floor">
            <stop offset="0" stopColor="#222627" />
            <stop offset="0.52" stopColor="#484a47" />
            <stop offset="0.75" stopColor="#716d62" />
            <stop offset="1" stopColor="#c5b9a2" />
          </radialGradient>
          <filter id="surface-shadow" x="-20%" y="-30%" width="140%" height="170%">
            <feGaussianBlur stdDeviation="11" />
          </filter>
          <clipPath id="ground-clip">
            <path d="M0 220 104 204 190 216 280 178 367 195 456 150 544 180 646 130 726 166 810 123 895 149 994 105 1100 134V390H0Z" />
          </clipPath>
        </defs>
        <rect width="1100" height="390" fill="url(#lunar-sky)" />
        <g fill="#e7e2d7" opacity=".7">
          <circle cx="92" cy="56" r="1" /><circle cx="180" cy="92" r="1.2" />
          <circle cx="310" cy="46" r=".9" /><circle cx="436" cy="83" r="1" />
          <circle cx="552" cy="38" r="1.1" /><circle cx="695" cy="70" r=".8" />
          <circle cx="780" cy="33" r="1" /><circle cx="1007" cy="92" r="1" />
          <circle cx="1038" cy="44" r=".8" />
        </g>
        <circle cx="883" cy="94" r="44" fill="#9dc7d4" opacity=".14" />
        <circle cx="883" cy="94" r="34" fill="url(#earth-ocean)" />
        <path d="M861 75q10-8 17-3l-2 10 8 5-6 10-10 2-4 12-9-5-3-15 6-7Zm31 12 11 4 4 9-8 8-7-8Z" fill="#d0d5c7" opacity=".76" />
        <path d="M0 228 104 212 190 224 280 186 367 203 456 158 544 188 646 138 726 174 810 131 895 157 994 113 1100 142V390H0Z" fill="#171c20" opacity=".78" filter="url(#surface-shadow)" />
        <g clipPath="url(#ground-clip)">
          <rect y="130" width="1100" height="260" fill="url(#lunar-ground)" />
          <path d="M-50 262Q120 222 242 257T476 226T710 225T937 190T1170 201V390H-50Z" fill="#8d8577" opacity=".45" />
          <path d="M-30 295Q142 257 288 287T556 256T830 239T1130 231" fill="none" stroke="#ded2ba" strokeOpacity=".38" strokeWidth="2" />
          <path d="M-20 312Q160 276 305 305T578 274T843 257T1130 251" fill="none" stroke="#252a2b" strokeOpacity=".48" strokeWidth="2" />
          <path d="M-20 331Q143 298 304 324T600 293T865 279T1120 271" fill="none" stroke="#d7cbb4" strokeOpacity=".24" />
          <path d="M-20 350Q170 321 340 342T646 318T900 298T1120 293" fill="none" stroke="#262a2b" strokeOpacity=".45" />
          <g>
            <ellipse cx="225" cy="290" rx="62" ry="25" fill="#313637" />
            <ellipse cx="225" cy="284" rx="58" ry="21" fill="url(#crater-floor)" stroke="#d4c6ad" strokeOpacity=".74" strokeWidth="3" />
            <ellipse cx="225" cy="284" rx="40" ry="13" fill="none" stroke="#292e30" strokeOpacity=".66" />
            <ellipse cx="510" cy="252" rx="80" ry="31" fill="#353a3a" />
            <ellipse cx="510" cy="245" rx="74" ry="27" fill="url(#crater-floor)" stroke="#d4c6ad" strokeOpacity=".7" strokeWidth="3" />
            <ellipse cx="510" cy="245" rx="52" ry="17" fill="none" stroke="#282d2e" strokeOpacity=".7" />
            <ellipse cx="782" cy="299" rx="47" ry="19" fill="#323839" />
            <ellipse cx="782" cy="294" rx="43" ry="15" fill="url(#crater-floor)" stroke="#d4c6ad" strokeOpacity=".6" strokeWidth="2" />
            <ellipse cx="948" cy="233" rx="33" ry="14" fill="#363a39" />
            <ellipse cx="948" cy="229" rx="30" ry="11" fill="url(#crater-floor)" stroke="#d4c6ad" strokeOpacity=".55" strokeWidth="2" />
            <ellipse cx="370" cy="345" rx="25" ry="10" fill="url(#crater-floor)" stroke="#c6b99f" strokeOpacity=".65" strokeWidth="2" />
            <ellipse cx="666" cy="340" rx="19" ry="8" fill="url(#crater-floor)" stroke="#c6b99f" strokeOpacity=".6" strokeWidth="2" />
            <ellipse cx="1040" cy="326" rx="24" ry="10" fill="url(#crater-floor)" stroke="#c6b99f" strokeOpacity=".55" strokeWidth="2" />
          </g>
          <g fill="#242a2c" opacity=".72">
            <circle cx="116" cy="324" r="3" /><circle cx="165" cy="251" r="4" />
            <circle cx="322" cy="307" r="3" /><circle cx="423" cy="220" r="3.5" />
            <circle cx="603" cy="303" r="4" /><circle cx="720" cy="225" r="3" />
            <circle cx="867" cy="330" r="4" /><circle cx="1010" cy="270" r="3" />
            <circle cx="294" cy="365" r="2" /><circle cx="585" cy="367" r="2.5" />
          </g>
        </g>
        <path d="M0 220 104 204 190 216 280 178 367 195 456 150 544 180 646 130 726 166 810 123 895 149 994 105 1100 134" fill="none" stroke="#e1d3b9" strokeOpacity=".56" strokeWidth="2" />
      </svg>
      <div className="terrain-topline">
        <div>
          <div className="terrain-kicker">SOUTH POLAR REGION · CONCEPT VIEW</div>
          <h2 id="terrain-title">Read the terrain before the numbers.</h2>
        </div>
        <span className="terrain-view-label">ARTIST RENDERING <i>·</i> NOT TO SCALE</span>
      </div>
      <div className="terrain-annotation">
        <span className="terrain-coordinate">LUNAR SOUTH POLE</span>
        <span>Earth placement, relief, and candidate markers are illustrative—not geospatial.</span>
      </div>
      <div className="terrain-markers" aria-label="Select a candidate landing site">
        {sites.map((site, index) => {
          const position = markerPositions[site.id] ?? {
            left: `${25 + (index * 50) / Math.max(sites.length - 1, 1)}%`,
            top: "58%",
          };
          const style = {
            "--marker-left": position.left,
            "--marker-top": position.top,
          } as CSSProperties;
          const selected = site.id === selectedSiteId;
          return (
            <button
              className={`terrain-marker${selected ? " is-selected" : ""}`}
              key={site.id}
              style={style}
              type="button"
              onClick={() => onSelectSite(site.id)}
              aria-pressed={selected}
              aria-label={`Select ${site.name}`}
              title={`${site.name} · ${site.latitude}, ${site.longitude}`}
            >
              <span className="terrain-marker-dot"><MapPin size={14} /></span>
              <span className="terrain-marker-label">{site.name}</span>
            </button>
          );
        })}
      </div>
      <div className="terrain-scale"><span /><span /><span /><span />LOW RELIEF <b>ILLUSTRATIVE</b></div>
    </section>
  );
}

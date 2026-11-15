import { useState } from "react";
import { ExternalLink } from "lucide-react";

const productUrl =
  "https://imbrium.mit.edu/EXTRAS/ILLUMINATION/JP2/LPSR_85S_060M_201608.JP2";
const labelUrl =
  "https://imbrium.mit.edu/EXTRAS/ILLUMINATION/JP2/LPSR_85S_060M_201608_JP2.LBL";

export default function LunarPsrMap() {
  const [imageError, setImageError] = useState(false);

  return (
    <div className="lola-data-layer">
      <div className="lola-map-heading">
        <div className="eyebrow">LRO / LOLA · ARCHIVED DATA PRODUCT</div>
        <h2>Permanent shadow near the lunar south pole</h2>
        <p>
          A binary LOLA-derived reference layer for the south polar region. The
          displayed image preserves the source grid; colors are chosen for this
          interface.
        </p>
      </div>
      <figure className="lola-map-figure">
        {imageError ? (
          <p className="inline-error" role="alert">
            The local LOLA display image could not be loaded. Source links and product metadata are still available below.
          </p>
        ) : (
          <>
            <img
              className="lola-map-image"
              src="/data/lunar-psr-85s-60m.png"
              alt="Polar stereographic binary map of the lunar south pole. Dark cells are classified as permanently shadowed; light cells are not classified as permanently shadowed. No candidate markers are plotted."
              width="5058"
              height="5058"
              loading="lazy"
              decoding="async"
              onError={() => setImageError(true)}
            />
            <figcaption className="lola-map-legend">
              <span><i className="lola-legend-shadow" /> Permanent-shadow class</span>
              <span><i className="lola-legend-other" /> Not in permanent-shadow class</span>
            </figcaption>
          </>
        )}
      </figure>
      <dl className="lola-metadata">
        <div><dt>Source product</dt><dd>LPSR_85S_060M_201608</dd></div>
        <div><dt>Coverage</dt><dd>82.9° S to the south pole</dd></div>
        <div><dt>Source grid</dt><dd>5,058 × 5,058 · 60 m/pixel</dd></div>
        <div><dt>Projection</dt><dd>Planetocentric polar stereographic</dd></div>
        <div><dt>Product date</dt><dd>15 September 2016</dd></div>
        <div><dt>Data set</dt><dd>LRO-L-LOLA-4-GDR-V1.0</dd></div>
      </dl>
      <p className="lola-data-note">
        <b>Use with care.</b> This MIT archive item is in its EXTRAS collection,
        which the archive says is not supported by PDS or the LOLA Science Team.
        The layer is contextual only: it does not drive the demo scores or
        Sun/Earth model, locate candidate markers, predict current illumination,
        or assess landing safety.
      </p>
      <nav className="lola-data-links" aria-label="Lunar data sources and challenge resources">
        <a href={productUrl} target="_blank" rel="noreferrer">
          Source image <ExternalLink size={13} aria-hidden="true" />
        </a>
        <a href={labelUrl} target="_blank" rel="noreferrer">
          Product label <ExternalLink size={13} aria-hidden="true" />
        </a>
        <a href="https://quickmap.lroc.asu.edu/" target="_blank" rel="noreferrer">
          LROC QuickMap <ExternalLink size={13} aria-hidden="true" />
        </a>
        <a href="https://ssd.jpl.nasa.gov/horizons/" target="_blank" rel="noreferrer">
          JPL Horizons <ExternalLink size={13} aria-hidden="true" />
        </a>
        <a href="https://trek.nasa.gov/moon/" target="_blank" rel="noreferrer">
          NASA Moon Trek <ExternalLink size={13} aria-hidden="true" />
        </a>
        <a href="https://www.asc-csa.gc.ca/eng/astronomy/moon-exploration/" target="_blank" rel="noreferrer">
          CSA Moon Exploration <ExternalLink size={13} aria-hidden="true" />
        </a>
      </nav>
    </div>
  );
}

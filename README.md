# LUNAOPS

LUNAOPS is an independent prototype for the 2026 NASA Space Apps Challenge, "Lunar Landing Site Navigator." It includes a React + TypeScript + Vite frontend and a stateless Python + FastAPI backend.

> **Not for mission operations:** the backend uses a deliberately simplified, unvalidated geometric simulation. It does not retrieve NASA/JPL ephemerides or lunar terrain. Candidate locations, coordinates, and map markers are illustrative placeholders, not verified landing sites. Results are not scientific measurements, predictions, link budgets, flight products, or landing recommendations.

## Modules

- Mission overview and candidate ranking
- Landing site explorer with an archived lunar south-pole permanent-shadow data layer
- Sun & Earth geometry concept simulator
- Power analyzer
- Communications analyzer
- Date- and site-driven Sun/Earth elevation timeline with sampled horizon visibility
- Custom coordinate preview with latitude/longitude validation
- Multi-scenario comparison with independent candidate/date inputs and configurable weighted scoring
- Conceptual resilience/stressor simulation with explicit arbitrary metric adjustments

No database or persistent storage is used. The frontend keeps scenario inputs in browser memory. It ships a static, display-only LOLA-derived raster described below. The stateless API provides anonymous health/readiness endpoints, a simplified geometry simulator, and a normalized weighted-score endpoint; it does not retrieve external scientific data.

## Space Apps 2026 challenge alignment

The official [Lunar Landing Site Navigator challenge](https://www.spaceappschallenge.org/2026/challenges/lunar-landing-site-navigator/?tab=details) asks for an intuitive way to compare lunar landing sites and dates, visualize Sun and Earth positions relative to the horizon, and assess power and direct-to-Earth communication opportunities. It also recommends LOLA topography, JPL Horizons, scenario comparisons, and experiences for both technical and public audiences.

| Challenge focus | Current implementation | Important limitation |
| --- | --- | --- |
| Compare sites and dates | Site/date controls, scenario comparison, and adjustable demo priorities | Candidate coordinates and indices are placeholders; the score is not a feasibility result |
| See Sun/Earth conditions over time | Sampled elevation and visibility timelines | The backend model is simplified and unvalidated; no JPL Horizons or SPICE ephemeris is used |
| Understand power and communications | Sunlight and Earth-visibility proxy views | No energy yield model, terrain-aware horizon, RF link budget, or relay availability is modeled |
| Use lunar context data | Static LOLA-derived permanent-shadow raster with product metadata and attribution | Context only; no coordinate query, candidate overlay, or score/model integration |
| Support different audiences | Responsive screens, readable caveats, selectable scenarios, and data provenance | Not a substitute for mission analysis; formal accessibility testing remains outstanding |

### South-pole shadow layer and attribution

`public/data/lunar-psr-85s-60m.png` is a lossless, colorized display derivative of the MIT LOLA archive's `LPSR_85S_060M_201608.JP2` product. Its label identifies the product as `LRO-L-LOLA-4-GDR-V1.0`, produced by `LRO_LOLA_TEAM`, with a 5,058 × 5,058 grid, nominal 60 m/pixel map scale, and coverage from 82.9° S to the pole in planetocentric polar stereographic projection. Dark pixels denote the product's permanent-shadow class; light pixels denote the other class. Color selection is ours; the original product and label are linked in the app.

The archive warns that products in its `EXTRAS` collection are not supported by PDS or the LOLA Science Team. We show that caveat in the interface and do not use this layer to calculate rankings, illumination windows, candidate safety, or communications. The source product is [LPSR_85S_060M_201608.JP2](https://imbrium.mit.edu/EXTRAS/ILLUMINATION/JP2/LPSR_85S_060M_201608.JP2), with its [PDS-style product label](https://imbrium.mit.edu/EXTRAS/ILLUMINATION/JP2/LPSR_85S_060M_201608_JP2.LBL). Related challenge resources include [LROC QuickMap](https://quickmap.lroc.asu.edu/), [NASA Moon Trek](https://trek.nasa.gov/moon/), and [JPL Horizons](https://ssd.jpl.nasa.gov/horizons/).

LUNAOPS is an independent hackathon prototype and is not affiliated with or endorsed by NASA, the PDS, the LOLA Science Team, or MIT. No NASA insignia or partner logos are used.

## Run locally

Prerequisites: Node.js and Python. Dependencies are declared but are not installed as part of this scaffold.

### Frontend

From the project root:

```sh
npm run dev
```

Vite serves the dashboard at `http://localhost:5173` by default and proxies API requests to `http://127.0.0.1:8000`. Set `PORT` or use `npm run dev -- --port <port>` to change the frontend port. Change `API_PORT` to match a different local API port.

### Backend

In a separate terminal:

```sh
cd backend
python -m venv .venv
# Activate the virtual environment, then install the declared requirements:
pip install -r requirements.txt
uvicorn main:app --reload --host 0.0.0.0 --port 8000
```

For a production ASGI process, run from `backend/` with:

```sh
gunicorn -w 4 -k uvicorn.workers.UvicornWorker main:app --bind 0.0.0.0:8000
```

The API provides `GET /healthz` (liveness), `GET /readyz` (readiness), `GET /api/v1/status`, `POST /api/v1/simulate`, and `POST /api/v1/score`. Vite proxies `/api`, `/healthz`, and `/readyz` to the local API server. If running the frontend and API on different origins, set `VITE_API_BASE_URL` when building the frontend and configure `CORS_ORIGINS` as a comma-separated allowlist on the API.

## Deploy on Render

The root `Dockerfile` builds the React frontend and serves it with the FastAPI backend from one web service. The included `render.yaml` selects Render's free web-service plan and uses `/healthz` for health checks. No database or paid add-on is required.

1. In the Render Dashboard, choose **New → Blueprint** and connect this GitHub repository.
2. Review the detected `lunaops-space-apps-2026` service and confirm the **Free** plan before applying.
3. Wait for the first deployment, then open the public `onrender.com` URL shown in the service dashboard.

Free web services spin down after 15 minutes without traffic and can take about a minute to start again. Free-tier usage limits apply; do not upgrade the service or add paid resources if you need to stay within a zero-cost budget. The application stores no persistent user data.

## Model, scoring, and scientific assumptions

The API samples a simplified spherical horizon model every two hours over a 24-hour window. Solar declination and Earth libration are represented by simple periodic approximations; the model is not derived from an ephemeris. Sun elevation uses a spherical trigonometric formula. Earth visibility is only a geometric proxy above a zero-degree horizon. Terrain obstruction, detailed libration, uncertainty, refraction, surface/topographic data, RF link budgets, and relay availability are not modeled.

The power indicator is the mean positive sine of sampled solar elevation, normalized to 0–100; it is not electrical energy yield. The communications score currently repeats the geometric Earth-visibility proxy and does not indicate communication feasibility. Resilience toggles apply arbitrary deductions to normalized metrics to demonstrate recomputation; they do not represent physical failure behavior.

The recommendation score is the weighted mean of normalized sunlight, power proxy, Earth visibility, and communications proxy. Weights are normalized by their sum, and the API returns each factor contribution for transparency. Inputs and outputs are classified as illustrative simulated values, not retrieved scientific data or validated calculations.

For a science-grounded implementation, use and cite validated products, and document coordinate frames, epochs/time scales, resolution, uncertainty, processing versions, and model assumptions. Potential first-party starting points include:

- [NASA Planetary Data System (PDS)](https://pds.nasa.gov/) and [PDS Geosciences Node](https://pds-geosciences.wustl.edu/) for archived planetary datasets and product documentation.
- [NASA/JPL Horizons](https://ssd.jpl.nasa.gov/horizons/) for solar-system ephemerides; geometry outputs require careful frame, observer, and time configuration.
- [NASA NAIF SPICE](https://naif.jpl.nasa.gov/naif/) for validated geometry workflows with documented kernels.
- [LROC QuickMap](https://quickmap.lroc.asu.edu/) for lunar surface context and mapping.
- [NASA Lunar Reconnaissance Orbiter (LRO)](https://science.nasa.gov/mission/lro/) mission and instrument data resources.

Those references are suggestions for future sourcing, not the source of the current demo numbers. Validate against primary dataset documentation before deriving any operational result.

## Configuration and project layout

Copy `.env.sample` to `.env` only if you need local overrides. No secrets are required. The frontend and backend can run independently for local development or together in the Render Docker service.

```text
src/
  api.ts        Typed API calls
  components/   Shared controls and timeline visualizations
  modules/      Mission, analysis, comparison, and resilience views
backend/
  main.py       FastAPI simulation, scoring, and health endpoints
  requirements.txt
```

import type {
  LandingSite,
  ScoreResult,
  ScoreWeights,
  SimulationResult,
} from "./types";

const apiBaseUrl = (import.meta.env.VITE_API_BASE_URL ?? "").replace(/\/$/, "");

async function postJson<T>(
  path: string,
  body: unknown,
  signal?: AbortSignal,
): Promise<T> {
  const response = await fetch(`${apiBaseUrl}${path}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
    signal,
  });

  if (!response.ok) {
    const detail = await response.text();
    throw new Error(`LUNAOPS API ${response.status}: ${detail}`);
  }

  return (await response.json()) as T;
}

export function simulateSite(
  site: Pick<LandingSite, "latitudeDeg" | "longitudeDeg">,
  datetimeUtc: string,
  signal?: AbortSignal,
): Promise<SimulationResult> {
  const parsedDate = new Date(`${datetimeUtc}:00Z`);
  if (!Number.isFinite(parsedDate.getTime())) {
    return Promise.reject(new Error("Enter a valid landing date and time."));
  }
  return postJson(
    "/api/v1/simulate",
    {
      latitude: site.latitudeDeg,
      longitude: site.longitudeDeg,
      datetimeUtc: parsedDate.toISOString(),
    },
    signal,
  );
}

export function scoreScenario(
  metrics: SimulationResult["metrics"],
  weights: ScoreWeights,
  signal?: AbortSignal,
): Promise<ScoreResult> {
  return postJson("/api/v1/score", { metrics, weights }, signal);
}

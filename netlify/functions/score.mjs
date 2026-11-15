const requiredMetrics = [
  "sunlight",
  "power",
  "earthVisibility",
  "communications",
];
const json = (body, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { "content-type": "application/json; charset=utf-8" },
  });

export default async function score(request) {
  if (request.method !== "POST") {
    return json({ detail: "Method not allowed." }, 405);
  }

  let input;
  try {
    input = await request.json();
  } catch {
    return json({ detail: "Request body must be valid JSON." }, 422);
  }

  const { metrics, weights } = input ?? {};
  const hasExactKeys = (value) =>
    value !== null &&
    typeof value === "object" &&
    !Array.isArray(value) &&
    Object.keys(value).length === requiredMetrics.length &&
    requiredMetrics.every((key) => Object.hasOwn(value, key));
  if (!hasExactKeys(metrics) || !hasExactKeys(weights)) {
    return json(
      { detail: `metrics and weights must contain exactly: ${requiredMetrics.join(", ")}.` },
      422,
    );
  }
  if (
    requiredMetrics.some(
      (key) =>
        typeof metrics[key] !== "number" ||
        !Number.isFinite(metrics[key]) ||
        metrics[key] < 0 ||
        metrics[key] > 100,
    )
  ) {
    return json(
      { detail: "Illustrative metric values must be between 0 and 100." },
      422,
    );
  }
  if (
    requiredMetrics.some(
      (key) =>
        typeof weights[key] !== "number" ||
        !Number.isFinite(weights[key]) ||
        weights[key] < 0,
    )
  ) {
    return json({ detail: "Weights must be non-negative." }, 422);
  }

  const totalWeight = requiredMetrics.reduce((sum, key) => sum + weights[key], 0);
  if (totalWeight <= 0) {
    return json(
      { detail: "At least one weight must be greater than zero." },
      422,
    );
  }

  const contributions = Object.fromEntries(
    [...requiredMetrics]
      .sort()
      .map((key) => [
        key,
        Math.round(((metrics[key] * weights[key]) / totalWeight) * 100) / 100,
      ]),
  );
  const score =
    Math.round(
      Object.values(contributions).reduce((sum, value) => sum + value, 0) * 100,
    ) / 100;

  return json({
    score,
    method: "normalized weighted average",
    classification: "Illustrative decision-support score",
    scientificMeasurement: false,
    contributions,
  });
}

export const config = { path: "/api/v1/score" };

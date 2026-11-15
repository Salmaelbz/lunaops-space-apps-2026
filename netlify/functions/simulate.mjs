const sampleStepHours = 2;
const sampleHours = 24;
const lunarDayDays = 29.53059;
const lunarYearDays = 365.256;
const epochMilliseconds = Date.UTC(2000, 0, 1);
const radians = (degrees) => (degrees * Math.PI) / 180;
const degrees = (radiansValue) => (radiansValue * 180) / Math.PI;
const round = (value, digits = 0) => {
  const factor = 10 ** digits;
  return Math.round((value + Number.EPSILON) * factor) / factor;
};
const json = (body, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { "content-type": "application/json; charset=utf-8" },
  });

function elevationDeg(latitude, declination, hourAngle) {
  const sinElevation =
    Math.sin(latitude) * Math.sin(declination) +
    Math.cos(latitude) * Math.cos(declination) * Math.cos(hourAngle);
  return degrees(Math.asin(Math.max(-1, Math.min(1, sinElevation))));
}

function azimuthDeg(latitude, declination, hourAngle) {
  const azimuth = Math.atan2(
    Math.sin(hourAngle),
    Math.cos(hourAngle) * Math.sin(latitude) -
      Math.tan(declination) * Math.cos(latitude),
  );
  return (degrees(azimuth) + 180) % 360;
}

function transitionHours(points, key) {
  const initialState = points[0][key];
  for (const point of points.slice(1)) {
    if (point[key] !== initialState) return point.elapsedHours;
  }
  return null;
}

function timestampUtc(milliseconds) {
  return new Date(milliseconds).toISOString().replace(".000Z", "Z");
}

export default async function simulate(request) {
  if (request.method !== "POST") {
    return json({ detail: "Method not allowed." }, 405);
  }

  let input;
  try {
    input = await request.json();
  } catch {
    return json({ detail: "Request body must be valid JSON." }, 422);
  }

  const { latitude, longitude, datetimeUtc } = input ?? {};
  if (
    typeof latitude !== "number" ||
    !Number.isFinite(latitude) ||
    latitude < -90 ||
    latitude > 90 ||
    typeof longitude !== "number" ||
    !Number.isFinite(longitude) ||
    longitude < -180 ||
    longitude > 180
  ) {
    return json({ detail: "Latitude or longitude is outside its valid range." }, 422);
  }
  if (
    typeof datetimeUtc !== "string" ||
    !/(?:Z|[+-]\d{2}:\d{2})$/i.test(datetimeUtc) ||
    !Number.isFinite(Date.parse(datetimeUtc))
  ) {
    return json({ detail: "datetimeUtc must be a valid time with a UTC offset." }, 422);
  }

  const startMilliseconds = Date.parse(datetimeUtc);
  const latitudeRadians = radians(latitude);
  const points = [];

  for (let elapsedHours = 0; elapsedHours <= sampleHours; elapsedHours += sampleStepHours) {
    const pointMilliseconds = startMilliseconds + elapsedHours * 60 * 60 * 1000;
    const elapsedDays = (pointMilliseconds - epochMilliseconds) / 86400000;
    const solarDeclination = radians(
      1.54 * Math.sin((2 * Math.PI * elapsedDays) / lunarYearDays),
    );
    const lunarPhase =
      (((elapsedDays / lunarDayDays + longitude / 360) % 1) + 1) % 1;
    const solarHourAngle = 2 * Math.PI * lunarPhase;
    const earthDeclination = radians(
      6.7 * Math.sin((2 * Math.PI * elapsedDays) / 27.21222),
    );
    const earthHourAngle = radians(
      longitude + 7.9 * Math.sin((2 * Math.PI * elapsedDays) / 27.55455),
    );
    const sunElevation = elevationDeg(
      latitudeRadians,
      solarDeclination,
      solarHourAngle,
    );
    const earthElevation = elevationDeg(
      latitudeRadians,
      earthDeclination,
      earthHourAngle,
    );

    points.push({
      elapsedHours,
      timestampUtc: timestampUtc(pointMilliseconds),
      sunElevationDeg: round(sunElevation, 2),
      sunAzimuthDeg: round(
        azimuthDeg(latitudeRadians, solarDeclination, solarHourAngle),
        2,
      ),
      earthElevationDeg: round(earthElevation, 2),
      earthAzimuthDeg: round(azimuthDeg(latitudeRadians, earthDeclination, earthHourAngle), 2),
      sunVisible: sunElevation > 0,
      earthGeometricallyVisible: earthElevation > 0,
    });
  }

  const sampledPoints = points.slice(0, -1);
  const sunlightCount = sampledPoints.filter((point) => point.sunVisible).length;
  const earthVisibilityCount = sampledPoints.filter(
    (point) => point.earthGeometricallyVisible,
  ).length;
  const sunlightPercent = round((sunlightCount / sampledPoints.length) * 100);
  const earthVisibilityPercent = round(
    (earthVisibilityCount / sampledPoints.length) * 100,
  );
  const powerProxy = round(
    sampledPoints.reduce(
      (sum, point) =>
        sum +
        Math.max(0, Math.sin(radians(point.sunElevationDeg))) * 100,
      0,
    ) / sampledPoints.length,
  );

  return json({
    classification: "Illustrative simulated values",
    model: "Unvalidated spherical geometry with simplified lunar cycles",
    scientificMeasurement: false,
    assumptions: [
      "No JPL/NASA ephemeris or topographic dataset is queried.",
      "Terrain horizons, atmospheric refraction, libration details, and uncertainty are not modeled.",
      "Solar exposure is not electrical energy production.",
      "Geometric Earth visibility is not a communication link assessment.",
      "Two-hour samples provide a coarse conceptual timeline only.",
    ],
    samplingStepHours: sampleStepHours,
    points,
    current: points[0],
    hoursUntilSunTransition: transitionHours(points, "sunVisible"),
    hoursUntilEarthTransition: transitionHours(points, "earthGeometricallyVisible"),
    sampledSunlightHours: round(sunlightCount * sampleStepHours, 1),
    sampledEarthVisibilityHours: round(earthVisibilityCount * sampleStepHours, 1),
    metrics: {
      sunlight: sunlightPercent,
      power: powerProxy,
      earthVisibility: earthVisibilityPercent,
      communications: earthVisibilityPercent,
    },
  });
}

export const config = { path: "/api/v1/simulate" };

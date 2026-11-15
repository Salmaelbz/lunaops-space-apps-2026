import type { LandingSite, ScoreWeights } from "./types";

// All numbers in this starter dataset are illustrative UI demo values, not measurements.
export const initialWeights: ScoreWeights = {
  sunlight: 35,
  power: 30,
  earthVisibility: 20,
  communications: 15,
};

export const sites: LandingSite[] = [
  {
    id: "south-ridge",
    name: "South Polar Ridge",
    region: "South pole · Demo region A",
    latitude: "−89.4°",
    longitude: "42.1° E",
    latitudeDeg: -89.4,
    longitudeDeg: 42.1,
    sunlight: 88,
    power: 91,
    earthVisibility: 62,
    communications: 73,
    score: 0,
  },
  {
    id: "shackleton",
    name: "Shackleton Rim",
    region: "South pole · Demo region B",
    latitude: "−89.7°",
    longitude: "0.0° E",
    latitudeDeg: -89.7,
    longitudeDeg: 0,
    sunlight: 79,
    power: 84,
    earthVisibility: 78,
    communications: 82,
    score: 0,
  },
  {
    id: "malapert",
    name: "Malapert Massif",
    region: "South pole · Demo region C",
    latitude: "−85.9°",
    longitude: "0.0° E",
    latitudeDeg: -85.9,
    longitudeDeg: 0,
    sunlight: 71,
    power: 76,
    earthVisibility: 91,
    communications: 93,
    score: 0,
  },
];

export function scoreSite(site: LandingSite, weights: ScoreWeights): number {
  const total = Object.values(weights).reduce((sum, weight) => sum + weight, 0) || 1;
  return Math.round(
    (site.sunlight * weights.sunlight +
      site.power * weights.power +
      site.earthVisibility * weights.earthVisibility +
      site.communications * weights.communications) /
      total,
  );
}

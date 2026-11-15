export type ModuleId =
  | "overview"
  | "sites"
  | "sun-earth"
  | "power"
  | "communications"
  | "scenarios"
  | "resilience";

export interface LandingSite {
  id: string;
  name: string;
  region: string;
  latitude: string;
  longitude: string;
  latitudeDeg: number;
  longitudeDeg: number;
  sunlight: number;
  power: number;
  earthVisibility: number;
  communications: number;
  score: number;
}

export interface ScoreWeights {
  sunlight: number;
  power: number;
  earthVisibility: number;
  communications: number;
}

export interface SimulationPoint {
  elapsedHours: number;
  timestampUtc: string;
  sunElevationDeg: number;
  sunAzimuthDeg: number;
  earthElevationDeg: number;
  earthAzimuthDeg: number;
  sunVisible: boolean;
  earthGeometricallyVisible: boolean;
}

export interface SimulationMetrics {
  sunlight: number;
  power: number;
  earthVisibility: number;
  communications: number;
}

export interface SimulationResult {
  classification: string;
  model: string;
  scientificMeasurement: false;
  assumptions: string[];
  samplingStepHours: number;
  points: SimulationPoint[];
  metrics: SimulationMetrics;
  current: SimulationPoint;
  hoursUntilSunTransition: number | null;
  hoursUntilEarthTransition: number | null;
  sampledSunlightHours: number;
  sampledEarthVisibilityHours: number;
}

export interface ScoreResult {
  score: number;
  method: string;
  classification: string;
  scientificMeasurement: false;
  contributions: Record<keyof ScoreWeights, number>;
}

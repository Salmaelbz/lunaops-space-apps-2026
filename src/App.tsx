import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Activity, AlertCircle, CheckCircle2, Command, LoaderCircle, Menu } from "lucide-react";
import Sidebar from "./components/Sidebar";
import MissionControls from "./components/MissionControls";
import { simulateSite } from "./api";
import { initialWeights, sites as initialSites } from "./data";
import Overview from "./modules/Overview";
import Sites from "./modules/Sites";
import Environment from "./modules/Environment";
import Scenarios from "./modules/Scenarios";
import Resilience from "./modules/Resilience";
import type {
  LandingSite,
  ModuleId,
  ScoreWeights,
  SimulationResult,
} from "./types";

const titles: Record<ModuleId, string> = {
  overview: "Mission overview",
  sites: "Landing site explorer",
  "sun-earth": "Sun & Earth simulator",
  power: "Power analyzer",
  communications: "Communication analyzer",
  scenarios: "Scenario comparison",
  resilience: "Resilience simulation",
};

function currentUtcInputValue(): string {
  return new Date().toISOString().slice(0, 16);
}

function displayCoordinate(value: number, positive: string, negative: string): string {
  return `${Math.abs(value).toFixed(2)}° ${value < 0 ? negative : positive}`;
}

function formatActivityTime(timestamp: number): string {
  return `${new Date(timestamp).toLocaleTimeString("en-GB", {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    timeZone: "UTC",
  })}Z`;
}

export default function App() {
  const [active, setActive] = useState<ModuleId>("overview");
  const [menuOpen, setMenuOpen] = useState(false);
  const [showBootSequence, setShowBootSequence] = useState(
    () => !window.matchMedia("(prefers-reduced-motion: reduce)").matches,
  );
  const [weights, setWeights] = useState<ScoreWeights>(initialWeights);
  const [selectedSiteId, setSelectedSiteId] = useState(initialSites[0].id);
  const [datetimeUtc, setDatetimeUtc] = useState(currentUtcInputValue);
  const [customSite, setCustomSite] = useState<LandingSite | null>(null);
  const [activity, setActivity] = useState<
    { id: number; timestamp: number; kind: string; message: string }[]
  >([]);
  const activitySequence = useRef(0);
  const loggedSimulationKey = useRef("");
  const [simulationState, setSimulationState] = useState<{
    key: string;
    simulation: SimulationResult | null;
    error: string | null;
  }>({ key: "", simulation: null, error: null });

  const activeSite = useMemo(() => {
    if (selectedSiteId === "custom" && customSite) return customSite;
    return initialSites.find((site) => site.id === selectedSiteId) ?? initialSites[0];
  }, [customSite, selectedSiteId]);

  const simulationKey = `${activeSite.latitudeDeg}:${activeSite.longitudeDeg}:${datetimeUtc}`;
  const simulationMatchesCurrentInputs = simulationState.key === simulationKey;
  const simulationLoading = !simulationMatchesCurrentInputs;
  const simulation = simulationMatchesCurrentInputs ? simulationState.simulation : null;
  const simulationError = simulationMatchesCurrentInputs ? simulationState.error : null;

  const addActivity = useCallback((kind: string, message: string) => {
    activitySequence.current += 1;
    setActivity((current) => [
      {
        id: activitySequence.current,
        timestamp: Date.now(),
        kind,
        message,
      },
      ...current,
    ].slice(0, 5));
  }, []);

  useEffect(() => {
    if (!showBootSequence) return;
    const timer = window.setTimeout(() => setShowBootSequence(false), 1450);
    return () => window.clearTimeout(timer);
  }, [showBootSequence]);

  useEffect(() => {
    const controller = new AbortController();
    simulateSite(activeSite, datetimeUtc, controller.signal)
      .then((result) => {
        setSimulationState({ key: simulationKey, simulation: result, error: null });
      })
      .catch((error: unknown) => {
        if (error instanceof DOMException && error.name === "AbortError") return;
        setSimulationState({
          key: simulationKey,
          simulation: null,
          error: error instanceof Error ? error.message : "The simulation request failed.",
        });
      });
    return () => controller.abort();
  }, [activeSite, datetimeUtc, simulationKey]);

  useEffect(() => {
    if (simulationLoading || loggedSimulationKey.current === simulationKey) return;
    loggedSimulationKey.current = simulationKey;
    addActivity(
      simulationError ? "API ERROR" : "MODEL RESPONSE",
      simulationError ? "Illustrative model request failed" : "Illustrative geometry response received",
    );
  }, [addActivity, simulationError, simulationKey, simulationLoading]);

  const navigate = (id: ModuleId) => {
    setActive(id);
    addActivity("NAVIGATION", `Opened ${titles[id]}`);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const selectSite = (id: string) => {
    setSelectedSiteId(id);
    const site = id === "custom" ? customSite : initialSites.find((candidate) => candidate.id === id);
    addActivity("INPUT", `Selected ${site?.name ?? "landing site"}`);
  };

  const updateMissionTime = (value: string) => {
    setDatetimeUtc(value);
    addActivity("INPUT", "Updated mission time (UTC)");
  };

  const applyCustomCoordinates = (latitude: number, longitude: number) => {
    const nextCustomSite = {
      id: "custom",
      name: "Custom coordinate preview",
      region: "User-entered coordinates · demo only",
      latitude: displayCoordinate(latitude, "N", "S"),
      longitude: displayCoordinate(longitude, "E", "W"),
      latitudeDeg: latitude,
      longitudeDeg: longitude,
      sunlight: 0,
      power: 0,
      earthVisibility: 0,
      communications: 0,
      score: 0,
    };
    setCustomSite(nextCustomSite);
    setSelectedSiteId("custom");
    addActivity("INPUT", "Applied custom coordinate preview");
  };

  const status = simulationLoading
    ? { label: "MODEL REQUEST PENDING", className: "state-pending", icon: LoaderCircle }
    : simulationError
      ? { label: "SIMULATION API UNAVAILABLE", className: "state-error", icon: AlertCircle }
      : { label: "MODEL RESPONSE RECEIVED", className: "state-response", icon: CheckCircle2 };
  const StatusIcon = status.icon;

  return (
    <div className="app-shell">
      <Sidebar
        active={active}
        onNavigate={navigate}
        open={menuOpen}
        onClose={() => setMenuOpen(false)}
      />
      <div className="main-column">
        <header className="topbar">
          <button className="icon-button menu-button" onClick={() => setMenuOpen(true)} aria-label="Open menu">
            <Menu size={19} />
          </button>
          <div className="breadcrumb">
            <span className="breadcrumb-kicker">SPACE APPS 2026 / INDEPENDENT PROJECT</span>
            <strong>{titles[active]}</strong>
          </div>
          <div className="topbar-actions">
            <span className={`system-state ${status.className}`} role="status" aria-live="polite">
              <StatusIcon size={14} aria-hidden="true" />
              {status.label}
            </span>
            <span className="topbar-context">TIME BASE <b>UTC</b></span>
          </div>
        </header>
        <main className="main-content">
          <MissionControls
            sites={initialSites}
            customSite={customSite}
            selectedSiteId={selectedSiteId}
            datetimeUtc={datetimeUtc}
            onSiteChange={selectSite}
            onDatetimeChange={updateMissionTime}
          />
          {simulationError && (
            <div className="api-error" role="alert">
              <Activity size={16} />
              <span><b>Simulation API unavailable.</b> {simulationError} Start the FastAPI backend as described in README to use date-driven analysis.</span>
            </div>
          )}
          <div className="module-transition" key={active}>
            {active === "overview" && (
              <Overview
                sites={initialSites}
                weights={weights}
                navigate={navigate}
                activeSite={activeSite}
                simulation={simulation}
                simulationLoading={simulationLoading}
                simulationError={simulationError}
                onSelectSite={selectSite}
                activity={activity.map((entry) => ({
                  ...entry,
                  time: formatActivityTime(entry.timestamp),
                }))}
              />
            )}
            {active === "sites" && (
              <Sites
                sites={initialSites}
                weights={weights}
                selectedSiteId={selectedSiteId}
                onSelectSite={selectSite}
                onApplyCustom={applyCustomCoordinates}
              />
            )}
            {(active === "sun-earth" || active === "power" || active === "communications") && (
              <Environment
                module={active}
                site={activeSite}
                simulation={simulation}
                loading={simulationLoading}
                navigate={navigate}
              />
            )}
            {active === "scenarios" && (
              <Scenarios
                sites={initialSites}
                weights={weights}
                setWeights={setWeights}
                datetimeUtc={datetimeUtc}
              />
            )}
            {active === "resilience" && (
              <Resilience sites={initialSites} datetimeUtc={datetimeUtc} />
            )}
          </div>
          <footer className="app-footer">
            <span><Command size={13} /> LUNAOPS CONCEPT INTERFACE <i>·</i> ILLUSTRATIVE MODEL</span>
            <span>Not for flight operations · Not NASA-endorsed</span>
          </footer>
        </main>
      </div>
      {showBootSequence && (
        <div className="mission-boot" role="status" aria-label="LUNAOPS concept interface starting">
          <div className="boot-stars" aria-hidden="true" />
          <div className="boot-orbit" aria-hidden="true">
            <span className="boot-moon" />
            <span className="boot-earth" />
          </div>
          <div className="boot-lockup">
            <span className="boot-overline">LOCAL CONCEPT INTERFACE</span>
            <strong>LUNA<span>OPS</span></strong>
            <small>MISSION ANALYSIS WORKSTATION</small>
            <span className="boot-caveat">CONCEPT GRAPHIC · NOT FLIGHT DATA</span>
          </div>
          <button type="button" className="boot-skip" onClick={() => setShowBootSequence(false)}>
            Skip introduction
          </button>
        </div>
      )}
    </div>
  );
}

import {
  Antenna, BarChart3, Compass, Gauge, LayoutDashboard, Radio,
  ShieldCheck, Sun, Telescope, X,
} from "lucide-react";
import type { ModuleId } from "../types";

const items: { id: ModuleId; label: string; icon: typeof LayoutDashboard; group: string }[] = [
  { id: "overview", label: "Mission overview", icon: LayoutDashboard, group: "MISSION" },
  { id: "sites", label: "Landing sites", icon: Compass, group: "MISSION" },
  { id: "scenarios", label: "Scenario compare", icon: BarChart3, group: "MISSION" },
  { id: "sun-earth", label: "Sun & Earth", icon: Sun, group: "ENVIRONMENT" },
  { id: "power", label: "Power analyzer", icon: Gauge, group: "ENVIRONMENT" },
  { id: "communications", label: "Communications", icon: Antenna, group: "ENVIRONMENT" },
  { id: "resilience", label: "Resilience sim", icon: ShieldCheck, group: "OPERATIONS" },
];

interface Props {
  active: ModuleId;
  onNavigate: (id: ModuleId) => void;
  open: boolean;
  onClose: () => void;
}

export default function Sidebar({ active, onNavigate, open, onClose }: Props) {
  return (
    <>
      {open && <button className="sidebar-backdrop" aria-label="Close navigation" onClick={onClose} />}
      <aside className={`sidebar ${open ? "sidebar-open" : ""}`}>
        <div className="brand">
          <div className="brand-mark"><Telescope size={21} /></div>
          <div><strong>LUNA<span>OPS</span></strong><small>LUNAR SITE PLANNING</small></div>
          <button className="icon-button mobile-close" onClick={onClose} aria-label="Close menu"><X size={19} /></button>
        </div>
        <div className="workspace-switch">LUNAOPS <span className="chevron">LOCAL</span></div>
        <nav aria-label="Mission modules">
          {items.map((item, index) => {
            const showGroup = index === 0 || item.group !== items[index - 1].group;
            const Icon = item.icon;
            return (
              <div key={item.id}>
                {showGroup && <div className="nav-group">{item.group}</div>}
                <button className={`nav-item ${active === item.id ? "nav-active" : ""}`} aria-current={active === item.id ? "page" : undefined} onClick={() => { onNavigate(item.id); onClose(); }}>
                  <Icon size={17} strokeWidth={1.8} /><span>{item.label}</span>
                  {active === item.id && <span className="active-indicator" />}
                </button>
              </div>
            );
          })}
        </nav>
        <div className="sidebar-bottom">
          <div className="connection-state"><span><b>DATA LAYERS</b><small>LOLA-derived map · static file</small></span></div>
          <div className="user-profile"><span><b>Independent prototype</b><small>Not NASA-endorsed</small></span><Radio size={16} className="profile-radio" /></div>
        </div>
      </aside>
    </>
  );
}

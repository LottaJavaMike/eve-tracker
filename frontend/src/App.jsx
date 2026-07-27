import { BrowserRouter, Routes, Route, NavLink } from 'react-router-dom';
import Dashboard from './pages/Dashboard.jsx';
import Projects from './pages/Projects.jsx';
import ProjectDetail from './pages/ProjectDetail.jsx';
import Activities from './pages/Activities.jsx';
import Industry from './pages/Industry.jsx';
import Blueprints from './pages/Blueprints.jsx';
import PlanetaryInteraction from './pages/PlanetaryInteraction.jsx';
import Settings from './pages/Settings.jsx';

const NAV_ITEMS = [
  { to: '/', label: 'Dashboard', end: true },
  { to: '/projects', label: 'Projects' },
  { to: '/activities', label: 'Activity Log' },
  { to: '/industry', label: 'Industry' },
  { to: '/blueprints', label: 'Blueprints' },
  { to: '/planets', label: 'Planetary Interaction' },
  { to: '/settings', label: 'Settings' },
];

function App() {
  return (
    <BrowserRouter>
      <div className="app-shell">
        <nav className="sidebar">
          <h1>EVE Tracker</h1>
          {NAV_ITEMS.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.end}
              className={({ isActive }) => (isActive ? 'active' : '')}
            >
              {item.label}
            </NavLink>
          ))}
        </nav>
        <main className="main-content">
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/projects" element={<Projects />} />
            <Route path="/projects/:id" element={<ProjectDetail />} />
            <Route path="/activities" element={<Activities />} />
            <Route path="/industry" element={<Industry />} />
            <Route path="/blueprints" element={<Blueprints />} />
            <Route path="/planets" element={<PlanetaryInteraction />} />
            <Route path="/settings" element={<Settings />} />
          </Routes>
        </main>
      </div>
    </BrowserRouter>
  );
}

export default App;

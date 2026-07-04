import { BrowserRouter as Router, Routes, Route, Link, useLocation } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { Home, AlertTriangle, Activity, Wind, Sliders, Globe, Shield, User, Settings2 } from 'lucide-react';
import Dashboard from './pages/Dashboard';
import Emergency from './pages/Emergency';
import Healthcare from './pages/Healthcare';
import Environment from './pages/Environment';
import OperationsWorkspace from './pages/AIAssistant'; // Will rename component internally later
import Simulation from './pages/Simulation';
import AnomalyAlerts from './components/AnomalyAlerts';

function Sidebar() {
  const location = useLocation();
  const isActive = (path) => location.pathname === path;

  const navItems = [
    { path: '/', label: 'Operations Workspace', icon: <Globe size={20} /> },
    { path: '/emergency', label: 'Emergency Mgmt', icon: <AlertTriangle size={20} /> },
    { path: '/healthcare', label: 'Healthcare Intel', icon: <Activity size={20} /> },
    { path: '/environment', label: 'Environment Prediction', icon: <Wind size={20} /> },
    { path: '/simulation', label: 'Scenario Simulator', icon: <Sliders size={20} /> },
    { path: '/metrics', label: 'Raw Metrics', icon: <Home size={20} /> },
  ];

  return (
    <div className="w-64 glass-panel m-4 flex flex-col h-[calc(100vh-2rem)] fixed">
      <div className="p-6">
        <h1 className="text-2xl font-bold premium-gradient-text">Civitas AI</h1>
        <p className="text-xs text-primary mt-1 font-semibold uppercase tracking-wider">Smart City OS</p>
      </div>
      <nav className="flex-1 px-4 mt-4">
        <ul className="space-y-2">
          {navItems.map((item) => (
            <li key={item.path}>
              <Link
                to={item.path}
                className={`flex items-center space-x-3 px-4 py-3 rounded-lg transition-all ${
                  isActive(item.path)
                    ? 'bg-primary/20 text-primary border border-primary/30'
                    : 'text-gray-400 hover:text-white hover:bg-white/5'
                }`}
              >
                {item.icon}
                <span className="font-medium">{item.label}</span>
              </Link>
            </li>
          ))}
        </ul>
      </nav>
      <div className="p-6">
        <div className="flex items-center justify-center gap-2 text-xs text-emerald-500 bg-emerald-500/10 py-2 rounded-lg border border-emerald-500/20">
          <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></div>
          Live Data Sync Active
        </div>
        <div className="text-[10px] text-center text-gray-500 mt-4 uppercase tracking-widest">
          Powered by DeepMind Gemini
        </div>
      </div>
    </div>
  );
}

function GlobalTopBar({ role, setRole }) {
  const [alerts, setAlerts] = useState({
    flood: { risk: 84, district: "North District" },
    hospital: { occupancy: 95, name: "City General" }
  });

  useEffect(() => {
    const ws = new WebSocket('ws://127.0.0.1:8000/ws');
    
    ws.onmessage = (event) => {
      const msg = JSON.parse(event.data);
      if (msg.type === 'hospital_overload') {
        setAlerts(prev => ({ ...prev, hospital: { occupancy: msg.data.occupancy, name: msg.data.hospital } }));
      } else if (msg.type === 'risk_updated') {
        setAlerts(prev => ({ ...prev, flood: { risk: msg.data.flood_risk, district: msg.data.district } }));
      }
    };

    return () => ws.close();
  }, []);

  return (
    <div className="h-16 border-b border-white/5 bg-background/50 backdrop-blur-md flex items-center justify-between px-8 sticky top-0 z-50">
      
      {/* Global Alert Center */}
      <div className="flex gap-4">
        <Link to="/emergency" className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-danger/10 border border-danger/30 hover:bg-danger/20 transition-colors">
          <div className="w-2 h-2 rounded-full bg-danger animate-pulse"></div>
          <span className="text-xs font-bold text-danger">{alerts.flood.district} Flood Risk: {alerts.flood.risk}%</span>
        </Link>
        <Link to="/healthcare" className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-warning/10 border border-warning/30 hover:bg-warning/20 transition-colors">
          <div className="w-2 h-2 rounded-full bg-warning animate-pulse"></div>
          <span className="text-xs font-bold text-warning">{alerts.hospital.name} Overload: {alerts.hospital.occupancy}%</span>
        </Link>
      </div>

      {/* Role Aware Interface Toggle */}
      <div className="flex items-center gap-4">
        <div className="flex items-center bg-surface border border-white/10 rounded-lg p-1">
          <button 
            onClick={() => setRole('Citizen')}
            className={`px-3 py-1.5 text-xs font-medium rounded-md flex items-center gap-1.5 transition-colors ${role === 'Citizen' ? 'bg-primary text-white' : 'text-gray-400 hover:text-white'}`}
          >
            <User size={14} /> Citizen Mode
          </button>
          <button 
            onClick={() => setRole('Operations')}
            className={`px-3 py-1.5 text-xs font-medium rounded-md flex items-center gap-1.5 transition-colors ${role === 'Operations' ? 'bg-primary text-white' : 'text-gray-400 hover:text-white'}`}
          >
            <Settings2 size={14} /> Operations
          </button>
          <button 
            onClick={() => setRole('Executive')}
            className={`px-3 py-1.5 text-xs font-medium rounded-md flex items-center gap-1.5 transition-colors ${role === 'Executive' ? 'bg-primary text-white' : 'text-gray-400 hover:text-white'}`}
          >
            <Shield size={14} /> Executive
          </button>
        </div>
      </div>
    </div>
  );
}

function App() {
  const [role, setRole] = useState('Operations'); // Role Context

  return (
    <Router>
      <div className="flex bg-background min-h-screen relative font-sans">
        <AnomalyAlerts />
        <Sidebar />
        <main className="flex-1 ml-[288px] flex flex-col min-h-screen">
          <GlobalTopBar role={role} setRole={setRole} />
          <div className="flex-1">
            <Routes>
              <Route path="/" element={<OperationsWorkspace role={role} />} />
              <Route path="/metrics" element={<Dashboard />} />
              <Route path="/emergency" element={<Emergency />} />
              <Route path="/healthcare" element={<Healthcare />} />
              <Route path="/environment" element={<Environment />} />
              <Route path="/simulation" element={<Simulation />} />
            </Routes>
          </div>
        </main>
      </div>
    </Router>
  );
}

export default App;

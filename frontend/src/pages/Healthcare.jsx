import React, { useState, useEffect } from 'react';
import { Activity, ShieldAlert, HeartPulse, Building2, Stethoscope, Ambulance, Brain, ChevronRight, TrendingUp, AlertCircle, Map, Users, PlusCircle, AlertTriangle, ArrowUpRight, ArrowDownRight, CheckCircle2, Droplets, RefreshCw } from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine, LineChart, Line } from 'recharts';
import { MapContainer, TileLayer, Marker, Popup, CircleMarker } from 'react-leaflet';
import { API_BASE_URL } from '../config';
import L from 'leaflet';

// Fix for default marker icon in react-leaflet
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

const mapCenter = [17.3850, 78.4867]; // Hyderabad

export default function Healthcare() {
  const [showExplanation, setShowExplanation] = useState(false);
  const [loading, setLoading] = useState(true);

  // 1. DYNAMIC STATE
  const [forecastData, setForecastData] = useState([
    { time: 'Today', cityGen: 92, metroHealth: 64, westside: 80 },
    { time: '+1 Day', cityGen: 96, metroHealth: 66, westside: 83 },
    { time: '+2 Days', cityGen: 99, metroHealth: 69, westside: 85 },
    { time: '+3 Days', cityGen: 102, metroHealth: 71, westside: 88 }
  ]);

  const [metrics, setMetrics] = useState({
    systemStatus: { value: 'Critical Risk', color: 'text-danger', sub: 'City General overload imminent', subIcon: AlertTriangle, subColor: 'text-danger' },
    admissions: { value: '1,245', sub: '+12% since yesterday', subIcon: ArrowUpRight, subColor: 'text-danger' },
    beds: { value: '312', sub: '-18 beds in last 6h', subIcon: ArrowDownRight, subColor: 'text-warning' },
    icu: { value: '82%', sub: 'High Utilization', subIcon: AlertTriangle, subColor: 'text-warning' }
  });

  const [resources, setResources] = useState({
    ambulances: 14,
    staff: 490,
    blood: { value: 'Low Supply', color: 'text-danger' }
  });

  const [workflows, setWorkflows] = useState([
    { id: 1, text: 'Staff overtime notification sent.', time: '2 minutes ago', status: 'done' },
    { id: 2, text: 'Metro Health alerted for incoming transfers.', time: '14 minutes ago', status: 'done' },
    { id: 3, text: 'Calculating optimal ambulance routes...', time: 'In progress', status: 'pending' },
  ]);

  const [alertState, setAlertState] = useState('active'); // active, resolved
  const [aiData, setAiData] = useState(null);

  const fetchHealthcareData = async () => {
    setLoading(true);
    try {
      const response = await fetch(`${API_BASE_URL}/healthcare/forecast?hospital=City+General`);
      const data = await response.json();
      setAiData(data);

      // Merge backend forecast with static other hospitals
      const newForecast = data.trend_data.map((td, index) => {
        // Keep some fake data for metroHealth and westside to show comparison
        const baseMetro = 64 + (index * 2);
        const baseWest = 80 + (index * 2);
        return {
          time: td.day,
          cityGen: td.occupancy,
          metroHealth: baseMetro,
          westside: baseWest
        };
      });
      setForecastData(newForecast);

      if (data.predicted_occupancy > 95) {
        setAlertState('active');
        setMetrics(prev => ({
          ...prev,
          systemStatus: { value: 'Critical Risk', color: 'text-danger', sub: 'Overload imminent', subIcon: AlertTriangle, subColor: 'text-danger' }
        }));
      } else if (data.predicted_occupancy > 80) {
        setAlertState('active');
        setMetrics(prev => ({
          ...prev,
          systemStatus: { value: 'Elevated Load', color: 'text-warning', sub: 'High Occupancy', subIcon: Activity, subColor: 'text-warning' }
        }));
      } else {
        setAlertState('resolved');
        setMetrics(prev => ({
          ...prev,
          systemStatus: { value: 'Stable', color: 'text-emerald-500', sub: 'Capacity Nominal', subIcon: CheckCircle2, subColor: 'text-emerald-500' }
        }));
      }

    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchHealthcareData();
  }, []);

  // 2. INTERACTIVE ACTIONS
  const handleExecuteRedirection = () => {
    // Flatten City Gen, raise Metro Health
    setForecastData([
      { time: 'Today', cityGen: forecastData[0].cityGen, metroHealth: 64, westside: 80 },
      { time: '+1 Day', cityGen: 90, metroHealth: 69, westside: 83 },
      { time: '+2 Days', cityGen: 86, metroHealth: 74, westside: 85 },
      { time: '+3 Days', cityGen: 82, metroHealth: 78, westside: 88 }
    ]);
    
    // Add Workflow
    setWorkflows(prev => [
      { id: Date.now(), text: '120 patients successfully redirected to Metro Health.', time: 'Just now', status: 'done' },
      ...prev
    ]);

    // Update Status
    setAlertState('resolved');
    setMetrics(prev => ({
      ...prev,
      systemStatus: { value: 'Load Distributed', color: 'text-emerald-500', sub: 'Patient redistribution active', subIcon: Activity, subColor: 'text-emerald-500' }
    }));
  };

  const handleSimulateHeatwave = () => {
    // Spike admissions and drop beds
    setMetrics(prev => ({
      ...prev,
      admissions: { value: '1,492', sub: '+31% (Heatwave Spike)', subIcon: ArrowUpRight, subColor: 'text-danger' },
      beds: { value: '184', sub: '-146 beds in last 2h', subIcon: ArrowDownRight, subColor: 'text-danger' },
      systemStatus: { value: 'Critical Risk', color: 'text-danger', sub: 'Heatwave Emergency', subIcon: AlertTriangle, subColor: 'text-danger' }
    }));

    // Shift forecast up
    setForecastData(prev => prev.map(d => ({
      ...d,
      cityGen: Math.min(115, d.cityGen + 12),
      metroHealth: Math.min(100, d.metroHealth + 10),
      westside: Math.min(100, d.westside + 8)
    })));

    setWorkflows(prev => [
      { id: Date.now(), text: 'Heatwave protocol activated across all districts.', time: 'Just now', status: 'done' },
      ...prev
    ]);
    
    setAlertState('active');
  };

  const handleSimulateAccident = () => {
    setResources({
      ambulances: 0,
      staff: 490,
      blood: { value: 'CRITICAL SHORTAGE', color: 'text-danger' }
    });
    
    setMetrics(prev => ({
      ...prev,
      icu: { value: '98%', sub: 'Nearing Max Capacity', subIcon: AlertTriangle, subColor: 'text-danger' },
      systemStatus: { value: 'Emergency Level 3', color: 'text-danger', sub: 'Major Accident Response', subIcon: ShieldAlert, subColor: 'text-danger' }
    }));

    setWorkflows(prev => [
      { id: Date.now(), text: 'Emergency blood dispatch requested from State Reserve.', time: 'Just now', status: 'pending' },
      { id: Date.now()+1, text: 'All available ambulances dispatched to incident site.', time: 'Just now', status: 'done' },
      ...prev
    ]);
  };

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex justify-between items-end">
        <div>
          <h1 className="text-3xl font-bold text-white">Healthcare Command Center</h1>
          <p className="text-gray-400 mt-1">Predictive decision support and resource allocation</p>
        </div>
        <button onClick={fetchHealthcareData} className="btn-secondary flex items-center gap-2">
          <RefreshCw size={16} className={loading ? "animate-spin" : ""} />
          Run Forecasting Model
        </button>
      </div>

      {/* Top Status Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* System Status */}
        <div className="glass-card p-5 relative overflow-hidden">
          <div className="absolute top-0 right-0 p-3 opacity-20"><Activity size={40} className={metrics.systemStatus.color} /></div>
          <h3 className="text-gray-400 text-sm font-medium">System Status</h3>
          <p className={`text-2xl font-bold mt-1 ${metrics.systemStatus.color}`}>{metrics.systemStatus.value}</p>
          <div className={`mt-2 text-xs flex items-center gap-1 ${metrics.systemStatus.subColor}`}>
            <metrics.systemStatus.subIcon size={12} /> {metrics.systemStatus.sub}
          </div>
        </div>

        {/* Admissions */}
        <div className="glass-card p-5">
          <h3 className="text-gray-400 text-sm font-medium">Total Admissions (24h)</h3>
          <p className="text-2xl font-bold text-white mt-1">{metrics.admissions.value}</p>
          <div className={`mt-2 text-xs flex items-center gap-1 ${metrics.admissions.subColor}`}>
            <metrics.admissions.subIcon size={12} /> {metrics.admissions.sub}
          </div>
        </div>

        {/* Beds */}
        <div className="glass-card p-5">
          <h3 className="text-gray-400 text-sm font-medium">Available Beds</h3>
          <p className="text-2xl font-bold text-white mt-1">{metrics.beds.value}</p>
          <div className={`mt-2 text-xs flex items-center gap-1 ${metrics.beds.subColor}`}>
            <metrics.beds.subIcon size={12} /> {metrics.beds.sub}
          </div>
        </div>

        {/* ICU */}
        <div className="glass-card p-5">
          <h3 className="text-gray-400 text-sm font-medium">ICU Capacity</h3>
          <p className="text-2xl font-bold text-white mt-1">{metrics.icu.value}</p>
          <div className={`mt-2 text-xs flex items-center gap-1 ${metrics.icu.subColor}`}>
            <metrics.icu.subIcon size={12} /> {metrics.icu.sub}
          </div>
        </div>
      </div>

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left Column: Predictions & Map */}
        <div className="lg:col-span-2 space-y-6">
          
          {/* Predictive Engine */}
          <div className="glass-panel p-6">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-lg font-bold text-white flex items-center gap-2">
                <Brain className="text-primary" size={20} /> Linear Regression Forecast Engine
              </h2>
              <div className="flex gap-4 text-xs">
                <span className="flex items-center gap-1 text-danger"><div className="w-2 h-2 rounded-full bg-danger"></div> City General</span>
                <span className="flex items-center gap-1 text-emerald-500"><div className="w-2 h-2 rounded-full bg-emerald-500"></div> Metro Health</span>
              </div>
            </div>
            
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={forecastData} margin={{ top: 5, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#ffffff10" />
                  <XAxis dataKey="time" stroke="#ffffff50" tick={{fontSize: 12}} />
                  <YAxis stroke="#ffffff50" tick={{fontSize: 12}} domain={[40, 110]} />
                  <Tooltip 
                    contentStyle={{ backgroundColor: '#151C2C', borderColor: '#ffffff20', borderRadius: '8px' }}
                    itemStyle={{ fontSize: '12px' }}
                  />
                  <ReferenceLine y={100} stroke="#EF4444" strokeDasharray="3 3" label={{ position: 'top', value: 'Overload Threshold (100%)', fill: '#EF4444', fontSize: 10 }} />
                  <Line type="monotone" dataKey="cityGen" name="City General" stroke="#EF4444" strokeWidth={3} dot={{r: 4}} activeDot={{r: 6}} />
                  <Line type="monotone" dataKey="metroHealth" name="Metro Health" stroke="#10B981" strokeWidth={3} dot={{r: 4}} />
                  <Line type="monotone" dataKey="westside" name="Westside" stroke="#F59E0B" strokeWidth={3} dot={{r: 4}} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Geospatial Map & Resources */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="glass-panel p-6">
              <h2 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                <Map className="text-primary" size={20} /> Operational Map
              </h2>
              <div className="h-48 w-full bg-surface/50 rounded-xl overflow-hidden border border-white/5">
                <MapContainer center={mapCenter} zoom={12} style={{ height: '100%', width: '100%' }}>
                  <TileLayer url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png" />
                  
                  <CircleMarker center={[17.40, 78.49]} radius={8} pathOptions={{ color: '#EF4444', fillColor: '#EF4444', fillOpacity: 0.8 }}>
                    <Popup>
                      <div className="text-gray-900 font-bold">City General</div>
                      <div className="text-danger font-semibold">Current Occupancy: {forecastData[0].cityGen}%</div>
                    </Popup>
                  </CircleMarker>
                  
                  <CircleMarker center={[17.42, 78.45]} radius={8} pathOptions={{ color: '#10B981', fillColor: '#10B981', fillOpacity: 0.8 }}>
                    <Popup>
                      <div className="text-gray-900 font-bold">Metro Health</div>
                      <div className="text-emerald-600 font-semibold">Current Occupancy: {forecastData[0].metroHealth}%</div>
                    </Popup>
                  </CircleMarker>
                </MapContainer>
              </div>
            </div>

            <div className="glass-panel p-6">
              <h2 className="text-lg font-bold text-white mb-4">Resource Intelligence</h2>
              <div className="space-y-4">
                <div className="flex justify-between items-center pb-2 border-b border-white/5">
                  <div className="flex items-center gap-2 text-gray-300"><Ambulance size={16}/> Available Ambulances</div>
                  <div className={`font-bold ${resources.ambulances === 0 ? 'text-danger' : 'text-white'}`}>{resources.ambulances}</div>
                </div>
                <div className="flex justify-between items-center pb-2 border-b border-white/5">
                  <div className="flex items-center gap-2 text-gray-300"><Stethoscope size={16}/> Medical Staff On Duty</div>
                  <div className="font-bold text-white">{resources.staff}</div>
                </div>
                <div className="flex justify-between items-center">
                  <div className="flex items-center gap-2 text-danger"><Droplets size={16}/> Blood Inventory (O-)</div>
                  <div className={`font-bold ${resources.blood.color}`}>{resources.blood.value}</div>
                </div>
                <div className="flex justify-between items-center pt-2 border-t border-white/5">
                  <div className="flex items-center gap-2 text-primary"><Brain size={16}/> Forecast Confidence</div>
                  <div className="font-bold text-primary">{aiData?.confidence || '--'}%</div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: AI Operations Panel */}
        <div className="space-y-6">
          
          {/* AI Recommendation */}
          {alertState === 'active' && aiData ? (
            <div className="p-5 bg-danger/10 border border-danger/30 rounded-2xl relative overflow-hidden transition-all duration-300">
              <div className="flex items-center gap-2 mb-3">
                <ShieldAlert size={20} className="text-danger" />
                <h3 className="font-bold text-danger text-lg">Action Required</h3>
              </div>
              
              <p className="text-sm text-gray-200 mb-4">
                <span className="font-bold text-white">{aiData.hospital}</span> expected to peak at {aiData.predicted_occupancy}% capacity in the next 3 days.
              </p>
              
              <div className="space-y-2 mb-4">
                <div className="text-xs font-semibold text-gray-400 uppercase tracking-wider">AI Recommendations:</div>
                <ul className="text-sm text-gray-300 space-y-1.5 list-disc list-inside">
                  {aiData.recommended_actions.map((act, i) => <li key={i}>{act}</li>)}
                </ul>
              </div>

              <button 
                onClick={() => setShowExplanation(!showExplanation)}
                className="text-xs flex items-center gap-1 text-primary hover:text-primary/80 transition-colors"
              >
                {showExplanation ? 'Hide Reasoning' : 'View AI Reasoning'} <ChevronRight size={14} className={`transform transition-transform ${showExplanation ? 'rotate-90' : ''}`} />
              </button>
              
              {showExplanation && (
                <div className="mt-3 pt-3 border-t border-danger/20 text-xs text-gray-400 space-y-2 animate-in fade-in slide-in-from-top-2">
                  <p>• Linear regression model predicts steady +1.5% daily growth.</p>
                  <p>• Historical capacity buffer will be exhausted.</p>
                  <p>• Model confidence: {aiData.confidence}%</p>
                </div>
              )}
              
              <div className="mt-4 flex gap-2">
                <button onClick={handleExecuteRedirection} className="flex-1 bg-danger hover:bg-danger/80 text-white text-sm py-2 rounded-xl transition-colors font-medium">
                  Execute Mitigation Plan
                </button>
              </div>
            </div>
          ) : (
            <div className="p-5 bg-emerald-500/10 border border-emerald-500/30 rounded-2xl relative overflow-hidden transition-all duration-300">
              <div className="flex items-center gap-2 mb-2">
                <CheckCircle2 size={20} className="text-emerald-500" />
                <h3 className="font-bold text-emerald-500 text-lg">Capacity Maintained</h3>
              </div>
              <p className="text-sm text-gray-300">
                Hospital networks are within safe operational limits.
              </p>
            </div>
          )}

          {/* Activity Feed (Automation) */}
          <div className="glass-panel p-5">
            <h3 className="font-bold text-white mb-4 text-sm">Automated Workflows</h3>
            <div className="space-y-4 max-h-64 overflow-y-auto pr-2 no-scrollbar">
              {workflows.map((wf) => (
                <div key={wf.id} className="flex gap-3 animate-in slide-in-from-left-2 fade-in">
                  {wf.status === 'done' ? (
                    <CheckCircle2 size={16} className="text-emerald-500 flex-shrink-0 mt-0.5" />
                  ) : (
                    <div className="w-4 h-4 rounded-full border-2 border-primary border-t-transparent animate-spin flex-shrink-0 mt-0.5"></div>
                  )}
                  <div>
                    <p className="text-sm text-gray-200">{wf.text}</p>
                    <p className="text-xs text-gray-500">{wf.time}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Follow-up / Scenarios */}
          <div className="glass-panel p-5">
            <h3 className="font-bold text-white mb-3 text-sm">Scenario Simulation</h3>
            <div className="flex flex-wrap gap-2">
              <button onClick={handleSimulateHeatwave} className="text-xs px-3 py-2 bg-surface hover:bg-primary/20 border border-white/10 hover:border-primary/50 text-gray-300 hover:text-white rounded-lg transition-all active:scale-95">
                Simulate Heatwave (+5°C)
              </button>
              <button onClick={handleSimulateAccident} className="text-xs px-3 py-2 bg-surface hover:bg-primary/20 border border-white/10 hover:border-primary/50 text-gray-300 hover:text-white rounded-lg transition-all active:scale-95">
                Simulate Major Accident
              </button>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}

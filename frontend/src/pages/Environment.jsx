import React, { useState, useEffect } from 'react';
import { Wind, Droplet, Sun, Trash2, Brain, Map, ShieldAlert, CheckCircle2, ChevronRight, AlertTriangle, ArrowUpRight, ArrowDownRight, Factory, RefreshCw } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine } from 'recharts';
import { MapContainer, TileLayer, CircleMarker, Popup } from 'react-leaflet';
import L from 'leaflet';

// Fix for default marker icon in react-leaflet
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

const mapCenter = [17.3850, 78.4867]; // Hyderabad

export default function Environment() {
  const [showExplanation, setShowExplanation] = useState(false);
  const [loading, setLoading] = useState(true);

  const [forecastData, setForecastData] = useState([
    { time: 'Now', industrialZone: 82, cityCenter: 45, northDistrict: 38 },
    { time: '+2h', industrialZone: 110, cityCenter: 48, northDistrict: 40 },
    { time: '+4h', industrialZone: 145, cityCenter: 52, northDistrict: 45 },
    { time: '+6h', industrialZone: 180, cityCenter: 65, northDistrict: 50 },
    { time: '+8h', industrialZone: 160, cityCenter: 60, northDistrict: 48 },
  ]);

  const [metrics, setMetrics] = useState({
    systemStatus: { value: 'Monitoring', color: 'text-primary', sub: 'System Nominal', subIcon: CheckCircle2, subColor: 'text-primary' },
    avgAqi: { value: '60', sub: 'Stable', subIcon: ArrowDownRight, subColor: 'text-emerald-500' },
    temperature: { value: '25°C', sub: 'Stable', subIcon: ArrowDownRight, subColor: 'text-emerald-500' },
    humidity: { value: '60%', sub: 'Stable', subIcon: ArrowDownRight, subColor: 'text-emerald-500' },
    emissions: { value: '150', sub: 'Stable' },
    waste_delay: { value: '2', sub: 'Days' }
  });

  const [workflows, setWorkflows] = useState([
    { id: 1, text: 'Routine emissions scan completed.', time: '1 hour ago', status: 'done' },
    { id: 2, text: 'Checking meteorological dispersion models...', time: 'In progress', status: 'pending' },
  ]);

  const [alertState, setAlertState] = useState('resolved');
  const [anomalyData, setAnomalyData] = useState(null);

  const fetchEnvironmentData = async () => {
    setLoading(true);
    try {
      // 1. Fetch current environment metrics
      const envRes = await fetch('http://localhost:8000/api/environment/current');
      const envData = await envRes.json();
      
      setMetrics({
        systemStatus: { value: 'Analyzing...', color: 'text-warning', sub: 'Running ML Models', subIcon: Brain, subColor: 'text-warning' },
        avgAqi: { value: envData.aqi.toString(), sub: 'Live reading', subIcon: ArrowUpRight, subColor: 'text-primary' },
        temperature: { value: envData.temperature + '°C', sub: 'Live reading', subIcon: Sun, subColor: 'text-primary' },
        humidity: { value: envData.humidity + '%', sub: 'Live reading', subIcon: Droplet, subColor: 'text-primary' },
        emissions: { value: envData.emissions.toString(), sub: 'Units' },
        waste_delay: { value: envData.waste_collection_delay.toString(), sub: 'Days delay' }
      });

      // 2. Predict anomalies using the ML endpoint
      const anomalyRes = await fetch('http://localhost:8000/api/predict/anomaly', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          AQI: envData.aqi,
          temperature: envData.temperature,
          humidity: envData.humidity,
          emissions: envData.emissions,
          waste_collection_delay: envData.waste_collection_delay
        })
      });
      const anomaly = await anomalyRes.json();
      setAnomalyData(anomaly);

      if (anomaly.anomaly_detected || anomaly.severity === 'High') {
        setAlertState('active');
        setMetrics(prev => ({
          ...prev,
          systemStatus: { value: 'Elevated Risk', color: 'text-danger', sub: anomaly.severity + ' Severity Anomaly', subIcon: AlertTriangle, subColor: 'text-danger' }
        }));
        setWorkflows(prev => [
          { id: Date.now(), text: `Anomaly detected. Recommendation: ${anomaly.recommendation}`, time: 'Just now', status: 'pending' },
          ...prev
        ]);
      } else {
        setAlertState('resolved');
        setMetrics(prev => ({
          ...prev,
          systemStatus: { value: 'Stable', color: 'text-emerald-500', sub: 'No anomalies detected', subIcon: CheckCircle2, subColor: 'text-emerald-500' }
        }));
      }

    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEnvironmentData();
  }, []);

  const handleExecuteReduction = () => {
    setForecastData([
      { time: 'Now', industrialZone: 82, cityCenter: 45, northDistrict: 38 },
      { time: '+2h', industrialZone: 95, cityCenter: 48, northDistrict: 40 },
      { time: '+4h', industrialZone: 105, cityCenter: 52, northDistrict: 45 },
      { time: '+6h', industrialZone: 98, cityCenter: 50, northDistrict: 44 },
      { time: '+8h', industrialZone: 85, cityCenter: 48, northDistrict: 40 },
    ]);
    
    setWorkflows(prev => [
      { id: Date.now(), text: 'Directive issued: Executed AI recommended action.', time: 'Just now', status: 'done' },
      ...prev
    ]);

    setAlertState('resolved');
    setMetrics(prev => ({
      ...prev,
      systemStatus: { value: 'Stabilizing', color: 'text-emerald-500', sub: 'Mitigation active', subIcon: CheckCircle2, subColor: 'text-emerald-500' }
    }));
  };

  const handleSimulateInversion = async () => {
    // Force a spike to test the anomaly detector
    setLoading(true);
    try {
      const anomalyRes = await fetch('http://localhost:8000/api/predict/anomaly', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          AQI: 190, // Spiked
          temperature: 38, // Spiked
          humidity: 40,
          emissions: 450, // Spiked
          waste_collection_delay: 2
        })
      });
      const anomaly = await anomalyRes.json();
      setAnomalyData(anomaly);
      
      setMetrics(prev => ({
        ...prev,
        avgAqi: { value: '190', sub: '+130 (Inversion Spike)', subIcon: ArrowUpRight, subColor: 'text-danger' },
        systemStatus: { value: 'Severe Emergency', color: 'text-danger', sub: 'Thermal Inversion Event', subIcon: AlertTriangle, subColor: 'text-danger' }
      }));

      setForecastData(prev => prev.map(d => ({
        ...d,
        industrialZone: Math.min(300, d.industrialZone + 120),
        cityCenter: Math.min(250, d.cityCenter + 80),
        northDistrict: Math.min(200, d.northDistrict + 50)
      })));

      setWorkflows(prev => [
        { id: Date.now(), text: 'Public health advisory broadcast initialized.', time: 'Just now', status: 'pending' },
        ...prev
      ]);
      
      setAlertState('active');
    } catch(e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex justify-between items-end">
        <div>
          <h1 className="text-3xl font-bold text-white">Environmental Intelligence</h1>
          <p className="text-gray-400 mt-1">Air quality forecasting, emissions, and ML anomaly detection</p>
        </div>
        <button onClick={fetchEnvironmentData} className="btn-secondary flex items-center gap-2">
          <RefreshCw size={16} className={loading ? "animate-spin" : ""} />
          Refresh Sensors & ML
        </button>
      </div>

      {/* Top Status Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="glass-card p-5 relative overflow-hidden">
          <div className="absolute top-0 right-0 p-3 opacity-20"><Wind size={40} className={metrics.systemStatus.color} /></div>
          <h3 className="text-gray-400 text-sm font-medium">Network Status</h3>
          <p className={`text-2xl font-bold mt-1 ${metrics.systemStatus.color}`}>{metrics.systemStatus.value}</p>
          <div className={`mt-2 text-xs flex items-center gap-1 ${metrics.systemStatus.subColor}`}>
            <metrics.systemStatus.subIcon size={12} /> {metrics.systemStatus.sub}
          </div>
        </div>

        <div className="glass-card p-5">
          <h3 className="text-gray-400 text-sm font-medium">Avg AQI</h3>
          <p className="text-2xl font-bold text-white mt-1">{metrics.avgAqi.value}</p>
          <div className={`mt-2 text-xs flex items-center gap-1 ${metrics.avgAqi.subColor}`}>
            <metrics.avgAqi.subIcon size={12} /> {metrics.avgAqi.sub}
          </div>
        </div>

        <div className="glass-card p-5">
          <h3 className="text-gray-400 text-sm font-medium">Temperature</h3>
          <p className="text-2xl font-bold text-white mt-1">{metrics.temperature.value}</p>
          <div className={`mt-2 text-xs flex items-center gap-1 ${metrics.temperature.subColor}`}>
            <metrics.temperature.subIcon size={12} /> {metrics.temperature.sub}
          </div>
        </div>

        <div className="glass-card p-5">
          <h3 className="text-gray-400 text-sm font-medium">Humidity</h3>
          <p className="text-2xl font-bold text-white mt-1">{metrics.humidity.value}</p>
          <div className={`mt-2 text-xs flex items-center gap-1 ${metrics.humidity.subColor}`}>
            <metrics.humidity.subIcon size={12} /> {metrics.humidity.sub}
          </div>
        </div>
      </div>

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left Column: Predictions & Map */}
        <div className="lg:col-span-2 space-y-6">
          
          <div className="glass-panel p-6">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-lg font-bold text-white flex items-center gap-2">
                <Brain className="text-primary" size={20} /> AQI Forecasting Engine (8h)
              </h2>
              <div className="flex gap-4 text-xs">
                <span className="flex items-center gap-1 text-danger"><div className="w-2 h-2 rounded-full bg-danger"></div> Industrial Zone</span>
                <span className="flex items-center gap-1 text-primary"><div className="w-2 h-2 rounded-full bg-primary"></div> City Center</span>
              </div>
            </div>
            
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={forecastData} margin={{ top: 5, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#ffffff10" />
                  <XAxis dataKey="time" stroke="#ffffff50" tick={{fontSize: 12}} />
                  <YAxis stroke="#ffffff50" tick={{fontSize: 12}} domain={[0, 200]} />
                  <Tooltip 
                    contentStyle={{ backgroundColor: '#151C2C', borderColor: '#ffffff20', borderRadius: '8px' }}
                    itemStyle={{ fontSize: '12px' }}
                  />
                  <ReferenceLine y={150} stroke="#EF4444" strokeDasharray="3 3" label={{ position: 'top', value: 'Unhealthy (150)', fill: '#EF4444', fontSize: 10 }} />
                  <Line type="monotone" dataKey="industrialZone" name="Industrial Zone" stroke="#EF4444" strokeWidth={3} dot={{r: 4}} activeDot={{r: 6}} />
                  <Line type="monotone" dataKey="cityCenter" name="City Center" stroke="#3B82F6" strokeWidth={3} dot={{r: 4}} />
                  <Line type="monotone" dataKey="northDistrict" name="North District" stroke="#10B981" strokeWidth={3} dot={{r: 4}} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="glass-panel p-6">
              <h2 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                <Map className="text-primary" size={20} /> Emissions Map
              </h2>
              <div className="h-48 w-full bg-surface/50 rounded-xl overflow-hidden border border-white/5">
                <MapContainer center={mapCenter} zoom={12} style={{ height: '100%', width: '100%' }}>
                  <TileLayer url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png" />
                  <CircleMarker center={[17.37, 78.52]} radius={12} pathOptions={{ color: '#EF4444', fillColor: '#EF4444', fillOpacity: 0.5 }}>
                    <Popup><div className="text-gray-900 font-bold">Industrial Zone</div><div className="text-danger font-semibold">Predicted AQI: {forecastData[3].industrialZone}</div></Popup>
                  </CircleMarker>
                  <CircleMarker center={[17.38, 78.48]} radius={8} pathOptions={{ color: '#3B82F6', fillColor: '#3B82F6', fillOpacity: 0.5 }}>
                    <Popup><div className="text-gray-900 font-bold">City Center</div><div className="text-primary font-semibold">Predicted AQI: {forecastData[3].cityCenter}</div></Popup>
                  </CircleMarker>
                </MapContainer>
              </div>
            </div>

            <div className="glass-panel p-6">
              <h2 className="text-lg font-bold text-white mb-4">ML Insights</h2>
              <div className="space-y-4">
                <div className="flex justify-between items-center pb-2 border-b border-white/5">
                  <div className="flex items-center gap-2 text-gray-300"><Factory size={16}/> Industrial Output</div>
                  <div className="font-bold text-white">{metrics.emissions.value}</div>
                </div>
                <div className="flex justify-between items-center pb-2 border-b border-white/5">
                  <div className="flex items-center gap-2 text-gray-300"><Wind size={16}/> Waste Delay</div>
                  <div className="font-bold text-white">{metrics.waste_delay.value} days</div>
                </div>
                <div className="flex justify-between items-center">
                  <div className="flex items-center gap-2 text-gray-300"><Brain size={16}/> ML Confidence</div>
                  <div className="font-bold text-primary">{anomalyData?.confidence || '--'}%</div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: AI Operations Panel */}
        <div className="space-y-6">
          
          {alertState === 'active' && anomalyData ? (
            <div className="p-5 bg-warning/10 border border-warning/30 rounded-2xl relative overflow-hidden transition-all duration-300">
              <div className="flex items-center gap-2 mb-3">
                <AlertTriangle size={20} className="text-warning" />
                <h3 className="font-bold text-warning text-lg">ML Anomaly Detected</h3>
              </div>
              
              <p className="text-sm text-gray-200 mb-4">
                <span className="font-bold text-white">Isolation Forest Model</span> has detected a {anomalyData.severity.toLowerCase()} severity anomaly pattern in current sensor feeds.
              </p>
              
              <div className="space-y-2 mb-4">
                <div className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Recommended Actions:</div>
                <ul className="text-sm text-gray-300 space-y-1.5 list-disc list-inside">
                  <li>{anomalyData.recommendation}</li>
                  <li>Review historical precedents.</li>
                </ul>
              </div>

              <button 
                onClick={() => setShowExplanation(!showExplanation)}
                className="text-xs flex items-center gap-1 text-primary hover:text-primary/80 transition-colors"
              >
                {showExplanation ? 'Hide Reasoning' : 'View AI Reasoning'} <ChevronRight size={14} className={`transform transition-transform ${showExplanation ? 'rotate-90' : ''}`} />
              </button>
              
              {showExplanation && (
                <div className="mt-3 pt-3 border-t border-warning/20 text-xs text-gray-400 space-y-2 animate-in fade-in slide-in-from-top-2">
                  <p>• Combination of AQI ({metrics.avgAqi.value}) and Emissions ({metrics.emissions.value}) triggers anomaly.</p>
                  <p>• Confidence score: {anomalyData.confidence}%</p>
                  <p>• <strong>Cascading Effect:</strong> Without intervention, respiratory admissions at Metro Health will increase by 9% tonight.</p>
                </div>
              )}
              
              <div className="mt-4 flex gap-2">
                <button onClick={handleExecuteReduction} className="flex-1 bg-warning hover:bg-warning/80 text-black text-sm py-2 rounded-xl transition-colors font-bold">
                  Execute Recommendation
                </button>
              </div>
            </div>
          ) : (
             <div className="p-5 bg-emerald-500/10 border border-emerald-500/30 rounded-2xl relative overflow-hidden transition-all duration-300">
              <div className="flex items-center gap-2 mb-2">
                <CheckCircle2 size={20} className="text-emerald-500" />
                <h3 className="font-bold text-emerald-500 text-lg">System Nominal</h3>
              </div>
              <p className="text-sm text-gray-300">
                ML Anomaly detector shows no critical anomalies in current environmental telemetry.
              </p>
            </div>
          )}

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

          <div className="glass-panel p-5">
            <h3 className="font-bold text-white mb-3 text-sm">Scenario Simulation</h3>
            <div className="flex flex-wrap gap-2">
              <button onClick={handleSimulateInversion} className="text-xs px-3 py-2 bg-surface hover:bg-primary/20 border border-white/10 hover:border-primary/50 text-gray-300 hover:text-white rounded-lg transition-all active:scale-95">
                Simulate Thermal Inversion (ML Anomaly)
              </button>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}

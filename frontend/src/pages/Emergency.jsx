import React, { useState, useEffect } from 'react';
import { ShieldAlert, RefreshCw } from 'lucide-react';
import { MapContainer, TileLayer, Marker, Popup, Circle } from 'react-leaflet';
import L from 'leaflet';

// Fix for default marker icon in react-leaflet
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

export default function Emergency() {
  const center = [17.3850, 78.4867]; // Hyderabad, India
  const [floodRisk, setFloodRisk] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchFloodRisk = async () => {
    setLoading(true);
    try {
      const response = await fetch('http://localhost:8000/api/predict/flood', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          rainfall: 120.5,
          river_level: 8.4,
          humidity: 85.0,
          drainage_complaints: 25,
          district: 1
        })
      });
      const data = await response.json();
      setFloodRisk(data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFloodRisk();
  }, []);
  
  return (
    <div className="p-8 max-w-7xl mx-auto">
      <div className="mb-8 flex justify-between items-end">
        <div>
          <h1 className="text-3xl font-bold text-white">Emergency Intelligence</h1>
          <p className="text-gray-400 mt-1">Disaster prediction and resource allocation</p>
        </div>
        <button onClick={fetchFloodRisk} className="btn-secondary flex items-center gap-2">
          <RefreshCw size={16} className={loading ? "animate-spin" : ""} />
          Run ML Predictor
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <div className="glass-panel p-6 relative z-0">
            <h2 className="text-xl font-bold text-white mb-6">Live Hazard Map</h2>
            <div className="h-[400px] w-full bg-surface/50 rounded-xl border border-white/5 overflow-hidden">
              <MapContainer center={center} zoom={12} style={{ height: '100%', width: '100%' }}>
                <TileLayer
                  attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                  url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                />
                {floodRisk?.risk_score > 50 && (
                  <Circle center={[17.3850, 78.4867]} radius={2500} pathOptions={{ color: 'red', fillColor: 'red', fillOpacity: 0.4 }}>
                    <Popup>Flood Risk Zone - North District (Score: {floodRisk.risk_score})</Popup>
                  </Circle>
                )}
                <Marker position={[17.4200, 78.4700]}>
                  <Popup>Heatwave Warning - Downtown</Popup>
                </Marker>
              </MapContainer>
            </div>
          </div>
        </div>

        <div className="space-y-6">
          <div className="glass-panel p-6">
            <h2 className="text-xl font-bold text-white mb-4">Active Threats</h2>
            
            <div className="space-y-4">
              {loading ? (
                <div className="p-4 text-center text-gray-400">Running ML Model...</div>
              ) : floodRisk ? (
                <div className={`p-4 border rounded-xl relative overflow-hidden ${floodRisk.risk_level === 'Critical' ? 'bg-danger/10 border-danger/30' : floodRisk.risk_level === 'High' ? 'bg-warning/10 border-warning/30' : 'bg-primary/10 border-primary/30'}`}>
                  <div className="absolute top-0 right-0 p-2 opacity-10">
                    <ShieldAlert size={48} className={floodRisk.risk_level === 'Critical' ? 'text-danger' : 'text-primary'} />
                  </div>
                  <h3 className={`font-bold text-lg ${floodRisk.risk_level === 'Critical' ? 'text-danger' : floodRisk.risk_level === 'High' ? 'text-warning' : 'text-primary'}`}>
                    Flood Risk - North Dist.
                  </h3>
                  <div className="mt-2 text-sm text-gray-300 space-y-1">
                    <p>Risk Score: <span className="font-bold text-white">{floodRisk.risk_score}/100</span></p>
                    <p>Level: <span className="font-bold text-white">{floodRisk.risk_level}</span></p>
                    <p>Confidence: <span className="text-white">{floodRisk.confidence}%</span></p>
                  </div>
                  <div className="mt-4 pt-4 border-t border-white/10">
                    <p className="text-xs text-gray-400 mb-2">ML Reasoning:</p>
                    <ul className="text-xs text-gray-300 list-disc list-inside">
                      {floodRisk.reasoning?.map((r, i) => <li key={i}>{r}</li>)}
                    </ul>
                  </div>
                  <div className="mt-4 pt-4 border-t border-white/10">
                    <p className="text-xs text-gray-400 mb-2">Recommended Actions:</p>
                    <ul className="text-xs text-gray-300 list-disc list-inside">
                      {floodRisk.recommended_actions?.map((a, i) => <li key={i}>{a}</li>)}
                    </ul>
                  </div>
                </div>
              ) : null}

              <div className="p-4 bg-warning/10 border border-warning/30 rounded-xl">
                <h3 className="font-bold text-warning text-lg">Heatwave Warning</h3>
                <div className="mt-2 text-sm text-gray-300 space-y-1">
                  <p>Severity: <span className="font-bold text-white">High</span></p>
                  <p>Affected Area: <span className="text-white">Downtown</span></p>
                </div>
                <div className="mt-4 pt-4 border-t border-warning/20">
                  <p className="text-xs text-gray-400 mb-2">AI Recommendations:</p>
                  <ul className="text-xs text-gray-300 list-disc list-inside">
                    <li>Open cooling centers</li>
                    <li>Issue public alerts</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

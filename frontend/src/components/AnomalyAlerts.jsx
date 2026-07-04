import React, { useState, useEffect } from 'react';
import { ShieldAlert, X } from 'lucide-react';
import { WS_BASE_URL } from '../config';

export default function AnomalyAlerts() {
  const [alerts, setAlerts] = useState([]);

  useEffect(() => {
    // Connect to WebSocket
    const ws = new WebSocket(WS_BASE_URL);
    
    ws.onmessage = (event) => {
      const msg = JSON.parse(event.data);
      
      let alertData = null;

      if (msg.type === 'aqi_spike') {
        alertData = {
          message: `Hazardous AQI (${msg.data.aqi}) detected in ${msg.data.district}.`,
          action: "Issue pollution advisory and restrict heavy industry."
        };
      } else if (msg.type === 'hospital_overload') {
        alertData = {
          message: `${msg.data.hospital} occupancy reached ${msg.data.occupancy}%.`,
          action: "Redirect incoming non-critical patients to alternative facilities."
        };
      } else if (msg.type === 'risk_updated' && msg.data.flood_risk > 80) {
        alertData = {
          message: `Critical Flood Risk (${msg.data.flood_risk}%) in ${msg.data.district}.`,
          action: "Deploy water pumps and prepare evacuation shelters."
        };
      }

      if (alertData) {
        const newAlert = {
          id: Date.now() + Math.random(),
          time: new Date(msg.timestamp).toLocaleTimeString(),
          message: alertData.message,
          action: alertData.action
        };
        setAlerts(prev => [newAlert, ...prev].slice(0, 5)); // Keep last 5
      }
    };

    return () => ws.close();
  }, []);

  if (alerts.length === 0) return null;

  return (
    <div className="fixed top-6 right-6 w-80 z-50 space-y-4">
      {alerts.map(alert => (
        <div key={alert.id} className="glass-panel border-danger/50 bg-danger/10 p-4 shadow-2xl relative overflow-hidden animate-in slide-in-from-right">
          <div className="absolute top-0 right-0 p-2 opacity-10">
            <ShieldAlert size={48} className="text-danger" />
          </div>
          <div className="flex justify-between items-start">
            <div className="flex items-center space-x-2 text-danger">
              <ShieldAlert size={16} />
              <span className="font-bold text-sm">ANOMALY DETECTED</span>
            </div>
            <button onClick={() => setAlerts(alerts.filter(a => a.id !== alert.id))} className="text-gray-400 hover:text-white">
              <X size={14} />
            </button>
          </div>
          <div className="mt-2">
            <p className="text-white font-medium">{alert.message}</p>
            <p className="text-xs text-gray-300 mt-1">{alert.time}</p>
          </div>
          <div className="mt-3 pt-3 border-t border-danger/20">
            <p className="text-xs text-gray-400">Suggested Action:</p>
            <p className="text-sm text-gray-200 mt-1">{alert.action}</p>
          </div>
        </div>
      ))}
    </div>
  );
}

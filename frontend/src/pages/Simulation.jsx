import React, { useState } from 'react';
import axios from 'axios';
import { Settings, Play, ShieldAlert, CheckCircle } from 'lucide-react';
import { API_BASE_URL } from '../config';

export default function Simulation() {
  const [params, setParams] = useState({
    rainfall: 50,
    humidity: 60,
    river_level: 5,
    drainage_reports: 10
  });
  
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleSimulate = async () => {
    setLoading(true);
    try {
      const response = await axios.post(`${API_BASE_URL}/simulate`, params);
      setResult(response.data.simulation_results);
    } catch (err) {
      console.error(err);
    }
    setLoading(false);
  };

  return (
    <div className="p-8 max-w-7xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-white">Scenario Simulator</h1>
        <p className="text-gray-400 mt-1">Adjust environmental parameters to predict flood risks and see automated actions.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="glass-panel p-6">
          <div className="flex items-center space-x-2 mb-6">
            <Settings className="text-primary" />
            <h2 className="text-xl font-bold text-white">Simulation Parameters</h2>
          </div>
          
          <div className="space-y-6">
            <div>
              <label className="flex justify-between text-sm text-gray-300 mb-2">
                <span>Rainfall (mm)</span>
                <span className="font-bold text-primary">{params.rainfall} mm</span>
              </label>
              <input type="range" min="0" max="200" value={params.rainfall} onChange={e => setParams({...params, rainfall: Number(e.target.value)})} className="w-full accent-primary" />
            </div>
            
            <div>
              <label className="flex justify-between text-sm text-gray-300 mb-2">
                <span>Humidity (%)</span>
                <span className="font-bold text-primary">{params.humidity}%</span>
              </label>
              <input type="range" min="0" max="100" value={params.humidity} onChange={e => setParams({...params, humidity: Number(e.target.value)})} className="w-full accent-primary" />
            </div>
            
            <div>
              <label className="flex justify-between text-sm text-gray-300 mb-2">
                <span>River Level (m)</span>
                <span className="font-bold text-primary">{params.river_level} m</span>
              </label>
              <input type="range" min="0" max="15" step="0.1" value={params.river_level} onChange={e => setParams({...params, river_level: Number(e.target.value)})} className="w-full accent-primary" />
            </div>

            <div>
              <label className="flex justify-between text-sm text-gray-300 mb-2">
                <span>Drainage Complaints</span>
                <span className="font-bold text-primary">{params.drainage_reports}</span>
              </label>
              <input type="range" min="0" max="100" value={params.drainage_reports} onChange={e => setParams({...params, drainage_reports: Number(e.target.value)})} className="w-full accent-primary" />
            </div>
          </div>
          
          <button 
            onClick={handleSimulate}
            disabled={loading}
            className="w-full mt-8 bg-primary hover:bg-primary/80 text-white font-bold py-3 px-4 rounded-xl transition-all flex items-center justify-center space-x-2"
          >
            {loading ? <span className="animate-pulse">Calculating...</span> : <><Play size={18} /> <span>Run Simulation</span></>}
          </button>
        </div>

        <div className="glass-panel p-6">
          <h2 className="text-xl font-bold text-white mb-6">Simulation Results</h2>
          
          {result ? (
            <div className="space-y-6 animate-in fade-in zoom-in duration-300">
              <div className="flex items-center justify-between p-4 rounded-xl bg-surface border border-white/5">
                <span className="text-gray-400">Predicted Flood Risk</span>
                <span className={`text-3xl font-bold ${result.flood_risk > 0.7 ? 'text-danger' : result.flood_risk > 0.4 ? 'text-warning' : 'text-secondary'}`}>
                  {(result.flood_risk * 100).toFixed(1)}%
                </span>
              </div>
              
              <div>
                <h3 className="text-sm text-gray-400 mb-2">AI Reasoning</h3>
                <p className="text-white text-sm bg-surface/50 p-4 rounded-xl leading-relaxed">
                  {result.reasoning}
                </p>
              </div>

              <div>
                <h3 className="text-sm text-gray-400 mb-2">Automated Workflow Triggers</h3>
                {result.automated_actions.length > 0 ? (
                  <ul className="space-y-2">
                    {result.automated_actions.map((action, idx) => (
                      <li key={idx} className="flex items-start space-x-2 text-sm text-gray-200 bg-danger/10 border border-danger/20 p-3 rounded-lg">
                        <ShieldAlert size={16} className="text-danger shrink-0 mt-0.5" />
                        <span>{action}</span>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <div className="flex items-center space-x-2 text-sm text-secondary bg-secondary/10 border border-secondary/20 p-3 rounded-lg">
                    <CheckCircle size={16} />
                    <span>No emergency actions triggered.</span>
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="h-64 flex items-center justify-center text-gray-500 border-2 border-dashed border-white/10 rounded-xl">
              Run a simulation to see XAI predictions.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

import React, { useState, useEffect } from 'react';
import { Activity, AlertTriangle, Users, Wind, MapPin } from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { WS_BASE_URL } from '../config';
const mockChartData = [
  { name: '00:00', risk: 40 },
  { name: '04:00', risk: 30 },
  { name: '08:00', risk: 45 },
  { name: '12:00', risk: 60 },
  { name: '16:00', risk: 85 },
  { name: '20:00', risk: 50 },
  { name: '24:00', risk: 35 },
];

function StatCard({ title, value, icon, trend, danger }) {
  return (
    <div className="glass-card p-6">
      <div className="flex items-center justify-between mb-4">
        <div className={`p-3 rounded-xl ${danger ? 'bg-danger/20 text-danger' : 'bg-primary/20 text-primary'}`}>
          {icon}
        </div>
        {trend && (
          <span className={`text-sm font-medium ${danger ? 'text-danger' : 'text-secondary'}`}>
            {trend}
          </span>
        )}
      </div>
      <h3 className="text-gray-400 text-sm font-medium">{title}</h3>
      <p className="text-2xl font-bold text-white mt-1">{value}</p>
    </div>
  );
}

export default function Dashboard() {
  const [liveData, setLiveData] = useState({
    active_emergencies: 3,
    hospital_occupancy: 84.0,
    current_aqi: 72,
    recent_complaints: 1245
  });

  useEffect(() => {
    const ws = new WebSocket(WS_BASE_URL);
    ws.onmessage = (event) => {
      const data = JSON.parse(event.data);
      if (data.type === 'LIVE_UPDATE' && data.data) {
        setLiveData(prev => ({
          ...prev,
          hospital_occupancy: data.data.hospital_occupancy,
          current_aqi: data.data.current_aqi,
          active_emergencies: data.data.active_emergencies,
          recent_complaints: prev.recent_complaints + data.data.recent_complaints
        }));
      }
    };
    return () => ws.close();
  }, []);

  return (
    <div className="p-8 max-w-7xl mx-auto">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold text-white">City Intelligence Overview</h1>
          <p className="text-gray-400 mt-1">Real-time metrics and AI predictions</p>
        </div>
        <div className="flex space-x-3 text-sm">
          <div className="px-4 py-2 glass-panel rounded-lg flex items-center space-x-2">
            <span className="w-2 h-2 rounded-full bg-secondary animate-pulse"></span>
            <span>Live Data Sync</span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <StatCard 
          title="Active Emergencies" 
          value={liveData.active_emergencies} 
          icon={<AlertTriangle size={24} />} 
          trend="Live Update"
          danger={liveData.active_emergencies > 2}
        />
        <StatCard 
          title="Hospital Occupancy" 
          value={`${liveData.hospital_occupancy}%`} 
          icon={<Activity size={24} />} 
          trend="Live Update"
        />
        <StatCard 
          title="Avg. Air Quality" 
          value={`${liveData.current_aqi} AQI`} 
          icon={<Wind size={24} />} 
          trend="Live Update"
        />
        <StatCard 
          title="Citizen Reports" 
          value={liveData.recent_complaints} 
          icon={<Users size={24} />} 
          trend="Live Update"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
        <div className="lg:col-span-2 glass-panel p-6">
          <h2 className="text-xl font-bold text-white mb-6">24h City Risk Forecast</h2>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={mockChartData}>
                <defs>
                  <linearGradient id="colorRisk" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#EF4444" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#EF4444" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#ffffff10" />
                <XAxis dataKey="name" stroke="#ffffff50" />
                <YAxis stroke="#ffffff50" />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#151C2C', borderColor: '#ffffff20', borderRadius: '8px' }}
                />
                <Area type="monotone" dataKey="risk" stroke="#EF4444" fillOpacity={1} fill="url(#colorRisk)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="glass-panel p-6">
          <h2 className="text-xl font-bold text-white mb-6">AI Priority Actions</h2>
          <div className="space-y-4">
            <div className="p-4 rounded-xl border border-danger/30 bg-danger/10">
              <div className="flex items-start space-x-3">
                <AlertTriangle className="text-danger shrink-0 mt-1" size={20} />
                <div>
                  <h4 className="font-semibold text-white">Flood Risk: North District</h4>
                  <p className="text-sm text-gray-400 mt-1">84% probability of flooding in 6 hours.</p>
                  <button className="mt-3 text-xs bg-danger/20 text-danger px-3 py-1.5 rounded-lg hover:bg-danger/30 transition-colors">
                    Deploy Pumps & Warn
                  </button>
                </div>
              </div>
            </div>
            
            <div className="p-4 rounded-xl border border-warning/30 bg-warning/10">
              <div className="flex items-start space-x-3">
                <Activity className="text-warning shrink-0 mt-1" size={20} />
                <div>
                  <h4 className="font-semibold text-white">City General Hospital Overload</h4>
                  <p className="text-sm text-gray-400 mt-1">Expected to exceed 95% capacity.</p>
                  <button className="mt-3 text-xs bg-warning/20 text-warning px-3 py-1.5 rounded-lg hover:bg-warning/30 transition-colors">
                    Redirect Patients
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { Send, Bot, User, Plus, MessageSquare, Brain, MapPin, Activity, AlertTriangle, ChevronRight, FileText, LayoutDashboard, History, ShieldAlert, CheckCircle2, Clock, Zap, ArrowDown } from 'lucide-react';

const SituationCard = ({ situation }) => (
  <div className="bg-surface border border-white/10 p-4 rounded-xl shadow-lg mb-4">
    <div className="flex items-center gap-2 mb-3 pb-2 border-b border-white/10">
      <AlertTriangle className={situation.severity === 'Critical' ? 'text-danger' : 'text-warning'} size={18} />
      <h4 className="font-bold text-white">Situation Summary</h4>
    </div>
    <p className="text-sm text-gray-300 mb-4">{situation.summary}</p>
    <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-xs">
      <div className="bg-black/20 p-2 rounded-lg border border-white/5">
        <div className="text-gray-500 mb-1">Severity</div>
        <div className={`font-bold ${situation.severity === 'Critical' ? 'text-danger' : 'text-warning'}`}>{situation.severity}</div>
      </div>
      <div className="bg-black/20 p-2 rounded-lg border border-white/5">
        <div className="text-gray-500 mb-1">Risk Score</div>
        <div className="font-bold text-danger">{situation.risk_score}%</div>
      </div>
      <div className="bg-black/20 p-2 rounded-lg border border-white/5">
        <div className="text-gray-500 mb-1">Confidence</div>
        <div className="font-bold text-emerald-500">{situation.confidence}%</div>
      </div>
      <div className="bg-black/20 p-2 rounded-lg border border-white/5">
        <div className="text-gray-500 mb-1">Affected</div>
        <div className="font-bold text-white">{situation.affected?.toLocaleString() || 0}</div>
      </div>
    </div>
  </div>
);

const RecommendationsPanel = ({ recommendations }) => (
  <div className="bg-surface border border-white/10 p-4 rounded-xl shadow-lg mb-4">
    <div className="flex items-center gap-2 mb-3 pb-2 border-b border-white/10">
      <Zap className="text-warning" size={18} />
      <h4 className="font-bold text-white">Recommended Actions</h4>
    </div>
    <div className="space-y-2">
      {recommendations.map((rec, i) => (
        <div key={i} className="flex items-start gap-3 bg-black/20 p-3 rounded-lg border border-white/5">
          <div className="flex-shrink-0 w-6 h-6 rounded bg-primary/20 text-primary flex items-center justify-center text-xs font-bold">
            {rec.priority || i+1}
          </div>
          <p className="text-sm text-gray-200 mt-0.5">{rec.action}</p>
        </div>
      ))}
    </div>
  </div>
);

const CascadingEffects = ({ effects }) => (
  <div className="bg-surface border border-white/10 p-4 rounded-xl shadow-lg mb-4">
    <div className="flex items-center gap-2 mb-3 pb-2 border-b border-white/10">
      <Activity className="text-primary" size={18} />
      <h4 className="font-bold text-white">Cascading Effects</h4>
    </div>
    <div className="flex flex-col gap-1 items-center">
      {effects.map((effect, i) => (
        <React.Fragment key={i}>
          <div className="w-full bg-black/20 border border-primary/20 p-3 rounded-lg text-sm text-gray-200 text-center font-medium shadow-md transition-all hover:bg-primary/10 hover:border-primary/50 cursor-pointer">
            {effect}
          </div>
          {i < effects.length - 1 && <ArrowDown className="text-primary/50 my-1" size={16} />}
        </React.Fragment>
      ))}
    </div>
  </div>
);

const TimelineCard = ({ timeline }) => (
  <div className="bg-surface border border-white/10 p-4 rounded-xl shadow-lg mb-4">
    <div className="flex items-center gap-2 mb-4 pb-2 border-b border-white/10">
      <Clock className="text-blue-400" size={18} />
      <h4 className="font-bold text-white">Incident Timeline</h4>
    </div>
    <div className="space-y-4 relative before:absolute before:inset-0 before:ml-2 before:-translate-x-px md:before:mx-auto md:before:translate-x-0 before:h-full before:w-0.5 before:bg-gradient-to-b before:from-transparent before:via-white/10 before:to-transparent">
      {timeline.map((item, i) => {
        let dotColor = 'bg-gray-500';
        if (item.status === 'green') dotColor = 'bg-emerald-500';
        if (item.status === 'yellow') dotColor = 'bg-warning';
        if (item.status === 'red') dotColor = 'bg-danger';

        return (
          <div key={i} className="relative flex items-center justify-between md:justify-normal md:odd:flex-row-reverse group is-active">
            <div className={`flex items-center justify-center w-4 h-4 rounded-full border-2 border-surface ${dotColor} shadow shrink-0 md:order-1 md:group-odd:-translate-x-1/2 md:group-even:translate-x-1/2 z-10`}></div>
            <div className="w-[calc(100%-2rem)] md:w-[calc(50%-1.5rem)] bg-black/20 p-3 rounded-xl border border-white/5 shadow-md">
              <div className="flex items-center justify-between mb-1">
                <span className="font-bold text-gray-300 text-xs">{item.time}</span>
              </div>
              <p className="text-sm text-gray-400">{item.event}</p>
            </div>
          </div>
        );
      })}
    </div>
  </div>
);

const QuickActions = ({ actions, onAction }) => (
  <div className="flex flex-wrap gap-2 mt-4">
    {actions.map((action, i) => (
      <button
        key={i}
        onClick={() => onAction(action)}
        className="flex items-center gap-1.5 text-xs px-4 py-2 bg-primary hover:bg-primary/80 text-white rounded-lg transition-all font-semibold shadow-lg shadow-primary/20"
      >
        <Zap size={14} /> {action}
      </button>
    ))}
  </div>
);

const ReasoningCard = ({ reasoning }) => (
  <div className="bg-surface border border-white/10 p-4 rounded-xl shadow-lg mb-4">
    <div className="flex items-center gap-2 mb-3 pb-2 border-b border-white/10">
      <Brain className="text-purple-400" size={18} />
      <h4 className="font-bold text-white">AI Reasoning</h4>
    </div>
    <ul className="list-disc list-inside space-y-1 text-sm text-gray-300">
      {reasoning.map((r, i) => (
        <li key={i}>{r}</li>
      ))}
    </ul>
  </div>
);

const SourcesCard = ({ sources }) => (
  <div className="bg-surface border border-white/10 p-4 rounded-xl shadow-lg mb-4 mt-4">
    <div className="flex items-center gap-2 mb-2 pb-2 border-b border-white/10">
      <FileText className="text-gray-400" size={14} />
      <h4 className="font-bold text-gray-300 text-sm">Sources Used</h4>
    </div>
    <div className="flex flex-wrap gap-2 mt-2">
      {sources.map((source, i) => (
        <div key={i} className="text-xs px-2 py-1 bg-black/40 border border-white/10 rounded text-gray-400 font-mono">
          {source}
        </div>
      ))}
    </div>
  </div>
);

export default function OperationsWorkspace({ role }) {
  const [sessions, setSessions] = useState([]);
  const [activeSessionId, setActiveSessionId] = useState(null);
  const [messages, setMessages] = useState([]);
  const [activeContext, setActiveContext] = useState(null);
  
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isTyping]);

  useEffect(() => {
    fetchSessions();
  }, []);

  const fetchSessions = async () => {
    try {
      const res = await axios.get('http://127.0.0.1:8000/api/sessions');
      setSessions(res.data);
      if (res.data.length > 0 && !activeSessionId) {
        loadSession(res.data[0].id);
      } else if (res.data.length === 0) {
        createNewSession();
      }
    } catch (e) {
      console.error(e);
    }
  };

  const createNewSession = async () => {
    try {
      const res = await axios.post('http://127.0.0.1:8000/api/sessions', { title: 'New Operation' });
      await fetchSessions();
      loadSession(res.data.id);
    } catch (e) {
      console.error(e);
    }
  };

  const loadSession = async (id) => {
    setActiveSessionId(id);
    try {
      const res = await axios.get(`http://127.0.0.1:8000/api/sessions/${id}`);
      setMessages(res.data.messages || []);
      setActiveContext({ ...res.data.context, session: res.data.session } || {});
    } catch (e) {
      console.error(e);
    }
  };

  const handleSend = async (overrideText = null) => {
    const textToSend = overrideText || input;
    if (!textToSend.trim() || !activeSessionId) return;
    
    const newUserMsg = { id: Date.now(), role: 'user', text: textToSend };
    setMessages(prev => [...prev, newUserMsg]);
    if (!overrideText) setInput('');
    setIsTyping(true);

    try {
      const response = await axios.post(`http://127.0.0.1:8000/api/chat/${activeSessionId}`, { message: textToSend, role: role || 'Operations' });
      const apiResponse = {
        id: Date.now() + 1,
        role: 'ai',
        text: response.data.response,
      };
      setMessages(prev => [...prev, apiResponse]);
      if (response.data.context) {
        setActiveContext(prev => ({...prev, ...response.data.context}));
      }
      fetchSessions(); // Refresh last active
    } catch (error) {
      console.error(error);
      const errorResponse = {
        id: Date.now() + 1,
        role: 'ai',
        text: 'Sorry, I encountered an error connecting to the intelligence backend.'
      };
      setMessages(prev => [...prev, errorResponse]);
    } finally {
      setIsTyping(false);
    }
  };

  const handleExecutiveBriefing = async () => {
    if (!activeSessionId) return;
    const reqMsg = { id: Date.now(), role: 'user', text: "Generate Executive Briefing" };
    setMessages(prev => [...prev, reqMsg]);
    setIsTyping(true);
    try {
      const response = await axios.get(`http://127.0.0.1:8000/api/executive-briefing`);
      const apiResponse = {
        id: Date.now() + 1,
        role: 'ai',
        text: response.data.briefing
      };
      setMessages(prev => [...prev, apiResponse]);
    } catch (e) {
      console.error(e);
    } finally {
      setIsTyping(false);
    }
  };

  const parseJsonData = (text) => {
    try {
      return JSON.parse(text);
    } catch {
      return null;
    }
  };

  return (
    <div className="p-6 h-[calc(100vh-4rem)] flex gap-6 max-w-[1500px] mx-auto">
      {/* Left Panel: Operations Memory */}
      <div className="w-80 flex flex-col gap-4">
        <button 
          onClick={createNewSession}
          className="flex items-center justify-center gap-2 bg-primary hover:bg-primary/90 text-white p-3 rounded-xl transition-colors font-medium shadow-lg shadow-primary/20"
        >
          <Plus size={20} />
          Initialize Operation
        </button>
        
        <div className="flex-1 overflow-y-auto pr-2 space-y-6 no-scrollbar mt-2">
          <div>
            <div className="flex items-center gap-2 text-xs font-bold text-gray-400 uppercase tracking-wider mb-3">
              <Activity size={14} /> Active Operations
            </div>
            <div className="space-y-2">
              {sessions.filter(s => s.status === 'ACTIVE' || s.status === 'ESCALATED').map(s => (
                <button
                  key={s.id}
                  onClick={() => loadSession(s.id)}
                  className={`w-full flex flex-col gap-2 p-3 rounded-xl transition-colors text-left ${activeSessionId === s.id ? 'bg-primary/20 border border-primary/30 text-white shadow-lg' : 'glass-panel text-gray-400 hover:text-gray-200'}`}
                >
                  <div className="flex items-center justify-between w-full">
                    <span className="truncate text-sm font-bold w-4/5">{s.title}</span>
                    <div className={`w-2 h-2 rounded-full ${s.status === 'ESCALATED' ? 'bg-danger animate-pulse' : 'bg-primary'}`}></div>
                  </div>
                  <div className="flex items-center justify-between w-full text-xs opacity-70">
                    <span>{s.status}</span>
                    <span>{s.active_resources} Teams</span>
                  </div>
                </button>
              ))}
              {sessions.filter(s => s.status === 'ACTIVE' || s.status === 'ESCALATED').length === 0 && (
                <p className="text-xs text-gray-500">No active operations.</p>
              )}
            </div>
          </div>

          <div>
            <div className="flex items-center gap-2 text-xs font-bold text-gray-400 uppercase tracking-wider mb-3">
              <History size={14} /> Archived / Resolved
            </div>
            <div className="space-y-2">
              {sessions.filter(s => s.status !== 'ACTIVE' && s.status !== 'ESCALATED').map(s => (
                <button
                  key={s.id}
                  onClick={() => loadSession(s.id)}
                  className={`w-full flex items-center gap-3 p-3 rounded-xl transition-colors text-left ${activeSessionId === s.id ? 'bg-white/10 border border-white/30 text-white' : 'glass-panel text-gray-500 hover:text-gray-300'}`}
                >
                  <CheckCircle2 size={16} className="opacity-50" />
                  <span className="truncate text-sm">{s.title}</span>
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Center Panel: Command Center */}
      <div className="glass-panel flex-1 flex flex-col overflow-hidden relative border border-white/10 shadow-2xl">
        {/* Header / Context Banner */}
        <div className="p-4 border-b border-white/10 bg-surface/80 backdrop-blur-md flex flex-col gap-4 z-10">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-primary/20 flex items-center justify-center">
                <Brain className="text-primary" size={24} />
              </div>
              <div>
                <h2 className="text-xl font-bold text-white leading-tight">Civitas Mission Control</h2>
                <p className="text-xs text-gray-400">Decision Intelligence Engine (RAG Active)</p>
              </div>
            </div>
            
            <div className="flex items-center gap-3">
              {role === 'Executive' && (
                <button onClick={handleExecutiveBriefing} className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-surface hover:bg-white/10 border border-white/10 text-white text-sm font-medium transition-colors">
                  <FileText size={16} className="text-blue-400" /> Generate Briefing
                </button>
              )}
              <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-medium">
                <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                Live Sync
              </div>
            </div>
          </div>
          
          {/* Operational Context Bar */}
          <div className="grid grid-cols-2 md:grid-cols-5 gap-2 text-xs">
            <div className="flex flex-col gap-1 text-gray-300 bg-black/20 p-2 rounded-lg border border-white/5">
              <span className="text-gray-500 uppercase tracking-wider text-[10px] font-bold">District</span>
              <span className="font-semibold text-white truncate">{activeContext?.district || 'None'}</span>
            </div>
            <div className="flex flex-col gap-1 text-gray-300 bg-black/20 p-2 rounded-lg border border-white/5">
              <span className="text-gray-500 uppercase tracking-wider text-[10px] font-bold">Emergency</span>
              <span className="font-semibold text-white truncate">{activeContext?.emergency || 'None'}</span>
            </div>
            <div className="flex flex-col gap-1 text-gray-300 bg-black/20 p-2 rounded-lg border border-white/5">
              <span className="text-gray-500 uppercase tracking-wider text-[10px] font-bold">Focus</span>
              <span className="font-semibold text-white truncate">{activeContext?.focus || 'None'}</span>
            </div>
            <div className="flex flex-col gap-1 text-gray-300 bg-black/20 p-2 rounded-lg border border-white/5">
              <span className="text-gray-500 uppercase tracking-wider text-[10px] font-bold">Priority</span>
              <span className={`font-semibold truncate ${activeContext?.priority === 'High' || activeContext?.priority === 'Critical' ? 'text-danger' : 'text-emerald-500'}`}>
                {activeContext?.priority || 'None'}
              </span>
            </div>
            <div className="flex flex-col gap-1 text-gray-300 bg-black/20 p-2 rounded-lg border border-white/5">
              <span className="text-gray-500 uppercase tracking-wider text-[10px] font-bold">Status</span>
              <span className="font-semibold text-white truncate">{activeContext?.session?.status || 'None'}</span>
            </div>
          </div>
        </div>

        {/* Intelligence Feed */}
        <div className="flex-1 overflow-y-auto p-6 space-y-8 no-scrollbar bg-black/10">
          {messages.length === 0 && (
            <div className="h-full flex items-center justify-center text-gray-500">
              <div className="text-center max-w-sm">
                <Brain size={48} className="mx-auto mb-4 opacity-20" />
                <h3 className="text-white font-medium text-lg mb-2">Systems Ready</h3>
                <p className="text-sm">Enter a command or query to initialize intelligence feed.</p>
              </div>
            </div>
          )}
          
          {messages.map((msg) => {
            const data = msg.role === 'ai' ? parseJsonData(msg.text) : null;
            
            if (msg.role === 'user') {
              return (
                <div key={msg.id} className="flex justify-end">
                  <div className="flex max-w-[80%] flex-row-reverse">
                    <div className="flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center bg-primary/20 text-primary ml-4 shadow-lg shadow-primary/20">
                      <User size={20} />
                    </div>
                    <div className="bg-primary text-white p-4 rounded-2xl rounded-tr-none shadow-lg shadow-primary/10">
                      <div className="text-sm leading-relaxed whitespace-pre-wrap font-medium">
                        {msg.text}
                      </div>
                    </div>
                  </div>
                </div>
              );
            }

            // If it's AI and parsed as JSON
            if (data) {
              return (
                <div key={msg.id} className="flex justify-start">
                  <div className="flex max-w-[90%] w-full">
                    <div className="flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center bg-surface border border-white/10 text-white mr-4 shadow-lg">
                      <Brain size={20} className="text-primary" />
                    </div>
                    <div className="w-full">
                      {/* Render Structured Cards */}
                      {data.situation && <SituationCard situation={data.situation} />}
                      
                      {data.reasoning && data.reasoning.length > 0 && <ReasoningCard reasoning={data.reasoning} />}

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                         {data.recommendations && data.recommendations.length > 0 && <RecommendationsPanel recommendations={data.recommendations} />}
                         {data.cascading_effects && data.cascading_effects.length > 0 && <CascadingEffects effects={data.cascading_effects} />}
                      </div>

                      {data.timeline && data.timeline.length > 0 && <TimelineCard timeline={data.timeline} />}

                      {data.quick_actions && data.quick_actions.length > 0 && (
                        <QuickActions actions={data.quick_actions} onAction={handleSend} />
                      )}

                      {data.sources && data.sources.length > 0 && <SourcesCard sources={data.sources} />}
                    </div>
                  </div>
                </div>
              );
            }

            // Fallback for raw text (e.g. Executive Briefing or error)
            return (
              <div key={msg.id} className="flex justify-start">
                <div className="flex max-w-[90%] w-full">
                  <div className="flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center bg-surface border border-white/10 text-white mr-4 shadow-lg">
                    <Bot size={20} />
                  </div>
                  <div className="bg-surface border border-white/10 p-5 rounded-2xl rounded-tl-none text-gray-200 shadow-lg w-full">
                    <div className="text-sm leading-relaxed whitespace-pre-wrap font-medium">
                      {msg.text}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
          
          {isTyping && (
            <div className="flex justify-start">
              <div className="flex bg-surface border border-white/10 p-5 rounded-2xl rounded-tl-none items-center space-x-2 ml-14 shadow-lg">
                <div className="w-2 h-2 bg-primary/50 rounded-full animate-bounce"></div>
                <div className="w-2 h-2 bg-primary/50 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                <div className="w-2 h-2 bg-primary/50 rounded-full animate-bounce" style={{ animationDelay: '0.4s' }}></div>
                <span className="text-xs text-gray-500 ml-2 font-medium">Processing telemetry...</span>
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Command Input */}
        <div className="p-4 border-t border-white/10 bg-surface/80 backdrop-blur-md">
          <div className="flex items-center space-x-4">
            <input 
              type="text" 
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleSend()}
              placeholder="Execute command or query intelligence..." 
              className="flex-1 bg-black/30 border border-white/10 hover:border-white/20 rounded-xl px-5 py-4 text-white placeholder-gray-500 font-mono text-sm focus:outline-none focus:border-primary transition-colors shadow-inner"
            />
            <button 
              onClick={() => handleSend()}
              disabled={!input.trim()}
              className="bg-primary hover:bg-primary/80 disabled:opacity-50 disabled:cursor-not-allowed text-white px-6 py-4 rounded-xl transition-colors shadow-lg shadow-primary/20 flex items-center gap-2 font-bold"
            >
              EXECUTE <Send size={16} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

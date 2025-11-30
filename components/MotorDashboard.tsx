import React, { useState, useEffect, useRef } from 'react';
import { 
  Activity, Zap, Gauge, Thermometer, AlertTriangle, 
  CheckCircle, Bot, IndianRupee, Info, Waves, RotateCcw, Loader2, Cpu, AlertOctagon, Bell, Settings2,
  Play, Pause, Square, Box
} from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine } from 'recharts';
import { MotorConfig, SensorData } from '../types';
import { getNextSampleData } from '../constants';
import { StatCard } from './StatCard';
import { analyzeMotorHealth } from '../services/geminiService';
import { Motor3DViewer } from './Motor3DViewer';

interface MotorDashboardProps {
  config: MotorConfig;
  isDarkMode: boolean;
  tariffRate: number; // Dynamic Tariff
}

export const MotorDashboard: React.FC<MotorDashboardProps> = ({ config, isDarkMode, tariffRate }) => {
  const [dataHistory, setDataHistory] = useState<SensorData[]>([]);
  const [currentData, setCurrentData] = useState<SensorData | null>(null);
  const [aiAnalysis, setAiAnalysis] = useState<{ text: string; loading: boolean } | null>(null);
  const [billing, setBilling] = useState<number>(0);
  
  // Use Ref for simulation index to avoid StrictMode side-effect issues with state updaters
  const indexRef = useRef(0);
  
  // Simulation Controls
  const [isPlaying, setIsPlaying] = useState(true);
  
  const aiSectionRef = useRef<HTMLDivElement>(null);

  // --- SOPHISTICATED VIBRATION THRESHOLDS ---
  const VIB_UPPER_LIMIT = 1.60;
  const VIB_LOWER_LIMIT = 1.00;
  const VIB_SPIKE_LIMIT = 0.40;
  const VIB_STABILITY_THRESHOLD = 0.30;
  
  // --- INDUCTION MOTOR CONSTANTS (DEDUCED) ---
  const FREQUENCY = 50; // Hz
  const POLES = 4;
  const SYNC_SPEED = 1500; // 120 * 50 / 4

  // Simulation Loop
  useEffect(() => {
    let timeoutId: ReturnType<typeof setTimeout>;

    const simulateStep = () => {
      // If paused, do not schedule next step
      if (!isPlaying) return;

      const delay = Math.floor(Math.random() * 2000) + 1000;

      timeoutId = setTimeout(() => {
        const nextIndex = indexRef.current + 1;
        indexRef.current = nextIndex;
        
        const newData = getNextSampleData(nextIndex, config.type);
        
        // Batch Updates
        setCurrentData(newData);
        
        const PF = 0.85; 
        let powerKW = 0;

        if (config.type === 'THREE_PHASE') {
            powerKW = (Math.sqrt(3) * newData.voltage * newData.current * PF) / 1000;
        } else {
            powerKW = (newData.voltage * newData.current * PF) / 1000;
        }
        
        const durationInHours = delay / 1000 / 3600;
        const costForInterval = powerKW * tariffRate * durationInHours;
        
        setBilling(b => b + costForInterval);

        setDataHistory(prev => {
          const newHistory = [...prev, newData];
          if (newHistory.length > 30) newHistory.shift(); 
          return newHistory;
        });

        simulateStep();
      }, delay);
    };

    if (isPlaying) {
      simulateStep();
    }

    return () => clearTimeout(timeoutId);
  }, [config, tariffRate, isPlaying]);

  const handleAIDiagnosis = async () => {
    if (!currentData) return;
    
    setAiAnalysis({ text: '', loading: true });
    
    setTimeout(() => {
        aiSectionRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }, 100);

    // Pass data history for predictive analysis
    const result = await analyzeMotorHealth(currentData, dataHistory, config);
    setAiAnalysis({ text: result, loading: false });
  };

  const handleResetSimulation = () => {
    setIsPlaying(false);
    setBilling(0);
    setDataHistory([]);
    setCurrentData(null);
    indexRef.current = 0;
    setAiAnalysis(null);
  };

  const handleStartStop = () => {
    setIsPlaying(!isPlaying);
  };

  // Render Loading State if no data yet
  if (!currentData && isPlaying && dataHistory.length === 0) return (
    <div className="flex flex-col items-center justify-center h-64 text-slate-500 dark:text-slate-400 bg-white dark:bg-slate-900 rounded-xl shadow-sm border border-slate-200 dark:border-slate-800 transition-colors">
      <Loader2 className="animate-spin text-blue-600 mb-3" size={32} />
      <p className="font-medium">Initializing Connection to {config.name}...</p>
    </div>
  );

  // If stopped and reset, show empty state
  if (!currentData && !isPlaying) return (
    <div className="flex flex-col items-center justify-center h-64 text-slate-500 dark:text-slate-400 bg-white dark:bg-slate-900 rounded-xl shadow-sm border border-slate-200 dark:border-slate-800 transition-colors">
      <div className="bg-slate-100 dark:bg-slate-800 p-4 rounded-full mb-4">
        <Square className="text-slate-400" size={32} fill="currentColor" />
      </div>
      <p className="font-medium mb-4">Simulation Stopped</p>
      <button 
        onClick={() => setIsPlaying(true)}
        className="flex items-center gap-2 px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors"
      >
        <Play size={18} fill="currentColor" /> Start Simulation
      </button>
    </div>
  );

  // --- ENHANCED ANOMALY DETECTION LOGIC ---
  if (!currentData) return null; // Safety fallback to prevent crash if logic falls through
  const safeData = currentData;
  const previousData = dataHistory[dataHistory.length - 2];
  
  // Vibration Checks
  const vibDelta = previousData ? Math.abs(safeData.vib - previousData.vib) : 0;
  const isVibSpike = vibDelta > VIB_SPIKE_LIMIT;
  const isVibHigh = safeData.vib > VIB_UPPER_LIMIT;
  const isVibLow = safeData.vib < VIB_LOWER_LIMIT;
  
  const recentReadings = dataHistory.slice(-5);
  const avgVib = recentReadings.length > 0 
    ? recentReadings.reduce((sum, item) => sum + item.vib, 0) / recentReadings.length 
    : safeData.vib;
  const deviation = Math.abs(safeData.vib - avgVib);
  const isUnstable = deviation > VIB_STABILITY_THRESHOLD;
  const isVibrationIssue = isVibHigh || isVibLow || isVibSpike || isUnstable;

  // Granular Critical/Warning Checks
  const isCriticalFlag = safeData.output === 1;
  const isStallCondition = isCriticalFlag && safeData.speed < 1000 && safeData.current > config.maxCurrent;
  const isOverheatCritical = isCriticalFlag && safeData.temp > 50;
  
  // "Normal but requires attention" Checks
  const isHighLoadAttention = !isCriticalFlag && safeData.current > (config.maxCurrent * 0.85);
  const isWarmAttention = !isCriticalFlag && safeData.temp > 40 && safeData.temp <= 50;

  // Status State Determination
  let statusState: 'CRITICAL' | 'WARNING' | 'ATTENTION' | 'NORMAL' = 'NORMAL';
  if (isCriticalFlag) statusState = 'CRITICAL';
  else if (isVibrationIssue) statusState = 'WARNING';
  else if (isHighLoadAttention || isWarmAttention) statusState = 'ATTENTION';
  else statusState = 'NORMAL';

  // UI Visuals Config
  let bannerStyles = "";
  let iconBg = "";
  let IconComponent = CheckCircle;
  let iconColor = "";
  let title = "";
  let description = "";
  let titleColor = "";
  let descColor = "";

  switch (statusState) {
    case 'CRITICAL':
      bannerStyles = "bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800/50";
      iconBg = "bg-red-100 dark:bg-red-900/50";
      IconComponent = AlertOctagon;
      iconColor = "text-red-600 dark:text-red-400";
      titleColor = "text-red-900 dark:text-red-200";
      descColor = "text-red-700 dark:text-red-300";
      
      if (isStallCondition) {
        title = "CRITICAL: MOTOR STALL DETECTED";
        description = `Zero speed with dangerous current spike (${safeData.current}A). Immediate shutdown advised.`;
      } else if (isOverheatCritical) {
        title = "CRITICAL: OVERHEATING";
        description = `Core temperature (${safeData.temp.toFixed(1)}°C) exceeds safety threshold. Insulation failure risk.`;
      } else {
        title = "SYSTEM FAULT TRIGGERED";
        description = "General fault flag received from controller. Check sensors and connections.";
      }
      break;

    case 'WARNING':
      bannerStyles = "bg-amber-50 dark:bg-amber-900/20 border-amber-200 dark:border-amber-800/50";
      iconBg = "bg-amber-100 dark:bg-amber-900/50";
      IconComponent = Waves;
      iconColor = "text-amber-600 dark:text-amber-400";
      title = "VIBRATION ANOMALY";
      titleColor = "text-amber-900 dark:text-amber-200";
      descColor = "text-amber-800 dark:text-amber-300";
      
      if (isVibSpike) description = "Transient mechanical shock detected (Delta > 0.4 mm/s).";
      else if (isUnstable) description = "Rotational instability detected (Deviation > 0.3).";
      else if (isVibHigh) description = "Vibration amplitude exceeds upper threshold.";
      else if (isVibLow) description = "Vibration amplitude below lower threshold (Possible Coupling Loss).";
      break;

    case 'ATTENTION':
      bannerStyles = "bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800/50";
      iconBg = "bg-blue-100 dark:bg-blue-900/50";
      IconComponent = Info;
      iconColor = "text-blue-600 dark:text-blue-400";
      title = "ATTENTION REQUIRED";
      titleColor = "text-blue-900 dark:text-blue-200";
      descColor = "text-blue-800 dark:text-blue-300";
      
      if (isHighLoadAttention && isWarmAttention) {
        description = "High load combined with rising temperatures. Monitor cooling efficiency.";
      } else if (isHighLoadAttention) {
        description = `Motor running near maximum capacity (${safeData.current}A). Efficiency may drop.`;
      } else {
        description = `Elevated operating temperature (${safeData.temp.toFixed(1)}°C). Ensure ventilation is clear.`;
      }
      break;

    case 'NORMAL':
    default:
      bannerStyles = "bg-emerald-50 dark:bg-emerald-900/20 border-emerald-200 dark:border-emerald-800/50";
      iconBg = "bg-emerald-100 dark:bg-emerald-900/50";
      IconComponent = CheckCircle;
      iconColor = "text-emerald-600 dark:text-emerald-400";
      title = "SYSTEM OPERATIONAL";
      description = "All parameters are within nominal safety limits.";
      titleColor = "text-emerald-900 dark:text-emerald-200";
      descColor = "text-emerald-700 dark:text-emerald-300";
      break;
  }

  const instantaneousPowerKW = config.type === 'THREE_PHASE' 
      ? (Math.sqrt(3) * safeData.voltage * safeData.current * 0.85) / 1000
      : (safeData.voltage * safeData.current * 0.85) / 1000;
      
  const slip = ((SYNC_SPEED - safeData.speed) / SYNC_SPEED) * 100;

  return (
    <div className="space-y-6 animate-fade-in">
      
      {/* Simulation Controls Toolbar */}
      <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-3 flex items-center justify-between shadow-sm">
        <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider px-2">Simulation Control</span>
            <div className="h-6 w-px bg-slate-200 dark:bg-slate-700 mx-1"></div>
            <button 
                onClick={handleStartStop}
                className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-medium transition-all
                  ${isPlaying 
                    ? 'bg-amber-100 text-amber-700 hover:bg-amber-200 dark:bg-amber-900/30 dark:text-amber-400' 
                    : 'bg-emerald-100 text-emerald-700 hover:bg-emerald-200 dark:bg-emerald-900/30 dark:text-emerald-400'}
                `}
            >
                {isPlaying ? <Pause size={14} fill="currentColor" /> : <Play size={14} fill="currentColor" />}
                {isPlaying ? "Pause Data" : "Resume Data"}
            </button>
            <button 
                onClick={handleResetSimulation}
                className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-medium text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            >
                <Square size={14} fill="currentColor" /> Reset
            </button>
        </div>
        <div className="flex items-center gap-2 text-xs font-mono text-slate-500">
           <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></span>
           Live Feed Active
        </div>
      </div>

      {/* Top Status Banner */}
      <div className={`p-6 rounded-xl border flex flex-col md:flex-row items-center justify-between shadow-sm transition-colors duration-500 ${bannerStyles}`}>
        <div className="flex items-center gap-4 mb-4 md:mb-0 w-full md:w-auto">
          <div className={`p-3 rounded-full flex-shrink-0 ${iconBg}`}>
            <IconComponent className={`${iconColor} h-8 w-8`} />
          </div>
          <div>
            <h3 className={`text-lg font-bold ${titleColor} uppercase tracking-wide`}>
              {title}
            </h3>
            <p className={`text-sm ${descColor}`}>
              {description}
            </p>
          </div>
        </div>
        
        {(statusState !== 'NORMAL') && (
           <button 
             onClick={handleAIDiagnosis}
             disabled={aiAnalysis?.loading}
             className={`w-full md:w-auto px-6 py-2.5 rounded-lg font-medium shadow-sm transition-colors flex items-center justify-center gap-2 text-white flex-shrink-0
               ${statusState === 'CRITICAL' 
                 ? 'bg-red-600 hover:bg-red-700 dark:bg-red-600 dark:hover:bg-red-500' 
                 : statusState === 'WARNING'
                    ? 'bg-amber-600 hover:bg-amber-700 dark:bg-amber-600 dark:hover:bg-amber-500'
                    : 'bg-blue-600 hover:bg-blue-700 dark:bg-blue-600 dark:hover:bg-blue-500'
               }
               disabled:opacity-70 disabled:cursor-not-allowed
             `}
           >
             {aiAnalysis?.loading ? <Loader2 className="animate-spin" size={18} /> : <Cpu size={18} />} 
             {aiAnalysis?.loading ? "Predicting..." : "Run AI Prediction"}
           </button>
        )}
      </div>

      {/* Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard 
          label="Speed" 
          value={safeData.speed} 
          unit="RPM" 
          icon={Gauge} 
          colorClass="text-blue-600 dark:text-blue-400"
          helpText={config.type === 'THREE_PHASE' ? "Rotational Speed" : "RPM"}
        />
        <StatCard 
          label="Load Current" 
          value={safeData.current} 
          unit="Amps" 
          icon={Zap} 
          colorClass={
            safeData.current > config.maxCurrent 
              ? "text-red-500 dark:text-red-400" 
              : isHighLoadAttention 
                ? "text-blue-500 dark:text-blue-400"
                : "text-amber-500 dark:text-amber-400"
          } 
          helpText="Current Draw"
        />
        <StatCard 
          label="Temperature" 
          value={safeData.temp.toFixed(1)} 
          unit="°C" 
          icon={Thermometer} 
          colorClass={
            safeData.temp > 50 
              ? "text-red-500 dark:text-red-400" 
              : isWarmAttention 
                ? "text-blue-500 dark:text-blue-400"
                : "text-slate-600 dark:text-slate-300"
          }
          helpText="Stator Temp"
        />
        <StatCard 
          label="Vibration" 
          value={safeData.vib.toFixed(2)} 
          unit="mm/s" 
          icon={Activity} 
          colorClass={
            isVibrationIssue 
              ? "text-amber-600 dark:text-amber-400" 
              : "text-purple-500 dark:text-purple-400"
          }
          helpText={isUnstable ? "Unstable" : "Mechanical"}
        />
      </div>

      {/* Main Grid: Charts (Left), Billing & Log (Right) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left Column (2 Span) */}
        <div className="lg:col-span-2 space-y-6">
          
          {/* Charts */}
          <div className="bg-white dark:bg-slate-900 p-6 rounded-xl shadow-sm border border-slate-200 dark:border-slate-800 transition-colors">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-bold text-slate-800 dark:text-white flex items-center gap-2">
                <Activity size={20} className="text-blue-500" /> Vibration Analysis
              </h3>
              <div className="flex gap-4 text-xs font-medium">
                <span className="flex items-center gap-1.5 text-slate-600 dark:text-slate-400">
                  <span className="w-2.5 h-2.5 rounded-full bg-blue-500"></span> Speed
                </span>
                <span className="flex items-center gap-1.5 text-slate-600 dark:text-slate-400">
                  <span className="w-2.5 h-2.5 rounded-full bg-purple-500"></span> Vibration
                </span>
              </div>
            </div>
            
            <div className="h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={dataHistory}>
                  <CartesianGrid strokeDasharray="3 3" stroke={isDarkMode ? "#1e293b" : "#f1f5f9"} vertical={false} />
                  <XAxis dataKey="timestamp" tick={false} />
                  <YAxis yAxisId="left" domain={[0, 2000]} hide />
                  <YAxis yAxisId="right" orientation="right" domain={[0, 3]} hide />
                  
                  <ReferenceLine y={VIB_UPPER_LIMIT} yAxisId="right" stroke="#ef4444" strokeDasharray="3 3" label={{ position: 'right', value: 'Max', fontSize: 10, fill: '#ef4444' }} />
                  
                  <Tooltip 
                    contentStyle={{ 
                      borderRadius: '8px', 
                      border: isDarkMode ? '1px solid #334155' : 'none', 
                      backgroundColor: isDarkMode ? '#1e293b' : '#fff', 
                      color: isDarkMode ? '#f8fafc' : '#1e293b',
                      boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' 
                    }}
                    labelFormatter={() => 'Real-time Reading'}
                  />
                  <Line yAxisId="left" type="monotone" dataKey="speed" stroke="#3b82f6" strokeWidth={2} dot={false} isAnimationActive={false} strokeOpacity={0.3} />
                  <Line yAxisId="right" type="monotone" dataKey="vib" stroke="#8b5cf6" strokeWidth={3} dot={{ r: 4, fill: '#8b5cf6', strokeWidth: 0 }} isAnimationActive={false} />
                </LineChart>
              </ResponsiveContainer>
            </div>
            <p className="text-xs text-slate-400 dark:text-slate-500 mt-2 text-center">Thresholds: Spike &gt; {VIB_SPIKE_LIMIT}mm/s | Stability Dev &gt; {VIB_STABILITY_THRESHOLD}</p>
          </div>

          {/* AI Helper Panel */}
          <div ref={aiSectionRef} className="bg-slate-900 dark:bg-slate-950 rounded-xl p-6 text-white shadow-lg border border-slate-800 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500 opacity-10 rounded-full -translate-y-1/2 translate-x-1/2 blur-2xl"></div>
            
            <div className="flex items-center justify-between mb-4 relative z-10">
              <h3 className="text-lg font-bold flex items-center gap-2">
                <Cpu className="text-indigo-400" /> AI Diagnostic Analysis
              </h3>
              {(statusState === 'NORMAL' && !aiAnalysis) && (
                <button 
                  onClick={handleAIDiagnosis}
                  disabled={aiAnalysis?.loading}
                  className="text-xs bg-slate-800 hover:bg-slate-700 border border-slate-700 px-3 py-1.5 rounded-lg transition-colors flex items-center gap-2 disabled:opacity-50"
                >
                  {aiAnalysis?.loading ? <Loader2 size={12} className="animate-spin" /> : null}
                  {aiAnalysis?.loading ? "Processing..." : "Run Diagnostics"}
                </button>
              )}
            </div>
            
            <div className="bg-slate-800/50 dark:bg-slate-900/50 border border-slate-700/50 rounded-lg p-4 min-h-[80px] text-sm md:text-base leading-relaxed text-slate-200 relative z-10 font-mono">
              {aiAnalysis ? (
                 aiAnalysis.loading ? (
                   <div className="flex items-center gap-3 text-indigo-300">
                     <Loader2 className="animate-spin text-xl" />
                     <span>Analyzing historical trends & current telemetry...</span>
                   </div>
                 ) : (
                   <div className="animate-fade-in whitespace-pre-wrap">
                     {aiAnalysis.text}
                   </div>
                 )
              ) : (
                <p className="text-slate-400 italic">
                  {statusState !== 'NORMAL'
                    ? `System Anomaly (${statusState}). Run AI Diagnostics for predictive failure analysis and maintenance recommendations.`
                    : "System Status Nominal. AI predictive diagnostics available on demand."}
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Right Column (1 Span) */}
        <div className="space-y-6">

          {/* 3D Digital Twin Viewer */}
          <div className="bg-white dark:bg-slate-900 p-0 rounded-xl shadow-sm border border-slate-200 dark:border-slate-800 overflow-hidden h-64">
             <Motor3DViewer data={safeData} type={config.type} isDarkMode={isDarkMode} />
          </div>

          {/* Derived Motor Specifications Card - ONLY VISIBLE FOR THREE PHASE */}
          {config.type === 'THREE_PHASE' && (
            <div className="bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-800 dark:to-slate-900 p-5 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700">
              <h3 className="text-sm font-bold text-slate-700 dark:text-slate-300 mb-4 flex items-center gap-2 uppercase tracking-wide">
                <Settings2 size={16} /> Motor Parameters
              </h3>
              
              <div className="space-y-3">
                <div className="flex justify-between items-center text-sm border-b border-slate-200 dark:border-slate-700 pb-2">
                  <span className="text-slate-500 dark:text-slate-400">Topology</span>
                  <span className="font-semibold text-slate-700 dark:text-white">Squirrel Cage</span>
                </div>
                <div className="flex justify-between items-center text-sm border-b border-slate-200 dark:border-slate-700 pb-2">
                  <span className="text-slate-500 dark:text-slate-400">Construction</span>
                  <span className="font-semibold text-slate-700 dark:text-white">{POLES} Poles / {FREQUENCY} Hz</span>
                </div>
                <div className="flex justify-between items-center text-sm border-b border-slate-200 dark:border-slate-700 pb-2">
                  <span className="text-slate-500 dark:text-slate-400">Sync Speed</span>
                  <span className="font-semibold text-slate-700 dark:text-white">{SYNC_SPEED} RPM</span>
                </div>
                <div className="flex justify-between items-center text-sm pt-1">
                  <span className="text-slate-500 dark:text-slate-400">Real-time Slip</span>
                  <div className="flex items-center gap-2">
                    <span className={`font-mono font-bold ${slip > 10 ? 'text-red-500' : 'text-emerald-500'}`}>
                      {slip.toFixed(2)}%
                    </span>
                  </div>
                </div>
              </div>
            </div>
          )}
          
          {/* Billing Card */}
          <div className="bg-white dark:bg-slate-900 p-6 rounded-xl shadow-sm border border-slate-200 dark:border-slate-800 relative overflow-hidden transition-colors">
            <div className="absolute top-0 right-0 p-4 opacity-5 dark:opacity-[0.02]">
              <IndianRupee size={100} />
            </div>
            
            <div className="flex items-center justify-between mb-6">
               <h3 className="text-lg font-bold text-slate-800 dark:text-white flex items-center gap-2">
                <IndianRupee size={20} className="text-emerald-600 dark:text-emerald-500" /> Cost Estimation
               </h3>
               <button 
                onClick={() => setBilling(0)}
                title="Reset Session Billing"
                className="p-1.5 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition-colors"
               >
                 <RotateCcw size={16} />
               </button>
            </div>
            
            <div className="space-y-6">
               <div>
                 <p className="text-slate-500 dark:text-slate-400 text-xs font-bold uppercase">Accrued Cost (Session)</p>
                 <div className="flex items-baseline mt-1">
                   <span className="text-3xl font-bold text-slate-900 dark:text-white">₹{billing.toFixed(2)}</span>
                   <span className="ml-2 text-xs text-slate-400 dark:text-slate-500">INR</span>
                 </div>
               </div>
               
               <div className="grid grid-cols-2 gap-4 pt-4 border-t border-slate-100 dark:border-slate-800">
                 <div>
                    <span className="text-slate-400 dark:text-slate-500 text-[10px] uppercase font-bold block mb-1">Instant Power</span>
                    <span className="font-medium text-slate-700 dark:text-slate-300">
                      {instantaneousPowerKW.toFixed(2)} kW
                    </span>
                 </div>
                 <div>
                    <span className="text-slate-400 dark:text-slate-500 text-[10px] uppercase font-bold block mb-1">Tariff Rate</span>
                    <span className="font-medium text-slate-700 dark:text-slate-300">₹{tariffRate.toFixed(2)}/kWh</span>
                 </div>
               </div>
            </div>
          </div>

          {/* Simple Log Table */}
          <div className="bg-white dark:bg-slate-900 p-5 rounded-xl shadow-sm border border-slate-200 dark:border-slate-800 h-80 flex flex-col transition-colors">
            <h3 className="text-lg font-bold text-slate-800 dark:text-white mb-3 flex items-center gap-2">
              <Info size={18} className="text-slate-400 dark:text-slate-500" /> Event Logs
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mb-2 font-medium">Device: {config.name}</p>
            <div className="overflow-y-auto flex-1 custom-scrollbar pr-1">
              <table className="w-full text-xs text-left">
                <thead className="text-slate-400 dark:text-slate-500 font-semibold sticky top-0 bg-white dark:bg-slate-900">
                  <tr>
                    <th className="pb-3 pl-1">Timestamp</th>
                    <th className="pb-3">Status</th>
                    <th className="pb-3 text-right pr-1">Vibration</th>
                  </tr>
                </thead>
                <tbody className="text-slate-600 dark:text-slate-400">
                  {[...dataHistory].reverse().map((d, i) => (
                    <tr key={d.timestamp} className={`border-b border-slate-50 dark:border-slate-800 ${i % 2 === 0 ? 'bg-slate-50/50 dark:bg-slate-800/30' : ''}`}>
                      <td className="py-2.5 pl-1 text-slate-500 dark:text-slate-500 font-mono">
                        {new Date(d.timestamp).toLocaleTimeString([], { hour12: true, hour: '2-digit', minute:'2-digit', second:'2-digit' })}
                      </td>
                      <td className="py-2.5">
                        {d.output === 1 ? (
                          <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400">
                            FAULT
                          </span>
                        ) : (d.current > config.maxCurrent) ? (
                          <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400">
                            OVERLOAD
                          </span>
                        ) : (d.vib > 1.6 || d.vib < 1.0) ? (
                          <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400">
                            WARN
                          </span>
                        ) : (
                          <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400">
                            OK
                          </span>
                        )}
                      </td>
                      <td className="py-2.5 text-right pr-1 font-mono">{d.vib.toFixed(2)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
};
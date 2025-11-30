import React from 'react';
import { SensorData, MotorType } from '../types';

interface Motor3DProps {
  data: SensorData;
  type: MotorType;
  isDarkMode: boolean;
}

export const Motor3DViewer: React.FC<Motor3DProps> = ({ data, type, isDarkMode }) => {
  // Logic for visual parameters
  const isRunning = data.speed > 0;
  // Visual speed: Scale rotation duration inversely to speed
  // 1500 RPM ~ 0.2s duration for visual effect
  const animationDuration = isRunning ? `${Math.max(0.1, 250 / (data.speed || 1))}s` : '0s';
  
  // Color based on temperature thresholds
  const getTempColor = (t: number) => {
    if (t < 45) return '#10b981'; // Emerald (Normal)
    if (t < 50) return '#f59e0b'; // Amber (Warning)
    return '#ef4444'; // Red (Critical)
  };
  
  const statusColor = getTempColor(data.temp);

  // Vibration intensity for visual shake effect
  const shakeIntensity = Math.max(0, (data.vib - 1.0) * 3); // 1.0 is baseline
  const isShaking = shakeIntensity > 0.3;

  return (
    <div className="relative w-full h-full min-h-[250px] flex items-center justify-center bg-slate-50/50 dark:bg-slate-900/50 rounded-xl overflow-hidden border border-slate-100 dark:border-slate-800">
      <style>
        {`
          @keyframes spin { 
            100% { transform: rotate(360deg); } 
          }
          @keyframes shake {
            0% { transform: translate(1px, 1px) rotate(0deg); }
            10% { transform: translate(-1px, -2px) rotate(-1deg); }
            20% { transform: translate(-3px, 0px) rotate(1deg); }
            30% { transform: translate(3px, 2px) rotate(0deg); }
            40% { transform: translate(1px, -1px) rotate(1deg); }
            50% { transform: translate(-1px, 2px) rotate(-1deg); }
            60% { transform: translate(-3px, 1px) rotate(0deg); }
            70% { transform: translate(3px, 1px) rotate(-1deg); }
            80% { transform: translate(-1px, -1px) rotate(1deg); }
            90% { transform: translate(1px, 2px) rotate(0deg); }
            100% { transform: translate(1px, -2px) rotate(-1deg); }
          }
        `}
      </style>
      
      {/* Background Grid */}
      <div className="absolute inset-0 opacity-10 dark:opacity-5 pointer-events-none" 
           style={{ backgroundImage: 'radial-gradient(circle, #64748b 1px, transparent 1px)', backgroundSize: '20px 20px' }}>
      </div>

      {/* SVG Motor Digital Twin */}
      <svg 
        viewBox="0 0 200 200" 
        className="w-56 h-56 drop-shadow-2xl transition-all duration-300 z-10"
        style={{
          animation: isShaking ? `shake ${0.5 / shakeIntensity}s infinite` : 'none',
          filter: isShaking ? 'blur(0.5px)' : 'none'
        }}
      >
        <defs>
          <linearGradient id="housingGrad" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor={isDarkMode ? "#1e293b" : "#94a3b8"} />
            <stop offset="50%" stopColor={isDarkMode ? "#475569" : "#cbd5e1"} />
            <stop offset="100%" stopColor={isDarkMode ? "#1e293b" : "#94a3b8"} />
          </linearGradient>
          <linearGradient id="shaftGrad" x1="0%" y1="0%" x2="0%" y2="100%">
             <stop offset="0%" stopColor="#94a3b8" />
             <stop offset="50%" stopColor="#e2e8f0" />
             <stop offset="100%" stopColor="#94a3b8" />
          </linearGradient>
        </defs>

        {/* Mounting Base */}
        <path d="M30 170 L170 170 L180 190 L20 190 Z" fill={isDarkMode ? "#0f172a" : "#64748b"} />
        
        {/* Main Housing (Stator) */}
        <path d="M40 50 H160 V160 H40 Z" fill="url(#housingGrad)" stroke={isDarkMode ? "#334155" : "#64748b"} strokeWidth="2" rx="10" />
        
        {/* Cooling Fins */}
        {[60, 75, 90, 105, 120, 135, 150].map((y, i) => (
           <line key={y} x1="40" y1={y} x2="160" y2={y} stroke={isDarkMode ? "#1e293b" : "#64748b"} strokeWidth="1.5" strokeOpacity="0.5" />
        ))}
        
        {/* Terminal Box */}
        <rect x="130" y="40" width="40" height="50" rx="4" fill={isDarkMode ? "#334155" : "#475569"} stroke={isDarkMode ? "#475569" : "#334155"} strokeWidth="1" />
        <circle cx="150" cy="65" r="4" fill={statusColor} className={data.output === 1 ? "animate-ping" : ""} />

        {/* Front End Shield */}
        <circle cx="100" cy="105" r="45" fill={isDarkMode ? "#334155" : "#e2e8f0"} stroke="#64748b" strokeWidth="2" />
        
        {/* Status Glow Ring */}
        <circle cx="100" cy="105" r="40" fill="transparent" stroke={statusColor} strokeWidth="2" strokeOpacity="0.8" strokeDasharray="4 2" />

        {/* Rotating Shaft Assembly */}
        <g 
           style={{ 
             transformOrigin: '100px 105px',
             animation: isRunning ? `spin ${animationDuration} linear infinite` : 'none'
           }}
        >
          {/* Main Shaft */}
          <circle cx="100" cy="105" r="15" fill="url(#shaftGrad)" stroke="#64748b" />
          
          {/* Inner Keyway/Fan Visualization */}
          <path d="M100 90 L104 105 L100 120 L96 105 Z" fill="#475569" />
          <path d="M85 105 L100 101 L115 105 L100 109 Z" fill="#475569" />
          
          {/* Bolt Heads */}
          <circle cx="100" cy="105" r="3" fill="#334155" />
          <circle cx="100" cy="95" r="1.5" fill="#64748b" />
          <circle cx="100" cy="115" r="1.5" fill="#64748b" />
          <circle cx="110" cy="105" r="1.5" fill="#64748b" />
          <circle cx="90" cy="105" r="1.5" fill="#64748b" />
        </g>
      </svg>
      
      {/* Live HUD Overlay */}
      <div className="absolute top-3 left-3 flex flex-col gap-1">
         <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Digital Twin</span>
         <span className={`text-xs font-mono font-bold ${isRunning ? 'text-green-500' : 'text-slate-500'}`}>
            {isRunning ? 'RUNNING' : 'STOPPED'}
         </span>
      </div>

      <div className="absolute bottom-3 right-3 text-right">
         <div className="text-[10px] font-mono text-slate-500 dark:text-slate-400">
           {type === 'THREE_PHASE' ? '3-PHASE INDUCTION' : '1-PHASE AC'}
         </div>
      </div>
    </div>
  );
};
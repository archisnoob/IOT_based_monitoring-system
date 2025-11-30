import React, { useState, useEffect } from 'react';
import { Settings, Zap, Moon, Sun, RotateCcw } from 'lucide-react';
import { MotorDashboard } from './components/MotorDashboard';
import { SettingsModal } from './components/SettingsModal';
import { SINGLE_PHASE_CONFIG, THREE_PHASE_CONFIG } from './constants';
import { MotorType } from './types';

const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState<MotorType>('THREE_PHASE');
  const [isDarkMode, setIsDarkMode] = useState<boolean>(false);
  
  // Operational Settings State
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [tariffRate, setTariffRate] = useState<number>(8.50);
  
  // Dashboard Refresh State
  const [refreshKey, setRefreshKey] = useState<number>(0);

  // Initialize theme based on preference or system
  useEffect(() => {
    if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
      setIsDarkMode(true);
    }
  }, []);

  // Apply theme class to document
  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [isDarkMode]);

  const toggleTheme = () => setIsDarkMode(!isDarkMode);

  const handleSystemRefresh = () => {
    if (window.confirm("System Reset: Clear all data logs, charts, and billing history?")) {
      setRefreshKey(prev => prev + 1);
    }
  };

  return (
    <div className="min-h-screen pb-10 font-sans transition-colors duration-300 bg-slate-50 text-slate-800 dark:bg-slate-950 dark:text-slate-100 flex flex-col">
      
      {/* Settings Modal */}
      <SettingsModal 
        isOpen={isSettingsOpen} 
        onClose={() => setIsSettingsOpen(false)}
        tariffRate={tariffRate}
        onSave={(newRate) => setTariffRate(newRate)}
      />

      {/* Professional Navigation Header */}
      <nav className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-md border-b border-slate-200 dark:border-slate-800 sticky top-0 z-50 shadow-sm transition-colors duration-300">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center gap-3">
              <div className="bg-gradient-to-br from-blue-600 to-indigo-700 text-white p-2 rounded-lg shadow-md shadow-blue-500/20">
                <Zap size={24} fill="currentColor" />
              </div>
              <div className="flex flex-col">
                <h1 className="text-xl font-bold tracking-tight text-slate-900 dark:text-white leading-none">ElectroGuard</h1>
                <span className="text-[10px] uppercase tracking-wider text-slate-500 dark:text-slate-400 font-bold mt-1">Smart Monitor & Billing</span>
              </div>
            </div>
            
            <div className="flex items-center gap-3">
              
              {/* Theme Toggle */}
              <button 
                onClick={toggleTheme}
                className="p-2 rounded-full text-slate-500 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800 transition-colors"
                title={isDarkMode ? "Switch to Light Mode" : "Switch to Dark Mode"}
              >
                {isDarkMode ? <Sun size={20} /> : <Moon size={20} />}
              </button>

              {/* System Refresh Button */}
              <button 
                onClick={handleSystemRefresh}
                className="h-9 w-9 bg-slate-100 dark:bg-slate-800 rounded-full flex items-center justify-center border border-slate-200 dark:border-slate-700 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors group"
                title="Reset System Simulation"
              >
                <RotateCcw size={18} className="text-slate-500 dark:text-slate-400 group-hover:-rotate-180 transition-transform duration-500" />
              </button>

              {/* Settings Button */}
              <button 
                onClick={() => setIsSettingsOpen(true)}
                className="h-9 w-9 bg-slate-100 dark:bg-slate-800 rounded-full flex items-center justify-center border border-slate-200 dark:border-slate-700 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
                title="Open Settings"
              >
                <Settings size={18} className="text-slate-500 dark:text-slate-400" />
              </button>
            </div>
          </div>
        </div>
      </nav>

      <main className="flex-grow max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-8 w-full">
        
        {/* Header Section */}
        <div className="mb-8 flex flex-col md:flex-row md:items-end justify-between gap-4">
          <div>
            <h2 className="text-2xl font-bold text-slate-900 dark:text-white">Dashboard Overview</h2>
            <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">Real-time condition monitoring and energy consumption analysis.</p>
          </div>
          
          {/* User Friendly Tab Selection */}
          <div className="bg-white dark:bg-slate-900 p-1 rounded-xl shadow-sm border border-slate-200 dark:border-slate-800 inline-flex">
            <button
              onClick={() => setActiveTab('SINGLE_PHASE')}
              className={`
                px-5 py-2.5 rounded-lg text-sm font-semibold transition-all duration-200 flex flex-col items-center sm:block
                ${activeTab === 'SINGLE_PHASE' 
                  ? 'bg-blue-600 text-white shadow-md' 
                  : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800'}
              `}
            >
              <span>Single-Phase</span>
              <span className={`text-[10px] font-normal block sm:inline sm:ml-2 ${activeTab === 'SINGLE_PHASE' ? 'text-blue-100' : 'text-slate-400 dark:text-slate-500'}`}>
                (Domestic)
              </span>
            </button>
            <button
              onClick={() => setActiveTab('THREE_PHASE')}
              className={`
                px-5 py-2.5 rounded-lg text-sm font-semibold transition-all duration-200 flex flex-col items-center sm:block
                ${activeTab === 'THREE_PHASE' 
                  ? 'bg-blue-600 text-white shadow-md' 
                  : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800'}
              `}
            >
              <span>Three-Phase</span>
              <span className={`text-[10px] font-normal block sm:inline sm:ml-2 ${activeTab === 'THREE_PHASE' ? 'text-blue-100' : 'text-slate-400 dark:text-slate-500'}`}>
                (Industrial)
              </span>
            </button>
          </div>
        </div>

        {/* Content Render - Key prop forces remount on refresh */}
        <div className="transition-opacity duration-300 ease-in-out">
          {activeTab === 'SINGLE_PHASE' ? (
            <MotorDashboard key={`single-${refreshKey}`} config={SINGLE_PHASE_CONFIG} isDarkMode={isDarkMode} tariffRate={tariffRate} />
          ) : (
            <MotorDashboard key={`three-${refreshKey}`} config={THREE_PHASE_CONFIG} isDarkMode={isDarkMode} tariffRate={tariffRate} />
          )}
        </div>

      </main>

      {/* Footer */}
      <footer className="mt-12 py-10 bg-white dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800 transition-colors duration-300">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center text-xs text-slate-400 dark:text-slate-500">
            &copy; 2025 IoT Based Monitoring and Billing System.
          </div>
        </div>
      </footer>
    </div>
  );
};

export default App;
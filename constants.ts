import { MotorConfig, SensorData, MotorType } from "./types";

export const SINGLE_PHASE_CONFIG: MotorConfig = {
  id: 'm1',
  name: '1-Phase Induction Motor',
  type: 'SINGLE_PHASE',
  nominalVoltage: 230,
  maxCurrent: 15,
};

export const THREE_PHASE_CONFIG: MotorConfig = {
  id: 'm3',
  name: '3-Phase Squirrel Cage Induction Motor',
  type: 'THREE_PHASE',
  nominalVoltage: 230, 
  maxCurrent: 10,
};

// EXACT DATASET FROM USER
const RAW_USER_DATASET = [
  // Normal Operation
  { temp: 26.4, vib: 1.12, speed: 0, current: 4.5, voltage: 230, output: 0 },
  { temp: 29.0, vib: 1.41, speed: 1430, current: 4.5, voltage: 230, output: 0 },
  { temp: 29.5, vib: 1.32, speed: 1423, current: 4.5, voltage: 230, output: 0 },
  { temp: 28.2, vib: 1.38, speed: 1400, current: 4.5, voltage: 230, output: 0 },
  { temp: 28.9, vib: 1.40, speed: 1420, current: 4.5, voltage: 230, output: 0 },
  { temp: 30.0, vib: 1.26, speed: 1390, current: 4.5, voltage: 230, output: 0 },
  { temp: 31.0, vib: 1.32, speed: 1430, current: 4.5, voltage: 230, output: 0 },
  { temp: 32.3, vib: 1.29, speed: 1440, current: 4.5, voltage: 230, output: 0 },
  
  // Minor Heating / Vibration Anomalies
  { temp: 35.1, vib: 1.03, speed: 1390, current: 4.5, voltage: 230, output: 1 },
  { temp: 35.6, vib: 1.04, speed: 1390, current: 4.5, voltage: 230, output: 1 },
  { temp: 34.7, vib: 0.82, speed: 1360, current: 4.5, voltage: 230, output: 1 },
  { temp: 36.3, vib: 0.97, speed: 1380, current: 4.5, voltage: 230, output: 1 },
  
  // Return to Normal
  { temp: 29.1, vib: 1.45, speed: 1420, current: 4.5, voltage: 230, output: 0 },
  { temp: 29.3, vib: 1.32, speed: 1430, current: 4.5, voltage: 230, output: 0 },
  { temp: 29.4, vib: 1.23, speed: 1450, current: 4.5, voltage: 230, output: 0 },
  
  // High Load / Stall Scenario (Speed drops, Current spikes)
  { temp: 31.0, vib: 1.12, speed: 500, current: 21, voltage: 220, output: 0 },
  { temp: 33.1, vib: 1.20, speed: 500, current: 21, voltage: 220, output: 0 },
  { temp: 35.0, vib: 1.24, speed: 500, current: 21, voltage: 220, output: 0 },
  { temp: 34.3, vib: 1.18, speed: 500, current: 21, voltage: 220, output: 0 },
  { temp: 36.2, vib: 1.25, speed: 500, current: 21, voltage: 220, output: 0 },
  // Temp rises significantly, Output triggers to 1 (Fault)
  { temp: 51.1, vib: 1.28, speed: 500, current: 21, voltage: 220, output: 1 },
  { temp: 51.2, vib: 1.29, speed: 500, current: 21, voltage: 220, output: 1 },
  { temp: 45.3, vib: 1.08, speed: 500, current: 21, voltage: 220, output: 1 },
  { temp: 45.4, vib: 1.06, speed: 500, current: 21, voltage: 220, output: 1 },
  { temp: 43.1, vib: 1.35, speed: 500, current: 21, voltage: 220, output: 1 },
  { temp: 46.2, vib: 1.39, speed: 500, current: 21, voltage: 220, output: 1 },
  { temp: 51.2, vib: 1.34, speed: 500, current: 21, voltage: 220, output: 1 },
  { temp: 56.3, vib: 1.89, speed: 500, current: 21, voltage: 220, output: 1 },
  { temp: 41.1, vib: 0.84, speed: 500, current: 21, voltage: 220, output: 1 },
];

// USER REQUEST: Assign raw provided dataset to THREE PHASE MOTOR
export const THREE_PHASE_DATASET = RAW_USER_DATASET;

// Simulated 1-Phase dataset (Using similar values but treating them as single phase context)
export const SINGLE_PHASE_DATASET = RAW_USER_DATASET.map(d => ({
  ...d,
  // Single phase might draw more current for same work, but keeping simple for simulation
  current: d.current, 
  voltage: d.voltage,
  speed: d.speed,
  vib: d.vib,
  temp: d.temp,
  output: d.output
}));

// Helper to get next data point from the dataset based on Motor Type
export const getNextSampleData = (currentIndex: number, type: MotorType): SensorData => {
  const dataset = type === 'SINGLE_PHASE' ? SINGLE_PHASE_DATASET : THREE_PHASE_DATASET;
  
  // Cycle through the dataset
  const dataIndex = currentIndex % dataset.length;
  const rawPoint = dataset[dataIndex];
  
  // Map to SensorData type with current timestamp
  return {
    timestamp: Date.now(),
    temp: rawPoint.temp,
    vib: rawPoint.vib,
    speed: rawPoint.speed,
    current: rawPoint.current,
    voltage: rawPoint.voltage,
    output: rawPoint.output as 0 | 1
  };
};

export const generateSimulatedData = (config: MotorConfig): SensorData => {
  return getNextSampleData(0, config.type); 
};
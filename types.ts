export type MotorType = 'SINGLE_PHASE' | 'THREE_PHASE';

export interface SensorData {
  timestamp: number;
  temp: number;      // Temperature in Celsius
  vib: number;       // Vibration in mm/s
  speed: number;     // RPM
  current: number;   // Amperes
  voltage: number;   // Volts
  output: 0 | 1;     // 0 = Normal, 1 = Fault/Anomaly
}

export interface MotorConfig {
  id: string;
  name: string;
  type: MotorType;
  nominalVoltage: number;
  maxCurrent: number;
}

export interface AIAnalysisResult {
  status: 'loading' | 'success' | 'error' | 'idle';
  markdown: string;
}
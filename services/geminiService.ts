import { GoogleGenAI } from "@google/genai";
import { SensorData, MotorConfig } from "../types";

export const analyzeMotorHealth = async (currentData: SensorData, history: SensorData[], config: MotorConfig): Promise<string> => {
  try {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    
    // Derived Metrics & Context strictly for THREE_PHASE Induction Motor
    let technicalContext = "";
    
    if (config.type === 'THREE_PHASE') {
        const SYNC_SPEED = 1500; // 50Hz 4-Pole
        const slip = currentData.speed > 0 ? ((SYNC_SPEED - currentData.speed) / SYNC_SPEED) * 100 : 100;
        
        technicalContext = `
      - Construction: 4-Pole, 50Hz (Sync Speed: ${SYNC_SPEED} RPM)
      - Calculated Slip: ${slip.toFixed(2)}% (Normal Full Load ~3-5%)
      - Topology: Squirrel Cage Induction Motor
      - Analysis Instruction: Use calculated SLIP to assess rotor bar health and load conditions.
        `;
    } else {
        technicalContext = `
      - Application: Standard Single Phase Motor
      - Analysis Instruction: Focus on general electrical and mechanical anomalies.
        `;
    }

    // Format historical trend for the AI
    const historyString = history.slice(-10).map((h, i) => 
      `T-${10-i}: Temp=${h.temp}°C, Vib=${h.vib}mm/s, Cur=${h.current}A`
    ).join('\n');

    // Professional Engineering Prompt with Predictive capabilities
    const prompt = `
      You are an expert AI diagnostics system for electrical motors.
      
      System Configuration:
      - Motor Type: ${config.name}
      - Nominal Voltage: ${config.nominalVoltage}V
      - Max Rated Current: ${config.maxCurrent}A
      ${technicalContext}
      
      Safety Thresholds for Analysis:
      - Temperature: Normal < 45°C | Warning 45-50°C | Critical > 50°C
      - Vibration: Normal 1.0 - 1.6 mm/s | Warning > 1.6 mm/s
      - Current: Critical if > ${config.maxCurrent}A
      
      Historical Trend (Last 10 samples):
      ${historyString}
      
      Current Real-time Telemetry:
      - Voltage: ${currentData.voltage} V
      - Current: ${currentData.current} A
      - Speed: ${currentData.speed} RPM
      - Vibration: ${currentData.vib} mm/s
      - Temperature: ${currentData.temp} °C
      - System Flag: ${currentData.output === 1 ? 'FAULT TRIGGERED' : 'NORMAL'}
      
      Task:
      Analyze the provided telemetry data and historical trends to generate a predictive condition monitoring report.
      
      Required Output Format (Markdown):
      # Severity: [LOW / MEDIUM / HIGH]
      
      ### Critical Parameters
      [List the specific metrics driving this severity level, e.g., "Rising Temperature (+2°C in 5 samples)", "Sudden Vibration Spike".]
      
      ### Predictive Analysis
      [Forecast potential failures based on the *trend* in the history data. E.g., "If current vibration accumulation continues, bearing failure is likely within 48 hours."]
      
      ### Recommendation
      [One actionable maintenance step or safety protocol.]
      
      Tone: Professional, objective, and concise.
    `;

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
    });

    return response.text || "Analysis complete. System parameters are within nominal ranges.";
  } catch (error) {
    console.error("Gemini API Error:", error);
    return "System Error: AI Diagnostic Service is currently unavailable. Please check network connectivity.";
  }
};